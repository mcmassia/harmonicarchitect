import { create } from 'zustand';
import { auth } from '@/lib/firebase/config';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';

interface AuthState {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    initialize: () => () => void; // Returns unsubscribe
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,

    signInWithGoogle: async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in", error);
        }
    },

    signOut: async () => {
        try {
            await firebaseSignOut(auth);
            set({ user: null });
        } catch (error) {
            console.error("Error signing out", error);
        }
    },

    initialize: () => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            set({ user, loading: false });
        });
        return unsubscribe;
    }
}));
