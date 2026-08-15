import { redirect } from "next/navigation";

/**
 * Profil akun dikelola di /profile (editor lengkap + tersimpan ke DB).
 * Halaman ini dialihkan agar tidak ada dua sumber data profil.
 */
export default function SettingsProfileRedirect() {
  redirect("/profile");
}
