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
 * Genera un sonido de click simple usando Web Audio API
 */
export const playClickSound = (): void => {
  // Verificar si los sonidos están habilitados
  const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
  if (!soundsEnabled) return;

  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configurar el sonido (tono corto y agradable)
    oscillator.frequency.value = 800; // Frecuencia en Hz
    oscillator.type = 'sine';

    // Envelope para que el sonido sea corto
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  } catch (error) {
    console.warn('Error playing click sound:', error);
  }
};

/**
 * Genera un sonido de confirmación
 */
export const playConfirmSound = (): void => {
  const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
  if (!soundsEnabled) return;

  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sonido de confirmación (dos tonos ascendentes)
    const now = ctx.currentTime;
    
    // Primer tono
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);
    
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  } catch (error) {
    console.warn('Error playing confirm sound:', error);
  }
};

/**
 * Genera un sonido de error
 */
export const playErrorSound = (): void => {
  const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
  if (!soundsEnabled) return;

  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sonido de error (tono descendente)
    const now = ctx.currentTime;
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.linearRampToValueAtTime(200, now + 0.2);
    
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
  } catch (error) {
    console.warn('Error playing error sound:', error);
  }
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
