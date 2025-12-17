"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface SavedChord {
    id: string;
    name: string;        // "Am7", "Gadd9", etc. - Just the chord name, tuning-independent
    createdAt: Date;
}

interface SavedChordsState {
    savedChords: SavedChord[];

    // Actions
    saveChord: (chordName: string) => void;
    deleteChord: (id: string) => void;
    isChordSaved: (chordName: string) => boolean;
    clearAllChords: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useSavedChordsStore = create<SavedChordsState>()(
    persist(
        (set, get) => ({
            savedChords: [],

            saveChord: (chordName: string) => {
                const { savedChords } = get();

                // Don't save duplicates
                if (savedChords.some(c => c.name === chordName)) {
                    return;
                }

                const newChord: SavedChord = {
                    id: `chord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: chordName,
                    createdAt: new Date()
                };

                set({ savedChords: [...savedChords, newChord] });
            },

            deleteChord: (id: string) => {
                const { savedChords } = get();
                set({ savedChords: savedChords.filter(c => c.id !== id) });
            },

            isChordSaved: (chordName: string) => {
                const { savedChords } = get();
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
