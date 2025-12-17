"use client";

import { useChordScaleStore, getChordDisplayName, getScaleDisplayName } from '@/store/chordScaleStore';
import { useSavedChordsStore } from '@/store/savedChordsStore';
import { Music, Layers, X, Bookmark, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { Chord, Scale, Note } from '@tonaljs/tonal';
import { playArpeggio, playProgression } from '@/lib/audio/player';

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

    const { savedChords } = useSavedChordsStore();

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

            {/* Audio Handlers */}
            {(() => {
                const handlePlayChord = () => {
                    if (!selectedRoot || selectedChordType === null) return;
                    // Play chords in 3rd octave
                    const chord = Chord.get(`${selectedRoot}${selectedChordType}`);
                    const notes = chord.intervals.map(ivl => Note.transpose(`${selectedRoot}3`, ivl));
                    playArpeggio(notes);
                };

                const handlePlayScale = () => {
                    if (!selectedRoot || !selectedScaleType) return;
                    const scale = Scale.get(`${selectedRoot} ${selectedScaleType}`);
                    const startNote = `${selectedRoot}3`;
                    // Generate one octave of notes
                    const notes = scale.intervals.map(ivl => Note.transpose(startNote, ivl));
                    // Add octave
                    notes.push(Note.transpose(startNote, '8P'));

                    playProgression([notes], {
                        arpeggio: true,
                        arpeggioSpeed: 'medium',
                        instrument: 'piano',
                        noteDuration: 0.5
                    });
                };

                return (chordDisplayName || scaleDisplayName) && (
                    <>
                        <div className="h-8 w-px bg-slate-700" />
                        <div className="flex items-center gap-2 flex-wrap">
                            {chordDisplayName && (
                                <div className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-sm font-bold">
                                    <span>🎸 {chordDisplayName}</span>
                                    <button
                                        onClick={handlePlayChord}
                                        className="ml-1 p-0.5 hover:text-white transition-colors"
                                        title="Escuchar acorde"
                                    >
                                        <Play className="w-3 h-3 fill-current" />
                                    </button>
                                </div>
                            )}
                            {scaleDisplayName && (
                                <div className="flex items-center gap-1 px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-300 text-sm font-bold">
                                    <span>🎵 {scaleDisplayName}</span>
                                    <button
                                        onClick={handlePlayScale}
                                        className="ml-1 p-0.5 hover:text-white transition-colors"
                                        title="Escuchar escala"
                                    >
                                        <Play className="w-3 h-3 fill-current" />
                                    </button>
                                </div>
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
                );
            })()}

            {/* Saved Chords Dropdown */}
            {savedChords.length > 0 && (
                <>
                    <div className="h-8 w-px bg-slate-700" />
                    <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-emerald-400" />
                        <select
                            onChange={(e) => {
                                const chordName = e.target.value;
                                if (!chordName) return;

                                const match = chordName.match(/^([A-G][#b]?)(.*)$/);
                                if (match) {
                                    const [, root, type] = match;
                                    setRoot(root);
                                    setChordType(type || '');
                                    // Reset dropdown
                                    e.target.value = '';
                                }
                            }}
                            className="w-8 h-8 opacity-0 absolute cursor-pointer"
                            title="Seleccionar acorde guardado"
                        >
                            <option value="">Seleccionar guardado...</option>
                            {savedChords.map(chord => (
                                <option key={chord.id} value={chord.name}>
                                    {chord.name}
                                </option>
                            ))}
                        </select>
                        {/* Custom styled trigger since select is hidden/ugly */}
                        <div className="relative pointer-events-none px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
                            <span>Guardados</span>
                            <span className="bg-slate-700 px-1.5 rounded text-xs text-slate-300">
                                {savedChords.length}
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
