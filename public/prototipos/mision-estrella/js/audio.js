// Sonido generado con Web Audio (sin archivos, nada reconocible).
// Cadena: música (low-pass 4 kHz, ~0.2) + efectos (~0.5) → maestro (~0.8) → limitador → salida.
// Buses separados con fades; cada bus tiene un "mute" propio (debug). Todas las notas llevan envolvente
// (ataque ≥ 5 ms, salida ≥ 30 ms, rampas exponenciales). Sin ningún ambiente continuo de ruido.
// Se usa el AudioContext normal: respeta el modo silencio del iPhone. Si Web Audio falla, todo sigue en silencio.
const MASTER = 0.8, MUSIC = 0.2, MUSIC_DUCK = 0.07, SFX = 0.5;
const MIN_ATTACK = 0.005, MIN_RELEASE = 0.03;
let ctx = null, master = null, limiter = null, noiseBuf = null, musicBus = null, musicLevelG = null, sfxBus = null;
const mute = { music: null, sfx: null };
const muted = { music: false, sfx: false };
let enabled = false, broken = false, bg = false, musicWanted = false, ducked = false;
let timer = 0, stepN = 0, nextT = 0, voices = 0;
let rumble = null; // rumor grave del "mantener presionado"
const brokenFns = new Set();
const recent = [];

function markBroken() { if (broken) return; broken = true; enabled = false; brokenFns.forEach((f) => { try { f(); } catch { /* nada */ } }); }
function gain(v, to) { const g = ctx.createGain(); g.gain.value = v; if (to) g.connect(to); return g; }
function ensure() {
  if (ctx) return ctx;
  if (broken) return null;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { markBroken(); return null; }
    ctx = new AC();
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.003; limiter.release.value = 0.25;
    limiter.connect(ctx.destination);
    master = gain(0, limiter);
    mute.music = gain(1, master); mute.sfx = gain(1, master);
    musicLevelG = gain(0, mute.music);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4000; lp.Q.value = 0.5; lp.connect(musicLevelG);
    musicBus = gain(1, lp);
    sfxBus = gain(SFX, mute.sfx);
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  } catch { ctx = null; markBroken(); }
  return ctx;
}
function ramp(p, v, secs) { try { const t = ctx.currentTime; p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(v, t + secs); } catch { /* nada */ } }
function resumeCtx() { try { const p = ctx?.resume(); if (p && p.catch) p.catch(() => {}); } catch { /* nada */ } }
function track(node) { voices++; node.onended = () => { voices--; try { node.disconnect(); } catch { /* nada */ } }; }
function envelope(g, t, vol, attack, dur) {
  const a = Math.max(MIN_ATTACK, attack), end = t + Math.max(dur, a + MIN_RELEASE);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a); g.gain.exponentialRampToValueAtTime(0.0001, end);
  return end;
}
function sfx(fn, { priority = false } = {}) {
  return (...a) => {
    if (!enabled || !ctx || bg) return;
    const now = performance.now();
    while (recent.length && now - recent[0] > 1000) recent.shift();
    if (recent.length >= 12 && !priority) return;
    recent.push(now);
    try { if (ctx.state === "suspended") resumeCtx(); fn(...a); } catch { /* silencio */ }
  };
}
function tone({ f = 440, to = null, type = "sine", start = 0, dur = 0.15, vol = 0.3, attack = MIN_ATTACK, bus = sfxBus, detune = 0 }) {
  const t = ctx.currentTime + Math.max(0, start);
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const end = envelope(g, t, vol, attack, dur);
  o.connect(g).connect(bus); track(o); o.start(t); o.stop(end + 0.05);
}
/** Ruido filtrado CORTO con envolvente (whoosh, despegue). Nunca continuo. */
function noise({ start = 0, dur = 0.3, vol = 0.2, type = "bandpass", f0 = 800, f1 = null, q = 1, attack = 0.02 }) {
  const t = ctx.currentTime + Math.max(0, start);
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  const end = envelope(g, t, vol, Math.min(attack, dur / 3), dur);
  s.connect(fl).connect(g).connect(sfxBus); track(s); s.start(t); s.stop(end + 0.05);
}
const N = (semi) => 261.63 * Math.pow(2, semi / 12); // semitonos desde Do4
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

/* ---------- Música: canción de cuna con caja musical y pads suaves ---------- */
// Melodía original en Do mayor pentatónico (8 compases de 3/4, 6 pasos por compás).
const MEL = [12, null, 16, null, 19, null, 21, null, 19, null, 16, null, 14, null, 16, null, 12, null, 9, null, null, null, null, null,
  12, null, 16, null, 19, null, 24, null, 21, null, 19, null, 16, null, 14, null, 12, null, 14, null, null, null, null, null];
const CHORDS = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]]; // I · vi · IV · V
const STEP = 0.32;
function musicBox(f, start, vol) {
  tone({ f, type: "sine", start, dur: 1.1, vol, attack: 0.006, bus: musicBus });
  tone({ f: f * 2.76, type: "sine", start, dur: 0.35, vol: vol * 0.18, attack: 0.006, bus: musicBus }); // parcial de campana
  tone({ f: f * 2, type: "sine", start, dur: 0.6, vol: vol * 0.22, attack: 0.006, bus: musicBus });
}
function pad(chord, start, len) {
  chord.forEach((s) => {
    tone({ f: N(s - 12), type: "triangle", start, dur: len, vol: 0.05, attack: len * 0.35, bus: musicBus, detune: -6 });
    tone({ f: N(s - 12), type: "sine", start, dur: len, vol: 0.05, attack: len * 0.35, bus: musicBus, detune: 7 });
  });
}
function schedule() {
  if (!ctx || !musicWanted || !enabled) return;
  if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05; // sin ráfagas atrasadas
  while (nextT < ctx.currentTime + 0.5) {
    const i = stepN % MEL.length, st = nextT - ctx.currentTime;
    if (MEL[i] != null) musicBox(N(MEL[i]), st, 0.16);
    if (i % 12 === 0) pad(CHORDS[(i / 12) % CHORDS.length], st, STEP * 12 + 0.4);
    if (i % 6 === 3) musicBox(N(CHORDS[Math.floor(i / 12) % CHORDS.length][1]), st, 0.05);
    nextT += STEP; stepN++;
  }
}
function startLoop() { if (!ctx || timer) return; nextT = ctx.currentTime + 0.1; timer = setInterval(schedule, 120); schedule(); }
function stopLoop() { clearInterval(timer); timer = 0; }
const musicLevel = () => (ducked ? MUSIC_DUCK : MUSIC);

export const audio = {
  supported: () => !broken && !!(window.AudioContext || window.webkitAudioContext),
  onUnavailable(fn) { brokenFns.add(fn); if (broken) fn(); },
  /** Llamar dentro de un gesto (pointerdown Y pointerup, por iOS): crea/reanuda el AudioContext. */
  unlock() { if (!ensure()) return false; bg = false; resumeCtx(); return true; },
  setEnabled(on) {
    if (on) {
      if (!ensure()) { enabled = false; return false; }
      enabled = true; resumeCtx(); ramp(master.gain, MASTER, 0.4);
      if (musicWanted) { startLoop(); ramp(musicLevelG.gain, musicLevel(), 1.5); }
    } else {
      enabled = false; audio.rumble(0);
      if (ctx) { ramp(master.gain, 0, 0.35); setTimeout(() => { if (!enabled) stopLoop(); }, 400); }
    }
    return enabled;
  },
  isEnabled: () => enabled,
  music(on) {
    musicWanted = !!on;
    if (!ctx || !enabled) return;
    if (on) { startLoop(); ramp(musicLevelG.gain, musicLevel(), 2); }
    else { ramp(musicLevelG.gain, 0, 0.8); setTimeout(() => { if (!musicWanted) stopLoop(); }, 900); }
  },
  duck(on) { ducked = !!on; if (ctx && enabled && musicWanted) ramp(musicLevelG.gain, musicLevel(), on ? 0.5 : 1.2); },
  suspend() { bg = true; stopLoop(); try { ctx?.suspend(); } catch { /* nada */ } },
  resume() { bg = false; if (!enabled || !ctx) return; resumeCtx(); if (musicWanted) startLoop(); },
  setMuted(ch, on) { muted[ch] = !!on; if (ctx && mute[ch]) ramp(mute[ch].gain, on ? 0 : 1, 0.15); },
  isMuted: (ch) => muted[ch],
  sources() {
    const list = [];
    if (timer) list.push(`Música (caja musical + pads)${muted.music ? " · mute" : ""}${ducked ? " · baja" : ""}`);
    if (rumble) list.push("Rumor de motores (sólo mientras se presiona)");
    return { ctx: ctx ? ctx.state : "sin crear", enabled, voices, continuous: list, reduction: limiter ? (limiter.reduction?.value ?? limiter.reduction) : 0 };
  },

  /** Rumor grave creciente mientras se mantiene presionado (0–1). Osciladores graves filtrados, no ruido. */
  rumble(level) {
    if (!ctx || !enabled || bg) return;
    if (level > 0.001 && !rumble) {
      const g = gain(0.0001), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 160; lp.Q.value = 0.7;
      const oscs = [38, 38.7, 57].map((f, i) => { const o = ctx.createOscillator(); o.type = i === 2 ? "triangle" : "sawtooth"; o.frequency.value = f; o.connect(lp); o.start(); return o; });
      const lfo = ctx.createOscillator(), lg = gain(6); lfo.frequency.value = 7; lfo.connect(lg).connect(oscs[0].frequency); lfo.start();
      lp.connect(g).connect(sfxBus);
      rumble = { g, lp, oscs: [...oscs, lfo] };
    }
    if (!rumble) return;
    const t = ctx.currentTime;
    rumble.g.gain.cancelScheduledValues(t); rumble.g.gain.setTargetAtTime(Math.max(0.0001, level * 0.55), t, 0.08);
    rumble.lp.frequency.setTargetAtTime(120 + level * 220, t, 0.1);
    if (level <= 0.001) {
      const r = rumble; rumble = null;
      r.g.gain.setTargetAtTime(0.0001, t, 0.15);
      setTimeout(() => { r.oscs.forEach((o) => { try { o.stop(); } catch { /* nada */ } }); }, 900);
    }
  },
  ignite: sfx(() => { // encendido de motores: golpe grave + campanita ascendente
    tone({ f: 90, to: 45, dur: 0.7, vol: 0.4, attack: 0.01 });
    [0, 4, 7, 12].forEach((s, i) => tone({ f: N(12 + s), start: 0.05 + i * 0.07, dur: 0.5, vol: 0.12 }));
  }, { priority: true }),
  beep: sfx((high = false) => { tone({ f: high ? 1046 : 784, type: "triangle", dur: high ? 0.5 : 0.18, vol: 0.2 }); tone({ f: (high ? 1046 : 784) * 2, dur: 0.12, vol: 0.04 }); }, { priority: true }),
  liftoff: sfx(() => { // rumor filtrado con envolvente (se desvanece solo), nunca siseo
    noise({ dur: 4.2, vol: 0.5, type: "lowpass", f0: 420, f1: 120, q: 0.8, attack: 0.25 });
    tone({ f: 55, to: 38, type: "sawtooth", dur: 3.5, vol: 0.12, attack: 0.3 });
    tone({ f: 82, to: 60, type: "triangle", dur: 3, vol: 0.14, attack: 0.2 });
  }, { priority: true }),
  radio: sfx(() => { tone({ f: 1320, dur: 0.07, vol: 0.07 }); tone({ f: 1760, start: 0.1, dur: 0.09, vol: 0.06 }); }),
  chime: sfx((i = null) => { const s = PENTA[i == null ? Math.floor(Math.random() * PENTA.length) : i % PENTA.length]; tone({ f: N(24 + s), dur: 1.2, vol: 0.12 }); tone({ f: N(36 + s), dur: 0.4, vol: 0.03 }); }),
  sparkle: sfx(() => { [0, 4, 7, 12, 16].forEach((s, i) => tone({ f: N(24 + s), start: i * 0.06, dur: 0.9, vol: 0.09 })); }, { priority: true }),
  laugh: sfx(() => { [0, 0.13, 0.26, 0.42].forEach((t, i) => tone({ f: 620 + i * 60, to: 900 + i * 40, start: t, dur: 0.1, vol: 0.14 })); tone({ f: 700, to: 1200, start: 0.55, dur: 0.22, vol: 0.12 }); }),
  yawn: sfx(() => { tone({ f: 520, to: 330, dur: 0.6, vol: 0.08, attack: 0.08 }); }),
  whoosh: sfx(() => { noise({ dur: 0.45, vol: 0.12, type: "bandpass", f0: 400, f1: 1800, q: 0.9, attack: 0.12 }); }),
  tap: sfx(() => tone({ f: 880, to: 1175, type: "sine", dur: 0.08, vol: 0.08 })),
  stitch: sfx((n = 12) => { for (let k = 0; k < n; k++) { tone({ f: 1500 + (k % 2) * 180, dur: 0.035, vol: 0.05, start: k * 0.07 }); tone({ f: 180, dur: 0.04, vol: 0.06, start: k * 0.07 + 0.02 }); } }, { priority: true }),
  comets: sfx(() => { for (let k = 0; k < 7; k++) tone({ f: 1400 + Math.random() * 900, to: 500 + Math.random() * 200, start: k * 0.14, dur: 0.5, vol: 0.05 }); }, { priority: true }),
  fanfare: sfx(() => {
    [[0, 0], [4, 0.14], [7, 0.28], [12, 0.44]].forEach(([s, t]) => { tone({ f: N(12 + s), type: "triangle", start: t, dur: 0.3, vol: 0.14 }); tone({ f: N(s), type: "sine", start: t, dur: 0.35, vol: 0.12 }); });
    [12, 16, 19, 24].forEach((s) => tone({ f: N(s), type: "triangle", start: 0.62, dur: 1.4, vol: 0.08, attack: 0.03 }));
  }, { priority: true }),
  bye: sfx(() => { [12, 9, 7, 4].forEach((s, i) => tone({ f: N(12 + s), start: i * 0.16, dur: 0.6, vol: 0.1 })); }, { priority: true })
};
