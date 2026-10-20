'use client';

export default function ContactForm() {
  return (
    <form onSubmit={e => { e.preventDefault(); alert('Message submitted (demo).'); }} style={{ background: '#fff', border: '1px solid #dbc1bb', borderRadius: '12px', padding: '32px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1b1b', marginBottom: '16px' }}>Send a message</h2>
      <div style={{ display: 'grid', gap: '16px' }}>
        <input placeholder="Name" required style={{ padding: '12px 16px', border: '1px solid #dbc1bb', borderRadius: '8px', fontFamily: 'inherit', fontSize: '15px' }} />
        <input type="email" placeholder="Email" required style={{ padding: '12px 16px', border: '1px solid #dbc1bb', borderRadius: '8px', fontFamily: 'inherit', fontSize: '15px' }} />
        <textarea placeholder="Your message" rows={4} required style={{ padding: '12px 16px', border: '1px solid #dbc1bb', borderRadius: '8px', fontFamily: 'inherit', fontSize: '15px', resize: 'vertical' }} />
        <button type="submit" style={{ padding: '12px 24px', background: '#853423', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>Send</button>
      </div>
    </form>
  );
}
