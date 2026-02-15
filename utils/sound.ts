/**
 * Utilidad para manejar sonidos en la aplicación
 */

// Crear un AudioContext para generar sonidos
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * En Android/iOS el AudioContext arranca en "suspended" y debe reanudarse
 * tras una interacción del usuario. Resolver con el contexto listo para reproducir.
 */
const ensureAudioContextResumed = (): Promise<AudioContext> => {
  const ctx = getAudioContext();
  if (ctx.state === 'running') return Promise.resolve(ctx);
  if (ctx.state === 'suspended') {
    return ctx.resume().then(() => ctx);
  }
  return Promise.resolve(ctx);
};

/**
 * Genera un sonido de click tipo iOS usando Web Audio API
 * Características: 20-30ms, frecuencia ~2kHz, ataque rápido, decaimiento inmediato
 */
export const playClickSound = (): void => {
  const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
  if (!soundsEnabled) return;

  ensureAudioContextResumed()
    .then((ctx) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const highpassFilter = ctx.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.value = 1500;
      const lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.value = 4000;
      lowpassFilter.Q.value = 0.7;
      oscillator.connect(highpassFilter);
      highpassFilter.connect(lowpassFilter);
      lowpassFilter.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 2000;
      oscillator.type = 'sine';
      const now = ctx.currentTime;
      const duration = 0.025;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.start(now);
      oscillator.stop(now + duration);
    })
    .catch((error) => console.warn('Error playing click sound:', error));
};

/**
 * Genera un sonido de retroceso (Backspace/Delete) ligeramente diferente
 * Características: frecuencia más grave, duración similar
 */
export const playBackspaceSound = (): void => {
  const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
  if (!soundsEnabled) return;

  ensureAudioContextResumed()
    .then((ctx) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const highpassFilter = ctx.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.value = 1200;
      const lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.value = 3500;
      lowpassFilter.Q.value = 0.7;
      oscillator.connect(highpassFilter);
      highpassFilter.connect(lowpassFilter);
      lowpassFilter.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 1600;
      oscillator.type = 'sine';
      const now = ctx.currentTime;
      const duration = 0.025;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.16, now + 0.003);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.start(now);
      oscillator.stop(now + duration);
    })
    .catch((error) => console.warn('Error playing backspace sound:', error));
};

/**
 * Genera un sonido de confirmación
 */
export const playConfirmSound = (): void => {
  const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
  if (!soundsEnabled) return;

  ensureAudioContextResumed()
    .then((ctx) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      const now = ctx.currentTime;
      oscillator.frequency.setValueAtTime(600, now);
      oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      oscillator.start(now);
      oscillator.stop(now + 0.15);
    })
    .catch((error) => console.warn('Error playing confirm sound:', error));
};

/**
 * Genera un sonido de error
 */
export const playErrorSound = (): void => {
  const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
  if (!soundsEnabled) return;

  ensureAudioContextResumed()
    .then((ctx) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      const now = ctx.currentTime;
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.linearRampToValueAtTime(200, now + 0.2);
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
    })
    .catch((error) => console.warn('Error playing error sound:', error));
};

/**
 * Verifica si los sonidos están habilitados
 */
export const areSoundsEnabled = (): boolean => {
  return localStorage.getItem('soundsEnabled') !== 'false';
};

/**
 * Habilita o deshabilita los sonidos
 */
export const setSoundsEnabled = (enabled: boolean): void => {
  localStorage.setItem('soundsEnabled', enabled.toString());
};
