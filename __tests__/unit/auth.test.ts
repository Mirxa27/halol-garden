import { describe, it, expect, vi } from 'vitest'
import { getCurrentUser, isAdmin, isSupplier } from '@/lib/auth'

vi.mock('next-auth', () => ({
  auth: vi.fn(),
}))

describe('Auth Utilities', () => {
  describe('getCurrentUser', () => {
    it('should return null when no session exists', async () => {
      const { auth } = await import('next-auth')
      vi.mocked(auth).mockResolvedValue(null)
      
      const user = await getCurrentUser()
      expect(user).toBeNull()
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      const { auth } = await import('next-auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
        expires: new Date().toISOString(),
      })
      
      const result = await isAdmin()
      expect(result).toBe(true)
    })

    it('should return false for non-admin users', async () => {
      const { auth } = await import('next-auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', role: 'HEALTHCARE_PROVIDER' },
        expires: new Date().toISOString(),
      })
      
      const result = await isAdmin()
      expect(result).toBe(false)
    })
  })
})