"use client";

import { useChordScaleStore, getChordDisplayName, getScaleDisplayName } from '@/store/chordScaleStore';
import { Music, Layers, X } from 'lucide-react';
import { clsx } from 'clsx';

export function ChordScaleSelector() {
    const {
        selectedRoot,
        selectedChordType,
        selectedScaleType,
        rootNotes,
        chordTypes,
        scaleTypes,
        setRoot,
        setChordType,
        setScaleType,
        clearSelections,
    } = useChordScaleStore();

    const chordDisplayName = getChordDisplayName(selectedRoot, selectedChordType);
    const scaleDisplayName = getScaleDisplayName(selectedRoot, selectedScaleType);

    return (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            {/* Root Note Selector */}
            <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Raíz</label>
                <select
                    value={selectedRoot}
                    onChange={(e) => setRoot(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm font-medium focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all cursor-pointer"
                >
                    {rootNotes.map(note => (
                        <option key={note} value={note}>{note}</option>
                    ))}
                </select>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-700" />

            {/* Chord Type Selector */}
            <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Acorde</label>
                <select
                    value={selectedChordType ?? ''}
                    onChange={(e) => setChordType(e.target.value === '' && selectedChordType !== null ? null : e.target.value)}
                    className={clsx(
                        "px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 outline-none transition-all cursor-pointer",
                        selectedChordType !== null
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-200 focus:ring-amber-500/50"
                            : "bg-slate-800 border-slate-600 text-white focus:ring-slate-500/50"
                    )}
                >
                    <option value="">-- Ninguno --</option>
                    {chordTypes.map(type => (
                        <option key={type} value={type}>
                            {type === '' ? 'Mayor' : type}
                        </option>
                    ))}
                </select>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-700" />

            {/* Scale Type Selector */}
            <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Escala</label>
                <select
                    value={selectedScaleType ?? ''}
                    onChange={(e) => setScaleType(e.target.value === '' ? null : e.target.value)}
                    className={clsx(
                        "px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 outline-none transition-all cursor-pointer",
                        selectedScaleType
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-200 focus:ring-cyan-500/50"
                            : "bg-slate-800 border-slate-600 text-white focus:ring-slate-500/50"
                    )}
                >
                    <option value="">-- Ninguna --</option>
                    {scaleTypes.map(type => (
                        <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Active Selections Display */}
            {(chordDisplayName || scaleDisplayName) && (
                <>
                    <div className="h-8 w-px bg-slate-700" />
                    <div className="flex items-center gap-2 flex-wrap">
                        {chordDisplayName && (
                            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-sm font-bold">
                                🎸 {chordDisplayName}
                            </span>
                        )}
                        {scaleDisplayName && (
                            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-300 text-sm font-bold">
                                🎵 {scaleDisplayName}
                            </span>
                        )}
                        <button
                            onClick={clearSelections}
                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                            title="Limpiar selección"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
