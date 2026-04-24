import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { PageContainer } from "@/app/components/PageContainer";
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
    <AppShell>
      <PageContainer>
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
      </PageContainer>
    </AppShell>
  );
}
