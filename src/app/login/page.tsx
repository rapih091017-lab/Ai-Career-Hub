"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const Ripple = dynamic(
  () => import("@/components/blocks/modern-animated-sign-in").then((m) => m.Ripple),
  { ssr: false }
);

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState("");

  // Sign Up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpConfirmEmail, setSignUpConfirmEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState("");

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setSignInError("");
    setSignInLoading(true);

    try {
      const result = await signIn("credentials", {
        email: signInEmail,
        password: signInPassword,
        redirect: false,
      });

      if (result?.error) {
        // Tampilkan pesan error spesifik dari server jika ada
        const errorMessages: Record<string, string> = {
          "Akun Anda belum diaktifkan oleh admin. Silakan tunggu konfirmasi.": "Akun Anda belum diaktifkan oleh admin. Silakan tunggu konfirmasi.",
          "AccessDenied": "Akun Anda belum diaktifkan oleh admin.",
        };
        setSignInError(errorMessages[result.error] || "Email atau password salah. Silakan coba lagi.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setSignInError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setSignUpError("");
    setSignUpSuccess("");
    setSignUpLoading(true);

    try {
      // ── Validasi konfirmasi email ──
      if (signUpEmail !== signUpConfirmEmail) {
        setSignUpError("Email dan konfirmasi email tidak cocok.");
        setSignUpLoading(false);
        return;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signUpName,
          email: signUpEmail,
          confirmEmail: signUpConfirmEmail,
          password: signUpPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSignUpError(data.message || "Gagal mendaftar. Silakan coba lagi.");
      } else {
        setSignUpSuccess(data.message || "Akun berhasil dibuat! Silakan tunggu konfirmasi admin.");
        // Auto-switch ke signin tab + prefill email setelah sukses daftar
        setTimeout(() => {
          setTab("signin");
          setSignInEmail(signUpEmail);
          setSignUpSuccess("");
          setSignUpError("");
        }, 2500);
      }
    } catch {
      setSignUpError("Terjadi kesalahan server. Silakan coba lagi.");
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await signIn("google", { callbackUrl: "/dashboard" });
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

        {/* Right Side - Auth Form */}
        <section className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 py-20">
          <div className="w-full max-w-md">
            {/* Tab Switcher */}
            <div className="flex bg-surface-container-low rounded-xl p-1 mb-8">
              <button
                onClick={() => { setTab("signin"); setSignInError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-label-bold transition-all active:scale-[0.97] ${
                  tab === "signin"
                    ? "bg-white text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Masuk
              </button>
              <button
                onClick={() => { setTab("signup"); setSignUpError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-label-bold transition-all active:scale-[0.97] ${
                  tab === "signup"
                    ? "bg-white text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Daftar
              </button>
            </div>

            <AnimatePresence mode="wait">
            {tab === "signin" ? (
              /* ── SIGN IN FORM ── */
              <motion.form
                key="signin"
                onSubmit={handleSignIn}
                className="space-y-5"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <h1 className="font-headline-md text-on-surface mb-1">Selamat Datang Kembali</h1>
                  <p className="text-body-md text-on-surface-variant">Masuk ke akun AI Career Hub Anda</p>
                </div>

                {signInError && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-xl bg-error-container/10 border border-error/20 text-label-sm text-error flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">error</span>
                    {signInError}
                  </motion.div>
                )}

                <div>
                  <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md"
                    placeholder="Masukkan email Anda"
                  />
                </div>

                <div>
                  <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Kata Sandi</label>
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md"
                    placeholder="Masukkan kata sandi"
                  />
                </div>

                <button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-label-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {signInLoading ? (
                    <><span className="material-symbols-outlined text-lg animate-spin">sync</span> Memproses...</>
                  ) : (
                    "Masuk"
                  )}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30"></div></div>
                  <div className="relative flex justify-center"><span className="bg-background px-4 text-label-sm text-on-surface-variant">atau</span></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3.5 rounded-xl border border-outline-variant text-on-surface font-label-bold hover:bg-surface-container-low active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Masuk dengan Google
                </button>

                <p className="text-center text-label-sm text-on-surface-variant">
                  Belum punya akun?{" "}
                  <button type="button" onClick={() => setTab("signup")} className="text-primary font-label-bold hover:underline">
                    Daftar Sekarang
                  </button>
                </p>
              </motion.form>
            ) : (
              /* ── SIGN UP FORM ── */
              <motion.form
                key="signup"
                onSubmit={handleSignUp}
                className="space-y-5"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <h1 className="font-headline-md text-on-surface mb-1">Buat Akun Baru</h1>
                  <p className="text-body-md text-on-surface-variant">Daftar untuk mulai menggunakan AI Career Hub</p>
                </div>

                {signUpError && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-xl bg-error-container/10 border border-error/20 text-label-sm text-error flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">error</span>
                    {signUpError}
                  </motion.div>
                )}

                {signUpSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 rounded-xl bg-green-50 border border-green-200 text-label-sm text-green-700 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>{signUpSuccess}</span>
                    <motion.span
                      className="material-symbols-outlined text-green-500 ml-auto"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      sync
                    </motion.span>
                  </motion.div>
                )}

                <div>
                  <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Nama</label>
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md"
                    placeholder="Nama lengkap Anda"
                  />
                </div>

                <div>
                  <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md"
                    placeholder="email@contoh.com"
                  />
                </div>

                <div>
                  <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Konfirmasi Email</label>
                  <input
                    type="email"
                    required
                    value={signUpConfirmEmail}
                    onChange={(e) => setSignUpConfirmEmail(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-background text-body-md transition-colors ${
                      signUpConfirmEmail && signUpConfirmEmail !== signUpEmail
                        ? "border-error"
                        : "border-outline-variant"
                    }`}
                    placeholder="Ketik ulang email"
                  />
                  {signUpConfirmEmail && signUpConfirmEmail !== signUpEmail && (
                    <p className="mt-1 text-xs text-error flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      Email tidak cocok
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Kata Sandi</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md"
                    placeholder="Minimal 6 karakter"
                  />
                </div>

                <button
                  type="submit"
                  disabled={signUpLoading}
                  className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-label-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {signUpLoading ? (
                    <><span className="material-symbols-outlined text-lg animate-spin">sync</span> Mendaftar...</>
                  ) : (
                    "Daftar Gratis"
                  )}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30"></div></div>
                  <div className="relative flex justify-center"><span className="bg-background px-4 text-label-sm text-on-surface-variant">atau</span></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3.5 rounded-xl border border-outline-variant text-on-surface font-label-bold hover:bg-surface-container-low active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Daftar dengan Google
                </button>

                <p className="text-center text-label-sm text-on-surface-variant">
                  Sudah punya akun?{" "}
                  <button type="button" onClick={() => setTab("signin")} className="text-primary font-label-bold hover:underline">
                    Masuk
                  </button>
                </p>
              </motion.form>
            )}
            </AnimatePresence>


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
