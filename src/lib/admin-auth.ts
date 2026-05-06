// ============================================================
// GOALZONE - Admin API Auth Helper
// ============================================================
// Protects admin-only API routes with API key
// ============================================================
//
// Usage in API route:
//   import { verifyAdmin } from '@/lib/admin-auth'
//   const auth = verifyAdmin(request)
//   if (!auth.valid) return auth.response
//
// Environment variable:
//   ADMIN_API_KEY=your-secret-api-key
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

const ADMIN_API_KEY = process.env.ADMIN_API_KEY

interface AuthResult {
  valid: true
}

interface AuthFail {
  valid: false
  response: NextResponse
}

export function verifyAdmin(request: NextRequest): AuthResult | AuthFail {
  // Skip auth in development if no key is set
  if (!ADMIN_API_KEY) {
    console.warn('[Admin Auth] ADMIN_API_KEY not set. Admin routes are unprotected.')
    return { valid: true }
  }

  // Check Authorization header: Bearer <key>
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Unauthorized. Provide Authorization: Bearer <ADMIN_API_KEY>' },
        { status: 401 }
      ),
    }
  }

  const token = authHeader.replace('Bearer ', '')
  if (token !== ADMIN_API_KEY) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Forbidden. Invalid admin API key.' },
        { status: 403 }
      ),
    }
  }

  return { valid: true }
}
