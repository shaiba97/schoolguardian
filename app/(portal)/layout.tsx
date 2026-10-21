import type { ReactNode } from "react";
import { TenantLockedNotice } from "@/components/portal/tenant-locked-notice";
import { Sidebar } from "@/components/portal/sidebar";
import { MobileTopBar } from "@/components/portal/mobile-top-bar";
import { BottomNav } from "@/components/portal/bottom-nav";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div
 className="flex min-h-screen w-full">
      <TenantLockedNotice />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-20 md:px-6 md:pb-10 md:pt-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
