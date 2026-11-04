import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SkillSection } from "@/components/builder/SkillSection";
import type { SkillEntry } from "@/components/cv-templates";

const noop = () => {};

describe("SkillSection: level kosong", () => {
  it("menampilkan 'Pilih level' tanpa error, juga bila level tidak ada", () => {
    const skills = [
      { id: "a", name: "Excel", level: "" },
      { id: "b", name: "SQL" } as unknown as SkillEntry,
    ] as SkillEntry[];
    const html = renderToStaticMarkup(
      <SkillSection
        skills={skills}
        certifications={[]}
        lainnyaContent=""
        onSkillChange={noop}
        onSkillRemove={noop}
        onSkillAdd={noop}
        onCertChange={noop}
        onCertRemove={noop}
        onCertAdd={noop}
        onLainnyaChange={noop}
      />,
    );
    expect(html.match(/<option value="" selected="">Pilih level<\/option>/g)?.length).toBe(2);
  });
});
