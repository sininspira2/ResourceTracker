import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  const mockOnPageChange = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly and handles page changes", () => {
    const { container } = render(
      <Pagination
        currentPage={2}
        totalPages={10}
        onPageChange={mockOnPageChange}
        hasNextPage={true}
        hasPrevPage={true}
      />
    );

    // Check that the pagination component is rendered
    const pageInfo = screen.getByText("Page 2 of 10");
    expect(pageInfo).toBeInTheDocument();


    // Click the "Next" button (we target the one that is not aria-hidden)
    const nextButtons = screen.getAllByText("Next");
    fireEvent.click(nextButtons.find(b => b.tagName === 'BUTTON') as HTMLElement);
    expect(mockOnPageChange).toHaveBeenCalledWith(3);

    // Click the "Previous" button
    const prevButtons = screen.getAllByText("Previous");
    fireEvent.click(prevButtons.find(b => b.tagName === 'BUTTON') as HTMLElement);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it("disables the 'Previous' button on the first page", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={mockOnPageChange}
        hasNextPage={true}
        hasPrevPage={false}
      />
    );

    const prevButtons = screen.getAllByText("Previous");
    // The visible button on larger screens is the second one in the DOM
    expect(prevButtons.find(b => b.tagName === 'BUTTON')).toBeDisabled();
  });

  it("disables the 'Next' button on the last page", () => {
    render(
      <Pagination
        currentPage={10}
        totalPages={10}
        onPageChange={mockOnPageChange}
        hasNextPage={false}
        hasPrevPage={true}
      />
    );

    const nextButtons = screen.getAllByText("Next");
    expect(nextButtons.find(b => b.tagName === 'BUTTON')).toBeDisabled();
  });
});