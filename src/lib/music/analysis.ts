import { Note, Chord, Interval } from "@tonaljs/tonal";
import { StringGroupAnalysis } from "@/types/music";

function getEmotionalTag(chordName: string, intervals: string[]): string {
    const name = chordName || "";
    const isInversion = name.includes("/");

    // User Specific Flavors
    if (name.includes("root") || name.includes("G7sus4")) return "Tension Dominante / Bluesy / Funk";
    if (name.includes("sus4")) return "Abierto / Folk / Espiritual";
    if (name.includes("sus2")) return "Soñador / Nostálgico / Moderno";

    if (name.includes("Maj9") || name.includes("add9")) return "Nostalgic / Midwest Emo";
    if (name.includes("m9") || name.includes("m11")) return "Deep / Neo-Soul";
    if (name.includes("sus")) return "Ethereal / Soundscape";
    if (name.includes("dim") || name.includes("b5")) return "Tense / Dark";
    if (isInversion && intervals.includes("3m")) return "Dramatic / Romantic (Minor Inv)";
    if (isInversion && intervals.includes("3M")) return "Warm / Pastoral (Major Inv)";
    if (name.includes("Maj7")) return "Dreamy / Jazz";
    if (name.includes("m7")) return "Elegant / Lo-Fi";

    return "Experimental";
}

export function analyzeBarChords(tuningNotes: string[]): StringGroupAnalysis[] {
    // User-specified string groups:
    // - 1, 2, 3
    // - 1, 2, 3, 4
    // - 1, 2, 3, 4, 5
    // - 1, 2, 3, 4, 5, 6
    // - For >6 strings: 1, 2, 3, 4, 5, 6, 7

    const results: StringGroupAnalysis[] = [];
    const numStrings = tuningNotes.length;

    // Generate groups starting from string 1 (index 0)
    // Each group grows by 1 string, minimum 3, up to ALL strings
    const maxGroupSize = numStrings; // Include all strings

    for (let size = 3; size <= maxGroupSize && size <= numStrings; size++) {
        const groupIndices = Array.from({ length: size }, (_, i) => i);
        const groupNotes = groupIndices.map(idx => tuningNotes[idx]);
        analyzeGroup(groupNotes, groupIndices, results);
    }

    return results;
}

function analyzeGroup(groupNotes: string[], indices: number[], results: StringGroupAnalysis[]) {
    // Strings are ordered treble to bass (string 1 = highest, last string = lowest)
    // Root is the note on the LAST string (bass/lowest pitch)

    const root = groupNotes[groupNotes.length - 1]; // LAST string is root (bass)
    const rootPc = Note.pitchClass(root);

    // Calculate intervals relative to root for ALL notes including root
    const intervals = groupNotes.map(n => {
        const dist = Interval.distance(root, n);
        return Interval.simplify(dist);
    });

    // Use pattern matching to detect chord type based on intervals
    const chordType = detectChordTypeFromIntervals(intervals);

    let chordName = "";

    if (chordType !== null) {
        // Pattern matched (empty string = major chord, other string = that chord type)
        chordName = rootPc + chordType;
    } else {
        // Fallback to Tonal detection only if NO pattern matched (null)
        const sortedByPitch = [...groupNotes].sort((a, b) => {
            const midiA = Note.midi(a) || 0;
            const midiB = Note.midi(b) || 0;
            return midiA - midiB;
        });
        const detected = Chord.detect(sortedByPitch);
        chordName = detected.length > 0 ? detected[0] : rootPc;
    }

    const inversion = detectInversion(groupNotes, rootPc);

    results.push({
        stringIndices: indices,
        notes: groupNotes,
        intervals: intervals,
        chordName: chordName,
        emotionalTag: getEmotionalTag(chordName, intervals),
        inversion: inversion,
        root: rootPc
    });
}

// Detect chord type from a set of intervals using pattern matching
// Returns null if no pattern matches (triggers fallback)
// Returns "" for major chords, other strings for other chord types
function detectChordTypeFromIntervals(intervalList: string[]): string | null {
    // Use exact case from Tonal (e.g., "3M" for major, "3m" for minor)
    // Do NOT use toUpperCase as it converts 3m to 3M!
    const set = new Set(intervalList);

    const has = (ivl: string) => set.has(ivl);

    // Check for unison/octave
    const has1 = has("1P") || has("8P");

    // Seconds (9ths when extended)
    const has2M = has("2M"); // Major 2nd / 9th
    const has2m = has("2m"); // Minor 2nd / b9

    // Thirds
    const has3m = has("3m"); // Minor 3rd
    const has3M = has("3M"); // Major 3rd

    // Fourth
    const has4P = has("4P"); // Perfect 4th / 11th

    // Fifths
    const has5P = has("5P");
    const has5d = has("5d") || has("d5"); // Diminished 5th

    // Sixths (13ths when extended)
    const has6m = has("6m"); // Minor 6th / b13
    const has6M = has("6M"); // Major 6th / 13

    // Sevenths
    const has7m = has("7m"); // Minor 7th / b7
    const has7M = has("7M"); // Major 7th

    // === EXTENDED MAJOR CHORDS (check first) ===

    // Maj9 (1, 3, 5, 7M, 9)
    if (has1 && has3M && has7M && has2M) {
        return "maj9";
    }

    // Maj7 (1, 3, 5, 7M)
    if (has1 && has3M && has7M) {
        return "maj7";
    }

    // 9 (Dominant 9: 1, 3, 5, b7, 9)
    if (has1 && has3M && has7m && has2M) {
        return "9";
    }

    // add9 (1, 3, 5, 9 without 7)
    if (has1 && has3M && has2M && !has7m && !has7M) {
        return "add9";
    }

    // Dominant 7 (1, 3, 5, b7)
    if (has1 && has3M && has7m) {
        return "7";
    }

    // Major (1, 3, 5) - REQUIRE 5P to avoid ambiguity with inversions of other chords
    if (has1 && has3M && has5P && !has3m && !has7m && !has7M) {
        return "";
    }

    // === EXTENDED MINOR CHORDS ===

    // m7(b13) / m7 add b13 (1, b3, 5, b7, b13)
    if (has1 && has3m && has7m && has6m) {
        return "m7(b13)";
    }

    // m9 (1, b3, 5, b7, 9)
    if (has1 && has3m && has7m && has2M) {
        return "m9";
    }

    // m7 (1, b3, 5, b7)
    if (has1 && has3m && has7m) {
        return "m7";
    }

    // m add9 (1, b3, 5, 9)
    if (has1 && has3m && has2M && !has7m && !has7M) {
        return "m(add9)";
    }

    // Minor (1, b3, 5) - REQUIRE 5P
    if (has1 && has3m && has5P && !has3M && !has7m && !has7M) {
        return "m";
    }

    // === SUS CHORDS (no 3rd) ===

    // 7sus4 (1, 4, b7)
    if (has1 && has4P && has7m && !has3m && !has3M) {
        return "7sus4";
    }

    // sus4 (1, 4, 5)
    if (has1 && has4P && has5P && !has3m && !has3M && !has7m && !has7M) {
        return "sus4";
    }

    // sus2 (1, 2, 5)
    if (has1 && has2M && has5P && !has3m && !has3M) {
        return "sus2";
    }

    // === OTHER CHORDS ===

    // Diminished (1, b3, b5)
    if (has1 && has3m && has5d) {
        return "dim";
    }

    // Power chord / 5 (1, 5 only)
    if (has1 && has5P && !has3m && !has3M && !has4P && !has2M) {
        return "5";
    }

    return null; // No pattern matched, will use fallback
}

export function reanalyzeGroup(original: StringGroupAnalysis, newRoot: string): StringGroupAnalysis {
    const rootPc = Note.pitchClass(newRoot);

    // 1. Calculate intervals relative to the new Root
    const intervals = original.notes.map(n => {
        const notePc = Note.pitchClass(n);
        const dist = Interval.distance(rootPc, notePc);
        return Interval.simplify(dist);
    });

    // 2. Detect Chord Type using direct pattern matching
    const chordType = detectChordTypeFromIntervals(intervals);

    let bestName = "";

    if (chordType !== null) {
        // Pattern matched
        bestName = rootPc + chordType;
    } else {
        // Fallback: try Tonal detection on original notes
        const detected = Chord.detect(original.notes);
        const match = detected.find(name => Chord.get(name).root === rootPc);

        if (match) {
            bestName = match;
        } else {
            // Create slash chord
            const baseName = detected[0] || original.chordName;
            const cleanName = baseName.split('/')[0];
            bestName = `${cleanName}/${rootPc}`;
        }
    }

    return {
        ...original,
        intervals: intervals,
        chordName: bestName,
        emotionalTag: getEmotionalTag(bestName, intervals),
        inversion: detectInversion(original.notes, rootPc),
        root: rootPc
    };
}

/**
 * Analyze a set of marked pitch classes, generating one analysis per possible root.
 * For N marked notes, returns N analyses (each note as potential root).
 */
export function analyzeMarkedNotes(pitchClasses: string[]): StringGroupAnalysis[] {
    if (pitchClasses.length < 2) return [];

    const results: StringGroupAnalysis[] = [];

    // For each pitch class as a potential root
    pitchClasses.forEach((rootNote) => {
        // Ensure root is just a pitch class (e.g. "C") for analysis purposes
        const rootPc = Note.pitchClass(rootNote);

        // Calculate intervals from this root to all other notes (ASCENDING PC intervals)
        const intervals = pitchClasses.map(note => {
            const pc = Note.pitchClass(note);
            const dist = Interval.distance(rootPc, pc);
            return Interval.simplify(dist);
        });

        // Detect chord type
        const chordType = detectChordTypeFromIntervals(intervals);

        let chordName = "";
        if (chordType !== null) {
            chordName = rootPc + chordType;
        } else {
            // Fallback: try Tonal detection
            // Note: Tonal expects full notes or PCs. Using PCs here.
            const pcsOnly = pitchClasses.map(n => Note.pitchClass(n));
            const detected = Chord.detect(pcsOnly);

            // Prefer matches where tonic is our current root
            const match = detected.find(name => {
                const chord = Chord.get(name);
                return chord.tonic === rootPc;
            });

            if (match) {
                chordName = match;
            } else if (detected.length > 0) {
                // If it detected something else, maybe it's a slash chord relative to our root?
                // But generally Chord.detect returns Names. 
                // If we are forcing `rootPc` as root, and Tonal says it's something else, 
                // maybe this isn't a valid root for this set.
                // We'll just take the first detection or append "?"
                // But let's avoid showing garbage like "Em#5/G3".

                // If the root doesn't match, maybe just don't name it relative to this root unless slash
                chordName = rootPc + "?";
            } else {
                chordName = rootPc + "?";
            }
        }

        // Detect inversion
        let inversion = "";

        // Check if input has octave info (e.g., "C3" vs "C")
        const hasOctave = pitchClasses.every(n => /\d/.test(n));

        if (hasOctave) {
            inversion = detectInversion(pitchClasses, rootPc);
        }

        results.push({
            stringIndices: Array.from({ length: pitchClasses.length }, (_, i) => i),
            notes: pitchClasses,
            intervals: intervals,
            chordName: chordName,
            emotionalTag: getEmotionalTag(chordName, intervals),
            inversion: inversion,
            root: rootPc
        });
    });

    return results;
}

// ============================================================================
// Inversion Detection
// ============================================================================

export function detectInversion(notes: string[], root: string): string {
    if (!notes.length || !root) return "";

    // 1. Find the bass note (lowest pitch)
    // Sort by MIDI value
    const sorted = [...notes].sort((a, b) => {
        const midiA = Note.midi(a) || 0;
        const midiB = Note.midi(b) || 0;
        return midiA - midiB;
    });

    const bassNote = sorted[0];
    const bassPc = Note.pitchClass(bassNote);
    const rootPc = Note.pitchClass(root);

    if (bassPc === rootPc) {
        return "Fundamental";
    }

    // Calculate interval from Root to Bass
    const dist = Interval.distance(rootPc, bassPc);
    const simpleDist = Interval.simplify(dist); // e.g. "3M", "5P"

    // Map interval to inversion name
    // 3rd (Major or Minor) -> 1st Inversion
    if (simpleDist === "3M" || simpleDist === "3m") return "1st Inversion";

    // 5th (Perfect or Diminished) -> 2nd Inversion
    if (simpleDist === "5P" || simpleDist === "5d") return "2nd Inversion";

    // 7th (Major or Minor) -> 3rd Inversion
    if (simpleDist === "7M" || simpleDist === "7m") return "3rd Inversion";

    return `Inversion (${simpleDist})`;
}


