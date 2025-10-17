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
        <div className="border-text-link mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
        <p className="text-text-tertiary mt-2">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="bg-background-primary border-border-primary overflow-hidden rounded-lg border shadow-xs">
      <div className="overflow-x-auto">
        <table className="divide-border-primary min-w-full divide-y">
          <thead className="bg-background-secondary">
            <tr>
              <th className="text-text-quaternary px-3 py-2 text-left text-xs font-medium tracking-wider uppercase">
                Username
              </th>
              <th className="text-text-quaternary px-3 py-2 text-left text-xs font-medium tracking-wider uppercase">
                Custom Nickname
              </th>
              <th className="text-text-quaternary px-3 py-2 text-left text-xs font-medium tracking-wider uppercase">
                Created At
              </th>
              <th className="text-text-quaternary px-3 py-2 text-left text-xs font-medium tracking-wider uppercase">
                Last Login
              </th>
              {session?.user.permissions?.hasUserManagementAccess && (
                <th className="text-text-quaternary px-3 py-2 text-right text-xs font-medium tracking-wider uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-background-primary divide-border-primary divide-y">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="text-text-primary px-3 py-3 text-sm whitespace-nowrap">
                  {user.username}
                </td>
                <td className="text-text-primary px-3 py-3 text-sm whitespace-nowrap">
                  {user.customNickname}
                </td>
                <td className="text-text-primary px-3 py-3 text-sm whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleString()}
                </td>
                <td className="text-text-primary px-3 py-3 text-sm whitespace-nowrap">
                  {new Date(user.lastLogin).toLocaleString()}
                </td>
                {session?.user.permissions?.hasUserManagementAccess && (
                  <td className="text-text-primary px-3 py-3 text-right text-sm whitespace-nowrap">
                    <button
                      onClick={() => handleExport(user.id)}
                      className="text-text-white bg-button-primary-bg hover:bg-button-primary-bg-hover rounded-md px-3 py-1 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
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
