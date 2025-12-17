"use client";

import { Tablature, TablatureBar } from '@/lib/music/tablature';
import { ChordVoicing } from '@/lib/music/composer';
import { Copy, Download, Check, Grid3X3, List } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Note } from '@tonaljs/tonal';

interface TablatureViewProps {
    tablature: Tablature;
}

type ViewMode = 'diagrams' | 'inline';

export function TablatureView({ tablature }: TablatureViewProps) {
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('diagrams');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(tablature.ascii);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy', e);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([tablature.ascii], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tablatura_${tablature.progressionName.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-300">
                            {tablature.progressionName}
                        </span>
                        <span className="text-xs text-slate-500">
                            • {tablature.bars.length} acordes
                        </span>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-zinc-800 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('diagrams')}
                            className={clsx(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
                                viewMode === 'diagrams'
                                    ? "bg-violet-500 text-white"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Grid3X3 className="w-3.5 h-3.5" />
                            Diagramas
                        </button>
                        <button
                            onClick={() => setViewMode('inline')}
                            className={clsx(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
                                viewMode === 'inline'
                                    ? "bg-violet-500 text-white"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <List className="w-3.5 h-3.5" />
                            Tab
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                            copied
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                        )}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copiado' : 'Copiar'}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Descargar
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {viewMode === 'diagrams' ? (
                    <ChordDiagramsView bars={tablature.bars} tuning={tablature.tuning} />
                ) : (
                    <InlineTabView ascii={tablature.ascii} />
                )}
            </div>

            {/* Legend */}
            <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> cuerda al aire
                </span>
                <span className="flex items-center gap-1">
                    <span className="text-slate-400">×</span> silenciada
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" /> traste pisado
                </span>
            </div>
        </div>
    );
}

// ============================================================================
// Chord Diagrams View - Visual chord boxes
// ============================================================================

interface ChordDiagramsViewProps {
    bars: TablatureBar[];
    tuning: string[];
}

function ChordDiagramsView({ bars, tuning }: ChordDiagramsViewProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bars.map((bar, idx) => (
                <ChordDiagram
                    key={idx}
                    voicing={bar.voicing}
                    tuning={tuning}
                    index={idx + 1}
                />
            ))}
        </div>
    );
}

interface ChordDiagramProps {
    voicing: ChordVoicing;
    tuning: string[];
    index: number;
}

function ChordDiagram({ voicing, tuning, index }: ChordDiagramProps) {
    const numStrings = tuning.length;

    // Reverse frets and tuning for correct display (bass = left, treble = right)
    // Original arrays: index 0 = highest string (e.g., E4), last index = lowest (e.g., E2)
    // Reversed: index 0 = bass (E2), last = treble (E4)
    const reversedFrets = [...voicing.frets].reverse();
    const reversedTuning = [...tuning].reverse();

    // Find fret range to display (from original, unreversed array)
    const pressedFrets = voicing.frets.filter(f => f > 0);
    const minFret = pressedFrets.length > 0 ? Math.min(...pressedFrets) : 0;
    const maxFret = pressedFrets.length > 0 ? Math.max(...pressedFrets) : 0;

    // Determine starting fret for the diagram
    const startFret = minFret > 3 ? minFret - 1 : 0;
    const endFret = Math.max(startFret + 4, maxFret);
    const fretRange = endFret - startFret;

    // Diagram dimensions
    const stringSpacing = 24;
    const fretSpacing = 28;
    const width = (numStrings - 1) * stringSpacing + 40;
    const height = fretRange * fretSpacing + 60;
    const offsetX = 20;
    const offsetY = 30;

    // Get tuning labels (reversed so bass is on left)
    const tuningLabels = reversedTuning.map(n => Note.pitchClass(n));

    return (
        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 hover:border-zinc-700 transition-colors">
            {/* Chord name and index */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-mono">#{index}</span>
                <span className="text-sm font-bold text-amber-400">{voicing.chord}</span>
            </div>

            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full"
                style={{ maxHeight: '180px' }}
            >
                {/* Nut (cejuela) - only if starting at fret 0 */}
                {startFret === 0 && (
                    <rect
                        x={offsetX - 4}
                        y={offsetY - 4}
                        width={(numStrings - 1) * stringSpacing + 8}
                        height={6}
                        fill="#a78bfa"
                        rx={2}
                    />
                )}

                {/* Fret position indicator (if not at nut) */}
                {startFret > 0 && (
                    <text
                        x={offsetX - 14}
                        y={offsetY + fretSpacing / 2 + 4}
                        className="fill-slate-500 text-xs"
                        fontSize="10"
                        textAnchor="middle"
                    >
                        {startFret}
                    </text>
                )}

                {/* Frets */}
                {Array.from({ length: fretRange + 1 }).map((_, fretIdx) => (
                    <line
                        key={`fret-${fretIdx}`}
                        x1={offsetX}
                        y1={offsetY + fretIdx * fretSpacing}
                        x2={offsetX + (numStrings - 1) * stringSpacing}
                        y2={offsetY + fretIdx * fretSpacing}
                        stroke={fretIdx === 0 && startFret === 0 ? "#a78bfa" : "#3f3f46"}
                        strokeWidth={fretIdx === 0 && startFret === 0 ? 3 : 1}
                    />
                ))}

                {/* Strings */}
                {Array.from({ length: numStrings }).map((_, stringIdx) => (
                    <line
                        key={`string-${stringIdx}`}
                        x1={offsetX + stringIdx * stringSpacing}
                        y1={offsetY}
                        x2={offsetX + stringIdx * stringSpacing}
                        y2={offsetY + fretRange * fretSpacing}
                        stroke="#52525b"
                        strokeWidth={1.5}
                    />
                ))}

                {/* String labels at bottom */}
                {tuningLabels.map((label, stringIdx) => (
                    <text
                        key={`label-${stringIdx}`}
                        x={offsetX + stringIdx * stringSpacing}
                        y={offsetY + fretRange * fretSpacing + 16}
                        className="fill-slate-600"
                        fontSize="9"
                        textAnchor="middle"
                    >
                        {label}
                    </text>
                ))}

                {/* Finger positions */}
                {reversedFrets.map((fret, stringIdx) => {
                    const x = offsetX + stringIdx * stringSpacing;

                    if (fret < 0) {
                        // Muted string - X above
                        return (
                            <text
                                key={`muted-${stringIdx}`}
                                x={x}
                                y={offsetY - 12}
                                className="fill-slate-500"
                                fontSize="12"
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                ×
                            </text>
                        );
                    }

                    if (fret === 0) {
                        // Open string - circle above
                        return (
                            <circle
                                key={`open-${stringIdx}`}
                                cx={x}
                                cy={offsetY - 12}
                                r={5}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth={2}
                            />
                        );
                    }

                    // Fretted note - filled circle
                    const fretPos = fret - startFret;
                    const y = offsetY + (fretPos - 0.5) * fretSpacing;

                    return (
                        <g key={`fret-pos-${stringIdx}`}>
                            <circle
                                cx={x}
                                cy={y}
                                r={9}
                                fill="#8b5cf6"
                                stroke="#a78bfa"
                                strokeWidth={1}
                            />
                            <text
                                x={x}
                                y={y + 3.5}
                                className="fill-white"
                                fontSize="10"
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                {fret}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Ergonomy score */}
            <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        style={{ width: `${voicing.ergonomyScore}%` }}
                    />
                </div>
                <span className="text-xs text-emerald-400 font-mono w-8 text-right">
                    {voicing.ergonomyScore}%
                </span>
            </div>
        </div>
    );
}

// ============================================================================
// Inline Tab View - Traditional ASCII tablature
// ============================================================================

interface InlineTabViewProps {
    ascii: string;
}

function InlineTabView({ ascii }: InlineTabViewProps) {
    const lines = ascii.split('\n');

    return (
        <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
            {lines.map((line, idx) => {
                const isHeader = line.startsWith('Afinación:');
                const isStringLine = line.includes('|');
                const isChordLine = line.trim() && !isStringLine && !isHeader;

                return (
                    <div
                        key={idx}
                        className={clsx(
                            isHeader && 'text-violet-400 font-bold mb-2',
                            isChordLine && 'text-amber-400 font-bold',
                            isStringLine && 'text-slate-300',
                            !line.trim() && 'h-2'
                        )}
                    >
                        {isStringLine ? (
                            <StringLineRender content={line} />
                        ) : (
                            line
                        )}
                    </div>
                );
            })}
        </pre>
    );
}

function StringLineRender({ content }: { content: string }) {
    const parts = content.split('');

    return (
        <span>
            {parts.map((char, idx) => {
                if (char === '0') {
                    return <span key={idx} className="text-emerald-400 font-bold">{char}</span>;
                }
                if (char === 'x') {
                    return <span key={idx} className="text-slate-600">{char}</span>;
                }
                if (char === '|') {
                    return <span key={idx} className="text-zinc-700">{char}</span>;
                }
                if (/\d/.test(char)) {
                    return <span key={idx} className="text-violet-300">{char}</span>;
                }
                return <span key={idx} className="text-slate-500">{char}</span>;
            })}
        </span>
    );
}
