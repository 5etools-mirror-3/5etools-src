import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MultiDropdown } from "./MultiDropdown";

const OPTIONS = ["Fire", "Cold", "Lightning"];

describe("MultiDropdown", () => {
  it("renders the label", () => {
    render(
      <MultiDropdown
        label="Damage"
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("Damage")).toBeInTheDocument();
  });

  it("dropdown is closed initially", () => {
    render(
      <MultiDropdown
        label="Damage"
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
      />
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("opens dropdown on button click", () => {
    render(
      <MultiDropdown
        label="Damage"
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("checkbox", { name: "Fire" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Cold" })).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Lightning" })
    ).toBeInTheDocument();
  });

  it("calls onChange with toggled selection when checking an option", () => {
    const handleChange = vi.fn();
    render(
      <MultiDropdown
        label="Damage"
        options={OPTIONS}
        selected={[]}
        onChange={handleChange}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Fire" }));
    expect(handleChange).toHaveBeenCalledWith(["Fire"]);
  });

  it("calls onChange removing item when unchecking a selected option", () => {
    const handleChange = vi.fn();
    render(
      <MultiDropdown
        label="Damage"
        options={OPTIONS}
        selected={["Fire", "Cold"]}
        onChange={handleChange}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Fire" }));
    expect(handleChange).toHaveBeenCalledWith(["Cold"]);
  });

  it("shows count badge when items are selected", () => {
    render(
      <MultiDropdown
        label="Damage"
        options={OPTIONS}
        selected={["Fire", "Cold"]}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("does not show count badge when nothing is selected", () => {
    render(
      <MultiDropdown
        label="Damage"
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
      />
    );
    // "0" count badge should not appear
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", () => {
    render(
      <div>
        <MultiDropdown
          label="Damage"
          options={OPTIONS}
          selected={[]}
          onChange={() => {}}
        />
        <div data-testid="outside">Outside</div>
      </div>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("checkbox", { name: "Fire" })).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
