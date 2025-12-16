"use client";

import { StringGroupAnalysis } from "@/types/music";
import { BookOpen, Lightbulb, Music } from "lucide-react";

interface AnalysisDetailsProps {
    analysis: StringGroupAnalysis | null;
}

export function AnalysisDetails({ analysis }: AnalysisDetailsProps) {
    if (!analysis) return null;

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 h-full backdrop-blur-sm animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Chord Theory & Application
            </h3>

            <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Identity</h4>
                    <p className="text-2xl font-black text-white">{analysis.chordName}</p>
                    <p className="text-emerald-400 font-medium">{analysis.emotionalTag}</p>
                </div>

                {/* Intervals */}
                <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Structure
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.intervals.map((interval, i) => (
                            <span key={i} className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 font-mono text-sm">
                                {interval}
                                <span className="ml-2 text-indigo-400 text-xs">
                                    {analysis.notes[i]}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Theoretical Context */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        Musical Context
                    </h4>

                    <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
                        <p>
                            The <strong className="text-white">{analysis.chordName}</strong> is often used in
                            <span className="text-indigo-300"> {analysis.emotionalTag}</span> styles.
                        </p>

                        {analysis.chordName.includes("Maj7") && (
                            <p>Major 7th chords provide a resolved yet dreamy quality, staple in Jazz, Lo-Fi, and Midwest Emo.</p>
                        )}
                        {analysis.chordName.includes("m7") && (
                            <p>Minor 7th chords add sophistication to minor tonalities, avoiding the harshness of plain minor triads.</p>
                        )}
                        {analysis.chordName.includes("sus") && (
                            <p>Suspended chords create ambiguity and open space, perfect for math-rock tapping sections and transitions.</p>
                        )}
                        {analysis.chordName.includes("add9") && (
                            <p>Added 9th intervals bring a nostalgic, yearning quality without the functional weight of a dominant 7th.</p>
                        )}
                    </div>
                </div>

                {/* Application Suggestions */}
                <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-lg">
                    <h5 className="text-indigo-300 font-bold mb-2 text-sm">Try This:</h5>
                    <p className="text-xs text-slate-400">
                        Use this voicing as a starting point for tapping patterns.
                        The open string relationships in this tuning allow for easy hammer-ons to adjacent scale tones.
                    </p>
                </div>
            </div>
        </div>
    );
}
