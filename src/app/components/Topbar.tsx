"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopbarSearchIcon from "./TopbarSearchIcon";

const pages = [
  { label: "Ana Sayfa", path: "/" },
  { label: "Randevu Takvimi", path: "/calendar" },
  { label: "Hasta Kartı Görüntüle", path: "/patients/card" },
  { label: "Yeni Hasta Ekle", path: "/patients/new" },
  { label: "Hasta Listesi", path: "/patients" },
  { label: "Toplu Hasta Ekleme", path: "/patients/bulk" },
  { label: "Onam Formları", path: "/patients/consent" },
  { label: "Sms Gönder", path: "/sms/send" },
  { label: "Sms Şablonları", path: "/sms/templates" },
  { label: "Hasta Raporları", path: "/reports/patients" },
  { label: "Gelir Raporları", path: "/reports/income" },
  { label: "Geri Dönüşler", path: "/feedbacks" },
];

export default function Topbar({ fullWidth = false, onHamburger }: { fullWidth?: boolean, onHamburger?: () => void }) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const filtered = pages.filter((p) =>
    p.label.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <header style={{
      width: fullWidth ? "100vw" : "100%",
      position: "sticky",
      left: 0,
      height: 44,
      background: "linear-gradient(90deg, #3b5998 60%, #5b7bd5 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: fullWidth ? "0 12px" : "0 24px",
      boxSizing: "border-box",
      boxShadow: "0 2px 12px #3b599822",
      top: 0,
      zIndex: 110,
      minWidth: 0,
      borderBottom: "2px solid #e3eafc",
      backdropFilter: "blur(8px)",
      transition: "box-shadow .18s, background .18s"
    }}>
      {/* Hamburger button for mobile */}
      <div className="topbar-hamburger" style={{ display: 'none', width: 40, height: 40, alignItems: 'center', justifyContent: 'center', position: 'absolute', left: 16 }}>
        <button
          aria-label="Menüyü Aç"
          onClick={onHamburger}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 28,
            color: '#fff',
            cursor: 'pointer',
            padding: 0,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 40,
            width: 40
          }}
        >
          <span style={{ fontSize: 28, lineHeight: 1 }}>☰</span>
        </button>
      </div>
      <div style={{ position: "relative", width: 220, transition: 'width .18s' }}>
        <input
          type="text"
          placeholder="Sayfa ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "6px 32px 6px 12px",
            borderRadius: 18,
            border: "2px solid #e3eafc",
            fontSize: 14,
            background: "#e3eafc",
            color: "#3b5998",
            fontWeight: 600,
            outline: "none",
            boxShadow: "0 1px 4px #3b599822",
            transition: "border .18s, box-shadow .18s, background .18s"
          }}
          onFocus={e => (e.currentTarget.style.border = '#5b7bd5')}
          onBlur={e => (e.currentTarget.style.border = '#e3eafc')}
        />
        <span style={{ position: "absolute", right: 10, top: 8, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <TopbarSearchIcon />
        </span>
        {search && (
          <div style={{
            position: "absolute",
            top: 34,
            left: 0,
            width: "100%",
            background: "#e3eafc",
            border: "2px solid #b6c6e3",
            borderRadius: 12,
            boxShadow: "0 4px 16px #3b599822",
            zIndex: 10,
            animation: 'popIn .18s cubic-bezier(.4,2,.6,1)'
          }}>
            {filtered.length === 0 && <div style={{ padding: 10, color: "#888" }}>Sonuç yok</div>}
            {filtered.map((p) => (
              <div
                key={p.path}
                style={{ padding: 10, cursor: "pointer", fontSize: 15, borderBottom: "1px solid #b6c6e3", borderRadius: 8, transition: 'background .14s', color: '#3b5998' }}
                onClick={() => { router.push(p.path); setSearch(""); }}
                onMouseOver={e => (e.currentTarget.style.background = '#b6c6e344')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                {p.label}
              </div>
            ))}
          </div>
        )}
      </div>
          {/* Sağdaki ayarlar ikonu kaldırıldı, arama çubuğu ortada kalacak */}
      <style>{`
        @media (max-width: 767.98px) {
          .topbar-hamburger { display: flex !important; }
          header > div:nth-child(2) { display: none !important; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </header>
  );
}
