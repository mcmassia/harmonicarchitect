import { db } from './config';
import { collection, addDoc, getDocs, query, where, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { Tuning, Note } from '@/types/music';
import { Progression, ChordVoicing } from '@/lib/music/composer';
import { Tablature, TablatureBar } from '@/lib/music/tablature';

// ============================================================================
// Firestore Types
// ============================================================================

export interface FirestoreTuning extends Omit<Tuning, 'id'> {
    userId: string;
    createdAt: Timestamp;
}

export interface FirestoreProgression extends Omit<Progression, 'id' | 'createdAt'> {
    userId: string;
    createdAt: Timestamp;
}

export interface FirestoreTablature extends Omit<Tablature, 'id' | 'createdAt'> {
    userId: string;
    createdAt: Timestamp;
}

// ============================================================================
// Database Operations
// ============================================================================

export const DB = {
    async saveTuning(userId: string, tuning: Tuning) {
        if (!userId) throw new Error("User ID required");

        try {
            const tuningsRef = collection(db, "tunings");
            // Destructure to remove ID and ensure clean data
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...tuningData } = tuning;

            const data: FirestoreTuning = {
                ...tuningData,
                userId,
                createdAt: Timestamp.now(),
                // Ensure strings are plain objects
                strings: tuning.strings.map(s => JSON.parse(JSON.stringify(s)))
            };

            const docRef = await addDoc(tuningsRef, data);
            return docRef.id;
        } catch (e) {
            console.error("Error saving tuning: ", e);
            throw e;
        }
    },

    async getUserTunings(userId: string): Promise<Tuning[]> {
        if (!userId) return [];

        try {
            const q = query(collection(db, "tunings"), where("userId", "==", userId));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Tuning[];
        } catch (e) {
            console.error("Error fetching tunings: ", e);
            return [];
        }
    },

    async deleteTuning(tuningId: string) {
        try {
            await deleteDoc(doc(db, "tunings", tuningId));
        } catch (e) {
            console.error("Error deleting tuning", e);
            throw e;
        }
    },

    // ========================================================================
    // Progressions
    // ========================================================================

    async saveProgression(userId: string, progression: Progression): Promise<string> {
        if (!userId) throw new Error("User ID required");

        try {
            const progressionsRef = collection(db, "progressions");
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, createdAt, ...progressionData } = progression;

            const data: FirestoreProgression = {
                ...progressionData,
                userId,
                createdAt: Timestamp.now(),
                voicings: progression.voicings.map(v => JSON.parse(JSON.stringify(v)))
            };

            const docRef = await addDoc(progressionsRef, data);
            return docRef.id;
        } catch (e) {
            console.error("Error saving progression: ", e);
            throw e;
        }
    },

    async getUserProgressions(userId: string): Promise<Progression[]> {
        if (!userId) return [];

        try {
            const q = query(collection(db, "progressions"), where("userId", "==", userId));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date()
                };
            }) as Progression[];
        } catch (e) {
            console.error("Error fetching progressions: ", e);
            return [];
        }
    },

    async deleteProgression(progressionId: string) {
        try {
            await deleteDoc(doc(db, "progressions", progressionId));
        } catch (e) {
            console.error("Error deleting progression", e);
            throw e;
        }
    },

    // ========================================================================
    // Tablatures
    // ========================================================================

    async saveTablature(userId: string, tablature: Tablature): Promise<string> {
        if (!userId) throw new Error("User ID required");

        try {
            const tablaturesRef = collection(db, "tablatures");
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, createdAt, ...tablatureData } = tablature;

            const data: FirestoreTablature = {
                ...tablatureData,
                userId,
                createdAt: Timestamp.now(),
                bars: tablature.bars.map(b => JSON.parse(JSON.stringify(b)))
            };

            const docRef = await addDoc(tablaturesRef, data);
            return docRef.id;
        } catch (e) {
            console.error("Error saving tablature: ", e);
            throw e;
        }
    },

    async getUserTablatures(userId: string): Promise<Tablature[]> {
        if (!userId) return [];

        try {
            const q = query(collection(db, "tablatures"), where("userId", "==", userId));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date()
                };
            }) as Tablature[];
        } catch (e) {
            console.error("Error fetching tablatures: ", e);
            return [];
        }
    },

    async deleteTablature(tablatureId: string) {
        try {
            await deleteDoc(doc(db, "tablatures", tablatureId));
        } catch (e) {
            console.error("Error deleting tablature", e);
            throw e;
        }
    }
};

