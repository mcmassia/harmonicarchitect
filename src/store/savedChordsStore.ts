"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface SavedChord {
    id: string;
    name: string;        // "Am7", "Gadd9", etc.
    // Shape details
    notes: string[];     // Scientific pitch (e.g. ["C3", "E3", "G3"])
    intervals: string[]; // Intervals relative to root
    stringIndices: number[]; // Which strings are used
    root: string;        // Root pitch class
    inversion: string;   // e.g. "Fundamental", "1st Inversion"
    createdAt: Date;
}

interface SavedChordsState {
    savedChords: SavedChord[];

    // Actions
    saveChord: (chordData: any) => void; // Accepts StringGroupAnalysis or string (legacy)
    deleteChord: (id: string) => void;
    isChordSaved: (chordName: string, shapeNotes?: string[]) => boolean;
    clearAllChords: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useSavedChordsStore = create<SavedChordsState>()(
    persist(
        (set, get) => ({
            savedChords: [],

            saveChord: (chordData: any) => {
                const { savedChords } = get();

                // Normalize input
                let newChord: SavedChord;

                if (typeof chordData === 'string') {
                    // Legacy/Simple string support (no shape data)
                    // Check if exists
                    if (savedChords.some(c => c.name === chordData && (!c.notes || c.notes.length === 0))) {
                        return;
                    }
                    newChord = {
                        id: `chord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: chordData,
                        notes: [],
                        intervals: [],
                        stringIndices: [],
                        root: '',
                        inversion: '',
                        createdAt: new Date()
                    };
                } else {
                    // It's a StringGroupAnalysis object
                    const analysis = chordData as any; // Cast locally

                    // Check duplicate by NAME AND NOTES (Strict Shape Identity)
                    // Allows saving "C" and "Em#5" as separate entries even if notes are identical.
                    const isDuplicate = savedChords.some(c =>
                        c.name === analysis.chordName &&
                        c.notes &&
                        c.notes.length === analysis.notes.length &&
                        c.notes.every((n: string, i: number) => n === analysis.notes[i])
                    );

                    if (isDuplicate) return;

                    newChord = {
                        id: `chord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: analysis.chordName,
                        notes: analysis.notes,
                        intervals: analysis.intervals,
                        stringIndices: analysis.stringIndices,
                        root: analysis.root || '',
                        inversion: analysis.inversion || '',
                        createdAt: new Date()
                    };
                }

                set({ savedChords: [...savedChords, newChord] });
            },

            deleteChord: (id: string) => {
                const { savedChords } = get();
                set({ savedChords: savedChords.filter(c => c.id !== id) });
            },

            isChordSaved: (chordName: string, shapeNotes?: string[]) => {
                const { savedChords } = get();

                if (shapeNotes && shapeNotes.length > 0) {
                    // Strict check: Name AND Notes must match
                    return savedChords.some(c =>
                        c.name === chordName &&
                        c.notes &&
                        c.notes.length === shapeNotes.length &&
                        c.notes.every((n, i) => n === shapeNotes[i])
                    );
                }

                // Fallback: check by name only (legacy behavior mostly)
                return savedChords.some(c => c.name === chordName);
            },

            clearAllChords: () => {
                set({ savedChords: [] });
            }
        }),
        {
            name: 'harmonic-architect-saved-chords',
            storage: createJSONStorage(() => localStorage),
            // Serialize dates properly
            partialize: (state) => ({
                savedChords: state.savedChords.map(c => ({
                    ...c,
                    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt
                }))
            }),
            // Deserialize dates back
            onRehydrateStorage: () => (state) => {
                if (state?.savedChords) {
                    state.savedChords = state.savedChords.map(c => ({
                        ...c,
                        createdAt: new Date(c.createdAt as unknown as string)
                    }));
                }
            }
        }
    )
);
