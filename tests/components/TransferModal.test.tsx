import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransferModal } from "@/app/components/TransferModal";

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

describe("TransferModal", () => {
  const mockOnClose = jest.fn();
  const mockOnTransfer = jest.fn();

  it("renders correctly and handles form submission", async () => {
    const mockOnTransferPromise = jest.fn().mockResolvedValue(undefined);
    render(
      <TransferModal
        isOpen={true}
        resource={mockResource}
        onClose={mockOnClose}
        onTransfer={mockOnTransferPromise}
      />,
    );

    // Check that the modal is rendered
    expect(screen.getByText("Transfer Iron Ore")).toBeInTheDocument();

    // Fill out the form
    const amountInput = screen.getByLabelText("Amount");
    fireEvent.change(amountInput, { target: { value: "20" } });

    // Submit the form
    const submitButton = screen.getByText("Transfer");
    fireEvent.click(submitButton);

    // Check that the onTransfer function was called with the correct arguments
    await screen.findByText("Transfer"); // wait for state update
    expect(mockOnTransferPromise).toHaveBeenCalledWith(
      "1",
      20,
      "to_deep_desert",
    );
  });

  it("calls onClose when the cancel button is clicked", () => {
    render(
      <TransferModal
        isOpen={true}
        resource={mockResource}
        onClose={mockOnClose}
        onTransfer={mockOnTransfer}
      />,
    );

    // Click the cancel button
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    // Check that the onClose function was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows an error message for insufficient quantity", async () => {
    render(
      <TransferModal
        isOpen={true}
        resource={mockResource}
        onClose={mockOnClose}
        onTransfer={mockOnTransfer}
      />,
    );

    // Try to transfer more than available
    const amountInput = screen.getByLabelText("Amount");
    fireEvent.change(amountInput, { target: { value: "120" } }); // More than quantityHagga

    const submitButton = screen.getByText("Transfer");
    fireEvent.click(submitButton);

    // Check for error message
    expect(
      await screen.findByText("Insufficient quantity in Hagga base."),
    ).toBeInTheDocument();
  });
});
