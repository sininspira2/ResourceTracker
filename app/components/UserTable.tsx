"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  username: string;
  customNickname: string;
  createdAt: string;
  lastLogin: string;
}

export function UserTable() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/users");
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleExport = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/data-export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const disposition = response.headers.get("content-disposition");
        const filenameMatch =
          disposition && disposition.match(/filename="(.+)"/);
        a.download = filenameMatch
          ? filenameMatch[1]
          : `resource-tracker-data-${userId}-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Error exporting user data:", await response.json());
      }
    } catch (error) {
      console.error("Error exporting user data:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-text-link"></div>
        <p className="mt-2 text-text-tertiary">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-primary bg-background-primary shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-primary">
          <thead className="bg-background-secondary">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium tracking-wider text-text-quaternary uppercase">
                Username
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium tracking-wider text-text-quaternary uppercase">
                Custom Nickname
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium tracking-wider text-text-quaternary uppercase">
                Created At
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium tracking-wider text-text-quaternary uppercase">
                Last Login
              </th>
              {session?.user.permissions?.hasUserManagementAccess && (
                <th className="px-3 py-2 text-right text-xs font-medium tracking-wider text-text-quaternary uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary bg-background-primary">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-3 py-3 text-sm whitespace-nowrap text-text-primary">
                  {user.username}
                </td>
                <td className="px-3 py-3 text-sm whitespace-nowrap text-text-primary">
                  {user.customNickname}
                </td>
                <td className="px-3 py-3 text-sm whitespace-nowrap text-text-primary">
                  {new Date(user.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3 text-sm whitespace-nowrap text-text-primary">
                  {new Date(user.lastLogin).toLocaleString()}
                </td>
                {session?.user.permissions?.hasUserManagementAccess && (
                  <td className="px-3 py-3 text-right text-sm whitespace-nowrap text-text-primary">
                    <button
                      onClick={() => handleExport(user.id)}
                      className="rounded-md bg-button-primary-bg px-3 py-1 text-sm font-medium text-text-white hover:bg-button-primary-bg-hover focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                    >
                      Export Data
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
