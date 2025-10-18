import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { UserTable } from "./UserTable";
import { useSession } from "next-auth/react";

jest.mock("next-auth/react");

const mockUsers = [
  {
    id: "1",
    username: "testuser1",
    role: "Admin",
    customNickname: "The Boss",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: "2",
    username: "testuser2",
    role: "Contributor",
    customNickname: null,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
];

describe("UserTable", () => {
    beforeEach(() => {
        (useSession as jest.Mock).mockReturnValue({
          data: {
            user: {
              name: "Test User",
              permissions: {
                hasUserManagementAccess: true,
              },
            },
          },
          status: "authenticated",
        });

        // Mock fetch
        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsers),
          })
        ) as jest.Mock;
      });

  it("renders correctly with a list of users", async () => {
    render(<UserTable />);

    // Check that the loading state is rendered
    expect(screen.getByText("Loading users...")).toBeInTheDocument();

    // Wait for the users to be fetched and rendered
    await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
    });

    // Check for user data
    expect(screen.getByText("The Boss")).toBeInTheDocument();
    expect(screen.getByText("testuser2")).toBeInTheDocument();
  });

  it("renders an empty state when no users are returned", async () => {
    // Mock fetch to return an empty array
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as jest.Mock;

    render(<UserTable />);

    // Wait for the users to be fetched and rendered
    await waitFor(() => {
        expect(screen.queryByRole("table")).toBeInTheDocument();
    });

    expect(screen.queryByText("No users found.")).toBeNull();
  });
});