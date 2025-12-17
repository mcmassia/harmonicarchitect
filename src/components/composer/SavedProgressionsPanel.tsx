"use client";

import { useProgressionStore } from '@/store/progressionStore';
import { Progression } from '@/lib/music/composer';
import { Tablature } from '@/lib/music/tablature';
import {
    X,
    Music,
    FileText,
    Trash2,
    ChevronRight,
    Clock,
    FolderOpen
} from 'lucide-react';
import { clsx } from 'clsx';

interface SavedProgressionsPanelProps {
    onClose: () => void;
}

export function SavedProgressionsPanel({ onClose }: SavedProgressionsPanelProps) {
    const {
        savedProgressions,
        savedTablatures,
        loadFromSaved,
        deleteProgression,
        deleteTablature,
        setContinueFrom
    } = useProgressionStore();

    const formatDate = (date?: Date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-bold text-white">Guardados</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Progressions */}
                <section>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Progresiones ({savedProgressions.length})
                    </h4>

                    {savedProgressions.length === 0 ? (
                        <div className="text-center py-8 text-slate-600">
                            <Music className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No hay progresiones guardadas</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {savedProgressions.map(prog => (
                                <SavedProgressionItem
                                    key={prog.id}
                                    progression={prog}
                                    onLoad={() => loadFromSaved(prog)}
                                    onContinue={() => {
                                        setContinueFrom(prog);
                                        onClose();
                                    }}
                                    onDelete={() => deleteProgression(prog.id)}
                                    formatDate={formatDate}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Tablatures */}
                <section>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Tablaturas ({savedTablatures.length})
                    </h4>

                    {savedTablatures.length === 0 ? (
                        <div className="text-center py-8 text-slate-600">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No hay tablaturas guardadas</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {savedTablatures.map(tab => (
                                <SavedTablatureItem
                                    key={tab.id}
                                    tablature={tab}
                                    onDelete={() => deleteTablature(tab.id)}
                                    formatDate={formatDate}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

// Sub-components

interface SavedProgressionItemProps {
    progression: Progression;
    onLoad: () => void;
    onContinue: () => void;
    onDelete: () => void;
    formatDate: (date?: Date) => string;
}

function SavedProgressionItem({
    progression,
    onLoad,
    onContinue,
    onDelete,
    formatDate
}: SavedProgressionItemProps) {
    const chordSummary = progression.voicings
        .slice(0, 4)
        .map(v => v.chord)
        .join(' - ');
    const hasMore = progression.voicings.length > 4;

    return (
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 group hover:border-violet-500/50 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0" onClick={onLoad}>
                    <div className="text-sm font-medium text-white truncate cursor-pointer hover:text-violet-300">
                        {chordSummary}{hasMore && '...'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(progression.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{progression.voicings.length} acordes</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onContinue}
                        className="p-1.5 rounded bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
                        title="Continuar desde aquí"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        title="Eliminar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

interface SavedTablatureItemProps {
    tablature: Tablature;
    onDelete: () => void;
    formatDate: (date?: Date) => string;
}

function SavedTablatureItem({ tablature, onDelete, formatDate }: SavedTablatureItemProps) {
    const handleDownload = () => {
        const blob = new Blob([tablature.ascii], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tab_${tablature.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 group hover:border-cyan-500/50 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={handleDownload}>
                    <div className="text-sm font-medium text-white truncate hover:text-cyan-300">
                        {tablature.progressionName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(tablature.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{tablature.bars.length} compases</span>
                    </div>
                </div>
                <button
                    onClick={onDelete}
                    className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
