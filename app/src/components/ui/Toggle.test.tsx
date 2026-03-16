import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("renders the label", () => {
    render(<Toggle label="Concentration" active={false} onClick={() => {}} />);
    expect(screen.getByText("Concentration")).toBeInTheDocument();
  });

  it("applies 'active' class when active is true", () => {
    render(<Toggle label="Ritual" active={true} onClick={() => {}} />);
    const btn = screen.getByRole("button", { name: "Ritual" });
    expect(btn).toHaveClass("active");
  });

  it("does not apply 'active' class when active is false", () => {
    render(<Toggle label="Ritual" active={false} onClick={() => {}} />);
    const btn = screen.getByRole("button", { name: "Ritual" });
    expect(btn).not.toHaveClass("active");
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Toggle label="Ritual" active={false} onClick={handleClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Ritual" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders title attribute when provided", () => {
    render(
      <Toggle
        label="C"
        active={false}
        onClick={() => {}}
        title="Concentration"
      />
    );
    expect(screen.getByTitle("Concentration")).toBeInTheDocument();
  });
});
