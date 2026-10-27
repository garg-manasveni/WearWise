# WearWise

WearWise is a MERN wardrobe and outfit-styling project. This first milestone
contains a responsive fashion-editorial frontend, placeholder feature pages,
and working registration/login with protected routes. Wardrobe uploads,
recommendations, and the outfit studio are intentionally not implemented yet.

## Requirements

- Node.js 20 or newer and npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Configure the backend

In **Terminal 1**, from the workspace root:

```powershell
Copy-Item .env.example backend\.env
```

Edit `backend\.env` and set:

- `MONGODB_URI`: local MongoDB URL or your Atlas connection string
- `JWT_SECRET`: a long, private random value (never commit it)
- `PORT`: backend port; defaults to `5000`
- `JWT_EXPIRES_IN`: token lifetime; defaults to `1h`
- `CLIENT_ORIGIN`: frontend origin; defaults to `http://localhost:5173`
- `DNS_SERVERS`: optional comma-separated DNS resolvers. Only set this if the
  default Node.js DNS lookup cannot resolve Atlas; use resolvers approved for
  your network.

For a local database, start MongoDB before starting the API. The API exits with
an explicit error if the database URI or JWT secret is missing.

The frontend uses `VITE_API_URL` from `frontend/.env.example` to locate the API.
Its default is `http://localhost:5000/api`, so you only need to set it if your
backend is running at a different address.

If Atlas SRV lookups fail in Node.js with `querySrv ECONNREFUSED` but work in
Windows DNS tools, add a resolver list to `backend/.env`, for example
`DNS_SERVERS=8.8.8.8,8.8.4.4` (if permitted on your network), then restart the
backend. Leaving `DNS_SERVERS` blank uses the system default.

## Install dependencies

In **Terminal 1**, from the workspace root:

```powershell
Set-Location backend
npm.cmd install
```

In **Terminal 2**, from the workspace root:

```powershell
Set-Location frontend
npm.cmd install
```

## Run the apps

In **Terminal 1**, from `backend/`:

```powershell
npm.cmd run dev
```

In **Terminal 2**, from `frontend/`:

```powershell
npm.cmd run dev
```

Open the Vite URL printed in Terminal 2 (normally `http://localhost:5173`).

## Try authentication

1. Open `/register`, enter a name, valid email, and password of at least 8
   characters. A successful registration creates a MongoDB user with a bcrypt
   password hash and signs you in.
2. Use **Sign out** in the desktop sidebar (or mobile header), then sign in at
   `/login`.
3. Visit `/dashboard` while signed out. The protected frontend route sends you
   to sign in. The same protection is enforced by `GET /api/auth/me`.
4. Refresh while signed in. The frontend restores the saved bearer token and
   validates it against `/api/auth/me`; a missing or expired token is cleared
   and protected pages require signing in again. Tokens expire after one hour
   by default and are not silently refreshed.

The API listens on `http://localhost:5000`. Authentication endpoints:

- `POST /api/auth/register` with `{ "name", "email", "password" }`
- `POST /api/auth/login` with `{ "email", "password" }`
- `GET /api/auth/me` with `Authorization: Bearer YOUR_JWT`

## Project map

### Frontend

- `frontend/src/App.jsx`: route definitions, including public auth and protected
  app routes.
- `frontend/src/context/AuthContext.jsx`: restores, stores, and clears the
  current login session.
- `frontend/src/services/api.js`: one place for API requests and error parsing.
- `frontend/src/components/AppShell.jsx`: responsive sidebar, mobile navigation,
  and page header.
- `frontend/src/pages/`: dashboard, auth forms, and clearly marked placeholders.
- `frontend/src/styles/`: shared design tokens, global rules, and component/page
  styles.

### Backend

- `backend/server.js`: environment checks, MongoDB connection, and server start.
- `backend/src/models/User.js`: user document and password hashing.
- `backend/src/controllers/authController.js`: registration, login, and profile
  handlers.
- `backend/src/middleware/authenticate.js`: JWT validation for protected APIs.
- `backend/src/routes/authRoutes.js`: REST endpoint definitions.

The browser stores the JWT in local storage for this learning project. In a
production system, review the threat model and consider secure, HttpOnly
cookies and additional protections.
