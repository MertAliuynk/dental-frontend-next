"use client";
// import Topbar from "../../components/Topbar";
import { useState, useEffect,useRef } from "react";
import { CSSTransition } from "react-transition-group";
import { jwtDecode } from "jwt-decode";
import { useSearchParams, useRouter } from "next/navigation";


const diseaseList: string[] = [
  "Kalp hastalıkları",
  "Şeker hastalığı",
  "Tansiyon sorunu",
  "Epilepsi (sara)",
  "Guatr (Trold tabletleri)",
  "Kan hastalıkları",
  "İlaç alerjisi",
  "Akciğer hastalıkları",
  "Sinüzit",
  "AIDS",
  "Ateşli romatizma",
  "Hepatit",
  "Eklem romatizması",
  "Astım, saman nezlesi",
  "Böbrek karaciğer",
  "Zührevi hastalık bozuklukları"
];

export default function NewPatientPageClient() {
  // Ref for CSSTransition node
  const diseaseListRef = useRef<HTMLDivElement>(null);
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
      hastaliklar: string[];
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
      hastaliklar: [],
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
      if (key === "hastaliklar") {
        // Çoklu checkbox için
        const val = value;
        setForm(f => ({ ...f, anamnez: { ...f.anamnez, hastaliklar: val } }));
      } else {
        setForm(f => ({ ...f, anamnez: { ...f.anamnez, [key]: type === "checkbox" ? checked : value } }));
      }
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
                  hastaliklar: [],
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
    <main className="np-main">
      <h2 className="np-title">{editingPatientId ? 'Hasta Bilgilerini Düzenle' : 'Hasta Bilgilerini Tanımla'}</h2>
      <form onSubmit={handleSubmit} className="np-form">
        {message && (
          <div className={message.includes("başarı") ? "np-msg-success" : "np-msg-error"}>{message}</div>
        )}
        {/* Hasta Bilgileri */}
        <section className="np-card np-two-col">
          <div className="np-col">
            <label className="np-label">Adı:*
              <input name="firstName" value={form.firstName} onChange={handleChange} required className="np-input" />
            </label>
            <label className="np-label">Soyadı:*
              <input name="lastName" value={form.lastName} onChange={handleChange} required className="np-input" />
            </label>
            <label className="np-label">Telefon numarası:*
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                maxLength={11}
                className={`np-input${phoneError ? ' np-input-error' : ''}`}
              />
              {phoneError && <span className="np-error-text">{phoneError}</span>}
            </label>
            <label className="np-label">Tc kimlik no:*
              <input
                name="tc"
                value={form.tc}
                onChange={handleChange}
                required={!editingPatientId}
                maxLength={11}
                disabled={!!editingPatientId}
                className={`np-input${tcError ? ' np-input-error' : ''}`}
                style={editingPatientId ? { color: '#888' } : {}}
              />
              {tcError && <span className="np-error-text">{tcError}</span>}
            </label>
          </div>
          <div className="np-col">
            <label className="np-label">İlgili Doktor(lar) Seç:*</label>
            <div className="np-doctor-list">
              {doctors.map((d: any) => (
                <label key={d.user_id} className="np-doctor-item">
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
            <label className="np-label">Doğum Tarihi:*
              <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} required className="np-input" />
            </label>
          </div>
        </section>

        {/* Anamnez Bilgileri */}
        <section className="np-card">
          <h3 className="np-section-title">Anamnez Bilgileri</h3>
          <div className="np-anamnez-row">
            <div className="np-anamnez-col">
              <label className="np-label">Şu anda herhangi bir tedavi görüyor musunuz? İlaç kullanıyor musunuz?
                <textarea name="anamnez.tedavi" value={form.anamnez.tedavi} onChange={handleChange} className="np-input" />
              </label>
              <label className="np-label">Herhangi bir hastalığınız var mı? Geçirdiniz mi?
                <textarea name="anamnez.hastalik" value={form.anamnez.hastalik} onChange={handleChange} className="np-input" />
              </label>
              <label className="np-label np-checkbox-label">
                <input type="checkbox" name="anamnez.hastalikList" checked={form.anamnez.hastalikList} onChange={handleChange} />
                Hastalık Listesini Göster
              </label>
              <CSSTransition
                in={form.anamnez.hastalikList}
                timeout={200}
                classNames="disease-list"
                unmountOnExit
                nodeRef={diseaseListRef}
              >
                <div ref={diseaseListRef} className="disease-list-box" style={{ marginTop: 8, border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#f9fafb', boxShadow: '0 2px 8px #0001', maxWidth: 340 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                    <div style={{ minWidth: 150 }}>
                      {diseaseList.slice(0, Math.ceil(diseaseList.length/2)).map((disease: string, idx: number) => (
                        <label key={disease} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontSize: 16, cursor: 'pointer', color: '#1e293b', fontWeight: 700 }}>
                          <input
                            type="checkbox"
                            name="anamnez.hastaliklar"
                            checked={form.anamnez.hastaliklar?.includes(disease)}
                            onChange={e => {
                              const newList = e.target.checked
                                ? [...(form.anamnez.hastaliklar || []), disease]
                                : (form.anamnez.hastaliklar || []).filter((d: string) => d !== disease);
                              handleChange({ target: { name: "anamnez.hastaliklar", value: newList } });
                            }}
                            style={{ marginRight: 8 }}
                          />
                          {disease}
                        </label>
                      ))}
                    </div>
                    <div style={{ minWidth: 150 }}>
                      {diseaseList.slice(Math.ceil(diseaseList.length/2)).map((disease: string, idx: number) => (
                        <label key={disease} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontSize: 16, cursor: 'pointer', color: '#1e293b', fontWeight: 700 }}>
                          <input
                            type="checkbox"
                            name="anamnez.hastaliklar"
                            checked={form.anamnez.hastaliklar?.includes(disease)}
                            onChange={e => {
                              const newList = e.target.checked
                                ? [...(form.anamnez.hastaliklar || []), disease]
                                : (form.anamnez.hastaliklar || []).filter((d: string) => d !== disease);
                              handleChange({ target: { name: "anamnez.hastaliklar", value: newList } });
                            }}
                            style={{ marginRight: 8 }}
                          />
                          {disease}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CSSTransition>
              <label className="np-label">Baş ve boyun bölgesinde radyoterapi gördünüz mü?
                <div className="np-toggle-row">
                  <button
                    type="button"
                    className={`np-toggle-btn${form.anamnez.radyoterapi === "evet" ? " selected" : ""}`}
                    onClick={() => handleChange({ target: { name: "anamnez.radyoterapi", value: "evet", type: "radio" } })}
                  >Evet</button>
                  <button
                    type="button"
                    className={`np-toggle-btn${form.anamnez.radyoterapi === "hayir" ? " selected" : ""}`}
                    onClick={() => handleChange({ target: { name: "anamnez.radyoterapi", value: "hayir", type: "radio" } })}
                  >Hayır</button>
                </div>
              </label>
              <label className="np-label">Cerrahi müdahale veya yaralanma sonrası kanama uzun sürer mi?
                <div className="np-toggle-row">
                  <button
                    type="button"
                    className={`np-toggle-btn${form.anamnez.kanama === "evet" ? " selected" : ""}`}
                    onClick={() => handleChange({ target: { name: "anamnez.kanama", value: "evet", type: "radio" } })}
                  >Evet</button>
                  <button
                    type="button"
                    className={`np-toggle-btn${form.anamnez.kanama === "hayir" ? " selected" : ""}`}
                    onClick={() => handleChange({ target: { name: "anamnez.kanama", value: "hayir", type: "radio" } })}
                  >Hayır</button>
                </div>
              </label>
            </div>
            <div className="np-anamnez-col">
              <label className="np-label">İlaç alerjiniz var mı?
                <textarea name="anamnez.ilacAlerji" value={form.anamnez.ilacAlerji} onChange={handleChange} className="np-input" />
              </label>
              <label className="np-label">Bunların dışında herhangi bir tıbbi sorununuz var mı?
                <textarea name="anamnez.digerSorun" value={form.anamnez.digerSorun} onChange={handleChange} className="np-input" />
              </label>
              <label className="np-label">Kadınlarda hamilelik, düşük, adet ve menapoz bilgileri
                <textarea name="anamnez.kadinBilgi" value={form.anamnez.kadinBilgi} onChange={handleChange} className="np-input" />
              </label>
              <label className="np-label">Kötü alışkanlıklarınız var mı?
                <textarea name="anamnez.kotuAliskanlik" value={form.anamnez.kotuAliskanlik} onChange={handleChange} className="np-input" />
              </label>
              <label className="np-label">En son dişhekimi muayenesi, tedavisi?
                <textarea name="anamnez.disMuayene" value={form.anamnez.disMuayene} onChange={handleChange} className="np-input" />
              </label>
            </div>
          </div>
          <div className="np-btn-row">
            <button type="submit" className="np-btn" disabled={loading}>
              {loading ? (editingPatientId ? 'Güncelleniyor...' : 'Kaydediliyor...') : (editingPatientId ? 'Hasta Bilgilerini Güncelle' : 'Hasta Bilgilerini Kaydet')}
            </button>
          </div>
        </section>
      </form>
      <style jsx global>{`
        .np-main {
          padding: 32px;
          min-height: 100vh;
          background: linear-gradient(120deg, #f5f6fa 60%, #e3eaff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .np-title {
          font-weight: 900;
          font-size: 2rem;
          margin-bottom: 24px;
          color: #1976d2;
          letter-spacing: 0.5px;
          text-shadow: 0 2px 8px #e3eaff77;
        }
        .np-form {
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .np-card {
          background: #fff;
          border-radius: 18px;
          padding: 28px 24px;
          box-shadow: 0 4px 24px #1976d211, 0 1.5px 8px #1976d222;
          animation: np-fade-in .5s cubic-bezier(.4,0,.2,1);
        }
        .np-two-col {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
        }
        .np-col {
          flex: 1 1 260px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .np-label {
          color: #1a237e;
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 2px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .np-checkbox-label {
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }
        .np-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1.5px solid #dbeafe;
          font-size: 15px;
          margin-top: 4px;
          margin-bottom: 4px;
          background: #f8fafc;
          transition: border .18s, box-shadow .18s;
        }
        .np-input:focus {
          border: 1.5px solid #1976d2;
          box-shadow: 0 0 0 2px #e3eaff77;
          outline: none;
        }
        .np-input-error {
          border: 2px solid #dc2626 !important;
          background: #fef2f2 !important;
        }
        .np-error-text {
          color: #dc2626;
          font-size: 13px;
        }
        .np-doctor-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 8px;
        }
        .np-doctor-item {
          font-weight: 500;
          font-size: 15px;
          color: #222;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
        }
        .np-section-title {
          font-weight: 900;
          font-size: 1.3rem;
          margin-bottom: 18px;
          color: #1976d2;
          letter-spacing: 0.2px;
        }
        .np-anamnez-row {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
        }
        .np-anamnez-col {
          flex: 1 1 260px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .np-btn-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 28px;
        }
        .np-btn {
          background: linear-gradient(90deg, #1976d2 60%, #0a2972 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 12px 32px;
          font-weight: 800;
          font-size: 17px;
          cursor: pointer;
          box-shadow: 0 2px 8px #1976d244;
          transition: background .18s, box-shadow .18s, transform .18s;
        }
        .np-btn:hover:not(:disabled) {
          background: linear-gradient(90deg, #0a2972 60%, #1976d2 100%);
          box-shadow: 0 8px 32px #1976d244;
          transform: translateY(-2px) scale(1.03);
        }
        .np-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .np-msg-success {
          color: #059669;
          font-weight: 700;
          margin-bottom: 8px;
          background: #e0f7ef;
          border-radius: 8px;
          padding: 8px 16px;
          box-shadow: 0 1px 4px #05966922;
        }
        .np-msg-error {
          color: #b91c1c;
          font-weight: 700;
          margin-bottom: 8px;
          background: #fef2f2;
          border-radius: 8px;
          padding: 8px 16px;
          box-shadow: 0 1px 4px #b91c1c22;
        }
        @media (max-width: 900px) {
          .np-form { max-width: 100vw; }
          .np-two-col, .np-anamnez-row { flex-direction: column; gap: 18px; }
        }
        @media (max-width: 600px) {
          .np-main { padding: 8px; }
          .np-card { padding: 14px 6px; }
          .np-title { font-size: 1.2rem; }
        }
        @keyframes np-fade-in {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }
        .np-toggle-row {
          display: flex;
          gap: 14px;
          margin-top: 6px;
        }
        .np-toggle-btn {
          background: #f3f6fd;
          color: #1976d2;
          border: 1.5px solid #dbeafe;
          border-radius: 8px;
          padding: 7px 22px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: background .18s, color .18s, border .18s, box-shadow .18s;
          box-shadow: 0 1px 4px #1976d211;
        }
        .np-toggle-btn.selected {
          background: linear-gradient(90deg, #1976d2 60%, #0a2972 100%);
          color: #fff;
          border: 2px solid #1976d2;
          box-shadow: 0 2px 8px #1976d244;
        }
        .np-toggle-btn:active {
          transform: scale(0.97);
        }
      `}</style>
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
