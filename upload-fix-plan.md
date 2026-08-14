# Plan: Remove UploadThing, Add Self-Hosted File Upload

## Context

The e2e test currently mocks the upload at the network layer
(`tests/admin/products.spec.ts:57`), so the backend is never exercised. We will
switch to a **real, self-hosted upload** — the test will genuinely POST an image
and verify the returned `/uploads/...` image renders.

No multer is needed. This is a Next.js App Router project, not Express. Multer
(an Express middleware, `req, res, next`) cannot plug into App Router route
handlers. We use the native `request.formData()` instead.

## Changes

### 1. New upload API route — `app/api/upload/route.ts` (new file)

```ts
// app/api/upload/route.ts
'use server'; // or plain route handler

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(req: NextRequest) {
  // 1. Auth check (reuse pattern from app/api/uploadthing/core.ts:14)
  const session = await auth();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 2. Read multipart form data
  const formData = await req.formData();
  const file = formData.get('file') as File | Blob | null;
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file' }), { status: 400 });
  }

  // 3. Validate type & size
  if (!IMAGE_TYPES.has(file.type)) {
    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: 'Too large' }), { status: 413 });
  }

  // 4. Write bytes to public/uploads/<name>
  const ext = file.type.split('/')[1] || 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(process.cwd(), 'public', 'uploads', filename), buffer);

  // 5. Return same shape the frontend expects
  return new Response(JSON.stringify([{ url: `/uploads/${filename}` }]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- Auth: reuse `auth()` like `app/api/uploadthing/core.ts:14`.
- Validates image type and ≤ 4MB.
- Writes bytes to `public/uploads/`.
- Returns the same `[{ url }]` response shape the frontend uses.

### 2. New frontend component — `components/upload-button.tsx` (new file, client)

Mirrors the current prop contract so `product-form.tsx` barely changes. Props:
`{ onClientUploadComplete, onUploadError }`.

- Renders a `<button type="button">` labeled exactly **"Upload Files"**
  (required by `tests/admin/products.spec.ts:87`).
- Hidden `<input type="file" accept="image/*">`; clicking the button opens the
  chooser (`products.spec.ts:86-89`).
- On file select, POST the `FormData` to `/api/upload`.
- On success call `onClientUploadComplete(res)` where `res = [{ url }]`
  (required by `products.spec.ts:92` to show `img[alt="product image"]`).
- On failure call `onUploadError`.

### 3. Update `app/admin/products/product-form.tsx`

- Replace `import { UploadButton } from '@/lib/uploadthing'` (line 23) with the
  new component.
- Update usage (lines 295-306): drop `endpoint="imageUploader"` (no longer
  needed); keep `onClientUploadComplete` / `onUploadError`.

### 4. Update the e2e test — `tests/admin/products.spec.ts`

- Remove the `page.route('**/api/uploadthing', ...)` mock block (lines 56-63).
- Keep the file chooser flow (lines 86-89) — the new button still opens a
  chooser.
- The `img[alt="product image"]` assertion (line 92) now points to the
  `/uploads/...` URL; keep it visible.
- Remove / repurpose the stale "Mock the uploadthing API" comment (line 56).

### 5. Remove uploadthing everywhere

- Delete `app/api/uploadthing/` (both files) and `lib/uploadthing.ts`.
- `next.config.ts`: remove the `utfs.io` `remotePatterns` entry (lines 6-10).
- `tailwind.config.ts`: drop the `withUt` / `'uploadthing/tw'` import (line 2);
  restore a plain `defineConfig`.
- `package.json`: uninstall `uploadthing` (line 66) and `@uploadthing/react`
  (line 38); prune the lockfile (`npm uninstall uploadthing @uploadthing/react`).

### 6. Local filesystem requirement

- `/home/p/projects/amaxon-demo/public/uploads/` must exist.
- Add `public/uploads/` to `.gitignore` so generated files are not committed.
- The dev/test server runs on port 3001, so `/uploads/...` is served statically
  by Next.

## Verification

- Run `npm run e2e` confirming `tests/admin/products.spec.ts` passes, including
  the real image upload.
- Run lint / typecheck: `npm run lint` and `npm run snoop` (tsc --noEmit) to
  catch missing references after removing uploadthing.

## Notes / Tradeoffs

- Real upload writes files to disk each test run. Cleanup could be added
  (delete the test-created file after) but is not required.
- This drops the uploadthing cloud dependency entirely; uploads never leave the
  server.
- The directive `'use server'` at the top of the new route is not required for a
  route handler — remove it if it causes issues; route handlers are server-side
  by default.

## Open Decisions

- Add `public/uploads/` to `.gitignore`? (recommended: yes)
- Keep `tests/images/test-image.jpg`? (recommended: yes — still needed by the
  real-upload flow).