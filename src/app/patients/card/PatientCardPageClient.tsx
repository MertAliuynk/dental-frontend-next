  // Onaylanan tedavileri önerilen olarak geri al
"use client";


import AppLayout from "../../components/AppLayout";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
// import Topbar kaldırıldı
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";


export default function PatientCardPageClient() {
  // Türkçe karakterleri Latin harfe çeviren fonksiyon
  const sanitizeText = (text: string) =>
    text
      .replace(/ı/g, "i")
      .replace(/İ/g, "I")
      .replace(/ş/g, "s")
      .replace(/Ş/g, "S")
      .replace(/ğ/g, "g")
      .replace(/Ğ/g, "G")
      .replace(/ü/g, "u")
      .replace(/Ü/g, "U")
      .replace(/ö/g, "o")
      .replace(/Ö/g, "O")
      .replace(/ç/g, "c")
      .replace(/Ç/g, "C");
  const [printModalOpen, setPrintModalOpen] = useState(false);
  // Not ekleme modalı için state
  const [addNoteModal, setAddNoteModal] = useState(false);
  const [addNoteValue, setAddNoteValue] = useState("");
  // Hasta notları için state
  const [notesOpen, setNotesOpen] = useState(false);
  const [patientNotes, setPatientNotes] = useState<any[]>([]);
  // Hasta notu güncelleme modalı için state
  const [editNoteModal, setEditNoteModal] = useState(false);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [patient, setPatient] = useState<any>(null);

  // Modal açıldığında mevcut notu göster
  useEffect(() => {
    if (editNoteModal && patient) {
      setEditNoteValue(patient.notes || "");
    }
  }, [editNoteModal, patient]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const [anamnesis, setAnamnesis] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorNames, setDoctorNames] = useState<string[]>([]);
  const [anamnesisOpen, setAnamnesisOpen] = useState(false);
  const [selectedTreatments, setSelectedTreatments] = useState<number[]>([]);
  const [approvingTreatments, setApprovingTreatments] = useState(false);
  const [selectedApprovedTreatments, setSelectedApprovedTreatments] = useState<number[]>([]);
  const [selectedCompletedTreatments, setSelectedCompletedTreatments] = useState<number[]>([]);
  // Tamamlanan tedavilerde seçim toggle
  const toggleCompletedTreatmentSelection = (treatmentId: number) => {
    setSelectedCompletedTreatments(prev =>
      prev.includes(treatmentId)
        ? prev.filter(id => id !== treatmentId)
        : [...prev, treatmentId]
    );
  };

  // Tamamlanan tedavilerde geri al (approved'a çek)
  const handleUndoCompletedTreatments = async () => {
    if (selectedCompletedTreatments.length === 0) {
      alert("Lütfen geri alınacak tedavileri seçin");
      return;
    }
    if (!window.confirm(`${selectedCompletedTreatments.length} tedavi onaylanan olarak geri alınacak. Emin misiniz?`)) return;
    try {
      const promises = selectedCompletedTreatments.map(treatmentId =>
        fetch(`https://dentalapi.karadenizdis.com/api/treatment/${treatmentId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'onaylanan' })
        }).then(res => res.json())
      );
      const results = await Promise.all(promises);
      const allSuccessful = results.every(result => result.success);
      if (allSuccessful) {
        // Tedavi listesini yenile
        const treatmentsRes = await fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`);
        const treatmentsData = await treatmentsRes.json();
        if (treatmentsData.success) {
          setTreatments(treatmentsData.data);
        }
        setSelectedCompletedTreatments([]);
      } else {
        alert("Bazı tedaviler geri alınamadı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Undo completed treatments error:', error);
      alert("Tedaviler geri alınırken hata oluştu");
    }
  };
  const [completingTreatments, setCompletingTreatments] = useState(false);
  const [role, setRole] = useState<string>("");
  const [branchId, setBranchId] = useState<number>(1);
  const [priceMap, setPriceMap] = useState<Record<number, { base: number; upper: number; lower: number; isPerTooth: boolean; isJawSpecific: boolean }>>({});

  useEffect(() => {
    if (!patientId) return;
    try { 
      setRole(localStorage.getItem('role') || '');
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const b = u?.branchId || u?.branch_id;
        if (b) setBranchId(Number(b));
      }
    } catch {}
    setLoading(true);
    Promise.all([
      fetch(`https://dentalapi.karadenizdis.com/api/patient/${patientId}`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/patient-anamnesis/${patientId}`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/treatment-type`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/appointment?patient_id=${patientId}`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/patient/all-doctors-relations`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/user?role=doctor`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/patient-notes/patient/${patientId}`).then(r => r.json()),
    ])
      .then(async ([p, t, a, tt, ap, rel, docList, notesRes]) => {
        if (!p.success) throw new Error("Hasta bulunamadı");
        setPatient(p.data);
        setTreatments((t.success && t.data) ? t.data : []);
        setAnamnesis((a.success && a.data) ? a.data : []);
        setTreatmentTypes((tt.success && tt.data) ? tt.data : []);
        setAppointments((ap.success && ap.data) ? ap.data : []);
        // İlgili doktorlar
        let names: string[] = [];
        if (rel.success && Array.isArray(rel.data) && docList.success && Array.isArray(docList.data)) {
          const patientDoctorIds = rel.data.filter((r: any) => r.patient_id == patientId).map((r: any) => r.doctor_id);
          names = docList.data.filter((d: any) => patientDoctorIds.includes(d.user_id)).map((d: any) => d.first_name + " " + d.last_name);
        }
        setDoctorNames(names);
        // Hasta notlarını al ve en yeni en üstte olacak şekilde sırala
        if (notesRes.success && Array.isArray(notesRes.data)) {
          setPatientNotes([...notesRes.data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } else {
          setPatientNotes([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Veriler alınamadı");
        setLoading(false);
      });
  }, [patientId]);

  const suggestedTreatments = treatments.filter((tr: any) => tr.status === "önerilen");
  const approvedTreatments = treatments.filter((tr: any) => tr.status === "onaylanan");
  const completedTreatments = treatments.filter((tr: any) => tr.status === "tamamlanan");

  // Aktif fiyat listesini çek
  useEffect(() => {
    const loadPrices = async () => {
      try {
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/price-list?branch_id=${branchId}&active_only=true`);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data) || data.data.length === 0) { setPriceMap({}); return; }
        const active = data.data[0];
  const res2 = await fetch(`https://dentalapi.karadenizdis.com/api/price-list/${active.price_list_id}`);
        const data2 = await res2.json();
        if (!data2.success) { setPriceMap({}); return; }
        const items = data2.data.items || [];
        const map: Record<number, any> = {};
        for (const it of items) {
          const tt = (treatmentTypes || []).find((x: any) => x.treatment_type_id === it.treatment_type_id);
          map[it.treatment_type_id] = {
            base: Number(it.base_price) || 0,
            upper: Number(it.upper_jaw_price) || 0,
            lower: Number(it.lower_jaw_price) || 0,
            isPerTooth: !!tt?.is_per_tooth,
            isJawSpecific: !!tt?.is_jaw_specific,
          };
        }
        setPriceMap(map);
      } catch { setPriceMap({}); }
    };
    loadPrices();
  }, [branchId, treatmentTypes]);

  const showTotals = role === 'admin';
  const getUnitPrice = (treatmentTypeId: number, upper: boolean, lower: boolean) => {
    const pm = priceMap[treatmentTypeId];
    if (!pm) return 0;
    if (pm.isJawSpecific) {
      if (upper && !lower) return pm.upper || pm.base;
      if (lower && !upper) return pm.lower || pm.base;
      return pm.base;
    }
    return pm.base;
  };
  const getTreatmentQty = (tr: any) => {
    const pm = priceMap[tr.treatment_type_id];
    if (!pm) return 1;
    if (pm.isPerTooth) {
      const teeth = tr.tooth_numbers || tr.toothNumbers || [];
      return Array.isArray(teeth) ? teeth.length : 1;
    }
    return 1;
  };
  const getLineTotal = (tr: any) => {
    const pm = priceMap[tr.treatment_type_id];
    if (!pm) return 0;
    const teeth = tr.tooth_numbers || tr.toothNumbers || [];
    if (pm.isJawSpecific) {
      // Charge once per jaw (upper/lower), even if multiple teeth selected in that jaw
  const isUpperFDI = (n: number) => (n >= 11 && n <= 18) || (n >= 21 && n <= 28) || (n >= 51 && n <= 55) || (n >= 61 && n <= 65);
  const isLowerFDI = (n: number) => (n >= 31 && n <= 38) || (n >= 41 && n <= 48) || (n >= 71 && n <= 75) || (n >= 81 && n <= 85);
      const isUpperSeq = (n: number) => n >= 1 && n <= 16;
      const isLowerSeq = (n: number) => n >= 17 && n <= 32;
      const isUpper = (n: number) => isUpperFDI(n) || isUpperSeq(n);
      const isLower = (n: number) => isLowerFDI(n) || isLowerSeq(n);
      const hasUpper = (!!tr.is_upper_jaw || !!tr.isUpperJaw) || (Array.isArray(teeth) && teeth.some((n: number) => isUpper(n)));
      const hasLower = (!!tr.is_lower_jaw || !!tr.isLowerJaw) || (Array.isArray(teeth) && teeth.some((n: number) => isLower(n)));
      let total = 0;
      if (hasUpper) total += (pm.upper || pm.base);
      if (hasLower) total += (pm.lower || pm.base);
      if (!hasUpper && !hasLower) total += pm.base; // fallback
      return total;
    }
    // Not jaw-specific
    const qty = getTreatmentQty(tr);
    return (pm.base) * qty;
  };
  const suggestedTotal = suggestedTreatments.reduce((sum, tr) => sum + getLineTotal(tr), 0);

  // Tedavi onaylama fonksiyonu
  const handleApproveTreatments = async () => {
    if (selectedTreatments.length === 0) {
      alert("Lütfen onaylanacak tedavileri seçin");
      return;
    }

    try {
      setApprovingTreatments(true);
      
      // Seçilen tedavilerin durumunu "onaylanan" olarak güncelle
      const promises = selectedTreatments.map(treatmentId =>
  fetch(`https://dentalapi.karadenizdis.com/api/treatment/${treatmentId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'onaylanan' })
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      
      // Tüm işlemler başarılı mı kontrol et
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        
        
        // Tedavi listesini yenile
  const treatmentsRes = await fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`);
        const treatmentsData = await treatmentsRes.json();
        if (treatmentsData.success) {
          setTreatments(treatmentsData.data);
        }
        
        // Seçimleri temizle
        setSelectedTreatments([]);
      } else {
        alert("Bazı tedaviler onaylanamadı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Approve treatments error:', error);
      alert("Tedaviler onaylanırken hata oluştu");
    } finally {
      setApprovingTreatments(false);
    }
  };

  // Tedavi tamamlama fonksiyonu
  const handleCompleteTreatments = async () => {
    if (selectedApprovedTreatments.length === 0) {
      alert("Lütfen tamamlanacak tedavileri seçin");
      return;
    }

    try {
      setCompletingTreatments(true);
      
      // Seçilen tedavilerin durumunu "tamamlanan" olarak güncelle
      const promises = selectedApprovedTreatments.map(treatmentId =>
  fetch(`https://dentalapi.karadenizdis.com/api/treatment/${treatmentId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'tamamlanan' })
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      
      // Tüm işlemler başarılı mı kontrol et
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        
        
        // Tedavi listesini yenile
  const treatmentsRes = await fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`);
        const treatmentsData = await treatmentsRes.json();
        if (treatmentsData.success) {
          setTreatments(treatmentsData.data);
        }
        
        // Seçimleri temizle
        setSelectedApprovedTreatments([]);
      } else {
        alert("Bazı tedaviler tamamlanamadı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Complete treatments error:', error);
      alert("Tedaviler tamamlanırken hata oluştu");
    } finally {
      setCompletingTreatments(false);
    }
  };


  // Önerilen tedaviler için seçim toggle
  const toggleTreatmentSelection = (treatmentId: number) => {
    setSelectedTreatments(prev =>
      prev.includes(treatmentId)
        ? prev.filter(id => id !== treatmentId)
        : [...prev, treatmentId]
    );
  };

  // Onaylanan tedaviler için seçim toggle
  const toggleApprovedTreatmentSelection = (treatmentId: number) => {
    setSelectedApprovedTreatments(prev =>
      prev.includes(treatmentId)
        ? prev.filter(id => id !== treatmentId)
        : [...prev, treatmentId]
    );
  };

  // Seçili önerilen tedavileri sil
  const handleDeleteSuggestedTreatments = async () => {
    if (selectedTreatments.length === 0) {
      alert("Lütfen silinecek tedavileri seçin");
      return;
    }
    if (!window.confirm(`${selectedTreatments.length} tedavi silinecek. Emin misiniz?`)) return;
    try {
      // Silme işlemleri
      const promises = selectedTreatments.map(treatmentId =>
        fetch(`https://dentalapi.karadenizdis.com/api/treatment/${treatmentId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }).then(res => res.json())
      );
      const results = await Promise.all(promises);
      const allSuccessful = results.every(result => result.success);
      if (allSuccessful) {
        
        // Tedavi listesini yenile
        const treatmentsRes = await fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`);
        const treatmentsData = await treatmentsRes.json();
        if (treatmentsData.success) {
          setTreatments(treatmentsData.data);
        }
        setSelectedTreatments([]);
      } else {
        alert("Bazı tedaviler silinemedi. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Delete treatments error:', error);
      alert("Tedaviler silinirken hata oluştu");
    }
  };
  const handleUndoApprovedTreatments = async () => {
    if (selectedApprovedTreatments.length === 0) {
      alert("Lütfen geri alınacak tedavileri seçin");
      return;
    }
    if (!window.confirm(`${selectedApprovedTreatments.length} tedavi önerilen olarak geri alınacak. Emin misiniz?`)) return;
    try {
      const promises = selectedApprovedTreatments.map(treatmentId =>
        fetch(`https://dentalapi.karadenizdis.com/api/treatment/${treatmentId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'önerilen' })
        }).then(res => res.json())
      );
      const results = await Promise.all(promises);
      const allSuccessful = results.every(result => result.success);
      if (allSuccessful) {
        
        // Tedavi listesini yenile
        const treatmentsRes = await fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`);
        const treatmentsData = await treatmentsRes.json();
        if (treatmentsData.success) {
          setTreatments(treatmentsData.data);
        }
        setSelectedApprovedTreatments([]);
      } else {
        alert("Bazı tedaviler geri alınamadı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Undo approved treatments error:', error);
      alert("Tedaviler geri alınırken hata oluştu");
    }
  };

  return (
      <main style={{ flex: 1, padding: 32 }}>
        {loading ? (
          <div>Yükleniyor...</div>
        ) : error ? (
          <div style={{ color: "#e53935" }}>{error}</div>
        ) : patient ? (
          <>
            {/* Üstte 3 buton */}
            <div className="pc-actions" style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 18, flexWrap: "wrap" }}>
              <button
                style={{
                  background: "#e3eafc",
                  color: "#1976d2",
                  border: "1.5px solid #b6c6e6",
                  borderRadius: 18,
                  padding: "8px 24px",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 1px 4px #e3eaff33",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                className="pc-btn"
                type="button"
                onClick={() => {
                  if (patientId) {
                    window.location.href = `/patients/card/treatment-add-page?id=${patientId}`;
                  } else {
                    window.location.href = "/patients/card/treatment-add-page";
                  }
                }}
              >
                Tedavi Ekle
              </button>
              <button
                style={{
                  background: "#e3fcec",
                  color: "#388e3c",
                  border: "1.5px solid #b6e6c6",
                  borderRadius: 18,
                  padding: "8px 24px",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 1px 4px #e3eaff33",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                className="pc-btn"
                type="button"
                onClick={() => router.push("/calendar")}
              >
                Yeni Randevu
              </button>
                <button
                  style={{
                    background: "#eaf1fb",
                    color: "#0a2972",
                    border: "1.5px solid #b6c6e6",
                    borderRadius: 18,
                    padding: "8px 24px",
                    fontWeight: 600,
                    fontSize: 15,
                    boxShadow: "0 1px 4px #e3eaff33",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  className="pc-btn"
                  type="button"
                  aria-label="Yazdır"
                  onClick={() => setPrintModalOpen(true)}
                >
                  Yazdır
                </button>
      {/* Yazdır onay modalı */}
      {printModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 32, minWidth: 320, boxShadow: "0 2px 16px #0002", textAlign: "center" }}>
            <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18, color: "#0a2972" }}>PDF Olarak Yazdır</h3>
            <div style={{ fontSize: 17, marginBottom: 24, fontWeight: 700, color: '#0a2972', letterSpacing: 0.2 }}>Hastaya önerilen, onaylanan ve tamamlanan tedaviler PDF olarak indirilecek.<br />Onaylıyor musunuz?</div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button style={{ background: "#eaf1fb", color: "#0a2972", border: "1.5px solid #b6c6e6", borderRadius: 8, padding: "8px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }} onClick={async () => {
                setPrintModalOpen(false);
                // PDF oluştur ve indir
                const doc = await PDFDocument.create();
                const font = await doc.embedFont(StandardFonts.Helvetica);
                const page = doc.addPage([595, 842]); // A4
                // Logo benzeri simge
                page.drawCircle({ x: 60, y: 820, size: 18, color: rgb(0.1,0.3,0.6) });
                page.drawText(sanitizeText("Karadeniz Dis Agiz ve Dis Sagligi Poliklinigi"), { x: 90, y: 820, size: 13, font, color: rgb(0.1,0.3,0.6) });
                page.drawText(sanitizeText("Tedavi Raporu"), { x: 90, y: 800, size: 13, font, color: rgb(0.05,0.15,0.45) });
                page.drawText(sanitizeText(`Tarih: ${new Date().toLocaleDateString()}`), { x: 420, y: 820, size: 10, font, color: rgb(0.1,0.3,0.6) });
                page.drawText(sanitizeText(`Hasta: ${patient?.first_name || ""} ${patient?.last_name || ""}`), { x: 420, y: 800, size: 12, font, color: rgb(0.05,0.15,0.45) });
                // Ayraç çizgisi
                page.drawLine({ start: { x: 40, y: 790 }, end: { x: 555, y: 790 }, color: rgb(0.7,0.8,0.9), thickness: 2 });
                // Doktorlar
                let y = 770;
                page.drawRectangle({ x: 50, y: y-2, width: 490, height: 20, color: rgb(0.93,0.96,0.99), borderColor: rgb(0.1,0.3,0.6), borderWidth: 1 });
                page.drawText(sanitizeText("Tedaviye Katkı Sağlayan Doktorlar"), { x: 55, y: y+2, size: 13, font, color: rgb(0.1,0.3,0.6) });
                y -= 18;
                doctorNames.forEach((name: string) => {
                  page.drawRectangle({ x: 50, y: y-2, width: 490, height: 14, color: rgb(0.98,0.98,1), borderColor: rgb(0.8,0.85,0.95), borderWidth: 1 });
                  page.drawText(sanitizeText(name), { x: 60, y: y+2, size: 11, font, color: rgb(0,0,0) });
                  y -= 14;
                });
                y -= 10;
                // Tedavi tabloları
                const drawTable = (title: string, items: any[]) => {
                  // Tablo başlığı kutusu (koyu arka plan, beyaz yazı)
                  page.drawRectangle({ x: 50, y: y-2, width: 490, height: 22, color: rgb(0.1,0.3,0.6), borderColor: rgb(0.1,0.3,0.6), borderWidth: 1 });
                  page.drawText(sanitizeText(title), { x: 55, y: y+2, size: 14, font, color: rgb(1,1,1) });
                  y -= 24;
                  // Kolon başlıkları (gri arka plan, koyu yazı)
                  page.drawRectangle({ x: 50, y: y-2, width: 490, height: 18, color: rgb(0.93,0.96,0.99), borderColor: rgb(0.8,0.85,0.95), borderWidth: 1 });
                  // Kolon dikey çizgileri (5 kolon: 170, 300, 400, 470)
                  page.drawLine({ start: { x: 130, y: y-2 }, end: { x: 130, y: y+16 }, color: rgb(0.7,0.8,0.9), thickness: 1 });
                  page.drawLine({ start: { x: 210, y: y-2 }, end: { x: 210, y: y+16 }, color: rgb(0.7,0.8,0.9), thickness: 1 });
                  page.drawLine({ start: { x: 300, y: y-2 }, end: { x: 300, y: y+16 }, color: rgb(0.7,0.8,0.9), thickness: 1 });
                  page.drawLine({ start: { x: 400, y: y-2 }, end: { x: 400, y: y+16 }, color: rgb(0.7,0.8,0.9), thickness: 1 });
                  page.drawText(sanitizeText("Tedavi Adı"), { x: 60, y: y+2, size: 12, font, color: rgb(0.1,0.3,0.6) });
                  page.drawText(sanitizeText("Diş No"), { x: 140, y: y+2, size: 12, font, color: rgb(0.1,0.3,0.6) });
                  page.drawText(sanitizeText("Doktor"), { x: 220, y: y+2, size: 12, font, color: rgb(0.1,0.3,0.6) });
                  page.drawText(sanitizeText("Durum"), { x: 310, y: y+2, size: 12, font, color: rgb(0.1,0.3,0.6) });
                  page.drawText(sanitizeText("Tedavi Notu"), { x: 410, y: y+2, size: 12, font, color: rgb(0.1,0.3,0.6) });
                  y -= 18;
                  // Satırlar
                  // Yardımcı: metni sütun genişliğine göre satırlara böl
                  function splitText(text: string, maxLen: number) {
                    if (!text) return ["-"];
                    text = sanitizeText(text);
                    const lines = [];
                    let current = "";
                    for (const word of text.split(" ")) {
                      if ((current + word).length > maxLen) {
                        if (current) lines.push(current.trim());
                        current = word + " ";
                      } else {
                        current += word + " ";
                      }
                    }
                    if (current.trim().length > 0) lines.push(current.trim());
                    return lines;
                  }
                  items.forEach((tr: any, idx: number) => {
                    const teeth = tr.tooth_numbers || tr.toothNumbers || [];
                    let doctorName = "-";
                    if (tr.doctor_id && Array.isArray(doctorNames) && doctorNames.length > 0) {
                      doctorName = doctorNames.find(name => name.includes(tr.doctor_name || "")) || tr.doctor_name || "-";
                    } else if (tr.doctor_name) {
                      doctorName = tr.doctor_name;
                    }
                    // Sütunlara göre karakter sınırı: Tedavi Adı(22), Diş No(18), Doktor(18), Durum(12), Not(30)
                    const columns = [
                      splitText(tr.treatment_type_name || tr.name || "Tedavi", 22),
                      splitText(Array.isArray(teeth) && teeth.length > 0 ? teeth.join(", ") : "-", 18),
                      splitText(doctorName, 18),
                      splitText(tr.status, 12),
                      splitText(tr.notes || tr.note || "-", 30)
                    ];
                    // En fazla kaç satır var?
                    const maxRows = Math.max(...columns.map(col => col.length));
                    for (let row = 0; row < maxRows; row++) {
                      // Her satırda tam tablo çizgileri ve arka plan
                      page.drawRectangle({ x: 50, y: y-2, width: 490, height: 16, color: (idx%2===0 ? rgb(0.98,0.98,1) : rgb(0.93,0.96,0.99)), borderColor: rgb(0.8,0.85,0.95), borderWidth: 1 });
                      // Dikey çizgiler
                      page.drawLine({ start: { x: 130, y: y-2 }, end: { x: 130, y: y+14 }, color: rgb(0.7,0.8,0.9), thickness: 1 });
                      page.drawLine({ start: { x: 210, y: y-2 }, end: { x: 210, y: y+14 }, color: rgb(0.7,0.8,0.9), thickness: 1 });
                      page.drawLine({ start: { x: 300, y: y-2 }, end: { x: 300, y: y+14 }, color: rgb(0.7,0.8,0.9), thickness: 1 });
                      page.drawLine({ start: { x: 400, y: y-2 }, end: { x: 400, y: y+14 }, color: rgb(0.7,0.8,0.9), thickness: 1 });
                      // Yatay çizgi (alt kenar)
                      page.drawLine({ start: { x: 50, y: y-2 }, end: { x: 540, y: y-2 }, color: rgb(0.7,0.8,0.9), thickness: 1 });
                      // Her hücreyi alt satıra yaz
                      page.drawText(columns[0][row] || "", { x: 60, y: y+2, size: 9, font, color: rgb(0,0,0) });
                      page.drawText(columns[1][row] || "", { x: 140, y: y+2, size: 9, font, color: rgb(0,0,0) });
                      page.drawText(columns[2][row] || "", { x: 220, y: y+2, size: 9, font, color: rgb(0,0,0) });
                      page.drawText(columns[3][row] || "", { x: 310, y: y+2, size: 9, font, color: rgb(0,0,0) });
                      page.drawText(columns[4][row] || "", { x: 410, y: y+2, size: 9, font, color: rgb(0,0,0) });
                      y -= 16;
                    }
                    y -= 2;
                  });
                  y -= 10;
                };
                drawTable("Önerilen Tedaviler", suggestedTreatments);
                drawTable("Onaylanan Tedaviler", approvedTreatments);
                drawTable("Tamamlanan Tedaviler", completedTreatments);
                // Alt açıklama ve imza
                page.drawLine({ start: { x: 40, y: 120 }, end: { x: 555, y: 120 }, color: rgb(0.1,0.3,0.6), thickness: 2 });
                page.drawText(sanitizeText("Bu belge Karadeniz Diş Kliniği tarafından resmi olarak düzenlenmiştir."), { x: 55, y: 100, size: 12, font, color: rgb(0.1,0.3,0.6) });
                page.drawText(sanitizeText("İmza: .................................................."), { x: 55, y: 70, size: 13, font, color: rgb(0,0,0) });
                const pdfBytes = await doc.save();
                const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `hasta-tedavi-listesi.pdf`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }, 500);
              }}>
                Onayla ve İndir
              </button>
              <button style={{ background: "#fbeaea", color: "#b91c1c", border: "1.5px solid #e6b6b6", borderRadius: 8, padding: "8px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }} onClick={() => setPrintModalOpen(false)}>
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
              <button
                style={{
                  background: "#e3eafc",
                  color: "#1976d2",
                  border: "1.5px solid #b6c6e6",
                  borderRadius: 18,
                  padding: "8px 24px",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 1px 4px #e3eaff33",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  marginLeft: 8
                }}
                className="pc-btn"
                type="button"
                onClick={() => setAddNoteModal(true)}
              >
                Not Ekle
              </button>
              <button
                style={{
                  background: "#e3eafc",
                  color: "#1976d2",
                  border: "1.5px solid #b6c6e6",
                  borderRadius: 18,
                  padding: "8px 24px",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 1px 4px #e3eaff33",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  marginLeft: 8
                }}
                className="pc-btn"
                type="button"
                onClick={() => {
                  if (patient && patient.patient_id) {
                    router.push(`/patients/new?id=${patient.patient_id}`);
                  }
                }}
              >
                Düzenle
              </button>
      {/* Not Ekleme Modalı */}
      {addNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            minWidth: 320,
            maxWidth: 400,
            boxShadow: '0 4px 24px #0002',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1976d2', marginBottom: 8 }}>Yeni Not Ekle</div>
            <textarea
              value={addNoteValue}
              onChange={e => setAddNoteValue(e.target.value)}
              style={{
                width: '100%',
                minHeight: 80,
                border: '1.5px solid #e3eafc',
                borderRadius: 8,
                padding: 10,
                fontSize: 15,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Not giriniz..."
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '8px 18px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
                onClick={() => setAddNoteModal(false)}
              >
                İptal
              </button>
              <button
                style={{
                  padding: '8px 18px',
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
                onClick={async () => {
                  try {
                    if (!addNoteValue.trim()) {
                      alert('Not boş olamaz!');
                      return;
                    }
                    const res = await fetch(`https://dentalapi.karadenizdis.com/api/patient-notes`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ patient_id: patient.patient_id, note: addNoteValue })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setAddNoteModal(false);
                      setAddNoteValue("");
                      // Yeni notu en üste ekle
                      setPatientNotes(prev => [{ ...data.data }, ...prev]);
                      
                    } else {
                      alert(data.message || 'Ekleme başarısız!');
                    }
                  } catch (err) {
                    alert('Sunucu hatası!');
                  }
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
            </div>
      {/* Not Güncelleme Modalı */}
      {editNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            minWidth: 320,
            maxWidth: 400,
            boxShadow: '0 4px 24px #0002',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#b68c00', marginBottom: 8 }}>Hasta Notunu Güncelle</div>
            <textarea
              value={editNoteValue}
              onChange={e => setEditNoteValue(e.target.value)}
              style={{
                width: '100%',
                minHeight: 80,
                border: '1.5px solid #e3eafc',
                borderRadius: 8,
                padding: 10,
                fontSize: 15,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Not giriniz..."
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '8px 18px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
                onClick={() => setEditNoteModal(false)}
              >
                İptal
              </button>
              <button
                style={{
                  padding: '8px 18px',
                  background: '#b68c00',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
                onClick={async () => {
                  try {
                    const res = await fetch(`https://dentalapi.karadenizdis.com/api/patient/${patient.patient_id}/notes`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ notes: editNoteValue })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setPatient((prev: any) => ({ ...prev, notes: editNoteValue }));
                      setEditNoteModal(false);
                      alert('Not güncellendi!');
                    } else {
                      alert(data.message || 'Güncelleme başarısız!');
                    }
                  } catch (err) {
                    alert('Sunucu hatası!');
                  }
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
            <div className="patient-card-main-grid" style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: 'flex-start', animation: 'fadeIn .5s cubic-bezier(.4,2,.6,1)' }}>
              {/* Hasta Bilgileri Kartı */}
              <div className="patient-info-card animated-card" style={{ background: "linear-gradient(120deg, #fafdff 60%, #e3eaff 100%)", borderRadius: 22, boxShadow: "0 8px 32px #0d1a4a22, 0 1.5px 0 #1976d2", padding: 28, minWidth: 260, maxWidth: 340, height: 440, flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 14, position: "relative", border: '2px solid #1976d2', transition: 'box-shadow .22s, transform .22s', animation: 'popIn .6s cubic-bezier(.4,2,.6,1)' }}>
                <div style={{ fontWeight: 900, fontSize: 22, color: "#1976d2", letterSpacing: 0.2, textShadow: "0 2px 8px #e3eaff77", display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.12"/><path d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#1976d2"/></svg>
                  {patient.first_name} {patient.last_name}
                </div>
                <div style={{ fontSize: 15, color: "#6073a6", fontWeight: 700, marginBottom: 2 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{marginRight:4,verticalAlign:'middle'}}><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.10"/><path d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#1976d2"/></svg>
                  İlgili doktor(lar): {doctorNames.length > 0 ? doctorNames.join(", ") : "-"}
                </div>
                <div style={{ fontSize: 15, color: "#2d3a4a", display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.10"/><path d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#1976d2"/></svg>
                  TC No: {role === 'doctor' ? '•••' : (patient.tc_number || "-")}
                </div>
                <div style={{ fontSize: 15, color: "#2d3a4a", display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.10"/><path d="M17 10.5c0-2.49-2.01-4.5-4.5-4.5S8 8.01 8 10.5c0 2.49 2.01 4.5 4.5 4.5s4.5-2.01 4.5-4.5zM12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#1976d2"/></svg>
                  Tel: {role === 'doctor' ? '•••' : (patient.phone || "-")}
                </div>
                <div style={{ fontSize: 15, color: "#2d3a4a", display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.10"/><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="#1976d2"/></svg>
                  Doğum Tarihi: {patient.birth_date ? patient.birth_date.slice(0,10) : "-"}
                </div>
                {/* Hasta Notları Açılır Alan */}
                <div style={{ fontSize: 15, color: "#2d3a4a", marginTop: 8, cursor: "pointer", fontWeight: 700, transition: 'color .18s' }} onClick={() => setNotesOpen(v => !v)}>
                  <span style={{ transition: 'transform .18s', display: 'inline-block', transform: notesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span> Notlar
                </div>
                {notesOpen && (
                  <div style={{ fontSize: 14, color: "#444", marginLeft: 12, maxHeight: 120, overflowY: "auto", marginTop: 4, border: "1.5px solid #e3eaff", borderRadius: 10, padding: 10, background: "#fafdff", boxShadow: '0 2px 8px #e3eaff33', animation: 'fadeIn .3s' }}>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'disc inside' }}>
                      {patientNotes.length === 0 ? <li>Not yok</li> : patientNotes.map((n, i) => (
                        <li key={n.note_id}>
                          <span style={{ fontWeight: 600, color: '#1976d2' }}>{new Date(n.created_at).toLocaleString('tr-TR')}</span>: {n.note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{ fontSize: 15, color: "#2d3a4a", marginTop: 8, cursor: "pointer", fontWeight: 700, transition: 'color .18s' }} onClick={() => setAnamnesisOpen(v => !v)}>
                  <span style={{ transition: 'transform .18s', display: 'inline-block', transform: anamnesisOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span> Anamnez
                </div>
                {anamnesisOpen && (
                  <div style={{ fontSize: 14, color: "#444", marginLeft: 12, maxHeight: 120, overflowY: "auto", marginTop: 4, border: "1.5px solid #e3eaff", borderRadius: 10, padding: 10, background: "#fafdff", boxShadow: '0 2px 8px #e3eaff33', animation: 'fadeIn .3s' }}>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'disc inside' }}>
                      {anamnesis.length === 0 ? <li>Yok</li> : anamnesis.map((a, i) => <li key={i}>{a.question}: {a.answer_text || (a.answer_boolean ? "Evet" : "Hayır")}</li>)}
                    </ul>
                  </div>
                )}
            {/* Animasyonlar ve responsive stiller */}
            <style jsx global>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(24px); }
                to { opacity: 1; transform: none; }
              }
              @keyframes popIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
              .animated-card {
                transition: box-shadow .22s, transform .22s;
              }
              .animated-card:hover {
                box-shadow: 0 12px 40px #1976d244, 0 2px 0 #1976d2;
                transform: translateY(-2px) scale(1.025);
              }
              @media (max-width: 640px) {
                .patient-card-main-grid { flex-direction: column !important; gap: 16px !important; }
                .patient-info-card { min-width: 0 !important; max-width: 100vw !important; height: auto !important; padding: 16px !important; }
                .pc-actions { gap: 10px !important; }
                .pc-actions .pc-btn { padding: 6px 12px !important; font-size: 13px !important; }
                .pc-lists { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important; gap: 10px !important; width: 100% !important; }
                .pc-list-card { padding: 10px !important; min-height: 220px !important; }
                .pc-list-title { font-size: 13px !important; margin-bottom: 6px !important; }
                .pc-list-content { padding: 8px !important; min-height: 120px !important; }
                .pc-list-item { margin-bottom: 6px !important; padding: 4px !important; font-size: 12px !important; }
                .pc-list-total { font-size: 13px !important; }
              }
            `}</style>
              </div>
              {/* Tedavi Bölümleri - 3 sütunlu responsive grid */}
              <div className="pc-lists" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", flex: "3 1 600px" }}>
                {/* Önerilen Tedaviler */}
                <div className="pc-list-card" style={{ background: "#f8fafc", borderRadius: 24, border: "1.5px solid #b6c6e6", boxShadow: "0 2px 8px #e3eaff", padding: 24, minHeight: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="pc-list-title" style={{ fontWeight: 700, fontSize: 16, color: "#0a2972", marginBottom: 8, borderBottom: "1px solid #dbeafe", width: "100%", textAlign: "center", borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>Önerilen Tedaviler</div>
                  <div className="pc-list-content" style={{ flex: 1, width: "100%", background: "#fffbea", borderRadius: 12, padding: 16, minHeight: 200, display: "flex", flexDirection: "column" }}>
                    {treatments.filter((x: any) => ['önerilen','onaylanan','tamamlanan'].includes(x.status)).length === 0 ? (
                      <div style={{ color: "#888", textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>Yok</div>
                    ) : (
                      <div style={{ flex: 1, fontSize: 15, color: "#2d3a4a" }}>
                        {treatments
                          .filter((x: any) => ['önerilen','onaylanan','tamamlanan'].includes(x.status))
                          .sort((a: any, b: any) => Number(b.status === 'önerilen') - Number(a.status === 'önerilen'))
                          .map((tr: any) => {
                          const type = treatmentTypes.find((tt: any) => tt.treatment_type_id === tr.treatment_type_id);
                          const treatmentName = type ? type.name : "Bilinmeyen Tedavi";
                          
                          // Diş numaralarını kontrol et (tooth_numbers veya toothNumbers olabilir)
                          const toothNumbers = tr.tooth_numbers || tr.toothNumbers || [];
                          // Jaw label inference for display
                          const isUpperFDI = (n: number) => (n >= 11 && n <= 18) || (n >= 21 && n <= 28) || (n >= 51 && n <= 55) || (n >= 61 && n <= 65);
                          const isLowerFDI = (n: number) => (n >= 31 && n <= 38) || (n >= 41 && n <= 48) || (n >= 71 && n <= 75) || (n >= 81 && n <= 85);
                          const isUpperSeq = (n: number) => n >= 1 && n <= 16;
                          const isLowerSeq = (n: number) => n >= 17 && n <= 32;
                          const isUpper = (n: number) => isUpperFDI(n) || isUpperSeq(n);
                          const isLower = (n: number) => isLowerFDI(n) || isLowerSeq(n);
                          const hasUpper = (!!tr.is_upper_jaw || !!tr.isUpperJaw) || (Array.isArray(toothNumbers) && toothNumbers.some((n: number) => isUpper(n)));
                          const hasLower = (!!tr.is_lower_jaw || !!tr.isLowerJaw) || (Array.isArray(toothNumbers) && toothNumbers.some((n: number) => isLower(n)));
                          const jawLabel = hasUpper && hasLower
                            ? "Üst ve Alt çene"
                            : hasUpper
                              ? "Üst çene"
                              : hasLower
                                ? "Alt çene"
                                : "";
                          
                          // Tedavi seçili mi kontrol et
                          const isSelected = selectedTreatments.includes(tr.treatment_id);
                          const isSelectable = tr.status === 'önerilen';
                          const bgByStatus = tr.status === 'önerilen' ? '#fff' : tr.status === 'onaylanan' ? '#e3eafc' : '#e6f4c8';
                          const borderByStatus = tr.status === 'önerilen' ? 'transparent' : tr.status === 'onaylanan' ? '#b6c6e6' : '#b6e6c6';
                          
                          return (
                            <div className="pc-list-item"
                              key={tr.treatment_id}
                              style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: 8, 
                                marginBottom: 8,
                                padding: "6px",
                                borderRadius: 6,
                                background: isSelected ? "#e3f2fd" : bgByStatus,
                                cursor: isSelectable ? "pointer" : "default",
                                border: isSelected ? "1px solid #1976d2" : `1px solid ${borderByStatus}`,
                                justifyContent: 'space-between'
                              }}
                              onClick={() => { if (isSelectable) toggleTreatmentSelection(tr.treatment_id); }}
                            >
                              {isSelectable && (
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => toggleTreatmentSelection(tr.treatment_id)}
                                  style={{ cursor: "pointer" }}
                                />
                              )}
                              <span>
                                {treatmentName}
                                {/* Doktor adı küçük ve belirgin şekilde */}
                                {tr.doctor_name && (
                                  <span style={{ color: '#1976d2', fontSize: 11, fontWeight: 500, marginLeft: 6 }}>
                                    • {tr.doctor_name}
                                  </span>
                                )}
                                {jawLabel && (
                                  <span style={{ color: "#666", fontSize: 13 }}> {" "}({jawLabel}{Array.isArray(toothNumbers) && toothNumbers.length > 0 ? ` (${toothNumbers.join(", ")})` : ""})</span>
                                )}
                                {!jawLabel && tr.is_per_tooth && Array.isArray(toothNumbers) && toothNumbers.length > 0 && (
                                  <span style={{ color: "#666", fontSize: 13 }}>
                                    {" "}(Dişler: {toothNumbers.join(", ")})
                                  </span>
                                )}
                                {tr.status !== 'önerilen' && (
                                  <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: tr.status === 'onaylanan' ? '#1976d2' : '#388e3c' }}>
                                    [{tr.status === 'onaylanan' ? 'Onaylanan' : 'Tamamlanan'}]
                                  </span>
                                )}
                              </span>
                              {showTotals && (
                                <span style={{ fontWeight: 700, color: '#0a2972' }}>
                                  ₺{getLineTotal(tr).toLocaleString('tr-TR')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {showTotals && suggestedTreatments.length > 0 && (
                    <div className="pc-list-total" style={{ width: '100%', textAlign: 'right', marginTop: 8, fontWeight: 800, color: '#0a2972' }}>
                      Toplam: ₺{suggestedTotal.toLocaleString('tr-TR')}
                    </div>
                  )}
                  
                  {/* Onayla Butonu - En altta sabit */}
                  {suggestedTreatments.length > 0 && (
                    <div style={{ width: "100%", paddingTop: 16, borderTop: "1px solid #e0e0e0" }}>
                      <button
                        onClick={handleApproveTreatments}
                        disabled={selectedTreatments.length === 0 || approvingTreatments}
                        style={{
                          background: selectedTreatments.length === 0 || approvingTreatments ? "#ccc" : "#388e3c",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: selectedTreatments.length === 0 || approvingTreatments ? "not-allowed" : "pointer",
                          width: "100%"
                        }}
                      >
                        {approvingTreatments ? "Onaylanıyor..." : `Onayla (${selectedTreatments.length})`}
                      </button>
                      <button
                        onClick={handleDeleteSuggestedTreatments}
                        disabled={selectedTreatments.length === 0}
                        style={{
                          background: selectedTreatments.length === 0 ? "#ccc" : "#e53935",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: selectedTreatments.length === 0 ? "not-allowed" : "pointer",
                          width: "100%",
                          marginTop: 8
                        }}
                      >
                        {`Sil (${selectedTreatments.length})`}
                      </button>
                    </div>
                  )}
                </div>
                {/* Onaylanan Tedaviler */}
                <div className="pc-list-card animated-card" style={{ background: "linear-gradient(120deg, #fafdff 60%, #e3eaff 100%)", borderRadius: 24, border: "2px solid #1976d2", boxShadow: "0 8px 32px #0d1a4a22, 0 1.5px 0 #1976d2", padding: 28, minHeight: 340, display: "flex", flexDirection: "column", alignItems: "center", animation: 'fadeIn .5s cubic-bezier(.4,2,.6,1)' }}>
                  <div className="pc-list-title" style={{ fontWeight: 900, fontSize: 18, color: "#1976d2", marginBottom: 12, borderBottom: "1.5px solid #e3eaff", width: "100%", textAlign: "center", borderTopLeftRadius: 18, borderTopRightRadius: 18, letterSpacing: 0.2, textShadow: "0 2px 8px #e3eaff77", paddingBottom: 6, background: 'linear-gradient(90deg, #e3eaff33 0%, #fafdff 100%)' }}>Onaylanan Tedaviler</div>
                  <div className="pc-list-content" style={{ flex: 1, width: "100%", background: "#fffbea", borderRadius: 14, padding: 18, minHeight: 200, display: "flex", flexDirection: "column", boxShadow: '0 2px 8px #e3eaff33', animation: 'fadeIn .6s' }}>
                    {treatments.filter((x: any) => ['onaylanan','tamamlanan'].includes(x.status)).length === 0 ? (
                      <div style={{ color: "#888", textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>Yok</div>
                    ) : (
                      <div style={{ flex: 1, fontSize: 15, color: "#2d3a4a" }}>
                        {treatments
                          .filter((x: any) => ['onaylanan','tamamlanan'].includes(x.status))
                          .sort((a: any, b: any) => Number(b.status === 'onaylanan') - Number(a.status === 'onaylanan'))
                          .map((tr: any) => {
                          const type = treatmentTypes.find((tt: any) => tt.treatment_type_id === tr.treatment_type_id);
                          const treatmentName = type ? type.name : "Bilinmeyen Tedavi";
                          
                          // Diş numaralarını kontrol et (tooth_numbers veya toothNumbers olabilir)
                          const toothNumbers = tr.tooth_numbers || tr.toothNumbers || [];
                          const isUpperFDI2 = (n: number) => (n >= 11 && n <= 18) || (n >= 21 && n <= 28) || (n >= 51 && n <= 55) || (n >= 61 && n <= 65);
                          const isLowerFDI2 = (n: number) => (n >= 31 && n <= 38) || (n >= 41 && n <= 48) || (n >= 71 && n <= 75) || (n >= 81 && n <= 85);
                          const isUpperSeq2 = (n: number) => n >= 1 && n <= 16;
                          const isLowerSeq2 = (n: number) => n >= 17 && n <= 32;
                          const isUpper2 = (n: number) => isUpperFDI2(n) || isUpperSeq2(n);
                          const isLower2 = (n: number) => isLowerFDI2(n) || isLowerSeq2(n);
                          const hasUpper = (!!tr.is_upper_jaw || !!tr.isUpperJaw) || (Array.isArray(toothNumbers) && toothNumbers.some((n: number) => isUpper2(n)));
                          const hasLower = (!!tr.is_lower_jaw || !!tr.isLowerJaw) || (Array.isArray(toothNumbers) && toothNumbers.some((n: number) => isLower2(n)));
                          const jawLabel = hasUpper && hasLower
                            ? "Üst ve Alt çene"
                            : hasUpper
                              ? "Üst çene"
                              : hasLower
                                ? "Alt çene"
                                : "";
                          
                          // Tedavi seçili mi kontrol et
                          const isSelected = selectedApprovedTreatments.includes(tr.treatment_id);
                          const isSelectable = tr.status === 'onaylanan';
                          const bgByStatus = tr.status === 'onaylanan' ? '#fff' : '#e6f4c8';
                          const borderByStatus = tr.status === 'onaylanan' ? 'transparent' : '#b6e6c6';

                          return (
                            <div className="pc-list-item"
                              key={tr.treatment_id}
                              style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: 8, 
                                marginBottom: 8,
                                padding: "6px",
                                borderRadius: 6,
                                background: isSelected ? "#e3f2fd" : bgByStatus,
                                cursor: isSelectable ? "pointer" : "default",
                                border: isSelected ? "1px solid #1976d2" : `1px solid ${borderByStatus}`
                              }}
                              onClick={() => { if (isSelectable) toggleApprovedTreatmentSelection(tr.treatment_id); }}
                            >
                              {isSelectable && (
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => toggleApprovedTreatmentSelection(tr.treatment_id)}
                                  style={{ cursor: "pointer" }}
                                />
                              )}
                              <span>
                                {treatmentName}
                                {/* Doktor adı küçük ve belirgin şekilde */}
                                {tr.doctor_name && (
                                  <span style={{ color: '#1976d2', fontSize: 11, fontWeight: 500, marginLeft: 6 }}>
                                    • {tr.doctor_name}
                                  </span>
                                )}
                                {jawLabel && (
                                  <span style={{ color: "#666", fontSize: 13 }}> {" "}({jawLabel}{Array.isArray(toothNumbers) && toothNumbers.length > 0 ? ` (${toothNumbers.join(", ")})` : ""})</span>
                                )}
                                {!jawLabel && tr.is_per_tooth && Array.isArray(toothNumbers) && toothNumbers.length > 0 && (
                                  <span style={{ color: "#666", fontSize: 13 }}>
                                    {" "}(Dişler: {toothNumbers.join(", ")})
                                  </span>
                                )}
                                {tr.status === 'tamamlanan' && (
                                  <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: '#388e3c' }}>
                                    [Tamamlanan]
                                  </span>
                                )}
                              </span>
                              {showTotals && (
                                <span style={{ fontWeight: 700, color: '#0a2972' }}>
                                  ₺{getLineTotal(tr).toLocaleString('tr-TR')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Tamamla Butonu - En altta sabit */}
                  {approvedTreatments.length > 0 && (
                    <div style={{ width: "100%", paddingTop: 16, borderTop: "1px solid #e0e0e0" }}>
                      <button
                        onClick={handleCompleteTreatments}
                        disabled={selectedApprovedTreatments.length === 0 || completingTreatments}
                        style={{
                          background: selectedApprovedTreatments.length === 0 || completingTreatments ? "#ccc" : "#ff5722",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: selectedApprovedTreatments.length === 0 || completingTreatments ? "not-allowed" : "pointer",
                          width: "100%"
                        }}
                      >
                        {completingTreatments ? "Tamamlanıyor..." : `Tamamla (${selectedApprovedTreatments.length})`}
                      </button>
                      <button
                        onClick={handleUndoApprovedTreatments}
                        disabled={selectedApprovedTreatments.length === 0}
                        style={{
                          background: selectedApprovedTreatments.length === 0 ? "#ccc" : "#1976d2",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: selectedApprovedTreatments.length === 0 ? "not-allowed" : "pointer",
                          width: "100%",
                          marginTop: 8
                        }}
                      >
                        {`Geri Al (${selectedApprovedTreatments.length})`}
                      </button>
                    </div>
                  )}
                </div>
                {/* Tamamlanan Tedaviler */}
                <div className="pc-list-card animated-card" style={{ background: "linear-gradient(120deg, #fafdff 60%, #e3eaff 100%)", borderRadius: 24, border: "2px solid #388e3c", boxShadow: "0 8px 32px #0d1a4a22, 0 1.5px 0 #388e3c", padding: 28, minHeight: 340, display: "flex", flexDirection: "column", alignItems: "center", animation: 'fadeIn .5s cubic-bezier(.4,2,.6,1)' }}>
                  <div className="pc-list-title" style={{ fontWeight: 900, fontSize: 18, color: "#388e3c", marginBottom: 12, borderBottom: "1.5px solid #e3eaff", width: "100%", textAlign: "center", borderTopLeftRadius: 18, borderTopRightRadius: 18, letterSpacing: 0.2, textShadow: "0 2px 8px #e3eaff77", paddingBottom: 6, background: 'linear-gradient(90deg, #e3eaff33 0%, #fafdff 100%)' }}>Biten Tedaviler</div>
                  <div className="pc-list-content" style={{ flex: 1, width: "100%", background: "#fffbea", borderRadius: 14, padding: 18, minHeight: 240, boxShadow: '0 2px 8px #e3eaff33', animation: 'fadeIn .6s' }}>
                    {completedTreatments.length === 0 ? (
                      <div style={{ color: "#888", textAlign: "center" }}>Yok</div>
                    ) : (
                      <div style={{ flex: 1, fontSize: 15, color: "#2d3a4a" }}>
                        {completedTreatments.map((tr: any) => {
                          const type = treatmentTypes.find((tt: any) => tt.treatment_type_id === tr.treatment_type_id);
                          const treatmentName = type ? type.name : "Bilinmeyen Tedavi";
                          const toothNumbers = tr.tooth_numbers || tr.toothNumbers || [];
                          const isSelected = selectedCompletedTreatments.includes(tr.treatment_id);
                          return (
                            <div
                              key={tr.treatment_id}
                              className="pc-list-item"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 8,
                                padding: "6px",
                                borderRadius: 6,
                                background: isSelected ? "#e3f2fd" : "#fff",
                                cursor: "pointer",
                                border: isSelected ? "1px solid #1976d2" : "1px solid #b6c6e6",
                                justifyContent: 'space-between',
                                fontWeight: 700,
                                color: '#388e3c',
                                fontSize: 15,
                                transition: 'box-shadow .18s, border .18s, background .18s, transform .18s'
                              }}
                              onClick={() => toggleCompletedTreatmentSelection(tr.treatment_id)}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => { e.stopPropagation(); toggleCompletedTreatmentSelection(tr.treatment_id); }}
                                style={{ cursor: "pointer" }}
                              />
                              <span>
                                {treatmentName}
                                {tr.doctor_name && (
                                  <span style={{ color: '#1976d2', fontSize: 12, fontWeight: 700, marginLeft: 6 }}>• {tr.doctor_name}</span>
                                )}
                                {Array.isArray(toothNumbers) && toothNumbers.length > 0 && (
                                  <span style={{ color: "#666", fontSize: 13 }}> (Dişler: {toothNumbers.join(", ")})</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Geri Al (Onaylanan'a çek) butonu */}
                  {completedTreatments.length > 0 && (
                    <div style={{ width: "100%", paddingTop: 16, borderTop: "1px solid #e0e0e0" }}>
                      <button
                        onClick={handleUndoCompletedTreatments}
                        disabled={selectedCompletedTreatments.length === 0}
                        style={{
                          background: selectedCompletedTreatments.length === 0 ? "#ccc" : "#1976d2",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: selectedCompletedTreatments.length === 0 ? "not-allowed" : "pointer",
                          width: "100%",
                          marginTop: 8
                        }}
                      >
                        {`Geri Al (${selectedCompletedTreatments.length})`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Mobile-only tweaks kaldırıldı, yukarıya taşındı */}
            {/* Randevu Geçmişi */}
            <div style={{ marginTop: 40, width: "100%" }}>
              <div style={{ fontWeight: 700, color: "#2d3a4a", marginBottom: 10, fontSize: 18 }}>Randevu Geçmişi</div>
              <div style={{ background: "#fffbe9", border: "1px solid #b6c6e6", borderRadius: 12, padding: 16, minHeight: 40 }}>
                {appointments.length === 0 ? (
                  <div style={{ color: "#888" }}>Kayıt yok</div>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {appointments
                      .slice() // kopya
                      .sort((a: any, b: any) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime()) // en yeni en üstte
                      .map((ap: any, idx: number, arr: any[]) => {
                        // Seans numarası: en alttan yukarı doğru 1.seans, 2.seans...
                        const seansNo = arr.length - idx;
                        let bg = "#fff";
                        let color = "#2d3a4a";
                        if (ap.status_tr === "Gelmedi") { bg = "#ffeaea"; color = "#d32f2f"; }
                        else if (ap.status_tr === "Geldi") { bg = "#e6f4c8"; color = "#388e3c"; }
                        else if (ap.status_tr === "Planlandı") { bg = "#e3eafc"; color = "#1976d2"; }
                        else if (ap.status_tr === "İptal") { bg = "#f8d7da"; color = "#b71c1c"; }
                        // Doktor adı
                        const doctorName = ap.doctor_first_name && ap.doctor_last_name
                          ? `Dr. ${ap.doctor_first_name} ${ap.doctor_last_name}`
                          : (ap.doctor_name || "Doktor Bilgisi Yok");
                        return (
                          <li key={ap.appointment_id} style={{ background: bg, color, borderRadius: 8, marginBottom: 8, padding: "10px 14px", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px #e3eaff33" }}>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>
                              {seansNo}. Seans | {new Date(ap.appointment_time).toLocaleString("tr-TR")} - {ap.status_tr || (ap.status?.charAt(0).toUpperCase() + ap.status?.slice(1))}
                            </div>
                            <div style={{ fontSize: 14, color: "#1976d2", marginTop: 2 }}>
                              👨‍⚕️ {doctorName}
                            </div>
                            {ap.notes && <div style={{ fontSize: 14, color: "#555", marginTop: 2 }}>Not: {ap.notes}</div>}
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
  );
}
