# Player Endpoints

## Base URL

All the player endpoints are prefixed with `/players`. For example, if your API base URL is `https://api.example.com`, the endpoints will be available at `https://api.example.com/api/players`.

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

All the team endpoints are prefixed with `/teams`. For example, if your API base URL is `https://api.example.com`, the endpoints will be available at `https://api.example.com/api/teams`.

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

All the team membership endpoints are prefixed with `/teams/:teamId/team-memberships`. For example, if your API base URL is `https://api.example.com`, the endpoints will be available at `https://api.example.com/api/teams/:teamId/team-memberships`.

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

# Game Endpoints

## Base URL

All URLs referenced in this documentation have the following base:

`https://api.example.com/api/`

## Authentication

Some endpoints require authentication. To authenticate, include an `Authorization` header with the value `Bearer <access_token>` in the request.

## Endpoints

### Create Game

- Endpoint: `POST /games`
- Authentication: Required.
- Request body:
  - `location`: string (required) - The location of the game.
  - `opposingTeam`: string (required) - The name of the opposing team.
  - `time`: string (required) - The time of the game. Must be in ISO 8601 format.
  - `notes`: string (optional) - Additional notes for the game.
  - `teamId`: number (required) - The ID of the team hosting the game.

```
POST /games HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "location": "Stadium A",
    "opposingTeam": "Team B",
    "time": "2023-05-10T15:00:00.000Z",
    "notes": "Bring extra water",
    "teamId": 1
}
```

- Success Response:
  - Status: `201 Created`
  - Body: Newly created game object
- Error Responses:
  - Status: `400 Bad Request` - Invalid request format
  - Status: `403 Forbidden` - Only the team captain can create a game
  - Status: `500 Internal Server Error` - An error occurred while creating the game

### Get Game by ID

- Endpoint: `GET /games/:id`
- Authentication: Required.
- Path parameter:
  - `id`: number (required) - The ID of the game to retrieve.- Response: The requested game object.

```
GET /games/1 HTTP/1.1
Authorization: Bearer <access_token>
```

- Success Response:
  - Status: `200 OK`
  - Body: Game object
- Error Responses:
  - Status: `404 Not Found` - Game not found
  - Status: `403 Forbidden` - You are not authorized to view this game
  - Status: `500 Internal Server Error` - An error occurred while fetching the game

### Get All Games

- Endpoint: `GET /games`
- Authentication: Required.

```
GET /games HTTP/1.1
Authorization: Bearer <access_token>
```

- Success Response:
  - Status: `200 OK`
  - Body: Array of game objects
- Error Response:
  - Status: `500 Internal Server Error` - An error occurred while fetching games

### Update Game

- Endpoint: `PUT /games/:id`
- Authentication: Required.
- Path parameter:
  - `id`: number (required) - The ID of the game to update.
- Request body:
  - `location`: string (required) - The updated location of the game.
  - `opposingTeam`: string (required) - The updated name of the opposing team.
  - `time`: string (required) - The updated time of the game. Must be in ISO 8601 format.
  - `notes`: string (optional) - Updated additional notes for the game.
  - `teamId`: number (required) - The ID of the team hosting the game.

```
PUT /games/1 HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "location": "Stadium A Updated",
    "opposingTeam": "Team B Updated",
    "time": "2023-05-10T17:00:00.000Z",
    "notes": "Bring extra water and snacks",
    "teamId": 1
}
```

- Success Response:
  - Status: `200 OK`
  - Body: Updated game object
- Error Responses:
  - Status: `400 Bad Request` - Invalid request format
  - Status: `403 Forbidden` - Only the team captain can update a game
  - Status: `404 Not Found` - Game not found
  - Status: `500 Internal Server Error` - An error occurred while updating the game

### Delete Game

- Endpoint: `DELETE /games/:id`
- Authentication: Required.
- Path parameter:
- `id`: number (required) - The ID of the game to delete.- Response: The deleted game object.

```
DELETE /games/1 HTTP/1.1
Authorization: Bearer <access_token>
```

- Success Response:
  - Status: `200 OK`
  - Body: Deleted game object
- Error Responses:
  - Status: `403 Forbidden` - Only the team captain can delete a game
  - Status: `404 Not Found` - Game not found
  - Status: `500 Internal Server Error` - An error occurred while deleting the game

# Attendance Endpoints

## Base URL

All URLs referenced in this documentation have the following base:

`https://api.example.com/api/`

## Authentication

Some endpoints require authentication. To authenticate, include an `Authorization` header with the value `Bearer <access_token>` in the request.

## Endpoints

### Create Attendance

- Endpoint: `POST /attendance`
- Authentication: Required.
- Request body:
  - `gameId`: number (required) - The ID of the game for which attendance is being recorded.
  - `playerId`: number (required) - The ID of the player whose attendance is being recorded.
  - `status`: string (required) - The attendance status (e.g., "confirmed", "declined").

```
POST /attendance HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "gameId": 1,
  "playerId": 2,
  "status": "confirmed"
}
```

- Success Response:
  - Status: `201 Created`
  - Body: Created attendance object
- Error Responses:
  - Status: `400 Bad Request` - Invalid request format
  - Status: `403 Forbidden` - You must be a member of the team associated with the game to create an attendance
  - Status: `404 Not Found` - Game not found
  - Status: `500 Internal Server Error` - An error occurred while creating the attendance

### Get All Attendances

- Endpoint: `GET /attendance`
- Authentication: Required.

```
GET /attendance HTTP/1.1
Authorization: Bearer <access_token>
```

- Success Response:
  - Status: `200 OK`
  - Body: Array of attendance objects
- Error Responses:
  - Status: `500 Internal Server Error` - An error occurred while fetching attendance records

### Get Attendance By Id

- Endpoint: `GET /attendance/:id`
- Authentication: Required.
- Path parameter:
  - `id`: number (required) - The ID of the attendance record to fetch.

```
GET /attendance/1 HTTP/1.1
Authorization: Bearer <access_token>
```

- Success Response:
  - Status: `200 OK`
  - Body: Attendance object
- Error Responses:
  - Status: `404 Not Found` - Attendance record not found
  - Status: `500 Internal Server Error` - An error occurred while fetching the attendance record

### Update Attendance

- Endpoint: `PUT /attendance/:id`
- Authentication: Required.
- Path parameter:
  - `id`: number (required) - The ID of the attendance record to update.
- Request body:
  - `gameId`: number (required) - The updated ID of the game for which attendance is being recorded.
  - `playerId`: number (required) - The updated ID of the player whose attendance is being recorded.
  - `status`: string (required) - The updated attendance status (e.g., "confirmed", "declined").

```
PUT /attendance/1 HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "gameId": 1,
  "playerId": 2,
  "status": "declined"
}
```

- Success Response:
  - Status: `200 OK`
  - Body: Updated attendance object
- Error Responses:
  - Status: `400 Bad Request` - Invalid request format
  - Status: `403 Forbidden` - You must be a member of the team associated with the game to update an attendance
  - Status: `404 Not Found` - Attendance record not found
  - Status: `404 Not Found` - Game not found
  - Status: `500 Internal Server Error` - An error occurred while updating the attendance record

### Delete Attendance

- Endpoint: `DELETE /attendance/:id`
- Authentication: Required.
- Path parameter:
  - `id`: number (required) - The ID of the attendance record to delete.

```
DELETE /attendance/1 HTTP/1.1
Authorization: Bearer <access_token>
```

- Success Response:
  - Status: `200 OK`
  - Body: Deleted attendance object
- Error Responses:
  - Status: `403 Forbidden` - You must be a member of the team associated with the game to delete an attendance
  - Status: `404 Not Found` - Attendance record not found
  - Status: `404 Not Found` - Game not found
  - Status: `500 Internal Server Error` - An error occurred while deleting the attendance record
