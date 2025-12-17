/**
 * Composer Engine - Generador de progresiones armónicas "playable"
 * 
 * Prioriza:
 * - Ergonomía: Acordes que aprovechan cuerdas al aire (drones)
 * - Conducción de voces: Movimiento mínimo entre acordes
 * - Flexibilidad: Usuario puede indicar acordes requeridos y número de acordes
 */

import { Note, Chord, Interval, Scale } from "@tonaljs/tonal";

// ============================================================================
// Types
// ============================================================================

export interface ChordVoicing {
    chord: string;              // "Am7", "Gadd9", etc.
    frets: number[];            // [-1, 0, 2, 0, 1, 0] (-1 = muted, 0 = open)
    fingers: number[];          // [0, 0, 2, 0, 1, 0] (0 = open/muted)
    ergonomyScore: number;      // 0-100
    droneStrings: number[];     // Índices de cuerdas al aire usadas
    bassNote: string;           // Nota del bajo
    notes: string[];            // Notas que suenan [desde bajo a agudo]
}

export interface Progression {
    id: string;
    name: string;
    voicings: ChordVoicing[];
    tuning: string[];           // Afinación usada (e.g., ["E4", "B3", "G3", "D3", "A2", "E2"])
    ergonomyAvg: number;        // Promedio de ergonomía
    voiceLeadingScore: number;  // Puntuación de conducción de voces
    createdAt?: Date;
}

export interface ProgressionGenerationOptions {
    tuning: string[];
    chordCount: number;         // Número de acordes a generar
    requiredChords?: string[];  // Acordes que deben aparecer
    continueFrom?: Progression; // Progresión a continuar
    key?: string;               // Tonalidad (ej: "C major", "A minor")
    resultCount?: number;       // Número de progresiones a generar (default 5)
    algorithm?: AlgorithmOptions; // Configuración del algoritmo
}

/**
 * Opciones configurables del algoritmo de generación
 */
export interface AlgorithmOptions {
    // Cuerdas al aire: número máximo permitido (0 = ninguna)
    maxOpenStrings: number;

    // Gaps: número máximo de cuerdas muted entre cuerdas que suenan (0 = voicing cerrado)
    maxGaps: number;

    // Rango de posición: 'low' (0-5), 'high' (6-12), 'any'
    positionRange: 'low' | 'high' | 'any';

    // Máxima estiramiento (trastes entre min y max presionado)
    maxStretch: number;

    // Peso del voice leading (0-100): % de importancia en la selección de voicings
    voiceLeadingWeight: number;

    // El bajo debe ser la raíz del acorde
    bassIsRoot: boolean;

    // Número mínimo de notas por acorde
    minNotesPerChord: number;

    // Permitir cejillas (barre chords)
    allowBarreChords: boolean;

    // =========================================================================
    // Opciones de complejidad de acordes
    // =========================================================================

    // Nivel de complejidad: 'triads' (solo triadas), 'sevenths' (con 7as), 
    // 'extended' (9as, 11as), 'jazz' (13as, alterados)
    chordComplexity: 'triads' | 'sevenths' | 'extended' | 'jazz';

    // Probabilidad de añadir extensiones (0-100%)
    extensionProbability: number;

    // Extensiones específicas permitidas
    allowedExtensions: string[];

    // Preferir acordes sus (sus2, sus4)
    preferSus: boolean;
}

/**
 * Extensiones disponibles por nivel de complejidad
 */
export const CHORD_EXTENSIONS = {
    triads: [],
    sevenths: ['7', 'maj7', 'm7', 'dim7', 'm7b5'],
    extended: ['7', 'maj7', 'm7', '9', 'maj9', 'm9', 'add9', '11', 'add11'],
    jazz: ['7', 'maj7', 'm7', '9', 'maj9', 'm9', '11', 'm11', '13', 'maj13', '7#9', '7b9', '7#11', '7alt']
};

/**
 * Valores por defecto del algoritmo
 */
export const DEFAULT_ALGORITHM_OPTIONS: AlgorithmOptions = {
    maxOpenStrings: 6,      // Sin límite por defecto
    maxGaps: 0,             // Voicings cerrados por defecto
    positionRange: 'any',
    maxStretch: 4,
    voiceLeadingWeight: 50, // 50% ergonomía, 50% voice leading
    bassIsRoot: false,
    minNotesPerChord: 3,
    allowBarreChords: true,
    // Extensiones
    chordComplexity: 'triads',
    extensionProbability: 0,
    allowedExtensions: [],
    preferSus: false
};

// ============================================================================
// Constants
// ============================================================================

const MAX_FRET = 12;
const MAX_STRETCH = 4; // Máximo estiramiento cómodo en trastes

// Patrones de progresión comunes por modo
const PROGRESSION_PATTERNS: Record<string, number[][]> = {
    major: [
        [1, 4, 5, 1],      // I - IV - V - I
        [1, 5, 6, 4],      // I - V - vi - IV (Pop)
        [1, 6, 4, 5],      // I - vi - IV - V (50s)
        [2, 5, 1, 6],      // ii - V - I - vi (Jazz)
        [1, 4, 6, 5],      // I - IV - vi - V
        [4, 1, 5, 6],      // IV - I - V - vi
        [1, 3, 4, 5],      // I - iii - IV - V
        [6, 4, 1, 5],      // vi - IV - I - V
    ],
    minor: [
        [1, 4, 5, 1],      // i - iv - v - i
        [1, 6, 3, 7],      // i - VI - III - VII
        [1, 7, 6, 5],      // i - VII - VI - v
        [1, 4, 7, 3],      // i - iv - VII - III
        [1, 6, 7, 1],      // i - VI - VII - i
        [4, 6, 1, 7],      // iv - VI - i - VII
        [1, 5, 6, 4],      // i - v - VI - iv
        [6, 7, 1, 5],      // VI - VII - i - v
    ]
};

// Acordes diatónicos por grado (mayor)
const MAJOR_SCALE_CHORDS = ['', 'm', 'm', '', '', 'm', 'dim'];
// Acordes diatónicos por grado (menor natural)
const MINOR_SCALE_CHORDS = ['m', 'dim', '', 'm', 'm', '', ''];

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
    return `prog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtiene la nota en un traste específico de una cuerda
 */
function getNoteAtFret(openNote: string, fret: number): string {
    if (fret < 0) return ''; // Muted
    const openMidi = Note.midi(openNote) || 0;
    return Note.fromMidi(openMidi + fret) || '';
}

/**
 * Obtiene el pitch class de una nota
 */
function getPitchClass(note: string): string {
    return Note.pitchClass(note);
}

/**
 * Calcula los semitonos entre dos notas
 */
function semitoneDistance(note1: string, note2: string): number {
    const midi1 = Note.midi(note1) || 0;
    const midi2 = Note.midi(note2) || 0;
    return Math.abs(midi2 - midi1);
}

// ============================================================================
// Voicing Generation
// ============================================================================

/**
 * Genera todos los voicings posibles para un acorde en una afinación dada
 */
export function generateVoicingsForChord(
    chordName: string,
    tuning: string[],
    maxResults: number = 10
): ChordVoicing[] {
    const chord = Chord.get(chordName);
    if (!chord || chord.empty) return [];

    const chordNotes = new Set(chord.notes.map(n => getPitchClass(n)));
    const root = chord.tonic || chord.notes[0];
    const voicings: ChordVoicing[] = [];

    // Generar combinaciones de trastes (limitado para performance)
    const numStrings = tuning.length;

    // Buscar voicings usando un enfoque más inteligente
    // Primero, encontrar posiciones donde las cuerdas al aire coinciden
    const openStringMatches = tuning.map((note, idx) => ({
        stringIdx: idx,
        note: getPitchClass(note),
        isInChord: chordNotes.has(getPitchClass(note)),
        isRoot: getPitchClass(note) === getPitchClass(root)
    }));

    // Generar voicings priorizando cuerdas al aire
    // Usar multiplicador mayor para asegurar suficientes candidatos después del filtrado
    generateVoicingsRecursive(
        tuning,
        chordNotes,
        root,
        [],
        0,
        voicings,
        maxResults * 5, // Generar muchos extras para filtrar, especialmente para afinaciones no estándar
        openStringMatches
    );

    // Calcular ergonomía y ordenar
    const scoredVoicings = voicings.map(v => ({
        ...v,
        ergonomyScore: calculateErgonomyScore(v, tuning)
    }));

    // Ordenar por ergonomía y tomar los mejores
    scoredVoicings.sort((a, b) => b.ergonomyScore - a.ergonomyScore);

    return scoredVoicings.slice(0, maxResults);
}

function generateVoicingsRecursive(
    tuning: string[],
    chordNotes: Set<string>,
    root: string,
    currentFrets: number[],
    stringIdx: number,
    results: ChordVoicing[],
    maxResults: number,
    openStringMatches: { stringIdx: number; note: string; isInChord: boolean; isRoot: boolean }[]
): void {
    if (results.length >= maxResults) return;

    if (stringIdx >= tuning.length) {
        // Validar voicing completo
        const voicing = validateAndCreateVoicing(tuning, currentFrets, chordNotes, root);
        if (voicing) {
            results.push(voicing);
        }
        return;
    }

    const openNote = tuning[stringIdx];
    const openPc = getPitchClass(openNote);

    // Opciones para esta cuerda
    const fretOptions: number[] = [];

    // Opción: Cuerda al aire (si está en el acorde)
    if (chordNotes.has(openPc)) {
        fretOptions.push(0);
    }

    // Opción: Muted
    fretOptions.push(-1);

    // Opciones: Trastes 1-MAX_FRET donde la nota esté en el acorde
    // Para afinaciones no estándar, necesitamos explorar más opciones
    for (let fret = 1; fret <= MAX_FRET; fret++) {
        const noteAtFret = getNoteAtFret(openNote, fret);
        if (noteAtFret && chordNotes.has(getPitchClass(noteAtFret))) {
            // En lugar de restringir por stretch durante la generación,
            // dejamos que el filtro de ergonomía y las opciones del algoritmo
            // decidan qué voicings son aceptables
            const existingFrets = currentFrets.filter(f => f > 0);
            if (existingFrets.length === 0) {
                fretOptions.push(fret);
            } else {
                const minFret = Math.min(...existingFrets);
                const maxFret = Math.max(...existingFrets);
                // Permitir más stretch durante generación (será filtrado después)
                if (fret >= minFret - 6 && fret <= maxFret + 6) {
                    fretOptions.push(fret);
                }
            }
        }
    }

    // Permitir más opciones para explorar mejor el espacio de búsqueda
    // Ordenar por preferencia: cuerdas al aire primero, luego trastes bajos
    const sortedOptions = fretOptions.sort((a, b) => {
        if (a === 0) return -1;
        if (b === 0) return 1;
        if (a === -1) return 1;
        if (b === -1) return -1;
        return a - b;
    });

    // Aumentar límite para afinaciones no estándar
    const limitedOptions = sortedOptions.slice(0, 10);

    for (const fret of limitedOptions) {
        generateVoicingsRecursive(
            tuning,
            chordNotes,
            root,
            [...currentFrets, fret],
            stringIdx + 1,
            results,
            maxResults,
            openStringMatches
        );
    }
}

function validateAndCreateVoicing(
    tuning: string[],
    frets: number[],
    chordNotes: Set<string>,
    root: string
): ChordVoicing | null {
    // Debe tener al menos 3 notas sonando
    const soundingFrets = frets.filter(f => f >= 0);
    if (soundingFrets.length < 3) return null;

    // Obtener notas que suenan
    const notes: string[] = [];
    const droneStrings: number[] = [];

    for (let i = 0; i < frets.length; i++) {
        if (frets[i] >= 0) {
            const note = getNoteAtFret(tuning[i], frets[i]);
            notes.push(note);
            if (frets[i] === 0) {
                droneStrings.push(i);
            }
        }
    }

    // Verificar que todas las notas están en el acorde
    const notePcs = notes.map(n => getPitchClass(n));
    for (const pc of notePcs) {
        if (!chordNotes.has(pc)) return null;
    }

    // Preferir voicings con la raíz en el bajo
    const bassNote = notes[notes.length - 1]; // Última cuerda que suena es el bajo
    const rootPc = getPitchClass(root);

    // Calcular fingers (simplificado)
    const fingers = calculateFingers(frets);

    return {
        chord: root + (Chord.get(root)?.type || ''),
        frets,
        fingers,
        ergonomyScore: 0, // Se calcula después
        droneStrings,
        bassNote,
        notes
    };
}

function calculateFingers(frets: number[]): number[] {
    const fingers: number[] = [];
    let fingerCount = 1;

    // Encontrar trastes usados (ordenados)
    const usedFrets = frets
        .map((f, i) => ({ fret: f, string: i }))
        .filter(x => x.fret > 0)
        .sort((a, b) => a.fret - b.fret);

    const fretToFinger = new Map<number, number>();

    for (const { fret } of usedFrets) {
        if (!fretToFinger.has(fret)) {
            fretToFinger.set(fret, Math.min(fingerCount++, 4));
        }
    }

    for (const f of frets) {
        if (f <= 0) {
            fingers.push(0);
        } else {
            fingers.push(fretToFinger.get(f) || 1);
        }
    }

    return fingers;
}

// ============================================================================
// Ergonomy Scoring
// ============================================================================

/**
 * Calcula la puntuación de ergonomía de un voicing (0-100)
 * 
 * PRIORIDADES (en orden de importancia):
 * 1. Voicing cerrado (sin saltos de cuerda entre notas pisadas) - MÁXIMA PRIORIDAD
 * 2. Stretch (distancia entre traste min y max)
 * 3. Posición en el mástil (posiciones bajas preferidas)
 * 4. Cuerdas al aire (bonus menor)
 * 5. Bajo en la raíz
 * 
 * PENALIZACIONES:
 * - -25 por cada gap (cuerda muted entre cuerdas que suenan)
 * - -10 por stretch > 4 trastes
 * - -5 por cejilla
 */
export function calculateErgonomyScore(voicing: ChordVoicing, tuning: string[]): number {
    let score = 60; // Base

    // =========================================================================
    // 1. PENALIZACIÓN MÁXIMA: Gaps entre cuerdas (voicings abiertos)
    // =========================================================================
    const gapCount = countStringGaps(voicing.frets);
    score -= gapCount * 25; // Penalización severa por cada gap

    // Bonus si no hay ningún gap (voicing completamente cerrado)
    if (gapCount === 0) {
        score += 20;
    }

    // =========================================================================
    // 2. Stretch (distancia entre trastes)
    // =========================================================================
    const pressedFrets = voicing.frets.filter(f => f > 0);
    if (pressedFrets.length > 0) {
        const minFret = Math.min(...pressedFrets);
        const maxFret = Math.max(...pressedFrets);
        const stretch = maxFret - minFret;

        // Penalización por stretch excesivo
        if (stretch > MAX_STRETCH) {
            score -= (stretch - MAX_STRETCH) * 10;
        } else if (stretch <= 2) {
            // Bonus por posición compacta
            score += 10;
        }

        // =====================================================================
        // 3. Posición en el mástil
        // =====================================================================
        if (maxFret <= 3) {
            score += 15; // Primera posición - muy cómoda
        } else if (maxFret <= 5) {
            score += 10;
        } else if (maxFret <= 7) {
            score += 5;
        } else if (maxFret > 9) {
            score -= 5; // Posiciones altas menos cómodas
        }

        // =====================================================================
        // 4. Número de dedos requeridos
        // =====================================================================
        const uniqueFrets = new Set(pressedFrets);
        if (uniqueFrets.size <= 2) {
            score += 10; // Solo 1-2 dedos, muy fácil
        } else if (uniqueFrets.size > 4) {
            score -= (uniqueFrets.size - 4) * 8;
        }

        // =====================================================================
        // 5. Cejilla (barre)
        // =====================================================================
        let hasBarre = false;
        for (let i = 0; i < voicing.frets.length - 1; i++) {
            if (voicing.frets[i] > 0 && voicing.frets[i] === voicing.frets[i + 1]) {
                hasBarre = true;
                break;
            }
        }
        if (hasBarre) {
            score -= 8;
        }
    }

    // =========================================================================
    // 6. Cuerdas al aire (bonus menor - ya no es prioridad máxima)
    // =========================================================================
    // Bonus pequeño por cuerdas al aire, pero solo si no crean gaps
    const dronesWithoutGaps = voicing.droneStrings.filter(droneIdx => {
        // Verificar que esta cuerda al aire no crea un gap
        const soundingIndices = voicing.frets
            .map((f, i) => f >= 0 ? i : -1)
            .filter(i => i >= 0);

        if (soundingIndices.length < 2) return true;

        const minSounding = Math.min(...soundingIndices);
        const maxSounding = Math.max(...soundingIndices);

        return droneIdx >= minSounding && droneIdx <= maxSounding;
    });

    score += dronesWithoutGaps.length * 5;

    // =========================================================================
    // 7. Bajo en la raíz
    // =========================================================================
    const bassPC = getPitchClass(voicing.bassNote);
    const chord = Chord.get(voicing.chord);
    if (chord && chord.tonic && getPitchClass(chord.tonic) === bassPC) {
        score += 8;
    }

    // =========================================================================
    // 8. Bonus por número de notas (acordes más completos)
    // =========================================================================
    const soundingNotes = voicing.frets.filter(f => f >= 0).length;
    if (soundingNotes >= 4) {
        score += 5;
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Cuenta el número de gaps (cuerdas muted entre cuerdas que suenan)
 * Un gap es cuando hay una cuerda muted (-1) entre dos cuerdas que suenan (>=0)
 */
function countStringGaps(frets: number[]): number {
    // Encontrar índices de cuerdas que suenan
    const soundingIndices: number[] = [];
    for (let i = 0; i < frets.length; i++) {
        if (frets[i] >= 0) {
            soundingIndices.push(i);
        }
    }

    if (soundingIndices.length < 2) return 0;

    // Contar cuerdas muted entre la primera y última cuerda que suena
    const firstSounding = soundingIndices[0];
    const lastSounding = soundingIndices[soundingIndices.length - 1];

    let gaps = 0;
    for (let i = firstSounding + 1; i < lastSounding; i++) {
        if (frets[i] < 0) {
            gaps++;
        }
    }

    return gaps;
}

// ============================================================================
// Voice Leading
// ============================================================================

/**
 * Calcula la puntuación de conducción de voces entre dos voicings
 * Menor movimiento = mayor puntuación
 */
export function calculateVoiceLeadingScore(from: ChordVoicing, to: ChordVoicing): number {
    if (from.notes.length === 0 || to.notes.length === 0) return 0;

    let totalMovement = 0;
    const maxVoices = Math.min(from.notes.length, to.notes.length);

    // Comparar voces correspondientes (desde el bajo)
    for (let i = 0; i < maxVoices; i++) {
        const fromNote = from.notes[from.notes.length - 1 - i];
        const toNote = to.notes[to.notes.length - 1 - i];

        if (fromNote && toNote) {
            totalMovement += semitoneDistance(fromNote, toNote);
        }
    }

    // Menor movimiento = mayor puntuación
    // Movimiento ideal: 0-2 semitonos por voz
    const avgMovement = totalMovement / maxVoices;
    const score = Math.max(0, 100 - avgMovement * 10);

    return score;
}

// ============================================================================
// Progression Generation
// ============================================================================

/**
 * Obtiene los acordes de una escala
 */
function getScaleChords(key: string): string[] {
    const parts = key.split(' ');
    const root = parts[0];
    const mode = parts[1]?.toLowerCase() || 'major';

    const scale = Scale.get(`${root} ${mode}`);
    if (!scale || scale.empty) return [];

    const chordTypes = mode.includes('minor') ? MINOR_SCALE_CHORDS : MAJOR_SCALE_CHORDS;

    return scale.notes.map((note, i) => {
        const type = chordTypes[i % chordTypes.length];
        return note + type;
    });
}

/**
 * Aplica extensiones a un acorde según las opciones del algoritmo
 */
function applyChordExtensions(
    baseChord: string,
    algorithmOptions: AlgorithmOptions,
    scaleNotes: string[] = []
): string {
    // Si la complejidad es triads y la probabilidad es 0, devolver el acorde base
    if (algorithmOptions.chordComplexity === 'triads' && algorithmOptions.extensionProbability === 0) {
        return baseChord;
    }

    // Decidir si aplicar extensión basado en probabilidad
    if (Math.random() * 100 > algorithmOptions.extensionProbability) {
        return baseChord;
    }

    // Obtener el acorde base
    const chord = Chord.get(baseChord);
    if (!chord || chord.empty || !chord.tonic) return baseChord;

    const root = chord.tonic;
    const quality = chord.quality;

    // Determinar extensiones válidas según la calidad del acorde y el nivel de complejidad
    const availableExtensions = getAvailableExtensions(quality, algorithmOptions);

    if (availableExtensions.length === 0) return baseChord;

    // Elegir una extensión aleatoria
    const extension = availableExtensions[Math.floor(Math.random() * availableExtensions.length)];

    // Construir el nuevo nombre del acorde
    const newChordName = buildExtendedChordName(root, quality, extension);

    // Verificar que el acorde extendido existe en Tonal
    const extendedChord = Chord.get(newChordName);
    if (extendedChord && !extendedChord.empty) {
        return newChordName;
    }

    return baseChord;
}

/**
 * Obtiene las extensiones disponibles según la calidad del acorde y las opciones
 */
function getAvailableExtensions(quality: string, options: AlgorithmOptions): string[] {
    const complexity = options.chordComplexity;
    const baseExtensions = CHORD_EXTENSIONS[complexity] || [];

    // Si hay extensiones específicas permitidas, usarlas
    if (options.allowedExtensions.length > 0) {
        return baseExtensions.filter(ext => options.allowedExtensions.includes(ext));
    }

    // Filtrar según la calidad del acorde
    switch (quality) {
        case 'Major':
            return baseExtensions.filter(ext =>
                ['maj7', 'add9', '9', 'maj9', '6', 'maj13', '11', 'add11'].includes(ext) ||
                (options.preferSus && ['sus2', 'sus4'].includes(ext))
            );
        case 'Minor':
            return baseExtensions.filter(ext =>
                ['m7', 'm9', 'm11', 'm7b5', 'madd9'].includes(ext) ||
                ext === '7' // m7 written as m + 7
            );
        case 'Diminished':
            return baseExtensions.filter(ext =>
                ['dim7', 'm7b5', 'dim'].includes(ext)
            );
        case 'Augmented':
            return baseExtensions.filter(ext =>
                ['aug7', '7#5'].includes(ext)
            );
        default:
            // Dominante (sin calidad específica) - acepta todas las 7as
            return baseExtensions.filter(ext =>
                ['7', '9', '11', '13', '7#9', '7b9', '7#11', '7alt', 'sus4', 'sus2'].includes(ext)
            );
    }
}

/**
 * Construye el nombre del acorde extendido
 */
function buildExtendedChordName(root: string, quality: string, extension: string): string {
    // Mapeo de calidad + extensión a nombre final
    switch (quality) {
        case 'Major':
            if (extension === 'maj7') return `${root}maj7`;
            if (extension === 'add9') return `${root}add9`;
            if (extension === '9') return `${root}maj9`;
            if (extension === 'maj9') return `${root}maj9`;
            if (extension === '6') return `${root}6`;
            if (extension === 'sus2') return `${root}sus2`;
            if (extension === 'sus4') return `${root}sus4`;
            if (extension === 'add11') return `${root}add11`;
            return `${root}${extension}`;

        case 'Minor':
            if (extension === 'm7' || extension === '7') return `${root}m7`;
            if (extension === 'm9') return `${root}m9`;
            if (extension === 'm11') return `${root}m11`;
            if (extension === 'm7b5') return `${root}m7b5`;
            if (extension === 'madd9') return `${root}madd9`;
            return `${root}m${extension}`;

        case 'Diminished':
            if (extension === 'dim7') return `${root}dim7`;
            if (extension === 'm7b5') return `${root}m7b5`;
            return `${root}dim`;

        default:
            return `${root}${extension}`;
    }
}

/**
 * Filtra voicings según las opciones del algoritmo
 */
function filterVoicingsByOptions(
    voicings: ChordVoicing[],
    options: AlgorithmOptions
): ChordVoicing[] {
    return voicings.filter(v => {
        // Filtrar por máximo de gaps
        const gaps = countStringGaps(v.frets);
        if (gaps > options.maxGaps) return false;

        // Filtrar por máximo de cuerdas al aire
        if (v.droneStrings.length > options.maxOpenStrings) return false;

        // Filtrar por número mínimo de notas
        const soundingNotes = v.frets.filter(f => f >= 0).length;
        if (soundingNotes < options.minNotesPerChord) return false;

        // Filtrar por rango de posición
        const pressedFrets = v.frets.filter(f => f > 0);
        if (pressedFrets.length > 0) {
            const maxFret = Math.max(...pressedFrets);
            if (options.positionRange === 'low' && maxFret > 5) return false;
            if (options.positionRange === 'high' && maxFret <= 5) return false;

            // Filtrar por stretch máximo
            const minFret = Math.min(...pressedFrets);
            const stretch = maxFret - minFret;
            if (stretch > options.maxStretch) return false;
        }

        // Filtrar por bajo = raíz
        if (options.bassIsRoot) {
            const bassPC = getPitchClass(v.bassNote);
            const chord = Chord.get(v.chord);
            if (chord && chord.tonic && getPitchClass(chord.tonic) !== bassPC) {
                return false;
            }
        }

        // Filtrar por cejillas si no están permitidas
        if (!options.allowBarreChords) {
            let hasBarre = false;
            for (let i = 0; i < v.frets.length - 1; i++) {
                if (v.frets[i] > 0 && v.frets[i] === v.frets[i + 1]) {
                    hasBarre = true;
                    break;
                }
            }
            if (hasBarre) return false;
        }

        return true;
    });
}

/**
 * Selecciona el mejor voicing para un acorde considerando voice leading y opciones
 * Las opciones de maxGaps y maxOpenStrings son LÍMITES DUROS que nunca se relajan.
 */
function selectBestVoicing(
    chordName: string,
    tuning: string[],
    previousVoicing: ChordVoicing | null,
    algorithmOptions: AlgorithmOptions
): ChordVoicing | null {
    // Generar todos los voicings posibles
    const allVoicings = generateVoicingsForChord(chordName, tuning, 80);

    if (allVoicings.length === 0) return null;

    // Filtrar según opciones del algoritmo - maxGaps y maxOpenStrings son LÍMITES DUROS
    let voicings = filterVoicingsByOptions(allVoicings, algorithmOptions);

    // Si no hay voicings que cumplan los criterios, relajar SOLO opciones secundarias
    // NUNCA relajar maxGaps ni maxOpenStrings - son límites duros del usuario
    if (voicings.length === 0) {
        // Intentar relajando el stretch
        const relaxedStretchOptions = {
            ...algorithmOptions,
            maxStretch: Math.min(algorithmOptions.maxStretch + 2, 6)
        };
        voicings = filterVoicingsByOptions(allVoicings, relaxedStretchOptions);
    }

    if (voicings.length === 0) {
        // Intentar relajando la posición
        const relaxedPosOptions = {
            ...algorithmOptions,
            maxStretch: Math.min(algorithmOptions.maxStretch + 2, 6),
            positionRange: 'any' as const
        };
        voicings = filterVoicingsByOptions(allVoicings, relaxedPosOptions);
    }

    if (voicings.length === 0) {
        // Relajar minNotesPerChord y allowBarreChords, pero MANTENER límites de gaps y open strings
        const minimalOptions: AlgorithmOptions = {
            ...DEFAULT_ALGORITHM_OPTIONS,
            // MANTENER los límites duros del usuario
            maxGaps: algorithmOptions.maxGaps,
            maxOpenStrings: algorithmOptions.maxOpenStrings,
            bassIsRoot: algorithmOptions.bassIsRoot,
            voiceLeadingWeight: algorithmOptions.voiceLeadingWeight,
        };
        voicings = filterVoicingsByOptions(allVoicings, minimalOptions);
    }

    // Si TODAVÍA no hay voicings (las restricciones son demasiado estrictas para este acorde)
    // Devolver null en lugar de ignorar las restricciones del usuario
    if (voicings.length === 0) {
        console.warn(`No se encontró voicing para ${chordName} con maxGaps=${algorithmOptions.maxGaps}, maxOpenStrings=${algorithmOptions.maxOpenStrings}`);
        return null;
    }

    if (!previousVoicing) {
        // Sin voicing previo, tomar el más ergonómico
        return voicings[0];
    }

    // Combinar ergonomía y voice leading según el peso configurado
    const vlWeight = algorithmOptions.voiceLeadingWeight / 100;
    const ergWeight = 1 - vlWeight;

    const scored = voicings.map(v => ({
        voicing: v,
        combinedScore: v.ergonomyScore * ergWeight + calculateVoiceLeadingScore(previousVoicing, v) * vlWeight
    }));

    scored.sort((a, b) => b.combinedScore - a.combinedScore);
    return scored[0].voicing;
}

/**
 * Genera progresiones armónicas optimizadas
 */
export function generateProgressions(options: ProgressionGenerationOptions): Progression[] {
    const {
        tuning,
        chordCount,
        requiredChords = [],
        continueFrom,
        key = 'C major',
        resultCount = 5,
        algorithm = DEFAULT_ALGORITHM_OPTIONS
    } = options;

    const scaleChords = getScaleChords(key);
    if (scaleChords.length === 0) return [];

    const results: Progression[] = [];
    const mode = key.toLowerCase().includes('minor') ? 'minor' : 'major';
    const patterns = PROGRESSION_PATTERNS[mode];

    // Añadir aleatoriedad para que cada generación sea diferente
    const randomOffset = Math.floor(Math.random() * 100);
    const shuffledPatterns = [...patterns].sort(() => Math.random() - 0.5);

    // Generar múltiples progresiones usando diferentes patrones
    for (let attempt = 0; attempt < resultCount * 4 && results.length < resultCount; attempt++) {
        // Usar random offset para variar los resultados en cada generación
        const patternIndex = (attempt + randomOffset) % shuffledPatterns.length;
        const progression = generateSingleProgression(
            tuning,
            chordCount,
            scaleChords,
            requiredChords,
            continueFrom,
            shuffledPatterns[patternIndex],
            attempt + randomOffset,
            algorithm
        );

        if (progression && progression.voicings.length === chordCount) {
            // Evitar duplicados
            const isDuplicate = results.some(r =>
                r.voicings.map(v => v.chord).join('-') ===
                progression.voicings.map(v => v.chord).join('-')
            );

            if (!isDuplicate) {
                results.push(progression);
            }
        }
    }

    // Ordenar por combinación de ergonomía y voice leading
    results.sort((a, b) => {
        const scoreA = a.ergonomyAvg * 0.5 + a.voiceLeadingScore * 0.5;
        const scoreB = b.ergonomyAvg * 0.5 + b.voiceLeadingScore * 0.5;
        return scoreB - scoreA;
    });

    return results.slice(0, resultCount);
}

function generateSingleProgression(
    tuning: string[],
    chordCount: number,
    scaleChords: string[],
    requiredChords: string[],
    continueFrom: Progression | undefined,
    pattern: number[],
    seed: number,
    algorithmOptions: AlgorithmOptions
): Progression | null {
    const voicings: ChordVoicing[] = [];

    // Si continuamos desde una progresión existente, empezar desde el último voicing
    let previousVoicing = continueFrom?.voicings[continueFrom.voicings.length - 1] || null;

    // Construir lista de acordes a usar
    const chordsToUse: string[] = [];

    // Primero, incluir acordes requeridos
    const remainingRequired = [...requiredChords];

    // Expandir patrón al número de acordes deseado
    for (let i = 0; i < chordCount; i++) {
        if (remainingRequired.length > 0 && Math.random() < 0.5) {
            // Insertar acorde requerido
            const idx = Math.floor(Math.random() * remainingRequired.length);
            chordsToUse.push(remainingRequired.splice(idx, 1)[0]);
        } else {
            // Usar patrón
            const degree = pattern[i % pattern.length];
            const chordIdx = (degree - 1 + seed) % scaleChords.length;
            chordsToUse.push(scaleChords[chordIdx]);
        }
    }

    // Asegurar que todos los acordes requeridos están incluidos
    for (const req of remainingRequired) {
        const replaceIdx = Math.floor(Math.random() * chordsToUse.length);
        chordsToUse[replaceIdx] = req;
    }

    // Generar voicings
    for (let chordName of chordsToUse) {
        // Aplicar extensiones según las opciones del algoritmo
        chordName = applyChordExtensions(chordName, algorithmOptions);

        const voicing = selectBestVoicing(chordName, tuning, previousVoicing, algorithmOptions);
        if (!voicing) continue;

        voicing.chord = chordName; // Asegurar nombre correcto
        voicings.push(voicing);
        previousVoicing = voicing;
    }

    if (voicings.length < 3) return null;

    // Calcular scores
    const ergonomyAvg = voicings.reduce((sum, v) => sum + v.ergonomyScore, 0) / voicings.length;

    let voiceLeadingTotal = 0;
    for (let i = 1; i < voicings.length; i++) {
        voiceLeadingTotal += calculateVoiceLeadingScore(voicings[i - 1], voicings[i]);
    }
    const voiceLeadingScore = voicings.length > 1
        ? voiceLeadingTotal / (voicings.length - 1)
        : 100;

    // Generar nombre descriptivo
    const chordNames = voicings.map(v => v.chord).join(' - ');
    const name = `${continueFrom ? 'Continuación: ' : ''}${chordNames}`;

    return {
        id: generateId(),
        name,
        voicings,
        tuning,
        ergonomyAvg: Math.round(ergonomyAvg),
        voiceLeadingScore: Math.round(voiceLeadingScore),
        createdAt: new Date()
    };
}
