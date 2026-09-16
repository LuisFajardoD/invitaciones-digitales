import type { Metadata, Viewport } from "next";
import { Amatic_SC, Baloo_2, Dongle, Indie_Flower, Nunito } from "next/font/google";
import "@/app/globals.css";
import "../shared/ui/tokens.css";
import "../shared/ui/base.css";
import "../shared/ui/components.css";

const displayFont = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const bodyFont = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

const dongleFont = Dongle({
  subsets: ["latin"],
  variable: "--font-dongle",
  weight: ["300", "400", "700"],
});

const indieFlowerFont = Indie_Flower({
  subsets: ["latin"],
  variable: "--font-indie-flower",
  weight: ["400"],
});

const amaticScFont = Amatic_SC({
  subsets: ["latin"],
  variable: "--font-amatic-sc",
  weight: ["700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Invitaciones Digitales",
  description: "CRM + landing editable + invitaciones digitales premium con RSVP.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        suppressHydrationWarning
        className={`${displayFont.variable} ${bodyFont.variable} ${dongleFont.variable} ${indieFlowerFont.variable} ${amaticScFont.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
