import { useTuningStore } from '@/store/tuningStore';
import { Music2, Sparkles } from 'lucide-react';
import { clsx } from "clsx";
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
    // If user selected a root, recalculate intervals relative to it.
    // If not, use the detected intervals from analysis.

    // We should allow clicking a note to TRIGGER selection update in parent?
    // The previous implementation used local state `userRoot` which only affected DISPLAY intervals.
    // The user requirement is "el intervalo ... no se calcula correctamente". 
    // And "reanalyzeGroup" logic was added to lib.
    // So when user clicks a note, we should call `reanalyzeGroup` and then `onSelect(newGroup)`.
    // This lifts the state up and ensures the "selectedAnalysis" in Page is the reanalyzed one.

    const handleNoteClick = (e: React.MouseEvent, note: string) => {
        e.stopPropagation();
        import('@/lib/music/analysis').then(({ reanalyzeGroup }) => {
            const newGroup = reanalyzeGroup(group, note);
            onSelect?.(newGroup);
        });
    };

    // Since we are now updating the PARENT state (selectedAnalysis), we can rely on `group` props being the source of truth if `isSelected` matches?
    // Wait, the `group` passed here is from `tuningStore.analysis` list. 
    // The `selectedAnalysis` in `page.tsx` is separate state.
    // If we select a group and reanalyze it, `selectedAnalysis` becomes a Modified Copy of the group.
    // The `tuningStore` list is unchanged.
    // Ideally, we want to show the MODIFIED intervals in the detail view AND on the Fretboard (which uses selectedAnalysis).
    // Does this card need to show the modified intervals?
    // If `isSelected` is true, we might want to check if `selectedAnalysis` (passed from parent?) matches this modification?
    // But `selectedAnalysis` is not passed to `AnalysisCardItem` fully, only `isSelected` boolean.
    // Let's rely on standard display for the LIST items (default root).
    // And if the user clicks a note, it updates the `selectedAnalysis` which updates the DETAILS panel and FRETBOARD.
    // Does the CARD itself need to update? 
    // "al seleccionar la tónica en las tarjetas ... el intervalo ... no se calcula correctamente"
    // Usually means looking at the card.
    // If I click 'E' on the card, I want THAT card to show the new intervals.
    // But that card is an item in a list from the Store.
    // If I don't update the Store, the Card won't change unless I use local state override OR I pass the `selectedAnalysis` object back to the list to render "The Selected Version" instead of the "Store Version".

    // Let's try passing `displayGroup` which is `isSelected ? selectedAnalysis : group`?
    // We need to change `AnalysisCard` parent logic.

    return (
        <button
            onClick={() => onSelect?.(group)}
            className={clsx(
                "w-full text-left p-5 rounded-xl border relative overflow-hidden group transition-all duration-300",
                isSelected
                    ? "bg-indigo-600/20 border-indigo-400 ring-1 ring-indigo-400"
                    : isMidwest
                        ? "bg-indigo-950/30 border-indigo-500/50 hover:bg-indigo-900/40"
                        : "bg-slate-900 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
            )}>
            {isMidwest && <Sparkles className="absolute top-3 right-3 text-indigo-400 w-5 h-5 animate-pulse" />}

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
        </button>
    );
}
