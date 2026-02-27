import { useDiagramStore } from '@/store/diagramStore';
import { useTuningStore } from '@/store/tuningStore';
import { useMarkedNotesStore } from '@/store/markedNotesStore';
import { NoteDiagram } from '@/types/music';
import { Trash2, Eye, Map, Search, Copy } from 'lucide-react';
import { useState } from 'react';

export function SavedDiagramsList() {
    const { strings } = useTuningStore();
    const tuningId = strings.map(s => s.note.scientific).join('-');
    const { getDiagramsByTuning, deleteDiagram, saveDiagram } = useDiagramStore();
    const diagrams = getDiagramsByTuning(tuningId);

    const [searchQuery, setSearchQuery] = useState("");

    const filteredDiagrams = diagrams.filter(d =>
        (d.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const {
        setSelectionMode,
        clearNotes,
        toggleNote,
        togglePosition,
        setTonic,
        setInteractiveMode,
        setActiveDiagramId,
        setNoteColors,
        activeDiagramId
    } = useMarkedNotesStore();

    const handleLoad = (diagram: NoteDiagram) => {
        clearNotes();
        setInteractiveMode(true);
        setSelectionMode(diagram.selectionMode);

        if (diagram.selectionMode === 'note') {
            diagram.markedNotes.forEach(n => toggleNote(n));
        } else {
            diagram.markedPositions.forEach(p => togglePosition(p.stringIndex, p.fretIndex, p.note));
        }

        // Must run setTonic slightly after toggle to ensure they are marked?
        // Actually zustand can batch, should be fine.
        setTimeout(() => {
            if (diagram.tonic) {
                setTonic(diagram.tonic);
            }
            setActiveDiagramId(diagram.id);
            setNoteColors(diagram.colors || {});
        }, 0);
    };

    const handleClone = (diagram: NoteDiagram) => {
        const newId = crypto.randomUUID();
        saveDiagram({
            ...diagram,
            id: newId,
            name: `${diagram.name} (Copia)`,
            createdAt: Date.now()
        });
    };

    if (diagrams.length === 0) {
        return (
            <div className="p-4 rounded-xl border border-dashed border-slate-800 text-slate-500 text-sm text-center">
                No hay diagramas guardados para esta afinación.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar diagrama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
            </div>

            {filteredDiagrams.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-slate-500 text-sm text-center">
                    No se encontraron diagramas.
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredDiagrams.map(diagram => {
                        const isActive = diagram.id === activeDiagramId;
                        return (
                            <div key={diagram.id} className={`relative p-4 bg-slate-900/30 border rounded-xl group transition-all duration-300 ${isActive ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-slate-700/50 hover:border-slate-600'}`}>
                                {isActive && (
                                    <div className="absolute -top-2.5 -right-2.5 bg-indigo-500 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md shadow-lg border border-indigo-400/50 flex items-center gap-1.5 z-10">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                        Editando
                                    </div>
                                )}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-white flex items-center gap-2 truncate">
                                            <Map className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-indigo-300' : 'text-indigo-400'}`} />
                                            <span className="truncate">{diagram.name}</span>
                                        </h3>
                                        {diagram.description && (
                                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{diagram.description}</p>
                                        )}
                                        <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-x-2 gap-y-1">
                                            {diagram.selectionMode === 'note' ? (
                                                <span className="font-mono bg-slate-800/50 px-1.5 py-0.5 rounded">Notas: {diagram.markedNotes.join(', ')}</span>
                                            ) : (
                                                <span className="font-mono bg-slate-800/50 px-1.5 py-0.5 rounded">Notas: {diagram.markedPositions.length}</span>
                                            )}
                                            {diagram.tonic && (
                                                <span className="font-mono text-indigo-300 bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                                    Tónica: {diagram.tonic}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleLoad(diagram)}
                                            className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30"
                                            title="Visualizar"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleClone(diagram)}
                                            className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/30"
                                            title="Clonar Diagrama"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteDiagram(diagram.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
