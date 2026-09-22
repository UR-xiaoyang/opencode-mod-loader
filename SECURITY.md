# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| < 0.3   | :x:                |

## Security Model

### Trust Boundaries

The OpenCode MOD Loader operates with these trust boundaries:

```
┌─────────────────────────────────────┐
│ OpenCode Desktop (Host)             │
│ ┌─────────────────────────────────┐ │
│ │ MOD Loader (Trusted)            │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ MOD Windows (Sandboxed)     │ │ │
│ │ │ - CSP restricted            │ │ │
│ │ │ - No Node.js access         │ │ │
│ │ │ - Limited API surface       │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Host Scripts (Untrusted!)   │ │ │
│ │ │ - Full DOM access           │ │ │
│ │ │ - IPC access                │ │ │
│ │ │ - Requires ui.host perm     │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Server Plugins (Untrusted!) │ │ │
│ │ │ - File system access        │ │ │
│ │ │ - Network access            │ │ │
│ │ │ - Requires server.host perm │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Security Assumptions

**What the MOD Loader protects against:**
- ✅ Sandboxed MOD windows cannot access Node.js APIs
- ✅ Path traversal attacks are prevented in MOD file loading
- ✅ CSP prevents loading remote scripts in MOD windows
- ✅ Permission system prevents unauthorized API access
- ✅ Diagnostic listener requires token authentication

**What the MOD Loader does NOT protect against:**
- ❌ Malicious code in `ui.host` scripts (trusted host access)
- ❌ Malicious code in `server.host` plugins (trusted server access)
- ❌ Social engineering to convince users to install malicious MODs
- ❌ Bugs in OpenCode Desktop itself
- ❌ Compromised npm dependencies in MOD development tools

### High-Risk Permissions

These permissions grant extensive access and should only be used by trusted MODs:

- **`ui.host`**: Full renderer access (DOM, IPC, browser APIs)
- **`server.host`**: Full sidecar access (filesystem, network, database)
- **`server.database`**: Direct production database access

## Reporting a Vulnerability

### What to Report

Please report vulnerabilities including:
- Path traversal bypasses in MOD loading
- CSP bypasses in MOD windows
- Permission check bypasses
- Authentication bypasses in debug listener
- Remote code execution vectors
- Privilege escalation from sandboxed to trusted context
- Information disclosure vulnerabilities

### What NOT to Report

The following are **expected behavior** and not vulnerabilities:
- MODs with `ui.host` can access the host DOM (this is by design)
- MODs with `server.host` can access the filesystem (this is by design)
- Users can install any local MOD (this is user choice)
- Diagnostic listener is localhost-only (not externally accessible)

### How to Report

**DO NOT open a public GitHub issue for security vulnerabilities.**

Instead:

1. **Email**: Send details to the maintainers via GitHub private vulnerability reporting
2. **Include**:
   - Description of the vulnerability
   - Impact assessment (what an attacker could do)
   - Steps to reproduce
   - Proof-of-concept code (if applicable)
   - Suggested fix (if you have one)
3. **Wait**: Allow up to 90 days for patch development before public disclosure

### Response Timeline

- **Initial response**: Within 48 hours
- **Severity assessment**: Within 1 week
- **Patch development**: 
  - Critical: 48-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next regular release
- **Public disclosure**: Coordinated with reporter

## Security Advisories

We will publish security advisories via:
- GitHub Security Advisories
- Release notes
- README update

Critical vulnerabilities will trigger immediate out-of-band releases.

## Best Practices for MOD Developers

### Input Validation

```typescript
// ❌ BAD: No validation
await mod.storage.set(userKey, userData)

// ✅ GOOD: Validate inputs
if (typeof userKey !== 'string' || userKey.length > 100) {
  throw new Error('Invalid key')
}
if (typeof userData !== 'string' || userData.length > 1024 * 100) {
  throw new Error('Data too large')
}
await mod.storage.set(userKey, userData)
```

### Sanitize Output

```typescript
// ❌ BAD: Unsanitized HTML
document.body.innerHTML = userContent

// ✅ GOOD: Use textContent or sanitize
document.body.textContent = userContent
// OR
const sanitized = DOMPurify.sanitize(userContent)
document.body.innerHTML = sanitized
```

### Network Requests

```typescript
// ❌ BAD: HTTP without validation
fetch(`http://api.example.com?id=${userId}`)

// ✅ GOOD: HTTPS with validation
if (!/^[a-zA-Z0-9-]+$/.test(userId)) {
  throw new Error('Invalid user ID')
}
fetch(`https://api.example.com?id=${encodeURIComponent(userId)}`)
```

### Secrets Management

```typescript
// ❌ BAD: Hardcoded secrets
const API_KEY = 'sk_live_abc123'

// ✅ GOOD: User-provided secrets
const apiKey = await mod.storage.get('api_key')
if (!apiKey) {
  throw new Error('Please configure your API key in settings')
}
```

### Error Messages

```typescript
// ❌ BAD: Leaks internal paths
catch (error) {
  alert(`Error loading ${error.stack}`)
}

// ✅ GOOD: Safe error messages
catch (error) {
  console.error('Load error:', error)
  alert('Failed to load data. Check console for details.')
}
```

## Dependency Security

### For MOD Loader Development

Dependencies are managed through:
- Bun's built-in lockfile
- Regular dependabot updates
- Manual review of dependency changes
- Minimal dependency policy (prefer standard library)

### For MOD Developers

MODs cannot use npm dependencies directly. To include libraries:

1. **Vendor the code**: Copy into MOD folder
2. **Check license**: Ensure compatible with your MOD license
3. **Audit code**: Review for security issues
4. **Keep updated**: Monitor for security patches

## Known Limitations

### Intentional Limitations

1. **No MOD signing**: MODs are not cryptographically signed
   - Mitigation: Users must trust MOD sources
   - Future: May add optional signing

2. **No sandboxed filesystem access**: MODs cannot read workspace files
   - Mitigation: Prevents data theft
   - Limitation: Reduces MOD capabilities

3. **Manual MOD installation**: No automatic updates
   - Mitigation: Reduces supply chain attack surface
   - Limitation: Users must manually update

### Technical Debt

1. **Diagnostic listener token never expires**
   - Risk: Low (localhost-only, session-scoped)
   - Planned fix: Add expiration in v0.4

2. **No rate limiting on MOD APIs**
   - Risk: Medium (DoS possible)
   - Planned fix: Add per-MOD rate limits in v0.4

3. **Error messages may leak paths**
   - Risk: Low (information disclosure only)
   - Planned fix: Sanitize error messages in v0.4

## Disclosure Policy

### Coordinated Disclosure

We follow coordinated disclosure:
1. Reporter notifies maintainers privately
2. Maintainers confirm and assess severity
3. Patch is developed and tested
4. Advisory is prepared
5. Patch is released
6. Advisory is published
7. Reporter is credited (unless they prefer anonymity)

### Public Disclosure Timeline

- **90 days**: Standard disclosure timeline
- **Sooner**: If patch is ready and tested
- **Extended**: If fix requires major refactoring (negotiated with reporter)

### Reporter Recognition

Security researchers who responsibly report vulnerabilities will be:
- Credited in the security advisory (with permission)
- Mentioned in release notes
- Listed in a Security Hall of Fame (coming soon)

## Security Hall of Fame

(To be populated as security reports are received)

## Contact

For security concerns, use GitHub's private vulnerability reporting feature or contact maintainers directly.

---

**Last Updated**: 2025-01-14  
**Policy Version**: 1.0.0
