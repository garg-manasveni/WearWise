# WearWise — Your Personal Wardrobe & Outfit Stylist

WearWise is a student-built MERN application for people who want to organise the clothes they own and make more considered outfit combinations. It keeps styling personal: recommendations use a user's saved wardrobe and preferences, and the optional style profile is never used to decide what someone is allowed to wear.

## Features

- Register, sign in, sign out, restore a saved session, and protect authenticated pages and API routes with JWT authentication.
- Add, view, edit, search, filter, sort, and remove wardrobe items. Photos are uploaded and checked for type, size, and file signature.
- Add a wardrobe item with only its name and photo; category, colours, occasion, season, weather, and style tags are optional manual details. No clothing-photo analysis provider is configured, so WearWise never claims to have classified an image automatically.
- Save a personal style profile with preferred styles, favourite and avoided colours, comfort and fit preferences, and optional self-described height, complexion, and undertone notes.
- Get transparent, rule-based outfit suggestions made only from clothes in the user's wardrobe. Swap a piece, ask for alternatives, and save a suggested look.
- Use Outfit Studio to select wardrobe items and manually layer the actual clothing photos over an illustrated 2D avatar. Drag and resize each photo, choose a default illustrated avatar, or optionally generate a new personalized character from a face photo using OpenAI's Images API. Save a named look with occasion and notes.
- Mark saved looks as worn, retain dated wear history, and optionally exclude combinations worn during a chosen recent-use period when finding outfits.
- View a useful not-found page, loading and empty states, inline request errors, and success feedback.

### Avatar limitation and photo privacy

The Studio overlays selected wardrobe photos on an illustrated character; this is a manually arranged collage, **not realistic virtual try-on**. Photos with opaque backgrounds remain rectangular and may cover parts of the avatar. Optional personalized avatar creation sends a JPEG/PNG/WebP face reference (up to 5 MB) to OpenAI only after explicit consent. Express holds the reference in memory for the request and does not save it; only the generated PNG is kept in private local storage for that user's account. OpenAI states API data is not used to train models by default, while abuse-monitoring logs may retain content for up to 30 days. Image generation incurs usage-based charges; check the current [OpenAI image pricing](https://developers.openai.com/api/docs/pricing) before enabling it. A generated character is a stylized interpretation, not a guaranteed likeness or a realistic body. Users can regenerate it, remove it, or use the default SVG avatar. If no API key is configured, the default avatar and Studio remain usable. This service is separate from wardrobe photos; **no clothing-image analysis or virtual try-on provider is configured**.

## Tech stack and structure

- **Frontend:** React, Vite, JavaScript, React Router, Context API, plain CSS.
- **Backend:** Node.js, Express, JavaScript, REST APIs.
- **Database:** MongoDB with Mongoose.
- **Authentication:** bcrypt password hashing and JWT bearer tokens.
- **Photo storage:** local disk for development, accessed through authenticated owner-checked image routes.

```text
WearWise/
  backend/
    server.js
    src/
      config/          MongoDB connection
      controllers/     request validation and user-scoped operations
      middleware/      JWT authentication and image-upload validation
      models/          User, ClothingItem, StyleProfile, SavedOutfit
      routes/          Express REST endpoints
      services/        recommendation and avatar provider logic with unit tests
  frontend/
    src/
      components/      shared shell, clothing and outfit UI, errors
      constants/       wardrobe, style, colour and occasion options
      context/         authenticated user state
      pages/           dashboard, wardrobe, finder, studio, profile, auth
      services/        shared API client
      styles/          design tokens and page-specific CSS
```

## Requirements

- Node.js 20 or newer and npm.
- MongoDB running locally, or a MongoDB Atlas cluster and database user.

## Setup

### 1. Configure the backend

In PowerShell, from the project root:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend\.env` locally:

| Variable | Purpose |
|---|---|
| `PORT` | API port; defaults to `5000`. |
| `MONGODB_URI` | Local MongoDB URL or Atlas connection string. |
| `JWT_SECRET` | Private, long, randomly generated signing secret. |
| `JWT_EXPIRES_IN` | JWT lifetime; defaults to `1h`. |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS; defaults to `http://localhost:5173`. |
| `CLIENT_ORIGINS` | Optional comma-separated additional frontend origins allowed by CORS. |
| `DNS_SERVERS` | Optional comma-separated DNS server addresses, only if Atlas SRV DNS lookup fails on your network. |
| `UPLOAD_DIR` | Local photo directory; defaults to `uploads` under `backend/`. |
| `OPENAI_API_KEY` | Optional private server-side API key. Enables personalized avatar generation; never put it in frontend variables. |
| `OPENAI_AVATAR_MODEL` | Optional image-generation model override; defaults to `gpt-image-2.5-sunburst`. |

Never commit `.env` or paste real credentials into source code, examples, public issues, or chat. `.env.example` files intentionally contain placeholders only.

Personalized avatar creation is optional. To enable it, create an OpenAI API project with access to the Images API and configure its API key as `OPENAI_API_KEY` in `backend\.env`. API usage is billed separately from a ChatGPT subscription; the per-image cost varies with the selected model and output settings, so check the current [OpenAI image pricing](https://developers.openai.com/api/docs/pricing) before testing. If the key is absent or invalid, use the built-in illustrated avatar instead.

### 2. Install and start the backend

Open Terminal 1:

```powershell
Set-Location "C:\path\to\WearWise\backend"
npm.cmd install
npm.cmd run dev
```

Wait for the MongoDB connection message and the API listening message.

### 3. Install and start the frontend

Open Terminal 2:

```powershell
Set-Location "C:\path\to\WearWise\frontend"
npm.cmd install
npm.cmd run dev
```

Open the Vite URL, normally `http://localhost:5173`. Keep both terminals running. `npm.cmd` is useful in Windows PowerShell when script execution policy blocks `npm`.

The frontend API defaults to `http://localhost:5000/api`; the Vite development server is fixed to `http://localhost:5173` so it matches the backend's default CORS origin. If you change the frontend port or API host, update `CLIENT_ORIGIN` (or add an origin to `CLIENT_ORIGINS`) in `backend\.env`, and set `VITE_API_URL` in `frontend\.env` to the API base URL. Restart both servers after changing environment files.

To confirm the connection, open `http://localhost:5000/api/health` and expect `{"status":"ok"}`. Then open the Vite URL and try signing in; browser requests should be served from the configured API. If the health URL does not respond, start the backend and confirm MongoDB connects first. CORS cannot make a stopped API or unavailable MongoDB start.

## Photo storage and deployment

No Cloudinary or other image-storage integration is configured. During local development, JPEG, PNG, and WebP files up to 5 MB are validated and saved under `backend/uploads/` with generated filenames. MongoDB stores the filename, not a base64 image. Image retrieval requires authentication and checks that the item belongs to the requesting user.

Local disk is not durable or shared across many hosting platforms and multiple server instances. A deployment with an ephemeral filesystem can lose uploaded photos after a restart. Before deploying, configure durable private object storage or Cloudinary, migrate existing uploads, and preserve authenticated owner checks. There are no additional external-service credentials for the current local setup.

## API route summary

All routes below require a bearer JWT except registration and login.

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create account and return a token. |
| `POST` | `/api/auth/login` | Verify password and return a token. |
| `GET` | `/api/auth/me` | Validate token and return current user. |
| `GET` | `/api/wardrobe` | List owned items with search, filters, and sorting. |
| `POST` | `/api/wardrobe` | Create item with multipart image and name (required); metadata fields are optional. |
| `GET` | `/api/wardrobe/:id` | Read one owned item. |
| `GET` | `/api/wardrobe/:id/image` | Retrieve an owned item's photo. |
| `PATCH` | `/api/wardrobe/:id` | Update an owned item; optional replacement photo. |
| `DELETE` | `/api/wardrobe/:id` | Delete an owned item if not referenced by a saved look. |
| `GET` | `/api/style-profile` | Read the signed-in user's profile. |
| `PUT` | `/api/style-profile` | Validate and save profile preferences. |
| `POST` | `/api/outfits/recommend` | Generate suggestions from owned items and profile. Optional `avoidRecentlyWorn`, `recentDays`, and `includeRecentlyWorn` fields control repetition filtering. |
| `GET` | `/api/outfits/saved` | List the signed-in user's saved outfits and wear history. |
| `POST` | `/api/outfits/saved` | Save an outfit's name, occasion, notes, and owned item references. |
| `POST` | `/api/outfits/saved/:id/worn` | Add a validated date to an owned saved outfit's wear history. |
| `DELETE` | `/api/outfits/saved/:id` | Delete an owned saved outfit and its history. |
| `GET` | `/api/avatar` | Return provider availability and the signed-in user's avatar metadata. |
| `GET` | `/api/avatar/image` | Retrieve the signed-in user's generated avatar image. |
| `POST` | `/api/avatar/generate` | Generate an avatar from multipart `image`, `style`, and explicit `consent` fields. |
| `DELETE` | `/api/avatar` | Remove the signed-in user's generated avatar and use the default illustration. |

Avatar generation requires `OPENAI_API_KEY`, an image file and `consent=true`. Supported styles are `polished_2d`, `soft_3d`, and `editorial`. The API key remains on Express; uploads use memory storage and are not written to disk. The generated image and style are saved on the authenticated user's record/private upload directory. All avatar routes require authentication and return only the current user's data. The backend also scopes wardrobe, profile, recommendation, saved-outfit, and image queries to the authenticated user. Saving a look verifies that every referenced clothing item belongs to that user.

## Database model summary

- **User:** name, normalized unique email, bcrypt-hashed password, and optional generated-avatar image key/style/time metadata. The private image key is excluded from normal queries.
- **ClothingItem:** owner ID, name, category, colours, style/occasion/season/weather tags, comfort notes, and private local image key.
- **StyleProfile:** one record per user with preference arrays, fit preference, notes, and optional height/complexion/undertone values.
- **SavedOutfit:** owner ID, name, occasion, optional notes, references to owned clothing items, and a list of dated wear-history entries. Wear history is capped at the latest 100 entries per saved outfit.

Clothing category and colour are optional in storage. Pieces without a category remain visible in the wardrobe but are skipped by the combination builder until the user completes their clothing details. No automatic clothing-photo analysis provider is configured; metadata entry is manual.

## How recommendations work

`backend/src/services/recommendOutfits.js` is plain, testable JavaScript. It does not call an AI or machine-learning service.

1. It builds combinations from a top + bottom + shoes, or a dress + shoes. Outerwear and accessories are optional.
2. It filters combinations containing colours the user explicitly chose to avoid, and honours an optional anchor item.
3. It scores occasion tags, requested and profile styles, requested and favourite colours, mood tags, comfort and weather matches, preferred fit, and simple colour-pair compatibility.
4. It sorts by score and skips combinations too similar to already selected options.
5. Occasion and mood are optional. **Style me today** submits no occasion or mood filters and relies on the saved wardrobe and profile. If no complete combination is possible, it explains what is missing and can return a closest combination made from actual saved items. Items without a category are not guessed into a combination, and the response directs the user to complete their details.
6. If recent-use avoidance is enabled, exact combinations with a saved wear date inside the selected period are omitted. If every complete option is omitted, the response explains why; the user can choose to show those looks anyway.

Preferred styles, favourite colours, comfort choices, and fit tags influence ranking. Avoided colours are treated as an explicit exclusion. Optional height, complexion, and undertone notes are stored but do not constrain recommendations. All colours and styles are available to everyone.

## Tests

From `backend/`, run the rule-based recommendation tests:

```powershell
npm.cmd test
```

The test suite includes mocked avatar-provider request tests; it does not call OpenAI or verify live account billing.

From `frontend/`, create a production build:

```powershell
npm.cmd run build
```

## Manual demonstration checklist

1. Register or sign in. Refresh the browser and confirm the session is restored; sign out and confirm protected pages send you to login. Test a malformed/expired token and confirm it is rejected and the frontend returns to an unauthenticated state.
2. Add at least one wardrobe item with only a name and a photo; confirm it saves and is clearly marked as not classified. Edit it to add a category/colour and confirm the recommendations can use it. Add other wardrobe entries:
   - `Ivory linen shirt` — Tops, Ivory, Casual/Classic tags, College/Casual outing, Spring/Mild, Breathable.
   - `Straight blue jeans` — Bottoms, Blue, Casual/Relaxed, College/Casual outing, Spring/Mild, Stretchy.
   - `White canvas sneakers` — Shoes, White, Casual/Comfortable, College/Casual outing, Spring/Mild, Soft.
   - Optionally add a `Lilac cardigan` as Outerwear and a `Canvas tote` as an Accessory.
3. Edit an item, try search and filters, and confirm a removal. Confirm that a saved outfit prevents deleting one of its pieces.
4. In Style Profile, select preferred styles and colours; watch the preview update. Save, refresh, and confirm the choices persist. Leave optional body/colour-context fields blank if preferred.
5. In Outfit Finder, click **Style me today** without choosing any filters. Confirm recommendations use only classified items in the account's wardrobe and profile. Then request a college outfit, try swapping an item, ask for alternatives, and save a recommendation.
6. In Outfit Studio, select pieces manually and confirm their saved photos appear over the default avatar. Drag and resize each photo using the handles or keyboard-accessible sliders. Without a configured `OPENAI_API_KEY`, confirm that personalized generation is reported as unavailable and that the default avatar still works. To test generation, configure the backend key, select a face photo and illustration style, read and accept the consent notice, then create or regenerate the character. Verify the new illustration replaces the old one only after success, the reference photo is not shown or retained, and **Use a default avatar** removes the generated image. Try another combination, reset items, and save a named look. Transparent garment cutouts produce the cleanest overlay.
7. Mark a saved look as worn with a date. Confirm it appears in the recent history with that date.
8. Back in Outfit Finder, enable recent-use avoidance and choose a period. If all options are recent, confirm the explanation and click **Show recently worn looks anyway**.
9. Sign in as a second account and confirm it cannot see the first account's wardrobe, profile, saved outfits, wardrobe images, or personalized avatar image.
10. Visit an invalid route and confirm the not-found page offers a route back into the app.

## Short demo sequence (3–5 minutes)

1. **Problem and sign-in (30 seconds):** explain that WearWise helps organise owned clothes and plan combinations, then sign in and show the protected app shell.
2. **Wardrobe and privacy (45 seconds):** show a few uploaded items and their tags; briefly explain that the API scopes item queries and photos to the authenticated user.
3. **Style and recommendations (60–90 seconds):** show profile colour/style preview, request a college look, explain its plain-language rationale, change one piece, and save it.
4. **Studio and wear history (60–90 seconds):** manually position actual garment photos over the default avatar, explain that the photo collage is not virtual try-on, and (if configured) show the consent-gated personalized character flow. Save the look with notes and mark it worn with today's date.
5. **Repetition and wrap-up (30–45 seconds):** enable recent-use filtering, explain the fallback when all combinations were worn, and note the rule-based scoring and local photo-storage deployment limitation.

#DEMO VIDEO LINK:- https://drive.google.com/file/d/1egPmZYlvZddfTrkGIe670ALTW0-o_VKQ/view?usp=drivesdk

## Likely viva questions

**Why use React Context for authentication?**

The signed-in user, token, and session status are needed across routes and components. Context provides one shared source without passing those values through every component manually.

**How are passwords and routes protected?**

Passwords are hashed with bcrypt before storage. JWTs are sent as bearer tokens; Express authentication middleware verifies the token, and controllers scope database access by its user ID.

**How do you stop a user saving another user's clothing item in an outfit?**

The save endpoint queries every submitted item ID together with the authenticated user ID and rejects the request unless all IDs are owned by that user.

**Is outfit generation AI?**

No. It constructs valid category combinations, filters explicit exclusions, calculates a weighted score from item/profile/request tags, and selects varied candidates. The logic is isolated in a JavaScript service and covered by tests.

**How does the repeat checker work?**

Worn dates are stored on each user's saved outfit. For the requested time window, the backend compares saved item-ID combinations to recommendation candidates and hides exact recent matches. The user can explicitly view them anyway.

**Is the avatar a virtual fitting room?**

No. The Studio manually layers wardrobe photos over an illustration and does not segment or fit garments to a body. The optional OpenAI Images API feature generates a new stylized character from a face reference, but does not guarantee exact likeness. The reference is sent only after consent, held in memory by WearWise, and not saved by this application; OpenAI's API data policy and retention terms apply.

**What happens to the optional face photo?**

The Express server checks the file and keeps it in memory only while making the consented OpenAI request. It stores only the generated image for the authenticated user. OpenAI states API inputs are not used for training by default, but abuse-monitoring logs can retain content for up to 30 days. This API feature has usage-based charges and is optional.

**What would need to change for deployment?**

Use durable private object storage for photos, configure production MongoDB/JWT/CORS values, use HTTPS and production-grade token storage/security controls, and deploy the frontend and backend with the correct API URL.

## Security and production notes

The development frontend stores a JWT in browser local storage. Production deployment should review the threat model and consider HttpOnly cookies, CSRF protections, rate limiting, secure transport, and durable private photo storage. Rotate any credentials that were ever exposed and never reuse them.

For a course demonstration, local-disk uploads are acceptable if the backend and its upload directory remain available. Before deploying publicly, configure durable private object storage for wardrobe and generated-avatar images, ensure the deployment's filesystem and backup policy are understood, set production MongoDB/JWT/CORS/API URL values outside source control, enable HTTPS, and apply request rate limits and upload quotas. Do not deploy the OpenAI feature unless its API key, account billing limits, privacy notice, consent flow, and permitted use of reference photos have been reviewed. The automated test suite mocks provider calls; it cannot confirm live OpenAI model access, image quality, billing, or deployed storage behavior.
