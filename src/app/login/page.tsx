"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { describeAuthError } from "@/lib/auth-errors";
import SkyToggle from "@/components/ui/SkyToggle";

const Ripple = dynamic(
  () => import("@/components/blocks/modern-animated-sign-in").then((m) => m.Ripple),
  { ssr: false }
);

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  // Google yang menolak otorisasi mengarahkan balik ke /login dengan ?error=.
  // Tanpa dibacakan di sini, penolakan itu tidak kelihatan sama sekali.
  const [errorCode, setErrorCode] = useState<string | null>(null);
  // Pesan lain (gagal jaringan, dll) ditulis langsung lewat setError.
  const [errorMessage, setErrorMessage] = useState("");
  const error = errorCode ? describeAuthError(errorCode) : errorMessage;
  const setError = (value: string) => {
    setErrorCode(null);
    setErrorMessage(value);
  };

  // Kembalikan pengguna ke halaman yang tadi ingin dibuka, misalnya checkout.
  // Tanpa ini, semua orang mendarat di dashboard dan pilihan paket yang sudah
  // dibuat terasa hilang. Query dibaca di peramban supaya halaman tetap bisa
  // dirender di server.
  const [nextPath, setNextPath] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("error");
    if (code) setErrorCode(code);

    const rawNext = params.get("next");
    // Hanya path internal yang dipakai. Nilai mentah dari query bisa membuat
    // pengalihan ke situs lain tepat setelah login.
    if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")) {
      setNextPath(rawNext);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      // Kembalikan pengguna ke halaman yang tadi ingin dibuka, misalnya
      // checkout. Tanpa ini, semua orang mendarat di dashboard dan pilihan
      // paket yang sudah dibuat terasa hilang.
      await signIn("google", { callbackUrl: nextPath });
    } catch {
      setError("Terjadi kesalahan saat masuk dengan Google. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Navbar, logo klik = kembali ke beranda */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-paper border-b border-hairline px-margin-mobile md:px-gutter py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-[7px] border-2 border-ink bg-brand-dark flex items-center justify-center text-lime group-hover:bg-brand-green transition-all">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="font-display text-[18px] font-bold text-ink tracking-[-0.02em]">AI Career Hub</span>
        </Link>
        <div className="flex items-center gap-3">
          <SkyToggle />
          <Link
            href="/"
            className="text-xs font-bold text-on-surface-variant hover:text-green-deep transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="min-h-screen flex pt-16 bg-background">
        {/* Left Side, panel evergreen + grid lime + Ripple */}
        <section className="hidden lg:flex flex-col items-center justify-center w-1/2 relative overflow-hidden bg-evergreen">
          {/* Ripple, subtle background effect */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <Ripple mainCircleSize={100} mainCircleOpacity={0.08} numCircles={8} />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(#d6ee30 1px, transparent 1px), linear-gradient(90deg, #d6ee30 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />

          {/* Brand mark, centered */}
          <div className="relative z-10 flex flex-col items-center gap-4 px-12">
            <div className="w-16 h-16 rounded-[14px] border-[2.5px] border-[#0a0f0d] bg-[#d6ee30] flex items-center justify-center shadow-[4px_4px_0_#0a0f0d]">
              <span className="material-symbols-outlined text-4xl text-[#0a0f0d]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-center text-[#f3f6f2] leading-tight tracking-[-0.03em]">
              AI Career Hub
            </h1>
            <p className="text-center text-body-md text-[#a7c3b4] max-w-sm">
              Tingkatkan karir profesional Anda dengan kekuatan AI
            </p>
          </div>
        </section>

        {/* Right Side, Google Login */}
        <section className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 py-20">
          <div className="w-full max-w-md card-hard bg-paper p-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="font-display text-on-surface mb-1">Selamat Datang</h1>
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
                className="w-full py-3.5 rounded-full border-[2.5px] border-ink bg-lime text-on-light font-bold hover:-translate-y-0.5 shadow-[0_4px_0_rgb(var(--c-ink))] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
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
            <div className="mt-10 pt-6 border-t border-hairline flex flex-wrap justify-center gap-x-4 gap-y-2">
              <Link href="/privacy" className="text-xs text-ink-soft hover:text-green-deep transition-colors cursor-pointer">Kebijakan Privasi</Link>
              <Link href="/terms" className="text-xs text-ink-soft hover:text-green-deep transition-colors cursor-pointer">Syarat & Ketentuan</Link>
              <Link href="/contact" className="text-xs text-ink-soft hover:text-green-deep transition-colors cursor-pointer">Bantuan</Link>
            </div>
            <p className="mt-4 text-center text-xs text-ink-soft">&copy; 2026 AI Career Hub. Hak Cipta Dilindungi.</p>
          </div>
        </section>
      </main>
    </>
  );
}
