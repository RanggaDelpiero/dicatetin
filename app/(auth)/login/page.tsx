// ============================================
// Pundi — iOS-like Auth & Login Page
// ============================================

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Envelope, Lock, ArrowRight } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase/client';
import { haptic } from '@/lib/utils/haptic';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      haptic('error');
      setMessage({ text: 'Email dan password tidak boleh kosong.', type: 'error' });
      return;
    }

    haptic('medium');
    setIsLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        haptic('success');
        setMessage({ text: 'Daftar berhasil! Cek email kamu untuk konfirmasi.', type: 'success' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        haptic('success');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      haptic('error');
      setMessage({ text: (err as Error).message || 'Terjadi kesalahan auth.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    haptic('light');
    router.push('/dashboard');
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-12 bg-bg-primary min-h-screen">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Mascot / Logo Image */}
        <motion.div
          className="mb-4 inline-block"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-icon.png"
            alt="DicatetinAja Logo"
            className="w-20 h-20 mx-auto rounded-2xl shadow-md object-contain"
          />
        </motion.div>

        <h2 className="text-3xl font-extrabold tracking-tight text-text-primary">
          DicatetinAja
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Nyatet duit rasanya kayak main, bukan kerjaan.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg-elevated py-8 px-6 shadow-xl rounded-3xl border border-border-light">
          <form className="space-y-6" onSubmit={handleAuth}>
            {message && (
              <div
                className={`p-4 rounded-xl text-xs font-semibold ${
                  message.type === 'success'
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'bg-accent-danger/10 text-accent-danger'
                }`}
              >
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Alamat Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-tertiary">
                  <Envelope size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-bg-secondary border border-transparent rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent-secondary focus:bg-bg-elevated outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-tertiary">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  required
                  minLength={6}
                  className="block w-full pl-11 pr-4 py-3.5 bg-bg-secondary border border-transparent rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent-secondary focus:bg-bg-elevated outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-accent-primary text-text-on-accent font-bold text-[17px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(34,197,94,0.3)] disabled:bg-text-tertiary/40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : isSignUp ? (
                  'Buat Akun Baru ✨'
                ) : (
                  'Masuk Sekarang 👋'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => { haptic('light'); setIsSignUp(!isSignUp); }}
              className="text-center text-xs text-accent-secondary font-semibold"
            >
              {isSignUp ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar gratis'}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border-light"></div>
              <span className="flex-shrink mx-4 text-[10px] text-text-tertiary uppercase tracking-widest font-bold">Atau</span>
              <div className="flex-grow border-t border-border-light"></div>
            </div>

            <button
              onClick={handleSkip}
              className="w-full py-3.5 rounded-2xl bg-bg-secondary text-text-secondary font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              Gunakan Offline (Tanpa Login) <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
