"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";

export interface SectionNavItem {
  /** Id elemen section di halaman. */
  id: string;
  label: string;
  /** Badge jumlah; isi hanya dari data yang benar-benar ada. */
  count?: number;
}

interface SectionNavProps {
  items: SectionNavItem[];
  /** Isi halaman; diletakkan di kolom kanan pada layar lebar. */
  children: ReactNode;
  /** Label aksesibel untuk elemen nav. */
  label?: string;
}

/**
 * Scroll ke section, tanpa animasi bila pengguna meminta reduced motion.
 * Section yang ada di dalam <details> tertutup dibuka dulu supaya tujuan
 * lompatan tidak tersembunyi.
 */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  let node: HTMLElement | null = el;
  while (node) {
    if (node instanceof HTMLDetailsElement && !node.open) node.open = true;
    node = node.parentElement;
  }
  const reduce =
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  // Fokus dipindah ke section supaya pembaca layar dan Tab melanjutkan dari sana.
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

/** Garis acuan section aktif, sedikit di bawah header + scroll-mt. */
const LINE = 200;

/**
 * Daftar isi untuk halaman hasil yang panjang. Layar lebar: kolom kiri sticky.
 * Mobile: baris chip sticky yang bisa digeser plus tombol "Daftar isi" yang
 * membuka sheet. Item yang elemennya tidak ada di halaman tidak ditampilkan.
 */
export function SectionNav({ items, children, label }: SectionNavProps) {
  const { t } = useTranslation();
  const navLabel = label ?? t("ui.section-nav.label");
  const [present, setPresent] = useState<SectionNavItem[]>(items);
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const chipRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  const itemKey = items.map((i) => `${i.id}:${i.label}:${i.count ?? ""}`).join("|");

  // Saring item yang section-nya benar-benar ada di DOM.
  useEffect(() => {
    const visible = items.filter((it) => document.getElementById(it.id));
    setPresent(visible);
    setActive((prev) => (prev && visible.some((v) => v.id === prev) ? prev : visible[0]?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey]);

  // Tandai section aktif (aria-current).
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || present.length === 0) return;
    // Observer hanya pemicu; section aktif dihitung dari posisi: section
    // terakhir yang bagian atasnya sudah melewati garis 200px dari atas (sedikit
    // di bawah header + scroll-mt). Kalau belum
    // ada (paling atas halaman), item pertama yang aktif.
    const pick = () => {
      const line = LINE;
      let current = present[0]?.id ?? null;
      for (const p of present) {
        const el = document.getElementById(p.id);
        if (el && el.getBoundingClientRect().top <= line) current = p.id;
      }
      setActive(current);
    };
    // Pita setebal 1px di garis LINE: callback jalan tepat saat tepi section melewatinya.
    const bottom = Math.max(0, window.innerHeight - LINE - 1);
    const observer = new IntersectionObserver(pick, { rootMargin: `-${LINE}px 0px -${bottom}px 0px`, threshold: 0 });
    pick();
    present.forEach((p) => {
      const el = document.getElementById(p.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [present]);

  // Chip aktif digeser ke dalam pandangan di baris mobile.
  useEffect(() => {
    if (!active) return;
    const chip = chipRefs.current.get(active);
    const row = chip?.parentElement?.parentElement;
    if (chip && row && row.scrollWidth > row.clientWidth) {
      row.scrollTo({ left: chip.offsetLeft - 16, behavior: "auto" });
    }
  }, [active]);

  // Sheet: Escape menutup, fokus masuk ke sheet dan kembali ke tombol pembuka.
  useEffect(() => {
    if (!sheetOpen) return;
    const opener = openerRef.current;
    sheetRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
      if (e.key === "Tab" && sheetRef.current) {
        const f = sheetRef.current.querySelectorAll<HTMLElement>("a,button");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [sheetOpen]);

  const go = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setActive(id);
    setSheetOpen(false);
    // Tunggu sheet tertutup supaya fokus tidak direbut kembali ke tombol pembuka.
    requestAnimationFrame(() => scrollToSection(id));
  }, []);

  const badge = (count: number | undefined, isActive: boolean) =>
    typeof count === "number" ? (
      <span
        className={`ml-auto shrink-0 rounded-full px-1.5 text-xs font-bold tabular-nums ${
          isActive ? "bg-ink text-paper" : "bg-ink/10 text-ink"
        }`}
      >
        {count}
      </span>
    ) : null;

  if (present.length === 0) return <>{children}</>;

  return (
    <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
      {/* ── Layar lebar: kolom kiri sticky ── */}
      <nav aria-label={navLabel} className="hidden lg:block">
        <div className="sticky top-28">
          <p className="mb-2 px-3 text-xs font-extrabold uppercase tracking-[0.06em] text-ink-soft">{navLabel}</p>
          <ul className="space-y-0.5">
            {present.map((it) => {
              const isActive = it.id === active;
              return (
                <li key={it.id}>
                  <a
                    href={`#${it.id}`}
                    onClick={(e) => go(e, it.id)}
                    aria-current={isActive ? "location" : undefined}
                    className={`flex items-center gap-2 rounded-lg border-l-[3px] px-3 py-2 text-sm leading-snug transition-colors ${
                      isActive
                        ? "border-ink bg-lime/30 font-bold text-ink"
                        : "border-transparent text-ink-soft hover:bg-surface-container-low hover:text-ink"
                    }`}
                  >
                    <span className="min-w-0">{it.label}</span>
                    {badge(it.count, isActive)}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ── Mobile: baris chip sticky + tombol sheet ──
          Header pill (SiteHeader) saat halaman sudah digulir berakhir di 49px
          (<768px) dan 58px (≥768px, melayang top-2), diukur di Chromium.
          Section memakai scroll-mt-32 (128px) > header + baris chip (±106px).
          Desktop: header berakhir di 66px, kolom kiri sticky di top-28. */}
      <nav
        aria-label={navLabel}
        className="sticky top-12 z-30 -mx-5 md:top-[60px] mb-6 border-b border-ink/10 bg-desk/95 backdrop-blur md:-mx-6 lg:hidden"
      >
        <div className="flex items-center gap-2 py-2 pl-5 pr-2 md:pl-6">
          <button
            ref={openerRef}
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-full border-[1.5px] border-ink bg-paper px-3 text-xs font-bold text-ink"
          >
            <span className="material-symbols-outlined select-none text-base" aria-hidden="true">toc</span>
            {t("ui.section-nav.open")}
          </button>
          <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
            <ul className="flex w-max gap-1.5 pr-3">
              {present.map((it) => {
                const isActive = it.id === active;
                return (
                  <li key={it.id}>
                    <a
                      ref={(el) => {
                        if (el) chipRefs.current.set(it.id, el);
                        else chipRefs.current.delete(it.id);
                      }}
                      href={`#${it.id}`}
                      onClick={(e) => go(e, it.id)}
                      aria-current={isActive ? "location" : undefined}
                      className={`inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-3 text-xs font-semibold transition-colors ${
                        isActive ? "border-ink bg-lime/40 text-ink" : "border-ink/20 bg-paper text-ink-soft"
                      }`}
                    >
                      {it.label}
                      {badge(it.count, isActive)}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      {sheetOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label={t("ui.section-nav.close")}
            tabIndex={-1}
            className="absolute inset-0 bg-ink/40"
            onClick={() => setSheetOpen(false)}
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={navLabel}
            className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-[18px] border-t-[2.5px] border-ink bg-paper px-5 pb-8 pt-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg font-bold text-ink">{navLabel}</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-ink/20 text-ink"
                aria-label={t("ui.section-nav.close")}
              >
                <span className="material-symbols-outlined select-none text-lg" aria-hidden="true">close</span>
              </button>
            </div>
            <ul className="space-y-1">
              {present.map((it) => {
                const isActive = it.id === active;
                return (
                  <li key={it.id}>
                    <a
                      href={`#${it.id}`}
                      onClick={(e) => go(e, it.id)}
                      aria-current={isActive ? "location" : undefined}
                      className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                        isActive ? "bg-lime/30 font-bold text-ink" : "text-ink hover:bg-surface-container-low"
                      }`}
                    >
                      <span className="min-w-0">{it.label}</span>
                      {badge(it.count, isActive)}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <div className="min-w-0">{children}</div>
    </div>
  );
}
