import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientNavigation } from "@/app/components/ClientNavigation";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (!session.user.permissions?.hasResourceAdminAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background-primary transition-colors duration-300">
      <ClientNavigation
        title={process.env.NEXT_PUBLIC_ORG_NAME || "Resource Tracker"}
        showDashboardLink={true}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <header className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-text-primary">
              Admin Settings
            </h1>
            <p className="text-text-tertiary">
              Manage application-wide configuration
            </p>
          </header>
          <SettingsForm />
        </div>
      </main>
    </div>
  );
}
