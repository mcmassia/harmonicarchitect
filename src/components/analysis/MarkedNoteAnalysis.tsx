"use client";

import { useMarkedNotesStore } from '@/store/markedNotesStore';
import { Music2, Sparkles, Trash2 } from 'lucide-react';
import { clsx } from "clsx";
import { StringGroupAnalysis } from '@/types/music';

interface MarkedNoteAnalysisProps {
    onSelect?: (analysis: StringGroupAnalysis) => void;
    selectedAnalysis?: StringGroupAnalysis | null;
}

export function MarkedNoteAnalysis({ onSelect, selectedAnalysis }: MarkedNoteAnalysisProps) {
    const { markedNotes, analysis, clearNotes } = useMarkedNotesStore();

    if (markedNotes.length === 0) {
        return (
            <div className="p-6 bg-indigo-950/30 rounded-xl border border-indigo-500/30 text-indigo-300 text-center flex flex-col items-center gap-3">
                <Music2 className="w-10 h-10 opacity-50" />
                <p className="font-medium">Haz click en el diapasón para marcar notas</p>
                <p className="text-sm text-indigo-400/70">Marca al menos 2 notas para ver análisis</p>
            </div>
        );
    }

    if (markedNotes.length === 1) {
        return (
            <div className="p-6 bg-indigo-950/30 rounded-xl border border-indigo-500/30 text-indigo-300 text-center flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-white">{markedNotes[0]}</span>
                    <span className="text-sm text-indigo-400">marcada</span>
                </div>
                <p className="text-sm text-indigo-400/70">Marca al menos 1 nota más para ver acordes posibles</p>
                <button
                    onClick={clearNotes}
                    className="mt-2 flex items-center gap-2 px-3 py-1.5 text-xs bg-indigo-900/50 hover:bg-indigo-800/50 rounded-lg text-indigo-300 transition-colors"
                >
                    <Trash2 className="w-3 h-3" />
                    Limpiar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with marked notes and clear button */}
            <div className="flex items-center justify-between p-3 bg-indigo-950/30 rounded-lg border border-indigo-500/30">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-indigo-400 uppercase tracking-wider font-mono">Notas:</span>
                    {markedNotes.map((note, i) => (
                        <span
                            key={i}
                            className="px-2 py-0.5 bg-indigo-600/40 text-indigo-200 rounded text-sm font-bold"
                        >
                            {note}
                        </span>
                    ))}
                </div>
                <button
                    onClick={clearNotes}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-900/50 hover:bg-indigo-800/50 rounded text-indigo-300 transition-colors"
                >
                    <Trash2 className="w-3 h-3" />
                    Limpiar
                </button>
            </div>

            {/* Analysis Cards - One per possible root */}
            {analysis.map((group, i) => {
                const isSelected = selectedAnalysis?.chordName === group.chordName &&
                    selectedAnalysis?.intervals.join(",") === group.intervals.join(",");

                return (
                    <button
                        key={i}
                        onClick={() => onSelect?.(group)}
                        className={clsx(
                            "w-full text-left p-5 rounded-xl border relative overflow-hidden group transition-all duration-300",
                            isSelected
                                ? "bg-indigo-600/20 border-indigo-400 ring-1 ring-indigo-400"
                                : "bg-indigo-950/20 border-indigo-500/30 hover:bg-indigo-900/30 hover:border-indigo-400/50"
                        )}
                    >
                        {/* Root indicator */}
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                            <span className="text-xs text-indigo-400 font-mono uppercase">Tónica</span>
                            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-sm font-bold">
                                {group.notes[group.intervals.indexOf("1P")] || markedNotes[i]}
                            </span>
                        </div>

                        <div className="mb-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white">{group.chordName}</span>
                        </div>

                        <div className="text-lg font-medium text-indigo-300">
                            {group.emotionalTag}
                        </div>

                        {/* Notes and Intervals */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {group.notes.map((n, idx) => {
                                const currentInterval = group.intervals[idx];
                                const isRoot = currentInterval === "1P";

                                return (
                                    <div
                                        key={idx}
                                        className={clsx(
                                            "flex flex-col items-center px-3 py-1.5 rounded border",
                                            isRoot
                                                ? "bg-indigo-500/20 border-indigo-500/50"
                                                : "bg-slate-950/50 border-white/5"
                                        )}
                                    >
                                        <span className={clsx("text-xs font-bold font-mono", isRoot ? "text-indigo-300" : "text-slate-400")}>
                                            {n}
                                        </span>
                                        <span className={clsx("text-[10px] font-mono mt-0.5", isRoot ? "text-indigo-200" : "text-slate-500")}>
                                            {currentInterval}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
