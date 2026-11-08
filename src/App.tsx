import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { supabase } from './features/auth/supabase'
import { validatePdf } from './features/upload/validation'
import type { PdfValidationError } from './features/upload/validation'
import { authConfigured } from './shared/config'

type View = 'home' | 'analyze' | 'documents' | 'account'

function AuthForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    const result = mode === 'signIn'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (result.error) setError(result.error.message || t('authError'))
    setBusy(false)
  }

  return <section className="auth-card" aria-labelledby="auth-heading">
    <p className="eyebrow">EASYAMT</p>
    <h1 id="auth-heading">{t('authTitle')}</h1>
    <form onSubmit={(event) => { void submit(event) }}>
      <label>{t('email')}<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>{t('password')}<input type="password" autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {error && <p role="alert" className="error">{error}</p>}
      <button className="button primary" disabled={busy} type="submit">{t(mode)}</button>
    </form>
    <button className="text-button" onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>{t(mode === 'signIn' ? 'signUp' : 'signIn')}</button>
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
        <div className="hero-actions"><button className="button primary" onClick={() => navigate('analyze')}>{t('start')} <span aria-hidden="true">↗</span></button><a className="button secondary" href="#how-it-works">{t('howItWorks')}</a></div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="paper"><span>Sehr geehrte Damen und Herren,</span><i /><i /><i className="short" /><div className="highlight" /><i /><i className="medium" /></div><div className="floating-note"><span>✓</span><div><b>02</b><small>Schritte / steps</small></div></div></div>
    </section>
    <section id="how-it-works" className="steps"><div className="section-heading"><p className="eyebrow">EASYAMT</p><h2>{t('howItWorks')}</h2></div><div className="step-grid">{([1, 2, 3] as const).map((step) => <article className="step" key={step}><span className="step-number">0{step}</span><h3>{t(`step${step}Title`)}</h3><p>{t(`step${step}Body`)}</p></article>)}</div></section>
  </>
}

function Analyze() {
  const { t, i18n } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<PdfValidationError | null>(null)
  const [consent, setConsent] = useState(false)
  const [outputLanguage, setOutputLanguage] = useState<'es' | 'en'>(i18n.language === 'en' ? 'en' : 'es')

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const candidate = event.target.files?.[0] ?? null
    const problem = candidate ? validatePdf(candidate) : null
    setFile(problem ? null : candidate)
    setError(problem)
    if (problem) event.target.value = ''
  }

  return <section className="workspace-panel">
    <p className="eyebrow">{t('uploadEyebrow')}</p><h1>{t('uploadTitle')}</h1><p className="muted">{t('uploadIntro')}</p>
    <div className="upload-card">
      <label className="file-picker"><input type="file" accept="application/pdf,.pdf" onChange={selectFile} /><span className="upload-icon" aria-hidden="true">↥</span><strong>{t('chooseFile')}</strong><small>{t('dropHint')}</small></label>
      {error && <p className="error" role="alert">{t(error)}</p>}
      {file && <p className="selected-file"><strong>{t('selectedFile')}:</strong> {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
      <label className="select-label">{t('outputLanguage')}<select value={outputLanguage} onChange={(event) => setOutputLanguage(event.target.value as 'es' | 'en')}><option value="es">Español</option><option value="en">English</option></select></label>
      <label className="consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />{t('consent')}</label>
      {file && consent && <p className="success">{t('localReady')}</p>}
      <p className="pending">{t('pendingApi')}</p>
    </div>
  </section>
}

function App() {
  const { t, i18n } = useTranslation()
  const [view, setView] = useState<View>('home')
  const [session, setSession] = useState<Session | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(authConfigured)

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    void supabase.auth.getSession().then(({ data }) => { if (mounted) { setSession(data.session); setLoadingAuth(false) } })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => { mounted = false; data.subscription.unsubscribe() }
  }, [])

  function changeLanguage() {
    const language = i18n.language === 'es' ? 'en' : 'es'
    localStorage.setItem('easyamt-language', language)
    void i18n.changeLanguage(language)
    document.documentElement.lang = language
  }

  if (loadingAuth) return <main className="auth-layout" aria-busy="true">EasyAmt…</main>

  return <div className="site-shell">
    <header className="site-header"><div className="container header-inner"><button className="brand" onClick={() => setView('home')} aria-label="EasyAmt home"><span className="brand-mark">E<span>·</span></span><span>EasyAmt<small>{t('tagline')}</small></span></button><nav aria-label="Main navigation"><button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>{t('navHome')}</button><button className={view === 'analyze' ? 'active' : ''} onClick={() => setView('analyze')}>{t('navAnalyze')}</button><button className={view === 'documents' ? 'active' : ''} onClick={() => setView('documents')}>{t('navDocuments')}</button></nav><div className="header-actions"><button className="language-button" onClick={changeLanguage}>{t('switchLanguage')}</button>{session && <button className="signout-button" onClick={() => { void supabase?.auth.signOut() }}>{t('signOut')}</button>}</div></div></header>
    <main className="container main-content">
      {!authConfigured && <p className="config-banner">{t('configNotice')}</p>}
      {authConfigured && !session ? <div className="auth-layout"><AuthForm /></div> : view === 'home' ? <Home navigate={setView} /> : view === 'analyze' ? <Analyze /> : view === 'documents' ? <section className="workspace-panel"><p className="eyebrow">EASYAMT</p><h1>{t('documentsTitle')}</h1><div className="empty-state">{t('documentsEmpty')}</div></section> : <section className="workspace-panel"><h1>{t('account')}</h1><p>{t('accountPending')}</p></section>}
      <aside className="prototype-notice"><span aria-hidden="true">!</span><p>{t('prototype')}</p></aside>
    </main>
    <footer className="site-footer"><div className="container"><span>© 2026 EasyAmt</span><span>{t('footer')}</span>{session && <button onClick={() => setView('account')}>{t('account')}</button>}</div></footer>
  </div>
}

export default App
