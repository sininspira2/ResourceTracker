import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientNavigation } from "../components/ClientNavigation";
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ClientNavigation
        title={process.env.NEXT_PUBLIC_ORG_NAME || "Resource Tracker"}
        showDashboardLink={true}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Resource Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and manage your resources in real-time
            </p>
          </header>

          {/* Resource Table */}
          <ResourceTable
            userId={session.user.id || session.user.email || "unknown"}
          />
        </div>
      </main>
    </div>
  );
}
