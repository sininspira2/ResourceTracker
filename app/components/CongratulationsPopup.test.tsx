import { render, screen, fireEvent, act } from "@testing-library/react";
import { CongratulationsPopup } from "./CongratulationsPopup";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("CongratulationsPopup", () => {
  const mockOnClose = jest.fn();
  const mockRouter = { push: jest.fn() };
  (useRouter as jest.Mock).mockReturnValue(mockRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    isVisible: true,
    onClose: mockOnClose,
    pointsEarned: 100,
    resourceName: "Wood",
    actionType: "ADD" as const,
    quantityChanged: 50,
    userId: "user1",
  };

  it("should render correctly when visible", () => {
    render(<CongratulationsPopup {...defaultProps} />);
    expect(screen.getByText("Congratulations!")).toBeInTheDocument();
    expect(screen.getByText("+100.0 points")).toBeInTheDocument();
  });

  it("should not render when not visible", () => {
    render(<CongratulationsPopup {...defaultProps} isVisible={false} />);
    expect(screen.queryByText("Congratulations!")).not.toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    render(<CongratulationsPopup {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose automatically after 5 seconds", () => {
    render(<CongratulationsPopup {...defaultProps} />);
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call router.push when 'View My Contributions' is clicked", () => {
    render(<CongratulationsPopup {...defaultProps} />);
    fireEvent.click(screen.getByText("View My Contributions"));
    expect(mockRouter.push).toHaveBeenCalledWith(
      "/dashboard/contributions/user1",
    );
  });

  it.each([
    ["ADD", "Added 50"],
    ["SET", "Set quantity"],
    ["REMOVE", "Removed 50"],
  ])(
    "should display correct action text for %s",
    (actionType, expectedText) => {
      render(
        <CongratulationsPopup
          {...defaultProps}
          actionType={actionType as any}
        />,
      );
      expect(screen.getByText(new RegExp(expectedText))).toBeInTheDocument();
    },
  );

  it("should show points breakdown when pointsCalculation is provided", () => {
    const pointsCalculation = {
      basePoints: 50,
      resourceMultiplier: 1.5,
      statusBonus: 0.1,
      finalPoints: 100,
    };
    render(
      <CongratulationsPopup
        {...defaultProps}
        pointsCalculation={pointsCalculation}
      />,
    );
    expect(screen.getByText("Base points:")).toBeInTheDocument();
    expect(screen.getByText("50.0")).toBeInTheDocument();
    expect(screen.getByText("Multiplier:")).toBeInTheDocument();
    expect(screen.getByText("1.5x")).toBeInTheDocument();
    expect(screen.getByText("Status bonus:")).toBeInTheDocument();
    expect(screen.getByText("+10% bonus")).toBeInTheDocument();
  });

  it("should display no points earned message when pointsEarned is 0", () => {
    render(<CongratulationsPopup {...defaultProps} pointsEarned={0} />);
    expect(
      screen.getByText("No points earned for this action"),
    ).toBeInTheDocument();
  });
});
