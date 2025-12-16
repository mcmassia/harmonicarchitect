"use client";

import { useTuningStore } from '@/store/tuningStore';
import { getTensionStatus } from '@/lib/music/tension';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { clsx } from "clsx";

const NOTES = [
    { value: "C", label: "C" },
    { value: "C#", label: "C#/Db" },
    { value: "D", label: "D" },
    { value: "D#", label: "D#/Eb" },
    { value: "E", label: "E" },
    { value: "F", label: "F" },
    { value: "F#", label: "F#/Gb" },
    { value: "G", label: "G" },
    { value: "G#", label: "G#/Ab" },
    { value: "A", label: "A" },
    { value: "A#", label: "A#/Bb" },
    { value: "B", label: "B" }
];
const OCTAVES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function TuningEditor() {
    const { strings, updateString, addString, removeString, updateGauge, scaleLength, setScaleLength } = useTuningStore();

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white tracking-wide">String Configuration</h2>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 font-mono uppercase">Scale (in)</label>
                    <input
                        type="number"
                        value={scaleLength}
                        onChange={(e) => setScaleLength(parseFloat(e.target.value))}
                        className="w-16 bg-slate-800 border-none text-white text-sm rounded focus:ring-1 focus:ring-emerald-500 text-center"
                        step="0.5"
                    />
                </div>
            </div>

            <div className="space-y-3">
                {strings.map((str, idx) => {
                    const tensionStatus = getTensionStatus(str.tension || 0);
                    const isDanger = tensionStatus === "DANGER" || tensionStatus === "HIGH";
                    const isLoose = tensionStatus === "LOOSE";

                    return (
                        <div key={`${str.index}-${idx}`} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg hover:bg-slate-800 transition-colors animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="w-6 text-slate-500 font-mono text-xs text-center">{idx + 1}</div>

                            {/* Note Select */}
                            <select
                                value={str.note.name}
                                onChange={(e) => updateString(idx, `${e.target.value}${str.note.octave}`)}
                                className="bg-transparent text-white font-bold text-lg border-none focus:ring-0 cursor-pointer w-20 appearance-none"
                            >
                                {NOTES.map(n => <option key={n.value} value={n.value} className="bg-slate-800">{n.label}</option>)}
                            </select>

                            {/* Octave Select */}
                            <select
                                value={str.note.octave}
                                onChange={(e) => updateString(idx, `${str.note.name}${e.target.value}`)}
                                className="bg-slate-700 text-slate-300 text-sm rounded border-none w-12 text-center"
                            >
                                {OCTAVES.map(o => <option key={o} value={o} className="bg-slate-800">{o}</option>)}
                            </select>

                            {/* Gauge Input */}
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-500 uppercase">Gauge</span>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={str.gauge}
                                    onChange={(e) => updateGauge(idx, parseFloat(e.target.value))}
                                    className="w-16 bg-transparent text-slate-300 text-xs border-b border-slate-600 focus:border-emerald-500 focus:outline-none text-center"
                                />
                            </div>

                            {/* Tension Display */}
                            <div className="flex-1 text-right">
                                <div className={clsx("text-sm font-mono", {
                                    "text-red-500 font-bold": isDanger,
                                    "text-yellow-500": isLoose,
                                    "text-emerald-500": !isDanger && !isLoose
                                })}>
                                    {str.tension} lbs
                                </div>
                            </div>

                            {isDanger && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}

                            <button
                                onClick={() => removeString(idx)}
                                className="p-2 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )
                })}
            </div>

            <button
                onClick={addString}
                className="mt-6 w-full py-3 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-950/20 transition-all flex justify-center items-center gap-2 group"
            >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Add String</span>
            </button>
        </div>
    );
}
