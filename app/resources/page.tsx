import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "../components/AppShell";
import { PageContainer } from "../components/PageContainer";
import { ResourceTable } from "../components/ResourceTable";

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (!session.user.permissions?.hasResourceAccess) {
    redirect("/dashboard");
  }

  return (
    <AppShell>
      <PageContainer>
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-text-primary">
              Resource Management
            </h1>
            <p className="text-text-tertiary">
              Track and manage your resources in real-time
            </p>
          </header>

          {/* Resource Table */}
          <ResourceTable
            userId={session.user.id || session.user.email || "unknown"}
          />
        </div>
      </PageContainer>
    </AppShell>
  );
}
