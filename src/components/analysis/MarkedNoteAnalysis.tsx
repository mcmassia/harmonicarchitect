"use client";

import { useMarkedNotesStore } from '@/store/markedNotesStore';
import { Music2, Sparkles, Trash2, MousePointer2 } from 'lucide-react';
import { clsx } from "clsx";
import { StringGroupAnalysis } from '@/types/music';
import { useMemo } from 'react';
import { Note } from "@tonaljs/tonal";

interface MarkedNoteAnalysisProps {
    onSelect?: (analysis: StringGroupAnalysis) => void;
    selectedAnalysis?: StringGroupAnalysis | null;
}

export function MarkedNoteAnalysis({ onSelect, selectedAnalysis }: MarkedNoteAnalysisProps) {
    const { markedNotes, markedPositions, selectionMode, analysis, clearNotes } = useMarkedNotesStore();

    // Determine active pitch classes based on mode
    const activeNotes = useMemo(() => {
        if (selectionMode === 'note') {
            return markedNotes;
        } else {
            const unique = new Set(markedPositions.map(p => Note.pitchClass(p.note)));
            return Array.from(unique).sort();
        }
    }, [selectionMode, markedNotes, markedPositions]);

    const displayCount = selectionMode === 'note' ? markedNotes.length : markedPositions.length;
    const uniqueCount = activeNotes.length;

    if (uniqueCount === 0) {
        return (
            <div className="p-6 bg-indigo-950/30 rounded-xl border border-indigo-500/30 text-indigo-300 text-center flex flex-col items-center gap-3">
                {selectionMode === 'note' ? (
                    <Music2 className="w-10 h-10 opacity-50" />
                ) : (
                    <MousePointer2 className="w-10 h-10 opacity-50" />
                )}

                <p className="font-medium">
                    {selectionMode === 'note'
                        ? "Haz click en las notas para marcarlas"
                        : "Haz click en el diapasón para marcar posiciones"}
                </p>
                <p className="text-sm text-indigo-400/70">Marca al menos 2 notas distintas para ver análisis</p>
            </div>
        );
    }

    if (uniqueCount === 1) {
        return (
            <div className="p-6 bg-indigo-950/30 rounded-xl border border-indigo-500/30 text-indigo-300 text-center flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-white">{activeNotes[0]}</span>
                    <span className="text-sm text-indigo-400">marcada</span>
                </div>
                <p className="text-sm text-indigo-400/70">Marca al menos 1 nota más para ver acordes posibles</p>
                <div className="flex flex-col items-center gap-2 mt-2">
                    {selectionMode === 'position' && (
                        <span className="text-xs text-indigo-400/50">
                            ({markedPositions.length} {markedPositions.length === 1 ? 'posición' : 'posiciones'} seleccionadas)
                        </span>
                    )}
                    <button
                        onClick={clearNotes}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-indigo-900/50 hover:bg-indigo-800/50 rounded-lg text-indigo-300 transition-colors"
                    >
                        <Trash2 className="w-3 h-3" />
                        Limpiar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with marked notes and clear button */}
            <div className="flex items-center justify-between p-3 bg-indigo-950/30 rounded-lg border border-indigo-500/30">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-indigo-400 uppercase tracking-wider font-mono">
                        {selectionMode === 'note' ? 'Notas:' : 'Tonos:'}
                    </span>
                    {activeNotes.map((note, i) => (
                        <span
                            key={i}
                            className="px-2 py-0.5 bg-indigo-600/40 text-indigo-200 rounded text-sm font-bold"
                        >
                            {note}
                        </span>
                    ))}
                    {selectionMode === 'position' && (
                        <span className="text-xs text-indigo-500 ml-1">
                            ({markedPositions.length} pos)
                        </span>
                    )}
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
            {analysis.map((group, i) => (
                <InteractiveAnalysisCard
                    key={i}
                    group={group}
                    activeNotes={activeNotes}
                    index={i}
                    selectedAnalysis={selectedAnalysis}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}

import { useSavedChordsStore } from '@/store/savedChordsStore';
import { playArpeggio } from '@/lib/audio/player';
import { Bookmark, Play } from 'lucide-react';

function InteractiveAnalysisCard({
    group,
    activeNotes,
    index,
    selectedAnalysis,
    onSelect
}: {
    group: StringGroupAnalysis,
    activeNotes: string[],
    index: number,
    selectedAnalysis?: StringGroupAnalysis | null,
    onSelect?: (analysis: StringGroupAnalysis) => void
}) {
    const { saveChord, deleteChord, isChordSaved, savedChords } = useSavedChordsStore();

    const isSelected = selectedAnalysis?.chordName === group.chordName &&
        selectedAnalysis?.intervals.join(",") === group.intervals.join(",");

    // Check if shape is saved
    const isSaved = isChordSaved(group.chordName, group.notes);
    const savedChord = savedChords.find(c =>
        c.name === group.chordName &&
        c.notes &&
        c.notes.length === group.notes.length &&
        c.notes.every((n, i) => n === group.notes[i])
    );

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSaved && savedChord) {
            deleteChord(savedChord.id);
        } else {
            saveChord(group);
        }
    };

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        playArpeggio(group.notes);
    };

    return (
        <div
            onClick={() => onSelect?.(group)}
            className={clsx(
                "w-full text-left p-5 rounded-xl border relative overflow-hidden group transition-all duration-300 cursor-pointer",
                isSelected
                    ? "bg-indigo-600/20 border-indigo-400 ring-1 ring-indigo-400"
                    : "bg-indigo-950/20 border-indigo-500/30 hover:bg-indigo-900/30 hover:border-indigo-400/50"
            )}
        >
            {/* Action Buttons */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                <button
                    onClick={handlePlay}
                    className="p-1.5 rounded-lg text-indigo-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="Escuchar"
                >
                    <Play className="w-4 h-4" />
                </button>

                <button
                    onClick={handleSave}
                    className={clsx(
                        "p-1.5 rounded-lg transition-all transform hover:scale-110",
                        isSaved
                            ? "bg-amber-500/20 text-amber-400"
                            : "text-indigo-400 hover:text-white hover:bg-indigo-800"
                    )}
                    title={isSaved ? "Eliminar de guardados" : "Guardar fingering/shape"}
                >
                    <Bookmark className={clsx("w-4 h-4", isSaved && "fill-current")} />
                </button>
            </div>

            {/* Root indicator (moved slightly to accomodate buttons if needed, actually buttons are top right, root indicator was top right too. Let's move root indicator to top LEFT or keep and stack?)
                Actually previous code had Root Indicator at top right. Buttons will overlap.
                Let's move Root Indicator to be inline with title or somewhere else.
                Or put buttons to the right of root indicator?
             */}

            <div className="mb-2">
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-indigo-400 font-mono uppercase">Tónica</span>
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-sm font-bold">
                        {group.notes[group.intervals.indexOf("1P")] || activeNotes[index]}
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">{group.chordName}</span>
                </div>
                {group.inversion && group.inversion !== "Fundamental" && (
                    <div className="text-xs font-medium text-amber-400/80 mt-1">
                        {group.inversion}
                    </div>
                )}
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
        </div>
    );
}

