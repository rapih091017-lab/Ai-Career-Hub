"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  THEME_EVENT,
  applyTheme,
  currentTheme,
  readThemeChoice,
  setThemeChoice,
  type ThemeChoice,
} from "@/lib/theme";
import styles from "./SkyToggle.module.css";

/**
 * Saklar siang/malam untuk header dan halaman masuk.
 *
 * Hanya dua keadaan: terang dan gelap. Pilihan "sistem" tetap ada di grup
 * tiga keadaan di footer — satu checkbox tidak bisa mewakili tiga nilai tanpa
 * berbohong soal statusnya.
 *
 * Menyalakannya menulis pilihan eksplisit, jadi OS yang berganti tidak
 * menimpa apa yang baru saja dipilih orangnya.
 */
export default function SkyToggle() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sync = () => {
      const saved: ThemeChoice = readThemeChoice();
      // Saat pilihan masih "sistem", tema yang tampil bisa berubah karena OS;
      // baca dari <html>, bukan dari nilai yang tersimpan.
      if (saved === "system") applyTheme("system");
      setDark(currentTheme() === "dark");
    };
    sync();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChoice = () => setDark(currentTheme() === "dark");
    media.addEventListener("change", sync);
    window.addEventListener(THEME_EVENT, onChoice);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener(THEME_EVENT, onChoice);
    };
  }, []);

  const label = t("footer.theme-label", "Mode tampilan");

  return (
    <label className={styles.root} title={label}>
      <input
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={dark}
        aria-label={label}
        onChange={() => {
          const next = currentTheme() === "dark" ? "light" : "dark";
          setThemeChoice(next);
          applyTheme(next);
          setDark(next === "dark");
        }}
      />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.stars}>
          <span />
          <span />
          <span />
        </span>
        <span className={styles.clouds}>
          <span className={styles.cloud} />
          <span className={styles.cloud} />
          <span className={styles.cloud} />
        </span>
        <span className={styles.knob}>
          <span className={styles.moon}>
            <span className={styles.spot} />
            <span className={styles.spot} />
            <span className={styles.spot} />
          </span>
        </span>
      </span>
    </label>
  );
}
