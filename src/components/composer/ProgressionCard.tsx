"use client";

import { Progression } from '@/lib/music/composer';
import {
    Music2,
    Gauge,
    GitBranch,
    ChevronRight,
    Bookmark,
    Play
} from 'lucide-react';
import { clsx } from 'clsx';

interface ProgressionCardProps {
    progression: Progression;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onContinue: () => void;
    onSave: () => void;
}

export function ProgressionCard({
    progression,
    index,
    isSelected,
    onSelect,
    onContinue,
    onSave
}: ProgressionCardProps) {
    const chordNames = progression.voicings.map(v => v.chord);

    // Calcular número de drones totales
    const totalDrones = progression.voicings.reduce(
        (sum, v) => sum + v.droneStrings.length,
        0
    );

    return (
        <div
            className={clsx(
                "p-4 rounded-xl border transition-all cursor-pointer",
                isSelected
                    ? "bg-violet-500/20 border-violet-500/50 shadow-lg shadow-violet-500/10"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
            )}
            onClick={onSelect}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        isSelected ? "bg-violet-500 text-white" : "bg-slate-700 text-slate-300"
                    )}>
                        {index}
                    </span>
                    <Music2 className={clsx(
                        "w-4 h-4",
                        isSelected ? "text-violet-400" : "text-slate-500"
                    )} />
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onContinue();
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Continuar desde aquí"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSave();
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-colors"
                        title="Guardar progresión"
                    >
                        <Bookmark className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chord Sequence */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {chordNames.map((chord, idx) => (
                    <span
                        key={idx}
                        className={clsx(
                            "px-2 py-1 rounded text-sm font-mono font-medium",
                            isSelected
                                ? "bg-violet-500/30 text-violet-200"
                                : "bg-slate-800 text-slate-300"
                        )}
                    >
                        {chord}
                    </span>
                ))}
            </div>

            {/* Scores */}
            <div className="space-y-2">
                {/* Ergonomy Score */}
                <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-slate-400 w-20">Ergonomía</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                            style={{ width: `${progression.ergonomyAvg}%` }}
                        />
                    </div>
                    <span className="text-xs text-emerald-400 w-8 text-right">
                        {progression.ergonomyAvg}%
                    </span>
                </div>

                {/* Voice Leading Score */}
                <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs text-slate-400 w-20">Voice Lead</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all"
                            style={{ width: `${progression.voiceLeadingScore}%` }}
                        />
                    </div>
                    <span className="text-xs text-cyan-400 w-8 text-right">
                        {progression.voiceLeadingScore}%
                    </span>
                </div>
            </div>

            {/* Drones indicator */}
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="text-emerald-500">○</span>
                <span>{totalDrones} cuerdas al aire</span>
            </div>
        </div>
    );
}
