import type { Metadata } from "next";
import { useEffect } from "react";
import localFont from "next/font/local";
import "./globals.css";
import ContextProvider from "@/contexts/ContextProvider";
import { headers } from "next/headers";
import Script from "next/script";
import { ContractProvider } from "@/contexts/ContractProvider";
import ClientWrapper from "./ClientWrapper";

if (typeof process === 'undefined') {
  (globalThis as any).process = {
    nextTick: (callback: Function) => setTimeout(callback, 0),
    // Add any required dummy properties to satisfy the NodeJS.Process type
    env: {}, // Minimal placeholder for environment variables
    version: '', // Placeholder for Node.js version
    versions: {}, // Placeholder for Node.js versions
    stdout: undefined, // Optional: provide mock stdout if needed
    stderr: undefined, // Optional: provide mock stderr if needed
  };
}


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = headers().get('cookie')
  return (
    <html lang="en">
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ContextProvider cookies={cookies}>
         <ClientWrapper>
            {children}
            </ClientWrapper>
        </ContextProvider>
      </body>
    </html>
  );
}
