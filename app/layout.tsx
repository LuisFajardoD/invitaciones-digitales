import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "@/app/globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Invitaciones Digitales",
  description: "CRM + landing editable + invitaciones digitales premium con RSVP.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
