"use client";

import { useState, useMemo } from 'react';
import { Chord, Scale, Note } from '@tonaljs/tonal';
import { X, Plus, Search } from 'lucide-react';
import { clsx } from 'clsx';

interface ChordSelectorProps {
    selectedChords: string[];
    onAdd: (chord: string) => void;
    onRemove: (chord: string) => void;
    maxChords: number;
}

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const COMMON_CHORD_TYPES = [
    { type: '', label: 'maj' },
    { type: 'm', label: 'min' },
    { type: '7', label: '7' },
    { type: 'maj7', label: 'maj7' },
    { type: 'm7', label: 'm7' },
    { type: 'sus2', label: 'sus2' },
    { type: 'sus4', label: 'sus4' },
    { type: 'add9', label: 'add9' },
    { type: 'dim', label: 'dim' },
    { type: 'aug', label: 'aug' },
];

export function ChordSelector({
    selectedChords,
    onAdd,
    onRemove,
    maxChords
}: ChordSelectorProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [selectedRoot, setSelectedRoot] = useState('C');
    const [searchQuery, setSearchQuery] = useState('');

    const canAddMore = selectedChords.length < maxChords;

    const handleAddChord = (chordName: string) => {
        if (canAddMore && !selectedChords.includes(chordName)) {
            onAdd(chordName);
        }
    };

    const handleQuickAdd = () => {
        const chordName = searchQuery.trim();
        if (chordName && canAddMore) {
            // Validate chord
            const chord = Chord.get(chordName);
            if (!chord.empty) {
                handleAddChord(chordName);
                setSearchQuery('');
            }
        }
    };

    const filteredChords = useMemo(() => {
        if (!searchQuery) return [];
        const query = searchQuery.toLowerCase();

        // Generate suggestions based on query
        const suggestions: string[] = [];

        for (const root of ROOT_NOTES) {
            for (const { type, label } of COMMON_CHORD_TYPES) {
                const chordName = root + type;
                if (chordName.toLowerCase().includes(query) ||
                    (root.toLowerCase() + label.toLowerCase()).includes(query)) {
                    suggestions.push(chordName);
                }
            }
        }

        return suggestions.slice(0, 8);
    }, [searchQuery]);

    return (
        <div className="space-y-3">
            {/* Selected Chords */}
            <div className="flex flex-wrap gap-2">
                {selectedChords.map((chord, idx) => (
                    <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 border border-violet-500/50 rounded-lg text-sm text-violet-200"
                    >
                        {chord}
                        <button
                            onClick={() => onRemove(chord)}
                            className="p-0.5 hover:bg-violet-500/30 rounded"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {canAddMore && (
                    <button
                        onClick={() => setShowPicker(!showPicker)}
                        className={clsx(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                            showPicker
                                ? "bg-violet-500/30 text-violet-300 border border-violet-500/50"
                                : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        Añadir
                    </button>
                )}
            </div>

            {/* Chord Picker */}
            {showPicker && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-4 animate-in fade-in duration-200">
                    {/* Quick Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleQuickAdd();
                                }
                            }}
                            placeholder="Buscar acorde (ej: Am7, Gadd9)..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>

                    {/* Search Suggestions */}
                    {filteredChords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {filteredChords.map(chord => (
                                <button
                                    key={chord}
                                    onClick={() => {
                                        handleAddChord(chord);
                                        setSearchQuery('');
                                    }}
                                    disabled={selectedChords.includes(chord)}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                        selectedChords.includes(chord)
                                            ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                                            : "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
                                    )}
                                >
                                    {chord}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Grid Picker */}
                    <div className="space-y-3">
                        {/* Root Selection */}
                        <div>
                            <label className="text-xs text-slate-500 mb-1.5 block">Raíz</label>
                            <div className="flex flex-wrap gap-1">
                                {ROOT_NOTES.map(root => (
                                    <button
                                        key={root}
                                        onClick={() => setSelectedRoot(root)}
                                        className={clsx(
                                            "w-8 h-8 rounded text-sm font-medium transition-colors",
                                            selectedRoot === root
                                                ? "bg-violet-500 text-white"
                                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                        )}
                                    >
                                        {root}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chord Type Selection */}
                        <div>
                            <label className="text-xs text-slate-500 mb-1.5 block">Tipo</label>
                            <div className="flex flex-wrap gap-1">
                                {COMMON_CHORD_TYPES.map(({ type, label }) => {
                                    const chordName = selectedRoot + type;
                                    const isSelected = selectedChords.includes(chordName);

                                    return (
                                        <button
                                            key={type}
                                            onClick={() => handleAddChord(chordName)}
                                            disabled={isSelected}
                                            className={clsx(
                                                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                                                isSelected
                                                    ? "bg-emerald-500/30 text-emerald-400"
                                                    : "bg-slate-700 text-slate-300 hover:bg-violet-500/30 hover:text-violet-300"
                                            )}
                                        >
                                            {selectedRoot}{label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Close */}
                    <button
                        onClick={() => setShowPicker(false)}
                        className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Cerrar selector
                    </button>
                </div>
            )}

            {/* Help text */}
            {selectedChords.length > 0 && (
                <p className="text-xs text-slate-500">
                    {selectedChords.length} de {maxChords} acordes • Estos acordes aparecerán en la progresión generada
                </p>
            )}
        </div>
    );
}
