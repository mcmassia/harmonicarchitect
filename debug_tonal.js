
const { Note, Scale } = require('@tonaljs/tonal');

console.log("Checking D Major Scale Notes:");
const dMajor = Scale.get("D major");
console.log("Scale Notes:", dMajor.notes);
console.log("Pitch Classes in Scale:", dMajor.notes.map(n => Note.pitchClass(n)));

console.log("\nChecking MIDI conversions (starting from D4 = 62):");
// D4 is MIDI 62.
// Fret 0: 62 (D)
// Fret 1: 63 (Eb/D#)
// Fret 2: 64 (E)
// Fret 3: 65 (F)
// Fret 4: 66 (F#/Gb) -> This is the 3rd of D Major
// Fret 11: 73 (C#/Db) -> This is the 7th of D Major

const midis = [62, 63, 64, 65, 66, 73];
midis.forEach(midi => {
    const fromMidi = Note.fromMidi(midi);
    const pc = Note.pitchClass(fromMidi);
    console.log(`MIDI ${midi} -> Note: ${fromMidi}, PC: ${pc}`);
});

console.log("\nChecking Enharmonic Equivalents:");
console.log("Is F# in Scale?", dMajor.notes.includes("F#"));
console.log("Is Gb in Scale?", dMajor.notes.includes("Gb"));

const fSharpMidi = 66;
const dMajorNotes = new Set(dMajor.notes.map(n => Note.pitchClass(n)));
const noteName = Note.fromMidi(fSharpMidi);
const pc = Note.pitchClass(noteName);

console.log(`\nMatch Check for MIDI ${fSharpMidi} (${noteName}):`);
console.log(`Is ${pc} in D Major Set?`, dMajorNotes.has(pc));

if (!dMajorNotes.has(pc)) {
    console.log(`MISMATCH DETECTED! Scale has ${Array.from(dMajorNotes)}, but MIDI generated ${pc}`);
    console.log("Enharmonic equivalent needed.");
} else {
    console.log("Match successful.");
}
