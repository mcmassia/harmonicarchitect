export interface Note {
    name: string;      // e.g., "C"
    octave: number;    // e.g., 4
    scientific: string; // e.g., "C4"
    midi: number;      // e.g., 60
    frequency: number; // e.g., 261.63
}

export interface StringConfig {
    index: number;     // 0 is the highest string (usually), or we can decide convention.
    // Convention: 0 = High E (thinnest), N = Low string (thickest)?
    // Let's stick to standard array order: 0 = String 1 (High), N = String N (Low).
    // But typical tuning strings are listed High to Low or Low to High?
    // usually "E A D G B E" is Low to High (6->1). 
    // Let's store as an array where index 0 is the lowest string (6th/7th/8th) or the highest?
    // Tonal usually works with notes.
    // Let's clarify: `strings: Note[]`.
    // If visualizer is top-down (high string at top), index 0 = high string?
    // Let's decide: Strings array is ordered from HIGH pitch (string 1) to LOW pitch (string N).
    note: Note;
    gauge?: number;    // inches, e.g., 0.010
    unitWeight?: number; // lbs/inch
    tension?: number;  // lbs
}

export interface Tuning {
    id?: string;
    name: string;
    strings: Note[]; // Ordered String 1 (High) -> String N (Low)
    scaleLength: number; // inches
    description?: string;
    tags?: string[];
}

export interface ChordAnalysis {
    chordName: string;
    root: string;
    intervals: string[];
    notes: string[];
    quality: string;
}

export interface StringGroupAnalysis {
    stringIndices: number[]; // e.g., [1, 2, 3] (0-indexed)
    notes: string[];
    intervals: string[];
    chordName: string;
    emotionalTag: string;
}

export interface EmotionProfile {
    tag: string;
    description: string;
    color: string; // Tailwind class or hex
}
