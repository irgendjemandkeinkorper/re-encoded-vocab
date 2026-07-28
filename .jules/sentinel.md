# Sentinel's Security Journal

## 2026-07-28 - [Stored XSS in Supabase Leaderboard Name rendering]
**Vulnerability:** The leaderboard page displayed player names retrieved from a Supabase database (`row.session_name`) using `.innerHTML` without any form of escaping or sanitization. This allowed any user to submit a name containing arbitrary HTML/JavaScript tags (e.g. `<img src=x onerror=alert(1)>`) and have it executed in other users' browsers when viewing the shared leaderboard.
**Learning:** Since the application is self-contained in a single `index.html` file and interacts directly with Supabase via CDN, security controls (like name length restrictions or alphanumeric validation) on the front-end inputs can be easily bypassed by interacting directly with the database or through DOM manipulation. Consequently, output sanitization is the ultimate line of defense for shared database data.
**Prevention:** Always use safe text insertion APIs like `.textContent` when possible, or run any dynamic content through an HTML entity escaping helper (like a robust `escHtml` function) before inserting it via `.innerHTML`.
