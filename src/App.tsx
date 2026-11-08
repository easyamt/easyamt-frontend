import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from './features/auth/supabase'
import { authErrorKey } from './features/auth/errors'
import { registrationEmailError } from './features/auth/registration'
import DocumentWorkspace from './features/documents/DocumentWorkspace'
import { clearPdfs } from './features/documents/pdfStore'
import { authConfigured } from './shared/config'

type View = 'home' | 'upload' | 'list' | 'detail' | 'account'

function AuthForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'signUp') {
        const emailError = await registrationEmailError(email)
        if (emailError) {
          setError(emailError)
          return
        }
      }
      const result = mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email: email.trim(), password })
      if (result.error) {
        setError(authErrorKey(result.error, mode))
      } else if (mode === 'signUp' && !result.data.session) {
        setNotice('authSignupNotice')
      }
    } catch {
      setError('authConnectionError')
    } finally {
      setBusy(false)
    }
  }

  return <section className="auth-card" aria-labelledby="auth-heading">
    <p className="eyebrow">EASYAMT</p>
    <h1 id="auth-heading">{t(mode === 'signUp' ? 'signUp' : 'authTitle')}</h1>
    <form onSubmit={(event) => { void submit(event) }}>
      <label>{t('email')}<input type="email" autoComplete="email" required value={email} onChange={(event) => { setEmail(event.target.value); setError(''); setNotice('') }} /></label>
      <div className="password-field">
        <label htmlFor="auth-password">{t('password')}</label>
        <div className="password-control">
          <input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} required value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} />
          <button type="button" className="password-toggle" aria-label={t(showPassword ? 'hidePassword' : 'showPassword')} title={t(showPassword ? 'hidePassword' : 'showPassword')} aria-controls="auth-password" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{showPassword && <path d="m3 3 18 18" />}</svg>
          </button>
        </div>
      </div>
      {error && <p role="alert" className="error auth-error">{t(error)}</p>}
      {notice && <p role="status" className="auth-notice">{t(notice)}</p>}
      <button className="button primary" disabled={busy} type="submit">{t(mode)}</button>
    </form>
    <button className="text-button" disabled={busy} onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setError(''); setNotice(''); setPassword(''); setShowPassword(false) }}>{t(mode === 'signIn' ? 'signUp' : 'signIn')}</button>
  </section>
}

function Home({ navigate }: { navigate: (view: View) => void }) {
  const { t } = useTranslation()
  return <>
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('headline')}</h1>
        <p className="lead">{t('intro')}</p>
        <div className="hero-actions"><button className="button primary" onClick={() => navigate('upload')}>{t('start')} <span aria-hidden="true">↗</span></button><a className="button secondary" href="#how-it-works">{t('howItWorks')}</a></div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="paper"><span>Sehr geehrte Damen und Herren,</span><i /><i /><i className="short" /><div className="highlight" /><i /><i className="medium" /></div><div className="floating-note"><span>✓</span><div><b>02</b><small>Schritte / steps</small></div></div></div>
    </section>
    <section id="how-it-works" className="steps"><div className="section-heading"><p className="eyebrow">EASYAMT</p><h2>{t('howItWorks')}</h2></div><div className="step-grid">{([1, 2, 3] as const).map((step) => <article className="step" key={step}><span className="step-number">0{step}</span><h3>{t(`step${step}Title`)}</h3><p>{t(`step${step}Body`)}</p></article>)}</div></section>
  </>
}

function App() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [view, setView] = useState<View>('home')
  const [session, setSession] = useState<Session | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(authConfigured)

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    void supabase.auth.getSession().then(({ data }) => { if (mounted) setSession(data.session) }).catch(() => { if (mounted) setSession(null) }).finally(() => { if (mounted) setLoadingAuth(false) })
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') { clearPdfs(); queryClient.clear(); setView('home') }
      setSession(nextSession)
    })
    return () => { mounted = false; data.subscription.unsubscribe() }
  }, [queryClient])

  function changeLanguage(language: string) {
    if (language !== 'en' && language !== 'es' && language !== 'de') return
    localStorage.setItem('easyamt-language', language)
    void i18n.changeLanguage(language).then(() => { document.title = i18n.t('pageTitle') })
    document.documentElement.lang = language
  }

  if (loadingAuth) return <main className="auth-layout" aria-busy="true">EasyAmt…</main>

  return <div className="site-shell">
    <header className="site-header"><div className="container header-inner"><button className="brand" onClick={() => setView('home')} aria-label={t('brandHome')}><span className="brand-mark">E<span>·</span></span><span>EasyAmt<small>{t('tagline')}</small></span></button><nav aria-label="Main navigation"><button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>{t('navHome')}</button><button className={view === 'upload' ? 'active' : ''} onClick={() => setView('upload')}>{t('navAnalyze')}</button><button className={view === 'list' || view === 'detail' ? 'active' : ''} onClick={() => setView('list')}>{t('navDocuments')}</button></nav><div className="header-actions"><select className="language-select" aria-label={t('languageLabel')} value={i18n.resolvedLanguage ?? i18n.language} onChange={(event) => changeLanguage(event.target.value)}><option value="en">English</option><option value="es">Español</option><option value="de">Deutsch</option></select>{session && <button className="signout-button" onClick={() => { clearPdfs(); queryClient.clear(); setView('home'); void supabase?.auth.signOut() }}>{t('signOut')}</button>}</div></div></header>
    <main className="container main-content">
      {!authConfigured && <p className="config-banner">{t('configNotice')}</p>}
      {authConfigured && !session ? <div className="auth-layout"><AuthForm /></div> : view === 'home' ? <Home navigate={setView} /> : view === 'account' ? <section className="workspace-panel"><h1>{t('account')}</h1><p>{t('accountPending')}</p></section> : session ? <DocumentWorkspace token={session.access_token} screen={view} setScreen={setView} /> : <div className="auth-layout"><p>{t('configNotice')}</p></div>}
      <aside className="prototype-notice"><span aria-hidden="true">!</span><p>{t('prototype')}</p></aside>
    </main>
    <footer className="site-footer"><div className="container"><span>© 2026 EasyAmt</span><span>{t('footer')}</span>{session && <button onClick={() => setView('account')}>{t('account')}</button>}</div></footer>
  </div>
}

export default App
