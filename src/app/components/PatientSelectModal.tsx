"use client";
import { useEffect, useState } from "react";

export default function PatientSelectModal({ open, onClose, onSelect }: { open: boolean, onClose: () => void, onSelect: (patient: any) => void }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Şubeleri çek
  useEffect(() => {
    if (open) {
      fetch("https://dentalapi.karadenizdis.com/api/branch")
        .then(res => res.json())
        .then(data => {
          setBranches(data.success ? data.data : []);
        });
    }
  }, [open]);

  // Hastaları çek
  useEffect(() => {
    if (open) {
      const params = new URLSearchParams();
      params.append("limit", pageSize.toString());
      params.append("offset", ((page-1)*pageSize).toString());
      if (search.trim() !== "") {
        params.append("search", search.trim());
      }
      if (selectedBranch !== "all") {
        params.append("branch_id", selectedBranch);
      }
      fetch(`https://dentalapi.karadenizdis.com/api/patient?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          setPatients(data.success ? data.data : []);
          setTotal(data.total || 0);
        });
    }
  }, [open, search, page, pageSize, selectedBranch]);
  if (!open) return null;
  const filtered = patients;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0d1a4a33", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .22s" }}>
      <div style={{ background: "linear-gradient(120deg, #fafdff 60%, #e3eaff 100%)", borderRadius: 24, minWidth: 370, maxWidth: 480, width: "100%", boxShadow: "0 8px 40px #0d1a4a33, 0 1.5px 0 #1976d2", padding: "38px 36px 32px 36px", border: "2px solid #1976d2", display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', animation: 'popIn .28s cubic-bezier(.4,2,.6,1)' }}>
        <div style={{ fontWeight: 900, fontSize: 22, color: "#1976d2", marginBottom: 18, letterSpacing: 0.2, textShadow: "0 2px 8px #e3eaff77", display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.12"/><path d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#1976d2"/></svg>
          Hasta Seç
        </div>
        {/* Şube filtreleme */}
        <div style={{ width: '100%', display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <select
            value={selectedBranch}
            onChange={e => { setSelectedBranch(e.target.value); setPage(1); }}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1.5px solid #1976d2',
              fontSize: 15,
              color: '#1976d2',
              background: '#fafdff',
              fontWeight: 700,
              boxShadow: '0 1.5px 0 #e3eaff',
              outline: 'none',
              transition: 'border .18s, box-shadow .18s',
              cursor: 'pointer',
              marginBottom: 0
            }}
          >
            <option value="all">Tüm Şubeler</option>
            {branches.map((b: any) => (
              <option key={b.branch_id} value={b.branch_id}>{b.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="İsme göre ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 2, minWidth: 0, padding: 12, borderRadius: 10, border: "1.5px solid #1976d2", fontSize: 15, color: '#1976d2', background: '#fafdff', fontWeight: 700, boxShadow: '0 1.5px 0 #e3eaff', transition: 'border .18s, box-shadow .18s', outline: 'none', marginBottom: 0 }}
          />
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto", width: '100%', marginBottom: 8 }}>
          {filtered.length === 0 ? <div style={{ color: "#888", textAlign: "center", fontWeight: 600, fontSize: 16, margin: 24 }}>Hasta bulunamadı</div> :
            filtered.map(p => (
              <div key={p.patient_id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px #e3eaff44', padding: '13px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #e3eaff', fontWeight: 800, color: '#1976d2', fontSize: 16, cursor: 'pointer', transition: 'box-shadow .18s, border .18s', outline: 'none' }} onClick={() => onSelect(p.patient_id)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onSelect(p.patient_id); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.18"/><path d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#1976d2"/></svg>
                <span style={{ flex: 1, fontWeight: 900 }}>{p.first_name} {p.last_name}</span>
                <span style={{ fontSize: 13, color: '#6073a6', fontWeight: 700, background: '#e3eaff', borderRadius: 8, padding: '2px 10px', marginLeft: 6, whiteSpace: 'nowrap' }}>{p.branch_name}</span>
              </div>
            ))}
        </div>
        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 10, width: '100%' }}>
          <button disabled={page === 1} onClick={() => setPage(page-1)} style={{ padding: "8px 18px", borderRadius: 10, border: "1.5px solid #e3eaff", background: page === 1 ? "#eee" : "linear-gradient(90deg, #1976d2 0%, #0d1a4a 100%)", color: page === 1 ? "#888" : "#fff", fontWeight: 800, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 15, boxShadow: page === 1 ? 'none' : '0 2px 8px #e3eaff55', transition: 'background .18s' }}>Önceki</button>
          <span style={{ fontWeight: 800, color: "#1976d2", fontSize: 15 }}>{page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
          <button disabled={page * pageSize >= total} onClick={() => setPage(page+1)} style={{ padding: "8px 18px", borderRadius: 10, border: "1.5px solid #e3eaff", background: page * pageSize >= total ? "#eee" : "linear-gradient(90deg, #1976d2 0%, #0d1a4a 100%)", color: page * pageSize >= total ? "#888" : "#fff", fontWeight: 800, cursor: page * pageSize >= total ? "not-allowed" : "pointer", fontSize: 15, boxShadow: page * pageSize >= total ? 'none' : '0 2px 8px #e3eaff55', transition: 'background .18s' }}>Sonraki</button>
        </div>
        <button onClick={onClose} style={{ marginTop: 18, background: "linear-gradient(90deg, #e53935 0%, #1976d2 100%)", color: "white", border: 0, borderRadius: 12, padding: "10px 0", fontWeight: 900, cursor: "pointer", width: "100%", fontSize: 16, boxShadow: '0 2px 8px #e3eaff55', letterSpacing: 0.1, transition: 'background .18s' }}>Vazgeç</button>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes popIn { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        `}</style>
      </div>
    </div>
  );
}
