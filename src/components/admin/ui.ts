/**
 * Kelas Tailwind bersama untuk panel admin.
 *
 * Tujuannya: kontrol form terasa nyaman dipakai dan dipandang —
 * tinggi ~44px (target sentuh minimum), radius lembut, placeholder jelas
 * tapi tidak menyamar sebagai nilai, border terlihat saat hover, dan
 * transisi 200ms. Aturan fokus global di globals.css hanya memberi cincin
 * 10% opacity, jadi fokus di panel admin dipertegas di sini supaya jelas
 * terlihat saat mengetik di form panjang.
 */

export const adminInputClass =
  "w-full rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-3.5 py-2.5 text-body-md text-on-surface shadow-sm transition-colors duration-200 placeholder:text-on-surface-variant/50 hover:border-outline focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant";

export const adminTextareaClass = `${adminInputClass} min-h-[112px] resize-y leading-relaxed`;

/** Input dengan ikon di dalam (mis. kolom pencarian). */
export const adminInputWithIconClass = `${adminInputClass} pl-11`;

export const adminLabelClass = "text-label-bold text-on-surface";
export const adminHintClass = "mt-1.5 text-label-sm text-on-surface-variant";
export const adminErrorClass = "mt-1.5 text-label-sm text-error";

export const adminCardClass =
  "rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-soft md:p-6";

export const adminSectionTitleClass = "text-label-bold text-on-surface";

const btnBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 text-label-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/** Tombol utama: satu aksi paling penting per layar/panel. */
export const adminBtnPrimary = `${btnBase} h-11 rounded-xl bg-primary px-5 text-on-primary shadow-sm hover:brightness-110`;

/** Tombol sekunder: aksi pendamping yang tetap terlihat. */
export const adminBtnSecondary = `${btnBase} h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-on-surface hover:border-outline hover:bg-surface-container`;

/** Tombol kecil untuk baris tabel/kartu. */
export const adminBtnSmall = `${btnBase} h-10 rounded-lg border border-outline-variant px-3 text-on-surface hover:border-outline hover:bg-surface-container`;

/** Aksi merusak (hapus/cabut akses). */
export const adminBtnDanger = `${btnBase} h-10 rounded-lg px-3 text-error hover:bg-error-container/50`;

/** Tombol ikon saja — wajib disertai aria-label di pemanggilnya. */
export const adminIconButton = `${btnBase} h-11 w-11 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface`;

export const adminCheckboxClass =
  "h-5 w-5 shrink-0 cursor-pointer rounded-md border-outline-variant accent-[#0d7377]";
