import { useTuningStore } from '@/store/tuningStore';
import { useSavedChordsStore } from '@/store/savedChordsStore';
import { Music2, Sparkles, Bookmark, Play } from 'lucide-react';
import { clsx } from "clsx";
import { playArpeggio } from '@/lib/audio/player';
import { StringGroupAnalysis } from '@/types/music';
import { useState } from 'react';
import { Interval } from "@tonaljs/tonal";

interface AnalysisCardProps {
    onSelect?: (analysis: StringGroupAnalysis) => void;
    selectedAnalysis?: StringGroupAnalysis | null;
}

export function AnalysisCard({ onSelect, selectedAnalysis }: AnalysisCardProps) {
    const { analysis } = useTuningStore();

    if (analysis.length === 0) {
        return (
            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 text-center flex flex-col items-center gap-3">
                <Music2 className="w-10 h-10 opacity-50" />
                <p>Modify the tuning to see analysis</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {analysis.map((group, i) => {
                const isMidwest = group.emotionalTag.includes("Midwest");

                // Identity check by stringIndices (unique per group) - NOT by chordName which can change
                const isSelectedRobust = !!(selectedAnalysis &&
                    selectedAnalysis.stringIndices.join("-") === group.stringIndices.join("-"));

                // If selected, use selectedAnalysis which has updated Root/Intervals/ChordName
                const groupToRender = isSelectedRobust && selectedAnalysis ? selectedAnalysis : group;

                return (
                    <AnalysisCardItem
                        key={i}
                        group={groupToRender}
                        isMidwest={groupToRender.emotionalTag.includes("Midwest")}
                        isSelected={isSelectedRobust}
                        onSelect={onSelect}
                    />
                )
            })}
        </div>
    );
}

function AnalysisCardItem({ group, isMidwest, isSelected, onSelect }: {
    group: StringGroupAnalysis,
    isMidwest: boolean,
    isSelected: boolean | null,
    onSelect?: (val: StringGroupAnalysis) => void
}) {
    const handleNoteClick = (e: React.MouseEvent, note: string) => {
        e.stopPropagation();
        import('@/lib/music/analysis').then(({ reanalyzeGroup }) => {
            const newGroup = reanalyzeGroup(group, note);
            onSelect?.(newGroup);
        });
    };

    const { savedChords, saveChord, deleteChord } = useSavedChordsStore();
    const savedChord = savedChords.find(c => c.name === group.chordName);
    const isSaved = !!savedChord;

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSaved) {
            deleteChord(savedChord!.id);
        } else {
            saveChord(group.chordName);
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
                    : isMidwest
                        ? "bg-indigo-950/30 border-indigo-500/50 hover:bg-indigo-900/40"
                        : "bg-slate-900 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
            )}>

            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                {isMidwest && <Sparkles className="text-indigo-400 w-5 h-5 animate-pulse" />}

                <button
                    onClick={handlePlay}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="Escuchar"
                >
                    <Play className="w-5 h-5" />
                </button>

                <button
                    onClick={handleSave}
                    className={clsx(
                        "p-1.5 rounded-lg transition-all transform hover:scale-110",
                        isSaved
                            ? "bg-amber-500/20 text-amber-400"
                            : "text-slate-500 hover:text-white hover:bg-slate-800"
                    )}
                    title={isSaved ? "Eliminar de guardados" : "Guardar acorde"}
                >
                    <Bookmark className={clsx("w-5 h-5", isSaved && "fill-current")} />
                </button>
            </div>

            <div className="mb-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{group.chordName}</span>
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                    Strings {group.stringIndices.map(s => s + 1).join("-")}
                </span>
            </div>

            <div className={clsx("text-lg font-medium",
                isMidwest ? "text-indigo-300" : "text-emerald-400"
            )}>
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
                            onClick={(e) => handleNoteClick(e, n)}
                            className={clsx(
                                "flex flex-col items-center px-3 py-1.5 rounded border transition-colors cursor-pointer hover:bg-white/10",
                                isRoot
                                    ? "bg-emerald-500/20 border-emerald-500/50"
                                    : "bg-slate-950/50 border-white/5"
                            )}
                            title="Click to set as Root"
                        >
                            <span className={clsx("text-xs font-bold font-mono", isRoot ? "text-emerald-400" : "text-slate-400")}>
                                {n}
                            </span>
                            <span className={clsx("text-[10px] font-mono mt-0.5", isRoot ? "text-emerald-300" : "text-slate-500")}>
                                {currentInterval}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
