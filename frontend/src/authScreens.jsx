import React, {useCallback, useEffect, useState} from 'react';
import {brand, ico, link} from './ui.jsx';

// Email addresses are kept for the length of the tab only, so the confirmation screens can name the address.
export const rememberEmail = (kind, email) => { try { sessionStorage.setItem('invent-email-' + kind, email); } catch {} };
export const recalledEmail = kind => { try { return sessionStorage.getItem('invent-email-' + kind) || ''; } catch { return ''; } };

export function AuthAside() {
  return <aside className="auth-aside-copy auth-brand"><a href="#/welcome" aria-label="Invent IO home"><span className="brand"><span className="brand-mark"><span className="icon" aria-hidden="true"><img src="assets/logo-teal.svg" alt="" /></span></span><span>Invent IO</span></span></a><div className="auth-brand-copy"><h1>Every sale, automatically tracked.</h1><p>A customer pays, you tap what they bought — the sale is recorded and your stock updates itself.</p></div></aside>;
}

// bigTitle: phone layout shows a large page title (no back bar), as in the Figma result screens.
export function AuthFrame({title, back = 'login', bigTitle = false, children}) {
  return <div className="auth-layout"><AuthAside />{bigTitle ? <h1 className="status-mobile-title mobile-only">{title}</h1> : <div className="auth-mobile-header">{link(ico('back'), back, 'icon-btn')}{title}</div>}<main className="auth-main"><div className="auth-form status-form">{children}</div></main></div>;
}

const icons = {
  mail: <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 7 8.5-7" /></svg>,
  check: <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12.3 2.8 2.8L16.2 9.5" /></svg>,
  warn: <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4 2.8 20h18.4L12 4Z" /><path d="M12 10v4.5M12 17.4h.01" /></svg>,
  info: <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="8" /><path d="M10 9v5M10 6.2h.01" /></svg>,
  success: <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10" cy="10" r="8" /><path d="m6.6 10.2 2.3 2.3 4.5-4.6" /></svg>,
  error: <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="8" /><path d="M10 6v5M10 13.6h.01" /></svg>,
};

export const Callout = ({tone, title, children}) => <div className={'callout ' + tone} role={tone === 'error' ? 'alert' : 'status'}>{icons[tone]}<div><strong>{title}</strong><p>{children}</p></div></div>;
export const StatusBlock = ({kind, title, children}) => <div className="status-block"><span className={'status-icon ' + kind}>{icons[kind === 'mail' ? 'mail' : kind === 'warn' ? 'warn' : 'check']}</span><h2>{title}</h2><p>{children}</p></div>;

export function CheckEmail({api}) {
  const email = recalledEmail('reset');
  const [sent, setSent] = useState('');
  const again = async () => {
    setSent('sending');
    try { await api.request('/auth/forgot-password', {method: 'POST', body: {email}, auth: false}); setSent('sent'); } catch { setSent('failed'); }
  };
  return <AuthFrame title="Reset password" back="forgot">
    <h1 className="auth-title desktop-only">Reset password</h1>
    <StatusBlock kind="mail" title="Check your email">{email ? `If an account exists for ${email}, we’ve sent a link to reset your password. It may take a few minutes — check spam too.` : 'If an account exists for that email, we’ve sent a link to reset your password. It may take a few minutes — check spam too.'}</StatusBlock>
    {sent === 'failed' && <Callout tone="error" title="Couldn’t send the email">Check your connection and try again.</Callout>}
    <div className="auth-bottom">{link('Back to log in', 'login', 'primary')}{email && <button type="button" className="text-btn" onClick={again} disabled={sent === 'sending'}>{sent === 'sending' ? 'Sending…' : sent === 'sent' ? 'Sent again' : 'Send again'}</button>}</div>
  </AuthFrame>;
}

export function VerifyPending({api, state: initial = ''}) {
  const email = recalledEmail('verify') || api.session?.email || '';
  const [state, setState] = useState(initial);
  const [detail, setDetail] = useState('');
  const resend = async () => {
    setState('sending');
    try { await api.request('/auth/verify-email/resend', {method: 'POST'}); setState('sent'); }
    catch (error) { setDetail(error?.status === 429 ? 'Please wait a minute before trying again.' : ''); setState('failed'); }
  };
  const to = email || 'your email';
  return <AuthFrame title="Verify your email" back="login">
    {state === 'sent' && <Callout tone="success" title="Email sent">{`We sent a new verification link to ${to}. Earlier links may stop working.`}</Callout>}
    {state === 'failed' && <Callout tone="error" title="Couldn’t send the email">{detail || 'Check your connection and try again. Your account details are saved.'}</Callout>}
    <h1 className="auth-title desktop-only">Verify your email</h1>
    <div className="status-block mobile-only"><span className="status-icon mail">{icons.mail}</span><h2>Check your email</h2></div>
    <p className="status-text">{`We sent a verification link to ${to}. Open ${email ? 'the link' : 'it'} to verify your email and finish creating your account.`}</p>
    <Callout tone="info" title="Verification is required">You can’t continue setting up until your email is verified.</Callout>
    <p className="hint-text desktop-only">Didn’t get the email? Check your spam folder, or send it again.</p>
    <div className="auth-bottom"><button type="button" className="secondary" onClick={resend} disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : state === 'failed' ? 'Try again' : 'Resend email'}</button><div className="recovery"><button type="button" className="text-btn" data-live="logout">Back to log in</button></div></div>
  </AuthFrame>;
}

export function VerifyResult({token, verify, api}) {
  const [result, setResult] = useState({phase: token ? 'loading' : 'invalid'});
  const [run, setRun] = useState(0);
  useEffect(() => {
    let active = true;
    if (!token) { setResult({phase: 'invalid'}); return undefined; }
    setResult({phase: 'loading'});
    verify(token).then(() => active && setResult({phase: 'done'}))
      .catch(error => active && setResult({phase: error?.status === 409 ? 'already' : error?.status >= 400 && error.status < 500 ? 'invalid' : 'error', message: error?.message}));
    return () => { active = false; };
  }, [token, verify, run]);
  const [resending, setResending] = useState(false);
  const newLink = useCallback(async () => {
    if (!api.session) { location.hash = '#/login'; return; }
    setResending(true);
    try { await api.request('/auth/verify-email/resend', {method: 'POST'}); rememberEmail('verify', recalledEmail('verify')); location.hash = '#/verify-pending'; } catch { setResult({phase: 'error', message: 'We couldn’t send a new link. Check your connection and try again.'}); } finally { setResending(false); }
  }, [api]);
  const continueTo = api.session ? 'setup-business' : 'login';
  const email = recalledEmail('verify');
  const who = email || 'Your email';
  const p = result.phase;
  if (p === 'loading') return <AuthFrame title="Verify your email" bigTitle><h1 className="auth-title desktop-only">Verify your email</h1><p className="status-text" role="status">Verifying your email…</p></AuthFrame>;
  if (p === 'done') return <AuthFrame title="Email verified" bigTitle><StatusBlock kind="check" title="Email verified">{email ? `${email} is verified. Next, set up your business.` : 'Your email is verified. Next, set up your business.'}</StatusBlock><div className="auth-bottom">{link('Continue setup', continueTo, 'primary')}</div></AuthFrame>;
  if (p === 'already') return <AuthFrame title="Email verified" bigTitle><StatusBlock kind="check" title="Your email is already verified">{`${who} was verified earlier. Continue where you left off.`}</StatusBlock><div className="auth-bottom">{link('Continue setup', continueTo, 'primary')}</div></AuthFrame>;
  if (p === 'invalid') return <AuthFrame title="Verify your email" bigTitle><StatusBlock kind="warn" title="This link no longer works">The verification link has expired or isn’t valid. Send a new link to finish creating your account.</StatusBlock><div className="auth-bottom"><button type="button" className="primary" onClick={newLink} disabled={resending}>{resending ? 'Sending…' : 'Send a new link'}</button>{link('Back to log in', 'login')}</div></AuthFrame>;
  return <AuthFrame title="Verify your email" bigTitle><StatusBlock kind="warn" title="We couldn’t verify your email">{result.message || 'Something went wrong. Try again in a moment.'}</StatusBlock><div className="auth-bottom"><button type="button" className="primary" onClick={() => setRun(n => n + 1)}>Try again</button>{link('Back to log in', 'login')}</div></AuthFrame>;
}
