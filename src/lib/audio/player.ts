/**
 * Audio Player - Reproduce progresiones usando Web Audio API
 * Genera audio sintetizado con sonido de guitarra o piano
 */

// ============================================================================
// Types
// ============================================================================

export type InstrumentType = 'guitar' | 'piano';
export type ArpeggioSpeed = 'fast' | 'medium' | 'slow';

export interface PlaybackOptions {
    bpm?: number;                    // Beats per minute (default 80)
    noteDuration?: number;           // Duration in seconds (default 2)
    volume?: number;                 // 0-1 (default 0.7)
    arpeggio?: boolean;              // Play notes as arpeggio instead of simultaneous
    instrument?: InstrumentType;      // 'guitar' or 'piano' (default 'piano')
    arpeggioSpeed?: ArpeggioSpeed;   // 'fast', 'medium', 'slow' (default 'medium')
}

interface AudioPlayer {
    isPlaying: boolean;
    currentIndex: number;
    stop: () => void;
}

// ============================================================================
// Web Audio Context
// ============================================================================

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

function getMasterChain(): { gain: GainNode; compressor: DynamicsCompressorNode } {
    const ctx = getAudioContext();

    if (!compressor) {
        // Dynamic compressor for cleaner mix
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        compressor.connect(ctx.destination);
    }

    if (!masterGain) {
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.8;
        masterGain.connect(compressor);
    }

    return { gain: masterGain, compressor };
}

// ============================================================================
// Frequency Calculations
// ============================================================================

const NOTE_FREQUENCIES: Record<string, number> = {
    'C': 261.63, 'C#': 277.18, 'Db': 277.18,
    'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
    'E': 329.63,
    'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
    'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
    'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
    'B': 493.88
};

/**
 * Obtiene la frecuencia de una nota científica (ej: "A4" = 440Hz)
 */
function getFrequency(note: string): number {
    const match = note.match(/^([A-G][#b]?)(\d+)?$/);
    if (!match) return 0;

    const [, pitchClass, octaveStr] = match;
    const octave = octaveStr ? parseInt(octaveStr) : 4;

    const baseFreq = NOTE_FREQUENCIES[pitchClass];
    if (!baseFreq) return 0;

    const octaveDiff = octave - 4;
    return baseFreq * Math.pow(2, octaveDiff);
}

// ============================================================================
// Improved Guitar Sound Synthesis
// ============================================================================

/**
 * Crea un sonido de guitarra acústica brillante usando Karplus-Strong simplificado
 * con múltiples armónicos y envolvente percusiva
 */
function createBrightGuitarTone(
    frequency: number,
    startTime: number,
    duration: number,
    volume: number = 0.4
): { oscillators: OscillatorNode[]; gains: GainNode[] } {
    const ctx = getAudioContext();
    const { gain: master } = getMasterChain();

    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Crear canal de salida para esta nota
    const noteGain = ctx.createGain();
    noteGain.connect(master);
    gains.push(noteGain);

    // High-pass filter para más brillo (quitar graves muddy)
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 80;
    highPass.Q.value = 0.7;
    highPass.connect(noteGain);

    // Presence boost (2-5kHz) para claridad
    const presenceEQ = ctx.createBiquadFilter();
    presenceEQ.type = 'peaking';
    presenceEQ.frequency.value = 3000;
    presenceEQ.Q.value = 1.5;
    presenceEQ.gain.value = 4;
    presenceEQ.connect(highPass);

    // Low-mid cut para evitar mudiness
    const lowMidCut = ctx.createBiquadFilter();
    lowMidCut.type = 'peaking';
    lowMidCut.frequency.value = 300;
    lowMidCut.Q.value = 1;
    lowMidCut.gain.value = -3;
    lowMidCut.connect(presenceEQ);

    // Armónicos brillantes de guitarra acústica
    const harmonics = [
        { harmonic: 1, gain: 1.0, type: 'sawtooth' as OscillatorType },   // Fundamental - sawtooth más rico
        { harmonic: 2, gain: 0.5, type: 'triangle' as OscillatorType },  // Octava 
        { harmonic: 3, gain: 0.25, type: 'sine' as OscillatorType },     // 5ta + octava
        { harmonic: 4, gain: 0.15, type: 'sine' as OscillatorType },     // 2da octava
        { harmonic: 5, gain: 0.1, type: 'sine' as OscillatorType },      // 3ra mayor + 2 octavas
        { harmonic: 6, gain: 0.08, type: 'sine' as OscillatorType },     // Brillo extra
    ];

    // Envolvente percusiva de guitarra (ataque rápido, decay natural)
    const attackTime = 0.005;  // Muy rápido - plectrum/pick attack
    const decayTime = 0.15;    // Decay inicial rápido
    const sustainLevel = 0.35; // Sustain moderado
    const releaseTime = Math.min(0.5, duration * 0.3);

    for (const { harmonic, gain, type } of harmonics) {
        const osc = ctx.createOscillator();
        const harmonicGain = ctx.createGain();

        osc.type = type;
        osc.frequency.value = frequency * harmonic;

        // Detuning sutil para más realismo (como cuerdas ligeramente desafinadas)
        if (harmonic > 1) {
            osc.detune.value = (Math.random() - 0.5) * 4; // ±2 cents
        }

        // Envolvente ADSR para cada armónico
        const harmonicVolume = volume * gain;
        harmonicGain.gain.setValueAtTime(0, startTime);

        // Attack - pico inicial brillante
        harmonicGain.gain.linearRampToValueAtTime(
            harmonicVolume * 1.3, // Overshoot para attack
            startTime + attackTime
        );

        // Decay to sustain
        harmonicGain.gain.exponentialRampToValueAtTime(
            Math.max(harmonicVolume * sustainLevel, 0.001),
            startTime + attackTime + decayTime
        );

        // Hold sustain
        harmonicGain.gain.setValueAtTime(
            harmonicVolume * sustainLevel,
            startTime + duration - releaseTime
        );

        // Release
        harmonicGain.gain.exponentialRampToValueAtTime(
            0.001,
            startTime + duration
        );

        osc.connect(harmonicGain);
        harmonicGain.connect(lowMidCut);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);

        oscillators.push(osc);
        gains.push(harmonicGain);
    }

    // Añadir ruido sutil de pick/ataque para realismo
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2500;
    noiseFilter.Q.value = 2;

    // Crear buffer de ruido
    const bufferSize = ctx.sampleRate * 0.05; // 50ms de ruido
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    noiseGain.gain.setValueAtTime(volume * 0.15, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(lowMidCut);

    noiseSource.start(startTime);
    noiseSource.stop(startTime + 0.05);

    return { oscillators, gains };
}

/**
 * Crea un sonido de piano usando síntesis FM simplificada
 * con armónicos más claros y definidos que la guitarra
 */
function createPianoTone(
    frequency: number,
    startTime: number,
    duration: number,
    volume: number = 0.4
): { oscillators: OscillatorNode[]; gains: GainNode[] } {
    const ctx = getAudioContext();
    const { gain: master } = getMasterChain();

    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Crear canal de salida para esta nota
    const noteGain = ctx.createGain();
    noteGain.connect(master);
    gains.push(noteGain);

    // Low-pass filter para suavizar el tono del piano
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 6000;
    lowPass.Q.value = 0.5;
    lowPass.connect(noteGain);

    // Slight presence boost
    const presenceEQ = ctx.createBiquadFilter();
    presenceEQ.type = 'peaking';
    presenceEQ.frequency.value = 2500;
    presenceEQ.Q.value = 1;
    presenceEQ.gain.value = 2;
    presenceEQ.connect(lowPass);

    // Piano tiene armónicos más simples y claros
    const harmonics = [
        { harmonic: 1, gain: 1.0, type: 'sine' as OscillatorType },     // Fundamental puro
        { harmonic: 2, gain: 0.6, type: 'sine' as OscillatorType },    // Octava fuerte
        { harmonic: 3, gain: 0.3, type: 'sine' as OscillatorType },    // 5ta + octava
        { harmonic: 4, gain: 0.2, type: 'sine' as OscillatorType },    // 2da octava
        { harmonic: 5, gain: 0.1, type: 'sine' as OscillatorType },    // 3ra mayor
        { harmonic: 6, gain: 0.05, type: 'sine' as OscillatorType },   // Brillo sutil
    ];

    // Envolvente de piano (ataque rápido, decay largo, sin sustain)
    const attackTime = 0.002;   // Muy rápido - hammer hit
    const decayTime = 0.3;      // Decay inicial
    const sustainLevel = 0.5;   // Mid sustain
    const releaseTime = Math.min(0.8, duration * 0.4);

    for (const { harmonic, gain, type } of harmonics) {
        const osc = ctx.createOscillator();
        const harmonicGain = ctx.createGain();

        osc.type = type;
        osc.frequency.value = frequency * harmonic;

        // Envolvente ADSR para piano
        const harmonicVolume = volume * gain;
        harmonicGain.gain.setValueAtTime(0, startTime);

        // Attack - pico inicial del martillo
        harmonicGain.gain.linearRampToValueAtTime(
            harmonicVolume * 1.5,
            startTime + attackTime
        );

        // Decay to sustain
        harmonicGain.gain.exponentialRampToValueAtTime(
            Math.max(harmonicVolume * sustainLevel, 0.001),
            startTime + attackTime + decayTime
        );

        // Hold sustain con decay natural gradual
        harmonicGain.gain.exponentialRampToValueAtTime(
            Math.max(harmonicVolume * sustainLevel * 0.6, 0.001),
            startTime + duration - releaseTime
        );

        // Release
        harmonicGain.gain.exponentialRampToValueAtTime(
            0.001,
            startTime + duration
        );

        osc.connect(harmonicGain);
        harmonicGain.connect(presenceEQ);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);

        oscillators.push(osc);
        gains.push(harmonicGain);
    }

    // Añadir un toque de "hammer noise" muy sutil para realismo
    const hammerGain = ctx.createGain();
    const hammerFilter = ctx.createBiquadFilter();
    hammerFilter.type = 'highpass';
    hammerFilter.frequency.value = 4000;
    hammerFilter.Q.value = 1;

    const hammerOsc = ctx.createOscillator();
    hammerOsc.type = 'triangle';
    hammerOsc.frequency.value = frequency * 8; // Alta frecuencia para "clic"

    hammerGain.gain.setValueAtTime(volume * 0.08, startTime);
    hammerGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.02);

    hammerOsc.connect(hammerFilter);
    hammerFilter.connect(hammerGain);
    hammerGain.connect(presenceEQ);

    hammerOsc.start(startTime);
    hammerOsc.stop(startTime + 0.03);
    oscillators.push(hammerOsc);
    gains.push(hammerGain);

    return { oscillators, gains };
}

/**
 * Crea un tono usando el instrumento seleccionado
 */
function createTone(
    frequency: number,
    startTime: number,
    duration: number,
    volume: number,
    instrument: InstrumentType = 'piano'
): { oscillators: OscillatorNode[]; gains: GainNode[] } {
    if (instrument === 'guitar') {
        return createBrightGuitarTone(frequency, startTime, duration, volume);
    }
    return createPianoTone(frequency, startTime, duration, volume);
}

// ============================================================================
// Playback Functions
// ============================================================================

let currentPlayer: AudioPlayer | null = null;
const allOscillators: OscillatorNode[] = [];
const allGains: GainNode[] = [];

/**
 * Reproduce un acorde (array de notas)
 */
export function playChord(
    notes: string[],
    options: PlaybackOptions = {}
): void {
    const { noteDuration = 2, volume = 0.6 } = options;

    const ctx = getAudioContext();
    const startTime = ctx.currentTime;

    // Volumen por nota basado en número de notas (menos agresivo)
    const volumePerNote = volume / (notes.length * 0.6);

    for (const note of notes) {
        const freq = getFrequency(note);
        if (freq > 0) {
            const { oscillators, gains } = createBrightGuitarTone(
                freq,
                startTime,
                noteDuration,
                volumePerNote
            );
            allOscillators.push(...oscillators);
            allGains.push(...gains);
        }
    }
}

/**
 * Reproduce un acorde como arpegio con strum realista
 */
export function playArpeggio(
    notes: string[],
    options: PlaybackOptions = {}
): void {
    const { noteDuration = 2, volume = 0.6 } = options;

    const ctx = getAudioContext();
    const startTime = ctx.currentTime;

    // Strum delay más rápido y natural
    const strumDuration = 0.06; // 60ms para el strum completo
    const noteDelay = strumDuration / notes.length;

    const volumePerNote = volume / (notes.length * 0.6);

    // Reproducir desde el bajo (última cuerda) hacia el agudo
    const reversedNotes = [...notes].reverse();

    for (let i = 0; i < reversedNotes.length; i++) {
        const note = reversedNotes[i];
        const freq = getFrequency(note);
        if (freq > 0) {
            // Ligera variación de volumen para simular strum natural
            const strumVolume = volumePerNote * (0.9 + Math.random() * 0.2);

            const { oscillators, gains } = createBrightGuitarTone(
                freq,
                startTime + i * noteDelay,
                noteDuration - i * noteDelay,
                strumVolume
            );
            allOscillators.push(...oscillators);
            allGains.push(...gains);
        }
    }
}

/**
 * Reproduce una progresión completa
 */
export function playProgression(
    chordNotes: string[][],
    options: PlaybackOptions = {}
): AudioPlayer {
    const {
        bpm = 72,
        volume = 0.65,
        arpeggio = true,
        instrument = 'piano',
        arpeggioSpeed = 'medium'
    } = options;

    const beatDuration = 60 / bpm;
    const chordDuration = beatDuration * 4; // 4 beats por compás

    // Detener reproducción anterior
    if (currentPlayer?.isPlaying) {
        currentPlayer.stop();
    }

    // Limpiar arrays anteriores
    allOscillators.length = 0;
    allGains.length = 0;

    const ctx = getAudioContext();
    const startTime = ctx.currentTime + 0.1; // Pequeño delay para evitar clicks

    let isPlaying = true;

    // Calcular duración del arpegio según velocidad
    // 'slow' permite escuchar cada nota claramente, 'fast' es casi simultáneo
    const arpeggioTiming = {
        fast: 0.08,   // 80ms - casi simultáneo (strum de guitarra)
        medium: 0.25, // 250ms - cada nota distinguible
        slow: 0.5     // 500ms - muy lento, cada nota muy clara
    };
    const strumDuration = arpeggioTiming[arpeggioSpeed];

    // Programar todos los acordes
    for (let i = 0; i < chordNotes.length; i++) {
        const chord = chordNotes[i];
        const chordStartTime = startTime + i * chordDuration;

        // Volumen ligeramente reducido para mezcla limpia
        const volumePerNote = volume / (chord.length * 0.5);

        if (arpeggio) {
            // Arpegio con velocidad configurable
            const noteDelay = strumDuration / Math.max(chord.length - 1, 1);
            const reversedChord = [...chord].reverse(); // Desde el bajo

            for (let j = 0; j < reversedChord.length; j++) {
                const note = reversedChord[j];
                const freq = getFrequency(note);
                if (freq > 0 && isPlaying) {
                    // Volumen ligeramente más fuerte para arpegios lentos
                    const arpVolume = arpeggioSpeed === 'slow'
                        ? volumePerNote * 1.3
                        : volumePerNote * (0.85 + Math.random() * 0.15);

                    createTone(
                        freq,
                        chordStartTime + j * noteDelay,
                        chordDuration - j * noteDelay - 0.2,
                        arpVolume,
                        instrument
                    );
                }
            }
        } else {
            // Acordes simultáneos
            for (const note of chord) {
                const freq = getFrequency(note);
                if (freq > 0 && isPlaying) {
                    createTone(
                        freq,
                        chordStartTime,
                        chordDuration - 0.2,
                        volumePerNote,
                        instrument
                    );
                }
            }
        }
    }

    // Crear player controller
    const player: AudioPlayer = {
        isPlaying: true,
        currentIndex: 0,
        stop: () => {
            isPlaying = false;
            player.isPlaying = false;

            // Fade out rápido en lugar de corte abrupto
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            for (const gain of allGains) {
                try {
                    gain.gain.cancelScheduledValues(now);
                    gain.gain.setValueAtTime(gain.gain.value, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                } catch (e) {
                    // Ignorar
                }
            }

            // Detener osciladores después del fade
            setTimeout(() => {
                for (const osc of allOscillators) {
                    try {
                        osc.stop();
                    } catch (e) {
                        // Ignorar si ya detenido
                    }
                }
            }, 150);
        }
    };

    // Auto-stop cuando termine
    const totalDuration = chordNotes.length * chordDuration * 1000;
    setTimeout(() => {
        player.isPlaying = false;
    }, totalDuration + 500);

    currentPlayer = player;
    return player;
}

/**
 * Detiene la reproducción actual
 */
export function stopPlayback(): void {
    if (currentPlayer?.isPlaying) {
        currentPlayer.stop();
    }
}

/**
 * Verifica si hay audio reproduciéndose
 */
export function isPlaying(): boolean {
    return currentPlayer?.isPlaying ?? false;
}

/**
 * Establece el volumen master
 */
export function setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const { gain } = getMasterChain();
    gain.gain.value = clampedVolume;
}
