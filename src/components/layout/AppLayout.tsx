import React from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export function AppLayout({ children, rightPanel }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <TopBar />
      <div className="flex max-w-screen-2xl mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 py-4">
          {children}
        </main>
        {rightPanel && (
          <aside className="w-64 shrink-0 hidden xl:block px-3 py-4">
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
