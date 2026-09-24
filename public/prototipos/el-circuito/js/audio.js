// Sonido generado con Web Audio (sin archivos). Maestro → música (~0.25) y efectos (0.75), con fades.
// Máximo ~10 efectos por segundo. Si Web Audio no existe o falla, todo sigue sin sonido.
// No intenta saltarse el modo silencio del iPhone (se usa el AudioContext normal).
const MUSIC = 0.25, SFX = 0.75;
let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
let enabled = false, broken = false, bg = false;
let musicWanted = false, ducked = false, timer = 0, stepN = 0, nextT = 0;
const brokenFns = new Set();
const recent = [];

function markBroken() { if (broken) return; broken = true; enabled = false; brokenFns.forEach((f) => { try { f(); } catch { /* nada */ } }); }
function ensure() {
  if (ctx) return ctx;
  if (broken) return null;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { markBroken(); return null; }
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = SFX; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    const len = ctx.sampleRate * 1.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  } catch { ctx = null; markBroken(); }
  return ctx;
}
function ramp(p, v, secs) { try { const t = ctx.currentTime; p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(v, t + secs); } catch { /* nada */ } }
function resumeCtx() { try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch { /* nada */ } }
/** Envuelve un efecto: respeta enabled, segundo plano y el límite de ~10 por segundo. */
function sfx(fn, { priority = false } = {}) {
  return (...a) => {
    if (!enabled || !ctx || bg) return;
    const now = performance.now();
    while (recent.length && now - recent[0] > 1000) recent.shift();
    if (recent.length >= 10 && !priority) return;
    recent.push(now);
    try { if (ctx.state === "suspended") resumeCtx(); fn(...a); } catch { /* silencio */ }
  };
}
function tone({ f = 440, to = null, type = "sine", start = 0, dur = 0.15, vol = 0.3, attack = 0.005, bus = sfxBus }) {
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.05);
}
function noise({ start = 0, dur = 0.3, vol = 0.2, type = "bandpass", f0 = 800, f1 = null, q = 1, attack = 0.02 }) {
  const t = ctx.currentTime + start;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(attack, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(g).connect(sfxBus); s.start(t); s.stop(t + dur + 0.05);
}
const N = (semi) => 261.63 * Math.pow(2, semi / 12); // semitonos desde Do4

/* ---------- Música: marimba + steel drum, compás tropical ---------- */
const MEL = [7, null, 12, 11, 9, null, 7, 4, 5, null, 9, 7, 4, null, 2, null, 7, null, 12, 14, 16, null, 14, 12, 11, null, 9, 7, 5, 4, 2, null];
const BASS = [0, 0, 5, 5, 7, 7, 0, 0];
const STEP = 0.2;
function marimba(f, start, vol) {
  tone({ f, type: "sine", start, dur: 0.35, vol, bus: musicBus });
  tone({ f: f * 4, type: "sine", start, dur: 0.06, vol: vol * 0.35, bus: musicBus });
}
function steel(f, start, vol) { // steel drum: sinusoide con armónico desafinado
  tone({ f, type: "triangle", start, dur: 0.45, vol, bus: musicBus });
  tone({ f: f * 2.01, type: "sine", start, dur: 0.3, vol: vol * 0.4, bus: musicBus });
}
function schedule() {
  if (!ctx || !musicWanted || !enabled) return;
  while (nextT < ctx.currentTime + 0.4) {
    const i = stepN % MEL.length, st = nextT - ctx.currentTime;
    if (MEL[i] != null) steel(N(MEL[i] + 12), st, 0.2);
    if (i % 4 === 0) marimba(N(BASS[(i / 4) % BASS.length] - 12), st, 0.34);
    if (i % 4 === 2) marimba(N(BASS[((i - 2) / 4) % BASS.length] - 5), st, 0.16);
    if (i % 2 === 1) noise({ start: st, dur: 0.04, vol: 0.05, type: "highpass", f0: 6000 }); // shaker
    nextT += STEP; stepN++;
  }
}
function startLoop() { if (!ctx || timer) return; nextT = ctx.currentTime + 0.1; timer = setInterval(schedule, 100); schedule(); }
function stopLoop() { clearInterval(timer); timer = 0; }
const musicLevel = () => (ducked ? 0.05 : MUSIC);

export const audio = {
  supported: () => !broken && !!(window.AudioContext || window.webkitAudioContext),
  onUnavailable(fn) { brokenFns.add(fn); if (broken) fn(); },
  /** Llamar dentro de un gesto: crea/reanuda el AudioContext. */
  unlock() { if (!ensure()) return false; bg = false; resumeCtx(); return true; },
  setEnabled(on) {
    if (on) {
      if (!ensure()) { enabled = false; return false; }
      enabled = true; resumeCtx(); ramp(master.gain, 1, 0.3);
      if (musicWanted) { startLoop(); ramp(musicBus.gain, musicLevel(), 1.2); }
    } else {
      enabled = false;
      if (ctx) { ramp(master.gain, 0, 0.3); setTimeout(() => { if (!enabled) stopLoop(); }, 350); }
    }
    return enabled;
  },
  isEnabled: () => enabled,
  music(on) {
    musicWanted = !!on;
    if (!ctx || !enabled) return;
    if (on) { startLoop(); ramp(musicBus.gain, musicLevel(), 1.2); }
    else { ramp(musicBus.gain, 0, 0.6); setTimeout(() => { if (!musicWanted) stopLoop(); }, 700); }
  },
  /** Baja la música con fade (pausas, tarjetas) y la regresa al continuar. */
  duck(on) { ducked = !!on; if (ctx && enabled && musicWanted) ramp(musicBus.gain, musicLevel(), on ? 0.5 : 1); },
  suspend() { bg = true; stopLoop(); try { ctx?.suspend(); } catch { /* nada */ } },
  resume() { bg = false; if (!enabled || !ctx) return; resumeCtx(); if (musicWanted) startLoop(); },

  start: sfx(() => { [0, 4, 7, 12].forEach((s, i) => tone({ f: N(12 + s), type: "triangle", start: i * 0.07, dur: 0.2, vol: 0.22 })); tone({ f: N(24), type: "sine", start: 0.3, dur: 0.5, vol: 0.2 }); }, { priority: true }),
  tap: sfx(() => tone({ f: 660, to: 880, type: "triangle", dur: 0.06, vol: 0.12 })),
  jump: sfx(() => { tone({ f: 380, to: 820, type: "sine", dur: 0.13, vol: 0.22 }); noise({ dur: 0.09, vol: 0.05, type: "highpass", f0: 2500 }); }), // "fwip"
  flip: sfx(() => { tone({ f: 500, to: 1100, type: "triangle", dur: 0.18, vol: 0.16 }); tone({ f: 700, to: 1400, type: "sine", start: 0.08, dur: 0.16, vol: 0.12 }); }),
  land: sfx(() => { tone({ f: 170, to: 110, type: "sine", dur: 0.08, vol: 0.2 }); noise({ dur: 0.06, vol: 0.06, type: "lowpass", f0: 900 }); }),
  boing: sfx(() => { tone({ f: 180, to: 620, type: "sine", dur: 0.32, vol: 0.34 }); tone({ f: 360, to: 900, type: "triangle", start: 0.03, dur: 0.22, vol: 0.12 }); }, { priority: true }),
  splash: sfx(() => {
    noise({ dur: 0.5, vol: 0.35, type: "lowpass", f0: 2200, f1: 300, q: 0.6, attack: 0.01 });
    noise({ start: 0.05, dur: 0.35, vol: 0.18, type: "bandpass", f0: 1400, f1: 600, q: 1.2 });
    tone({ f: 260, to: 90, type: "sine", dur: 0.3, vol: 0.2 });
    for (let k = 0; k < 4; k++) tone({ f: 900 + Math.random() * 700, to: 1500, type: "sine", start: 0.15 + k * 0.05, dur: 0.05, vol: 0.05 });
  }, { priority: true }),
  photo: sfx(() => { // obturador + destello
    noise({ dur: 0.04, vol: 0.25, type: "highpass", f0: 3000 });
    noise({ start: 0.07, dur: 0.05, vol: 0.2, type: "highpass", f0: 2400 });
    [0, 7, 12, 16].forEach((s, i) => tone({ f: N(24 + s), type: "sine", start: 0.12 + i * 0.05, dur: 0.18, vol: 0.12 }));
  }, { priority: true }),
  checkpoint: sfx(() => { [0, 4, 7].forEach((s, i) => { tone({ f: N(24 + s), type: "sine", start: i * 0.09, dur: 0.9, vol: 0.18 }); tone({ f: N(36 + s), type: "sine", start: i * 0.09, dur: 0.4, vol: 0.05 }); }); }, { priority: true }), // campana
  beep: sfx((high = false) => tone({ f: high ? 1320 : 660, type: "square", dur: high ? 0.35 : 0.16, vol: 0.1 }), { priority: true }),
  whistle: sfx(() => { tone({ f: 2100, to: 2250, type: "sine", dur: 0.55, vol: 0.18, attack: 0.02 }); noise({ dur: 0.55, vol: 0.05, type: "bandpass", f0: 2200, q: 8 }); }, { priority: true }),
  slide: sfx(() => { noise({ dur: 1.6, vol: 0.14, type: "bandpass", f0: 500, f1: 1800, q: 0.8, attack: 0.2 }); tone({ f: 600, to: 950, type: "triangle", dur: 0.5, vol: 0.08 }); tone({ f: 700, to: 1050, type: "triangle", start: 0.5, dur: 0.6, vol: 0.07 }); }),
  applause: sfx(() => { for (let k = 0; k < 18; k++) noise({ start: k * 0.09 + Math.random() * 0.05, dur: 0.12, vol: 0.12 * (1 - k / 22), type: "bandpass", f0: 1500 + Math.random() * 1500, q: 1.5 }); }, { priority: true }),
  fanfare: sfx(() => {
    [[0, 0], [4, 0.12], [7, 0.24], [12, 0.36], [7, 0.5], [12, 0.62]].forEach(([s, t]) => { tone({ f: N(12 + s), type: "square", start: t, dur: 0.14, vol: 0.07 }); tone({ f: N(s), type: "triangle", start: t, dur: 0.18, vol: 0.18 }); });
    [12, 16, 19, 24].forEach((s) => tone({ f: N(s), type: "triangle", start: 0.78, dur: 0.9, vol: 0.12 }));
  }, { priority: true })
};
