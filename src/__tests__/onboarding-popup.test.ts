import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const schemaSrc = readFileSync(join(process.cwd(), "src/db/schema/index.ts"), "utf8");
const routeSrc = readFileSync(join(process.cwd(), "src/app/api/onboarding/profile/route.ts"), "utf8");
const popupSrc = readFileSync(join(process.cwd(), "src/components/onboarding/ProfileOnboardingPopup.tsx"), "utf8");
const dashboardSrc = readFileSync(join(process.cwd(), "src/app/dashboard/page.tsx"), "utf8");
const profileSrc = readFileSync(join(process.cwd(), "src/app/settings/profile/page.tsx"), "utf8");

describe("popup isi profil hanya untuk pengguna baru", () => {
  it("penandainya disimpan di server, bukan di peramban", () => {
    // Kalau disimpan di localStorage, popup akan muncul lagi di browser lain.
    expect(schemaSrc).toContain("onboardingCompletedAt");
    expect(schemaSrc).toContain('onboarding_completed_at');
    expect(routeSrc).toContain("users.onboardingCompletedAt");
  });

  it("popup hanya terbuka bila belum pernah diselesaikan", () => {
    expect(routeSrc).toContain("isNewUser: row.completedAt === null");
    expect(popupSrc).toContain("if (data.isNewUser) setOpen(true)");
    // Default tertutup: pengguna lama tidak pernah melihatnya sesaat.
    expect(popupSrc).toContain("const [open, setOpen] = useState(false)");
  });

  it("popup dipasang di dashboard, halaman pertama setelah login", () => {
    expect(dashboardSrc).toContain("<ProfileOnboardingPopup");
    expect(dashboardSrc).toContain('router.push("/settings/profile?import=1")');
  });

  it("memilih salah satu cara langsung membuka importer yang sudah ada", () => {
    expect(profileSrc).toContain('params.get("import") === "1"');
    expect(popupSrc).toContain("onStartImport()");
  });

  it("menawarkan tempel LinkedIn dan unggah berkas, bukan-tautan otomatis", () => {
    // Membaca tautan LinkedIn secara otomatis diblokir LinkedIn, jadi tidak
    // boleh ditawarkan sebagai janji yang tidak bisa ditepati.
    expect(popupSrc).toContain("onboarding.linkedin");
    expect(popupSrc).toContain("onboarding.upload");
    expect(popupSrc).not.toMatch(/type="url"/);
  });

  it("bisa dilewati tanpa mengunci langkahnya", () => {
    expect(popupSrc).toContain('handleAction("skip")');
    expect(popupSrc).toContain("markDone()");
  });
});