import { describe, it, expect } from "vitest";
import {
  migrateLegacyPayload,
  shouldClearLegacy,
} from "@/lib/portfolio/legacy-migration";

function legacyValid() {
  return {
    formData: {
      heroPhotoUrl: "",
      heroHeadline: "Frontend Developer",
      heroSubHeadline: "",
      heroFirstName: "Budi",
      heroLastName: "Santoso",
      heroBio: "",
      aboutText: "",
      aboutYearsExp: "",
      aboutProjectsDone: "",
      aboutClientsHappy: "",
      skillsMain: "TypeScript",
      skillsTools: "",
      skillsLanguages: "",
      contactEmail: "",
      contactPhone: "",
      contactLinkedin: "",
      contactGithub: "",
    },
    experiences: [
      {
        id: "e1",
        company: "Acme",
        position: "Dev",
        startDate: "2024-05",
        endDate: "2023-01",
        description: "",
      },
    ],
  };
}

describe("migrateLegacyPayload", () => {
  it("payload valid lolos utuh", () => {
    const result = migrateLegacyPayload(legacyValid());
    expect(result).not.toBeNull();
    expect(result!.formData.heroFirstName).toBe("Budi");
    expect(result!.experiences[0].company).toBe("Acme");
  });

  it("URL gagal dikosongkan, data lain tetap ikut", () => {
    const legacy = legacyValid();
    legacy.formData.contactLinkedin = "javascript:alert(1)";
    const result = migrateLegacyPayload(legacy);
    expect(result).not.toBeNull();
    expect(result!.formData.contactLinkedin).toBe("");
    expect(result!.formData.heroFirstName).toBe("Budi");
  });

  it("pasangan tanggal yang melanggar range dibuang, entri tetap ada", () => {
    const result = migrateLegacyPayload(legacyValid());
    expect(result).not.toBeNull();
    expect(result!.experiences[0].startDate).toBe("");
    expect(result!.experiences[0].endDate).toBe("");
    expect(result!.experiences[0].company).toBe("Acme");
  });

  it("string lewat batas dipotong, bukan ditolak", () => {
    const legacy = legacyValid();
    legacy.formData.heroHeadline = "x".repeat(300);
    const result = migrateLegacyPayload(legacy);
    expect(result).not.toBeNull();
    expect(result!.formData.heroHeadline).toHaveLength(80);
  });

  it("masalah di luar daftar koersi mengembalikan null (legacy dipertahankan)", () => {
    const legacy = legacyValid();
    legacy.formData.contactEmail = "bukan-email";
    expect(migrateLegacyPayload(legacy)).toBeNull();
  });

  it("input non-objek mengembalikan null", () => {
    expect(migrateLegacyPayload(null)).toBeNull();
    expect(migrateLegacyPayload("rusak")).toBeNull();
    expect(migrateLegacyPayload([1, 2])).toBeNull();
  });

  it("murni: tidak memutasi input", () => {
    const legacy = legacyValid();
    const salinan = structuredClone(legacy);
    migrateLegacyPayload(legacy);
    expect(legacy).toEqual(salinan);
  });
});

describe("shouldClearLegacy (clear hanya setelah migrasi sukses atau legacy kosong)", () => {
  const data = migrateLegacyPayload(legacyValid())!;

  it("legacy kosong → boleh dihapus", () => {
    expect(shouldClearLegacy(null, null)).toBe(true);
    expect(shouldClearLegacy(null, data)).toBe(true);
  });

  it("migrasi sukses → boleh dihapus", () => {
    expect(shouldClearLegacy(legacyValid(), data)).toBe(true);
  });

  it("migrasi gagal → kunci legacy dipertahankan", () => {
    expect(shouldClearLegacy(legacyValid(), null)).toBe(false);
  });
});
