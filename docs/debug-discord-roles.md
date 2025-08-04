# 🔍 How to Get Your Discord Role ID

## Step 1: Enable Developer Mode
1. Open Discord
2. Go to User Settings (gear icon)
3. Go to Advanced → Enable "Developer Mode"

## Step 2: Get Role ID
1. Go to your Discord server
2. Right-click on the role you want to use
3. Click "Copy ID"
4. This is your role ID (e.g., `1234567890123456789`)

## Step 3: Create the JSON Configuration

Replace `YOUR_ROLE_ID_HERE` with the actual role ID you copied:

```json
[{"id":"YOUR_ROLE_ID_HERE","name":"Your Role Name","level":100,"isAdmin":true,"canAccessResources":true,"canEditTargets":true}]
```

## Example with Real Role ID:
```json
[{"id":"1234567890123456789","name":"Admin","level":100,"isAdmin":true,"canAccessResources":true,"canEditTargets":true}]
```

## Multiple Roles Example:
```json
[{"id":"1234567890123456789","name":"Admin","level":100,"isAdmin":true,"canAccessResources":true,"canEditTargets":true},{"id":"9876543210987654321","name":"Member","level":1,"isAdmin":false,"canAccessResources":true,"canEditTargets":false}]
```