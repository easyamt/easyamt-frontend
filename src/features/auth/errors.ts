type AuthFailure = { code?: string; message?: string; status?: number; reasons?: string[] }

export function authErrorKey(error: AuthFailure, mode: 'signIn' | 'signUp') {
  if (error.status === 429 || ['over_request_rate_limit', 'over_email_send_rate_limit'].includes(error.code ?? '')) return 'authRateLimit'
  if (error.code === 'email_not_confirmed') return 'authEmailNotConfirmed'
  if (error.code === 'user_banned') return 'authAccountUnavailable'
  if (error.status === 0 || error.code === 'request_timeout') return 'authConnectionError'
  if (mode === 'signIn') {
    if (['invalid_credentials', 'user_not_found', 'weak_password'].includes(error.code ?? '')
      || /invalid login credentials|password should contain/i.test(error.message ?? '')) return 'authInvalidCredentials'
    return 'authSignInError'
  }
  if (['email_exists', 'user_already_exists'].includes(error.code ?? '')) return 'authEmailExists'
  if (error.code === 'email_address_invalid') return 'authInvalidEmail'
  if (['signup_disabled', 'email_provider_disabled'].includes(error.code ?? '')) return 'authSignupDisabled'
  if (error.code === 'email_address_not_authorized') return 'authEmailNotAllowed'
  if (error.code === 'weak_password' || /password should/i.test(error.message ?? '')) {
    if (error.reasons?.includes('pwned')) return 'authPasswordCompromised'
    if (error.reasons?.includes('length') || /at least \d+ characters/i.test(error.message ?? '')) return 'authPasswordLength'
    return 'passwordRequirements'
  }
  return 'authSignUpError'
}
