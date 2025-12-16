"use client";

import { useTuningStore } from "@/store/tuningStore";
import { useMemo } from "react";
import { analyzeTuningForDashboard, TuningDashboardAnalysis, AdjacentInterval } from "@/lib/music/tuningDashboard";
import { Guitar, Music, Sparkles, ArrowRight, Gauge } from "lucide-react";
import { clsx } from "clsx";

// ============================================================================
// Component
// ============================================================================

export function TuningDashboard() {
    const { strings, analysis: harmonicAnalysis } = useTuningStore();

    // Analyze tuning whenever strings change
    const analysis = useMemo<TuningDashboardAnalysis | null>(() => {
        if (strings.length < 3) return null;
        const notes = strings.map(s => s.note.scientific);

        // Get the chord name from the harmonic analysis that includes ALL strings
        // This is the group with the maximum number of strings
        const fullStringAnalysis = harmonicAnalysis.find(
            a => a.stringIndices.length === strings.length
        );

        // Always use the chord name from existing analysis - no filtering
        const chordFromAnalysis = fullStringAnalysis?.chordName || null;

        return analyzeTuningForDashboard(notes, chordFromAnalysis);
    }, [strings, harmonicAnalysis]);

    if (!analysis) {
        return (
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 text-center">
                <Guitar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Añade al menos 3 cuerdas para ver el análisis</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
            {/* Header */}
            <DashboardHeader analysis={analysis} />

            {/* Content Grid */}
            <div className="p-4 space-y-4">
                {/* Mood Badge */}
                <MoodBadge mood={analysis.mood} characteristics={analysis.characteristics} />

                {/* Interval Matrix */}
                <IntervalMatrix intervals={analysis.adjacentIntervals} notes={strings.map(s => s.note.scientific)} />

                {/* Range Info */}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Gauge className="w-4 h-4" />
                    <span>Rango: <span className="text-slate-200 font-mono">{analysis.totalRange}</span></span>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function DashboardHeader({ analysis }: { analysis: TuningDashboardAnalysis }) {
    const moodColors: Record<string, string> = {
        indigo: "from-indigo-600/20 to-indigo-900/10 border-indigo-500/30",
        amber: "from-amber-600/20 to-amber-900/10 border-amber-500/30",
        emerald: "from-emerald-600/20 to-emerald-900/10 border-emerald-500/30",
        rose: "from-rose-600/20 to-rose-900/10 border-rose-500/30",
        slate: "from-slate-600/20 to-slate-800/10 border-slate-500/30",
        cyan: "from-cyan-600/20 to-cyan-900/10 border-cyan-500/30",
        purple: "from-purple-600/20 to-purple-900/10 border-purple-500/30",
    };

    const color = moodColors[analysis.mood.color] || moodColors.slate;

    return (
        <div className={clsx(
            "px-5 py-4 bg-gradient-to-r border-b",
            color
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg">
                        <Guitar className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                            Tuning Dashboard
                        </h3>
                        {analysis.openChordName ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-white">
                                    {analysis.openChordName}
                                </span>
                                {analysis.isOpenTuning && (
                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
                                        Open Tuning
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span className="text-lg font-semibold text-slate-300">
                                Afinación Personalizada
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MoodBadge({ mood, characteristics }: { mood: TuningDashboardAnalysis['mood']; characteristics: string[] }) {
    const moodBgColors: Record<string, string> = {
        indigo: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
        amber: "bg-amber-500/10 border-amber-500/30 text-amber-300",
        emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
        rose: "bg-rose-500/10 border-rose-500/30 text-rose-300",
        slate: "bg-slate-500/10 border-slate-500/30 text-slate-300",
        cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
        purple: "bg-purple-500/10 border-purple-500/30 text-purple-300",
    };

    const badgeColor = moodBgColors[mood.color] || moodBgColors.slate;

    return (
        <div className="space-y-3">
            {/* Primary Mood */}
            <div className={clsx(
                "px-4 py-3 rounded-xl border flex items-start gap-3",
                badgeColor
            )}>
                <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg">{mood.primary}</span>
                        {mood.secondary.map((s, i) => (
                            <span key={i} className="text-xs opacity-70 font-medium">
                                • {s}
                            </span>
                        ))}
                    </div>
                    <p className="text-sm opacity-80 mt-1 leading-relaxed">
                        {mood.description}
                    </p>
                </div>
            </div>

            {/* Characteristics Pills */}
            <div className="flex flex-wrap gap-2">
                {characteristics.map((c, i) => (
                    <span
                        key={i}
                        className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs font-medium text-slate-300"
                    >
                        {c}
                    </span>
                ))}
            </div>
        </div>
    );
}

function IntervalMatrix({ intervals, notes }: { intervals: AdjacentInterval[]; notes: string[] }) {
    const qualityColors: Record<string, string> = {
        stable: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
        tense: "bg-red-500/20 border-red-500/40 text-red-300",
        open: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300",
        bright: "bg-amber-500/20 border-amber-500/40 text-amber-300",
        dark: "bg-purple-500/20 border-purple-500/40 text-purple-300",
    };

    const qualityLabels: Record<string, string> = {
        stable: "Estable",
        tense: "Tenso",
        open: "Abierto",
        bright: "Brillante",
        dark: "Oscuro",
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-slate-400" />
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Intervalos entre Cuerdas
                </h4>
            </div>

            {/* Visual Matrix */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {notes.map((note, i) => (
                    <div key={i} className="flex items-center">
                        {/* Note */}
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 mb-1">
                                {i + 1}
                            </span>
                            <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg min-w-[48px] text-center">
                                <span className="font-mono font-bold text-white text-sm">
                                    {note.replace(/\d/, '')}
                                </span>
                                <span className="font-mono text-slate-400 text-xs">
                                    {note.match(/\d/)?.[0]}
                                </span>
                            </div>
                        </div>

                        {/* Interval Arrow (except after last note) */}
                        {i < intervals.length && (
                            <div className="flex flex-col items-center mx-1">
                                <ArrowRight className="w-3 h-3 text-slate-600" />
                                <div className={clsx(
                                    "px-2 py-1 rounded border text-xs font-mono font-bold",
                                    qualityColors[intervals[i].quality]
                                )}>
                                    {intervals[i].interval}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Detailed List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {intervals.map((interval, i) => (
                    <div
                        key={i}
                        className={clsx(
                            "px-3 py-2 rounded-lg border flex items-center justify-between",
                            qualityColors[interval.quality]
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs opacity-60">
                                {interval.fromString + 1}→{interval.toString + 1}
                            </span>
                            <span className="font-medium text-sm">
                                {interval.intervalName}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm">
                                {interval.interval}
                            </span>
                            <span className="text-[10px] opacity-60 font-medium uppercase">
                                {qualityLabels[interval.quality]}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
