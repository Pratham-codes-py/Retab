import Link from 'next/link';
import { BUSINESS } from '@/lib/config/business';

export const metadata = {
  title: 'About Retab — Built in Goa for Independent Cafes',
  description: 'Retab is a simple billing and review tool for independent cafes in India. Built in Goa by a solo founder.',
};

export default function AboutPage() {
  return (
    <div style={{ background: '#fcf9f8', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#853423', letterSpacing: '-0.02em', marginBottom: '24px' }}>About Retab</h1>
        <p style={{ fontSize: '18px', lineHeight: 1.7, color: '#55423e', marginBottom: '32px' }}>
          Retab is a simple tool that helps independent cafes send digital bills on WhatsApp and ask for reviews automatically. No paper, no manual follow-up.
        </p>
        <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#55423e', marginBottom: '32px' }}>
          Built in Goa by a solo founder. The problem we solve: cafe owners spend too much time on manual billing and chasing reviews. Retab handles both in one place.
        </p>
        <div style={{ borderTop: '1px solid #dbc1bb', paddingTop: '24px', marginTop: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1b1b', marginBottom: '8px' }}>Business</h2>
          <p style={{ fontSize: '15px', color: '#55423e' }}>{BUSINESS.name}</p>
          <p style={{ fontSize: '15px', color: '#55423e' }}>Founded: {BUSINESS.founded}</p>
          <p style={{ fontSize: '15px', color: '#55423e' }}>{BUSINESS.address}</p>
          <p style={{ fontSize: '15px', color: '#55423e' }}>{BUSINESS.email} · {BUSINESS.phone}</p>
        </div>
        <div style={{ marginTop: '40px' }}>
          <Link href="/" style={{ color: '#853423', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
