// Sonido generado con Web Audio (sin archivos). Maestro (fade al activar/desactivar) → música (0.25) y efectos (0.7).
// No se intenta saltar el modo silencio del iPhone. Si Web Audio no existe o falla, todo sigue sin sonido.

const MUSIC_LEVEL = 0.25, SFX_LEVEL = 0.7;
let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
let enabled = false, broken = false, bg = false;
let musicWanted = false, musicDucked = false, musicTimer = 0, musicStep = 0, musicNext = 0;
let water = null;
const brokenFns = new Set();

function markBroken() { if (broken) return; broken = true; enabled = false; brokenFns.forEach((f) => { try { f(); } catch { /* nada */ } }); }
function ensure() {
  if (ctx) return ctx;
  if (broken) return null;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { markBroken(); return null; }
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_LEVEL; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    const len = ctx.sampleRate * 1.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  } catch { ctx = null; markBroken(); }
  return ctx;
}
function ramp(param, v, secs) {
  try { const t = ctx.currentTime; param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(v, t + secs); } catch { /* nada */ }
}
function resumeCtx() { try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch { /* nada */ } }
function safe(fn) {
  return (...a) => {
    if (!enabled || !ctx || bg) return;
    try { if (ctx.state === "suspended") resumeCtx(); fn(...a); } catch { /* silencio */ }
  };
}
function tone({ f = 440, to = null, type = "sine", start = 0, dur = 0.15, vol = 0.3, attack = 0.005, bus = sfxBus }) {
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t); o.stop(t + dur + 0.05);
}
function noise({ start = 0, dur = 0.3, vol = 0.2, type = "bandpass", f0 = 800, f1 = null, q = 1 }) {
  const t = ctx.currentTime + start;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.06, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(g).connect(sfxBus); s.start(t); s.stop(t + dur + 0.05);
}
const N = (semi) => 261.63 * Math.pow(2, semi / 12); // semitonos desde Do4

/* ---------- Música: caja musical / marimba ---------- */
// Do mayor pentatónico, compás alegre; notas cortas con armónico (sonido de madera/metal suave)
const MEL = [12, 16, 19, 16, 21, 19, 16, 14, 12, 14, 16, 19, 16, 14, 12, null, 9, 12, 16, 12, 14, 16, 19, 21, 24, 21, 19, 16, 14, 16, 12, null];
const BAS = [0, 7, -5, 2, -3, 4, -5, 2];
const STEP = 0.23;
function mallet(f, start, vol) {
  tone({ f, type: "sine", start, dur: 0.5, vol, bus: musicBus });
  tone({ f: f * 4, type: "sine", start, dur: 0.12, vol: vol * 0.25, bus: musicBus });
}
function schedule() {
  if (!ctx || !musicWanted || !enabled) return;
  while (musicNext < ctx.currentTime + 0.4) {
    const i = musicStep % MEL.length;
    const st = musicNext - ctx.currentTime;
    if (MEL[i] != null) mallet(N(MEL[i]), st, 0.32);
    if (i % 4 === 0) mallet(N(BAS[(i / 4) % BAS.length] - 12), st, 0.26);
    musicNext += STEP; musicStep++;
  }
}
function startLoop() { if (!ctx || musicTimer) return; musicNext = ctx.currentTime + 0.1; musicTimer = setInterval(schedule, 100); schedule(); }
function stopLoop() { clearInterval(musicTimer); musicTimer = 0; }
function musicLevel() { return musicDucked ? 0.03 : MUSIC_LEVEL; }

export const audio = {
  supported: () => !broken && !!(window.AudioContext || window.webkitAudioContext),
  onUnavailable(fn) { brokenFns.add(fn); if (broken) fn(); },
  /** Llamar dentro de un gesto: crea/reanuda el AudioContext. */
  unlock() { if (!ensure()) return false; bg = false; resumeCtx(); return true; },
  isUnlocked: () => !!ctx && ctx.state === "running",
  setEnabled(on) {
    if (on) {
      if (!ensure()) { enabled = false; return false; }
      enabled = true; resumeCtx();
      ramp(master.gain, 1, 0.3);
      if (musicWanted) { startLoop(); ramp(musicBus.gain, musicLevel(), 1.5); }
    } else {
      enabled = false;
      if (ctx) { ramp(master.gain, 0, 0.3); setTimeout(() => { if (!enabled) { stopLoop(); audio.waterLevel(0); } }, 360); }
    }
    return enabled;
  },
  isEnabled: () => enabled,
  music(on) {
    musicWanted = !!on;
    if (!ctx || !enabled) return;
    if (on) { startLoop(); ramp(musicBus.gain, musicLevel(), 1.5); }
    else { ramp(musicBus.gain, 0, 0.6); setTimeout(() => { if (!musicWanted) stopLoop(); }, 700); }
  },
  /** Baja la música con fade durante la construcción y los fuegos, y la regresa después. */
  duck(on) { musicDucked = !!on; if (ctx && enabled && musicWanted) ramp(musicBus.gain, musicLevel(), on ? 0.6 : 1.2); },
  suspend() { bg = true; stopLoop(); try { ctx?.suspend(); } catch { /* nada */ } },
  resume() { bg = false; if (!enabled || !ctx) return; resumeCtx(); if (musicWanted) startLoop(); },

  start: safe(() => {
    [0, 4, 7, 12].forEach((s, i) => tone({ f: N(12 + s), type: "triangle", start: i * 0.08, dur: 0.25, vol: 0.2 }));
    tone({ f: N(24), type: "triangle", start: 0.34, dur: 0.6, vol: 0.2 });
  }),
  tap: safe(() => tone({ f: 740, to: 980, type: "triangle", dur: 0.07, vol: 0.12 })),
  /** "pop" de bloque; pitch sube con la construcción. */
  blockPop: safe((pitch = 1) => {
    tone({ f: 300 * pitch, to: 520 * pitch, type: "sine", dur: 0.08, vol: 0.18 });
    tone({ f: 900 * pitch, type: "triangle", dur: 0.03, vol: 0.05 });
  }),
  bigPop: safe(() => {
    tone({ f: 180, to: 560, type: "sine", dur: 0.16, vol: 0.5 });
    tone({ f: 90, to: 50, type: "sine", dur: 0.3, vol: 0.45 });
    noise({ dur: 0.25, vol: 0.2, type: "lowpass", f0: 1200, f1: 200 });
  }),
  /** Golpe grave: una construcción grande aterriza en la isla. */
  thud: safe((pitch = 1) => {
    tone({ f: 120 * pitch, to: 40 * pitch, type: "sine", dur: 0.45, vol: 0.6 });
    tone({ f: 240 * pitch, to: 320 * pitch, type: "triangle", dur: 0.07, vol: 0.12 });
    noise({ dur: 0.35, vol: 0.24, type: "lowpass", f0: 800, f1: 110 });
  }),
  fanfare: safe(() => {
    [[0, 0], [4, 0.12], [7, 0.24], [12, 0.36]].forEach(([s, t]) => { tone({ f: N(12 + s), type: "square", start: t, dur: 0.16, vol: 0.09 }); tone({ f: N(s), type: "triangle", start: t, dur: 0.2, vol: 0.18 }); });
    [12, 16, 19, 24].forEach((s) => tone({ f: N(s), type: "triangle", start: 0.52, dur: 0.9, vol: 0.14 }));
  }),
  whoosh: safe(() => noise({ dur: 0.6, vol: 0.12, f0: 300, f1: 1400, q: 0.6 })),
  chest: safe(() => {
    tone({ f: 160, to: 110, type: "square", dur: 0.12, vol: 0.08 });
    noise({ dur: 0.18, vol: 0.12, type: "lowpass", f0: 1500, f1: 300 });
    [0, 4, 7, 11, 14].forEach((s, i) => tone({ f: N(24 + s), type: "sine", start: 0.2 + i * 0.06, dur: 0.4, vol: 0.12 }));
  }),
  firework: safe(() => {
    noise({ dur: 0.35, vol: 0.12, f0: 600, f1: 2600, q: 0.8 });
    noise({ start: 0.3, dur: 0.6, vol: 0.3, type: "lowpass", f0: 2000, f1: 150, q: 0.4 });
    for (let k = 0; k < 5; k++) tone({ f: 1800 + Math.random() * 1600, type: "sine", start: 0.4 + k * 0.05, dur: 0.1, vol: 0.05 });
  }),
  boing: safe(() => {
    tone({ f: 220, to: 660, type: "sine", dur: 0.25, vol: 0.3 });
    tone({ f: 520, to: 420, type: "triangle", start: 0.05, dur: 0.12, vol: 0.12 }); // "guau" corto
    tone({ f: 460, to: 360, type: "triangle", start: 0.2, dur: 0.12, vol: 0.12 });
  }),
  /** Agua de la cascada: muy baja, sólo cerca del Cofre (0..1). */
  waterLevel(level) {
    if (!ctx || !enabled) { return; }
    try {
      if (!water && level > 0) {
        const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
        const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900; f.Q.value = 0.4;
        const g = ctx.createGain(); g.gain.value = 0.0001;
        s.connect(f).connect(g).connect(sfxBus); s.start();
        water = { s, g };
      }
      if (water) ramp(water.g.gain, Math.max(0.0001, level * 0.07), 0.8);
    } catch { /* nada */ }
  }
};
