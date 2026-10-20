import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Retab',
};

export default function PrivacyPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#f6f3f2',
      color: '#3b3028',
    }}>
    <div style={{
      maxWidth: '680px',
      margin: '0 auto',
      padding: '64px 24px 80px',
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
      lineHeight: 1.7,
    }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#853423' }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: '14px', color: '#876a5f', marginBottom: '40px' }}>
        Last updated: October 18, 2026
      </p>

      <Section title="What we collect">
        <p>Retab collects two categories of information:</p>
        <ul>
          <li>
            <strong>Cafe owner account data</strong> — your name, email address, and cafe details
            provided when you sign up or configure your account.
          </li>
          <li>
            <strong>Customer billing data</strong> — customer names and WhatsApp phone numbers
            that cafe staff enter when generating a bill, along with the associated order items
            and amounts.
          </li>
        </ul>
        <p>
          We also store <strong>order history</strong> linked to each customer phone number so
          cafes can view past visits through the dashboard.
        </p>
      </Section>

      <Section title="Why we collect it">
        <ul>
          <li>
            <strong>WhatsApp bills</strong> — customer phone numbers are used to send a
            digital bill via WhatsApp at the time of checkout.
          </li>
          <li>
            <strong>Review requests</strong> — after a visit, we may send a single follow-up
            WhatsApp message asking the customer to leave a review for the cafe.
          </li>
          <li>
            <strong>Dashboard &amp; analytics</strong> — order history helps cafe owners
            understand revenue and customer visit patterns inside the Retab dashboard.
          </li>
        </ul>
      </Section>

      <Section title="How data is shared">
        <p>
          We <strong>do not sell, rent, or trade</strong> any personal data to third parties.
        </p>
        <p>
          Customer phone numbers and order data are shared only with the specific cafe that
          generated the transaction. Cafe owners can view their own customers' data; they cannot
          see data from other cafes on the platform.
        </p>
        <p>
          We use Supabase for database hosting and the WhatsApp Business API (Meta) to deliver
          messages. These providers process data on our behalf and are bound by their own privacy
          and security standards.
        </p>
      </Section>

      <Section title="Data retention">
        <p>
          Account and order data is retained for as long as your cafe account is active.
          If you close your account, contact us and we will delete your data within 30 days.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can request access to, correction of, or deletion of any personal data we hold
          about you by emailing us. If you are a customer whose number was used by a cafe on
          Retab and you would like your data removed, email us with your phone number and we
          will delete it.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For any privacy questions or requests, email us at{' '}
          <a href="mailto:privacy@retab.app" style={{ color: '#853423' }}>
            privacy@retab.app
          </a>
          .
        </p>
      </Section>
    </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '36px' }}>
      <h2 style={{
        fontSize: '17px',
        fontWeight: 600,
        marginBottom: '12px',
        color: '#853423',
        borderBottom: '1px solid #dbc1bb',
        paddingBottom: '8px',
      }}>
        {title}
      </h2>
      <div style={{ fontSize: '15px', color: '#3b3028', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {children}
      </div>
    </section>
  );
}
