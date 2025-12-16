import { Note, Interval, Chord } from "@tonaljs/tonal";

// ============================================================================
// Types
// ============================================================================

export interface AdjacentInterval {
    fromString: number;      // 0-indexed string number
    toString: number;
    fromNote: string;        // e.g., "E4"
    toNote: string;          // e.g., "B3"
    interval: string;        // e.g., "4P"
    intervalName: string;    // e.g., "Perfect Fourth"
    quality: 'stable' | 'tense' | 'open' | 'bright' | 'dark';
    semitones: number;
}

export interface TuningMood {
    primary: string;         // e.g., "Cinematográfico"
    secondary: string[];     // e.g., ["Ethereal", "Ambient"]
    description: string;     // Extended description
    color: string;           // Tailwind color class
}

export interface TuningDashboardAnalysis {
    openChordName: string | null;     // "Open Fmaj9" or null
    isOpenTuning: boolean;
    adjacentIntervals: AdjacentInterval[];
    mood: TuningMood;
    characteristics: string[];
    totalRange: string;               // e.g., "E2 - E4 (2 octaves)"
}

// ============================================================================
// Interval Names & Qualities
// ============================================================================

const INTERVAL_NAMES: Record<string, string> = {
    "1P": "Unísono",
    "2m": "Segunda menor",
    "2M": "Segunda mayor",
    "3m": "Tercera menor",
    "3M": "Tercera mayor",
    "4P": "Cuarta justa",
    "4A": "Cuarta aumentada",
    "5d": "Quinta disminuida",
    "5P": "Quinta justa",
    "5A": "Quinta aumentada",
    "6m": "Sexta menor",
    "6M": "Sexta mayor",
    "7m": "Séptima menor",
    "7M": "Séptima mayor",
    "8P": "Octava",
};

const INTERVAL_QUALITIES: Record<string, AdjacentInterval['quality']> = {
    "1P": "stable",
    "2m": "tense",
    "2M": "bright",
    "3m": "dark",
    "3M": "bright",
    "4P": "stable",
    "4A": "tense",
    "5d": "tense",
    "5P": "stable",
    "5A": "tense",
    "6m": "dark",
    "6M": "bright",
    "7m": "dark",
    "7M": "bright",
    "8P": "open",
};

// ============================================================================
// Mood Classification
// ============================================================================

interface MoodPattern {
    name: string;
    secondary: string[];
    description: string;
    color: string;
    matches: (intervals: string[], notes: string[], chordName: string | null) => boolean;
}

const MOOD_PATTERNS: MoodPattern[] = [
    {
        name: "Cinematográfico",
        secondary: ["Épico", "Atmospheric"],
        description: "Afinación con sonoridad amplia y resonante, ideal para texturas orquestales y paisajes sonoros.",
        color: "indigo",
        matches: (intervals, notes, chord) => {
            const hasMaj9 = chord?.includes("maj9") || chord?.includes("Maj9") || chord?.includes("add9");
            const hasOpenFifths = intervals.filter(i => i === "5P").length >= 2;
            return hasMaj9 || hasOpenFifths;
        }
    },
    {
        name: "Jazzy",
        secondary: ["Sofisticado", "Neo-Soul"],
        description: "Intervalos complejos que sugieren armonías extendidas y modulaciones cromáticas.",
        color: "amber",
        matches: (intervals, notes, chord) => {
            const has7th = chord?.includes("7") || chord?.includes("maj7") || chord?.includes("m7");
            const hasMinorIntervals = intervals.filter(i => i.includes("m") || i.includes("M")).length >= 2;
            return has7th || hasMinorIntervals;
        }
    },
    {
        name: "Folk / Acústico",
        secondary: ["Íntimo", "Orgánico"],
        description: "Sonoridad cálida con cuartas y quintas que permiten melodías abiertas.",
        color: "emerald",
        matches: (intervals, notes, chord) => {
            const sus = chord?.includes("sus");
            const fourths = intervals.filter(i => i === "4P").length;
            return sus || fourths >= 3;
        }
    },
    {
        name: "Midwest Emo",
        secondary: ["Nostálgico", "Twinkly"],
        description: "Afinación característica con 9nas y tensiones que evocan melancolía y nostalgia.",
        color: "rose",
        matches: (intervals, notes, chord) => {
            const has9 = chord?.includes("9") || chord?.includes("add9");
            const hasSus = chord?.includes("sus");
            return !!(has9 || (hasSus && intervals.some(i => i === "2M")));
        }
    },
    {
        name: "Dark / Tenso",
        secondary: ["Oscuro", "Disonante"],
        description: "Intervalos menores y disonantes que crean una atmósfera tensa e inquietante.",
        color: "slate",
        matches: (intervals) => {
            const tenseIntervals = intervals.filter(i =>
                i === "2m" || i === "7m" || i === "4A" || i === "5d"
            ).length;
            return tenseIntervals >= 2;
        }
    },
    {
        name: "Open / Drone",
        secondary: ["Meditativo", "Ambient"],
        description: "Afinación con muchos unísonos u octavas, ideal para drones y texturas minimalistas.",
        color: "cyan",
        matches: (intervals) => {
            const openIntervals = intervals.filter(i => i === "1P" || i === "8P" || i === "5P").length;
            return openIntervals >= 3;
        }
    },
    {
        name: "Experimental",
        secondary: ["Avant-garde", "Math Rock"],
        description: "Combinación inusual de intervalos que desafía las convenciones armónicas.",
        color: "purple",
        matches: () => true // Fallback
    }
];

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Calculate intervals between adjacent strings
 */
export function calculateAdjacentIntervals(tuningNotes: string[]): AdjacentInterval[] {
    const intervals: AdjacentInterval[] = [];

    for (let i = 0; i < tuningNotes.length - 1; i++) {
        const fromNote = tuningNotes[i];
        const toNote = tuningNotes[i + 1];

        // Calculate interval (from higher string to lower string)
        const dist = Interval.distance(toNote, fromNote);
        const simplified = Interval.simplify(dist);
        const semitones = Interval.semitones(dist) || 0;

        intervals.push({
            fromString: i,
            toString: i + 1,
            fromNote,
            toNote,
            interval: simplified,
            intervalName: INTERVAL_NAMES[simplified] || simplified,
            quality: INTERVAL_QUALITIES[simplified] || 'stable',
            semitones: Math.abs(semitones)
        });
    }

    return intervals;
}

/**
 * Detect if the tuning forms an open chord
 * Only returns a chord name if it's a "clean" open tuning with 3-4 unique pitch classes
 * forming a simple, recognizable chord (triads, 7ths, sus chords)
 */
export function detectOpenChord(tuningNotes: string[]): string | null {
    if (tuningNotes.length < 3) return null;

    // Get unique pitch classes
    const pitchClasses = [...new Set(tuningNotes.map(n => Note.pitchClass(n)))];

    // Open tunings typically have 3-4 unique notes
    // If there are 5+ unique notes, it's likely not a clean open tuning
    if (pitchClasses.length > 4) return null;

    // Detect chord from pitch classes
    const detected = Chord.detect(pitchClasses);
    if (detected.length === 0) return null;

    // Filter out slash chords and get the simplest chord name
    const cleanChords = detected.filter(c => !c.includes("/"));
    const chordName = cleanChords[0] || detected[0];

    // Only accept "clean" chord types for open tunings
    const cleanChordTypes = [
        '', 'm', 'sus2', 'sus4', '7', 'maj7', 'm7',
        'add9', 'madd9', '6', 'm6', 'dim', 'aug'
    ];

    const chord = Chord.get(chordName);
    const chordType = chord.type || '';

    // Check if this is a simple, recognizable chord type
    const isCleanType = cleanChordTypes.some(ct =>
        chordType === ct || chordType.startsWith(ct + ' ')
    );

    if (!isCleanType) return null;

    // Check if the chord notes cover most of our pitch classes
    // This ensures the detected chord actually matches the tuning
    const chordNotes = chord.notes || [];
    const coverage = chordNotes.filter(n => pitchClasses.includes(n)).length;

    // Require high coverage for a valid open tuning
    if (coverage < pitchClasses.length - 1) return null;

    return `Open ${chordName}`;
}


/**
 * Determine if this is truly an "open" tuning
 */
export function isOpenTuning(tuningNotes: string[]): boolean {
    const pitchClasses = [...new Set(tuningNotes.map(n => Note.pitchClass(n)))];

    // An open tuning typically has fewer unique notes (3-4) forming a clean chord
    if (pitchClasses.length > 5) return false;

    const detected = Chord.detect(pitchClasses);
    if (detected.length === 0) return false;

    // Check if the detected chord covers most/all pitch classes
    const chord = Chord.get(detected[0]);
    const coverage = chord.notes.filter(n => pitchClasses.includes(n)).length;

    return coverage >= pitchClasses.length - 1;
}

/**
 * Get the mood/character of the tuning
 */
export function getTuningMood(
    tuningNotes: string[],
    adjacentIntervals: AdjacentInterval[],
    openChord: string | null
): TuningMood {
    const intervals = adjacentIntervals.map(i => i.interval);

    for (const pattern of MOOD_PATTERNS) {
        if (pattern.matches(intervals, tuningNotes, openChord)) {
            return {
                primary: pattern.name,
                secondary: pattern.secondary,
                description: pattern.description,
                color: pattern.color
            };
        }
    }

    // Fallback (should not reach due to Experimental pattern)
    const fallback = MOOD_PATTERNS[MOOD_PATTERNS.length - 1];
    return {
        primary: fallback.name,
        secondary: fallback.secondary,
        description: fallback.description,
        color: fallback.color
    };
}

/**
 * Get tuning characteristics based on intervals
 */
export function getTuningCharacteristics(adjacentIntervals: AdjacentInterval[]): string[] {
    const characteristics: string[] = [];

    const qualities = adjacentIntervals.map(i => i.quality);
    const intervals = adjacentIntervals.map(i => i.interval);

    // Analyze qualities distribution
    const stableCount = qualities.filter(q => q === 'stable').length;
    const tenseCount = qualities.filter(q => q === 'tense').length;
    const brightCount = qualities.filter(q => q === 'bright').length;
    const darkCount = qualities.filter(q => q === 'dark').length;

    if (stableCount >= qualities.length / 2) characteristics.push("Estable");
    if (tenseCount >= 2) characteristics.push("Tenso");
    if (brightCount >= 2) characteristics.push("Brillante");
    if (darkCount >= 2) characteristics.push("Oscuro");

    // Check for specific patterns
    if (intervals.includes("5P")) characteristics.push("Amplio");
    if (intervals.filter(i => i === "4P").length >= 3) characteristics.push("Cuartal");
    if (intervals.includes("2M") || intervals.includes("2m")) characteristics.push("Melódico");
    if (intervals.includes("8P")) characteristics.push("Resonante");

    return characteristics.length > 0 ? characteristics : ["Equilibrado"];
}

/**
 * Calculate total range of the tuning
 */
export function getTuningRange(tuningNotes: string[]): string {
    const sorted = [...tuningNotes].sort((a, b) => {
        const midiA = Note.midi(a) || 0;
        const midiB = Note.midi(b) || 0;
        return midiA - midiB;
    });

    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];

    const midiLow = Note.midi(lowest) || 0;
    const midiHigh = Note.midi(highest) || 0;
    const semitones = midiHigh - midiLow;
    const octaves = Math.floor(semitones / 12);
    const remaining = semitones % 12;

    let rangeStr = `${lowest} - ${highest}`;
    if (octaves > 0) {
        rangeStr += ` (${octaves} octava${octaves > 1 ? 's' : ''}`;
        if (remaining > 0) rangeStr += ` + ${remaining} st`;
        rangeStr += ")";
    }

    return rangeStr;
}

/**
 * Main function: Analyze entire tuning for dashboard display
 * @param tuningNotes - Array of note strings (e.g., ["E4", "B3", "G3", "D3", "A2", "E2"])
 * @param externalChordName - Optional: chord name from external analysis (e.g., from harmonic analysis)
 */
export function analyzeTuningForDashboard(
    tuningNotes: string[],
    externalChordName?: string | null
): TuningDashboardAnalysis {
    const adjacentIntervals = calculateAdjacentIntervals(tuningNotes);

    // Always use the chord name from harmonic analysis if available
    let openChordName: string | null = null;
    let isOpen = false;

    if (externalChordName) {
        // Check if it's a "simple" open tuning chord to determine isOpen flag
        const simpleChordPatterns = [
            /^[A-G][#b]?$/,           // Major: C, D#, Gb
            /^[A-G][#b]?m$/,          // Minor: Cm, D#m
            /^[A-G][#b]?sus[24]$/,    // Sus: Csus2, Dsus4
            /^[A-G][#b]?5$/,          // Power: C5
        ];

        isOpen = simpleChordPatterns.some(pattern => pattern.test(externalChordName));

        // Always show the chord name, prefix with "Open " only for simple triads
        if (isOpen) {
            openChordName = `Open ${externalChordName}`;
        } else {
            // For complex chords, just show the chord name directly
            openChordName = externalChordName;
        }
    } else {
        // Fallback to internal detection
        openChordName = detectOpenChord(tuningNotes);
        isOpen = isOpenTuning(tuningNotes);
    }

    const mood = getTuningMood(tuningNotes, adjacentIntervals, openChordName);
    const characteristics = getTuningCharacteristics(adjacentIntervals);
    const totalRange = getTuningRange(tuningNotes);

    return {
        openChordName,
        isOpenTuning: isOpen,
        adjacentIntervals,
        mood,
        characteristics,
        totalRange
    };
}

