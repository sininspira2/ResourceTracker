import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResourceTable } from "@/app/components/ResourceTable";
import { useSession } from "next-auth/react";
import {
  RESOURCES_API_PATH,
  USER_ACTIVITY_API_PATH,
  LEADERBOARD_API_PATH,
} from "@/lib/constants";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

const mockResources = [
  {
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
    tier: 1,
  },
  {
    id: "2",
    name: "Copper Wire",
    quantityHagga: 50,
    quantityDeepDesert: 25,
    targetQuantity: 100,
    category: "Components",
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    createdAt: new Date().toISOString(),
    lastUpdatedBy: "user2",
    isPriority: false,
    tier: 2,
  },
  {
    id: "3",
    name: "Steel Bar",
    quantityHagga: 300,
    quantityDeepDesert: 150,
    targetQuantity: 200,
    category: "Refined",
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    lastUpdatedBy: "user1",
    isPriority: false,
    tier: 3,
  },
];

const mockActivity = [
  {
    id: "1",
    resourceName: "Iron Ore",
    changeAmount: 10,
    createdAt: new Date().toISOString(),
    updatedBy: "user1",
  },
];
const mockLeaderboard = {
  leaderboard: [{ userId: "user1", totalPoints: 100, totalActions: 5 }],
};

describe("ResourceTable", () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: "Test User",
          permissions: {
            hasResourceAccess: true,
            hasTargetEditAccess: true,
            hasResourceAdminAccess: true,
          },
        },
      },
      status: "authenticated",
    });

    // Mock fetch
    global.fetch = jest.fn((url) => {
      if (url.toString().startsWith(RESOURCES_API_PATH)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResources),
        });
      }
      if (url.toString().startsWith(USER_ACTIVITY_API_PATH)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockActivity),
        });
      }
      if (url.toString().startsWith(LEADERBOARD_API_PATH)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLeaderboard),
        });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders the loading state initially and then displays resources in table view", async () => {
    render(<ResourceTable userId="test-user" />);
    expect(screen.getByText("Loading resources...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Recent Updates")).toBeInTheDocument();
      expect(screen.getByText("🏆 Leaderboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Table"));

    const table = await screen.findByRole("table");
    await waitFor(() => {
      expect(within(table).getByText("Iron Ore")).toBeInTheDocument();
      expect(within(table).getByText("Copper Wire")).toBeInTheDocument();
      expect(within(table).getByText("Steel Bar")).toBeInTheDocument();
    });
  });

  it("filters resources by search term", async () => {
    render(<ResourceTable userId="test-user" />);
    await waitFor(() => {
      expect(screen.getByText("Recent Updates")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Table"));
    const table = await screen.findByRole("table");

    const searchInput = screen.getByPlaceholderText("Search resources...");
    fireEvent.change(searchInput, { target: { value: "Copper" } });

    await waitFor(() => {
      expect(within(table).queryByText("Iron Ore")).not.toBeInTheDocument();
      expect(within(table).getByText("Copper Wire")).toBeInTheDocument();
      expect(within(table).queryByText("Steel Bar")).not.toBeInTheDocument();
    });
  });

  it("filters resources by category", async () => {
    render(<ResourceTable userId="test-user" />);
    await waitFor(() => {
      expect(screen.getByText("Recent Updates")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Table"));
    const table = await screen.findByRole("table");

    const categorySelect = screen.getByLabelText("Category:");
    fireEvent.change(categorySelect, { target: { value: "Raw" } });

    await waitFor(() => {
      expect(within(table).getByText("Iron Ore")).toBeInTheDocument();
      expect(within(table).queryByText("Copper Wire")).not.toBeInTheDocument();
      expect(within(table).queryByText("Steel Bar")).not.toBeInTheDocument();
    });
  });

  it("filters resources by 'needs updating' status", async () => {
    render(<ResourceTable userId="test-user" />);
    await waitFor(() => {
      expect(screen.getByText("Recent Updates")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Table"));
    const table = await screen.findByRole("table");

    const needsUpdatingCheckbox = screen.getByLabelText(/Needs updating/);
    fireEvent.click(needsUpdatingCheckbox);

    await waitFor(() => {
      expect(within(table).queryByText("Iron Ore")).not.toBeInTheDocument();
      expect(within(table).getByText("Copper Wire")).toBeInTheDocument();
      expect(within(table).queryByText("Steel Bar")).not.toBeInTheDocument();
    });
  });

  it("filters resources by priority", async () => {
    render(<ResourceTable userId="test-user" />);
    await waitFor(() => {
      expect(screen.getByText("Recent Updates")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Table"));
    const table = await screen.findByRole("table");

    const priorityCheckbox = screen.getByLabelText("Priority");
    fireEvent.click(priorityCheckbox);

    await waitFor(() => {
      expect(within(table).getByText("Iron Ore")).toBeInTheDocument();
      expect(within(table).queryByText("Copper Wire")).not.toBeInTheDocument();
      expect(within(table).queryByText("Steel Bar")).not.toBeInTheDocument();
    });
  });

  it("filters resources by tier", async () => {
    render(<ResourceTable userId="test-user" />);
    await waitFor(() => {
      expect(screen.getByText("Recent Updates")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Table"));
    const table = await screen.findByRole("table");

    await userEvent.selectOptions(screen.getByLabelText("Tier:"), "2");

    await waitFor(() => {
      expect(within(table).queryByText("Iron Ore")).not.toBeInTheDocument();
      expect(within(table).getByText("Copper Wire")).toBeInTheDocument();
      expect(within(table).queryByText("Steel Bar")).not.toBeInTheDocument();
    });
  });

  it("switches between grid and table view", async () => {
    render(<ResourceTable userId="test-user" />);
    await screen.findByText("Recent Updates");

    // Default is grid view
    expect(screen.queryByRole("table")).toBeNull();

    // Switch to table view
    fireEvent.click(screen.getByText("Table"));
    expect(await screen.findByRole("table")).toBeInTheDocument();

    // Switch back to grid view
    fireEvent.click(screen.getByText("Grid"));
    await waitFor(() => {
      expect(screen.queryByRole("table")).toBeNull();
    });
  });

  it("clears all filters when the 'Clear filters' button is clicked", async () => {
    render(<ResourceTable userId="test-user" />);
    await screen.findByText("Recent Updates");

    // Set some filters
    fireEvent.change(screen.getByPlaceholderText("Search resources..."), {
      target: { value: "test" },
    });
    fireEvent.change(screen.getByLabelText("Category:"), {
      target: { value: "Raw" },
    });
    fireEvent.click(screen.getByLabelText(/Needs updating/));
    fireEvent.click(screen.getByLabelText("Priority"));

    // Verify the clear button is visible and click it
    const clearButton = screen.getByText("Clear filters");
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);

    // Verify the filters are cleared
    expect(screen.getByPlaceholderText("Search resources...")).toHaveValue("");
    expect(screen.getByLabelText("Category:")).toHaveValue("all");
    expect(screen.getByLabelText(/Needs updating/)).not.toBeChecked();
    expect(screen.getByLabelText("Priority")).not.toBeChecked();
  });
});
