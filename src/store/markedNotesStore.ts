import { create } from 'zustand';
import { StringGroupAnalysis } from '@/types/music';
import { analyzeMarkedNotes } from '@/lib/music/analysis';
import { Note } from "@tonaljs/tonal";

interface MarkedPosition {
    stringIndex: number;
    fretIndex: number;
    note: string;
}

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

    // Actions
    setSelectionMode: (mode: 'note' | 'position') => void;
    toggleNote: (pitchClass: string) => void;
    togglePosition: (stringIndex: number, fretIndex: number, note: string) => void;
    clearNotes: () => void;
    setInteractiveMode: (enabled: boolean) => void;
}

export const useMarkedNotesStore = create<MarkedNotesState>((set, get) => ({
    selectionMode: 'note',
    markedNotes: [],
    markedPositions: [],
    analysis: [],
    isInteractiveMode: false,

    setSelectionMode: (mode) => {
        set({ selectionMode: mode });
        // Optional: clear notes when switching modes?
        // Let's clear to avoid confusion
        get().clearNotes();
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

        // Extract unique pitch classes for analysis
        const uniquePitchClasses = Array.from(new Set(
            newPositions.map(p => Note.pitchClass(p.note))
        )).sort();

        // Re-analyze
        const analysis = uniquePitchClasses.length >= 2
            ? analyzeMarkedNotes(uniquePitchClasses)
            : [];

        set({ markedPositions: newPositions, analysis });
    },

    clearNotes: () => {
        set({ markedNotes: [], markedPositions: [], analysis: [] });
    },

    setInteractiveMode: (enabled: boolean) => {
        set({ isInteractiveMode: enabled });
        // Clear marked notes when exiting interactive mode
        if (!enabled) {
            set({ markedNotes: [], markedPositions: [], analysis: [] });
        }
    }
}));
