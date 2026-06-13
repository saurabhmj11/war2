# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.2.x   | ✅        |

## Security Architecture

MindMirror is designed with security and privacy as first-class concerns:

### Data Handling
- **Camera**: All facial analysis runs **on-device** via face-api.js (WebAssembly in the browser). Raw video frames are **never transmitted** to any server.
- **Microphone**: Audio is processed locally via the Web Audio API. Only extracted numeric features (RMS energy, spectral centroid) are used — audio buffers are never stored.
- **Journal entries**: Stored in `localStorage` only. Never sent to a third-party service.

### Input Validation
- All API inputs are validated server-side (array checks, role/content type validation, max length enforcement).
- Enum values for `faceSignal` and `voiceTone` are validated against an explicit allowlist to prevent prompt injection.

### Output Rendering
- All AI-generated HTML is passed through `sanitizeHtml()` which escapes all HTML entities before re-applying only safe formatting tags (`<strong>`, `<br>`). This prevents XSS from LLM output.

### HTTP Security Headers
- `Content-Security-Policy`: Restricts script/style/media sources.
- `X-Frame-Options: DENY`: Prevents clickjacking.
- `X-Content-Type-Options: nosniff`: Prevents MIME sniffing.
- `Strict-Transport-Security`: Enforces HTTPS.
- `Permissions-Policy`: Limits camera/microphone access to same-origin only.

## Reporting a Vulnerability

If you discover a security vulnerability, please open a GitHub Issue marked **[SECURITY]**.

Do **not** include sensitive exploit details in public issues. We aim to respond within 48 hours.
