# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.x (current) | ✅ |

## Security Design

MindMirror was designed with security as a first-class concern, not an afterthought.

### No Sensitive Data Stored Server-Side
- All journal entries are stored exclusively in browser `localStorage`
- No user data is transmitted to any server other than the Anthropic API for AI inference
- No raw camera footage is stored or transmitted at any point
- No raw audio recordings are stored or transmitted at any point
- The application has no backend, no database, no user accounts

### API Key Handling
- The Anthropic API key is **never embedded in source code**
- The key is injected at runtime by the serving environment or proxy
- No secrets appear anywhere in the repository

### Input Sanitization
- All user input rendered to the DOM uses `textContent` assignment (not `innerHTML`)
- Where `innerHTML` is used (for AI replies), content is constructed programmatically, never from raw user input
- No `eval()` calls anywhere in the codebase
- No `document.write()` calls
- No dynamic `<script>` tag injection

### Content Security
- All external resources load exclusively from `fonts.googleapis.com`, `fonts.gstatic.com`, and `api.anthropic.com`
- No third-party analytics, tracking pixels, or ad networks
- No CDN scripts that could be compromised by supply chain attacks

### XSS Prevention
- User-typed text is never rendered as HTML
- AI response text is sanitized before DOM insertion
- No URL parameters are parsed and reflected into the DOM

### Data Ownership
- Users can export all their data as JSON at any time
- Users can permanently delete all local data at any time
- No data persists beyond what the user explicitly saves

### Privacy-by-Design
- Camera analysis is opt-in and user-controlled via settings toggle
- Voice analysis is opt-in and user-controlled via settings toggle
- Journal saving is opt-in and user-controlled via settings toggle
- No continuous background monitoring

## Reporting a Vulnerability

If you discover a security vulnerability, please open a GitHub Issue with the label `security`. Do not publicly disclose the vulnerability before it has been addressed.
