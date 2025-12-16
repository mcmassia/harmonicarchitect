import { create } from 'zustand';
import { StringGroupAnalysis } from '@/types/music';
import { analyzeMarkedNotes } from '@/lib/music/analysis';

interface MarkedNotesState {
    // Set of pitch classes marked by user (e.g., "C", "E", "G")
    markedNotes: string[];
    // Analysis results - one per possible root
    analysis: StringGroupAnalysis[];
    // Interactive mode toggle
    isInteractiveMode: boolean;

    // Actions
    toggleNote: (pitchClass: string) => void;
    clearNotes: () => void;
    setInteractiveMode: (enabled: boolean) => void;
}

export const useMarkedNotesStore = create<MarkedNotesState>((set, get) => ({
    markedNotes: [],
    analysis: [],
    isInteractiveMode: false,

    toggleNote: (pitchClass: string) => {
        const { markedNotes } = get();
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

    clearNotes: () => {
        set({ markedNotes: [], analysis: [] });
    },

    setInteractiveMode: (enabled: boolean) => {
        set({ isInteractiveMode: enabled });
        // Clear marked notes when exiting interactive mode
        if (!enabled) {
            set({ markedNotes: [], analysis: [] });
        }
    }
}));
