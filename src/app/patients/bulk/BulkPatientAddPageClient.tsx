
"use client";
import AppLayout from "../../components/AppLayout";
import { useState, useEffect } from "react";
import Select from "react-select";
import "./bulk-patient.css";

const MAX_ROWS = 25;

export default function BulkPatientAddPageClient() {
  const [rows, setRows] = useState(
    Array.from({ length: MAX_ROWS }, () => ({
      firstName: "",
      lastName: "",
      tc: "",
      phone: "",
      birthDate: "",
      doctors: [] as { value: string; label: string }[],
      error: false
    }))
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [errorList, setErrorList] = useState<{ index: number; tc: string; error: string }[]>([]);

  useEffect(() => {
    let branchId = null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        const base64 = token.split('.')[1];
        const decoded = JSON.parse(atob(base64));
        branchId = decoded.branch_id || decoded.branchId || null;
      } catch (e) {}
    }
    fetch("https://dentalapi.karadenizdis.com/api/user/doctors")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (branchId !== null && branchId !== undefined && branchId !== "") {
            const filtered = data.data.filter((d: any) => String(d.branch_id) === String(branchId));
            setDoctors(filtered);
          } else {
            setDoctors(data.data);
          }
        } else setDoctors([]);
      })
      .catch(() => setDoctors([]));
  }, []);

  const handleChange = (idx: number, field: string, value: any) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      if (field === "doctors") {
        return { ...row, doctors: value };
      }
      return { ...row, [field]: value };
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    setErrorList([]);

    let hasError = false;
    const newRows = rows.map((row, i) => {
      const { firstName, lastName, tc, phone, birthDate, doctors } = row;
      let error = false;
      if ((firstName || lastName || tc || phone || birthDate || (doctors && doctors.length)) && (!firstName || !lastName || !tc || !phone || !birthDate || !doctors || doctors.length === 0)) {
        error = true;
        hasError = true;
      }
      if (tc && (!/^\d{11}$/.test(tc))) {
        error = true;
        hasError = true;
      }
      if (phone && (!/^\d{10,11}$/.test(phone))) {
        error = true;
        hasError = true;
      }
      return { ...row, error };
    });
    setRows(newRows);
    if (hasError) {
      setMessage("Eksik veya hatalı bilgi olan satırlar var. Lütfen kontrol edin.");
      setLoading(false);
      return;
    }

    const validRows = rows
      .filter(r => r.firstName && r.lastName && r.tc && r.phone && r.birthDate && r.doctors && r.doctors.length > 0)
      .map(r => ({
        firstName: r.firstName,
        lastName: r.lastName,
        tc: r.tc,
        phone: r.phone,
        birthDate: r.birthDate,
        doctors: r.doctors.map((d: any) => d.value)
      }));
    if (validRows.length === 0) {
      setMessage("En az bir hasta bilgisi girilmelidir.");
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch("https://dentalapi.karadenizdis.com/api/patient/bulk", {
        method: "POST",
        headers,
        body: JSON.stringify({ patients: validRows })
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          setMessage("Bazı hastalar başarıyla eklendi, aşağıdaki satırlarda hata var:");
          setErrorList(data.errors);
        } else {
          setMessage("Tüm hastalar başarıyla eklendi!");
          setRows(Array.from({ length: MAX_ROWS }, () => ({ firstName: "", lastName: "", tc: "", phone: "", birthDate: "", doctors: [], error: false })));
          setErrorList([]);
        }
      } else {
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          setErrorList(data.errors);
          setMessage(null);
        } else {
          setErrorList([]);
          setMessage(data.message || "Kayıt sırasında hata oluştu.");
        }
      }
    } catch (err) {
      setMessage("Sunucu hatası. Lütfen tekrar deneyin.");
      setErrorList([]);
    } finally {
      setLoading(false);
    }
  };

  // react-select için doktor seçenekleri
  const doctorOptions = doctors.map((d: any) => ({ value: d.user_id, label: `${d.first_name} ${d.last_name}` }));

  return (
    <AppLayout>
      <main className="bulk-patient-container">
        <h2 className="bulk-patient-title">Toplu Hasta Ekleme</h2>
        <form onSubmit={handleSubmit} className="bulk-patient-form">
          {message && <div className={"bulk-patient-message" + (message.includes("başarı") ? " success" : "")}>{message}</div>}
          {errorList.length > 0 && (
            <div className="bulk-patient-message error">
              <b>Hatalı Satırlar:</b>
              <ul style={{ marginTop: 8 }}>
                {errorList.map((err, i) => (
                  <li key={i}>
                    <b>{err.index}. satır</b> - TC: {err.tc || "-"} - <span style={{ color: "#c00" }}>{err.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="bulk-patient-table-wrapper">
            <table className="bulk-patient-table">
              <thead>
                <tr>
                  <th>Adı</th>
                  <th>Soyadı</th>
                  <th>Tc kimlik</th>
                  <th>Tel no</th>
                  <th>Doğum tarihi</th>
                  <th>İlgili Doktor(lar)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={row.error ? "bulk-patient-row-error" : ""} style={{ transition: 'background 0.3s' }}>
                    <td><input className="bulk-patient-input" value={row.firstName} onChange={e => handleChange(i, "firstName", e.target.value)} required={false} placeholder="Adı" /></td>
                    <td><input className="bulk-patient-input" value={row.lastName} onChange={e => handleChange(i, "lastName", e.target.value)} required={false} placeholder="Soyadı" /></td>
                    <td><input className="bulk-patient-input" value={row.tc} onChange={e => handleChange(i, "tc", e.target.value)} required={false} placeholder="TC Kimlik No" maxLength={11} /></td>
                    <td><input className="bulk-patient-input" value={row.phone} onChange={e => handleChange(i, "phone", e.target.value)} required={false} placeholder="Telefon No" maxLength={11} /></td>
                    <td><input className="bulk-patient-input" type="date" value={row.birthDate} onChange={e => handleChange(i, "birthDate", e.target.value)} required={false} /></td>
                    <td style={{ minWidth: 180 }}>
                      <Select
                        isMulti
                        options={doctorOptions}
                        value={row.doctors}
                        onChange={(val: any) => handleChange(i, "doctors", val)}
                        classNamePrefix="bulk-patient-select"
                        placeholder="Doktor seçin..."
                        styles={{
                          control: (base: any) => ({ ...base, minHeight: 36, borderRadius: 8, borderColor: row.error ? '#dc2626' : base.borderColor }),
                          menu: (base: any) => ({ ...base, zIndex: 9999 }),
                          option: (base: any, state: any) => ({
                            ...base,
                            color: state.isSelected || state.isFocused ? '#1e293b' : '#0f172a',
                            fontWeight: 700,
                            backgroundColor: state.isSelected ? '#e0e7ff' : state.isFocused ? '#f1f5f9' : base.backgroundColor,
                          }),
                          singleValue: (base: any) => ({ ...base, color: '#0f172a', fontWeight: 700 }),
                          multiValueLabel: (base: any) => ({ ...base, color: '#0f172a', fontWeight: 700 }),
                        }}
                        noOptionsMessage={() => "Doktor bulunamadı"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="submit" className="bulk-patient-btn" disabled={loading} style={{ minWidth: 220, fontSize: 18, fontWeight: 800, borderRadius: 12, boxShadow: '0 2px 12px #2563eb22', background: 'linear-gradient(90deg,#2563eb,#1d4ed8)', color: '#fff', transition: 'background 0.2s, box-shadow 0.2s', padding: '16px 0', letterSpacing: '0.5px' }}>{loading ? "Kaydediliyor..." : "Tüm Hastaları Kaydet"}</button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}


