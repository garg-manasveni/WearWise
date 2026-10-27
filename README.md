# WearWise

WearWise is a MERN wardrobe and outfit-styling project. Day 1 authentication
remains in place. Day 2 adds an owner-scoped digital wardrobe, a personal style
profile, rule-based outfit suggestions, and saved looks. Outfit Studio / avatar
editing is intentionally still a placeholder.

## Requirements

- Node.js 20 or newer and npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Environment setup

From the project root, copy the safe template for the backend:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend\.env` and set:

- `MONGODB_URI`: local MongoDB URL or your MongoDB Atlas connection string
- `JWT_SECRET`: a private random secret, never commit it
- `PORT`: API port; defaults to `5000`
- `JWT_EXPIRES_IN`: token lifetime; defaults to `1h`
- `CLIENT_ORIGIN`: frontend origin; defaults to `http://localhost:5173`
- `DNS_SERVERS`: optional comma-separated DNS resolvers; only needed if Node's
  default SRV lookup cannot resolve Atlas
- `UPLOAD_DIR`: local photo directory; defaults to `uploads` under `backend/`

The root `.env.example` contains the same safe development placeholders. Never
commit `.env`; `.gitignore` excludes environment files and uploaded photos.

The frontend API defaults to `http://localhost:5000/api`. If your backend URL
differs, copy `frontend/.env.example` to `frontend/.env` and set
`VITE_API_URL=http://your-api-host:port/api`.

## Photo storage

No Cloudinary credentials are configured, so clothing photos use local disk
storage during development. Uploads accept JPEG, PNG, and WebP files up to 5 MB.
The backend validates the file signature, stores a random filename in
`backend/uploads/`, and serves the photo through an authenticated endpoint that
checks wardrobe ownership. Photos are not stored as base64 in MongoDB.

Local disk is suitable for development, but is not durable or shared across
instances on many cloud hosts. Deployments with ephemeral filesystems can lose
uploads on restart, and multiple API instances will not share them. Before
deploying, configure durable private object storage or Cloudinary, migrate
existing files, and preserve the same authenticated ownership check. No paid
image service is integrated by this milestone.

## Install and run

In **Terminal 1**, from the backend folder:

```powershell
Set-Location "C:\path\to\WearWise\backend"
npm.cmd install
npm.cmd run dev
```

In **Terminal 2**, from the frontend folder:

```powershell
Set-Location "C:\path\to\WearWise\frontend"
npm.cmd install
npm.cmd run dev
```

Open the Vite URL printed in Terminal 2, normally `http://localhost:5173`.
Keep both terminals running. On PowerShell, `npm.cmd` avoids the script-policy
issue that can prevent `npm` from running.

## What is implemented

- **My Wardrobe**: add, view, edit, and remove clothing items with a photo,
  category, primary/secondary colours, style tags, suitable occasions,
  seasons, weather suitability, and comfort notes. Includes server-side
  search, category/colour filters, sorting, photo preview, and delete
  confirmation.
- **My Style Profile**: stores preferred styles, favourite and avoided colours,
  comfort choices, fit, styling notes, and optional height/complexion/undertone
  preferences per user. Optional complexion notes are self-described only;
  they are not inferred from photos and never restrict colours or styles.
- **Outfit Finder**: requests an occasion, mood, style, colour, weather/season,
  comfort choice, and optional anchor item. It returns only items saved by the
  signed-in user, explains suggestions, supports piece swaps and alternatives,
  and offers closest available pieces when a complete outfit is not possible.
- **Saved outfits**: saves a name, occasion, and references to owned wardrobe
  items. An item referenced by a saved outfit cannot be deleted until that
  saved outfit is removed.

## Recommendation logic (for your viva)

`backend/src/services/recommendOutfits.js` is plain JavaScript with no AI or
external styling service. It builds complete combinations from either
top + bottom + shoes, or one-piece + shoes. Outerwear and accessories are
optional. It first removes pieces with colours the user explicitly avoids and
honours an anchor item if one was selected.

Remaining combinations receive a readable weighted score: occasion tags (+5),
requested style (+4), requested/favourite colours (+4/+3), mood tags (+3),
comfort and weather matches (+2 each), preferred style/fit (+2/+1), and simple
colour compatibility (+0 to +2 for each pair). Results are sorted by score;
near-duplicate combinations sharing almost all of the same pieces are skipped.
If there is no complete combination, the service returns real owned pieces
with missing categories called out. It never fabricates a garment.

Run the recommender unit tests from `backend/`:

```powershell
npm.cmd test
```

## API routes

All wardrobe, profile, photo, outfit recommendation, and saved outfit routes
require `Authorization: Bearer <JWT>`.

- `POST /api/wardrobe` — multipart form fields plus `image`
- `GET /api/wardrobe?search=&category=&color=&sort=`
- `GET /api/wardrobe/:id`
- `GET /api/wardrobe/:id/image`
- `PATCH /api/wardrobe/:id` — multipart fields; photo is optional
- `DELETE /api/wardrobe/:id`
- `GET /api/style-profile`
- `PUT /api/style-profile`
- `POST /api/outfits/recommend`
- `GET /api/outfits/saved`
- `POST /api/outfits/saved`
- `DELETE /api/outfits/saved/:id`

Every database query is scoped by the authenticated user ID. Image retrieval
also verifies ownership before sending a photo.

## Manual testing

1. Register or sign in, then open **My Wardrobe**.
2. Add three photos you own (JPEG/PNG/WebP under 5 MB):
   - `Ivory linen shirt` — Tops, Ivory, tags `casual, classic`, occasions
     `college, casual outing`, season `spring`, weather `mild`, notes `breathable`.
   - `Straight blue jeans` — Bottoms, Blue, tags `casual, relaxed`, occasions
     `college, casual outing`, season `spring`, weather `mild`, notes `stretchy`.
   - `White canvas sneakers` — Shoes, White, tags `casual, comfortable`, occasions
     `college, casual outing`, season `spring`, weather `mild`, notes `soft`.
3. Use search, category and colour filters; edit a piece and try removing it.
   The delete action asks for confirmation.
4. In **My Style Profile**, choose Casual, add a favourite colour and a comfort
   preference, optionally choose an avoided colour, and save. Leave the optional
   height and complexion fields blank if you do not want them.
5. In **Outfit Finder**, choose college, comfortable, Casual, and mild weather.
   Expect combinations made from the saved pieces above. The page explains
   matching preferences; it does not call an AI service.
6. Swap a shoe or shirt in a suggestion, ask for alternatives around that
   changed piece, and save one look. It appears under **My saved outfits**.
7. Remove the saved outfit, then remove a wardrobe piece. While the outfit is
   still saved, deleting one of its pieces is rejected.
8. Sign out and sign in with a second account. That account should see its own
   empty wardrobe/profile/saved looks. A second account cannot read, change,
   delete, or fetch the first account's wardrobe item or photo.
9. Refresh while signed in. If the JWT expires, the API responds `401`; the
   frontend clears the session and requires login again.

## Project map

- `frontend/src/App.jsx`: protected React Router page routes.
- `frontend/src/context/AuthContext.jsx`: login state and safe 401 handling.
- `frontend/src/services/api.js`: shared JSON, multipart, and authenticated
  image requests.
- `frontend/src/pages/`: dashboard, wardrobe, style profile, and outfit finder.
- `frontend/src/styles/`: shared tokens plus page-specific styling.
- `backend/src/models/`: clothing items, user style profile, saved outfit refs.
- `backend/src/controllers/`: validated, user-scoped API operations.
- `backend/src/middleware/imageUpload.js`: upload size/type/signature checks.
- `backend/src/services/recommendOutfits.js`: isolated rule-based logic and tests.

For this learning project the JWT is held in browser local storage. For a
production system, review the threat model and consider secure HttpOnly cookies,
CSRF protections, rate limiting, and durable private photo storage.
