import { create } from 'zustand';
import { Note, StringConfig, StringGroupAnalysis, Tuning } from '@/types/music';
import { Core, parseNote } from '@/lib/music/core';
import { analyzeBarChords } from '@/lib/music/analysis';
import { calculateTension } from '@/lib/music/tension';

interface TuningState {
    strings: StringConfig[]; // Ordered 0=High to N=Low ? Or usually UI is vertical.
    // Let's adopt strictly: index 0 = Lowest Pitch String (Button on UI), last index = Highest Pitch String (Top).
    // Wait, guitar tabs usually put High E on top.
    // Standard: String 1 = High E. String 6 = Low E.
    // Array: [HighE, B, G, D, A, LowE].
    // So index 0 = String 1 (Highest).
    scaleLength: number;
    analysis: StringGroupAnalysis[];

    // Actions
    updateString: (index: number, note: string) => void;
    updateGauge: (index: number, gauge: number) => void;
    addString: () => void;
    removeString: (index: number) => void;
    setScaleLength: (length: number) => void;
    setPreset: (tuning: Tuning) => void;
}

const DEFAULT_STRINGS = ["E4", "B3", "G3", "D3", "A2", "E2"]; // Standard Tuning (High -> Low)
const DEFAULT_GAUGES = [0.010, 0.013, 0.017, 0.026, 0.036, 0.046];

const createStringConfig = (noteStr: string, index: number, gauge: number, scale: number): StringConfig => {
    const note = parseNote(noteStr);
    if (!note) throw new Error(`Invalid note: ${noteStr}`);

    const tension = calculateTension(gauge, scale, noteStr);

    return {
        index,
        note: {
            name: note.letter,
            octave: note.oct || 0,
            scientific: note.name,
            midi: note.midi || 0,
            frequency: note.freq || 0
        },
        gauge,
        tension
    };
};

export const useTuningStore = create<TuningState>((set, get) => ({
    strings: DEFAULT_STRINGS.map((s, i) => createStringConfig(s, i, DEFAULT_GAUGES[i], 25.5)),
    scaleLength: 25.5,
    analysis: analyzeBarChords(DEFAULT_STRINGS), // Initialize with analysis of default strings

    updateString: (index, noteStr) => {
        const { strings, scaleLength } = get();
        // Validate note
        const n = parseNote(noteStr);
        if (!n) return; // Invalid input, maybe handle UI error state later

        const newStrings = [...strings];
        newStrings[index] = createStringConfig(noteStr, index, strings[index].gauge || 0.010, scaleLength);

        // Re-run analysis
        // Analysis expects array of note strings. 
        // If analysis logic expects High->Low or Low->High matters.
        // Our array is High->Low. `analyzeBarChords` processes adjacent indices.
        const noteNames = newStrings.map(s => s.note.scientific);
        const analysis = analyzeBarChords(noteNames);

        set({ strings: newStrings, analysis });
    },

    updateGauge: (index, gauge) => {
        const { strings, scaleLength } = get();
        const newStrings = [...strings];
        const s = newStrings[index];
        newStrings[index] = createStringConfig(s.note.scientific, index, gauge, scaleLength);
        set({ strings: newStrings });
    },

    addString: () => {
        // Add a lower string by default (e.g. extending range downwards)
        // If current lowest is E2, add B1.
        const { strings, scaleLength } = get();
        const lastString = strings[strings.length - 1];
        // simplistic Logic: go down a fourth
        const newNote = Core.Note.transpose(lastString.note.scientific, "-4P");

        const newIndex = strings.length;
        const newGauge = (lastString.gauge || 0.046) + 0.010; // rough increment

        const newStr = createStringConfig(newNote, newIndex, newGauge, scaleLength);
        const newStrings = [...strings, newStr];

        const noteNames = newStrings.map(s => s.note.scientific);
        set({ strings: newStrings, analysis: analyzeBarChords(noteNames) });
    },

    removeString: (index) => {
        const { strings } = get();
        if (strings.length <= 4) return; // Minimum 4 strings
        const newStrings = strings.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i }));
        const noteNames = newStrings.map(s => s.note.scientific);
        set({ strings: newStrings, analysis: analyzeBarChords(noteNames) });
    },

    setScaleLength: (length) => {
        set({ scaleLength: length });
        // Recalculate tensions
        const { strings } = get();
        const newStrings = strings.map(s => createStringConfig(s.note.scientific, s.index, s.gauge || 0.010, length));
        set({ strings: newStrings });
    },

    setPreset: (tuning: Tuning) => {
        const { scaleLength } = get(); // Keep current scale or use preset's?
        // Use preset scale if defined, else keep user's
        const scale = tuning.scaleLength || scaleLength;

        // Assume tuning.strings is just Note objects, we need internal StringConfig
        // But Tuning interface has `strings: Note[]`.
        // We need gauges. For now, use defaults or interpolate.
        // Let's just reset to defaults for simplicity of this MVP step.
        const newStrings = tuning.strings.map((n, i) => {
            const defaultGauge = DEFAULT_GAUGES[i] || 0.050;
            return createStringConfig(n.scientific, i, defaultGauge, scale);
        });

        const noteNames = newStrings.map(s => s.note.scientific);
        set({ strings: newStrings, scaleLength: scale, analysis: analyzeBarChords(noteNames) });
    }
}));
