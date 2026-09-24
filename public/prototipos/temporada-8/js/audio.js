// Efectos y música generados con Web Audio API (sin archivos).
// Mezcla: GainNode maestro (encendido/apagado con fade) → bus de música (0.25) y bus de efectos (0.7).
// Todo es opcional: si Web Audio no existe o falla, las funciones no hacen nada.
// No se intenta saltar el modo silencio del teléfono (sin audioSession ni elementos <audio>).

const MUSIC_LEVEL = 0.25;
const SFX_LEVEL = 0.7;
const FADE = { toggle: 0.3, musicIn: 1.5, duck: 0.5, back: 1.0 };

let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let noiseBuf = null;
let enabled = false;
let musicWanted = false;
let musicTimer = null;
let musicStep = 0;
let musicNext = 0;
let wind = null;
let broken = false; // Web Audio no disponible o falló
let bgSuspended = false; // pausado por pestaña oculta / cambio de app
let stopTimer = 0;
const brokenListeners = new Set();

function markBroken() {
  if (broken) return;
  broken = true;
  enabled = false;
  brokenListeners.forEach((fn) => { try { fn(); } catch { /* nada */ } });
}

function ensure() {
  if (ctx) return ctx;
  if (broken) return null;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { markBroken(); return null; }
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_LEVEL;
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);
    const len = ctx.sampleRate * 1.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  } catch {
    ctx = null;
    markBroken();
  }
  return ctx;
}

/** Rampa lineal desde el valor actual (sin cortes secos). */
function ramp(param, value, secs) {
  try {
    const t = ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(value, t + secs);
  } catch { /* nada */ }
}

function resumeCtx() {
  try {
    const p = ctx.resume();
    if (p && p.catch) p.catch(() => {});
  } catch { /* nada */ }
}

function safe(fn) {
  return (...args) => {
    if (!enabled || !ctx || bgSuspended) return;
    try {
      if (ctx.state === "suspended") resumeCtx();
      fn(...args);
    } catch { /* silencio */ }
  };
}

function tone({ freq = 440, to = null, type = "sine", start = 0, dur = 0.12, vol = 0.4, attack = 0.005, bus = sfxBus }) {
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise({ start = 0, dur = 0.3, vol = 0.3, type = "bandpass", f0 = 800, f1 = null, q = 1 }) {
  const t = ctx.currentTime + start;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.Q.value = q;
  filt.frequency.setValueAtTime(f0, t);
  if (f1) filt.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.08, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filt).connect(g).connect(sfxBus);
  src.start(t);
  src.stop(t + dur + 0.05);
}

const N = (semi) => 440 * Math.pow(2, (semi - 9) / 12); // semitonos desde C4 → Hz aprox.

/* ---------- Música del lobby: secuencia simple, alegre y a volumen bajo ---------- */
const MELODY = [12, null, 16, 19, 21, null, 19, 16, 14, null, 16, 12, 9, null, 11, 12,
  12, null, 16, 19, 24, null, 21, 19, 17, null, 16, 14, 12, null, null, null];
const BASS = [0, 0, 0, 0, -3, -3, -3, -3, -7, -7, -7, -7, -5, -5, -5, -5];
const STEP = 0.2; // segundos por paso (≈ 150 bpm en corcheas)

function scheduleMusic() {
  if (!ctx || !musicWanted || !enabled) return;
  while (musicNext < ctx.currentTime + 0.35) {
    const i = musicStep % MELODY.length;
    const start = musicNext - ctx.currentTime;
    const m = MELODY[i];
    if (m != null) tone({ freq: N(m), type: "triangle", start, dur: 0.18, vol: 0.5, bus: musicBus });
    if (i % 2 === 0) tone({ freq: N(BASS[(i / 2) % BASS.length] - 12), type: "sine", start, dur: 0.34, vol: 0.55, bus: musicBus });
    if (i % 4 === 2) {
      const t = musicNext;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 6000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.connect(f).connect(g).connect(musicBus); src.start(t); src.stop(t + 0.06);
    }
    musicNext += STEP;
    musicStep++;
  }
}

function startMusicLoop() {
  if (!ctx || musicTimer) return;
  musicNext = ctx.currentTime + 0.1;
  musicTimer = setInterval(scheduleMusic, 90);
  scheduleMusic();
}
function stopMusicLoop() {
  clearInterval(musicTimer);
  musicTimer = null;
}

/** Arranca (o recupera) la música con fade hasta MUSIC_LEVEL. */
function musicUp(secs) {
  clearTimeout(stopTimer);
  if (!musicTimer) {
    try { musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setValueAtTime(0, ctx.currentTime); } catch { /* nada */ }
    startMusicLoop();
  }
  ramp(musicBus.gain, MUSIC_LEVEL, secs);
}
/** Baja la música a 0 con fade y detiene el secuenciador al terminar. */
function musicDown(secs) {
  if (!ctx) return;
  ramp(musicBus.gain, 0, secs);
  clearTimeout(stopTimer);
  stopTimer = setTimeout(() => { if (!musicWanted || !enabled) stopMusicLoop(); }, secs * 1000 + 60);
}

export const audio = {
  /** ¿Hay Web Audio disponible y funcionando? */
  supported() {
    if (broken) return false;
    return !!(window.AudioContext || window.webkitAudioContext);
  },
  onUnavailable(fn) { brokenListeners.add(fn); if (broken) fn(); },
  /**
   * Desbloquea el audio. Debe llamarse DENTRO del handler de un gesto (pointerdown/click/keydown):
   * crea el AudioContext si hace falta y llama a resume().
   */
  unlock() {
    if (!ensure()) return false;
    bgSuspended = false;
    resumeCtx();
    return true;
  },
  isUnlocked: () => !!ctx && ctx.state === "running",
  /** Enciende/apaga con fade de 0.3 s (nunca corte seco). */
  setEnabled(on) {
    if (on) {
      if (!ensure()) { enabled = false; return false; }
      enabled = true;
      resumeCtx();
      ramp(master.gain, 1, FADE.toggle);
      if (musicWanted) musicUp(musicTimer ? FADE.toggle : FADE.musicIn);
    } else {
      enabled = false;
      if (ctx) {
        ramp(master.gain, 0, FADE.toggle);
        clearTimeout(stopTimer);
        stopTimer = setTimeout(() => { if (!enabled) { stopMusicLoop(); audio.windStop(); } }, FADE.toggle * 1000 + 60);
      }
    }
    return enabled;
  },
  isEnabled: () => enabled,
  /** Música del lobby: on → fade-in (1.5 s al empezar, 1 s al volver del salto); off → fade a 0 en 0.5 s. */
  music(on) {
    const was = musicWanted;
    musicWanted = !!on;
    if (!ctx || !enabled) return;
    if (musicWanted) musicUp(musicTimer ? FADE.back : FADE.musicIn);
    else if (was) musicDown(FADE.duck);
  },
  /** Pestaña oculta / cambio de app / pantalla bloqueada: pausa todo. */
  suspend() {
    bgSuspended = true;
    stopMusicLoop();
    try { ctx?.suspend(); } catch { /* nada */ }
  },
  /** Al volver: reanuda sólo si el sonido está activado. */
  resume() {
    bgSuspended = false;
    if (!enabled || !ctx) return;
    resumeCtx();
    if (musicWanted) startMusicLoop();
  },
  /** Sonido de inicio de partida (pantalla "TOCA PARA EMPEZAR"). */
  start: safe(() => {
    [[0, 0], [4, 0.07], [7, 0.14], [12, 0.21]].forEach(([s, t]) => tone({ freq: N(12 + s), type: "square", start: t, dur: 0.1, vol: 0.12 }));
    tone({ freq: N(19), type: "square", start: 0.32, dur: 0.12, vol: 0.12 });
    tone({ freq: N(24), type: "square", start: 0.42, dur: 0.45, vol: 0.13 });
    tone({ freq: N(12), type: "triangle", start: 0.42, dur: 0.5, vol: 0.24 });
    tone({ freq: N(16), type: "triangle", start: 0.42, dur: 0.5, vol: 0.18 });
    noise({ start: 0, dur: 0.3, vol: 0.12, f0: 500, f1: 3000, q: 0.8 });
  }),

  blip: safe(() => {
    tone({ freq: 660, to: 990, type: "square", dur: 0.07, vol: 0.12 });
  }),
  pop: safe((pitch = 1) => {
    tone({ freq: 380 * pitch, to: 880 * pitch, type: "sine", dur: 0.09, vol: 0.35 });
    tone({ freq: 1200 * pitch, type: "triangle", dur: 0.04, vol: 0.08 });
  }),
  xp: safe(() => {
    [0, 4, 7, 12].forEach((s, i) => tone({ freq: N(12 + s), type: "square", start: i * 0.055, dur: 0.1, vol: 0.12 }));
  }),
  whoosh: safe(() => noise({ dur: 0.35, vol: 0.25, f0: 400, f1: 2400, q: 0.8 })),
  fwoosh: safe(() => {
    noise({ dur: 0.55, vol: 0.45, f0: 2600, f1: 300, q: 0.7 });
    tone({ freq: 180, to: 90, type: "sine", dur: 0.3, vol: 0.3 });
  }),
  thud: safe(() => {
    tone({ freq: 140, to: 45, type: "sine", dur: 0.35, vol: 0.8 });
    noise({ dur: 0.3, vol: 0.35, type: "lowpass", f0: 900, f1: 120, q: 0.5 });
  }),
  fanfare: safe(() => {
    const seq = [[0, 0], [4, 0.1], [7, 0.2], [12, 0.3], [7, 0.45], [12, 0.55]];
    seq.forEach(([s, t]) => {
      tone({ freq: N(12 + s), type: "square", start: t, dur: 0.16, vol: 0.14 });
      tone({ freq: N(s), type: "triangle", start: t, dur: 0.2, vol: 0.2 });
    });
    tone({ freq: N(24), type: "square", start: 0.7, dur: 0.5, vol: 0.13 });
    tone({ freq: N(16), type: "triangle", start: 0.7, dur: 0.6, vol: 0.22 });
    tone({ freq: N(12), type: "triangle", start: 0.7, dur: 0.6, vol: 0.22 });
  }),
  /** Fanfarria corta (bonus de aterrizaje perfecto). */
  fanfareShort: safe(() => {
    [[0, 0], [4, 0.09], [7, 0.18]].forEach(([s, t]) => tone({ freq: N(12 + s), type: "square", start: t, dur: 0.12, vol: 0.13 }));
    tone({ freq: N(24), type: "square", start: 0.3, dur: 0.35, vol: 0.13 });
    tone({ freq: N(12), type: "triangle", start: 0.3, dur: 0.4, vol: 0.22 });
  }),
  windStart: safe(() => {
    if (wind) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 0.6; f.frequency.value = 500;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.7;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 250;
    lfo.connect(lfoGain).connect(f.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.6);
    src.connect(f).connect(g).connect(sfxBus);
    src.start(); lfo.start();
    wind = { src, lfo, g, f };
  }),
  windLevel(level) {
    if (!wind || !ctx) return;
    try {
      wind.g.gain.setTargetAtTime(Math.max(0.0001, 0.5 * level), ctx.currentTime, 0.2);
      wind.f.frequency.setTargetAtTime(300 + 500 * level, ctx.currentTime, 0.2);
    } catch { /* nada */ }
  },
  windStop() {
    if (!wind || !ctx) { wind = null; return; }
    try {
      const t = ctx.currentTime;
      wind.g.gain.setTargetAtTime(0.0001, t, 0.15);
      const w = wind;
      setTimeout(() => { try { w.src.stop(); w.lfo.stop(); } catch { /* nada */ } }, 600);
    } catch { /* nada */ }
    wind = null;
  }
};
