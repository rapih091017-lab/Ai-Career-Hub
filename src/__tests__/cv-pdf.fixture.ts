import type { CvData } from "@/components/cv-templates";

export const sampleCv: CvData = {
  fullName: "Budi Santoso",
  phone: "0812-3456-7890",
  email: "budi@email.com",
  address: "Jakarta Selatan, Indonesia",
  linkedin: "linkedin.com/in/budisantoso",
  portfolioUrl: "budisantoso.dev",
  professionalTitle: "Senior Frontend Engineer",
  employmentStatus: "Bekerja",
  summary:
    "Frontend engineer dengan 5 tahun pengalaman membangun aplikasi React yang melayani 100.000+ pengguna, spesialis performa web dan sistem desain.",
  jobTitle: "Senior Frontend Engineer",
  jobDescription: "",
  workHistory: [
    {
      id: "w1",
      position: "Frontend Engineer",
      company: "PT Teknologi Maju",
      location: "Jakarta",
      startDate: "2022-01",
      endDate: "",
      isCurrent: true,
      description:
        "Memimpin migrasi aplikasi ke Next.js\nMeningkatkan skor Lighthouse dari 62 ke 95",
      achievement: "Mengurangi waktu load halaman 40% melalui code-splitting",
      projectUrl: "github.com/budi/next-app",
    },
    {
      id: "w2",
      position: "Junior Web Developer",
      company: "Studio Kreatif",
      location: "Bandung",
      startDate: "2020-03",
      endDate: "2021-12",
      description: "Membangun landing page dan aplikasi internal untuk 20+ klien",
    },
  ],
  education: [
    {
      id: "e1",
      institution: "Universitas Indonesia",
      degree: "S1",
      field: "Ilmu Komputer",
      startDate: "2016",
      endDate: "2020",
      gpa: "3.75",
    },
  ],
  organisations: [
    {
      id: "o1",
      name: "GDG Jakarta",
      position: "Co-Organizer",
      startDate: "2021",
      endDate: "2023",
      description: "Mengorganisir meetup bulanan untuk 100+ developer",
    },
  ],
  skills: [
    { id: "s1", name: "React", level: "advanced", category: "technical" },
    { id: "s2", name: "TypeScript", level: "advanced", category: "technical" },
    { id: "s3", name: "Komunikasi", level: "intermediate", category: "soft" },
  ],
  certifications: [
    { id: "c1", name: "AWS Solutions Architect", issuer: "Amazon", year: "2024" },
  ],
  customFields: [{ id: "cf1", label: "Kewarganegaraan", value: "Indonesia" }],
};