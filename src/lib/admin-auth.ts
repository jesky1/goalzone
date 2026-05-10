// ============================================================
// GOALZONE - Admin API Auth Helper
// ============================================================
<<<<<<< HEAD
// Protects admin-only API routes with dual auth:
//   1. ADMIN_API_KEY (static API key from env)
//   2. JWT token (from admin login)
=======
// Protects admin-only API routes with API key
// ============================================================
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
//
// Usage in API route:
//   import { verifyAdmin } from '@/lib/admin-auth'
//   const auth = verifyAdmin(request)
//   if (!auth.valid) return auth.response
//
// Environment variable:
//   ADMIN_API_KEY=your-secret-api-key
<<<<<<< HEAD
//   JWT_SECRET=your-jwt-secret
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const ADMIN_API_KEY = process.env.ADMIN_API_KEY
const JWT_SECRET = process.env.JWT_SECRET || 'goalzone-admin-secret-2025'

interface AuthResult {
  valid: true
  decoded?: any
=======
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

const ADMIN_API_KEY = process.env.ADMIN_API_KEY

interface AuthResult {
  valid: true
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
}

interface AuthFail {
  valid: false
  response: NextResponse
}

export function verifyAdmin(request: NextRequest): AuthResult | AuthFail {
  // Skip auth in development if no key is set
<<<<<<< HEAD
  if (!ADMIN_API_KEY && !JWT_SECRET) {
    console.warn('[Admin Auth] Neither ADMIN_API_KEY nor JWT_SECRET set. Admin routes are unprotected.')
    return { valid: true }
  }

  // Check Authorization header: Bearer <key-or-jwt>
=======
  if (!ADMIN_API_KEY) {
    console.warn('[Admin Auth] ADMIN_API_KEY not set. Admin routes are unprotected.')
    return { valid: true }
  }

  // Check Authorization header: Bearer <key>
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return {
      valid: false,
      response: NextResponse.json(
<<<<<<< HEAD
        { error: 'Unauthorized. Provide Authorization: Bearer <token>' },
=======
        { error: 'Unauthorized. Provide Authorization: Bearer <ADMIN_API_KEY>' },
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
        { status: 401 }
      ),
    }
  }

  const token = authHeader.replace('Bearer ', '')
<<<<<<< HEAD

  // 1. Try static API key first
  if (ADMIN_API_KEY && token === ADMIN_API_KEY) {
    return { valid: true }
  }

  // 2. Try JWT verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return { valid: true, decoded }
  } catch {
    // JWT invalid — fall through to error
  }

  // Neither auth method succeeded
  return {
    valid: false,
    response: NextResponse.json(
      { error: 'Forbidden. Invalid admin credentials.' },
      { status: 403 }
    ),
  }
=======
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
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
}
