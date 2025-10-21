import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LogoutButton } from "@/components/LogoutButton";
import { signOut } from "next-auth/react";

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

describe("LogoutButton", () => {
  it("renders with default text and calls signOut with the correct callbackUrl", () => {
    render(<LogoutButton />);
    const button = screen.getByText("Sign Out");
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("renders with prominent variant text", () => {
    render(<LogoutButton variant="prominent" />);
    expect(
      screen.getByText("Sign Out & Try Different Account"),
    ).toBeInTheDocument();
  });

  it("applies fullWidth class", () => {
    render(<LogoutButton fullWidth />);
    expect(screen.getByText("Sign Out")).toHaveClass("w-full");
  });
});
