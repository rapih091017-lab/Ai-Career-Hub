import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NavDropdown from "@/components/NavDropdown";
import NavMobileDropdown from "@/components/NavMobileDropdown";

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));

const items = [{ title: "CV Builder", description: "Buat CV", icon: "description", href: "/builder/new" }];

describe("navigation dropdowns", () => {
  it("opens desktop dropdown on click and closes on Escape", async () => {
    render(<NavDropdown label="Fitur" items={items} />);
    const trigger = screen.getByRole("button", { name: /fitur/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("menuitem", { name: /cv builder/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menuitem")).not.toBeInTheDocument());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("mobile accordion reveals real navigation links", () => {
    const onItemClick = vi.fn();
    render(<NavMobileDropdown label="Career Hub" items={items} onItemClick={onItemClick} />);
    fireEvent.click(screen.getByRole("button", { name: /career hub/i }));
    const link = screen.getByRole("link", { name: /cv builder/i });
    expect(link).toHaveAttribute("href", "/builder/new");
    fireEvent.click(link);
    expect(onItemClick).toHaveBeenCalledOnce();
  });
});
