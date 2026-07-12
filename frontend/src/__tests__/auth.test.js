import { describe, it, expect, beforeEach } from 'vitest'
import { authStore } from '../store/auth.js'

describe('store/auth.js', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reports user is not logged in by default', () => {
    expect(authStore.isLoggedIn()).toBe(false)
    expect(authStore.getToken()).toBeNull()
    expect(authStore.getUserId()).toBeNull()
    expect(authStore.isAdmin()).toBe(false)
  })

  it('stores details properly on login()', () => {
    authStore.login('mock-jwt-token', 'user-123', true)
    
    expect(authStore.isLoggedIn()).toBe(true)
    expect(authStore.getToken()).toBe('mock-jwt-token')
    expect(authStore.getUserId()).toBe('user-123')
    expect(authStore.isAdmin()).toBe(true)
  })

  it('cleans up localstorage details on logout()', () => {
    authStore.login('mock-jwt-token', 'user-123', true)
    expect(authStore.isLoggedIn()).toBe(true)

    authStore.logout()

    expect(authStore.isLoggedIn()).toBe(false)
    expect(authStore.getToken()).toBeNull()
    expect(authStore.getUserId()).toBeNull()
    expect(authStore.isAdmin()).toBe(false)
  })

  it('allows manual updating of userId via setUserId()', () => {
    authStore.setUserId('new-id-999')
    expect(authStore.getUserId()).toBe('new-id-999')
  })
})
