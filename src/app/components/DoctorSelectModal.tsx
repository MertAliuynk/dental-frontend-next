import { useEffect, useState } from "react";

export default function DoctorSelectModal({ open, onClose, onSelect }: { open: boolean, onClose: () => void, onSelect: (doctor: any) => void }) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    // Şube bilgisini localStorage'dan al
    const branchId = typeof window !== 'undefined' ? localStorage.getItem('branchId') : null;
    if (!branchId) {
      setDoctors([]);
      setLoading(false);
      return;
    }
    fetch("https://dentalapi.karadenizdis.com/api/user/doctors")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const filtered = data.data.filter((d: any) => String(d.branch_id) === String(branchId));
          setDoctors(filtered);
        } else {
          setDoctors([]);
        }
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [open]);

  return open ? (
    <div style={{ position: "fixed", inset: 0, background: "#0007", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, minWidth: 340, maxWidth: 420, boxShadow: "0 8px 32px #0002", padding: 24, position: "relative" }}>
        <h3 style={{ fontWeight: 800, fontSize: 22, color: "#1a237e", marginBottom: 18 }}>Doktor Seç</h3>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "#fbeaea", color: "#b91c1c", border: "1.5px solid #e6b6b6", borderRadius: 8, padding: "4px 12px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Kapat</button>
        {loading ? (
          <div style={{ textAlign: "center", color: "#1976d2", fontWeight: 600, fontSize: 16 }}>Yükleniyor...</div>
        ) : (
          <>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {doctors.map((doctor: any) => (
                <li key={doctor.user_id} style={{ borderBottom: "1px solid #e5e7eb", padding: "12px 0", fontSize: 16, color: "#222", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: selectedDoctor === String(doctor.user_id) ? '#e3eaff' : 'transparent' }}
                  onClick={() => setSelectedDoctor(String(doctor.user_id))}
                >
                  {doctor.first_name} {doctor.last_name}
                  {selectedDoctor === String(doctor.user_id) && <span style={{ color: "#1976d2", fontWeight: 900, marginLeft: 8 }}>✓</span>}
                </li>
              ))}
            </ul>
            <button
              disabled={!selectedDoctor}
              onClick={() => {
                const doc = doctors.find((d: any) => String(d.user_id) === selectedDoctor);
                if (doc) onSelect(doc);
              }}
              style={{ marginTop: 18, background: "#1976d2", color: "#fff", border: 0, borderRadius: 10, padding: "10px 28px", fontWeight: 800, fontSize: 16, cursor: selectedDoctor ? "pointer" : "not-allowed", opacity: selectedDoctor ? 1 : 0.7 }}
            >
              Seç
            </button>
          </>
        )}
      </div>
    </div>
  ) : null;
}
