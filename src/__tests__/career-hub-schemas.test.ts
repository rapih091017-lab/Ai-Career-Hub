import { describe, expect, it } from "vitest";
import {
  CAREER_HUB_CATEGORIES,
  careerHubPostCreateSchema,
  careerHubPostUpdateSchema,
  careerHubListQuerySchema,
  slugifyCareerHubTitle,
} from "@/lib/career-hub-schemas";

describe("Career Hub schemas", () => {
  it("creates stable slugs from Indonesian titles", () => {
    expect(slugifyCareerHubTitle("Panduan Karier: Fresh Graduate!"))
      .toBe("panduan-karier-fresh-graduate");
  });

  it("rejects article without required fields", () => {
    expect(careerHubPostCreateSchema.safeParse({ title: "A" }).success).toBe(false);
  });

  it("accepts complete article content and defaults to draft", () => {
    const result = careerHubPostCreateSchema.safeParse({
      title: "Panduan CV",
      excerpt: "Ringkasan panduan",
      content: "Paragraf pertama\n\nParagraf kedua",
      category: CAREER_HUB_CATEGORIES[0].key,
      tags: ["CV", "ATS"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("draft");
  });

  it("rejects unsupported categories and invalid tags", () => {
    const result = careerHubPostCreateSchema.safeParse({
      title: "Panduan CV",
      excerpt: "Ringkasan",
      content: "Isi artikel",
      category: "unknown",
      tags: [""],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate tags ignoring letter case", () => {
    const result = careerHubPostCreateSchema.safeParse({
      title: "Panduan CV",
      excerpt: "Ringkasan",
      content: "Isi artikel",
      category: "cv-ats",
      tags: ["ATS", "ats"],
    });
    expect(result.success).toBe(false);
  });

  it("allows partial edits but rejects an empty edit", () => {
    expect(careerHubPostUpdateSchema.safeParse({ title: "Judul baru" }).success).toBe(true);
    expect(careerHubPostUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("bounds list filters and pagination", () => {
    expect(careerHubListQuerySchema.safeParse({ page: "2", pageSize: "20" }).success).toBe(true);
    expect(careerHubListQuerySchema.safeParse({ page: "-1", pageSize: "5000" }).success).toBe(false);
  });
});
