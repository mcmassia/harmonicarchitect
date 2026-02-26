import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NoteDiagram } from '@/types/music';

interface DiagramState {
    diagrams: NoteDiagram[];

    // Actions
    saveDiagram: (diagram: NoteDiagram) => void;
    updateDiagram: (id: string, updates: Partial<NoteDiagram>) => void;
    deleteDiagram: (id: string) => void;
    getDiagramsByTuning: (tuningId: string) => NoteDiagram[];
}

export const useDiagramStore = create<DiagramState>()(
    persist(
        (set, get) => ({
            diagrams: [],

            saveDiagram: (diagram) => set((state) => ({
                diagrams: [...state.diagrams, diagram]
            })),

            updateDiagram: (id, updates) => set((state) => ({
                diagrams: state.diagrams.map(d =>
                    d.id === id ? { ...d, ...updates } : d
                )
            })),

            deleteDiagram: (id) => set((state) => ({
                diagrams: state.diagrams.filter(d => d.id !== id)
            })),

            getDiagramsByTuning: (tuningId) => {
                return get().diagrams.filter(d => d.tuningId === tuningId);
            }
        }),
        {
            name: 'harmonic-architect-diagrams',
            version: 1,
        }
    )
);
