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
  const router = useRouter();
  return (
    <header style={{
      width: fullWidth ? "100vw" : "100%",
      position: "sticky",
      left: 0,
      height: 44,
      background: "linear-gradient(90deg, #3b5998 60%, #5b7bd5 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
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
      <div className="topbar-hamburger">
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
      <style>{`
        @media (max-width: 768px) {
          .topbar-hamburger {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .topbar-hamburger {
            display: none !important;
          }
        }
      `}</style>
      {/* Arama çubuğu kaldırıldı */}
    </header>
  );
}
