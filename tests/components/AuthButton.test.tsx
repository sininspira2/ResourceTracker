import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthButton } from "@/components/AuthButton";

describe("AuthButton", () => {
  it("renders the button with the correct text", () => {
    render(<AuthButton onClick={() => {}}>Test Button</AuthButton>);
    expect(screen.getByText("Test Button")).toBeInTheDocument();
  });

  it("calls the onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<AuthButton onClick={handleClick}>Test Button</AuthButton>);
    fireEvent.click(screen.getByText("Test Button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    render(
      <AuthButton onClick={() => {}} className="custom-class">
        Test Button
      </AuthButton>
    );
    expect(screen.getByText("Test Button")).toHaveClass("custom-class");
  });
});
