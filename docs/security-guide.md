# 🔒 Security Guide

This guide covers security best practices and considerations for Resource Tracker deployments.

## Authentication & Authorization

### Discord OAuth Security
- **Secure Redirect URIs**: Only add trusted domains to Discord app settings
- **Environment Variables**: Never commit Discord secrets to version control
- **Token Management**: Access tokens are automatically refreshed by NextAuth.js
- **Session Security**: Sessions expire after 4 hours by default

### Role-Based Access Control
Resource Tracker implements a flexible role-based permission system:

```typescript
// Permission hierarchy
{
  "canAccessResources": true,  // View and update resources
  "canEditTargets": true,      // Modify target quantities  
  "isAdmin": true             // Full CRUD access + history deletion
}
```

**Security by Design:**
- **Default Deny**: No access without explicit role configuration
- **Least Privilege**: Users get minimum required permissions
- **Audit Trail**: All actions are logged with user attribution

## Environment Security

### Production Environment Variables
```bash
# Use strong, unique secrets
NEXTAUTH_SECRET=your_very_long_random_secret_32_chars_minimum

# Secure database URLs
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_secure_token_with_proper_permissions

# Validate Discord configuration
DISCORD_CLIENT_SECRET=keep_this_secret_secure
DISCORD_ROLES_CONFIG=properly_validated_json_array
```

### Secret Management
**Recommended Practices:**
- Use environment-specific secrets
- Rotate secrets regularly (quarterly)
- Use secret management services in production
- Never log or expose secrets in error messages

**Vercel Deployment:**
- Set environment variables in Vercel dashboard
- Use different secrets for preview vs production
- Enable Vercel's security headers

## Database Security

### Turso Security Features
- **Built-in Encryption**: Data encrypted at rest and in transit
- **Access Control**: Token-based authentication
- **Regional Isolation**: Choose database regions for compliance
- **Audit Logging**: All database operations are logged

### SQL Injection Prevention
Resource Tracker uses Drizzle ORM which provides:
- **Parameterized Queries**: All user inputs are properly escaped
- **Type Safety**: TypeScript prevents many injection vectors
- **Schema Validation**: Structured database interactions

### Data Validation
```typescript
// All API endpoints validate inputs
const quantity = parseInt(body.quantity)
if (isNaN(quantity) || quantity < 0) {
  return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
}
```

## GDPR & Privacy Compliance

### Data Collection
Resource Tracker collects minimal user data:
- **Discord Profile**: Username, avatar, server nickname
- **Activity Data**: Resource updates attributed to users
- **Session Data**: Temporary authentication tokens

### User Rights Implementation
- **Right to Access**: `/api/user/data-export` endpoint
- **Right to Deletion**: `/api/user/data-deletion` endpoint (anonymization)
- **Data Portability**: JSON export format
- **Consent**: Clear privacy policy and user controls

### Data Retention
```typescript
// Configurable retention policies
const retentionPolicies = {
  userSessions: '30 days',
  resourceHistory: 'indefinitely', // for audit purposes
  userData: 'until deletion requested'
}
```

## API Security

### Rate Limiting
Currently not implemented, but recommended for production:

```typescript
// Example rate limiting middleware
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})
```

### Input Validation
All API endpoints implement:
- **Type Checking**: TypeScript interfaces for request/response
- **Boundary Validation**: Min/max values for quantities
- **Format Validation**: Proper JSON structure for complex inputs
- **Authentication**: Session validation on protected routes

### Error Handling
```typescript
// Security-conscious error responses
try {
  // Operation that might fail
} catch (error) {
  console.error('Internal error:', error) // Log detailed error
  return NextResponse.json({ 
    error: 'Operation failed' // Return generic message
  }, { status: 500 })
}
```

## Infrastructure Security

### Vercel Security
- **HTTPS Enforcement**: All traffic encrypted in transit
- **Security Headers**: Automatic security headers
- **DDoS Protection**: Built-in protection against attacks
- **Edge Network**: Global CDN reduces attack surface

### DNS Security
- **DNSSEC**: Enable DNSSEC for domain
- **CAA Records**: Restrict certificate authorities
- **Subdomain Takeover**: Monitor for unused subdomains

### Monitoring & Alerts
**Recommended Monitoring:**
- Failed authentication attempts
- Unusual API usage patterns
- Database connection failures
- Error rate spikes

## Incident Response

### Security Incident Plan
1. **Detection**: Monitor logs and metrics
2. **Assessment**: Determine scope and impact
3. **Containment**: Isolate affected systems
4. **Recovery**: Restore normal operations
5. **Lessons**: Update security measures

### Emergency Contacts
Maintain an incident response plan with:
- Technical team contacts
- Infrastructure provider support
- Legal/compliance team
- User communication channels

## Vulnerability Management

### Dependency Updates
```bash
# Regular security updates
npm audit
npm audit fix

# Monitor for vulnerabilities
npm install -g npm-check-updates
ncu -u
```

### Security Scanning
**Recommended Tools:**
- **Snyk**: Dependency vulnerability scanning
- **CodeQL**: Static code analysis
- **OWASP ZAP**: Dynamic security testing
- **Lighthouse**: Security best practices audit

### Responsible Disclosure
If you discover security vulnerabilities:
1. **Do not** publish details publicly
2. Email security team privately
3. Provide reproduction steps
4. Allow reasonable time for fixes
5. Credit will be given for responsible disclosure

## Compliance Considerations

### GDPR (EU Users)
- ✅ Data minimization implemented
- ✅ User consent mechanisms
- ✅ Right to deletion (anonymization)
- ✅ Data portability (JSON export)
- ✅ Privacy by design architecture

### SOC 2 (Enterprise)
For enterprise deployments, consider:
- Access control documentation
- Change management procedures
- Incident response documentation
- Regular security assessments

### Industry Standards
- **OWASP Top 10**: Address common web vulnerabilities
- **NIST Framework**: Cybersecurity framework compliance
- **ISO 27001**: Information security management

## Security Checklist

### Pre-Deployment
- [ ] Environment variables configured securely
- [ ] Discord app permissions reviewed
- [ ] Database access restricted
- [ ] Error handling doesn't leak sensitive data
- [ ] Security headers configured
- [ ] Dependencies updated and scanned

### Post-Deployment
- [ ] Monitoring and alerting configured
- [ ] Backup procedures tested
- [ ] Incident response plan documented
- [ ] Regular security reviews scheduled
- [ ] User training completed
- [ ] Compliance requirements met

### Ongoing Maintenance
- [ ] Monthly dependency updates
- [ ] Quarterly secret rotation
- [ ] Semi-annual security reviews
- [ ] Annual penetration testing (enterprise)
- [ ] Continuous monitoring of security advisories

## Getting Security Help

**For Security Questions:**
- Review this guide and documentation
- Check GitHub security advisories
- Join community discussions

**For Security Issues:**
- Report vulnerabilities responsibly
- Contact maintainers for security concerns
- Use encrypted communication when possible

**Remember:** Security is a shared responsibility between the application, infrastructure providers, and users. Stay informed and follow best practices for your specific deployment scenario.