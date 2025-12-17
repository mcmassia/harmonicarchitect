/**
 * Tablature Generator - Genera tablaturas ASCII adaptadas a cualquier afinación
 */

import { Note } from "@tonaljs/tonal";
import { ChordVoicing, Progression } from "./composer";

// ============================================================================
// Types
// ============================================================================

export interface TablatureBar {
    voicing: ChordVoicing;
    duration: 'whole' | 'half' | 'quarter' | 'eighth';
    barNumber: number;
}

export interface Tablature {
    id: string;
    progressionId: string;
    progressionName: string;
    bars: TablatureBar[];
    tuning: string[];
    ascii: string;          // Representación ASCII generada
    createdAt?: Date;
}

// ============================================================================
// Constants
// ============================================================================

const BAR_WIDTH = 8;  // Caracteres por compás
const BARS_PER_LINE = 4;

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatea un número de traste para la tablatura
 */
function formatFret(fret: number): string {
    if (fret < 0) return 'x';
    if (fret < 10) return fret.toString();
    return fret.toString(); // Para trastes >= 10
}

/**
 * Obtiene el nombre corto de la afinación para cada cuerda
 */
function getTuningLabel(note: string): string {
    return Note.pitchClass(note);
}

// ============================================================================
// Tablature Generation
// ============================================================================

/**
 * Genera una tablatura a partir de una progresión
 */
export function generateTablature(progression: Progression): Tablature {
    const bars: TablatureBar[] = progression.voicings.map((voicing, idx) => ({
        voicing,
        duration: 'whole',
        barNumber: idx + 1
    }));

    const ascii = formatTablatureASCII({
        progressionId: progression.id,
        progressionName: progression.name,
        bars,
        tuning: progression.tuning
    });

    return {
        id: generateId(),
        progressionId: progression.id,
        progressionName: progression.name,
        bars,
        tuning: progression.tuning,
        ascii,
        createdAt: new Date()
    };
}

/**
 * Formatea la tablatura como ASCII
 */
export function formatTablatureASCII(
    tablature: Omit<Tablature, 'ascii' | 'id'> & { id?: string },
    barsPerLine: number = BARS_PER_LINE
): string {
    const { bars, tuning } = tablature;
    const numStrings = tuning.length;

    const lines: string[] = [];

    // Header con información de afinación
    const tuningStr = tuning.map(n => getTuningLabel(n)).reverse().join('-');
    lines.push(`Afinación: ${tuningStr}`);
    lines.push('');

    // Procesar en grupos de barsPerLine
    for (let startBar = 0; startBar < bars.length; startBar += barsPerLine) {
        const endBar = Math.min(startBar + barsPerLine, bars.length);
        const barGroup = bars.slice(startBar, endBar);

        // Línea de nombres de acordes
        let chordLine = '       ';
        for (const bar of barGroup) {
            const chordName = bar.voicing.chord.padEnd(BAR_WIDTH);
            chordLine += chordName;
        }
        lines.push(chordLine);

        // Líneas de cuerdas (desde aguda a grave en visualización)
        for (let stringIdx = 0; stringIdx < numStrings; stringIdx++) {
            const stringLabel = getTuningLabel(tuning[stringIdx]).padEnd(2);
            let stringLine = `${stringLabel}|`;

            for (const bar of barGroup) {
                const fret = bar.voicing.frets[stringIdx];
                const fretStr = formatFret(fret);

                // Centrar el traste en el compás
                const paddedFret = fretStr.padStart(Math.floor((BAR_WIDTH - fretStr.length) / 2) + fretStr.length);
                const fullPad = paddedFret.padEnd(BAR_WIDTH - 1);

                stringLine += `${fullPad}|`;
            }

            lines.push(stringLine);
        }

        // Separador entre grupos
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Genera tablatura con indicadores visuales de drones
 */
export function formatTablatureWithDrones(tablature: Tablature): string {
    const { bars, tuning } = tablature;
    const numStrings = tuning.length;

    const lines: string[] = [];

    // Header
    const tuningStr = tuning.map(n => getTuningLabel(n)).reverse().join('-');
    lines.push(`🎸 Afinación: ${tuningStr}`);
    lines.push(`📊 Ergonomía promedio: ${calculateAvgErgonomy(bars)}%`);
    lines.push('');
    lines.push('Leyenda: ○ = cuerda al aire (drone) | x = silenciada');
    lines.push('');

    // Procesar en grupos
    for (let startBar = 0; startBar < bars.length; startBar += BARS_PER_LINE) {
        const endBar = Math.min(startBar + BARS_PER_LINE, bars.length);
        const barGroup = bars.slice(startBar, endBar);

        // Línea de nombres de acordes
        let chordLine = '        ';
        for (const bar of barGroup) {
            const chordName = bar.voicing.chord.padEnd(BAR_WIDTH);
            chordLine += chordName;
        }
        lines.push(chordLine);

        // Líneas de cuerdas
        for (let stringIdx = 0; stringIdx < numStrings; stringIdx++) {
            const stringLabel = getTuningLabel(tuning[stringIdx]).padEnd(2);
            let stringLine = ` ${stringLabel}|`;

            for (const bar of barGroup) {
                const fret = bar.voicing.frets[stringIdx];
                const isDrone = bar.voicing.droneStrings.includes(stringIdx);

                let fretStr: string;
                if (fret < 0) {
                    fretStr = 'x';
                } else if (fret === 0) {
                    fretStr = '○'; // Drone indicator
                } else {
                    fretStr = fret.toString();
                }

                // Centrar
                const paddedFret = fretStr.padStart(Math.floor((BAR_WIDTH - 1) / 2) + 1);
                const fullPad = paddedFret.padEnd(BAR_WIDTH - 1);

                stringLine += `${fullPad}|`;
            }

            lines.push(stringLine);
        }

        lines.push('');
    }

    return lines.join('\n');
}

function calculateAvgErgonomy(bars: TablatureBar[]): number {
    if (bars.length === 0) return 0;
    const total = bars.reduce((sum, bar) => sum + bar.voicing.ergonomyScore, 0);
    return Math.round(total / bars.length);
}

/**
 * Genera tablatura en formato HTML para visualización enriquecida
 */
export function formatTablatureHTML(tablature: Tablature): string {
    const { bars, tuning } = tablature;
    const numStrings = tuning.length;

    let html = '<div class="tablature font-mono text-sm">';

    // Header
    const tuningStr = tuning.map(n => getTuningLabel(n)).reverse().join('-');
    html += `<div class="text-slate-400 mb-2">Afinación: <span class="text-emerald-400">${tuningStr}</span></div>`;

    // Procesar en grupos
    for (let startBar = 0; startBar < bars.length; startBar += BARS_PER_LINE) {
        const endBar = Math.min(startBar + BARS_PER_LINE, bars.length);
        const barGroup = bars.slice(startBar, endBar);

        html += '<div class="mb-4">';

        // Nombres de acordes
        html += '<div class="flex">';
        html += '<span class="w-8"></span>';
        for (const bar of barGroup) {
            html += `<span class="w-16 text-center text-amber-400 font-bold">${bar.voicing.chord}</span>`;
        }
        html += '</div>';

        // Cuerdas
        for (let stringIdx = 0; stringIdx < numStrings; stringIdx++) {
            html += '<div class="flex items-center">';
            html += `<span class="w-8 text-slate-500">${getTuningLabel(tuning[stringIdx])}</span>`;

            for (const bar of barGroup) {
                const fret = bar.voicing.frets[stringIdx];
                const isDrone = bar.voicing.droneStrings.includes(stringIdx);

                let fretClass = 'text-slate-300';
                let fretDisplay: string;

                if (fret < 0) {
                    fretDisplay = 'x';
                    fretClass = 'text-slate-600';
                } else if (fret === 0) {
                    fretDisplay = '○';
                    fretClass = 'text-emerald-400'; // Highlight drones
                } else {
                    fretDisplay = fret.toString();
                }

                html += `<span class="w-16 text-center border-b border-slate-700 ${fretClass}">${fretDisplay}</span>`;
            }

            html += '</div>';
        }

        html += '</div>';
    }

    html += '</div>';

    return html;
}

/**
 * Genera diagrama de acordes simple para un voicing
 */
export function generateChordDiagram(voicing: ChordVoicing, tuning: string[]): string {
    const lines: string[] = [];
    const numStrings = tuning.length;

    // Encontrar rango de trastes
    const pressedFrets = voicing.frets.filter(f => f > 0);
    const minFret = pressedFrets.length > 0 ? Math.min(...pressedFrets) : 0;
    const maxFret = pressedFrets.length > 0 ? Math.max(...pressedFrets) : 0;

    const startFret = minFret > 3 ? minFret - 1 : 0;
    const endFret = Math.max(startFret + 4, maxFret);

    // Header con nombre del acorde
    lines.push(`  ${voicing.chord}`);
    lines.push('');

    // Indicadores de cuerda al aire/muted arriba
    let topLine = '  ';
    for (let s = 0; s < numStrings; s++) {
        const fret = voicing.frets[s];
        if (fret < 0) {
            topLine += 'x ';
        } else if (fret === 0) {
            topLine += 'o ';
        } else {
            topLine += '  ';
        }
    }
    lines.push(topLine);

    // Cejuela si empezamos en traste 0
    if (startFret === 0) {
        lines.push('  ' + '═'.repeat(numStrings * 2 - 1));
    } else {
        lines.push(`${startFret} ` + '─'.repeat(numStrings * 2 - 1));
    }

    // Trastes
    for (let fret = startFret + 1; fret <= endFret; fret++) {
        let fretLine = '  ';
        for (let s = 0; s < numStrings; s++) {
            if (voicing.frets[s] === fret) {
                fretLine += '● ';
            } else {
                fretLine += '│ ';
            }
        }
        lines.push(fretLine);
        lines.push('  ' + '─'.repeat(numStrings * 2 - 1));
    }

    return lines.join('\n');
}
