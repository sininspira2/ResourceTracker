import { getServerSession } from "next-auth";
import { authOptions, getDisplayName } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RefreshRolesButton } from "../components/RefreshRolesButton";
import { ClientNavigation } from "../components/ClientNavigation";
import { NicknameSettings } from "../components/NicknameSettings";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Check if user has any required roles for site access
  if (!session.user.permissions?.hasResourceAccess) {
    redirect("/");
  }

  const displayName = getDisplayName(session.user);

  return (
    <div className="bg-background-primary min-h-screen transition-colors duration-300">
      <ClientNavigation
        title={process.env.NEXT_PUBLIC_ORG_NAME || "Resource Tracker"}
        showDashboardLink={false}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-text-primary mb-2 text-3xl font-bold">
              Welcome back, {displayName}!
            </h1>
            <p className="text-text-tertiary">
              Manage your profile and view your permissions
            </p>
          </header>

          {/* Resource Management - Prominent Section */}
          {session.user.permissions?.hasResourceAccess && (
            <div className="mb-8">
              <div className="text-text-white rounded-lg bg-linear-to-r from-blue-600 to-blue-700 p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="mb-2 text-2xl font-bold">
                      Resource Management
                    </h2>
                    <p className="text-gradient-heading-from mb-4">
                      Track, update, and monitor all your resources in real-time
                    </p>
                    <Link
                      href="/resources"
                      className="bg-button-prominent-bg text-button-prominent-blue-text hover:bg-button-prominent-blue-bg-hover flex inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12,10,3,6l9-4,9,4Zm-1,2L3,8V18l8,4Zm10,6V8l-8,4V22Z" />
                      </svg>
                      Manage Resources
                    </Link>
                  </div>
                  <div className="hidden md:block">
                    <svg
                      className="text-icon-prominent-blue h-20 w-20"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12,10,3,6l9-4,9,4Zm-1,2L3,8V18l8,4Zm10,6V8l-8,4V22Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Management - Prominent Section */}
          {session.user.permissions?.hasUserManagementAccess && (
            <div className="mb-8">
              <div className="text-text-white rounded-lg bg-linear-to-r from-red-600 to-red-700 p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="mb-2 text-2xl font-bold">User Management</h2>
                    <p className="text-text-danger-subtle mb-4">
                      View and manage user data
                    </p>
                    <Link
                      href="/users"
                      className="bg-button-prominent-bg text-button-prominent-red-text hover:bg-button-prominent-red-bg-hover flex inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      Manage Users
                    </Link>
                  </div>
                  <div className="hidden md:block">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-icon-prominent-red h-20 w-20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* User Info Card */}
            <div className="bg-background-panel border-border-primary rounded-lg border p-6 shadow-sm">
              <h2 className="text-text-primary mb-4 text-xl font-semibold">
                Profile
              </h2>
              <div className="space-y-3">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="h-16 w-16 rounded-full"
                  />
                )}
                <div>
                  <p className="text-text-primary font-medium">{displayName}</p>
                  <p className="text-text-tertiary text-sm">
                    {session.user.email}
                  </p>
                  {session.user.discordNickname && (
                    <p className="text-text-link text-xs">
                      Discord: {session.user.discordNickname}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Community Status Card */}
            <div className="bg-background-panel border-border-primary rounded-lg border p-6 shadow-sm">
              <h2 className="text-text-primary mb-4 text-xl font-semibold">
                Community Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span
                    className={`mr-2 inline-block h-2 w-2 rounded-full ${
                      session.user.isInGuild
                        ? "bg-activity-positive-bg"
                        : "bg-activity-negative-bg"
                    }`}
                  ></span>
                  <span className="text-text-tertiary text-sm">
                    {session.user.isInGuild
                      ? "Community Member"
                      : "Not in Community"}
                  </span>
                </div>
                {session.user.roles && session.user.roles.length > 0 && (
                  <div>
                    <span className="text-text-primary text-sm font-medium">
                      Roles:
                    </span>
                    <span className="text-text-link ml-1 text-sm">
                      {session.user.roles.length} role(s)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Roles Card */}
            <div className="bg-background-panel border-border-primary rounded-lg border p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-text-primary text-xl font-semibold">
                  Your Roles
                </h2>
                <RefreshRolesButton />
              </div>
              <div className="space-y-2">
                {session.user.roles && session.user.roles.length > 0 ? (
                  session.user.roles.map((roleId: string) => (
                    <div
                      key={roleId}
                      className="flex items-center justify-between"
                    >
                      <span className="text-text-primary text-sm">
                        Role ID: {roleId}
                      </span>
                      <span className="bg-tag-discord-role-bg text-tag-discord-role-text rounded-sm px-2 py-1 text-xs">
                        Discord Role
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-text-tertiary text-sm">No roles found</p>
                )}
              </div>
            </div>
          </div>

          {/* Nickname Settings - Simplified */}
          <div className="mt-8">
            <NicknameSettings />
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <div className="bg-background-panel border-border-primary rounded-lg border p-6 shadow-sm">
              <h2 className="text-text-primary mb-4 text-xl font-semibold">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  href="/dashboard/activity"
                  className="border-border-primary bg-button-secondary-bg hover:bg-button-secondary-bg-hover rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="text-text-success mr-3 h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-text-primary font-medium">
                        Activity Log
                      </h3>
                      <p className="text-text-tertiary text-sm">
                        View your activity history
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/privacy"
                  className="border-border-primary bg-button-secondary-bg hover:bg-button-secondary-bg-hover rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="text-text-purple mr-3 h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-text-primary font-medium">
                        Privacy & Data
                      </h3>
                      <p className="text-text-tertiary text-sm">
                        Manage your data and privacy
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
