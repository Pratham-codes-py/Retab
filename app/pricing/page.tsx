import Link from 'next/link';

export const metadata = {
  title: 'Pricing — Retab Plans',
  description: 'Simple pricing for independent cafes. ₹499 or ₹999 per month.',
};

export default function PricingPage() {
  return (
    <div style={{ background: '#fcf9f8', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#853423', letterSpacing: '-0.02em', marginBottom: '12px' }}>Pricing</h1>
        <p style={{ fontSize: '16px', color: '#55423e', marginBottom: '48px' }}>One plan for every cafe size. No hidden fees. Cancel anytime.</p>
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div style={{ background: '#fff', border: '1px solid #dbc1bb', borderRadius: '12px', padding: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1c1b1b', marginBottom: '8px' }}>Starter</h2>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#853423', marginBottom: '16px' }}>₹499<span style={{ fontSize: '16px', fontWeight: 400, color: '#55423e', marginLeft: '4px' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['Up to 100 digital bills/month', 'WhatsApp billing', 'Automatic review request', 'Basic analytics'].map(i => <li key={i} style={{ padding: '6px 0', fontSize: '15px', color: '#55423e', borderBottom: '1px solid #f0ebe6' }}>{i}</li>)}
            </ul>
          </div>
          <div style={{ background: '#fff', border: '2px solid #853423', borderRadius: '12px', padding: '32px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '24px', background: '#853423', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>Most popular</div>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1c1b1b', marginBottom: '8px' }}>Standard</h2>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#853423', marginBottom: '16px' }}>₹999<span style={{ fontSize: '16px', fontWeight: 400, color: '#55423e', marginLeft: '4px' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['Unlimited digital bills', 'WhatsApp billing', 'Automatic review request', 'Full analytics + staff performance', 'Priority support'].map(i => <li key={i} style={{ padding: '6px 0', fontSize: '15px', color: '#55423e', borderBottom: '1px solid #f0ebe6' }}>{i}</li>)}
            </ul>
          </div>
        </div>
        <div style={{ marginTop: '40px' }}>
          <Link href="/" style={{ color: '#853423', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
