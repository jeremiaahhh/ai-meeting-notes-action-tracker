import "./globals.css";

import type { Metadata } from "next";
import { Toaster } from "sonner";

import { Shell } from "@/components/layout/shell";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "AI Meeting Notes & Action Tracker",
  description:
    "Turn raw meeting transcripts into structured summaries, decisions, action items and open questions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider delayDuration={120}>
            <Shell>{children}</Shell>
          </TooltipProvider>
          <Toaster richColors closeButton position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
