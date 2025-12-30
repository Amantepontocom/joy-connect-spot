// Mimo Sound Effects - Premium notification sounds for each mimo type

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface SoundConfig {
  frequencies: number[];
  duration: number;
  type: OscillatorType;
  gain: number;
  delay?: number;
  fadeOut?: boolean;
}

const MIMO_SOUNDS: Record<string, SoundConfig[]> = {
  // 🌹 Rosa - Soft romantic chime
  '🌹': [
    { frequencies: [523, 659, 784], duration: 0.15, type: 'sine', gain: 0.3, delay: 0 },
    { frequencies: [659, 784, 988], duration: 0.2, type: 'sine', gain: 0.25, delay: 0.1 },
  ],
  
  // 🥂 Champagne - Bubbly celebration sound
  '🥂': [
    { frequencies: [880, 1100], duration: 0.08, type: 'sine', gain: 0.2, delay: 0 },
    { frequencies: [1100, 1320], duration: 0.08, type: 'sine', gain: 0.18, delay: 0.08 },
    { frequencies: [1320, 1540], duration: 0.08, type: 'sine', gain: 0.15, delay: 0.16 },
    { frequencies: [1540, 1760], duration: 0.12, type: 'sine', gain: 0.12, delay: 0.24 },
  ],
  
  // 💎 Diamante - Sparkling crystal sound
  '💎': [
    { frequencies: [1200, 1500, 1800], duration: 0.1, type: 'sine', gain: 0.25, delay: 0 },
    { frequencies: [1500, 1800, 2100], duration: 0.1, type: 'sine', gain: 0.2, delay: 0.05 },
    { frequencies: [1800, 2100, 2400], duration: 0.15, type: 'sine', gain: 0.15, delay: 0.1 },
    { frequencies: [2100, 2400, 2700], duration: 0.2, type: 'sine', gain: 0.1, delay: 0.15, fadeOut: true },
  ],
  
  // 💋 Beijo - Warm kiss sound
  '💋': [
    { frequencies: [440, 550, 660], duration: 0.12, type: 'sine', gain: 0.3, delay: 0 },
    { frequencies: [550, 660, 770], duration: 0.15, type: 'sine', gain: 0.25, delay: 0.08 },
    { frequencies: [660, 770, 880], duration: 0.2, type: 'sine', gain: 0.2, delay: 0.15, fadeOut: true },
  ],
  
  // 👑 Coroa - Majestic royal fanfare
  '👑': [
    { frequencies: [392, 494, 587], duration: 0.15, type: 'sine', gain: 0.35, delay: 0 },
    { frequencies: [494, 587, 698], duration: 0.15, type: 'sine', gain: 0.3, delay: 0.12 },
    { frequencies: [587, 698, 784], duration: 0.15, type: 'sine', gain: 0.3, delay: 0.24 },
    { frequencies: [698, 784, 880], duration: 0.2, type: 'sine', gain: 0.35, delay: 0.36 },
    { frequencies: [784, 988, 1175], duration: 0.4, type: 'sine', gain: 0.3, delay: 0.5, fadeOut: true },
  ],
};

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

const playTone = (config: SoundConfig, ctx: AudioContext, startTime: number) => {
  const { frequencies, duration, type, gain, fadeOut } = config;
  
  frequencies.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, startTime);
    
    // Add slight detune for richness
    oscillator.detune.setValueAtTime(index * 3, startTime);
    
    gainNode.gain.setValueAtTime(gain / frequencies.length, startTime);
    
    if (fadeOut) {
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    } else {
      gainNode.gain.setValueAtTime(gain / frequencies.length, startTime + duration * 0.7);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    }
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
  });
};

export const playMimoSound = (mimoIcon: string): void => {
  try {
    const ctx = getAudioContext();
    const sounds = MIMO_SOUNDS[mimoIcon];
    
    if (!sounds) {
      // Default notification sound
      const defaultConfig: SoundConfig = {
        frequencies: [800, 1000],
        duration: 0.15,
        type: 'sine',
        gain: 0.2,
      };
      playTone(defaultConfig, ctx, ctx.currentTime);
      return;
    }
    
    const baseTime = ctx.currentTime;
    sounds.forEach((config) => {
      const startTime = baseTime + (config.delay || 0);
      playTone(config, ctx, startTime);
    });
  } catch (error) {
    console.error('Error playing mimo sound:', error);
  }
};

// Resume audio context on user interaction (required by browsers)
export const initAudioContext = (): void => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
};
