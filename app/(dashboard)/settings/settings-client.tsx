'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Design tokens (Stitch project)
// ---------------------------------------------------------------------------
const T = {
  primary: '#853423',
  primaryContainer: '#a44b38',
  onPrimary: '#ffffff',
  secondary: '#576158',
  surface: '#fcf9f8',
  surfaceContainerLow: '#f6f3f2',
  surfaceContainerHighest: '#e5e2e1',
  surfaceVariant: '#e5e2e1',
  onSurface: '#1c1b1b',
  onSurfaceVariant: '#55423e',
  outline: '#88726d',
  outlineVariant: '#dbc1bb',
  success: '#059669',
} as const;

export default function SettingsClient({ initialCafe }: { initialCafe: any }) {
  const supabase = createClient();
  const [googleLink, setGoogleLink] = useState(initialCafe?.google_review_link || 'https://g.page/r/greenbeans-cafe');
  const [taxPercent, setTaxPercent] = useState(initialCafe?.tax_percent?.toString() || '5');
  const [isSavingTax, setIsSavingTax] = useState(false);
  const [isSavingGoogleLink, setIsSavingGoogleLink] = useState(false);
  
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Staff');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await fetch('/api/staff');
        const data = await res.json();
        if (data.staff) {
          setStaff(data.staff);
        }
      } catch (err) {
        console.error('Error loading staff:', err);
      } finally {
        setIsLoadingStaff(false);
      }
    }
    loadStaff();
  }, []);

  const handleRemoveStaff = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member? Their access will be immediately revoked.')) {
      return;
    }
    try {
      const res = await fetch(`/api/staff?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStaff(prev => prev.filter(s => s.id !== id));
      } else {
        alert(data.error || 'Failed to remove staff member');
      }
    } catch (err) {
      console.error('Error deleting staff:', err);
      alert('Error deleting staff member');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPin || !newStaffRole) return;
    if (!/^\d{4}$/.test(newStaffPin)) {
      alert('PIN must be exactly 4 digits');
      return;
    }
    setIsSavingStaff(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStaffName, role: newStaffRole, pin: newStaffPin })
      });
      const data = await res.json();
      if (res.ok && data.staff) {
        const formattedNewStaff = {
          id: data.staff.id,
          name: data.staff.name,
          role: data.staff.role === 'manager' ? 'Manager' : 'Cashier',
          pin: data.staff.pin,
          initials: data.staff.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        };
        setStaff(prev => [...prev, formattedNewStaff]);
        setNewStaffName('');
        setNewStaffPin('');
        setNewStaffRole('Staff');
        setIsAddingStaff(false);
      } else {
        alert(data.error || 'Failed to add staff member');
      }
    } catch (err) {
      console.error('Error adding staff:', err);
      alert('Error saving staff member');
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleSaveGoogleLink = async () => {
    if (!initialCafe) return;
    setIsSavingGoogleLink(true);
    const link = googleLink.trim();

    const { error } = await supabase
      .from('cafes')
      .update({ google_review_link: link })
      .eq('id', initialCafe.id);

    setIsSavingGoogleLink(false);
    if (error) {
      console.error('Error saving Google link:', error);
      alert('Failed to save Google review link: ' + error.message);
    } else {
      alert('Google review link updated successfully');
    }
  };

  const handleSaveTax = async () => {
    if (!initialCafe) return;
    setIsSavingTax(true);
    const numericTax = parseFloat(taxPercent);
    
    if (isNaN(numericTax) || numericTax < 0) {
      alert("Please enter a valid tax percentage");
      setIsSavingTax(false);
      return;
    }

    const { error } = await supabase
      .from('cafes')
      .update({ tax_percent: numericTax })
      .eq('id', initialCafe.id);

    setIsSavingTax(false);
    if (error) {
      console.error('Error saving tax:', error);
      alert('Failed to save tax percentage: ' + error.message);
    } else {
      alert('Tax percentage updated successfully');
    }
  };

  return (
    <div style={{ padding: '0px 0px 40px 0px', maxWidth: '1000px', margin: '0 auto' }}>
      <style>{`
        .panel {
          background: #ffffff;
          border: 1px solid ${T.outlineVariant};
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
        }
        
        .dark-panel {
          background: #6a635d;
          border-radius: 12px;
          padding: 24px;
          color: #ffffff;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .icon-box {
          width: 40px; height: 40px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }

        .panel-title {
          font-size: 16px;
          font-weight: 700;
          color: ${T.onSurface};
          margin-bottom: 2px;
        }
        .panel-subtitle {
          font-size: 12px;
          color: ${T.onSurfaceVariant};
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: ${T.surfaceContainerLow};
          padding: 14px 16px;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .btn-outline {
          background: transparent;
          color: ${T.primary};
          border: 1px solid ${T.primary};
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
          width: 100%;
        }
        .btn-outline:hover { background: #fff5f5; }

        .btn-solid-dark {
          background: ${T.primary};
          color: ${T.onPrimary};
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-solid-dark:hover { opacity: 0.9; }

        .input-field {
          width: 100%;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid ${T.outlineVariant};
          font-size: 14px;
          color: ${T.onSurface};
          outline: none;
          background: #ffffff;
        }
      `}</style>

      {/* Header */}
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: T.primary, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Retab Settings
        </h2>
        <p style={{ fontSize: '15px', color: T.onSurfaceVariant }}>
          Configure your cafe's digital presence and staff access.
        </p>
      </header>

      <div style={{ display: 'grid', gap: '24px' }}>
        
        {/* TOP ROW: WhatsApp (2/3) + Plan (1/3) */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* WhatsApp Connection */}
          <div className="panel">
            <div className="panel-header">
              <div className="icon-box" style={{ background: '#e0f2f1', color: '#00695c' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat</span>
              </div>
              <div>
                <h3 className="panel-title">WhatsApp Connection</h3>
                <p className="panel-subtitle">Automatic receipt delivery and marketing</p>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div className="info-row">
                <span style={{ fontSize: '14px', color: T.onSurfaceVariant }}>Connected Number</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: T.onSurface }}>+91 98765 43210</span>
              </div>
              <div className="info-row" style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', color: T.onSurfaceVariant }}>Template Status</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Approved
                </span>
              </div>
            </div>

            <button className="btn-outline">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
              Reconnect WhatsApp
            </button>
          </div>

          {/* Plan & Credits */}
          <div className="dark-panel">
            <div className="panel-header" style={{ marginBottom: '32px' }}>
              <div className="icon-box" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>credit_card</span>
              </div>
              <div>
                <h3 className="panel-title" style={{ color: '#fff', fontSize: '16px' }}>Plan & Credits</h3>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Current Tier</p>
              <h4 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px', lineHeight: 1.2 }}>Starter Plan</h4>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>Monthly Credits</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>187 / 250</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: '75%', background: '#ffb4a8', borderRadius: '9999px' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', textAlign: 'right', marginBottom: '24px' }}>
                Resetting in 12 days
              </p>
            </div>

            <button style={{
              background: '#ffffff', color: '#374151', border: 'none', padding: '12px 16px', borderRadius: '8px',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: '100%'
            }}>
              Top Up Credits
            </button>
          </div>

        </div>

        {/* MIDDLE ROW: Billing Settings (1/3) + Review Link (1/3) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Billing Settings */}
          <div className="panel" style={{ background: T.surfaceContainerLow }}>
            <div className="panel-header">
              <div className="icon-box" style={{ background: '#dbece5', color: '#3f6250' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>receipt_long</span>
              </div>
              <div>
                <h3 className="panel-title">Billing Setup</h3>
                <p className="panel-subtitle">Configure tax rates and receipts</p>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: T.onSurfaceVariant, marginBottom: '8px' }}>
                Tax Percentage (%)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  type="number" 
                  min="0"
                  step="0.1"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="input-field" 
                  style={{ flex: 1 }}
                />
                <button 
                  onClick={handleSaveTax}
                  disabled={isSavingTax}
                  style={{
                    background: T.primary, color: T.onPrimary, border: 'none', padding: '0 24px',
                    borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: isSavingTax ? 'not-allowed' : 'pointer',
                    opacity: isSavingTax ? 0.7 : 1
                  }}
                >
                  Save
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', marginTop: '2px' }}>info</span>
                This tax will be added to all new orders on the billing page.
              </p>
            </div>
          </div>

          {/* Review Link */}
          <div className="panel" style={{ background: T.surfaceContainerLow }}>
            <div className="panel-header">
              <div className="icon-box" style={{ background: '#dbece5', color: '#3f6250' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>star</span>
              </div>
              <div>
                <h3 className="panel-title">Review Link</h3>
                <p className="panel-subtitle">Send customers to Google Maps</p>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: T.onSurfaceVariant, marginBottom: '8px' }}>
                Google Business Profile URL
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  value={googleLink}
                  onChange={(e) => setGoogleLink(e.target.value)}
                  className="input-field" 
                  style={{ flex: 1 }}
                />
                <button 
                  onClick={handleSaveGoogleLink}
                  disabled={isSavingGoogleLink}
                  style={{
                    background: T.primary, color: T.onPrimary, border: 'none', padding: '0 24px',
                    borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: isSavingGoogleLink ? 'not-allowed' : 'pointer',
                    opacity: isSavingGoogleLink ? 0.7 : 1
                  }}
                >
                  Save
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', marginTop: '2px' }}>info</span>
                This link is added to WhatsApp receipts automatically.
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Staff Login Link & Staff Management */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          
          {/* Staff Login Link Section */}
          <div className="panel" style={{ background: T.surfaceContainerLow }}>
            <div className="panel-header">
              <div className="icon-box" style={{ background: '#dbece5', color: '#3f6250' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock_open</span>
              </div>
              <div>
                <h3 className="panel-title">Staff Terminal Credentials</h3>
                <p className="panel-subtitle">Share these credentials with your staff. They can log in to the billing terminal using their 4-digit PIN.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {/* URL */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: T.onSurfaceVariant, marginBottom: '6px', fontWeight: 600 }}>
                  Staff Login URL
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={origin ? `${origin}/staff-login` : 'Loading login URL...'}
                    className="input-field" 
                    style={{ flex: 1, background: '#e5e2e1', cursor: 'text' }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button 
                    onClick={() => {
                      if (origin) {
                        navigator.clipboard.writeText(`${origin}/staff-login`);
                        alert('Staff login URL copied to clipboard!');
                      }
                    }}
                    style={{
                      background: T.primary, color: T.onPrimary, border: 'none', padding: '0 24px',
                      borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Copy URL
                  </button>
                </div>
              </div>

              {/* Cafe Code */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: T.onSurfaceVariant, marginBottom: '6px', fontWeight: 600 }}>
                  Cafe ID (Terminal Code)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={initialCafe?.cafe_code || 'Generating Cafe ID...'}
                    className="input-field" 
                    style={{ flex: 1, background: '#e5e2e1', cursor: 'text', fontWeight: 700, letterSpacing: '1px' }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button 
                    onClick={() => {
                      if (initialCafe?.cafe_code) {
                        navigator.clipboard.writeText(initialCafe.cafe_code);
                        alert('Cafe ID copied to clipboard!');
                      } else {
                        alert('Cafe ID is not loaded yet.');
                      }
                    }}
                    style={{
                      background: T.primary, color: T.onPrimary, border: 'none', padding: '0 24px',
                      borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Copy ID
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', marginTop: '2px' }}>info</span>
                Staff can bookmark the Login URL on the counter tablet to sign in directly using the Cafe ID and their 4-digit PIN.
              </p>
            </div>
          </div>

          {/* Staff Management */}
          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div className="panel-header" style={{ marginBottom: 0 }}>
                <div className="icon-box" style={{ background: '#e5e7eb', color: '#4b5563' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock_person</span>
                </div>
                <div>
                  <h3 className="panel-title">Staff Management</h3>
                  <p className="panel-subtitle">Manage secure PINs for terminal access</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddingStaff(!isAddingStaff)}
                className="btn-solid-dark"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                Add Staff
              </button>
            </div>

            {/* Inline Add Staff Form */}
            {isAddingStaff && (
              <form onSubmit={handleAddStaff} style={{
                background: T.surfaceContainerLow,
                border: `1px solid ${T.outlineVariant}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', color: T.onSurfaceVariant }}>Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Rahul Kumar" 
                    value={newStaffName} 
                    onChange={e => setNewStaffName(e.target.value)} 
                    className="input-field" 
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', color: T.onSurfaceVariant }}>Role</label>
                  <select 
                    value={newStaffRole} 
                    onChange={e => setNewStaffRole(e.target.value)} 
                    className="input-field" 
                    style={{ padding: '8px 12px', height: '42px' }}
                  >
                    <option value="Staff">Cashier</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', color: T.onSurfaceVariant }}>4-Digit PIN</label>
                  <input 
                    type="text" 
                    pattern="\d{4}" 
                    maxLength={4} 
                    required 
                    placeholder="1234" 
                    value={newStaffPin} 
                    onChange={e => setNewStaffPin(e.target.value)} 
                    className="input-field" 
                    style={{ padding: '8px 12px', textAlign: 'center' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" disabled={isSavingStaff} className="btn-solid-dark" style={{ height: '42px', padding: '0 16px' }}>
                    {isSavingStaff ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setIsAddingStaff(false)} className="btn-outline" style={{ height: '42px', padding: '0 16px', width: 'auto' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {isLoadingStaff ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: T.onSurfaceVariant }}>
                Loading staff members...
              </div>
            ) : staff.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: T.onSurfaceVariant, fontStyle: 'italic' }}>
                No staff members configured. Click "Add Staff" to create one.
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {staff.map((member, i) => (
                  <div key={member.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: i < staff.length - 1 ? `1px solid ${T.surfaceVariant}` : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', background: '#f5ebe9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700, color: T.primary
                      }}>
                        {member.initials}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: T.onSurface, marginBottom: '2px' }}>{member.name}</h4>
                        <p style={{ fontSize: '13px', color: T.onSurfaceVariant }}>{member.role}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '16px', color: T.onSurfaceVariant, letterSpacing: '2px' }}>{member.pin || '****'}</span>
                      
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <button 
                          onClick={() => handleRemoveStaff(member.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.onSurfaceVariant, display: 'flex' }}
                          title="Remove Staff"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: T.primary }}>delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: `1px solid ${T.surfaceVariant}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 800, color: T.onSurface, marginBottom: '4px' }}>Retab</h4>
          <p style={{ fontSize: '12px', color: T.onSurfaceVariant }}>© 2024 Retab. Made for Indian Cafes.</p>
        </div>
        <div style={{ display: 'flex', gap: '48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="#" style={{ fontSize: '13px', color: T.onSurfaceVariant, textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ fontSize: '13px', color: T.onSurfaceVariant, textDecoration: 'none' }}>Terms of Service</a>
          </div>
          <div>
            <a href="#" style={{ fontSize: '13px', color: T.onSurfaceVariant, textDecoration: 'none' }}>Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
