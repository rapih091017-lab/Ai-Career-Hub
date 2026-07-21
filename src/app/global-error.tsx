"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
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
              className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-all active:scale-95"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
