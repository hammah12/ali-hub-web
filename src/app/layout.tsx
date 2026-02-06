import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ali Hub",
  description: "Your personal command center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
