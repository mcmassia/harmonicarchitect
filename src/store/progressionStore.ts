"use client";

import { create } from 'zustand';
import {
    Progression,
    ProgressionGenerationOptions,
    AlgorithmOptions,
    DEFAULT_ALGORITHM_OPTIONS,
    generateProgressions,
    generateVoicingsForChord,
    calculateVoiceLeadingScore
} from '@/lib/music/composer';
import { Tablature, generateTablature } from '@/lib/music/tablature';
import { playProgression, stopPlayback, isPlaying as checkIsPlaying } from '@/lib/audio/player';
import { useTuningStore } from './tuningStore';

// ============================================================================
// Types
// ============================================================================

type InstrumentType = 'guitar' | 'piano';
type ArpeggioSpeed = 'fast' | 'medium' | 'slow';

interface ProgressionState {
    // Opciones de generación
    chordCount: number;
    requiredChords: string[];
    continueFromProgression: Progression | null;
    key: string;
    algorithmOptions: AlgorithmOptions;

    // Opciones de reproducción
    instrument: InstrumentType;
    arpeggioSpeed: ArpeggioSpeed;

    // Resultados generados
    generatedProgressions: Progression[];
    selectedProgression: Progression | null;
    currentTablature: Tablature | null;

    // Estado de reproducción
    isPlaying: boolean;

    // Repositorios guardados (se cargan desde Firebase)
    savedProgressions: Progression[];
    savedTablatures: Tablature[];
    isLoading: boolean;

    // Acciones de generación
    setChordCount: (count: number) => void;
    addRequiredChord: (chord: string) => void;
    removeRequiredChord: (chord: string) => void;
    setKey: (key: string) => void;
    setContinueFrom: (progression: Progression | null) => void;

    // Acciones de algoritmo
    setAlgorithmOption: <K extends keyof AlgorithmOptions>(key: K, value: AlgorithmOptions[K]) => void;
    resetAlgorithmOptions: () => void;

    // Acciones de reproducción
    setInstrument: (instrument: InstrumentType) => void;
    setArpeggioSpeed: (speed: ArpeggioSpeed) => void;

    // Acciones principales
    generate: () => void;
    selectProgression: (id: string) => void;
    generateTablatureForSelected: () => void;

    // Reproducción
    playSelected: () => void;
    stopPlaying: () => void;

    // Persistencia
    saveProgression: (progression: Progression) => void;
    saveTablature: (tablature: Tablature) => void;
    deleteProgression: (id: string) => void;
    deleteTablature: (id: string) => void;
    loadFromSaved: (progression: Progression) => void;

    // Edición de acordes
    replaceChordInProgression: (progressionId: string, chordIndex: number, newChordName: string) => void;

    // Estado
    clearGenerated: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const COMMON_KEYS = [
    'C major', 'G major', 'D major', 'A major', 'E major',
    'F major', 'Bb major', 'Eb major',
    'A minor', 'E minor', 'D minor', 'B minor', 'F# minor',
    'C minor', 'G minor'
];

// ============================================================================
// Store
// ============================================================================

export const useProgressionStore = create<ProgressionState>((set, get) => ({
    // Initial state
    chordCount: 4,
    requiredChords: [],
    continueFromProgression: null,
    key: 'C major',
    algorithmOptions: { ...DEFAULT_ALGORITHM_OPTIONS },

    // Playback options
    instrument: 'piano' as InstrumentType,
    arpeggioSpeed: 'medium' as ArpeggioSpeed,

    generatedProgressions: [],
    selectedProgression: null,
    currentTablature: null,

    isPlaying: false,

    savedProgressions: [],
    savedTablatures: [],
    isLoading: false,

    // Generation options
    setChordCount: (count) => {
        set({ chordCount: Math.max(2, Math.min(12, count)) });
    },

    addRequiredChord: (chord) => {
        const { requiredChords, chordCount } = get();
        if (!requiredChords.includes(chord) && requiredChords.length < chordCount) {
            set({ requiredChords: [...requiredChords, chord] });
        }
    },

    removeRequiredChord: (chord) => {
        const { requiredChords } = get();
        set({ requiredChords: requiredChords.filter(c => c !== chord) });
    },

    setKey: (key) => {
        set({ key });
    },

    setContinueFrom: (progression) => {
        set({ continueFromProgression: progression });
    },

    // Algorithm options
    setAlgorithmOption: (key, value) => {
        const { algorithmOptions } = get();
        set({
            algorithmOptions: {
                ...algorithmOptions,
                [key]: value
            }
        });
    },

    // Playback options
    setInstrument: (instrument) => {
        set({ instrument });
    },

    setArpeggioSpeed: (speed) => {
        set({ arpeggioSpeed: speed });
    },

    resetAlgorithmOptions: () => {
        set({ algorithmOptions: { ...DEFAULT_ALGORITHM_OPTIONS } });
    },

    // Main actions
    generate: () => {
        const { chordCount, requiredChords, key, continueFromProgression, algorithmOptions } = get();

        // Get current tuning from tuning store
        const tuningState = useTuningStore.getState();
        const tuning = tuningState.strings.map(s => s.note.scientific);

        const options: ProgressionGenerationOptions = {
            tuning,
            chordCount,
            requiredChords: requiredChords.length > 0 ? requiredChords : undefined,
            continueFrom: continueFromProgression || undefined,
            key,
            resultCount: 5,
            algorithm: algorithmOptions
        };

        const progressions = generateProgressions(options);

        set({
            generatedProgressions: progressions,
            selectedProgression: progressions[0] || null,
            currentTablature: null
        });

        // Auto-generate tablature for first result
        if (progressions[0]) {
            const tablature = generateTablature(progressions[0]);
            set({ currentTablature: tablature });
        }
    },

    selectProgression: (id) => {
        const { generatedProgressions, savedProgressions } = get();
        const all = [...generatedProgressions, ...savedProgressions];
        const progression = all.find(p => p.id === id);

        if (progression) {
            const tablature = generateTablature(progression);
            set({
                selectedProgression: progression,
                currentTablature: tablature
            });
        }
    },

    generateTablatureForSelected: () => {
        const { selectedProgression } = get();
        if (selectedProgression) {
            const tablature = generateTablature(selectedProgression);
            set({ currentTablature: tablature });
        }
    },

    // Playback
    playSelected: () => {
        const { selectedProgression, isPlaying, instrument, arpeggioSpeed } = get();

        if (isPlaying) {
            stopPlayback();
            set({ isPlaying: false });
            return;
        }

        if (!selectedProgression) return;

        // Extraer notas de cada voicing
        const chordNotes = selectedProgression.voicings.map(v =>
            v.notes.filter(n => n !== '')
        );

        playProgression(chordNotes, {
            bpm: 80,
            volume: 0.6,
            arpeggio: true,
            instrument,
            arpeggioSpeed
        });

        set({ isPlaying: true });

        // Auto-stop después de la duración total
        const duration = chordNotes.length * (60 / 80) * 4 * 1000;
        setTimeout(() => {
            set({ isPlaying: false });
        }, duration);
    },

    stopPlaying: () => {
        stopPlayback();
        set({ isPlaying: false });
    },

    // Persistence (local for now, Firebase integration in db.ts)
    saveProgression: (progression) => {
        const { savedProgressions } = get();
        if (!savedProgressions.find(p => p.id === progression.id)) {
            set({ savedProgressions: [...savedProgressions, progression] });
            // TODO: Save to Firebase
        }
    },

    saveTablature: (tablature) => {
        const { savedTablatures } = get();
        if (!savedTablatures.find(t => t.id === tablature.id)) {
            set({ savedTablatures: [...savedTablatures, tablature] });
            // TODO: Save to Firebase
        }
    },

    deleteProgression: (id) => {
        const { savedProgressions } = get();
        set({ savedProgressions: savedProgressions.filter(p => p.id !== id) });
        // TODO: Delete from Firebase
    },

    deleteTablature: (id) => {
        const { savedTablatures } = get();
        set({ savedTablatures: savedTablatures.filter(t => t.id !== id) });
        // TODO: Delete from Firebase
    },

    loadFromSaved: (progression) => {
        // Get current tuning
        const tuningState = useTuningStore.getState();
        const currentTuning = tuningState.strings.map(s => s.note.scientific);

        let loadedProgression = progression;

        // Check if tuning matches
        // Note: checking length and note values
        const isSameTuning = progression.tuning.length === currentTuning.length &&
            progression.tuning.every((note, idx) => note === currentTuning[idx]);

        if (!isSameTuning) {
            console.log("Tuning mismatch, regenerating voicings...");

            // Regenerate voicings for current tuning
            const newVoicings = progression.voicings.map(oldVoicing => {
                const options = generateVoicingsForChord(oldVoicing.chord, currentTuning, 5);
                // Return best voicing or dummy if none found
                return options.length > 0
                    ? { ...options[0], chord: oldVoicing.chord }
                    : {
                        chord: oldVoicing.chord,
                        frets: Array(currentTuning.length).fill(-1),
                        fingers: Array(currentTuning.length).fill(0),
                        ergonomyScore: 0,
                        droneStrings: [],
                        bassNote: '',
                        notes: []
                    };
            });

            // Recalculate scores
            const ergonomyAvg = Math.round(
                newVoicings.reduce((sum, v) => sum + v.ergonomyScore, 0) / newVoicings.length
            );

            let voiceLeadingTotal = 0;
            for (let i = 1; i < newVoicings.length; i++) {
                voiceLeadingTotal += calculateVoiceLeadingScore(newVoicings[i - 1], newVoicings[i]);
            }
            const voiceLeadingScore = newVoicings.length > 1
                ? Math.round(voiceLeadingTotal / (newVoicings.length - 1))
                : 100;

            loadedProgression = {
                ...progression,
                tuning: currentTuning,
                voicings: newVoicings,
                ergonomyAvg,
                voiceLeadingScore
            };
        }

        const tablature = generateTablature(loadedProgression);
        set({
            selectedProgression: loadedProgression,
            currentTablature: tablature,
            continueFromProgression: null // Reset continue mode
        });
    },

    clearGenerated: () => {
        stopPlayback();
        set({
            generatedProgressions: [],
            selectedProgression: null,
            currentTablature: null,
            isPlaying: false
        });
    },

    replaceChordInProgression: (progressionId, chordIndex, newChordName) => {
        const { generatedProgressions, selectedProgression } = get();

        // Get current tuning
        const tuningState = useTuningStore.getState();
        const tuning = tuningState.strings.map(s => s.note.scientific);

        // Generate voicings for the new chord
        const newVoicings = generateVoicingsForChord(newChordName, tuning, 5);
        if (newVoicings.length === 0) return; // No valid voicing found

        const newVoicing = { ...newVoicings[0], chord: newChordName };

        // Update the progression
        const updatedProgressions = generatedProgressions.map(prog => {
            if (prog.id !== progressionId) return prog;

            const updatedVoicings = [...prog.voicings];
            updatedVoicings[chordIndex] = newVoicing;

            // Recalculate scores
            const ergonomyAvg = Math.round(
                updatedVoicings.reduce((sum, v) => sum + v.ergonomyScore, 0) / updatedVoicings.length
            );

            // Recalculate voice leading score
            let voiceLeadingTotal = 0;
            for (let i = 1; i < updatedVoicings.length; i++) {
                voiceLeadingTotal += calculateVoiceLeadingScore(updatedVoicings[i - 1], updatedVoicings[i]);
            }
            const voiceLeadingScore = updatedVoicings.length > 1
                ? Math.round(voiceLeadingTotal / (updatedVoicings.length - 1))
                : 100;

            // Update name
            const newName = updatedVoicings.map(v => v.chord).join(' - ');

            return {
                ...prog,
                voicings: updatedVoicings,
                name: newName,
                ergonomyAvg,
                voiceLeadingScore
            };
        });

        // Find the updated progression
        const updatedProgression = updatedProgressions.find(p => p.id === progressionId);

        set({
            generatedProgressions: updatedProgressions,
            selectedProgression: selectedProgression?.id === progressionId ? updatedProgression : selectedProgression,
            currentTablature: updatedProgression ? generateTablature(updatedProgression) : null
        });
    }
}));

// Export common keys and default options for UI
export { COMMON_KEYS, DEFAULT_ALGORITHM_OPTIONS };
export type { AlgorithmOptions };
