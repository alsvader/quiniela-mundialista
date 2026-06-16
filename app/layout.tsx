import type { Metadata, Viewport } from "next";
import { Anybody, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["700", "800"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: {
    default: "Quiniela Mundialista",
    template: "%s · Quiniela Mundialista",
  },
  description:
    "Quiniela del Mundial 2026: pronostica cada jornada, suma puntos y compite en el ranking.",
  // El favicon .ico se sirve vía la convención app/favicon.ico; aquí solo se añade
  // el PNG moderno y el apple-touch-icon (iOS ignora el manifest).
  icons: {
    icon: { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    apple: "/favicon/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Quiniela",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a0b2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${anybody.variable} ${hanken.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
