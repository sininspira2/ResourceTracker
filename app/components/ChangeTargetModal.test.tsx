import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChangeTargetModal } from "./ChangeTargetModal";

const mockResource = {
  id: "1",
  name: "Iron Ore",
  targetQuantity: 200,
};

describe("ChangeTargetModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  it("renders correctly and handles form submission", async () => {
    const mockOnSavePromise = jest.fn().mockResolvedValue(undefined);
    render(
      <ChangeTargetModal
        isOpen={true}
        resource={mockResource}
        onClose={mockOnClose}
        onSave={mockOnSavePromise}
      />,
    );

    // Check that the modal is rendered
    expect(screen.getByText("Change Target for Iron Ore")).toBeInTheDocument();

    // Fill out the form
    const targetInput = screen.getByLabelText("New Target Quantity");
    fireEvent.change(targetInput, { target: { value: "300" } });

    // Submit the form
    const submitButton = screen.getByText("Save");
    fireEvent.click(submitButton);

    // Check that the onSave function was called with the correct arguments
    await screen.findByText("Save"); // wait for state update
    expect(mockOnSavePromise).toHaveBeenCalledWith("1", 300);
  });

  it("calls onClose when the cancel button is clicked", () => {
    render(
      <ChangeTargetModal
        isOpen={true}
        resource={mockResource}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    // Click the cancel button
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    // Check that the onClose function was called
    expect(mockOnClose).toHaveBeenCalled();
  });
});
