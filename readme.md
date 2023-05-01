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

`POST /players HTTP/1.1
Content-Type: application/json

{
"name": "John Doe",
"email": "john@example.com",
"cellphone": "+1234567890",
"password": "test123"
}`

### Login a player

- Endpoint: `POST /players/login`
- Request body:
  - `email`: string (required) - Player's email address. Must be a valid email format.
  - `password`: string (required) - Player's password.
- Response: The authenticated player object and an access token.

`POST /players/login HTTP/1.1
Content-Type: application/json

{
"email": "john@example.com",
"password": "test123"
}`

### Get all players

- Endpoint: `GET /players`
- Authentication: Required.
- Response: An array of player objects.

`GET /players HTTP/1.1 Authorization: Bearer <access_token>`

### Get a specific player by ID

- Endpoint: `GET /players/:id`
- Authentication: Required.
- Path parameter:
  - `id`: number (required) - The ID of the player to retrieve.
- Response: The requested player object.

`GET /players/1 HTTP/1.1 Authorization: Bearer <access_token>`

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

`PUT /players/1 HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{
"name": "John Doe Updated",
"email": "john_updated@example.com",
"cellphone": "+0987654321"
}`

### Delete a specific player by ID

- Endpoint: `DELETE /players/:id`
- Authentication: Required.
- Path parameter:
  - `id`: number (required) - The ID of the player to delete.
- Response: The deleted player object.

`DELETE /players/1 HTTP/1.1 Authorization: Bearer <access_token>`

Please note that the request validation information is now included in the documentation for each endpoint. Ensure you follow the validation requirements
