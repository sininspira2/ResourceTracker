import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "./components/LoginButton";
import { LogoutButton } from "./components/LogoutButton";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Redirect authenticated users with access directly to dashboard
  if (session && session.user && session.user.permissions?.hasResourceAccess) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-900 to-purple-900 text-text-white transition-colors duration-300 dark:from-gray-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-16">
        <header className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold">
            {process.env.NEXT_PUBLIC_APP_NAME || "Resource Tracker"}
          </h1>
          <p className="text-xl text-text-homepage-intro dark:text-text-homepage-intro">
            Resource management and tracking portal for{" "}
            {process.env.NEXT_PUBLIC_ORGANIZATION_NAME || "your organization"}
          </p>
        </header>

        <div className="mx-auto max-w-md">
          {session ? (
            // User is logged in but doesn't have access
            <div className="rounded-lg border border-border-accent-primary bg-background-accent-primary p-8 text-center backdrop-blur-md">
              <div className="mb-6">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="mx-auto mb-4 h-16 w-16 rounded-full"
                  />
                )}
                <h2 className="mb-2 text-xl font-bold">
                  Welcome, {session.user.name}!
                </h2>
              </div>

              <div className="mb-6 rounded-lg border border-border-accent-secondary bg-background-accent-secondary p-4">
                <div className="mb-2 flex items-center justify-center">
                  <svg
                    className="mr-2 h-6 w-6 text-text-danger"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.664 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span className="font-medium text-text-danger">
                    Access Denied
                  </span>
                </div>
                <p className="mb-3 text-sm text-text-danger">
                  {session.user.isInGuild
                    ? "You need the required Discord roles to access this portal."
                    : "You must be a member of the Discord server to access this portal."}
                </p>
                <div className="rounded-sm bg-background-accent-tertiary px-3 py-2 text-xs text-text-danger">
                  <div className="mb-1 font-medium">Requirements:</div>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Be a member of the Discord server</li>
                    <li>Have appropriate resource management roles</li>
                    <li>
                      Contact server administrators if you believe you should
                      have access
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <LogoutButton variant="prominent" fullWidth={true} />
                <p className="text-center text-sm text-text-homepage-intro">
                  Try logging in with a Discord account that has the required
                  server roles
                </p>
              </div>
            </div>
          ) : (
            // User is not logged in
            <div className="rounded-lg border border-border-accent-primary bg-background-accent-primary p-8 text-center backdrop-blur-md">
              <h2 className="mb-4 text-2xl font-bold">Sign In Required</h2>
              <p className="mb-8 text-text-homepage-intro dark:text-text-homepage-intro">
                Please sign in with Discord to access the resource portal.
              </p>
              <LoginButton />
            </div>
          )}
        </div>

        <footer className="mt-16 text-center text-text-homepage-footer">
          <p className="text-sm">
            Powered by Discord authentication • Secure role-based access
          </p>
        </footer>
      </div>
    </main>
  );
}
