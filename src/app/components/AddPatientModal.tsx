import React, { useState, useEffect } from 'react';

export default function AddPatientModal({ open, onClose, doctors, onSave }: { open: boolean, onClose: () => void, doctors: any[], onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    tcNumber: '',
    phone: '',
    birthDate: '',
    doctorIds: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addedPatient, setAddedPatient] = useState<any | null>(null);

  // Hasta eklenince özet modalı açılırken, ekleme modalı kapanmalı
  if (!open && !addedPatient) return null;

  return (
  <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, minWidth: 340, maxWidth: 400, width: '100%', boxShadow: '0 2px 16px #0003' }}>
        <h3 style={{ marginBottom: 16, color: '#0a2972', fontWeight: 900, fontSize: 22, letterSpacing: '0.5px' }}>Hasta Ekle</h3>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6, color: '#0f172a', letterSpacing: '0.5px' }}>Ad</div>
            <input placeholder="Ad" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontWeight: 800, color: '#1e293b' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6, color: '#0f172a', letterSpacing: '0.5px' }}>Soyad</div>
            <input placeholder="Soyad" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontWeight: 800, color: '#1e293b' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6, color: '#0f172a', letterSpacing: '0.5px' }}>TC Kimlik No</div>
            <input placeholder="TC Kimlik No" value={form.tcNumber} maxLength={11} onChange={e => setForm(f => ({ ...f, tcNumber: e.target.value.replace(/[^0-9]/g, '') }))} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontWeight: 800, color: '#1e293b' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6, color: '#0f172a', letterSpacing: '0.5px' }}>Telefon No</div>
            <input placeholder="Telefon No" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, '') }))} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontWeight: 800, color: '#1e293b' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6, color: '#0f172a', letterSpacing: '0.5px' }}>Doğum Tarihi</div>
            <input type="date" placeholder="Doğum Tarihi" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontWeight: 800, color: '#1e293b' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6, color: '#0f172a', letterSpacing: '0.5px' }}>İlgili Doktor(lar)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto', padding: '6px 0' }}>
              {doctors.map((d: any) => (
                <label key={d.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    value={String(d.user_id)}
                    checked={form.doctorIds.includes(String(d.user_id))}
                    onChange={e => {
                      const checked = e.target.checked;
                      setForm(f => {
                        let doctorIds = f.doctorIds;
                        if (checked) {
                          doctorIds = [...doctorIds, String(d.user_id)];
                        } else {
                          doctorIds = doctorIds.filter(id => id !== String(d.user_id));
                        }
                        return { ...f, doctorIds };
                      });
                    }}
                    style={{ accentColor: '#3174ad', width: 18, height: 18 }}
                  />
                  {d.first_name} {d.last_name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 8, border: '2px solid #dc2626', background: '#ef4444', color: '#fff', fontWeight: 900 }}>İptal</button>
          <button
            onClick={async () => {
              setLoading(true);
              setError(null);
              setSuccess(null);
              // Basit validasyon
              const missingFields: string[] = [];
              if (!form.firstName) missingFields.push('Ad');
              if (!form.lastName) missingFields.push('Soyad');
              if (!form.tcNumber) missingFields.push('TC Kimlik No');
              if (!form.phone) missingFields.push('Telefon No');
              if (!form.birthDate) missingFields.push('Doğum Tarihi');
              if (form.doctorIds.length === 0) missingFields.push('Doktor Seçimi');
              if (missingFields.length > 0) {
                setError(`Eksik alan(lar): ${missingFields.join(', ')}`);
                setLoading(false);
                return;
              }
              if (!/^\d{11}$/.test(form.tcNumber)) {
                setError('TC Kimlik No 11 haneli olmalı.');
                setLoading(false);
                return;
              }
              if (!/^\d{10,11}$/.test(form.phone)) {
                setError('Telefon numarası 10 veya 11 haneli olmalı.');
                setLoading(false);
                return;
              }
              try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) headers.Authorization = `Bearer ${token}`;
                const res = await fetch('https://dentalapi.karadenizdis.com/api/patient', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    tc: form.tcNumber,
                    phone: form.phone,
                    birthDate: form.birthDate,
                    doctors: form.doctorIds
                  })
                });
                const data = await res.json();
                if (data.success && data.data) {
                  setSuccess('Hasta başarıyla eklendi!');
                  setAddedPatient(data.data);
                  setForm({ firstName: '', lastName: '', tcNumber: '', phone: '', birthDate: '', doctorIds: [] });
                } else {
                  setError(data.message || 'Kayıt sırasında hata oluştu.');
                }
              } catch (err) {
                setError('Sunucu hatası. Lütfen tekrar deneyin.');
              } finally {
                setLoading(false);
              }
            }}
            style={{ padding: '10px 16px', borderRadius: 8, border: '2px solid #3174ad', background: '#3174ad', color: '#fff', fontWeight: 900 }}
            disabled={loading}
          >{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
        </div>
        {error && (
          <div style={{ color: '#dc2626', fontWeight: 700, marginTop: 12 }}>
            {error.startsWith('Eksik alan(lar):')
              ? error.replace('Eksik alan(lar): ', '').split(', ').map((field, idx) => (
                  <div key={idx}>• <b>{field}</b> alanı boş bırakılamaz.</div>
                ))
              : error}
          </div>
        )}
        {success && <div style={{ color: '#22c55e', fontWeight: 700, marginTop: 12 }}>{success}</div>}
        {/* Hasta eklendikten sonra özet modalı */}
        {addedPatient && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 28, minWidth: 340, maxWidth: 400, width: '100%', boxShadow: '0 2px 16px #0003', position: 'relative' }}>
              <h3 style={{ marginBottom: 16, color: '#0a2972', fontWeight: 900, fontSize: 22, letterSpacing: '0.5px' }}>Hasta Eklendi</h3>
              <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: 17 }}>
                  <span style={{ fontWeight: 900 }}>Ad Soyad:</span> <a href={`/patients/card/?id=${addedPatient.patient_id || addedPatient.id || ''}`} style={{ color: '#3174ad', textDecoration: 'underline', cursor: 'pointer', fontWeight: 900 }}>{addedPatient.first_name || addedPatient.firstName || ''} {addedPatient.last_name || addedPatient.lastName || ''}</a>
                </div>
                <div style={{ fontWeight: 900, color: '#1e293b' }}><span style={{ fontWeight: 900 }}>TC Kimlik No:</span> {addedPatient.tc_number || addedPatient.tc || ''}</div>
                <div style={{ fontWeight: 900, color: '#1e293b' }}><span style={{ fontWeight: 900 }}>Telefon No:</span> {addedPatient.phone || ''}</div>
                <div style={{ fontWeight: 900, color: '#1e293b' }}><span style={{ fontWeight: 900 }}>Doğum Tarihi:</span> {(addedPatient.birth_date || addedPatient.birthDate || '').toString().substring(0,10)}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => { if (onSave) onSave(addedPatient); setAddedPatient(null); onClose(); }} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '2px solid #3174ad', background: '#3174ad', color: '#fff', fontWeight: 900 }}>Kapat</button>
                <button
                  onClick={() => {
                    window.location.href = `/patients/new?id=${addedPatient.patient_id || addedPatient.id || ''}`;
                  }}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '2px solid #0a2972', background: '#0a2972', color: '#fff', fontWeight: 900 }}
                >Düzenle</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
