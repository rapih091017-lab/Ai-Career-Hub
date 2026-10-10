import { describe, expect, it } from "vitest";
import { testimonialCreateSchema, testimonialUpdateSchema } from "@/lib/testimonial-schemas";

describe("Testimonial schemas", () => {
  it("accepts complete testimonial and defaults to draft", () => {
    const result = testimonialCreateSchema.safeParse({
      name: "Akbar Pratama",
      role: "Fresh Graduate Teknik Informatika",
      text: "CV saya dulu sering tak ada kabar. Setelah dicek, ketahuan formatnya belum ATS-friendly.",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isPublished).toBe(false);
  });

  it("rejects missing name or empty text", () => {
    expect(testimonialCreateSchema.safeParse({ name: "", role: "x", text: "y" }).success).toBe(false);
    expect(testimonialCreateSchema.safeParse({ name: "Akbar", role: "x", text: "   " }).success).toBe(false);
  });

  it("bounds long fields", () => {
    expect(
      testimonialCreateSchema.safeParse({ name: "A".repeat(120), role: "x", text: "y" }).success,
    ).toBe(false);
    expect(
      testimonialCreateSchema.safeParse({ name: "Akbar", role: "x", text: "z".repeat(700) }).success,
    ).toBe(false);
  });

  it("allows partial update but rejects empty edit", () => {
    expect(testimonialUpdateSchema.safeParse({ text: "Konten baru" }).success).toBe(true);
    expect(testimonialUpdateSchema.safeParse({}).success).toBe(false);
  });
});
