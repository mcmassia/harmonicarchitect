import { Note, Interval, Chord, Scale } from "@tonaljs/tonal";

export const Core = {
    Note,
    Interval,
    Chord,
    Scale,
};

export const parseNote = (note: string) => {
    const n = Note.get(note);
    if (n.empty) return null;
    return n;
};

export const getInterval = (from: string, to: string) => {
    return Interval.distance(from, to);
};

export const getFrequency = (note: string) => {
    return Note.freq(note);
};
