# RealTime-ChatApp

A real-time chat application built with **Angular** (frontend) and **ASP.NET Core 9** (backend), featuring JWT authentication, user registration with profile image upload, and SQLite storage.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | Angular 21, TypeScript                  |
| Backend  | ASP.NET Core 8             |
| Auth     | ASP.NET Core Identity + JWT Bearer      |
| Database | SQLite (via Entity Framework Core)      |
| Storage  | Local file system (`wwwroot/uploads/`)  |

---

## Project Structure

```
Chat/
├── API/                  # ASP.NET Core backend
│   ├── Endpoints/        # Minimal API endpoint definitions
│   ├── Models/           # Entity models (AppUser, Message, ...)
│   ├── DTOs/             # Data Transfer Objects
│   ├── Services/         # Business logic (TokenService, FileUpload)
│   ├── Data/             # EF Core DbContext
│   ├── Common/           # Shared response wrapper
│   └── Migrations/       # EF Core migrations
└── client/               # Angular frontend
    └── src/
        └── app/          # Components, routes, services
```

---

## Getting Started

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) & npm
- [Angular CLI](https://angular.io/cli): `npm install -g @angular/cli`

---

### Backend

```bash
cd API

# restore packages
dotnet restore

# apply database migrations
dotnet ef database update

# run (with hot reload)
dotnet watch run
```

API runs at: `https://localhost:5001` / `http://localhost:5000`  
OpenAPI docs: `http://localhost:5000/openapi`

---

### Frontend

```bash
cd client

# install dependencies
npm install

# start dev server
npm start
```

App runs at: `http://localhost:4200`

---

## API Endpoints

| Method | Route                        | Description                  | Auth     |
|--------|------------------------------|------------------------------|----------|
| POST   | `/api/account/register`      | Register with profile image  | Public   |
| POST   | `/api/account/login`         | Login, returns JWT token     | Public   |

---

## Environment & Configuration

All configuration lives in `API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=chat.db"
  },
  "JWTSettings": {
    "SecurityKey": "<your-secret-key>"
  }
}
```

> ⚠️ Never commit real secrets. Use `appsettings.Development.json` (already in `.gitignore`) or environment variables for sensitive values.

---

## License

MIT
