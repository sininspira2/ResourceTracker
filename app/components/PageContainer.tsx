import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  className = "container mx-auto px-4 py-8",
}: PageContainerProps) {
  return (
    <main
      className={`${className} view-transition-content animate-fade-in-up`}
      style={{ viewTransitionName: "page-content" }}
    >
      {children}
    </main>
  );
}
