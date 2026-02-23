# Auth Configuration Recommendations

Apply these changes to `supabase/config.toml` for production-grade auth security.

## Password Policy

- [x] **Done** — Applied in `supabase/config.toml`

```toml
# Change from 6 to 8 (NIST/OWASP recommendation)
minimum_password_length = 8

# Require mixed case + digits (or add symbols for stronger)
password_requirements = "lower_upper_letters_digits"
```

## Email Verification (Production)

- [ ] **Optional** — Apply in Supabase Dashboard for production

```toml
[auth.email]
# Require email confirmation before first sign-in
enable_confirmations = true

# Require re-auth before password change
secure_password_change = true
```

## Optional: Stricter Session Timeouts

- [ ] **Optional**

```toml
[auth.sessions]
# Force logout after 24h
timebox = "24h"
# Force logout after 8h inactivity
inactivity_timeout = "8h"
```

---

**Note:** For local development, you may keep `enable_confirmations = false` to avoid email verification. Use environment-specific config or override in production.
