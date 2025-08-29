"use client";
// import Topbar from "../../components/Topbar";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useSearchParams, useRouter } from "next/navigation";

export default function NewPatientPageClient() {
  // Validasyon state'leri (hook'lar component fonksiyonunun içinde olmalı)
  const [tcError, setTcError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const editingPatientId = searchParams.get('id');
  // Hasta Bilgileri state
  const [form, setForm] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    tc: string;
    doctors: string[];
    birthDate: string;
    anamnez: {
      tedavi: string;
      hastalik: string;
      hastalikList: boolean;
      radyoterapi: string;
      kanama: string;
      ilacAlerji: string;
      digerSorun: string;
      kadinBilgi: string;
      kotuAliskanlik: string;
      disMuayene: string;
    };
  }>({
    firstName: "",
    lastName: "",
    phone: "",
    tc: "",
    doctors: [],
    birthDate: "",
    anamnez: {
      tedavi: "",
      hastalik: "",
      hastalikList: false,
      radyoterapi: "",
      kanama: "",
      ilacAlerji: "",
      digerSorun: "",
      kadinBilgi: "",
      kotuAliskanlik: "",
      disMuayene: ""
    }
  });

  // Doktorlar state
  const [doctors, setDoctors] = useState<any[]>([]);
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let branchId = null;
    let decoded = null;
    if (token) {
      try {
        decoded = jwtDecode<any>(token);
        branchId = decoded.branch_id || decoded.branchId || null;
      } catch (e) {
        console.log("JWT decode error:", e);
      }
    }
    console.log("TOKEN:", token);
    console.log("DECODED:", decoded);
    console.log("BRANCH_ID:", branchId);
    fetch("https://dentalapi.karadenizdis.com/api/user/doctors")
      .then(res => res.json())
      .then(data => {
        console.log("API DOCTORS:", data.data);
        if (data.success) {
          // branchId ve doktorların branch_id değerlerini logla
          console.log("branchId (type):", typeof branchId, branchId);
          data.data.forEach((d: any) => {
            console.log(`doctor_id: ${d.user_id}, branch_id (type):`, typeof d.branch_id, d.branch_id);
          });
          if (branchId !== null && branchId !== undefined && branchId !== "") {
            const filtered = data.data.filter((d: any) => String(d.branch_id) === String(branchId));
            console.log("FILTERED DOCTORS:", filtered);
            setDoctors(filtered);
          } else {
            setDoctors(data.data);
          }
        } else setDoctors([]);
      })
      .catch((err) => {
        console.log("API ERROR:", err);
        setDoctors([]);
      });
  }, []);

  // Edit modunda hasta bilgisini çek ve formu doldur
  useEffect(() => {
    const loadPatientForEdit = async () => {
      if (!editingPatientId) return;
      try {
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/patient/${editingPatientId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const p = data.data;
          setForm(f => ({
            ...f,
            firstName: p.first_name || "",
            lastName: p.last_name || "",
            phone: p.phone || "",
            tc: p.tc_number || "",
            doctors: p.doctors ? p.doctors.map((d: any) => String(d.doctor_id)) : [],
            birthDate: p.birth_date ? p.birth_date.split('T')[0] : "",
            // Not: anamnez ayrı tabloda; basitçe boş bırakıyoruz veya ileride doldurulabilir
          }));
        }
      } catch {}
    };
    loadPatientForEdit();
  }, [editingPatientId]);

  // Form input değişimi
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (name === "tc") {
      // Sadece rakam girilsin
      if (!/^\d*$/.test(value)) return;
      setForm(f => ({ ...f, tc: value }));
      if (value.length === 0) {
        setTcError("");
      } else if (value.length !== 11) {
        setTcError("TC Kimlik No 11 haneli olmalı.");
      } else {
        setTcError("");
      }
      return;
    }
    if (name === "phone") {
      // Sadece rakam girilsin
      if (!/^\d*$/.test(value)) return;
      setForm(f => ({ ...f, phone: value }));
      if (value.length === 0) {
        setPhoneError("");
      } else if (value.length !== 10 && value.length !== 11) {
        setPhoneError("Telefon numarası 10 veya 11 haneli olmalı.");
      } else {
        setPhoneError("");
      }
      return;
    }
    if (name === "doctors") {
      // Çoklu select için
      const options = e.target.options as HTMLOptionsCollection;
      const selected: string[] = Array.from(options).filter((o: any) => o.selected).map((o: any) => o.value);
      setForm(f => ({ ...f, doctors: selected }));
      return;
    }
    if (name.startsWith("anamnez.")) {
      const key = name.replace("anamnez.", "");
      setForm(f => ({ ...f, anamnez: { ...f.anamnez, [key]: type === "checkbox" ? checked : value } }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  // Form gönderme (gerçek API)
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
        const isEdit = Boolean(editingPatientId);
        if (!form.firstName || !form.lastName || !form.phone || !form.birthDate || !Array.isArray(form.doctors) || form.doctors.length === 0) {
          setMessage("Lütfen tüm hasta bilgilerini ve en az bir doktoru seçin.");
          setLoading(false);
          return;
        }
        // Sadece yeni hasta eklerken TC zorunlu
        if (!isEdit) {
          if (!form.tc) {
            setMessage("TC Kimlik No zorunlu.");
            setLoading(false);
            return;
          }
          if (form.tc.length !== 11) {
            setMessage("TC Kimlik No 11 haneli olmalı.");
            setLoading(false);
            return;
          }
        }
        if (form.phone.length !== 10 && form.phone.length !== 11) {
          setMessage("Telefon numarası 10 veya 11 haneli olmalı.");
          setLoading(false);
          return;
        }
        try {
          // Token'ı localStorage'dan al
          const token = localStorage.getItem('token');
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          if (isEdit) {
            // Hasta bilgilerini güncelle
            const url = `https://dentalapi.karadenizdis.com/api/patient/${editingPatientId}`;
            const bodyObj: any = {
              firstName: form.firstName,
              lastName: form.lastName,
              phone: form.phone,
              birthDate: form.birthDate,
              anamnez: form.anamnez
            };
            const res = await fetch(url, {
              method: "PUT",
              headers,
              body: JSON.stringify(bodyObj)
            });
            const data = await res.json();
            if (data.success) {
              // Doktor ilişkilerini güncelle
              await fetch(`https://dentalapi.karadenizdis.com/api/patient/${editingPatientId}/doctors`, {
                method: "POST",
                headers,
                body: JSON.stringify({ doctorIds: form.doctors.map(Number) })
              });
              setMessage("Hasta başarıyla güncellendi!");
              router.push(`/patients/card/?id=${editingPatientId}`);
              return;
            } else {
              setMessage(data.message || "Kayıt sırasında hata oluştu.");
            }
          } else {
            // Yeni hasta ekle
            const url = "https://dentalapi.karadenizdis.com/api/patient";
            const bodyObj: any = {
              firstName: form.firstName,
              lastName: form.lastName,
              phone: form.phone,
              doctors: form.doctors,
              birthDate: form.birthDate,
              anamnez: form.anamnez,
              tc: form.tc
            };
            const res = await fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify(bodyObj)
            });
            const data = await res.json();
            if (data.success) {
              setMessage("Hasta başarıyla kaydedildi!");
              setForm({
                firstName: "",
                lastName: "",
                phone: "",
                tc: "",
                doctors: [],
                birthDate: "",
                anamnez: {
                  tedavi: "",
                  hastalik: "",
                  hastalikList: false,
                  radyoterapi: "",
                  kanama: "",
                  ilacAlerji: "",
                  digerSorun: "",
                  kadinBilgi: "",
                  kotuAliskanlik: "",
                  disMuayene: ""
                }
              });
            } else {
              setMessage(data.message || "Kayıt sırasında hata oluştu.");
            }
          }
        } catch (err) {
          setMessage("Sunucu hatası. Lütfen tekrar deneyin.");
        } finally {
          setLoading(false);
        }
  };

  return (
    <main style={{ padding: 32, minHeight: "100vh", background: "#f5f6fa" }}>
        <h2 style={{ fontWeight: 800, fontSize: 26, marginBottom: 24, color: "#0a2972" }}>{editingPatientId ? 'Hasta Bilgilerini Düzenle' : 'Hasta Bilgilerini Tanımla'}</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {message && (
            <div style={{ color: message.includes("başarı") ? "green" : "#b91c1c", fontWeight: 700, marginBottom: 8 }}>{message}</div>
          )}
          {/* Hasta Bilgileri */}
          <section className="two-col" style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 8, boxShadow: "0 2px 8px #0001" }}>
            <div className="col" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={labelStyle}>Adı:*
                <input name="firstName" value={form.firstName} onChange={handleChange} required style={inputStyle} />
              </label>
              <label style={labelStyle}>Soyadı:*
                <input name="lastName" value={form.lastName} onChange={handleChange} required style={inputStyle} />
              </label>
              <label style={labelStyle}>Telefon numarası:*
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  maxLength={11}
                  style={{
                    ...inputStyle,
                    border: phoneError ? '2px solid #dc2626' : inputStyle.border,
                    background: phoneError ? '#fef2f2' : inputStyle.background
                  }}
                />
                {phoneError && <span style={{ color: '#dc2626', fontSize: 13 }}>{phoneError}</span>}
              </label>
              <label style={labelStyle}>Tc kimlik no:*
                <input
                  name="tc"
                  value={form.tc}
                  onChange={handleChange}
                  required={!editingPatientId}
                  maxLength={11}
                  disabled={!!editingPatientId}
                  style={{
                    ...inputStyle,
                    border: tcError ? '2px solid #dc2626' : inputStyle.border,
                    background: tcError ? '#fef2f2' : inputStyle.background,
                    color: editingPatientId ? '#888' : undefined
                  }}
                />
                {tcError && <span style={{ color: '#dc2626', fontSize: 13 }}>{tcError}</span>}
              </label>
            </div>
            <div className="col" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={labelStyle}>İlgili Doktor(lar) Seç:*</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {doctors.map((d: any) => (
                  <label key={d.user_id} style={{ fontWeight: 500, fontSize: 15, color: '#222', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      name="doctors"
                      value={d.user_id}
                      checked={form.doctors.includes(String(d.user_id))}
                      onChange={e => {
                        const checked = e.target.checked;
                        const value = String(d.user_id);
                        setForm(f => ({
                          ...f,
                          doctors: checked
                            ? [...f.doctors, value]
                            : f.doctors.filter(id => id !== value)
                        }));
                      }}
                      required={form.doctors.length === 0}
                    />
                    {d.first_name} {d.last_name}
                  </label>
                ))}
              </div>
              <label style={labelStyle}>Doğum Tarihi:*
                <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} required style={inputStyle} />
              </label>
            </div>
            {/* Üste bulunan buton KALDIRILDI */}
          </section>

          {/* Anamnez Bilgileri */}
          <section style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px #0001" }}>
            <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 16, color: "#0a2972" }}>Anamnez Bilgileri</h3>
            <div style={{ display: "flex", gap: 32 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                <label style={labelStyle}>Şu anda herhangi bir tedavi görüyor musunuz? İlaç kullanıyor musunuz?
                  <textarea name="anamnez.tedavi" value={form.anamnez.tedavi} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>Herhangi bir hastalığınız var mı? Geçirdiniz mi?
                  <textarea name="anamnez.hastalik" value={form.anamnez.hastalik} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" name="anamnez.hastalikList" checked={form.anamnez.hastalikList} onChange={handleChange} />
                  Hastalık Listesini Göster
                </label>
                <label style={labelStyle}>Baş ve boyun bölgesinde radyoterapi gördünüz mü?<br />
                  <input type="radio" name="anamnez.radyoterapi" value="evet" checked={form.anamnez.radyoterapi === "evet"} onChange={handleChange} /> Evet
                  <input type="radio" name="anamnez.radyoterapi" value="hayir" checked={form.anamnez.radyoterapi === "hayir"} onChange={handleChange} style={{ marginLeft: 12 }} /> Hayır
                </label>
                <label style={labelStyle}>Cerrahi müdahale veya yaralanma sonrası kanama uzun sürer mi?<br />
                  <input type="radio" name="anamnez.kanama" value="evet" checked={form.anamnez.kanama === "evet"} onChange={handleChange} /> Evet
                  <input type="radio" name="anamnez.kanama" value="hayir" checked={form.anamnez.kanama === "hayir"} onChange={handleChange} style={{ marginLeft: 12 }} /> Hayır
                </label>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                <label style={labelStyle}>İlaç alerjiniz var mı?
                  <textarea name="anamnez.ilacAlerji" value={form.anamnez.ilacAlerji} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>Bunların dışında herhangi bir tıbbi sorununuz var mı?
                  <textarea name="anamnez.digerSorun" value={form.anamnez.digerSorun} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>Kadınlarda hamilelik, düşük, adet ve menapoz bilgileri
                  <textarea name="anamnez.kadinBilgi" value={form.anamnez.kadinBilgi} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>Kötü alışkanlıklarınız var mı?
                  <textarea name="anamnez.kotuAliskanlik" value={form.anamnez.kotuAliskanlik} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>En son dişhekimi muayenesi, tedavisi?
                  <textarea name="anamnez.disMuayene" value={form.anamnez.disMuayene} onChange={handleChange} style={inputStyle} />
                </label>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button type="submit" style={buttonStyle} disabled={loading}>
                {loading ? (editingPatientId ? 'Güncelleniyor...' : 'Kaydediliyor...') : (editingPatientId ? 'Hasta Bilgilerini Güncelle' : 'Hasta Bilgilerini Kaydet')}
              </button>
            </div>
          </section>
        </form>
    </main>
  );
}

const labelStyle = {
  color: "#1a237e",
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 2,
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #dbeafe",
  fontSize: 15,
  marginTop: 4,
  marginBottom: 4,
  background: "#f8fafc"
};

const buttonStyle = {
  background: "#0a2972",
  color: "white",
  border: 0,
  borderRadius: 8,
  padding: "10px 24px",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer"
};
