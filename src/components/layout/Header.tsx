"use client";

import { useAuthStore } from "@/store/authStore";
import { LogIn, LogOut, User as UserIcon, Github } from "lucide-react";
import { useEffect } from "react";

export function Header() {
    const { user, signInWithGoogle, signOut, initialize } = useAuthStore();

    useEffect(() => {
        const unsub = initialize();
        return () => unsub();
    }, [initialize]);

    return (
        <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-2xl">
            <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent tracking-tighter">
                    HarmonicArchitect
                </h1>
                <p className="text-slate-400 mt-2 font-medium">análisis armónico profundo y composición en afinaciones alternativas</p>
            </div>

            <div className="flex gap-3 items-center">
                {user ? (
                    <div className="flex items-center gap-3 bg-slate-800/50 pr-2 pl-4 py-1.5 rounded-full border border-slate-700">
                        <div className="flex flex-col text-right">
                            <span className="text-xs text-slate-400">Logged in as</span>
                            <span className="text-sm font-bold text-slate-200 leading-none">{user.displayName}</span>
                        </div>
                        {user.photoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-indigo-500" />
                        ) : (
                            <UserIcon className="w-8 h-8 p-1 rounded-full bg-slate-700" />
                        )}
                        <button
                            onClick={() => signOut()}
                            className="ml-2 p-2 rounded-full hover:bg-red-500/20 hover:text-red-400 text-slate-500 transition"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => signInWithGoogle()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-bold text-sm text-white shadow-lg shadow-indigo-500/20"
                    >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                    </button>
                )}
            </div>
        </header>
    );
}
