import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/shared/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/shared/VibeToast";

export const metadata = {
  title: "VibeChat — The Fun Concept Chat App",
  description: "Explore knowledge and vibe with AI and friends in a playful, aesthetic space.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-notebook-grid text-foreground selection:bg-yellow-300 selection:text-black">
        <AuthProvider>
          <ToastProvider>
            <TooltipProvider>
              <Navbar />
              <main className="flex-1 flex flex-col">{children}</main>
            </TooltipProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
