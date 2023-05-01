# Player Endpoints

## Base URL

All the player endpoints are prefixed with `/players`. For example, if your API base URL is `https://api.example.com`, the endpoints will be available at `https://api.example.com/players`.

## Authentication

Some endpoints require authentication. To authenticate, include an `Authorization` header with the value `Bearer <access_token>` in the request.

## Endpoints

### Register a new player

- Endpoint: `POST /players`
- Request body:
  - `name`: string (required) - Player's name.
  - `email`: string (required) - Player's email address. Must be a valid email format.
  - `cellphone`: string (required) - Player's cellphone number.
  - `password`: string (required) - Player's password. Must be at least 6 characters long.
- Response: The created player object.

```
POST /players HTTP/1.1
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "cellphone": "+1234567890",
    "password": "test123"
}
```

### Login a player

- Endpoint: `POST /players/login`
- Request body:
  - `email`: string (required) - Player's email address. Must be a valid email format.
  - `password`: string (required) - Player's password.
- Response: The authenticated player object and an access token.

```
POST /players/login HTTP/1.1
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "test123"
}
```

### Get all players

- Endpoint: `GET /players`
- Authentication: Required.
- Response: An array of player objects.

```
GET /players HTTP/1.1 Authorization: Bearer <access_token>
```

### Get a specific player by ID

- Endpoint: `GET /players/:id`
- Authentication: Required.
- Path parameter:
  - `id`: number (required) - The ID of the player to retrieve.
- Response: The requested player object.

```
GET /players/1 HTTP/1.1 Authorization: Bearer <access_token>
```

### Update a specific player by ID

- Endpoint: `PUT /players/:id`
- Authentication: Required.
- Path parameter:
  - `id`: number (required) - The ID of the player to update.
- Request body:
  - `name`: string (required) - Player's updated name.
  - `email`: string (required) - Player's updated email address. Must be a valid email format.
  - `cellphone`: string (required) - Player's updated cellphone number.
- Response: The updated player object.

```
PUT /players/1 HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "name": "John Doe Updated",
    "email": "john_updated@example.com",
    "cellphone": "+0987654321"
}
```

### Delete a specific player by ID

- Endpoint: `DELETE /players/:id`
- Authentication: Required.
- Path parameter:
  - `id`: number (required) - The ID of the player to delete.
- Response: The deleted player object.

```
DELETE /players/1 HTTP/1.1 Authorization: Bearer <access_token>
```

Please note that the request validation information is now included in the documentation for each endpoint. Ensure you follow the validation requirements

# Team Endpoints

## Base URL

All the team endpoints are prefixed with `/teams`. For example, if your API base URL is `https://api.example.com`, the endpoints will be available at `https://api.example.com/teams`.

## Authentication

Some endpoints require authentication. To authenticate, include an `Authorization` header with the value `Bearer <access_token>` in the request.

## Endpoints

### Create a new team

- Endpoint: `POST /teams`
- Authentication: Required.
- Request body:
  - `name`: string (required) - Team's name.
- Response: The created team object.

```
POST /teams HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Awesome Team"
}
```

### Get all teams

- Endpoint: `GET /teams`
- Response: An array of team objects.

```
GET /teams HTTP/1.1
```

### Get a specific team by ID

- Endpoint: `GET /teams/:id`
- Path parameter:
  - `id`: number (required) - The ID of the team to retrieve.
- Response: The requested team object.

```
GET /teams/1 HTTP/1.1
```

### Update a specific team by ID

- Endpoint: `PUT /teams/:id`
- Authentication: Required. Only the team captain can update the team.
- Path parameter:
  - `id`: number (required) - The ID of the team to update.
- Request body:
  - `name`: string (required) - Team's updated name.
- Response: The updated team object.

```
PUT /teams/1 HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Team Name"
}
```

### Delete a specific team by ID

- Endpoint: `DELETE /teams/:id`
- Authentication: Required. Only the team captain can delete the team.
- Path parameter:
  - `id`: number (required) - The ID of the team to delete.
- Response: The deleted team object.

```
DELETE /teams/1 HTTP/1.1
Authorization: Bearer <access_token>
```

Please note that the request validation information is now included in the documentation for each endpoint. Ensure you follow the validation requirements.

# Team Membership Endpoints

## Base URL

All the team membership endpoints are prefixed with `/teams/:teamId/team-memberships`. For example, if your API base URL is `https://api.example.com`, the endpoints will be available at `https://api.example.com/teams/:teamId/team-memberships`.

## Authentication

Some endpoints require authentication. To authenticate, include an `Authorization` header with the value `Bearer <access_token>` in the request.

## Endpoints

### Create a new team membership

- Endpoint: `POST /teams/:teamId/team-memberships`
- Authentication: Required.
- Path parameter:
  - `teamId`: number (required) - The ID of the team to add a member to.
- Request body:
  - `playerId`: number (required) - The ID of the player to add to the team.
  - `isCaptain`: boolean (required) - Whether the player is a team captain.
- Response: The created team membership object.

```
POST /teams/1/team-memberships HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "playerId": 2,
  "isCaptain": false
}
```

### Get all team memberships for a specific team

- Endpoint: `GET /teams/:teamId/team-memberships`
- Authentication: Required.
- Path parameter:
  - `teamId`: number (required) - The ID of the team to retrieve memberships for.
- Response: An array of team membership objects.

```
GET /teams/1/team-memberships HTTP/1.1
Authorization: Bearer <access_token>
```

### Get a specific team membership by ID

- Endpoint: `GET /teams/:teamId/team-memberships/:id`
- Authentication: Required.
- Path parameters:
  - `teamId`: number (required) - The ID of the team to retrieve the membership from.
  - `id`: number (required) - The ID of the team membership to retrieve.
- Response: The requested team membership object.

```
GET /teams/1/team-memberships/1 HTTP/1.1
Authorization: Bearer <access_token>
```

### Update a specific team membership by ID

- Endpoint: `PUT /teams/:teamId/team-memberships/:id`
- Authentication: Required.
- Path parameters:
  - `teamId`: number (required) - The ID of the team to update the membership in.
  - `id`: number (required) - The ID of the team membership to update.
- Request body:
  - `playerId`: number (required) - The updated player ID.
  - `isCaptain`: boolean (required) - The updated captain status.
- Response: The updated team membership object.

```
PUT /teams/1/team-memberships/1 HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "playerId": 2,
  "isCaptain": true
}
```

### Delete a specific team membership by ID

- Endpoint: `DELETE /teams/:teamId/team-memberships/:id`
- Authentication: Required.
- Path parameters:
  - `teamId`: number (required) - The ID of the team to delete the membership from.
  - `id`: number (required) - The ID of the team membership to delete.
- Response: The deleted team membership object.

```
DELETE /teams/1/team-memberships/1 HTTP/1.1
Authorization: Bearer <access_token>
```

Please note that the request validation information is now included in the documentation for each endpoint. Ensure you follow the validation requirements.
