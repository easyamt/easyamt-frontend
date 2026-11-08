import { describe, expect, it } from 'vitest'
import { authErrorKey } from './errors'

describe('authentication error messages', () => {
  it('only explains password rules during registration', () => {
    const error = { code: 'weak_password' }
    expect(authErrorKey(error, 'signUp')).toBe('passwordRequirements')
    expect(authErrorKey(error, 'signIn')).toBe('authInvalidCredentials')
  })
  it('distinguishes short and compromised registration passwords', () => {
    expect(authErrorKey({ code: 'weak_password', reasons: ['length'] }, 'signUp')).toBe('authPasswordLength')
    expect(authErrorKey({ code: 'weak_password', reasons: ['pwned'] }, 'signUp')).toBe('authPasswordCompromised')
  })
  it('handles the legacy password message without exposing raw server text', () => {
    const error = { message: 'Password should contain at least one character of each: abc, ABC, 012' }
    expect(authErrorKey(error, 'signUp')).toBe('passwordRequirements')
    expect(authErrorKey(error, 'signIn')).toBe('authInvalidCredentials')
  })
  it('distinguishes credentials, confirmation, existing accounts and rate limits', () => {
    expect(authErrorKey({ code: 'invalid_credentials' }, 'signIn')).toBe('authInvalidCredentials')
    expect(authErrorKey({ code: 'email_not_confirmed' }, 'signIn')).toBe('authEmailNotConfirmed')
    expect(authErrorKey({ code: 'email_exists' }, 'signUp')).toBe('authEmailExists')
    expect(authErrorKey({ status: 429 }, 'signUp')).toBe('authRateLimit')
  })
  it('only reports existing accounts in registration, never in sign in', () => {
    for (const code of ['email_exists', 'user_already_exists']) {
      expect(authErrorKey({ code }, 'signIn')).toBe('authInvalidCredentials')
      expect(authErrorKey({ code }, 'signUp')).toBe('authEmailExists')
    }
  })
  it('uses a translatable fallback for unknown errors in each mode', () => {
    expect(authErrorKey({ message: 'Internal provider detail' }, 'signIn')).toBe('authSignInError')
    expect(authErrorKey({ message: 'Internal provider detail' }, 'signUp')).toBe('authSignUpError')
  })
})
