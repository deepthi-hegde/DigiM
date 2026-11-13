import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigiM - Social Media Marketing Command Center",
  description: "AI-Powered Social Media Marketing for Local Retailers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Mukta:wght@400;500;600;700&display=swap" />
        <script src="https://cdn.tailwindcss.com/3.4.17"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.tailwind = window.tailwind || {};
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      primary: { DEFAULT: "rgb(var(--primary) / <alpha-value>)", hover: "rgb(var(--ph) / <alpha-value>)", tint: "rgb(var(--pt) / <alpha-value>)" },
                      "on-primary": "rgb(var(--op) / <alpha-value>)",
                      accent: { DEFAULT: "rgb(var(--ac) / <alpha-value>)", tint: "rgb(var(--at) / <alpha-value>)", ink: "rgb(var(--ai) / <alpha-value>)" },
                      canvas: "rgb(var(--cv) / <alpha-value>)",
                      surface: "rgb(var(--sf) / <alpha-value>)",
                      sunken: "rgb(var(--sk) / <alpha-value>)",
                      hairline: "rgb(var(--hl) / <alpha-value>)",
                      "control-border": "rgb(var(--cb) / <alpha-value>)",
                      ink: { DEFAULT: "rgb(var(--ink) / <alpha-value>)", muted: "rgb(var(--im) / <alpha-value>)" },
                      danger: { DEFAULT: "rgb(var(--dg) / <alpha-value>)", tint: "rgb(var(--dt) / <alpha-value>)" }
                    },
                    fontFamily: {
                      display: ['"Baloo 2"', '"Mukta"', 'system-ui', 'sans-serif'],
                      sans: ['"Mukta"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif']
                    },
                    borderRadius: { sm: "6px", md: "12px", lg: "16px" }
                  }
                }
              };
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
