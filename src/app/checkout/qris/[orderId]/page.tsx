"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";

/**
 * Halaman pembayaran QRIS.
 *
 * Alur: halaman pemanggil membuat order lewat /api/payments/kasera/create-order,
 * lalu mengarahkan ke sini dengan orderId. QR digambar dari `qr_string`
 * yang dikembalikan Kasera, dan status dicek berkala sebagai cadangan kalau
 * webhook belum sampai.
 */

interface CreateResult {
  paymentId: string;
  orderId: string;
  qr_string: string;
  amount: number;
  packageName?: string;
  expires_at?: string;
  instructions?: { title?: string; steps?: string[] } | null;
  existing?: boolean;
}

type PollState = "pending" | "success" | "failed" | "unknown";

const POLL_INTERVAL_MS = 5000;

export default function QrisCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string>("");
  const [qr, setQr] = useState<CreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [poll, setPoll] = useState<PollState>("pending");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([params, searchParams]).then(([p, sp]) => {
      setOrderId(p.orderId);
      const raw = sp.qr;
      const payload = typeof raw === "string" ? raw : null;
      if (payload) {
        try {
          setQr(JSON.parse(payload));
        } catch {
          setQr(null);
        }
      }
    });
  }, [params, searchParams]);

  // Hitung mundur mengikuti expires_at dari Kasera, bukan tebakan.
  const expiresAtMs = qr?.expires_at ? new Date(qr.expires_at).getTime() : null;

  useEffect(() => {
    if (expiresAtMs === null) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAtMs]);

  const checkStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/payments/kasera/status?orderId=${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { status?: string };
      if (data.status === "success") {
        setPoll("success");
        router.push("/settings/billing?paid=1");
      } else if (data.status === "failed") {
        setPoll("failed");
      }
    } catch {
      // Offline sebentar tidak masalah; polling berikutnya mencoba lagi.
    }
  }, [orderId, router]);

  useEffect(() => {
    if (!orderId || poll !== "pending") return;
    const timer = setInterval(checkStatus, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [orderId, poll, checkStatus]);

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-on-surface">{error}</p>
          <Link href="/settings/billing" className="font-bold text-green-deep underline decoration-lime decoration-[3px] underline-offset-4">
            Kembali ke tagihan
          </Link>
        </div>
      </main>
    );
  }

  if (!qr) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-on-surface-variant">Menyiapkan QR pembayaran…</p>
      </main>
    );
  }

  const expired = secondsLeft !== null && secondsLeft <= 0;

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-md mx-auto space-y-6 text-center">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface">Scan untuk bayar</h1>
          <p className="text-on-surface-variant mt-1">
            {qr.packageName ?? "Paket"} · {formatRupiah(qr.amount)}
          </p>
        </div>

        <div className="inline-block bg-white p-4 rounded-2xl border border-outline-variant/40">
          <QRCode value={qr.qr_string} size={240} level="M" />
        </div>

        <p className="text-sm text-on-surface-variant">
          Scan dengan aplikasi apa pun: GoPay, OVO, DANA, ShopeePay, atau m-banking.
        </p>

        {secondsLeft !== null && !expired && poll === "pending" ? (
          <p className="text-sm text-on-surface-variant">
            QR berlaku {Math.floor(secondsLeft / 60)} menit {secondsLeft % 60} detik
          </p>
        ) : null}

        {expired && poll !== "success" ? (
          <p className="text-sm text-error">
            QR sudah kedaluwarsa. Kembali ke halaman tagihan untuk membuat QR baru.
          </p>
        ) : null}

        {qr.instructions?.steps?.length ? (
          <ol className="text-left text-sm text-on-surface-variant space-y-2 list-decimal pl-5">
            {qr.instructions.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        ) : null}

        {poll === "success" ? (
          <p className="text-sm font-bold text-green-deep">Pembayaran diterima. Mengalihkan…</p>
        ) : (
          <Link href="/settings/billing" className="font-bold text-green-deep underline decoration-lime decoration-[3px] underline-offset-4">
            Saya sudah bayar / Kembali
          </Link>
        )}
      </div>
    </main>
  );
}