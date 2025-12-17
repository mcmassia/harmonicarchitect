"use client";

import { useState, useEffect } from 'react';
import { X, Check, Bookmark } from 'lucide-react';
import { clsx } from 'clsx';
import { Chord } from '@tonaljs/tonal';
import { useSavedChordsStore } from '@/store/savedChordsStore';

// ============================================================================
// Constants
// ============================================================================

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CHORD_TYPES = [
    { value: '', label: 'Mayor' },
    { value: 'm', label: 'Menor' },
    { value: '7', label: '7' },
    { value: 'M7', label: 'maj7' },
    { value: 'm7', label: 'm7' },
    { value: 'dim', label: 'dim' },
    { value: 'dim7', label: 'dim7' },
    { value: 'aug', label: 'aug' },
    { value: 'sus2', label: 'sus2' },
    { value: 'sus4', label: 'sus4' },
    { value: 'add9', label: 'add9' },
    { value: 'madd9', label: 'madd9' },
    { value: 'm7b5', label: 'm7b5' },
    { value: '9', label: '9' },
    { value: 'm9', label: 'm9' },
    { value: 'M9', label: 'maj9' },
    { value: '11', label: '11' },
    { value: '13', label: '13' },
];

// ============================================================================
// Props
// ============================================================================

interface ChordEditModalProps {
    isOpen: boolean;
    currentChord: string;
    chordIndex: number;
    onApply: (newChordName: string) => void;
    onClose: () => void;
}

// ============================================================================
// Helper functions
// ============================================================================

function parseChordName(chordName: string): { root: string; type: string } {
    const chord = Chord.get(chordName);
    if (chord && !chord.empty && chord.tonic) {
        // Extract root and type from chord
        const root = chord.tonic;
        const type = chordName.replace(root, '');
        return { root, type };
    }
    // Fallback: try basic parsing
    const match = chordName.match(/^([A-G][#b]?)(.*)$/);
    if (match) {
        return { root: match[1], type: match[2] };
    }
    return { root: 'C', type: '' };
}

// ============================================================================
// Component
// ============================================================================

export function ChordEditModal({
    isOpen,
    currentChord,
    chordIndex,
    onApply,
    onClose
}: ChordEditModalProps) {
    const { saveChord, isChordSaved } = useSavedChordsStore();

    const parsed = parseChordName(currentChord);
    const [selectedRoot, setSelectedRoot] = useState(parsed.root);
    const [selectedType, setSelectedType] = useState(parsed.type);

    // Reset when modal opens with a different chord
    useEffect(() => {
        if (isOpen) {
            const parsed = parseChordName(currentChord);
            setSelectedRoot(parsed.root);
            setSelectedType(parsed.type);
        }
    }, [isOpen, currentChord]);

    if (!isOpen) return null;

    const newChordName = selectedRoot + selectedType;
    const isSaved = isChordSaved(newChordName);

    const handleApply = () => {
        onApply(newChordName);
        onClose();
    };

    const handleSaveChord = () => {
        saveChord(newChordName);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">
                        Editar Acorde #{chordIndex + 1}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Current chord display */}
                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-slate-400">Acorde actual:</span>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-2xl font-mono font-bold text-slate-300">
                            {currentChord}
                        </span>
                        <span className="text-slate-600">→</span>
                        <span className={clsx(
                            "text-2xl font-mono font-bold",
                            newChordName === currentChord ? "text-slate-500" : "text-violet-400"
                        )}>
                            {newChordName}
                        </span>
                    </div>
                </div>

                {/* Root note selector */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                        Nota raíz
                    </label>
                    <div className="grid grid-cols-6 gap-1.5">
                        {ROOT_NOTES.map(note => (
                            <button
                                key={note}
                                onClick={() => setSelectedRoot(note)}
                                className={clsx(
                                    "py-2 rounded-lg text-sm font-medium transition-colors",
                                    selectedRoot === note
                                        ? "bg-violet-500 text-white"
                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                )}
                            >
                                {note}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chord type selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                        Tipo de acorde
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-2">
                        {CHORD_TYPES.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setSelectedType(value)}
                                className={clsx(
                                    "py-2 px-3 rounded-lg text-sm font-medium transition-colors text-left",
                                    selectedType === value
                                        ? "bg-violet-500 text-white"
                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    {/* Save chord button */}
                    <button
                        onClick={handleSaveChord}
                        disabled={isSaved}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isSaved
                                ? "bg-amber-500/20 text-amber-400 cursor-default"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        )}
                        title={isSaved ? "Acorde guardado" : "Guardar acorde"}
                    >
                        <Bookmark className={clsx("w-4 h-4", isSaved && "fill-amber-400")} />
                        {isSaved ? "Guardado" : "Guardar acorde"}
                    </button>

                    {/* Apply/Cancel buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={newChordName === currentChord}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                newChordName === currentChord
                                    ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                                    : "bg-violet-600 text-white hover:bg-violet-500"
                            )}
                        >
                            <Check className="w-4 h-4" />
                            Aplicar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
