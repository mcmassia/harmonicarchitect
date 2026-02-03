"use client";

import { useTuningStore } from '@/store/tuningStore';
import { useMarkedNotesStore } from '@/store/markedNotesStore';
import { useChordScaleStore } from '@/store/chordScaleStore';
import { useMemo } from 'react';
import { Note, Interval } from "@tonaljs/tonal";
import { StringGroupAnalysis } from '@/types/music';
import { Settings2, Music, Hash, MousePointer2, BoxSelect } from 'lucide-react';
import { clsx } from 'clsx';

const FRET_COUNT = 15; // Number of frets to render
const STRING_SPACING = 60; // Increased form 30

interface FretboardProps {
    highlightedNotes?: string[]; // Legacy support or just use analysis.notes
    analysis?: StringGroupAnalysis | null;
}

export function Fretboard({ highlightedNotes = [], analysis }: FretboardProps) {
    const { strings, scaleLength, noteDisplayMode, toggleNoteDisplayMode } = useTuningStore();
    const {
        markedNotes,
        markedPositions,
        selectionMode,
        setSelectionMode,
        isInteractiveMode,
        toggleNote,
        togglePosition,
        analysis: storeAnalysis
    } = useMarkedNotesStore();
    const { chordNotes, scaleNotes, isChordScaleMode, selectedRoot } = useChordScaleStore();

    // Use analysis notes if available, otherwise fallback to highlightedNotes
    const activeNotes = analysis ? analysis.notes : highlightedNotes;

    // Determine which notes are Roots (1P)
    const rootPitchClasses = useMemo(() => {
        if (!analysis) return new Set<string>();
        const roots = new Set<string>();
        analysis.notes.forEach((n, idx) => {
            if (analysis.intervals[idx] === "1P") {
                roots.add(Note.pitchClass(n));
            }
        });
        return roots;
    }, [analysis]);

    const activePitchClasses = useMemo(() => new Set(activeNotes.map(n => Note.pitchClass(n))), [activeNotes]);

    // Marked notes (pitch classes)
    const markedPitchClasses = useMemo(() => new Set(markedNotes), [markedNotes]);

    // Marked positions (specific string/fret)
    const markedPositionSet = useMemo(() => {
        const set = new Set<string>();
        markedPositions.forEach(p => set.add(`${p.stringIndex}-${p.fretIndex}`));
        return set;
    }, [markedPositions]);

    // Chord/Scale mode pitch classes
    const chordPitchClasses = useMemo(() => new Set(chordNotes), [chordNotes]);
    const scalePitchClasses = useMemo(() => new Set(scaleNotes), [scaleNotes]);
    const chordRootPc = useMemo(() => selectedRoot, [selectedRoot]);

    const frets = useMemo(() => {
        // Generate fret positions relative to nut (0)
        const positions = [];
        for (let i = 0; i <= FRET_COUNT; i++) {
            const dist = scaleLength - (scaleLength / Math.pow(2, i / 12));
            positions.push(dist);
        }
        return positions;
    }, [scaleLength]);

    // Normalize mapping to SVG pixels
    const maxDist = frets[frets.length - 1];
    const pxScale = 1200 / (maxDist + 1);

    // Layout Constants
    const X_NUT = 100; // Moved nut to 100
    const X_OPEN = 65; // Open strings at 65
    const X_LABEL = 20; // Labels at 20

    const handleNoteClick = (stringIndex: number, fretIndex: number, note: string) => {
        if (!isInteractiveMode) return;

        const pc = Note.pitchClass(note);

        if (selectionMode === 'note') {
            toggleNote(pc);
        } else {
            togglePosition(stringIndex, fretIndex, note);
        }
    };

    return (
        <div className="w-full bg-zinc-950 rounded-xl border border-zinc-800 shadow-inner overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                {/* Left Side: Mode Toggles (Only in Interactive Mode) */}
                <div className="flex items-center gap-2">
                    {isInteractiveMode && (
                        <div className="flex bg-zinc-800 rounded-lg p-0.5">
                            <button
                                onClick={() => setSelectionMode('note')}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    selectionMode === 'note'
                                        ? "bg-zinc-700 text-white shadow-sm"
                                        : "text-zinc-400 hover:text-zinc-200"
                                )}
                                title="Select by Note Name (All positions)"
                            >
                                <Music className="w-3.5 h-3.5" />
                                <span>Por Nota</span>
                            </button>
                            <button
                                onClick={() => setSelectionMode('position')}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    selectionMode === 'position'
                                        ? "bg-zinc-700 text-white shadow-sm"
                                        : "text-zinc-400 hover:text-zinc-200"
                                )}
                                title="Select Specific Positions"
                            >
                                <MousePointer2 className="w-3.5 h-3.5" />
                                <span>Individual</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side: Display Options */}
                <button
                    onClick={toggleNoteDisplayMode}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-slate-300 transition-colors"
                >
                    {noteDisplayMode === 'notes' ? <Music className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                    <span>{noteDisplayMode === 'notes' ? 'Ver Notas' : 'Ver Intervalos'}</span>
                </button>
            </div>

            <div className="overflow-x-auto p-4">
                <svg width="100%" height={strings.length * STRING_SPACING + 80} viewBox={`0 0 1350 ${strings.length * STRING_SPACING + 80}`}>

                    {/* Frets */}
                    {frets.map((pos, i) => (
                        <g key={`fret-${i}`}>
                            <line
                                x1={X_NUT + pos * pxScale}
                                y1={20}
                                x2={X_NUT + pos * pxScale}
                                y2={20 + (strings.length - 1) * STRING_SPACING}
                                stroke={i === 0 ? "#cbd5e1" : "#475569"}
                                strokeWidth={i === 0 ? 6 : 3}
                            />
                            {/* Fret Numbers */}
                            {[0, 1, 3, 5, 7, 9, 12, 15].includes(i) && (
                                <text
                                    x={X_NUT + pos * pxScale}
                                    y={20 + (strings.length - 1) * STRING_SPACING + 30}
                                    fill="#64748b"
                                    fontSize="12"
                                    textAnchor="middle"
                                    className="font-mono"
                                >
                                    {i}
                                </text>
                            )}
                        </g>
                    ))}

                    {/* Inlay Markers */}
                    {[3, 5, 7, 9, 12, 15].map(fret => {
                        if (fret > FRET_COUNT) return null;
                        const x = X_NUT + (frets[fret] + frets[fret - 1]) / 2 * pxScale;
                        const y = 20 + ((strings.length - 1) * STRING_SPACING) / 2;
                        return (
                            <circle
                                key={`inlay-${fret}`}
                                cx={x}
                                cy={y}
                                r={fret === 12 ? 12 : 8}
                                fill="#334155"
                                opacity={0.8}
                            />
                        )
                    })}

                    {/* Strings */}
                    {strings.map((str, stringIndex) => (
                        <g key={`string-${stringIndex}`}>
                            <line
                                x1={X_NUT}
                                y1={20 + stringIndex * STRING_SPACING}
                                x2={1350}
                                y2={20 + stringIndex * STRING_SPACING}
                                stroke="#94a3b8"
                                strokeWidth={1 + (str.gauge || 0.010) * 150}
                                opacity={0.8}
                            />

                            {/* Rendering Note Circles */}
                            {Array.from({ length: FRET_COUNT + 1 }).map((_, fretIndex) => {
                                const openMidi = Note.midi(str.note.scientific) || 0;
                                const currentMidi = openMidi + fretIndex;
                                const noteName = Note.fromMidi(currentMidi);
                                const pc = Note.pitchClass(noteName);

                                // Check chord/scale membership
                                const isInChord = chordPitchClasses.has(pc);
                                const isInScale = scalePitchClasses.has(pc);
                                const isChordRoot = pc === chordRootPc && isInChord;
                                const isInBoth = isInChord && isInScale;

                                // Analysis Highlighting (from prop)
                                const isHighlighted = activePitchClasses.has(pc);

                                // Marked State (depends on mode)
                                const isMarkedByNote = markedPitchClasses.has(pc);
                                const isMarkedByPosition = markedPositionSet.has(`${stringIndex}-${fretIndex}`);

                                const isMarked = selectionMode === 'note' ? isMarkedByNote : isMarkedByPosition;

                                // Determine visibility based on mode
                                const showInChordScaleMode = isChordScaleMode && (isInChord || isInScale);
                                const showInInteractiveMode = isInteractiveMode;
                                const showInAnalysisMode = !isInteractiveMode && !isChordScaleMode && isHighlighted;

                                // Skip if not visible in any mode
                                if (!showInChordScaleMode && !showInInteractiveMode && !showInAnalysisMode) return null;

                                const isRoot = rootPitchClasses.has(pc);

                                // Calculate X position
                                let x = 0;
                                if (fretIndex > 0) {
                                    x = X_NUT + (frets[fretIndex] + frets[fretIndex - 1]) / 2 * pxScale;
                                } else {
                                    x = X_OPEN;
                                }

                                const y = 20 + stringIndex * STRING_SPACING;

                                // Determine fill color based on mode and state
                                let fillColor = "#334155"; // Default: slate-700 (visible but subtle)
                                let strokeColor = "#64748b"; // slate-500
                                let noteOpacity = isInteractiveMode ? 0.6 : 1;
                                let showSplitCircle = false;

                                if (isChordScaleMode && (isInChord || isInScale)) {
                                    // Chord/Scale mode takes precedence
                                    if (isInBoth) {
                                        // Both chord and scale - use split circle
                                        showSplitCircle = true;
                                        noteOpacity = 1;
                                    } else if (isInChord) {
                                        // Chord only - amber
                                        fillColor = "#f59e0b"; // amber-500
                                        strokeColor = isChordRoot ? "#fcd34d" : "#d97706"; // amber-300/600
                                        noteOpacity = 1;
                                    } else if (isInScale) {
                                        // Scale only - cyan
                                        fillColor = "#06b6d4"; // cyan-500
                                        strokeColor = "#0891b2"; // cyan-600
                                        noteOpacity = 1;
                                    }
                                } else if (isInteractiveMode && isMarked) {
                                    // Marked note in interactive mode
                                    fillColor = "#6366f1"; // Indigo-500
                                    strokeColor = "#4338ca"; // Indigo-700
                                    noteOpacity = 1;
                                } else if (!isInteractiveMode && !isChordScaleMode && isHighlighted) {
                                    // Analysis mode: show highlighted notes
                                    fillColor = isRoot ? "#ef4444" : "#10b981"; // Red for Root, Emerald for others
                                    strokeColor = isRoot ? "#7f1d1d" : "#064e3b";
                                    noteOpacity = 1;
                                }

                                return (
                                    <g
                                        key={`note-${stringIndex}-${fretIndex}`}
                                        onClick={() => handleNoteClick(stringIndex, fretIndex, noteName)}
                                        style={{ cursor: isInteractiveMode ? 'pointer' : 'default' }}
                                    >
                                        {/* Chord root outer ring */}
                                        {isChordScaleMode && isChordRoot && (
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r={18}
                                                fill="none"
                                                stroke="#fcd34d"
                                                strokeWidth={3}
                                                opacity={0.8}
                                            />
                                        )}

                                        {showSplitCircle ? (
                                            // Split circle for notes in both chord and scale
                                            <>
                                                <defs>
                                                    <clipPath id={`clip-left-${stringIndex}-${fretIndex}`}>
                                                        <rect x={x - 14} y={y - 14} width={14} height={28} />
                                                    </clipPath>
                                                    <clipPath id={`clip-right-${stringIndex}-${fretIndex}`}>
                                                        <rect x={x} y={y - 14} width={14} height={28} />
                                                    </clipPath>
                                                </defs>
                                                {/* Left half - amber (chord) */}
                                                <circle
                                                    cx={x}
                                                    cy={y}
                                                    r={14}
                                                    fill="#f59e0b"
                                                    clipPath={`url(#clip-left-${stringIndex}-${fretIndex})`}
                                                />
                                                {/* Right half - cyan (scale) */}
                                                <circle
                                                    cx={x}
                                                    cy={y}
                                                    r={14}
                                                    fill="#06b6d4"
                                                    clipPath={`url(#clip-right-${stringIndex}-${fretIndex})`}
                                                />
                                                {/* Outline */}
                                                <circle
                                                    cx={x}
                                                    cy={y}
                                                    r={14}
                                                    fill="none"
                                                    stroke="#fcd34d"
                                                    strokeWidth={1}
                                                />
                                            </>
                                        ) : (
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r={14}
                                                fill={fillColor}
                                                stroke={strokeColor}
                                                strokeWidth={1}
                                                opacity={noteOpacity}
                                                className={isInteractiveMode ? "hover:opacity-100 transition-opacity" : ""}
                                            />
                                        )}
                                        <text
                                            x={x}
                                            y={y + 5}
                                            fontSize={12}
                                            textAnchor="middle"
                                            fill="white"
                                            className="font-bold pointer-events-none"
                                            opacity={noteOpacity}
                                        >
                                            {(() => {
                                                if (noteDisplayMode === 'intervals') {
                                                    let root = null;
                                                    if (isChordScaleMode && selectedRoot) {
                                                        root = selectedRoot;
                                                    } else if (analysis) {
                                                        const idx = analysis.intervals.indexOf("1P");
                                                        if (idx >= 0) root = Note.pitchClass(analysis.notes[idx]);
                                                    } else if (isInteractiveMode && storeAnalysis.length > 0) {
                                                        // Fallback for interactive mode: Use the first candidate analysis root
                                                        const candidate = storeAnalysis[0];
                                                        const idx = candidate.intervals.indexOf("1P");
                                                        if (idx >= 0) root = Note.pitchClass(candidate.notes[idx]);
                                                    }

                                                    if (root) {
                                                        // Calculate interval
                                                        const interval = Interval.distance(root, pc);
                                                        // Simplify interval (e.g., "3M" -> "3", "3m" -> "b3")
                                                        return interval.replace('M', '').replace('P', '').replace('m', 'b').replace('d', 'bb').replace('A', '#');
                                                    }
                                                }
                                                return pc;
                                            })()}
                                        </text>
                                    </g>
                                )
                            })}
                        </g>
                    ))}

                    {/* String Labels */}
                    {strings.map((str, i) => (
                        <text
                            key={`label-${i}`}
                            x={X_LABEL}
                            y={25 + i * STRING_SPACING}
                            fill="#cbd5e1"
                            textAnchor="middle"
                            fontSize="12"
                            className="font-mono"
                        >
                            {str.note.name}
                        </text>
                    ))}

                </svg>
            </div>
        </div>
    );
}
