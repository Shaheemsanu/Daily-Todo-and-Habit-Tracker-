import { FormEvent, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ArrowRight, CheckCircle2, Cloud, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export function AuthGate({ onSession }: { onSession: (session: Session | null) => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      onSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      onSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, [onSession]);

  if (!isSupabaseConfigured || !supabase) {
    return <div className="auth-screen"><div className="auth-card">
      <div className="brand-mark">d</div><p className="eyebrow">SETUP REQUIRED</p>
      <h1>Connect your cloud workspace</h1>
      <p className="muted">Add your Supabase URL and anon key to <code>.env.local</code>, run the SQL in <code>supabase/schema.sql</code>, then restart the dev server.</p>
      <div className="setup-steps"><span><CheckCircle2 size={18}/> Create a Supabase project</span><span><CheckCircle2 size={18}/> Run the database schema</span><span><CheckCircle2 size={18}/> Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</span></div>
    </div></div>;
  }

  if (session) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage('');
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === 'signup' && !result.data.session) setMessage('Check your email to confirm your account, then sign in.');
    else setMessage('Welcome to Daymark.');
  }

  return <div className="auth-screen"><div className="auth-card">
    <div className="brand-row"><div className="brand-mark">d</div><span>daymark</span></div>
    <p className="eyebrow">YOUR DAY, WITH INTENTION</p>
    <h1>{mode === 'signin' ? 'Welcome back.' : 'Make room for better habits.'}</h1>
    <p className="muted">A calmer way to follow through, one day at a time.</p>
    <form onSubmit={submit} className="auth-form">
      <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email"/></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}/></label>
      <button className="primary-button wide" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={17}/></button>
    </form>
    {message && <p className="inline-message">{message}</p>}
    <button className="text-button" onClick={() => {setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('');}}>
      {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
    </button>
    <div className="auth-trust"><span><Cloud size={15}/> Cloud sync</span><span><ShieldCheck size={15}/> Private by design</span></div>
  </div></div>;
}
