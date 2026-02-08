import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oxy: The Company Creating a Better World Through Connections and Technology",
  description:
    "All Oxy tools are open source, transparent, and put your rights first. Our tools empower rather than manipulate, always putting people above markets.",
  openGraph: {
    title: "Oxy: The Company Creating a Better World Through Connections and Technology",
    description:
      "All Oxy tools are open source, transparent, and put your rights first.",
    url: "https://oxy.so",
    siteName: "Oxy",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
