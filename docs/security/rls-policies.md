# Row-Level Security Policies

Documentation for database security policies in SiteIntel™.

## Overview

Row-Level Security (RLS) is enabled on all tables to ensure users can only access their own data. This document outlines the security policies implemented.

## RLS Principles

1. **Default Deny**: No access without explicit policy
2. **User Isolation**: Users only see their own data
3. **Service Role Bypass**: Edge functions use service role for cross-user operations
4. **Admin Access**: Admin users have elevated permissions

## Core Table Policies

### applications

Users can only access their own applications.

```sql
-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own applications
CREATE POLICY "Users can view own applications"
ON applications FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can create applications for themselves
CREATE POLICY "Users can create own applications"
ON applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own applications
CREATE POLICY "Users can update own applications"
ON applications FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Users can delete their own applications
CREATE POLICY "Users can delete own applications"
ON applications FOR DELETE
USING (auth.uid() = user_id);
```

### reports

Users can only access reports they own.

```sql
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reports"
ON reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
ON reports FOR UPDATE
USING (auth.uid() = user_id);
```

### profiles

Users can view all profiles but only edit their own.

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public profiles for community features
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

### user_subscriptions

Users can only view their own subscription.

```sql
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can modify subscriptions (via webhooks)
```

### payment_history

Users can only view their own payment history.

```sql
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
ON payment_history FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert payments (via webhooks)
```

### drawn_parcels

Users can manage their own drawn parcels.

```sql
ALTER TABLE drawn_parcels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parcels"
ON drawn_parcels FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own parcels"
ON drawn_parcels FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parcels"
ON drawn_parcels FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own parcels"
ON drawn_parcels FOR DELETE
USING (auth.uid() = user_id);
```

## Admin Policies

### user_roles

Admin role checking.

```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can modify roles
CREATE POLICY "Admins can manage roles"
ON user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

### Admin Helper Function

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Public Tables

Some tables are intentionally public:

### subscription_tiers

```sql
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone can view available tiers
CREATE POLICY "Tiers are publicly viewable"
ON subscription_tiers FOR SELECT
USING (true);
```

### beta_signups

```sql
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a signup
CREATE POLICY "Anyone can sign up for beta"
ON beta_signups FOR INSERT
WITH CHECK (true);

-- Only admins can view signups
CREATE POLICY "Admins can view signups"
ON beta_signups FOR SELECT
USING (is_admin());
```

## Logging Tables

### api_logs

```sql
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Users can view logs for their applications
CREATE POLICY "Users can view own app logs"
ON api_logs FOR SELECT
USING (
  application_id IN (
    SELECT id FROM applications
    WHERE user_id = auth.uid()
  )
);

-- Service role inserts logs
```

## Storage Policies

### Report PDFs Bucket

```sql
-- Users can read their own reports
CREATE POLICY "Users can read own reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role uploads reports
CREATE POLICY "Service role can upload reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reports'
  AND auth.role() = 'service_role'
);
```

## Security Best Practices

### Do's

✅ Always enable RLS on new tables
✅ Use `auth.uid()` for user identification
✅ Use service role for cross-user operations
✅ Test policies with different user contexts
✅ Log access attempts for auditing

### Don'ts

❌ Never disable RLS in production
❌ Don't use `USING (true)` without careful consideration
❌ Don't expose service role key to client
❌ Don't rely solely on application-level security
❌ Don't forget to add policies for new tables

## Testing RLS Policies

### Test as Authenticated User

```sql
-- Set the JWT claims to test as a specific user
SET request.jwt.claims = '{"sub": "user-uuid-here"}';

-- Test SELECT
SELECT * FROM applications;

-- Reset
RESET request.jwt.claims;
```

### Test as Anonymous

```sql
-- Anonymous requests have no JWT
SET request.jwt.claims = '{}';

-- Should return empty or fail
SELECT * FROM applications;
```

### Test as Service Role

```sql
-- Service role bypasses RLS
-- This is only available in edge functions
```

## Common Issues

### "Permission denied for table"

RLS is enabled but no matching policy exists.

**Solution**: Add appropriate policy or check `auth.uid()` matches.

### "New row violates row-level security policy"

INSERT/UPDATE policy check failed.

**Solution**: Ensure `WITH CHECK` clause allows the operation.

### "infinite recursion detected"

Policy references itself or creates circular dependency.

**Solution**: Use `SECURITY DEFINER` functions to break recursion.

---

**Back to**: [Documentation Index →](../index.md)
