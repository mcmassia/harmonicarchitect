"use client";

import { useSavedChordsStore, SavedChord } from '@/store/savedChordsStore';
import { Trash2, Play, Music, ArrowRight } from 'lucide-react';
import { playArpeggio } from '@/lib/audio/player';
import { StringGroupAnalysis } from '@/types/music';

interface SavedChordsListProps {
    onLoad: (analysis: StringGroupAnalysis) => void;
}

export function SavedChordsList({ onLoad }: SavedChordsListProps) {
    const { savedChords, deleteChord } = useSavedChordsStore();

    if (savedChords.length === 0) {
        return (
            <div className="p-6 text-center text-slate-500 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tienes acordes guardados.</p>
                <p className="text-xs mt-1">Marca notas en modo interactivo y guárdalas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Fingerings Guardados ({savedChords.length})
            </h3>

            <div className="grid grid-cols-1 gap-3">
                {savedChords.map((chord) => (
                    <div
                        key={chord.id}
                        className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group"
                    >
                        {/* Chord Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-lg">{chord.name}</span>
                                {chord.inversion && chord.inversion !== "Fundamental" && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-900/50 text-indigo-300 rounded border border-indigo-500/20">
                                        {chord.inversion}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-1 mt-1 text-xs text-slate-500 font-mono">
                                <span>{chord.notes.join("-")}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => playArpeggio(chord.notes)}
                                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-md transition-colors"
                                title="Escuchar"
                            >
                                <Play className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => onLoad({
                                    chordName: chord.name,
                                    notes: chord.notes,
                                    intervals: chord.intervals,
                                    stringIndices: chord.stringIndices,
                                    emotionalTag: "Saved Chord",
                                    root: chord.root,
                                    inversion: chord.inversion
                                })}
                                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/30 rounded-md transition-colors"
                                title="Ver en Diapasón"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => deleteChord(chord.id)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-md transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
