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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text-link mx-auto"></div>
        <p className="mt-2 text-text-tertiary">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="bg-background-primary shadow-xs rounded-lg overflow-hidden border border-border-primary">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-primary">
          <thead className="bg-background-secondary">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-quaternary uppercase tracking-wider">
                Username
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-quaternary uppercase tracking-wider">
                Custom Nickname
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-quaternary uppercase tracking-wider">
                Created At
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-quaternary uppercase tracking-wider">
                Last Login
              </th>
              {session?.user.permissions?.hasUserManagementAccess && (
                <th className="px-3 py-2 text-right text-xs font-medium text-text-quaternary uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-background-primary divide-y divide-border-primary">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-text-primary">
                  {user.username}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-text-primary">
                  {user.customNickname}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-text-primary">
                  {new Date(user.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-text-primary">
                  {new Date(user.lastLogin).toLocaleString()}
                </td>
                {session?.user.permissions?.hasUserManagementAccess && (
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-text-primary text-right">
                    <button
                      onClick={() => handleExport(user.id)}
                      className="px-3 py-1 text-sm font-medium text-text-white bg-button-primary-bg rounded-md hover:bg-button-primary-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
