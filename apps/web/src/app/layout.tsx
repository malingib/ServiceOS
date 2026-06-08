import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServiceOS | Malindi Cleaning & House Helps",
  description: "Book cleaning, laundry, Airbnb turnover, and house-help placement with Malindi Cleaning & House Helps.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
