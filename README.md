# Campus Market

Campus-focused marketplace app built with Expo Router, TypeScript, NativeWind, Zustand, Supabase, and TanStack Query.

## Stack

- Expo + React Native + TypeScript
- Expo Router
- NativeWind + dark mode
- Zustand state management
- TanStack Query data fetching/caching
- Supabase auth + database + realtime
- React Hook Form + Zod
- FlashList
- Expo Secure Store
- uploadthing-ready upload layer

## Folder Architecture

- `app/` routes (auth, onboarding, tabs, listing detail, chat)
- `src/components/` reusable UI blocks
- `src/config/` runtime environment helpers
- `src/hooks/` routing and behavior hooks
- `src/lib/` sdk clients (Supabase)
- `src/services/` API abstraction layer + upload helpers
- `src/state/` Zustand stores
- `src/types/` domain models
- `supabase/schema.sql` database models + policies

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Add:
   - `EXPO_PUBLIC_SUPABASE_URL` — your project URL (`https://<ref>.supabase.co`), not an API key.
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — the **publishable** key (`sb_publishable_...`) from Supabase Dashboard → API Keys, or the legacy **anon** JWT if you still use that. **Never** put the **secret** key (`sb_secret_...`) in the mobile app or in any `EXPO_PUBLIC_*` variable.
   - `EXPO_PUBLIC_UPLOADTHING_TOKEN` — optional; only if you use Uploadthing from the client.

See [Supabase API keys](https://supabase.com/docs/guides/api/api-keys) for publishable vs secret keys.

## Run Locally

```bash
npm install
npm run start
```

## Supabase Setup

1. Create a Supabase project.
2. Open SQL editor and run `supabase/schema.sql`.
3. Enable Realtime for `messages` and `conversations`.
4. Add auth providers:
   - Email/password
   - Google OAuth

## Core Features Implemented

- Auth flow scaffold: sign-in, sign-up, guest mode
- Onboarding entry point (campus/interests/notifications pathway)
- Main tabs: Home, Search, Sell, Messages, Profile
- Home sections with featured items and category pills
- Real-time-ready chat screen structure
- Listing creation form with image picker + compression
- Listing detail with CTA actions
- Favorites/recent-viewed state scaffolding
- API abstraction via `src/services`

## Uploadthing Integration

The app includes `src/services/uploads.ts` for image pick/compress. Wire uploadthing in that service by:

1. Creating your upload endpoint.
2. Requesting a signed URL from your backend.
3. Uploading compressed files before `createListing`.

## Deployment

### Mobile builds (EAS)

```bash
npx eas build -p android
npx eas build -p ios
```

### Publish OTA updates

```bash
npx expo export
```

## Production Checklist

- Add full Supabase RLS policies per table
- Connect Google sign-in (`expo-auth-session`)
- Add push notifications (`expo-notifications`)
- Add abuse rate-limit on write endpoints
- Add admin dashboard (web app) for moderation and featured listing controls
