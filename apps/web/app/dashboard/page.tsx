import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardView from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Painel | ShadowMap",
  description: "Agregados simulados de calor urbano e arborização em Salvador.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardView />
    </Suspense>
  );
}
