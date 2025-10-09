# 🔍 How to Get Your Discord Role ID

To configure the application's role-based access control, you need the unique ID for each Discord role you want to use.

## Step 1: Enable Developer Mode in Discord

1.  Open your Discord client.
2.  Go to **User Settings** (the gear icon in the bottom-left).
3.  In the left-hand menu, navigate to the **Advanced** tab.
4.  Toggle on **Developer Mode**.

This setting allows you to copy IDs for users, roles, and servers directly from the Discord interface.

## Step 2: Copy the Role ID

1.  Go to your Discord server's settings: right-click the server icon and select **Server Settings** > **Roles**.
2.  Find the role you want to use (e.g., "Administrator").
3.  Right-click on the role name and select **Copy ID**.
4.  The ID will be a long number (e.g., `1234567890123456789`), which is now copied to your clipboard.

## Step 3: Create the JSON Configuration

Use the copied IDs to create the JSON for your `DISCORD_ROLES_CONFIG` environment variable. The entire configuration must be a single line of valid JSON.

### Example Configuration

This example shows a complete, three-tier role setup. Replace the placeholder IDs with the actual IDs you copied from your Discord server.

```json
[
  {
    "id": "your_admin_discord_role_id",
    "name": "Administrator",
    "level": 100,
    "isAdmin": true,
    "canManageUsers": true,
    "canEditTargets": true,
    "canAccessResources": true,
    "canExportData": true
  },
  {
    "id": "your_logistics_manager_discord_role_id",
    "name": "Logistics Manager",
    "level": 50,
    "isAdmin": false,
    "canManageUsers": false,
    "canEditTargets": true,
    "canAccessResources": true,
    "canExportData": false
  },
  {
    "id": "your_contributor_discord_role_id",
    "name": "Contributor",
    "level": 1,
    "isAdmin": false,
    "canManageUsers": false,
    "canEditTargets": false,
    "canAccessResources": true,
    "canExportData": false
  }
]
```

**Important**: Ensure the final value you place in your `.env.local` or Vercel environment variables is a single, continuous line of text with no line breaks.
