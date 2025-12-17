"use client";

import { useSavedChordsStore, SavedChord } from '@/store/savedChordsStore';
import { useChordScaleStore } from '@/store/chordScaleStore';
import { X, Trash2, Music, Eye, Clock, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { useTuningStore } from '@/store/tuningStore';
import { generateVoicingsForChord } from '@/lib/music/composer';
import { playArpeggio } from '@/lib/audio/player';
import { Note } from '@tonaljs/tonal';

// ============================================================================
// Props
// ============================================================================

interface SavedChordsPanelProps {
    onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function SavedChordsPanel({ onClose }: SavedChordsPanelProps) {
    const { savedChords, deleteChord, clearAllChords } = useSavedChordsStore();
    const { setRoot, setChordType, setChordScaleMode } = useChordScaleStore();
    const { strings } = useTuningStore();

    const handlePlayChord = (chordName: string) => {
        const currentTuning = strings.map(s => s.note.scientific);
        const voicings = generateVoicingsForChord(chordName, currentTuning, 5);

        if (voicings.length > 0) {
            const voicing = voicings[0];
            const notesToPlay = [];

            // Assuming voicing.frets corresponds to strings (High to Low typically in our app logic)
            // But verify: strings array is High to Low (index 0 = string 1).
            // voicing.frets should be same length and order.

            for (let i = 0; i < currentTuning.length; i++) {
                const fret = voicing.frets[i];
                if (fret >= 0) {
                    const stringNote = currentTuning[i];
                    const midi = Note.midi(stringNote);
                    if (midi) {
                        notesToPlay.push(Note.fromMidi(midi + fret));
                    }
                }
            }
            // Sort low to high for playArpeggio?
            // playArpeggio line 442 reverses the input notes.
            // If input is High to Low (E4...E2), reverse makes it E2...E4 (Low to High).
            // This is correct for guitar strum (downstroke).
            playArpeggio(notesToPlay);
        }
    };

    const formatDate = (date: Date) => {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return 'Fecha desconocida';
        }
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewOnFretboard = (chordName: string) => {
        // Parse chord to extract root and type
        const match = chordName.match(/^([A-G][#b]?)(.*)$/);
        if (match) {
            const [, root, type] = match;
            setRoot(root);
            setChordType(type || '');
            setChordScaleMode(true);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Music className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Acordes Guardados</h3>
                            <p className="text-xs text-slate-400">
                                {savedChords.length} acorde{savedChords.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {savedChords.length > 0 && (
                            <button
                                onClick={() => {
                                    if (confirm('¿Eliminar todos los acordes guardados?')) {
                                        clearAllChords();
                                    }
                                }}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                title="Eliminar todos"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    {savedChords.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay acordes guardados</p>
                            <p className="text-xs mt-1">
                                Guarda acordes desde el editor de progresiones
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {savedChords.map((chord) => (
                                <SavedChordItem
                                    key={chord.id}
                                    chord={chord}
                                    onView={() => handleViewOnFretboard(chord.name)}
                                    onPlay={() => handlePlayChord(chord.name)}
                                    onDelete={() => deleteChord(chord.id)}
                                    formatDate={formatDate}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Sub-component
// ============================================================================

interface SavedChordItemProps {
    chord: SavedChord;
    onView: () => void;
    onPlay: () => void;
    onDelete: () => void;
    formatDate: (date: Date) => string;
}

function SavedChordItem({ chord, onView, onPlay, onDelete, formatDate }: SavedChordItemProps) {
    return (
        <div className="group p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-amber-500/30 transition-all">
            {/* Chord name */}
            <div className="text-lg font-mono font-bold text-white mb-2">
                {chord.name}
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                <Clock className="w-3 h-3" />
                {formatDate(chord.createdAt)}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onView}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-colors"
                    title="Ver en diapasón"
                >
                    <Eye className="w-3 h-3" />
                    Ver
                </button>
                <button
                    onClick={onPlay}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                    title="Escuchar"
                >
                    <Play className="w-3 h-3" />
                    Oír
                </button>
                <button
                    onClick={onDelete}
                    className="p-1.5 rounded bg-slate-700/50 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
