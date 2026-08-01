# PWA Foundation: Service Worker & Web App Manifest

This document outlines the design, implementation, and future integration steps for the **Re-Encoded Vocabulary** Progressive Web App (PWA) assets.

The goal of this phase is to build and deliver standard-compliant, self-contained assets for offline support and installability *without* modifying `index.html` directly, keeping this task completely decoupled from other parallel works.

---

## 1. Implemented Assets

The following files have been created at the root and under `assets/`:

- **`manifest.webmanifest`**: Standards-compliant web app manifest containing the name, short name, start URL (`/re-encoded-vocab/`), standalone display mode, brand-matching theme/background colors (`#1b3a2f` and `#f2ede2`), and icons declared with appropriate sizing and purposes (`any` vs. `maskable`).
- **`sw.js`**: A custom, lightweight vanilla service worker with:
  - Cache versioning (`re-encoded-cache-v1`).
  - Cache-first strategy for caching and serving the application shell resources.
  - An offline fallback mechanism routing navigation requests to the cached `/re-encoded-vocab/index.html`.
  - Network-first/network-only rules bypassing external mutable cross-origin resources (such as Supabase database/auth requests and external CDNs), ensuring sensitive or dynamic data remains uncached and optional failed cross-origin requests do not break local navigation.
- **`assets/icons/icon-192.png`** (192x192): Standard app icon.
- **`assets/icons/icon-512.png`** (512x512): Standard app icon for high-DPI displays and splash screens.
- **`assets/icons/maskable-512.png`** (512x512): Maskable icon designed specifically to fit all critical brand graphics within the central 60% safe zone (inner 307x307 circle), preventing visual clipping when shaped by various platform launchers (e.g. circles, squircles, teardrops).

---

## 2. Integration Snippets (For Next Phase)

To fully activate the PWA, the following two small modifications must be made to `index.html` during the integration coordination phase.

### A. Manifest Linkage
Add the following line inside the `<head>` tag of `index.html`:

```html
<link rel="manifest" href="/re-encoded-vocab/manifest.webmanifest">
```

### B. Service Worker Registration
Add the following registration script at the end of the `<body>` tag, or inside an existing `<script>` block in `index.html`:

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/re-encoded-vocab/sw.js', { scope: '/re-encoded-vocab/' })
      .then((registration) => {
        console.log('ServiceWorker registered successfully with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('ServiceWorker registration failed:', error);
      });
  });
}
```

---

## 3. Testing and Verification Steps

Since the files are written to work under the GitHub Pages subpath `/re-encoded-vocab/`, we must simulate this subdirectory structure locally to test correctly.

### Local Test Environment Setup
To replicate the production environment locally:

1. Create a symlink or subdirectory named `re-encoded-vocab` inside the repository root:
   ```bash
   ln -s . re-encoded-vocab
   ```
2. Start Python's built-in HTTP server:
   ```bash
   python3 -m http.server 3000
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000/re-encoded-vocab/
   ```

### Verifying Manifest & Service Worker
- Open **Chrome DevTools** (or equivalent) and navigate to the **Application** tab.
- Click **Manifest** in the left sidebar to confirm that the browser reads `manifest.webmanifest` correctly, detects the identity, standalone orientation, theme colors, and lists all icons without errors.
- Click **Service Workers** to confirm registration, activation, and status.
- Under **Cache Storage**, verify that the `re-encoded-cache-v1` cache exists and contains:
  - `/re-encoded-vocab/`
  - `/re-encoded-vocab/index.html`
  - `/re-encoded-vocab/manifest.webmanifest`
  - `/re-encoded-vocab/assets/icons/icon-192.png`
  - `/re-encoded-vocab/assets/icons/icon-512.png`
  - `/re-encoded-vocab/assets/icons/maskable-512.png`

---

## 4. Offline Expectations

- **App Shell Availability**: When completely offline (e.g., Airplane Mode), the local application shell (Glossary Mode, Study Mode, Code Lab, theme settings) will load instantly and remain fully functional.
- **Graceful Leaderboard Degradation**: The Supabase client in `index.html` gracefully catches initialization and connection failures. Offline users can still take quizzes, but the final submission to the global leaderboard will fail gracefully without freezing or crashing the quiz summary UI. Same-origin assets continue to serve normally.

---

## 5. Cache-Invalidation & Update Strategy

To update the application shell (e.g. when content in `index.html` is updated or new static assets are introduced):

1. **Increment the Cache Version**: In `sw.js`, change the version string:
   ```javascript
   const CACHE_NAME = 're-encoded-cache-v2'; // Increment from v1 to v2
   ```
2. **Old Cache Deletion**: On activation, the service worker automatically iterates over all existing caches under the origin and deletes any cache names that do not match the current `CACHE_NAME`:
   ```javascript
   if (cache !== CACHE_NAME) {
     console.log('[Service Worker] Removing old cache:', cache);
     return caches.delete(cache);
   }
   ```
3. **Immediate Client Control**: Calling `self.skipWaiting()` in the `install` handler forces the newly activated service worker to take control of clients immediately, while `self.clients.claim()` in the `activate` handler ensures open tabs start using the new service worker without requiring a manual page refresh.
