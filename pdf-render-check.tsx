import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { writeFileSync } from "fs";
import { CvPdfDocument } from "D:/ai-career-hub/src/lib/pdf/CvPdfDocument";
import { TEMPLATE_STYLES } from "D:/ai-career-hub/src/components/cv-templates";

const sample: any = {
  fullName: "Budi Santoso",
  phone: "0812-3456-7890",
  email: "budi@email.com",
  address: "Jakarta Selatan, Indonesia",
  linkedin: "linkedin.com/in/budisantoso",
  portfolioUrl: "budisantoso.dev",
  professionalTitle: "Senior Frontend Engineer",
  employmentStatus: "Bekerja",
  summary: "Frontend engineer dengan 5 tahun pengalaman membangun aplikasi React.",
  jobTitle: "Senior Frontend Engineer",
  jobDescription: "",
  workHistory: [
    { id: "w1", position: "Frontend Engineer", company: "PT Teknologi Maju", location: "Jakarta", startDate: "2022-01", endDate: "", isCurrent: true, description: "Memimpin migrasi aplikasi ke Next.js\nMeningkatkan skor Lighthouse dari 62 ke 95", achievement: "Mengurangi waktu load halaman 40%", projectUrl: "github.com/budi/next-app" },
  ],
  education: [
    { id: "e1", institution: "Universitas Indonesia", degree: "S1", field: "Ilmu Komputer", startDate: "2016", endDate: "2020", gpa: "3.75" },
  ],
  organisations: [],
  skills: [
    { id: "s1", name: "React", level: "advanced", category: "technical" },
    { id: "s2", name: "TypeScript", level: "advanced", category: "technical" },
  ],
  certifications: [{ id: "c1", name: "AWS Solutions Architect", issuer: "Amazon", year: "2024" }],
};

const run = async () => {
  const blob = await pdf(
    createElement(CvPdfDocument as any, {
      data: sample,
      templateStyle: TEMPLATE_STYLES["industrial-pro"],
      sectionOrder: ["summary", "experience", "education", "skills"],
      marginMm: 15,
    }) as any,
  ).toBlob();
  const buf = Buffer.from(await blob.arrayBuffer());
  writeFileSync("/tmp/cv-node-test.pdf", buf);
  console.log("bytes:", buf.length);

  // verify streams
  const zlib = require("zlib");
  const re = /stream\r?\n/g;
  const bufStr = buf.toString("latin1");
  let count = 0;
  while (true) {
    const m = re.exec(bufStr);
    if (!m) break;
    const start = m.index + m[0].length;
    const end = buf.indexOf("endstream", start);
    if (end === -1) break;
    let d = buf.subarray(start, end);
    if (d[d.length-1] === 0x0a) d = d.subarray(0, d.length-1);
    if (d[d.length-1] === 0x0d) d = d.subarray(0, d.length-1);
    count++;
    try {
      const out = zlib.inflateSync(d);
      console.log("stream", count, "zlib OK, out:", out.subarray(0, 40).toString().replace(/\n/g, " "));
    } catch (e) {
      try {
        const out = zlib.inflateRawSync(d);
        console.log("stream", count, "RAW OK, out:", out.subarray(0, 40).toString().replace(/\n/g, " "));
      } catch (e2) {
        console.log("stream", count, "BOTH FAIL:", (e as Error).message);
      }
    }
  }
};
run();