import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/shared/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata = {
  title: "VibeChat",
  description: "A premium chat experience.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <TooltipProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
