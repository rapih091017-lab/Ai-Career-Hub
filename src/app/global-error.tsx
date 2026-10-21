"use client";

import { useEffect } from "react";

/**
 * Layar error terakhir.
 *
 * Halaman ini hanya muncul kalau error такое sehingga tidak tertangani oleh
 * boundary di bawahnya. Dua tugasnya: memberi tahu pengguna dengan cara yang
 * tidak blamed, dan mengirim error ke Sentry supaya kita tahu tanpa harus
 * menunggu laporan dari pengguna.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Impor dinamis supaya Sentry tidak masuk ke bundel kalau DSN belum diisi.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs")
        .then((Sentry) => {
          Sentry.captureException(error, {
            tags: { surface: "global-error" },
          });
        })
        .catch(() => {
          // Pelaporan gagal bukan alasan untuk membuat halaman error error lagi.
        });
    } else {
      // Tanpa Sentry, setidaknya error masuk ke log server supaya bisa dicari
      // lewat `vercel logs`.
      console.error("[global-error]", error);
    }
  }, [error]);

  return (
    <html lang="id">
      <head>
        <title>Terjadi Kesalahan | AI Career Hub</title>
        <meta name="description" content="Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi." />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-[#fbf8fe]">
          <div className="text-center space-y-6 max-w-md px-5">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl text-red-500">error</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1b1b1f]">Terjadi Kesalahan</h1>
            <p className="text-sm text-[#4a4452]">
              Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 rounded-full border-[2.5px] border-ink bg-lime text-ink font-bold shadow-[0_3px_0_rgb(var(--c-ink))] hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Coba Lagi
            </button>
            {error.digest && (
              <p className="text-[11px] text-[#8a8296]">
                Kode rujukan: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}