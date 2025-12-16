"use client";

import { create } from 'zustand';
import { Chord, Scale, Note } from '@tonaljs/tonal';

// All chromatic notes as root options
const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Common chord types to display (filtered from Chord.names())
const CHORD_TYPES = [
    '', // major
    'm', // minor
    '7',
    'M7', // maj7
    'm7',
    'dim',
    'dim7',
    'aug',
    'sus2',
    'sus4',
    '7sus4',
    'add9',
    'madd9',
    'm7b5',
    '9',
    'm9',
    'M9',
    '11',
    '13',
];

// Common scale types to display (filtered from Scale.names())
const SCALE_TYPES = [
    'major',
    'minor',
    'dorian',
    'phrygian',
    'lydian',
    'mixolydian',
    'locrian',
    'harmonic minor',
    'melodic minor',
    'major pentatonic',
    'minor pentatonic',
    'blues',
    'whole tone',
    'diminished',
    'chromatic',
];

interface ChordScaleState {
    // Selection state
    selectedRoot: string;
    selectedChordType: string | null;
    selectedScaleType: string | null;
    isChordScaleMode: boolean;

    // Computed notes (pitch classes)
    chordNotes: string[];
    scaleNotes: string[];

    // Static data
    rootNotes: string[];
    chordTypes: string[];
    scaleTypes: string[];

    // Actions
    setRoot: (root: string) => void;
    setChordType: (type: string | null) => void;
    setScaleType: (type: string | null) => void;
    setChordScaleMode: (enabled: boolean) => void;
    clearSelections: () => void;
}

const getChordNotes = (root: string, chordType: string | null): string[] => {
    if (!chordType && chordType !== '') return [];
    const chordName = root + chordType;
    const chord = Chord.get(chordName);
    if (!chord || chord.empty) return [];
    return chord.notes.map(n => Note.pitchClass(n));
};

const getScaleNotes = (root: string, scaleType: string | null): string[] => {
    if (!scaleType) return [];
    const scaleName = `${root} ${scaleType}`;
    const scale = Scale.get(scaleName);
    if (!scale || scale.empty) return [];
    return scale.notes.map(n => Note.pitchClass(n));
};

export const useChordScaleStore = create<ChordScaleState>((set, get) => ({
    // Initial state
    selectedRoot: 'C',
    selectedChordType: null,
    selectedScaleType: null,
    isChordScaleMode: false,
    chordNotes: [],
    scaleNotes: [],

    // Static lists
    rootNotes: ROOT_NOTES,
    chordTypes: CHORD_TYPES,
    scaleTypes: SCALE_TYPES,

    // Actions
    setRoot: (root) => {
        const { selectedChordType, selectedScaleType } = get();
        set({
            selectedRoot: root,
            chordNotes: getChordNotes(root, selectedChordType),
            scaleNotes: getScaleNotes(root, selectedScaleType),
        });
    },

    setChordType: (type) => {
        const { selectedRoot } = get();
        set({
            selectedChordType: type,
            chordNotes: getChordNotes(selectedRoot, type),
        });
    },

    setScaleType: (type) => {
        const { selectedRoot } = get();
        set({
            selectedScaleType: type,
            scaleNotes: getScaleNotes(selectedRoot, type),
        });
    },

    setChordScaleMode: (enabled) => {
        set({ isChordScaleMode: enabled });
        if (!enabled) {
            // Clear selections when exiting mode
            set({
                selectedChordType: null,
                selectedScaleType: null,
                chordNotes: [],
                scaleNotes: [],
            });
        }
    },

    clearSelections: () => {
        set({
            selectedChordType: null,
            selectedScaleType: null,
            chordNotes: [],
            scaleNotes: [],
        });
    },
}));

// Helper to get chord display name
export const getChordDisplayName = (root: string, type: string | null): string => {
    if (type === null) return '';
    if (type === '') return `${root} Major`;
    return `${root}${type}`;
};

// Helper to get scale display name
export const getScaleDisplayName = (root: string, type: string | null): string => {
    if (!type) return '';
    return `${root} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
};
