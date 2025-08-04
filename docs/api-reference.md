# 📡 API Reference

This document provides a comprehensive reference for all API endpoints in the Resource Tracker application.

## Authentication

All protected endpoints require Discord OAuth authentication via NextAuth.js. Users must have appropriate roles configured in `DISCORD_ROLES_CONFIG`.

### Authorization Headers
```
Authorization: Bearer {session_token}
```

## Resources API

### GET /api/resources
Get all resources with current quantities and status.

**Response:**
```json
[
  {
    "id": "resource_id",
    "name": "Resource Name",
    "quantity": 1000,
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

### PUT /api/resources/[id]
Update resource quantity (requires admin permissions).

**Request Body:**
```json
{
  "quantity": 1500,
  "changeType": "absolute", // or "relative"
  "reason": "Weekly inventory update"
}
```

### PUT /api/resources/[id]/target
Update resource target quantity (requires target edit permissions).

**Request Body:**
```json
{
  "targetQuantity": 2000
}
```

## Resource History API

### GET /api/resources/[id]/history?days=7
Get resource change history.

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 7)

**Response:**
```json
[
  {
    "id": "history_id",
    "resourceId": "resource_id",
    "previousQuantity": 800,
    "newQuantity": 1000,
    "changeAmount": 200,
    "changeType": "relative",
    "updatedBy": "User Name",
    "reason": "Weekly collection",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### DELETE /api/resources/[id]/history/[entryId]
Delete a history entry (requires admin permissions).

## User Activity API

### GET /api/user/activity?days=30&global=false&limit=500
Get user's activity history.

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 30)
- `global` (optional): Show all users' activity (default: false)
- `limit` (optional): Maximum number of entries (default: 500)

**Response:**
```json
[
  {
    "id": "activity_id",
    "resourceId": "resource_id",
    "resourceName": "Resource Name",
    "resourceCategory": "Raw Materials",
    "previousQuantity": 800,
    "newQuantity": 1000,
    "changeAmount": 200,
    "changeType": "relative",
    "reason": "Weekly collection",
    "updatedBy": "User Name",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## Leaderboard API

### GET /api/leaderboard?timeFilter=all&limit=50&offset=0
Get leaderboard rankings.

**Query Parameters:**
- `timeFilter`: "all", "month", "week", "day" (default: "all")
- `limit`: Maximum entries to return (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "rankings": [
    {
      "rank": 1,
      "userId": "user_id",
      "displayName": "User Name",
      "totalPoints": 1500.5,
      "totalContributions": 25
    }
  ],
  "total": 100,
  "timeFilter": "all"
}
```

### GET /api/leaderboard/[userId]
Get detailed contributions for a specific user.

## GDPR Compliance API

### GET /api/user/data-export
Export all user data in JSON format (GDPR compliance).

### POST /api/user/data-deletion
Request anonymization of user data (GDPR compliance).

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE" // optional
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented, but it's recommended for production deployments.

## Webhooks

The application doesn't currently support webhooks, but this could be added for real-time notifications.