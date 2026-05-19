import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/walletContext";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hodegos | Injective",
  description: "Hodegos project on Injective",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} font-syne h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black selection:bg-neo-lime selection:text-black">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}

