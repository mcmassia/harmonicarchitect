"use client";

import { TuningEditor } from '@/components/tuning/TuningEditor';
import { Fretboard } from '@/components/fretboard/Fretboard';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { AnalysisDetails } from '@/components/analysis/AnalysisDetails';
import { MarkedNoteAnalysis } from '@/components/analysis/MarkedNoteAnalysis';
import { ChordScaleSelector } from '@/components/selectors/ChordScaleSelector';
import { Header } from '@/components/layout/Header';
import { TuningManager } from '@/components/tuning/TuningManager';
import { TuningDashboard } from '@/components/analysis/TuningDashboard';
import { useMarkedNotesStore } from '@/store/markedNotesStore';
import { useChordScaleStore } from '@/store/chordScaleStore';
import { Share2, PanelLeftClose, PanelLeftOpen, MousePointer2, Music2, Guitar } from 'lucide-react';
import { useState } from 'react';
import { StringGroupAnalysis } from '@/types/music';
import { clsx } from "clsx";

type AppMode = 'analysis' | 'interactive' | 'chordscale';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<StringGroupAnalysis | null>(null);
  const [currentMode, setCurrentMode] = useState<AppMode>('analysis');
  const { setInteractiveMode } = useMarkedNotesStore();
  const { setChordScaleMode } = useChordScaleStore();

  const handleModeChange = (mode: AppMode) => {
    setCurrentMode(mode);
    setInteractiveMode(mode === 'interactive');
    setChordScaleMode(mode === 'chordscale');
    setSelectedAnalysis(null);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30">

      <Header />

      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          <span>{isSidebarOpen ? "Hide Controls" : "Show Controls"}</span>
        </button>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => handleModeChange('analysis')}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
              currentMode === 'analysis'
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Music2 className="w-4 h-4" />
            <span>Análisis</span>
          </button>
          <button
            onClick={() => handleModeChange('interactive')}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
              currentMode === 'interactive'
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <MousePointer2 className="w-4 h-4" />
            <span>Marcar Notas</span>
          </button>
          <button
            onClick={() => handleModeChange('chordscale')}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
              currentMode === 'chordscale'
                ? "bg-amber-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Guitar className="w-4 h-4" />
            <span>Acordes/Escalas</span>
          </button>
        </div>
      </div>

      {/* Chord/Scale Selector - shown when in chordscale mode */}
      {currentMode === 'chordscale' && (
        <div className="mb-4">
          <ChordScaleSelector />
        </div>
      )}

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative transition-all duration-500 ease-in-out">

        {/* Left Panel: Tuning Controls */}
        {isSidebarOpen && (
          <div className="lg:col-span-3 space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
            <TuningEditor />
            <div className="mt-6">
              <TuningManager />
            </div>
          </div>
        )}

        {/* Right Panel: Visualization & Analysis */}
        <div className={clsx(
          "space-y-6 transition-all duration-500 ease-in-out",
          isSidebarOpen ? "lg:col-span-9" : "lg:col-span-12"
        )}>

          {/* Fretboard */}
          <section className={clsx(
            "backdrop-blur rounded-2xl border p-1 shadow-2xl transition-colors",
            currentMode === 'interactive'
              ? "bg-indigo-950/20 border-indigo-500/30"
              : currentMode === 'chordscale'
                ? "bg-amber-950/20 border-amber-500/30"
                : "bg-slate-900/30 border-white/5"
          )}>
            {currentMode === 'interactive' && (
              <div className="px-4 py-2 text-sm text-indigo-300 font-medium flex items-center gap-2">
                <MousePointer2 className="w-4 h-4 animate-pulse" />
                Modo interactivo: haz click en las notas para marcarlas
              </div>
            )}
            {currentMode === 'chordscale' && (
              <div className="px-4 py-2 text-sm text-amber-300 font-medium flex items-center gap-2">
                <Guitar className="w-4 h-4" />
                Selecciona un acorde y/o escala arriba para visualizarlo
              </div>
            )}
            <Fretboard
              highlightedNotes={selectedAnalysis?.notes}
              analysis={selectedAnalysis}
            />
          </section>

          {/* Tuning Dashboard - Only in analysis mode */}
          {currentMode === 'analysis' && (
            <section className="mb-6">
              <TuningDashboard />
            </section>
          )}

          {/* Analysis Grid & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Analysis List */}
            <section className="md:col-span-1 lg:col-span-1 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <span className={clsx(
                  "px-3 py-1 rounded text-sm uppercase tracking-widest font-mono",
                  currentMode === 'interactive'
                    ? "bg-indigo-500/10 text-indigo-400"
                    : currentMode === 'chordscale'
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-emerald-500/10 text-emerald-400"
                )}>
                  {currentMode === 'interactive'
                    ? "Acordes Posibles"
                    : currentMode === 'chordscale'
                      ? "Leyenda"
                      : "Harmonic Analysis"}
                </span>
              </h2>

              {currentMode === 'interactive' ? (
                <MarkedNoteAnalysis
                  onSelect={setSelectedAnalysis}
                  selectedAnalysis={selectedAnalysis}
                />
              ) : currentMode === 'chordscale' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-amber-500" />
                    <span className="text-amber-200 text-sm font-medium">Notas del Acorde</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-cyan-500" />
                    <span className="text-cyan-200 text-sm font-medium">Notas de la Escala</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500/10 to-cyan-500/10 border border-amber-500/30 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-cyan-500" />
                    <span className="text-slate-200 text-sm font-medium">Ambos (Acorde + Escala)</span>
                  </div>
                </div>
              ) : (
                <AnalysisCard
                  onSelect={setSelectedAnalysis}
                  selectedAnalysis={selectedAnalysis}
                />
              )}
            </section>

            {/* Details Panel */}
            <section className="md:col-span-1 lg:col-span-2">
              {selectedAnalysis ? (
                <AnalysisDetails analysis={selectedAnalysis} />
              ) : (
                /* Placeholder */
                <div className={clsx(
                  "h-full min-h-[300px] rounded-xl border border-dashed flex flex-col items-center justify-center gap-4",
                  currentMode === 'interactive'
                    ? "border-indigo-800 text-indigo-600 bg-indigo-950/10"
                    : currentMode === 'chordscale'
                      ? "border-amber-800 text-amber-600 bg-amber-950/10"
                      : "border-slate-800 text-slate-600 bg-slate-900/20"
                )}>
                  <Share2 className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">
                    {currentMode === 'interactive'
                      ? "Marca notas y selecciona un acorde"
                      : currentMode === 'chordscale'
                        ? "Selecciona un acorde y/o escala"
                        : "Select a chord to view details"}
                  </p>
                </div>
              )}
            </section>
          </div>

        </div>
      </div>

    </main>
  );
}
