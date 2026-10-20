import Link from 'next/link';

export const metadata = { title: 'Terms of Service — Retab', description: 'Terms for using Retab.' };

export default function TermsPage() {
  return (
    <div style={{ background: '#fcf9f8', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#853423', letterSpacing: '-0.02em', marginBottom: '24px' }}>Terms of Service</h1>
        <div style={{ color: '#55423e', fontSize: '15px', lineHeight: 1.7 }}>
          <p style={{ marginBottom: '16px' }}><strong>1. Service.</strong> Retab provides billing and review tools for independent cafes.</p>
          <p style={{ marginBottom: '16px' }}><strong>2. Use.</strong> You agree to use Retab only for your own cafe's operations.</p>
          <p style={{ marginBottom: '16px' }}><strong>3. Billing.</strong> Plans are billed monthly in advance. No refunds for partial months unless required by law.</p>
          <p style={{ marginBottom: '16px' }}><strong>4. Termination.</strong> Either party may terminate by cancelling the subscription.</p>
        </div>
        <div style={{ marginTop: '40px' }}>
          <Link href="/" style={{ color: '#853423', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
