import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { SessionProvider } from "./components/SessionProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { WhatsNewModal } from "./components/WhatsNewModal";
import { MigrationBanner } from "./components/MigrationBanner";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_ORG_NAME || "Resource Tracker",
  description: "Resource management and Discord integration portal",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="view-transition" content="same-origin" />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <SessionProvider>
            <div className="min-h-screen bg-background-primary">
              <MigrationBanner />
              {children}
              <WhatsNewModal />
            </div>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
