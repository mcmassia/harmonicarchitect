import { db } from './config';
import { collection, addDoc, getDocs, query, where, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { Tuning, Note } from '@/types/music';

// We need a slightly different shape for Firestore if we want to query easily, 
// but saving the JSON blob is usually fine for this complexity.
// Let's stick to the Tuning interface but flatten the data slightly if needed.

export interface FirestoreTuning extends Omit<Tuning, 'id'> {
    userId: string;
    createdAt: Timestamp;
    // We store strings as simple objects, Firestore handles JSON-like structures well
}

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
    }
};
