import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SortableList } from "@/components/builder/SortableList";

describe("SortableList", () => {
  it("handle tetap tombol, roledescription benar, label menyebut nama item", () => {
    render(
      <SortableList ids={["a", "b"]} onMove={() => {}} itemLabel={(id) => `Item ${id}`}>
        {(id, _i, handle) => <div>{handle}{id}</div>}
      </SortableList>,
    );
    const h = screen.getByRole("button", { name: "Seret Item a" });
    expect(h).toHaveAttribute("aria-roledescription", "pegangan seret");
  });
});
