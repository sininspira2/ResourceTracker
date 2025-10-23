import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { ImportModal } from "@/app/components/ImportModal";

jest.mock("lucide-react", () => ({
  X: () => <svg />,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

describe("ImportModal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("should display an error for invalid file type", () => {
    render(<ImportModal isOpen={true} onClose={mockOnClose} />);

    const file = new File(["file content"], "test.txt", { type: "text/plain" });
    const input = screen.getByLabelText(/upload a csv file/i, {
      selector: "input",
    });

    fireEvent.change(input, { target: { files: [file] } });

    expect(
      screen.getByText("Invalid file type. Please upload a .csv file."),
    ).toBeInTheDocument();
  });

  it("should display an error for files exceeding the size limit", () => {
    render(<ImportModal isOpen={true} onClose={mockOnClose} />);

    const largeFile = new File(["a".repeat(257 * 1024)], "large.csv", {
      type: "text/csv",
    });
    const input = screen.getByLabelText(/upload a csv file/i, {
      selector: "input",
    });

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(
      screen.getByText("File size exceeds the 256KB limit."),
    ).toBeInTheDocument();
  });

  it("should not display an error for valid files", () => {
    render(<ImportModal isOpen={true} onClose={mockOnClose} />);

    const validFile = new File(["id,name"], "test.csv", { type: "text/csv" });
    const input = screen.getByLabelText(/upload a csv file/i, {
      selector: "input",
    });

    fireEvent.change(input, { target: { files: [validFile] } });

    expect(screen.queryByText(/invalid file type/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/file size exceeds/i)).not.toBeInTheDocument();
  });

  it("should handle filenames with multiple dots", () => {
    render(<ImportModal isOpen={true} onClose={mockOnClose} />);

    const validFile = new File(["id,name"], "test.now.csv", {
      type: "text/csv",
    });
    const input = screen.getByLabelText(/upload a csv file/i, {
      selector: "input",
    });

    fireEvent.change(input, { target: { files: [validFile] } });

    expect(screen.queryByText(/invalid file type/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/file size exceeds/i)).not.toBeInTheDocument();
  });

  it("should clear the error when a valid file is selected after an invalid one", () => {
    render(<ImportModal isOpen={true} onClose={mockOnClose} />);

    const invalidFile = new File(["file content"], "test.txt", {
      type: "text/plain",
    });
    const input = screen.getByLabelText(/upload a csv file/i, {
      selector: "input",
    });

    fireEvent.change(input, { target: { files: [invalidFile] } });
    expect(
      screen.getByText("Invalid file type. Please upload a .csv file."),
    ).toBeInTheDocument();

    const validFile = new File(["id,name"], "test.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [validFile] } });

    expect(
      screen.queryByText("Invalid file type. Please upload a .csv file."),
    ).not.toBeInTheDocument();
  });
});
