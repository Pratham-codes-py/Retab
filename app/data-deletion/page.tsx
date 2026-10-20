import Link from 'next/link';

export const metadata = { title: 'Data Deletion — Retab', description: 'How to request deletion of your data.' };

export default function DataDeletionPage() {
  return (
    <div style={{ background: '#fcf9f8', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#853423', letterSpacing: '-0.02em', marginBottom: '24px' }}>Data Deletion</h1>
        <p style={{ fontSize: '15px', color: '#55423e', lineHeight: 1.7, marginBottom: '16px' }}>You can request deletion of your cafe data at any time. Email <a href="mailto:hello@retab.in" style={{ color: '#853423' }}>hello@retab.in</a> with the subject "Data Deletion Request" and your cafe ID.</p>
        <p style={{ fontSize: '15px', color: '#55423e', lineHeight: 1.7, marginBottom: '16px' }}>We will delete all associated data within 30 days and confirm once complete.</p>
        <p style={{ fontSize: '15px', color: '#55423e', lineHeight: 1.7 } }>If you have billing records tied to regulations, those may be retained only as required by law.</p>
        <div style={{ marginTop: '40px' }}>
          <Link href="/" style={{ color: '#853423', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
