import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginButton from "@/app/components/LoginButton";
import { signIn } from "next-auth/react";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

describe("LoginButton", () => {
  it("renders the button with the correct text and icon", () => {
    render(<LoginButton />);
    expect(screen.getByText("Sign in with Discord")).toBeInTheDocument();
    expect(screen.getByRole("button")).toContainHTML("<svg");
  });

  it('calls signIn with "discord" when clicked', () => {
    render(<LoginButton />);
    fireEvent.click(screen.getByText("Sign in with Discord"));
    expect(signIn).toHaveBeenCalledWith("discord", {
      callbackUrl: "/dashboard",
    });
  });
});
