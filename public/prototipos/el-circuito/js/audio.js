// Sonido generado con Web Audio (sin archivos).
// Cadena: música (low-pass 4 kHz, ~0.2) + ambiente (opcional, ≤0.05) + efectos (~0.5) → maestro (~0.8) → limitador → salida.
// Cada canal tiene un "mute" propio (para el panel de debug). Todas las notas llevan envolvente
// (ataque ≥ 5 ms, salida ≥ 30 ms, rampas exponenciales) para no producir clics.
// Máximo ~10 efectos por segundo. Si Web Audio no existe o falla, todo sigue sin sonido.
// No intenta saltarse el modo silencio del iPhone (se usa el AudioContext normal).
const MASTER = 0.8, MUSIC = 0.2, MUSIC_DUCK = 0.05, SFX = 0.5, AMB = 0.04;
const MIN_ATTACK = 0.005, MIN_RELEASE = 0.03;
let ctx = null, master = null, limiter = null, noiseBuf = null;
let musicBus = null, musicLevelG = null, sfxBus = null, ambBus = null;
const mute = { music: null, amb: null, sfx: null };
const muted = { music: false, amb: false, sfx: false };
let enabled = false, broken = false, bg = false;
let musicWanted = false, ducked = false, timer = 0, stepN = 0, nextT = 0;
let ambWanted = false, amb = null; // ambiente de agua: apagado por defecto
let voices = 0; // osciladores / fuentes sonando ahora mismo
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
    // Limitador en el bus maestro: la suma de música + efectos nunca satura.
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6; limiter.knee.value = 0; limiter.ratio.value = 20;
    limiter.attack.value = 0.003; limiter.release.value = 0.25;
    limiter.connect(ctx.destination);
    master = gain(0, limiter);
    mute.music = gain(1, master); mute.amb = gain(1, master); mute.sfx = gain(1, master);
    // Música: suave y cálida, sin agudos ásperos.
    musicLevelG = gain(0, mute.music);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4000; lp.Q.value = 0.5; lp.connect(musicLevelG);
    musicBus = gain(1, lp);
    sfxBus = gain(SFX, mute.sfx);
    ambBus = gain(0, mute.amb);
    const len = ctx.sampleRate * 1.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  } catch { ctx = null; markBroken(); }
  return ctx;
}
function ramp(p, v, secs) { try { const t = ctx.currentTime; p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(v, t + secs); } catch { /* nada */ } }
function resumeCtx() { try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch { /* nada */ } }
function track(node) { voices++; node.onended = () => { voices--; try { node.disconnect(); } catch { /* nada */ } }; }
/** Envolvente: 0.0001 → vol (ataque) → 0.0001 al final, siempre con rampas exponenciales. */
function envelope(g, t, vol, attack, dur) {
  const a = Math.max(MIN_ATTACK, attack), end = t + Math.max(dur, a + MIN_RELEASE);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a); g.gain.exponentialRampToValueAtTime(0.0001, end);
  return end;
}
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
function tone({ f = 440, to = null, type = "sine", start = 0, dur = 0.15, vol = 0.3, attack = MIN_ATTACK, bus = sfxBus }) {
  const t = ctx.currentTime + Math.max(0, start);
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const end = envelope(g, t, vol, attack, dur);
  o.connect(g).connect(bus); track(o); o.start(t); o.stop(end + 0.05);
}
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

/* ---------- Música: marimba + steel drum, compás tropical ---------- */
const MEL = [7, null, 12, 11, 9, null, 7, 4, 5, null, 9, 7, 4, null, 2, null, 7, null, 12, 14, 16, null, 14, 12, 11, null, 9, 7, 5, 4, 2, null];
const BASS = [0, 0, 5, 5, 7, 7, 0, 0];
const STEP = 0.2;
function marimba(f, start, vol) {
  tone({ f, type: "sine", start, dur: 0.38, vol, attack: 0.006, bus: musicBus });
  tone({ f: f * 4, type: "sine", start, dur: 0.07, vol: vol * 0.12, attack: 0.006, bus: musicBus }); // golpe de la baqueta, discreto
}
function steel(f, start, vol) { // steel drum: sinusoide con armónico desafinado (sin triángulo: menos agudos)
  tone({ f, type: "sine", start, dur: 0.45, vol, attack: 0.008, bus: musicBus });
  tone({ f: f * 2.01, type: "sine", start, dur: 0.28, vol: vol * 0.25, attack: 0.008, bus: musicBus });
}
function schedule() {
  if (!ctx || !musicWanted || !enabled) return;
  // Si el temporizador se retrasó (pestaña ocupada), no dispares una ráfaga de notas atrasadas.
  if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
  while (nextT < ctx.currentTime + 0.4) {
    const i = stepN % MEL.length, st = nextT - ctx.currentTime;
    if (MEL[i] != null) steel(N(MEL[i] + 12), st, 0.22);
    if (i % 4 === 0) marimba(N(BASS[(i / 4) % BASS.length] - 12), st, 0.36);
    if (i % 4 === 2) marimba(N(BASS[((i - 2) / 4) % BASS.length] - 5), st, 0.16);
    // (Antes aquí sonaba un "shaker" de ruido blanco filtrado a 6 kHz en el bus de efectos: era el chispazo.)
    nextT += STEP; stepN++;
  }
}
function startLoop() { if (!ctx || timer) return; nextT = ctx.currentTime + 0.1; timer = setInterval(schedule, 100); schedule(); }
function stopLoop() { clearInterval(timer); timer = 0; }
const musicLevel = () => (ducked ? MUSIC_DUCK : MUSIC);

/* ---------- Ambiente de agua (opcional, apagado por defecto) ---------- */
// Ruido filtrado muy grave (low-pass 450 Hz) con un vaivén lento de volumen: oleaje, nunca un siseo.
function startAmb() {
  if (amb || !ctx) return;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 450; lp.Q.value = 0.3;
  const g = gain(0.5); // el vaivén mueve este gain entre ~0.15 y ~0.85
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12;
  const depth = gain(0.35); lfo.connect(depth).connect(g.gain);
  s.connect(lp).connect(g).connect(ambBus);
  s.start(); lfo.start();
  amb = { s, lfo };
  ramp(ambBus.gain, AMB, 1.5);
}
function stopAmb() {
  if (!amb) return;
  const a = amb; amb = null;
  ramp(ambBus.gain, 0, 0.8);
  setTimeout(() => { try { a.s.stop(); a.lfo.stop(); } catch { /* nada */ } }, 900);
}

export const audio = {
  supported: () => !broken && !!(window.AudioContext || window.webkitAudioContext),
  onUnavailable(fn) { brokenFns.add(fn); if (broken) fn(); },
  /** Llamar dentro de un gesto: crea/reanuda el AudioContext. */
  unlock() { if (!ensure()) return false; bg = false; resumeCtx(); return true; },
  setEnabled(on) {
    if (on) {
      if (!ensure()) { enabled = false; return false; }
      enabled = true; resumeCtx(); ramp(master.gain, MASTER, 0.3);
      if (musicWanted) { startLoop(); ramp(musicLevelG.gain, musicLevel(), 1.2); }
      if (ambWanted) startAmb();
    } else {
      enabled = false;
      if (ctx) { ramp(master.gain, 0, 0.3); setTimeout(() => { if (!enabled) { stopLoop(); stopAmb(); } }, 350); }
    }
    return enabled;
  },
  isEnabled: () => enabled,
  music(on) {
    musicWanted = !!on;
    if (!ctx || !enabled) return;
    if (on) { startLoop(); ramp(musicLevelG.gain, musicLevel(), 1.2); }
    else { ramp(musicLevelG.gain, 0, 0.6); setTimeout(() => { if (!musicWanted) stopLoop(); }, 700); }
  },
  /** Ambiente de agua opcional (apagado por defecto). */
  ambient(on) { ambWanted = !!on; if (!ctx || !enabled) return; if (on) startAmb(); else stopAmb(); },
  /** Baja la música con fade (pausas, tarjetas) y la regresa al continuar. */
  duck(on) { ducked = !!on; if (ctx && enabled && musicWanted) ramp(musicLevelG.gain, musicLevel(), on ? 0.5 : 1); },
  suspend() { bg = true; stopLoop(); try { ctx?.suspend(); } catch { /* nada */ } },
  resume() { bg = false; if (!enabled || !ctx) return; resumeCtx(); if (musicWanted) startLoop(); },

  /* ---------- Debug ---------- */
  /** Silencia un canal por separado: "music" | "amb" | "sfx". */
  setMuted(ch, on) { muted[ch] = !!on; if (ctx && mute[ch]) ramp(mute[ch].gain, on ? 0 : 1, 0.15); },
  isMuted: (ch) => muted[ch],
  /** Fuentes continuas activas y nodos sonando. */
  sources() {
    const list = [];
    if (timer) list.push(`Música (loop cada ${STEP * 1000} ms)${muted.music ? " · mute" : ""}${ducked ? " · baja" : ""}`);
    if (amb) list.push(`Ambiente agua (LP 450 Hz, ${AMB})${muted.amb ? " · mute" : ""}`);
    return { ctx: ctx ? ctx.state : "sin crear", enabled, voices, continuous: list, reduction: limiter ? limiter.reduction?.value ?? limiter.reduction : 0 };
  },

  start: sfx(() => { [0, 4, 7, 12].forEach((s, i) => tone({ f: N(12 + s), type: "triangle", start: i * 0.07, dur: 0.2, vol: 0.22 })); tone({ f: N(24), type: "sine", start: 0.3, dur: 0.5, vol: 0.2 }); }, { priority: true }),
  tap: sfx(() => tone({ f: 660, to: 880, type: "triangle", dur: 0.07, vol: 0.12 })),
  jump: sfx(() => { tone({ f: 380, to: 820, type: "sine", dur: 0.13, vol: 0.22 }); noise({ dur: 0.09, vol: 0.03, type: "bandpass", f0: 1800, q: 0.8 }); }), // "fwip"
  flip: sfx(() => { tone({ f: 500, to: 1100, type: "triangle", dur: 0.18, vol: 0.16 }); tone({ f: 700, to: 1400, type: "sine", start: 0.08, dur: 0.16, vol: 0.12 }); }),
  land: sfx(() => { tone({ f: 170, to: 110, type: "sine", dur: 0.09, vol: 0.2 }); noise({ dur: 0.07, vol: 0.05, type: "lowpass", f0: 900 }); }),
  boing: sfx(() => { tone({ f: 180, to: 620, type: "sine", dur: 0.32, vol: 0.34 }); tone({ f: 360, to: 900, type: "triangle", start: 0.03, dur: 0.22, vol: 0.12 }); }, { priority: true }),
  splash: sfx(() => {
    noise({ dur: 0.5, vol: 0.3, type: "lowpass", f0: 2200, f1: 300, q: 0.6, attack: 0.01 });
    noise({ start: 0.05, dur: 0.35, vol: 0.14, type: "bandpass", f0: 1400, f1: 600, q: 1.2 });
    tone({ f: 260, to: 90, type: "sine", dur: 0.3, vol: 0.2 });
    for (let k = 0; k < 4; k++) tone({ f: 900 + Math.random() * 700, to: 1500, type: "sine", start: 0.15 + k * 0.05, dur: 0.05, vol: 0.05 });
  }, { priority: true }),
  photo: sfx(() => { // obturador + destello
    noise({ dur: 0.045, vol: 0.14, type: "bandpass", f0: 2600, q: 1.2 });
    noise({ start: 0.07, dur: 0.05, vol: 0.1, type: "bandpass", f0: 2000, q: 1.2 });
    [0, 7, 12, 16].forEach((s, i) => tone({ f: N(24 + s), type: "sine", start: 0.12 + i * 0.05, dur: 0.18, vol: 0.12 }));
  }, { priority: true }),
  checkpoint: sfx(() => { [0, 4, 7].forEach((s, i) => { tone({ f: N(24 + s), type: "sine", start: i * 0.09, dur: 0.9, vol: 0.18 }); tone({ f: N(36 + s), type: "sine", start: i * 0.09, dur: 0.4, vol: 0.05 }); }); }, { priority: true }), // campana
  beep: sfx((high = false) => tone({ f: high ? 1320 : 660, type: "triangle", dur: high ? 0.35 : 0.16, vol: 0.16 }), { priority: true }),
  whistle: sfx(() => { tone({ f: 2100, to: 2250, type: "sine", dur: 0.55, vol: 0.14, attack: 0.02 }); }, { priority: true }),
  slide: sfx(() => { noise({ dur: 1.4, vol: 0.08, type: "bandpass", f0: 400, f1: 1200, q: 0.8, attack: 0.2 }); tone({ f: 600, to: 950, type: "triangle", dur: 0.5, vol: 0.08 }); tone({ f: 700, to: 1050, type: "triangle", start: 0.5, dur: 0.6, vol: 0.07 }); }),
  applause: sfx(() => { for (let k = 0; k < 18; k++) noise({ start: k * 0.09 + Math.random() * 0.05, dur: 0.12, vol: 0.09 * (1 - k / 22), type: "bandpass", f0: 1200 + Math.random() * 1000, q: 1.5 }); }, { priority: true }),
  fanfare: sfx(() => {
    [[0, 0], [4, 0.12], [7, 0.24], [12, 0.36], [7, 0.5], [12, 0.62]].forEach(([s, t]) => { tone({ f: N(12 + s), type: "triangle", start: t, dur: 0.14, vol: 0.1 }); tone({ f: N(s), type: "triangle", start: t, dur: 0.18, vol: 0.18 }); });
    [12, 16, 19, 24].forEach((s) => tone({ f: N(s), type: "triangle", start: 0.78, dur: 0.9, vol: 0.12 }));
  }, { priority: true })
};
