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
 * Genera un sonido de click tipo iOS usando Web Audio API
 * Características: 20-30ms, frecuencia ~2kHz, ataque rápido, decaimiento inmediato
 */
export const playClickSound = (): void => {
  // Verificar si los sonidos están habilitados
  const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
  if (!soundsEnabled) return;

  try {
    const ctx = getAudioContext();
    
    // Crear oscilador principal con frecuencia en rango 2.5-4kHz
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Filtro pasa-altas para eliminar graves y hacer el sonido más "seco"
    const highpassFilter = ctx.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.value = 1500; // Eliminar frecuencias por debajo de 1.5kHz
    
    // Filtro pasa-bajas para eliminar frecuencias muy altas y resonancia metálica
    const lowpassFilter = ctx.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.value = 4000; // Limitar frecuencias por encima de 4kHz
    lowpassFilter.Q.value = 0.7; // Q bajo para evitar resonancia
    
    // Conectar: oscilador -> filtro pasa-altas -> filtro pasa-bajas -> ganancia -> salida
    oscillator.connect(highpassFilter);
    highpassFilter.connect(lowpassFilter);
    lowpassFilter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Frecuencia central reducida para sonido menos agudo (2kHz en lugar de 3kHz)
    oscillator.frequency.value = 2000;
    oscillator.type = 'sine'; // Onda senoidal para sonido limpio y neutral

    // Envolvente ADSR muy rápida: ataque instantáneo, decaimiento inmediato, sin sustain
    const now = ctx.currentTime;
    const duration = 0.025; // 25ms de duración total
    
    // Ataque muy rápido (1-2ms)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.002); // Volumen sutil pero audible
    
    // Decaimiento inmediato (resto de la duración)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (error) {
    console.warn('Error playing click sound:', error);
  }
};

/**
 * Genera un sonido de retroceso (Backspace/Delete) ligeramente diferente
 * Características: frecuencia más grave, duración similar
 */
export const playBackspaceSound = (): void => {
  // Verificar si los sonidos están habilitados
  const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
  if (!soundsEnabled) return;

  try {
    const ctx = getAudioContext();
    
    // Crear oscilador principal con frecuencia más grave
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Filtro pasa-altas para eliminar graves excesivos
    const highpassFilter = ctx.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.value = 1200; // Permitir frecuencias más bajas
    
    // Filtro pasa-bajas para suavizar
    const lowpassFilter = ctx.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.value = 3500;
    lowpassFilter.Q.value = 0.7;
    
    // Conectar: oscilador -> filtro pasa-altas -> filtro pasa-bajas -> ganancia -> salida
    oscillator.connect(highpassFilter);
    highpassFilter.connect(lowpassFilter);
    lowpassFilter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Frecuencia más grave que el click normal (1.6kHz vs 2kHz)
    oscillator.frequency.value = 1600;
    oscillator.type = 'sine';

    // Envolvente similar pero con ataque ligeramente más suave
    const now = ctx.currentTime;
    const duration = 0.025; // 25ms de duración total
    
    // Ataque rápido pero ligeramente más suave
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.16, now + 0.003); // Volumen ligeramente más bajo
    
    // Decaimiento inmediato
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (error) {
    console.warn('Error playing backspace sound:', error);
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
