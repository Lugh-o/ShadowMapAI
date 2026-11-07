import type { Metadata } from "next";
import Link from "next/link";
import { Sora, Space_Grotesk } from "next/font/google";
import Navbar from "@/components/Navbar";
import DemoSessionProvider from "@/components/DemoSessionProvider";
import MapGuideProvider from "@/components/MapGuideProvider";
import SimulatedChat from "@/components/SimulatedChat";
import { createDemoPoints } from "@/lib/demo-data";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShadowMap",
  description:
    "MVP acadêmico para visualizar zonas de calor urbano e pontos de baixa arborização na Grande Salvador.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DemoSessionProvider initialPoints={createDemoPoints()}>
          <MapGuideProvider>
            <Navbar />
            {children}
            <footer className="mt-auto border-t border-emerald-950/10 bg-white/70">
              <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-4 text-xs text-emerald-950/60 sm:flex-row sm:items-center sm:justify-between md:px-6">
                <p>
                  ShadowMap AI — demonstração visual com dados simulados de
                  calor urbano em Salvador.
                </p>
                <Link
                  href="/privacidade"
                  className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-900"
                >
                  Sobre a demonstração
                </Link>
              </div>
            </footer>
            <SimulatedChat />
          </MapGuideProvider>
        </DemoSessionProvider>
      </body>
    </html>
  );
}
