import { redirect } from "next/navigation";

/**
 * Tautan lama ke /profile diarahkan ke halaman profil yang sekarang berada di
 * dalam layout Pengaturan, supaya sidebar Pengaturan tetap terlihat di sana.
 */
export default function ProfileRedirect() {
  redirect("/settings/profile");
}