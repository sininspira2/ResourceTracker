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
    <div className="min-h-screen bg-background-primary transition-colors duration-300">
      <ClientNavigation
        title={process.env.NEXT_PUBLIC_ORG_NAME || "Resource Tracker"}
        showDashboardLink={false}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Welcome back, {displayName}!
            </h1>
            <p className="text-text-tertiary">
              Manage your profile and view your permissions
            </p>
          </header>

          {/* Resource Management - Prominent Section */}
          {session.user.permissions?.hasResourceAccess && (
            <div className="mb-8">
              <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      Resource Management
                    </h2>
                    <p className="text-text-accent-blue mb-4">
                      Track, update, and monitor all your resources in real-time
                    </p>
                    <Link
                      href="/resources"
                      className="bg-button-prominent-bg text-button-prominent-blue-text hover:bg-button-prominent-blue-bg-hover px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 inline-flex"
                    >
                      <svg
                        className="w-5 h-5"
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
                      className="w-20 h-20 text-icon-prominent-blue"
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
              <div className="bg-linear-to-r from-red-600 to-red-700 rounded-lg shadow-lg p-6 text-text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">User Management</h2>
                    <p className="text-text-accent-red mb-4">
                      View and manage user data
                    </p>
                    <Link
                      href="/users"
                      className="bg-button-prominent-bg text-button-prominent-red-text hover:bg-button-prominent-red-bg-hover px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 inline-flex"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
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
                      className="w-20 h-20 text-icon-prominent-red"
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Info Card */}
            <div className="bg-background-panel rounded-lg shadow-sm p-6 border border-border-primary">
              <h2 className="text-xl font-semibold mb-4 text-text-primary">
                Profile
              </h2>
              <div className="space-y-3">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-text-primary">{displayName}</p>
                  <p className="text-sm text-text-tertiary">
                    {session.user.email}
                  </p>
                  {session.user.discordNickname && (
                    <p className="text-xs text-text-link">
                      Discord: {session.user.discordNickname}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Community Status Card */}
            <div className="bg-background-panel rounded-lg shadow-sm p-6 border border-border-primary">
              <h2 className="text-xl font-semibold mb-4 text-text-primary">
                Community Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      session.user.isInGuild
                        ? "bg-activity-positive-bg"
                        : "bg-activity-negative-bg"
                    }`}
                  ></span>
                  <span className="text-sm text-text-tertiary">
                    {session.user.isInGuild
                      ? "Community Member"
                      : "Not in Community"}
                  </span>
                </div>
                {session.user.roles && session.user.roles.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-text-primary">
                      Roles:
                    </span>
                    <span className="text-sm text-text-link ml-1">
                      {session.user.roles.length} role(s)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Roles Card */}
            <div className="bg-background-panel rounded-lg shadow-sm p-6 border border-border-primary">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-text-primary">
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
                      <span className="text-sm text-text-primary">
                        Role ID: {roleId}
                      </span>
                      <span className="text-xs bg-tag-discord-role-bg text-tag-discord-role-text px-2 py-1 rounded-sm">
                        Discord Role
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-tertiary">No roles found</p>
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
            <div className="bg-background-panel rounded-lg shadow-sm p-6 border border-border-primary">
              <h2 className="text-xl font-semibold mb-4 text-text-primary">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/dashboard/activity"
                  className="p-4 border border-border-primary rounded-lg bg-button-secondary-bg hover:bg-button-secondary-bg-hover transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 text-text-success mr-3"
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
                      <h3 className="font-medium text-text-primary">
                        Activity Log
                      </h3>
                      <p className="text-sm text-text-tertiary">
                        View your activity history
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/privacy"
                  className="p-4 border border-border-primary rounded-lg bg-button-secondary-bg hover:bg-button-secondary-bg-hover transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 text-text-purple mr-3"
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
                      <h3 className="font-medium text-text-primary">
                        Privacy & Data
                      </h3>
                      <p className="text-sm text-text-tertiary">
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
