import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sa'ad Al-Furusiyah — Portal Keuangan",
    template: "%s | Sa'ad Al-Furusiyah",
  },
  description:
    "Portal keuangan transparan untuk organisasi Sa'ad Al-Furusiyah. Kelola iuran, lihat transparansi keuangan, dan pantau pembayaran anggota.",
  keywords: ["keuangan", "organisasi", "bendahara", "iuran", "kas"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/rimayah-logo.jpg", type: "image/jpeg" },
    ],
    apple: [{ url: "/rimayah-logo.jpg", type: "image/jpeg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme') || 'light';
                if (theme !== 'dark') theme = 'light';
                document.documentElement.dataset.theme = theme;
                document.documentElement.style.colorScheme = theme;
              } catch (_) {
                document.documentElement.dataset.theme = 'light';
                document.documentElement.style.colorScheme = 'light';
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-surface-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
