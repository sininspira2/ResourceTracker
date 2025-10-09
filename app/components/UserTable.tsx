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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Loading users...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xs rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Username
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Custom Nickname
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Login
              </th>
              {session?.user.permissions?.hasUserManagementAccess && (
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {user.username}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {user.customNickname}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {new Date(user.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {new Date(user.lastLogin).toLocaleString()}
                </td>
                {session?.user.permissions?.hasUserManagementAccess && (
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                    <button
                      onClick={() => handleExport(user.id)}
                      className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
