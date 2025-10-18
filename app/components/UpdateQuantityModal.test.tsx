import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { UpdateQuantityModal } from "./UpdateQuantityModal";
import { useSession } from "next-auth/react";

jest.mock("next-auth/react");

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
};

describe("UpdateQuantityModal", () => {
  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: "Test User",
        },
      },
      status: "authenticated",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly and handles form submission", async () => {
    const mockOnUpdatePromise = jest.fn().mockResolvedValue(undefined);
    render(
      <UpdateQuantityModal
        isOpen={true}
        resource={mockResource}
        onClose={mockOnClose}
        onUpdate={mockOnUpdatePromise}
        updateType="absolute"
        session={null}
      />
    );

    // Check that the modal is rendered
    expect(screen.getByText("Set Iron Ore")).toBeInTheDocument();

    // Fill out the form
    const quantityInput = screen.getByLabelText("New Quantity");
    fireEvent.change(quantityInput, { target: { value: "150" } });

    // Submit the form
    const submitButton = screen.getByText("Set");
    fireEvent.click(submitButton);

    // Check that the onUpdate function was called with the correct arguments
    await screen.findByText("Set"); // wait for state update
    expect(mockOnUpdatePromise).toHaveBeenCalledWith(
      "1",
      150,
      "quantityHagga",
      "absolute",
      "",
      ""
    );
  });

  it("calls onClose when the cancel button is clicked", () => {
    render(
      <UpdateQuantityModal
        isOpen={true}
        resource={mockResource}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        updateType="absolute"
        session={null}
      />
    );

    // Click the cancel button
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    // Check that the onClose function was called
    expect(mockOnClose).toHaveBeenCalled();
  });
});