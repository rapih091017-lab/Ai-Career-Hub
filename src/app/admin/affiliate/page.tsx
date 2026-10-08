"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminBtnPrimary, adminBtnSmall } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";

interface AffiliateRow {
  id: string;
  code: string;
  status: string;
  applicationNote: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
  userName: string | null;
  userEmail: string;
  clicks: number;
  conversions: number;
  pendingAmount: number;
  maturedAmount: number;
  paidAmount: number;
}

const formatIDR = (value: number) => "Rp " + value.toLocaleString("id-ID");

const statusMeta = (status: string) => {
  if (status === "approved") return { label: "Disetujui", className: "bg-emerald-500/10 text-emerald-700" };
  if (status === "rejected") return { label: "Ditolak", className: "bg-error-container/60 text-on-error-container" };
  return { label: "Menunggu review", className: "bg-amber-500/10 text-amber-700" };
};

/** Panel admin: review pendaftar affiliate + payout manual. */
export default function AdminAffiliatePage() {
  const { addToast } = useToast();
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/affiliates");
      if (response.status === 401 || response.status === 403) {
        setError("Akses ditolak. Halaman ini hanya untuk admin.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error("load failed");
      const data = await response.json();
      setRows(data.affiliates ?? []);
      setError(null);
    } catch {
      setError("Gagal memuat data affiliate.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Pending di atas, lalu diurutkan dari yang terbaru. */
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aPending = a.status === "pending" ? 0 : 1;
      const bPending = b.status === "pending" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [rows]);

  const handleReview = async (row: AffiliateRow, action: "approve" | "reject") => {
    setBusyId(row.id);
    try {
      const response = await fetch("/api/admin/affiliates/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId: row.id, action }),
      });
      if (!response.ok) throw new Error("review failed");
      addToast({
        type: "success",
        message: action === "approve" ? "Pendaftar disetujui. Link affiliate aktif." : "Pendaftar ditolak.",
      });
      await load();
    } catch {
      addToast({ type: "error", message: "Gagal memproses. Coba lagi." });
    } finally {
      setBusyId(null);
    }
  };

  const handlePayout = async (row: AffiliateRow) => {
    if (row.maturedAmount <= 0) return;
    setBusyId(row.id);
    try {
      const response = await fetch("/api/admin/affiliates/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId: row.id }),
      });
      if (!response.ok) throw new Error("payout failed");
      const data = await response.json();
      addToast({
        type: "success",
        message:
          data.updated > 0
            ? `${data.updated} komisi ditandai dibayar.`
            : `Belum ada komisi yang siap cair (masa tunggu ${data.minAgeDays ?? 14} hari).`,
      });
      await load();
    } catch {
      addToast({ type: "error", message: "Gagal menandai payout. Coba lagi." });
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = rows.filter((row) => row.status === "pending").length;

  return (
    <div>
      <AdminPageHeader
        icon="redeem"
        title="Affiliate"
        description="Review pendaftar dan proses payout komisi manual. Payout hanya mencairkan komisi yang sudah melewati masa tunggu 14 hari."
        actions={
          pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-4 py-1.5 text-label-bold text-amber-700">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">hourglass_top</span>
              {pendingCount} menunggu review
            </span>
          ) : null
        }
      />

        {loading ? (
          <div className="mt-8 h-48 animate-pulse rounded-2xl bg-surface-container-low" aria-busy="true" />
        ) : error ? (
          <p className="mt-8 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-8 text-center text-body-md text-on-surface-variant">
            {error}
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-outline-variant p-8 text-center text-body-md text-on-surface-variant">
            Belum ada pendaftar affiliate. User mendaftar lewat halaman /affiliate.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {sortedRows.map((row) => {
              const meta = statusMeta(row.status);
              const busy = busyId === row.id;
              return (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 md:max-w-[40%]">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-body-md font-semibold text-on-surface">
                        {row.userName || row.userEmail}
                      </p>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-label-sm ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="truncate text-label-sm text-on-surface-variant">
                      {row.userEmail} <span className="mx-1">·</span> kode:{" "}
                      <code className="rounded bg-surface-container px-1.5 py-0.5">{row.code}</code>
                    </p>
                    {row.applicationNote ? (
                      <p className="mt-1 line-clamp-2 text-label-sm italic text-on-surface-variant">
                        &ldquo;{row.applicationNote}&rdquo;
                      </p>
                    ) : null}
                    {row.bankName || row.bankAccountNumber ? (
                      <p className="mt-1 truncate text-label-sm text-on-surface-variant">
                        Rekening: {[row.bankName, row.bankAccountNumber].filter(Boolean).join(" ")}
                        {row.bankAccountHolder ? ` a.n. ${row.bankAccountHolder}` : " (nama pemilik belum diisi)"}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-center">
                      <p className="text-label-sm text-on-surface-variant">Klik</p>
                      <p className="text-body-md font-semibold text-on-surface">{row.clicks}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-label-sm text-on-surface-variant">Konversi</p>
                      <p className="text-body-md font-semibold text-on-surface">{row.conversions}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-label-sm text-on-surface-variant">Pending</p>
                      <p className="text-body-md font-semibold text-amber-700">{formatIDR(row.pendingAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-label-sm text-on-surface-variant">Siap cair</p>
                      <p className="text-body-md font-semibold text-primary">{formatIDR(row.maturedAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-label-sm text-on-surface-variant">Dibayar</p>
                      <p className="text-body-md font-semibold text-emerald-700">{formatIDR(row.paidAmount)}</p>
                    </div>

                    {row.status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReview(row, "approve")}
                          disabled={busy}
                          className={adminBtnPrimary}
                        >
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                            check
                          </span>
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(row, "reject")}
                          disabled={busy}
                          className={`${adminBtnSmall} border-error/40 text-error hover:border-error/60 hover:bg-error-container/40`}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePayout(row)}
                        disabled={row.status !== "approved" || row.maturedAmount <= 0 || busy}
                        title={
                          row.maturedAmount <= 0 && row.pendingAmount > 0
                            ? "Komisi masih dalam masa tunggu 14 hari (antisipasi refund)."
                            : undefined
                        }
                        className={adminBtnPrimary}
                      >
                        {busy ? "Memproses..." : "Tandai Dibayar"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}