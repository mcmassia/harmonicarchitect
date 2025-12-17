"use client";

import { useProgressionStore, COMMON_KEYS, DEFAULT_ALGORITHM_OPTIONS } from '@/store/progressionStore';
import { useTuningStore } from '@/store/tuningStore';
import { ProgressionCard } from './ProgressionCard';
import { TablatureView } from './TablatureView';
import { SavedProgressionsPanel } from './SavedProgressionsPanel';
import { ChordSelector } from './ChordSelector';
import {
    Sparkles,
    RefreshCw,
    Settings2,
    Volume2,
    VolumeX,
    ChevronDown,
    ChevronUp,
    Music,
    Layers,
    Sliders,
    RotateCcw,
    Info
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

export function ComposerPanel() {
    const {
        chordCount,
        setChordCount,
        requiredChords,
        addRequiredChord,
        removeRequiredChord,
        key,
        setKey,
        continueFromProgression,
        setContinueFrom,
        algorithmOptions,
        setAlgorithmOption,
        resetAlgorithmOptions,
        generatedProgressions,
        selectedProgression,
        currentTablature,
        isPlaying,
        generate,
        selectProgression,
        playSelected,
        stopPlaying,
        saveProgression,
        saveTablature,
        // Playback options
        instrument,
        setInstrument,
        arpeggioSpeed,
        setArpeggioSpeed
    } = useProgressionStore();

    const { strings } = useTuningStore();
    const [showSettings, setShowSettings] = useState(false);
    const [showAlgorithm, setShowAlgorithm] = useState(false);
    const [showSaved, setShowSaved] = useState(false);

    const tuningDisplay = strings.map(s => s.note.name).reverse().join('-');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/20 rounded-lg">
                        <Sparkles className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Componer</h2>
                        <p className="text-sm text-slate-400">
                            Afinación: <span className="text-violet-400 font-mono">{tuningDisplay}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSaved(!showSaved)}
                        className={clsx(
                            "p-2 rounded-lg transition-colors",
                            showSaved
                                ? "bg-violet-500/30 text-violet-300"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                        )}
                        title="Progresiones guardadas"
                    >
                        <Layers className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowAlgorithm(!showAlgorithm)}
                        className={clsx(
                            "p-2 rounded-lg transition-colors",
                            showAlgorithm
                                ? "bg-cyan-500/30 text-cyan-300"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                        )}
                        title="Opciones del algoritmo"
                    >
                        <Sliders className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={clsx(
                            "p-2 rounded-lg transition-colors",
                            showSettings
                                ? "bg-violet-500/30 text-violet-300"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                        )}
                        title="Configuración básica"
                    >
                        <Settings2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Settings Panel (Basic) */}
            {showSettings && (
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Chord Count */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Número de acordes
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setChordCount(chordCount - 1)}
                                    disabled={chordCount <= 2}
                                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center text-xl font-bold text-white">
                                    {chordCount}
                                </span>
                                <button
                                    onClick={() => setChordCount(chordCount + 1)}
                                    disabled={chordCount >= 12}
                                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Key Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Tonalidad
                            </label>
                            <select
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            >
                                {COMMON_KEYS.map(k => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>

                        {/* Continue From */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Continuar desde
                            </label>
                            {continueFromProgression ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-violet-300 truncate flex-1">
                                        {continueFromProgression.name.substring(0, 30)}...
                                    </span>
                                    <button
                                        onClick={() => setContinueFrom(null)}
                                        className="text-red-400 hover:text-red-300 text-sm"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            ) : (
                                <span className="text-sm text-slate-500">
                                    Ninguna (nueva progresión)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Required Chords */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Acordes requeridos (opcional)
                        </label>
                        <ChordSelector
                            selectedChords={requiredChords}
                            onAdd={addRequiredChord}
                            onRemove={removeRequiredChord}
                            maxChords={chordCount}
                        />
                    </div>
                </div>
            )}

            {/* Algorithm Options Panel */}
            {showAlgorithm && (
                <div className="p-4 bg-cyan-950/30 rounded-xl border border-cyan-800/50 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                            <Sliders className="w-4 h-4" />
                            Parámetros del Algoritmo
                        </h4>
                        <button
                            onClick={resetAlgorithmOptions}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                            title="Restaurar valores por defecto"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Max Gaps */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                                Huecos máximos
                                <span className="text-slate-600" title="Cuerdas muted entre cuerdas que suenan. 0 = voicing cerrado">
                                    <Info className="w-3 h-3" />
                                </span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={0}
                                    max={4}
                                    value={algorithmOptions.maxGaps}
                                    onChange={(e) => setAlgorithmOption('maxGaps', parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <span className="w-6 text-center text-sm text-cyan-400 font-mono">
                                    {algorithmOptions.maxGaps}
                                </span>
                            </div>
                        </div>

                        {/* Max Open Strings */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                                Cuerdas al aire máx.
                                <span className="text-slate-600" title="Número máximo de cuerdas al aire permitidas">
                                    <Info className="w-3 h-3" />
                                </span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={0}
                                    max={6}
                                    value={algorithmOptions.maxOpenStrings}
                                    onChange={(e) => setAlgorithmOption('maxOpenStrings', parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <span className="w-6 text-center text-sm text-cyan-400 font-mono">
                                    {algorithmOptions.maxOpenStrings}
                                </span>
                            </div>
                        </div>

                        {/* Position Range */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                Rango de posición
                            </label>
                            <select
                                value={algorithmOptions.positionRange}
                                onChange={(e) => setAlgorithmOption('positionRange', e.target.value as 'low' | 'high' | 'any')}
                                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                                <option value="any">Cualquiera</option>
                                <option value="low">Trastes 0-5</option>
                                <option value="high">Trastes 6-12</option>
                            </select>
                        </div>

                        {/* Max Stretch */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                                Estiramiento máx.
                                <span className="text-slate-600" title="Máxima distancia entre trastes pisados">
                                    <Info className="w-3 h-3" />
                                </span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={1}
                                    max={6}
                                    value={algorithmOptions.maxStretch}
                                    onChange={(e) => setAlgorithmOption('maxStretch', parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <span className="w-6 text-center text-sm text-cyan-400 font-mono">
                                    {algorithmOptions.maxStretch}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Voice Leading Weight */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                                Peso Voice Leading
                                <span className="text-slate-600" title="% de importancia del movimiento mínimo entre acordes">
                                    <Info className="w-3 h-3" />
                                </span>
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 w-16">Ergonomía</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={10}
                                    value={algorithmOptions.voiceLeadingWeight}
                                    onChange={(e) => setAlgorithmOption('voiceLeadingWeight', parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <span className="text-xs text-slate-500 w-20">Voice Lead</span>
                                <span className="w-10 text-center text-sm text-cyan-400 font-mono">
                                    {algorithmOptions.voiceLeadingWeight}%
                                </span>
                            </div>
                        </div>

                        {/* Min Notes Per Chord */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                Notas mínimas
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={3}
                                    max={6}
                                    value={algorithmOptions.minNotesPerChord}
                                    onChange={(e) => setAlgorithmOption('minNotesPerChord', parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <span className="w-6 text-center text-sm text-cyan-400 font-mono">
                                    {algorithmOptions.minNotesPerChord}
                                </span>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={algorithmOptions.bassIsRoot}
                                    onChange={(e) => setAlgorithmOption('bassIsRoot', e.target.checked)}
                                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                                />
                                Bajo = Raíz
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={algorithmOptions.allowBarreChords}
                                    onChange={(e) => setAlgorithmOption('allowBarreChords', e.target.checked)}
                                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                                />
                                Permitir cejillas
                            </label>
                        </div>
                    </div>

                    {/* Chord Extensions Section */}
                    <div className="pt-3 mt-3 border-t border-cyan-800/30">
                        <h5 className="text-xs font-semibold text-amber-400 mb-3 flex items-center gap-2">
                            <Music className="w-3 h-3" />
                            Complejidad de Acordes
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Chord Complexity */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                                    Nivel de complejidad
                                    <span className="text-slate-600" title="Define qué tipo de extensiones pueden aparecer">
                                        <Info className="w-3 h-3" />
                                    </span>
                                </label>
                                <select
                                    value={algorithmOptions.chordComplexity}
                                    onChange={(e) => setAlgorithmOption('chordComplexity', e.target.value as 'triads' | 'sevenths' | 'extended' | 'jazz')}
                                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                    <option value="triads">Solo triadas (C, Am, G)</option>
                                    <option value="sevenths">Con 7ªs (Cmaj7, Am7)</option>
                                    <option value="extended">Extendidos (C9, Amadd9)</option>
                                    <option value="jazz">Jazz (C13, Am11, 7alt)</option>
                                </select>
                            </div>

                            {/* Extension Probability */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                                    Probabilidad extensión
                                    <span className="text-slate-600" title="% de acordes que tendrán extensiones">
                                        <Info className="w-3 h-3" />
                                    </span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={10}
                                        value={algorithmOptions.extensionProbability}
                                        onChange={(e) => setAlgorithmOption('extensionProbability', parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                    <span className="w-10 text-center text-sm text-amber-400 font-mono">
                                        {algorithmOptions.extensionProbability}%
                                    </span>
                                </div>
                            </div>

                            {/* Sus Preference */}
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={algorithmOptions.preferSus}
                                        onChange={(e) => setAlgorithmOption('preferSus', e.target.checked)}
                                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-amber-500 focus:ring-amber-500"
                                    />
                                    Permitir sus2/sus4
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate Button */}
            <button
                onClick={generate}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-3"
            >
                <RefreshCw className="w-5 h-5" />
                Generar {chordCount} acordes en {key}
            </button>

            {/* Results Grid */}
            {generatedProgressions.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Music className="w-5 h-5 text-violet-400" />
                        5 Progresiones Sugeridas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {generatedProgressions.map((prog, idx) => (
                            <ProgressionCard
                                key={prog.id}
                                progression={prog}
                                index={idx + 1}
                                isSelected={selectedProgression?.id === prog.id}
                                onSelect={() => selectProgression(prog.id)}
                                onContinue={() => setContinueFrom(prog)}
                                onSave={() => saveProgression(prog)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Tablature View */}
            {selectedProgression && currentTablature && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h3 className="text-lg font-semibold text-white">
                            Tablatura
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Instrument Selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Instrumento:</span>
                                <select
                                    value={instrument}
                                    onChange={(e) => setInstrument(e.target.value as 'piano' | 'guitar')}
                                    className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="piano">🎹 Piano</option>
                                    <option value="guitar">🎸 Guitarra</option>
                                </select>
                            </div>

                            {/* Arpeggio Speed */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Velocidad:</span>
                                <select
                                    value={arpeggioSpeed}
                                    onChange={(e) => setArpeggioSpeed(e.target.value as 'fast' | 'medium' | 'slow')}
                                    className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="fast">Rápido</option>
                                    <option value="medium">Medio</option>
                                    <option value="slow">Lento (notas claras)</option>
                                </select>
                            </div>

                            {/* Play/Stop Button */}
                            <button
                                onClick={isPlaying ? stopPlaying : playSelected}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                                    isPlaying
                                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                        : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                )}
                            >
                                {isPlaying ? (
                                    <>
                                        <VolumeX className="w-4 h-4" />
                                        Detener
                                    </>
                                ) : (
                                    <>
                                        <Volume2 className="w-4 h-4" />
                                        Reproducir
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => saveTablature(currentTablature)}
                                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                            >
                                Guardar Tab
                            </button>
                        </div>
                    </div>
                    <TablatureView tablature={currentTablature} />
                </div>
            )}

            {/* Saved Progressions Sidebar */}
            {showSaved && (
                <SavedProgressionsPanel
                    onClose={() => setShowSaved(false)}
                />
            )}
        </div>
    );
}
