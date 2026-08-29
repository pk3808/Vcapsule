import { Inter, Instrument_Serif, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-curly",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/shared/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/shared/VibeToast";

export const metadata = {
  title: "Jiyo — Live Hangout & Audio Spaces",
  description: "Live voice calls, audio notes, and endless conversation with friends. Real vibes, no algorithms.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
  themeColor: "#f7f4eb",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${caveat.variable} h-full antialiased`}
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
