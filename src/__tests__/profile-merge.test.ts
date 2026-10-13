import { describe, it, expect } from "vitest";
import {
  normalizeDate,
  fixSwappedRole,
  normalizeImportedProfile,
  mergeImportedProfile,
  summarizeImportedProfile,
  type ImportedProfile,
} from "@/lib/profile-merge";

function emptyProfile(): ImportedProfile {
  return {
    personalInfo: { fullName: "", phone: "", email: "", address: "", linkedin: "", portfolioUrl: "", summary: "" },
    workHistory: [],
    education: [],
    organisations: [],
    skills: [],
    certifications: [],
  };
}

/** Bentuk ringkasan LinkedIn: peran dulu, lalu perusahaan, dipisah "·". */
const linkedInRaw: ImportedProfile = {
  ...emptyProfile(),
  personalInfo: {
    fullName: "Budi  Santoso",
    phone: "+62 812-1111-2222",
    email: "BUDI@Example.com",
    address: "Jakarta",
    linkedin: "https://linkedin.com/in/budi",
    portfolioUrl: "",
    summary: "",
  },
  workHistory: [
    {
      id: "",
      // Tertukar: jabatan di depan, perusahaan di belakang
      position: "Senior Backend Engineer",
      company: "PT Maju Jaya",
      startDate: "Jan 2020",
      endDate: "Present",
      description: "Membangun   layanan   pembayaran",
      isPresent: false,
    },
    {
      id: "",
      position: "Backend Engineer",
      company: "PT Sinar Abadi",
      startDate: "2018",
      endDate: "2020",
      description: "",
      isPresent: false,
    },
  ],
  education: [
    { id: "", institution: "Universitas Indonesia", degree: "S1", field: "Informatika", startDate: "2014", endDate: "2018", gpa: "", isPresent: false },
  ],
  organisations: [
    { id: "", name: "Komunitas Dev Jakarta", position: "Ketua", startDate: "2021", endDate: "", description: "", isPresent: true },
  ],
  skills: [
    { id: "", name: "TypeScript", level: "advanced" },
    { id: "", name: "typescript", level: "intermediate" },
  ],
  certifications: [
    { id: "", name: "AWS SAA", issuer: "Amazon", year: "AWS 2023" },
  ],
};

describe("tanggal dinormalkan ke format yang dipakai form", () => {
  it("menerima berbagai bentuk penulisan", () => {
    expect(normalizeDate("Jan 2020")).toBe("2020-01");
    expect(normalizeDate("Januari 2021")).toBe("2021-01");
    expect(normalizeDate("2018")).toBe("2018-01");
    expect(normalizeDate("2019-07")).toBe("2019-07");
    expect(normalizeDate("03/2020")).toBe("2020-03");
    expect(normalizeDate("Present")).toBe("present");
    expect(normalizeDate("")).toBe("");
  });
});

describe("peran dan perusahaan tidak tertukar", () => {
  it("membalik ketika jabatan ditulis lebih dulu (gaya LinkedIn)", () => {
    expect(fixSwappedRole("Senior Backend Engineer", "PT Maju Jaya")).toEqual({
      position: "Senior Backend Engineer",
      company: "PT Maju Jaya",
    });
  });

  it("membiarkan urutan yang sudah benar tetap apa adanya", () => {
    expect(fixSwappedRole("PT Maju Jaya", "Backend Engineer")).toEqual({
      position: "Backend Engineer",
      company: "PT Maju Jaya",
    });
  });
});

describe("hasil impor dibersihkan", () => {
  const clean = normalizeImportedProfile(linkedInRaw);

  it("tanggal, status berjalan, dan email dirapikan", () => {
    expect(clean.workHistory[0].startDate).toBe("2020-01");
    expect(clean.workHistory[0].isPresent).toBe(true);
    expect(clean.workHistory[0].endDate).toBe("");
    expect(clean.personalInfo.email).toBe("budi@example.com");
    expect(clean.personalInfo.fullName).toBe("Budi Santoso");
  });

  it("entri kembar dibuang satu kali", () => {
    // Skill "TypeScript" muncul dua kali dengan kapitalisasi berbeda.
    expect(clean.skills).toHaveLength(1);
  });

  it("tahun sertifikasi diambil dari teks", () => {
    expect(clean.certifications[0].year).toBe("2023");
  });

  it("id selalu ada untuk form", () => {
    expect(clean.workHistory[0].id).toBeTruthy();
  });
});

describe("impor mengisi kolom kosong tanpa merusak data lama", () => {
  it("data yang sudah ada tidak ditimpa, yang kosong diisi", () => {
    const current: ImportedProfile = {
      ...emptyProfile(),
      personalInfo: { ...emptyProfile().personalInfo, fullName: "Budi Santoso", phone: "0812-999" },
      workHistory: [],
    };
    const merged = mergeImportedProfile(current, linkedInRaw, "fill-empty");
    expect(merged.personalInfo.phone).toBe("0812-999");
    expect(merged.personalInfo.email).toBe("budi@example.com");
    expect(merged.workHistory).toHaveLength(2);
  });

  it("entri yang sudah ada tidak digandakan", () => {
    const first = normalizeImportedProfile(linkedInRaw);
    const merged = mergeImportedProfile(first, linkedInRaw, "fill-empty");
    expect(merged.workHistory).toHaveLength(2);
    expect(merged.skills).toHaveLength(1);
  });

  it("mode timpa semua mengganti isi lama sepenuhnya", () => {
    const current: ImportedProfile = {
      ...emptyProfile(),
      personalInfo: { ...emptyProfile().personalInfo, fullName: "Nama Lama" },
    };
    const merged = mergeImportedProfile(current, linkedInRaw, "replace");
    expect(merged.personalInfo.fullName).toBe("Budi Santoso");
  });

  it("ringkasan memberi tahu apa yang terisi dan apa yang kembar", () => {
    const current: ImportedProfile = {
      ...emptyProfile(),
      personalInfo: { ...emptyProfile().personalInfo, fullName: "Budi Santoso" },
      workHistory: [normalizeImportedProfile(linkedInRaw).workHistory[0]],
    };
    const summary = summarizeImportedProfile(current, linkedInRaw);
    expect(summary.workHistory).toBe(2);
    expect(summary.organisations).toBe(1);
    expect(summary.duplicates).toBe(1);
    expect(summary.filledFields).toContain("Email");
    expect(summary.filledFields).not.toContain("Nama");
  });
});