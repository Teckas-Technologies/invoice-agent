"use client"
import type { Metadata } from "next";
import { useEffect } from "react";
import localFont from "next/font/local";
import "./globals.css";
import ContextProvider from "@/contexts/ContextProvider";
import { headers } from "next/headers";
import Script from "next/script";
import { ContractProvider } from "@/contexts/ContractProvider";

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

useEffect(() => {
  const fetchData = async () => {
    try {
      // Parse query parameters
      const params = new URLSearchParams(window.location.search);
      const agentId = params.get("agentId");
      const contractAddress = params.get("contractAddress");
      const abi = params.get("abi");
      alert(agentId);
      alert(contractAddress);
      alert(abi);
    } catch (err:any) {
      console.log(err.message);
    }
  };

  fetchData();
}, []);


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
        {/* <Script id="chatbot" data-agent-id="67575fc1c74d7b6d49f79ac8" data-contract-address="" data-abi="" src="https://abi-script.vercel.app/ChatBot.js"></Script> */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ContextProvider cookies={cookies}>
          <ContractProvider>
            {children}
          </ContractProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
