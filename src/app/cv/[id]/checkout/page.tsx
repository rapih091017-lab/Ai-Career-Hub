"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import AuthGuard from "@/components/AuthGuard";
import AppFooter from "@/components/AppFooter";

interface CvDetail {
  id: string;
  jobTitle: string | null;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  jobDescription: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const cvId = params.id as string;

  const [cvData, setCvData] = useState<CvDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  // Fetch CV data
  useEffect(() => {
    if (!cvId) return;
    fetch(`/api/cv-documents/${cvId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("CV tidak ditemukan");
        const data = await res.json();
        setCvData({
          id: data.id,
          jobTitle: data.jobTitle || "CV tanpa judul",
          templateId: data.templateId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          jobDescription: data.jobDescription || "",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [cvId]);

  // Handle Midtrans callback redirect
  useEffect(() => {
    const paymentParam = new URLSearchParams(window.location.search).get("payment");
    if (paymentParam === "success") {
      setPaymentStatus("success");
      setTimeout(() => router.push(`/builder/${cvId}`), 3000);
    } else if (paymentParam === "error") {
      setPaymentStatus("error");
      window.history.replaceState({}, "", `/cv/${cvId}/checkout`);
    } else if (paymentParam === "pending") {
      setPaymentStatus("pending");
    }
  }, [cvId, router]);

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageType: "single_cv",
          cvDocumentId: cvId,
        }),
      });
      const result = await res.json();
      if (res.ok && result.redirect_url) {
        setPaymentStatus("pending");
        window.location.href = result.redirect_url;
      } else {
        throw new Error(result.message || "Gagal membuat pesanan");
      }
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (paymentStatus === "success") {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background text-on-background">
          <AppHeader />
          <main className="pt-24 pb-20 px-margin-mobile md:px-gutter flex justify-center">
            <div className="w-full max-w-md text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-green-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <h1 className="font-headline-lg text-on-surface">Pembayaran Berhasil!</h1>
              <p className="text-body-md text-on-surface-variant">
                Single CV AI Revision untuk <strong>{cvData?.jobTitle || "CV"}</strong> sudah aktif.
                Kamu sekarang bisa menggunakan AI Smart Revision tanpa batas untuk CV ini.
              </p>
              <div className="animate-pulse text-sm text-outline mb-4">Mengarahkan ke halaman builder...</div>
              <button
                onClick={() => router.push(`/builder/${cvId}`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-lg">edit_document</span>
                Lanjutkan ke Builder
              </button>
            </div>
          </main>
          <AppFooter bordered />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-on-background">
        <AppHeader />
        <main className="pt-24 pb-20 px-margin-mobile md:px-gutter flex justify-center">
          <div className="w-full max-w-lg flex flex-col gap-6">
            {/* Header */}
            <section className="bg-white rounded-2xl p-6 shadow-premium-sm border border-outline-variant/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-container/50 flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-2xl">shopping_cart_checkout</span>
                </div>
                <div>
                  <h1 className="font-headline-md text-on-surface">Checkout</h1>
                  <p className="text-body-md text-on-surface-variant mt-0.5">
                    Pembelian <strong>Single CV AI Revision</strong>
                  </p>
                </div>
              </div>
            </section>

            {/* CV Info */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full" />
              </div>
            ) : error && !cvData ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-premium-sm border border-outline-variant/30">
                <span className="material-symbols-outlined text-3xl text-error mb-2">error</span>
                <p className="font-label-bold text-error">{error}</p>
                <button onClick={() => router.push("/dashboard")} className="mt-4 text-primary font-label-bold underline">
                  Kembali ke Dashboard
                </button>
              </div>
            ) : cvData ? (
              <>
                {/* CV Details Card */}
                <div className="bg-white rounded-2xl p-6 shadow-premium-sm border border-outline-variant/30 space-y-4">
                  <h3 className="font-label-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">description</span>
                    Detail CV
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                      <span className="text-sm text-on-surface-variant">Judul Posisi</span>
                      <span className="font-label-bold text-sm text-on-surface">{cvData.jobTitle || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                      <span className="text-sm text-on-surface-variant">Template</span>
                      <span className="font-label-bold text-sm text-on-surface capitalize">{cvData.templateId?.replace(/-/g, " ") || "Standar"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                      <span className="text-sm text-on-surface-variant">Dibuat</span>
                      <span className="font-label-bold text-sm text-on-surface">{formatDate(cvData.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-on-surface-variant">Terakhir Diubah</span>
                      <span className="font-label-bold text-sm text-on-surface">{formatDate(cvData.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Package Details */}
                <div className="bg-white rounded-2xl p-6 shadow-premium-sm border-2 border-secondary/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-label-bold text-lg text-on-surface">Single CV AI Revision</h3>
                      <p className="text-sm text-on-surface-variant mt-0.5">Akses AI Smart Revision untuk 1 CV spesifik</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-secondary">Rp25.000</p>
                      <p className="text-xs text-on-surface-variant">1x pembayaran</p>
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/20 pt-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Yang kamu dapatkan:</h4>
                    <ul className="space-y-2">
                      {[
                        { icon: "auto_awesome", text: "AI Smart Revision untuk CV ini · tanpa batas" },
                        { icon: "history", text: "Riwayat revisi tersimpan" },
                        { icon: "calendar_month", text: "Masa berlaku 1 tahun" },
                      ].map((benefit) => (
                        <li key={benefit.text} className="flex items-start gap-2 text-sm">
                          <span className="material-symbols-outlined text-green-600 text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {benefit.icon}
                          </span>
                          <span className="text-on-surface-variant">{benefit.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Error */}
                {paymentStatus === "error" && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                    <span className="material-symbols-outlined text-error shrink-0">error</span>
                    <div>
                      <p className="font-label-bold text-sm text-error">Pembayaran Gagal</p>
                      <p className="text-xs text-error/80 mt-0.5">Silakan coba lagi. Jika masalah berlanjut, hubungi support.</p>
                    </div>
                  </div>
                )}

                {error && paymentStatus !== "error" && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                    <span className="material-symbols-outlined text-error shrink-0">error</span>
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/builder/${cvId}`)}
                    className="flex-1 py-3 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-all active:scale-[0.98]"
                  >
                    Kembali ke Builder
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="flex-1 py-3 rounded-xl bg-secondary text-on-secondary text-sm font-bold hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">lock</span>
                        Bayar Rp25.000
                      </>
                    )}
                  </button>
                </div>

                {/* Payment Info */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant/30">
                  <span className="material-symbols-outlined text-outline text-lg shrink-0">info</span>
                  <div className="text-xs text-on-surface-variant leading-relaxed">
                    <p className="font-medium text-on-surface mb-1">Metode Pembayaran</p>
                    <p>
                      Setelah klik <strong>Bayar</strong>, kamu akan diarahkan ke halaman Midtrans Snap.
                      Tersedia pembayaran via <strong>Virtual Account</strong> (BCA, Mandiri, BRI, BNI),
                      <strong> GoPay</strong>, <strong>QRIS</strong>, atau <strong>Kartu Kredit</strong>.
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </main>
        <AppFooter bordered />
      </div>
    </AuthGuard>
  );
}
