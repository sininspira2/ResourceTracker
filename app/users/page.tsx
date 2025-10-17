import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientNavigation } from "../components/ClientNavigation";
import { UserTable } from "../components/UserTable";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (!session.user.permissions?.hasUserManagementAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-background-primary min-h-screen transition-colors duration-300">
      <ClientNavigation
        title={process.env.NEXT_PUBLIC_ORG_NAME || "Resource Tracker"}
        showDashboardLink={true}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-text-primary mb-2 text-3xl font-bold">
              User Management
            </h1>
            <p className="text-text-tertiary">View and manage user data</p>
          </header>

          <UserTable />
        </div>
      </main>
    </div>
  );
}
