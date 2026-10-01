import { AccessProvider } from "@/components/AccessProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { BottomNav } from "@/components/BottomNav";
import { CrmRedirect } from "@/components/CrmRedirect";
import { SidebarNav } from "@/components/SidebarNav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <AccessProvider>
        <div className="flex min-h-screen bg-background">
          <SidebarNav />
          <div className="mx-auto flex min-h-screen w-full max-w-lg flex-1 flex-col md:mx-0 md:max-w-none">
            <main className="flex-1 pb-24 md:pb-8">
              <CrmRedirect>{children}</CrmRedirect>
            </main>
            <BottomNav />
          </div>
        </div>
      </AccessProvider>
    </AuthGuard>
  );
}
