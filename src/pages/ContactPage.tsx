import { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StaticPageLayout } from '@/components/StaticPageLayout';
import { TextField, SelectField, FieldWrapper } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

const CONTACT_EMAIL = 'artistic.aura.2009@gmail.com';

export default function ContactPage() {
  const [type, setType] = useState<'contact' | 'feedback' | 'bug'>('contact');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name, email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data?.error || 'Something went wrong sending your message.');
        setStatus('error');
        return;
      }
      setStatus('sent');
      setMessage('');
    } catch {
      setErrorMsg('Could not reach the server — check your connection and try again.');
      setStatus('error');
    }
  }

  return (
    <StaticPageLayout title="Contact Us" description="Get in touch with the ALLROUNDER HELPER team for feedback, bug reports, or partnership inquiries." path="/contact" showLogo>
      <p>We read every message. Whether you've spotted a calculation that looks off, have a tool you'd like to see built, or want to talk partnerships, reach out below.</p>

      {status === 'sent' ? (
        <div role="status" className="not-prose flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          <p className="text-sm text-navy-700 dark:text-ink-200">Thanks — your message is on its way. We typically respond within two business days.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="not-prose space-y-4 rounded-2xl border border-navy-100 dark:border-white/10 p-5">
          <SelectField label="What's this about?" id="contact-type" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="contact">General contact</option>
            <option value="feedback">Feedback</option>
            <option value="bug">Bug report</option>
          </SelectField>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="Name (optional)" id="contact-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <TextField label="Email" id="contact-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <FieldWrapper label="Message" htmlFor="contact-message">
            <textarea
              id="contact-message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={type === 'bug' ? 'Which tool, what you did, and what went wrong...' : 'Your message...'}
              className="w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 text-navy-900 dark:text-ink-100 placeholder:text-navy-400 dark:placeholder:text-ink-500 focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 outline-none transition-colors resize-y"
            />
          </FieldWrapper>
          {status === 'error' && <p role="alert" className="text-sm text-red-500">{errorMsg}</p>}
          <Button type="submit" disabled={status === 'sending'} icon={status === 'sending' ? <Loader2 size={14} className="animate-spin" /> : undefined}>
            {status === 'sending' ? 'Sending...' : 'Send message'}
          </Button>
        </form>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-navy-100 dark:border-white/10 p-5 not-prose">
        <Mail size={20} className="text-electric-500" />
        <div>
          <p className="text-sm text-navy-500 dark:text-ink-500">Or email us directly at</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-navy-900 dark:text-ink-100 hover:text-electric-500 transition-colors">
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-4">What to include</h2>
      <p>If you're reporting a calculator that looks wrong, tell us which tool, the inputs you used, and what result you expected — that's usually enough for us to reproduce and fix it quickly. For tool requests, a short description of the use case helps us prioritize.</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-4">Common reasons people write in</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>A calculator formula or result that doesn't match your institution's method</li>
        <li>A bug in a planner, tracker, or document tool</li>
        <li>A tool or feature you'd like to see added</li>
        <li>Partnership, advertising, or press inquiries</li>
      </ul>
      <p>For questions about how we handle data, see our <Link to="/privacy-policy" className="font-medium text-electric-500 hover:underline">Privacy Policy</Link>. For questions about calculator accuracy, see our <Link to="/disclaimer" className="font-medium text-electric-500 hover:underline">Disclaimer</Link>.</p>
    </StaticPageLayout>
  );
}
