import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServiceOS — Operations Platform for Service Businesses",
  description:
    "All-in-one platform to manage bookings, payments, workers, and customers. Built for cleaning, caregiving, and field service businesses in Africa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
