import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "./components/SessionProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { WhatsNewModal } from "./components/WhatsNewModal";
import { MigrationBanner } from "./components/MigrationBanner";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialTheme() {
                  try {
                    const savedTheme = localStorage.getItem('theme');
                    if (savedTheme) return savedTheme;
                    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  } catch (e) {
                    return 'light';
                  }
                }
                document.documentElement.setAttribute('data-theme', getInitialTheme());
              })();
            `,
          }}
        />
        <ThemeProvider>
          <SessionProvider>
            <div className="bg-background-primary min-h-screen">
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
