import { create } from 'zustand';
import { StringGroupAnalysis, MarkedPosition } from '@/types/music';
import { analyzeMarkedNotes } from '@/lib/music/analysis';
import { Note } from "@tonaljs/tonal";

interface MarkedNotesState {
    // Mode for identifying notes:
    // 'note' = select "A", all A's on fretboard light up
    // 'position' = select specific string/fret
    selectionMode: 'note' | 'position';

    // Set of pitch classes marked by user (e.g., "C", "E", "G") - Used in 'note' mode
    markedNotes: string[];

    // Set of specific positions marked by user - Used in 'position' mode
    markedPositions: MarkedPosition[];

    // Analysis results - one per possible root
    analysis: StringGroupAnalysis[];

    // Interactive mode toggle
    isInteractiveMode: boolean;

    // Selected tonic for diagrams or visual reference
    tonic: string | null;

    // Custom colors for notes or positions
    noteColors: Record<string, string>;

    // Active diagram ID if we are editing an existing diagram
    activeDiagramId: string | null;

    // View Options
    showIntervals: boolean;

    // Actions
    setSelectionMode: (mode: 'note' | 'position') => void;
    setShowIntervals: (show: boolean) => void;
    toggleNote: (pitchClass: string) => void;
    togglePosition: (stringIndex: number, fretIndex: number, note: string) => void;
    setTonic: (note: string | null) => void;
    setNoteColor: (noteOrPositionId: string, color: string) => void;
    setNoteColors: (colors: Record<string, string>) => void;
    setActiveDiagramId: (id: string | null) => void;
    clearNotes: () => void;
    setInteractiveMode: (enabled: boolean) => void;
}

export const useMarkedNotesStore = create<MarkedNotesState>((set, get) => ({
    selectionMode: 'note',
    markedNotes: [],
    markedPositions: [],
    analysis: [],
    tonic: null,
    noteColors: {},
    activeDiagramId: null,
    isInteractiveMode: false,
    showIntervals: false,

    setSelectionMode: (mode) => {
        set((state) => {
            // Keep the previous mode state internally, but toggle off if explicitly requested
            return {
                selectionMode: mode,
                markedNotes: [],
                markedPositions: [],
                analysis: [],
                tonic: null,
                noteColors: {},
                activeDiagramId: null
            };
        });
    },

    setShowIntervals: (show) => {
        set({ showIntervals: show });
    },

    toggleNote: (pitchClass: string) => {
        const { markedNotes, selectionMode } = get();

        // Safety check
        if (selectionMode !== 'note') return;

        let newNotes: string[];

        if (markedNotes.includes(pitchClass)) {
            // Remove note
            newNotes = markedNotes.filter(n => n !== pitchClass);
        } else {
            // Add note
            newNotes = [...markedNotes, pitchClass];
        }

        // Re-analyze with new notes
        const analysis = newNotes.length >= 2 ? analyzeMarkedNotes(newNotes) : [];

        set({ markedNotes: newNotes, analysis });
    },

    togglePosition: (stringIndex: number, fretIndex: number, note: string) => {
        const { markedPositions, selectionMode } = get();

        // Safety check
        if (selectionMode !== 'position') return;

        const exists = markedPositions.some(p =>
            p.stringIndex === stringIndex && p.fretIndex === fretIndex
        );

        let newPositions: MarkedPosition[];

        if (exists) {
            newPositions = markedPositions.filter(p =>
                !(p.stringIndex === stringIndex && p.fretIndex === fretIndex)
            );
        } else {
            newPositions = [...markedPositions, { stringIndex, fretIndex, note }];
        }

        // Extract unique notes for analysis
        // If we want inversions, we need specific pitches (e.g. C3, E3), not just classes.
        // Sort by MIDI to ensure bass note is first for inversion detection if we treated array as ordered?
        // Actually analyzeMarkedNotes handles sorting. But we must pass "C3", not "C".
        const uniqueNotes = Array.from(new Set(
            newPositions.map(p => p.note) // Pass full note including octave
        )).sort((a, b) => {
            const midiA = Note.midi(a) || 0;
            const midiB = Note.midi(b) || 0;
            return midiA - midiB;
        });

        // Re-analyze
        const analysis = uniqueNotes.length >= 2
            ? analyzeMarkedNotes(uniqueNotes)
            : [];

        set({ markedPositions: newPositions, analysis });
    },

    setTonic: (note: string | null) => {
        set({ tonic: note });
    },

    setNoteColor: (noteOrPositionId: string, color: string) => {
        set((state) => ({
            noteColors: { ...state.noteColors, [noteOrPositionId]: color }
        }));
    },

    setNoteColors: (colors: Record<string, string>) => {
        set({ noteColors: colors });
    },

    setActiveDiagramId: (id: string | null) => {
        set({ activeDiagramId: id });
    },

    clearNotes: () => {
        set({ markedNotes: [], markedPositions: [], analysis: [], tonic: null, noteColors: {}, activeDiagramId: null });
    },

    setInteractiveMode: (enabled: boolean) => {
        set({ isInteractiveMode: enabled });
        // Clear marked notes when exiting interactive mode
        if (!enabled) {
            set({ markedNotes: [], markedPositions: [], analysis: [], tonic: null, noteColors: {}, activeDiagramId: null });
        }
    }
}));
