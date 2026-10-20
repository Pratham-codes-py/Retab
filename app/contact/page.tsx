import Link from 'next/link';
import { BUSINESS } from '@/lib/config/business';
import ContactForm from './contact-form';

export const metadata = {
  title: 'Contact Retab',
  description: 'Reach out to Retab. Built in Goa for independent cafes.',
};

export default function ContactPage() {
  return (
    <div style={{ background: '#fcf9f8', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#853423', letterSpacing: '-0.02em', marginBottom: '24px' }}>Contact</h1>
        <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#55423e', marginBottom: '32px' }}>
          Questions about billing, reviews, or setting up your cafe? Reach out directly.
        </p>
        <div style={{ background: '#fff', border: '1px solid #dbc1bb', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
          <p style={{ fontSize: '15px', color: '#55423e', marginBottom: '8px' }}><strong>Email:</strong> <a href={`mailto:${BUSINESS.email}`} style={{ color: '#853423', textDecoration: 'none' }}>{BUSINESS.email}</a></p>
          <p style={{ fontSize: '15px', color: '#55423e', marginBottom: '8px' }}><strong>Phone:</strong> <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`} style={{ color: '#853423', textDecoration: 'none' }}>{BUSINESS.phone}</a></p>
          <p style={{ fontSize: '15px', color: '#55423e' }}><strong>Location:</strong> {BUSINESS.address}</p>
        </div>
        <ContactForm />
        <div style={{ marginTop: '40px' }}>
          <Link href="/" style={{ color: '#853423', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
