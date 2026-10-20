import Link from 'next/link';

export const metadata = { title: 'Refund Policy — Retab', description: 'Refund terms for Retab subscriptions.' };

export default function RefundPage() {
  return (
    <div style={{ background: '#fcf9f8', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#853423', letterSpacing: '-0.02em', marginBottom: '24px' }}>Refund Policy</h1>
        <div style={{ color: '#55423e', fontSize: '15px', lineHeight: 1.7 }}>
          <p style={{ marginBottom: '16px' }}>We offer a 7-day refund window from the start of your billing period if you have not used the service. After 7 days, no refunds are issued for partial months.</p>
          <p style={{ marginBottom: '16px' }}>To request a refund, email <a href="mailto:hello@retab.in" style={{ color: '#853423' }}>hello@retab.in</a> with your account details.</p>
        </div>
        <div style={{ marginTop: '40px' }}>
          <Link href="/" style={{ color: '#853423', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
