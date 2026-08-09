"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Ripple = dynamic(
  () => import("@/components/blocks/modern-animated-sign-in").then((m) => m.Ripple),
  { ssr: false }
);

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Terjadi kesalahan saat masuk dengan Google. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Navbar — logo klik = kembali ke beranda */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-outline-variant/10 px-margin-mobile md:px-gutter py-4 flex justify-center md:justify-start">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white group-hover:brightness-110 transition-all">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="font-headline-md text-[18px] font-bold text-primary tracking-tight group-hover:text-primary/80 transition-colors">AI Career Hub</span>
        </Link>
      </nav>

      {/* Main */}
      <main className="min-h-screen flex pt-16 bg-background">
        {/* Left Side — Gradient Brand + Ripple Background */}
        <section className="hidden lg:flex flex-col items-center justify-center w-1/2 relative overflow-hidden bg-gradient-to-br from-surface-container-low via-white to-surface-container-low">
          {/* Ripple — subtle background effect */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <Ripple mainCircleSize={100} mainCircleOpacity={0.08} numCircles={8} />
          </div>

          {/* Gradient Brand Text — centered, unobstructed */}
          <div className="relative z-10 flex flex-col items-center gap-4 px-12">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center bg-gradient-to-b from-primary via-primary to-primary/30 bg-clip-text text-transparent leading-tight">
              AI Career Hub
            </h1>
            <p className="text-center text-body-md text-on-surface-variant max-w-sm">
              Tingkatkan karir profesional Anda dengan kekuatan AI
            </p>
          </div>
        </section>

        {/* Right Side — Google Login */}
        <section className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 py-20">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="font-headline-md text-on-surface mb-1">Selamat Datang</h1>
                <p className="text-body-md text-on-surface-variant">
                  Masuk dengan akun Google Anda untuk mulai menggunakan AI Career Hub
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl bg-error-container/10 border border-error/20 text-label-sm text-error flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">error</span>
                  {error}
                </motion.div>
              )}

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 rounded-xl border border-outline-variant text-on-surface font-label-bold hover:bg-surface-container-low active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {loading ? (
                  <><span className="material-symbols-outlined text-lg animate-spin">sync</span> Menghubungkan ke Google...</>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Masuk dengan Google
                  </>
                )}
              </button>

              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Aman & terenkripsi · Tidak perlu daftar manual
              </div>
            </motion.div>

            {/* Footer Links */}
            <div className="mt-10 pt-6 border-t border-outline-variant/30 flex flex-wrap justify-center gap-x-4 gap-y-2">
              <Link href="/privacy" className="text-xs text-outline hover:text-primary transition-colors cursor-pointer">Kebijakan Privasi</Link>
              <Link href="/terms" className="text-xs text-outline hover:text-primary transition-colors cursor-pointer">Syarat & Ketentuan</Link>
              <Link href="/contact" className="text-xs text-outline hover:text-primary transition-colors cursor-pointer">Bantuan</Link>
            </div>
            <p className="mt-4 text-center text-xs text-outline-variant">&copy; 2025 AI Career Hub. Hak Cipta Dilindungi.</p>
          </div>
        </section>
      </main>
    </>
  );
}
