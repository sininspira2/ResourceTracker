# 📡 API Reference

This document provides a comprehensive reference for all API endpoints in the Resource Tracker application.

## Authentication

All protected endpoints require Discord OAuth authentication via NextAuth.js. An API request is authorized if the user's Discord roles grant them the necessary permissions as defined in the system's role configuration.

### Authorization

- **Method**: Bearer Token Authentication
- **Header**: `Authorization: Bearer {session_token}`

---

## Resources API

Endpoints for managing resources.

### GET `/api/resources`

Retrieves a list of all resources, including their current quantities, status, and metadata.

- **Permissions**: Contributor

**Response `200 OK`**

```json
[
  {
    "id": "resource_id",
    "name": "Resource Name",
    "quantityHagga": 1000,
    "quantityDeepDesert": 500,
    "description": "Resource description",
    "category": "Raw Materials",
    "icon": ":resource_icon:",
    "imageUrl": "https://example.com/image.png",
    "status": "at_target",
    "targetQuantity": 1000,
    "multiplier": 1.0,
    "lastUpdatedBy": "User Name",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST `/api/resources`

Creates a new resource.

- **Permissions**: Administrator

**Request Body**

```json
{
  "name": "New Resource",
  "category": "New Category",
  "description": "Optional description",
  "targetQuantity": 5000,
  "icon": ":new_icon:"
}
```

### PUT `/api/resources`

Updates the metadata of an existing resource (e.g., name, category).

- **Permissions**: Administrator

**Request Body**

```json
{
  "id": "resource_id_to_update",
  "name": "Updated Resource Name",
  "category": "Updated Category"
}
```

### DELETE `/api/resources/[id]`

Deletes a resource and all its associated history.

- **Permissions**: Administrator
- **Parameters**: `id` (string) - The ID of the resource to delete.

### PUT `/api/resources/[id]`

Updates the quantity of a resource at a specific location.

- **Permissions**: Contributor
- **Parameters**: `id` (string) - The ID of the resource to update.

**Request Body**

```json
{
  "quantity": 1500,
  "changeType": "absolute", // or "relative"
  "reason": "Weekly inventory update",
  "location": "Hagga" // or "Deep Desert"
}
```

### PUT `/api/resources/[id]/transfer`

Transfers a resource quantity between the two locations.

- **Permissions**: Contributor
- **Parameters**: `id` (string) - The ID of the resource to transfer.

**Request Body**

```json
{
  "transferAmount": 100,
  "transferDirection": "to_deep_desert" // or "to_hagga"
}
```

### PUT `/api/resources/[id]/target`

Updates the target quantity for a resource.

- **Permissions**: Logistics Manager
- **Parameters**: `id` (string) - The ID of the resource.

**Request Body**

```json
{
  "targetQuantity": 2000
}
```

---

## Resource History API

### GET `/api/resources/[id]/history`

Retrieves the change history for a specific resource.

- **Permissions**: Contributor
- **Parameters**: `id` (string) - The ID of the resource.
- **Query Parameters**: `days` (number, optional) - Number of days to look back (default: 7).

**Response `200 OK`**

```json
[
  {
    "id": "history_id",
    "resourceId": "resource_id",
    "previousQuantityHagga": 800,
    "newQuantityHagga": 1000,
    "changeAmountHagga": 200,
    "previousQuantityDeepDesert": 500,
    "newQuantityDeepDesert": 500,
    "changeAmountDeepDesert": 0,
    "changeType": "relative",
    "updatedBy": "User Name",
    "reason": "Weekly collection",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### DELETE `/api/resources/[id]/history/[entryId]`

Deletes a specific history entry.

- **Permissions**: Administrator
- **Parameters**:
  - `id` (string) - The ID of the resource.
  - `entryId` (string) - The ID of the history entry to delete.

---

## Users API

### GET `/api/users`

Retrieves a list of all users in the system.

- **Permissions**: Administrator

### GET `/api/user/activity`

Retrieves the activity history for the currently authenticated user or globally if specified.

- **Permissions**: Contributor
- **Query Parameters**:
  - `days` (number, optional): Number of days to look back (default: 30).
  - `global` (boolean, optional): If true, shows activity for all users (requires Administrator permissions).
  - `limit` (number, optional): Maximum number of entries (default: 500).

---

## Leaderboard API

### GET `/api/leaderboard`

Retrieves leaderboard rankings.

- **Permissions**: Contributor
- **Query Parameters**:
  - `timeFilter` (string): "all", "month", "week", "day" (default: "all").
  - `limit` (number): Maximum entries to return (default: 50).
  - `offset` (number): Pagination offset (default: 0).

### GET `/api/leaderboard/[userId]`

Retrieves detailed contributions and points for a specific user.

- **Permissions**: Contributor
- **Parameters**: `userId` (string) - The Discord ID of the user.

---

## GDPR Compliance API

### GET `/api/user/data-export`

Exports all data for the currently authenticated user in JSON format.

- **Permissions**: Contributor

### POST `/api/user/data-deletion`

Requests anonymization of all data for the currently authenticated user.

- **Permissions**: Contributor

---

## Error Responses

All endpoints return consistent error responses.

**Example `403 Forbidden`**

```json
{
  "error": "You do not have permission to perform this action.",
  "code": "FORBIDDEN"
}
```

### Common HTTP Status Codes

- `200 OK` - The request was successful.
- `201 Created` - The resource was successfully created.
- `400 Bad Request` - The server cannot process the request due to a client error (e.g., malformed request syntax).
- `401 Unauthorized` - The client must authenticate itself to get the requested response.
- `403 Forbidden` - The client does not have access rights to the content.
- `404 Not Found` - The server cannot find the requested resource.
- `500 Internal Server Error` - The server has encountered a situation it doesn't know how to handle.
