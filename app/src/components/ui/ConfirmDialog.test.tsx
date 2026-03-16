import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders the message", () => {
    render(
      <ConfirmDialog
        message="Clear all saved spells?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText("Clear all saved spells?")).toBeInTheDocument();
  });

  it("calls onConfirm when Confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Escape key is pressed", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
