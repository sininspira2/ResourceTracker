import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditResourceModal } from "@/app/components/EditResourceModal";

const mockResource = {
  id: "1",
  name: "Iron Ore",
  quantityHagga: 100,
  quantityDeepDesert: 50,
  targetQuantity: 200,
  category: "Raw",
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  lastUpdatedBy: "user1",
  isPriority: true,
  multiplier: 1.0,
  description: "A common ore.",
};

describe("EditResourceModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  it("renders correctly and handles form submission", async () => {
    const mockOnSavePromise = jest.fn().mockResolvedValue(undefined);
    render(
      <EditResourceModal
        isOpen={true}
        resource={mockResource}
        onClose={mockOnClose}
        onSave={mockOnSavePromise}
      />,
    );

    // Check that the modal is rendered
    expect(screen.getByText("Edit Iron Ore")).toBeInTheDocument();

    // Fill out the form
    const nameInput = screen.getByLabelText("Name *");
    fireEvent.change(nameInput, { target: { value: "Iron Ore Deluxe" } });

    // Submit the form
    const submitButton = screen.getByText("Save Changes");
    fireEvent.click(submitButton);

    // Check that the onSave function was called with the correct arguments
    await screen.findByText("Save Changes"); // wait for state update
    expect(mockOnSavePromise).toHaveBeenCalledWith("1", {
      name: "Iron Ore Deluxe",
      category: "Raw",
      description: "A common ore.",
      imageUrl: "",
      isPriority: true,
      multiplier: 1,
    });
  });

  it("calls onClose when the cancel button is clicked", () => {
    render(
      <EditResourceModal
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
