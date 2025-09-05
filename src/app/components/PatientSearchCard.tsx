"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const PatientSearchCard: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  // Şubeleri çek
  useEffect(() => {
    fetch("https://dentalapi.karadenizdis.com/api/branch")
      .then(res => res.json())
      .then(data => {
        if (data.success) setBranches(data.data);
      });
  }, []);

  // Hastaları çek
  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    params.append("limit", pageSize.toString());
    params.append("offset", ((page-1)*pageSize).toString());
    if (search.trim() !== "") params.append("search", search.trim());
    if (selectedBranch) params.append("branch_id", selectedBranch);
    fetch(`https://dentalapi.karadenizdis.com/api/patient?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPatients(data.data);
          setTotal(data.total || 0);
        } else {
          setPatients([]);
          setTotal(0);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Hasta verileri alınamadı");
        setLoading(false);
      });
  }, [search, page, pageSize, selectedBranch]);
  return (
    <div
      className="patient-search-card"
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 2px 16px #0002",
        minWidth: 280,
        maxWidth: 380,
        minHeight: 320,
        maxHeight: 520,
        height: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Arama ve şube filtre alanı */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="text"
          placeholder="Hasta adı veya soyadı ara..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1.5px solid #b6c2e2",
            fontSize: 16,
            outline: "none",
            fontWeight: 600,
            color: "#1a237e",
            background: "#fafdff",
            letterSpacing: 0.1,
          }}
        />
        <select
          value={selectedBranch}
          onChange={e => { setSelectedBranch(e.target.value); setPage(1); }}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1.5px solid #b6c2e2",
            fontSize: 16,
            background: "#fafdff",
            fontWeight: 600,
            color: "#1a237e",
            letterSpacing: 0.1,
          }}
        >
          <option value="" style={{ fontWeight: 700, color: '#1a237e' }}>Tüm Şubeler</option>
          {branches.map((b: any) => (
            <option key={b.branch_id} value={b.branch_id} style={{ fontWeight: 600, color: '#1a237e' }}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Hasta listesi alanı */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginTop: 8,
          marginBottom: 8,
          borderRadius: 8,
          border: "1px solid #f0f0f0",
          background: "#fafbfc",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minHeight: 200,
          maxHeight: 340,
        }}
      >
        {loading && (
          <div style={{ color: "#888", textAlign: "center", marginTop: 32 }}>Yükleniyor...</div>
        )}
        {error && (
          <div style={{ color: "#e53935", textAlign: "center", marginTop: 32 }}>{error}</div>
        )}
        {!loading && !error && patients.length === 0 && (
          <div style={{ color: "#888", textAlign: "center", marginTop: 32 }}>Hasta bulunamadı</div>
        )}
        {!loading && !error && patients.map((p: any) => (
          <div
            key={p.patient_id}
            onClick={() => router.push(`/patients/card?id=${p.patient_id}`)}
            style={{
              padding: "12px 10px",
              borderRadius: 8,
              background: "#fff",
              boxShadow: "0 1px 4px #e3eaff33",
              border: "1px solid #e3eafc",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              flexDirection: "row",
              gap: 8,
              transition: "background 0.2s",
            }}
            onMouseOver={e => (e.currentTarget.style.background = "#e3eafc")}
            onMouseOut={e => (e.currentTarget.style.background = "#fff")}
          >
            <span style={{ fontWeight: 700, color: "#1976d2", fontSize: 16 }}>
              {p.first_name} {p.last_name}
            </span>
            <span style={{ fontSize: 13, color: "#6073a6", background: "#f0f4ff", borderRadius: 6, padding: "2px 8px", fontWeight: 500, marginLeft: "auto" }}>
              {p.branch_name}
            </span>
          </div>
        ))}
      </div>

      {/* Pagination alanı */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 8 }}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1 || loading}
          style={{
            padding: "7px 18px",
            borderRadius: 8,
            border: "none",
            background: page === 1 || loading ? "#eee" : "#1976d2",
            color: page === 1 || loading ? "#888" : "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: page === 1 || loading ? "not-allowed" : "pointer",
            minWidth: 80,
            position: "relative",
            transition: "background 0.2s, color 0.2s"
          }}
        >
          {loading ? (
            <span style={{ display: "inline-block", width: 18, height: 18, border: "2.5px solid #fff", borderTop: "2.5px solid #1976d2", borderRadius: "50%", animation: "spin 1s linear infinite", verticalAlign: "middle" }} />
          ) : (
            "Önceki"
          )}
        </button>
        <span style={{
          background: "#e3eaff",
          color: "#1976d2",
          fontWeight: 700,
          fontSize: 16,
          borderRadius: 8,
          padding: "6px 18px",
          minWidth: 70,
          textAlign: "center",
          letterSpacing: 0.2,
          boxShadow: "0 1px 4px #e3eaff33"
        }}>
          {page} <span style={{ color: "#888", fontWeight: 500, fontSize: 14 }}>/ {Math.max(1, Math.ceil(total / pageSize))}</span>
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page * pageSize >= total || loading}
          style={{
            padding: "7px 18px",
            borderRadius: 8,
            border: "none",
            background: page * pageSize >= total || loading ? "#eee" : "#1976d2",
            color: page * pageSize >= total || loading ? "#888" : "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: page * pageSize >= total || loading ? "not-allowed" : "pointer",
            minWidth: 80,
            position: "relative",
            transition: "background 0.2s, color 0.2s"
          }}
        >
          {loading ? (
            <span style={{ display: "inline-block", width: 18, height: 18, border: "2.5px solid #fff", borderTop: "2.5px solid #1976d2", borderRadius: "50%", animation: "spin 1s linear infinite", verticalAlign: "middle" }} />
          ) : (
            "Sonraki"
          )}
        </button>
        {/* Spinner animasyonu için style ekle */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PatientSearchCard;