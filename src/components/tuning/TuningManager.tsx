"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTuningStore } from '@/store/tuningStore';
import { DB } from '@/lib/firebase/db';
import { Tuning } from '@/types/music';
import { Save, FolderOpen, Loader2, Trash2, Edit2, X, Check } from 'lucide-react';
import { clsx } from "clsx";

export function TuningManager() {
    const { user } = useAuthStore();
    const { strings, scaleLength, setPreset } = useTuningStore();

    const [tuningName, setTuningName] = useState("");
    const [savedTunings, setSavedTunings] = useState<Tuning[]>([]);
    const [loading, setLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");

    useEffect(() => {
        if (user) {
            loadTunings();
        } else {
            setSavedTunings([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadTunings = async () => {
        if (!user) return;
        setLoading(true);
        const data = await DB.getUserTunings(user.uid);
        const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
        setSavedTunings(sortedData);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!user) return alert("Please sign in to save.");
        if (!tuningName) return alert("Please name your tuning.");

        setLoading(true);
        try {
            const tuning: Tuning = {
                name: tuningName,
                strings: strings.map(s => s.note), // saving just Note objects
                scaleLength: scaleLength
            };
            await DB.saveTuning(user.uid, tuning);
            setTuningName("");
            await loadTunings();
        } catch (e) {
            alert("Error saving tuning");
            console.error(e);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure?")) return;
        await DB.deleteTuning(id);
        await loadTunings();
    }

    const handleEditStart = (t: Tuning, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(t.id!);
        setEditName(t.name);
        setEditDescription(t.description || "");
    };

    const handleEditCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
    };

    const handleEditSave = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editName.trim()) return alert("Name is required");

        setLoading(true);
        try {
            await DB.updateTuning(id, {
                name: editName.trim(),
                description: editDescription.trim() || undefined
            });
            await loadTunings();
            setEditingId(null);
        } catch (err) {
            console.error(err);
            alert("Failed to update tuning");
        }
        setLoading(false);
    };

    if (!user) return null;

    return (
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Library</h3>

            {/* Save Section */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={tuningName}
                    onChange={(e) => setTuningName(e.target.value)}
                    placeholder="Tuning Name (e.g. My Emo Open D)"
                    className="bg-slate-800 border-none rounded px-3 py-2 text-sm text-white flex-1 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-50"
                    title="Save Tuning"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
            </div>

            {/* Load Section */}
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-between w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-300 transition"
            >
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>My Tunings ({savedTunings.length})</span>
                </div>
            </button>

            {menuOpen && (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                    {savedTunings.length === 0 && <div className="text-xs text-slate-500 p-2 text-center">No saved tunings</div>}
                    {savedTunings.map(t => (
                        <div
                            key={t.id}
                            onClick={() => {
                                if (editingId !== t.id) setPreset(t);
                            }}
                            className={clsx(
                                "group flex flex-col p-2 rounded cursor-pointer border border-transparent transition",
                                editingId === t.id ? "bg-slate-800 border-slate-700" : "hover:bg-slate-800 hover:border-slate-700"
                            )}
                        >
                            {editingId === t.id ? (
                                <div className="space-y-2 flex flex-col" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        placeholder="Tuning Name"
                                    />
                                    <textarea
                                        value={editDescription}
                                        onChange={e => setEditDescription(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-300 resize-none h-16 focus:outline-none focus:border-indigo-500"
                                        placeholder="Description (optional)"
                                    />
                                    <div className="flex justify-end gap-2 mt-1">
                                        <button onClick={handleEditCancel} className="p-1 hover:text-slate-200 text-slate-400 transition" title="Cancel">
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => handleEditSave(t.id!, e)} className="p-1 hover:text-green-400 text-slate-400 transition" title="Save" disabled={loading}>
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-sm text-indigo-300 font-medium truncate">{t.name}</span>
                                            {t.description && (
                                                <span className="text-xs text-slate-400 mt-0.5 line-clamp-2">{t.description}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition whitespace-nowrap shrink-0 ml-2">
                                            <button
                                                onClick={(e) => handleEditStart(t, e)}
                                                className="p-1.5 hover:text-indigo-400 text-slate-500 transition"
                                                title="Edit Tuning"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(t.id!, e)}
                                                className="p-1.5 hover:text-red-400 text-slate-500 transition"
                                                title="Delete Tuning"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
