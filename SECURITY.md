# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Active support  |
| < 1.0   | ❌ No support      |

## Reporting a Vulnerability

We take security seriously at SiteIntel™. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Email security concerns to: **security@siteintel.dev**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Initial Response | Within 48 hours |
| Triage & Assessment | Within 1 week |
| Fix Development | Depends on severity |
| Public Disclosure | After fix is deployed |

## Security Measures

### Authentication & Authorization

- **Supabase Auth**: All user authentication handled by Supabase
- **JWT Verification**: Edge functions verify JWT tokens for authenticated routes
- **Row-Level Security (RLS)**: Database-level access control on all tables

### Data Protection

- **Encryption in Transit**: All data transmitted over HTTPS/TLS
- **Encryption at Rest**: Database encryption provided by Supabase
- **API Key Security**: Secrets stored in Supabase environment variables
- **Input Validation**: All user inputs validated and sanitized

### API Security

```typescript
// All authenticated edge functions validate JWT
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: corsHeaders,
  });
}

const token = authHeader.replace("Bearer ", "");
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return new Response(JSON.stringify({ error: "Invalid token" }), {
    status: 401,
    headers: corsHeaders,
  });
}
```

### Input Validation

All public-facing APIs implement:

- **Format Validation**: Check input formats (email, UUID, coordinates)
- **Length Limits**: Enforce maximum input lengths
- **SQL Injection Prevention**: Use parameterized queries via Supabase client
- **XSS Prevention**: Sanitize outputs, detect suspicious patterns

### RLS Policies

All database tables have Row-Level Security enabled:

```sql
-- Example: Users can only access their own applications
CREATE POLICY "Users can view own applications"
ON applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
ON applications FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Security Best Practices for Contributors

### DO

- ✅ Use Supabase client methods (never raw SQL in edge functions)
- ✅ Validate all user inputs
- ✅ Use parameterized queries
- ✅ Store secrets in environment variables
- ✅ Implement proper error handling (don't leak stack traces)
- ✅ Use HTTPS for all external API calls

### DO NOT

- ❌ Execute raw SQL in edge functions
- ❌ Expose sensitive data in error messages
- ❌ Store secrets in code or version control
- ❌ Trust client-side data without validation
- ❌ Disable RLS policies
- ❌ Log sensitive information (passwords, tokens, PII)

## Third-Party Dependencies

- Dependencies are regularly audited for vulnerabilities
- Dependabot alerts are enabled
- Critical vulnerabilities are patched within 48 hours

## Compliance

SiteIntel™ is designed with compliance in mind:

- **Data Privacy**: User data access controlled via RLS
- **Audit Logging**: API calls logged with timestamps
- **Data Retention**: Configurable data retention policies
- **Access Control**: Role-based access for admin functions

## Security Checklist for Releases

- [ ] All edge functions validate JWT (where required)
- [ ] All inputs are validated and sanitized
- [ ] No secrets in codebase
- [ ] RLS policies are enabled on all tables
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up-to-date
- [ ] Security tests pass

## Contact

- **Security Issues**: security@siteintel.dev
- **General Support**: support@siteintel.dev

---

Last Updated: 2025-01-26
