"use client";
import React, { useState } from "react";
import "./sidebar-soft.css";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";

interface Branch {
  branch_id: number;
  name: string;
}

const menu = [
  { label: "ANA SAYFA", path: "/" },
  { label: "Randevu Takvimi", path: "/calendar" },
  {
    label: "Hastalar",
    children: [
      { label: "Hasta Kartı Görüntüle", path: "/patients/card" },
      { label: "Yeni Hasta Ekle", path: "/patients/new" },
      { label: "Hasta Listesi", path: "/patients" },
      { label: "Toplu Hasta Ekleme", path: "/patients/bulk" },
  { label: "Onam Formları", path: "/patients/consent" },
    ],
  },
  {
    label: "SMS",
    children: [
      { label: "Hızlı SMS Gönder", path: "/sms/quick-send" },
      { label: "SMS Şablonları", path: "/sms/templates" },
      { label: "İleri Tarihli SMS", path: "/sms/scheduled" },
    ],
  },
  {
    label: "Raporlar",
    children: [
      { label: "Muayene Raporları", path: "/reports/examination" },
      { label: "Tedavi Raporları", path: "/reports/treatment" },
      { label: "Hekim Başı Randevu Raporları", path: "/reports/doctor-appointment" },
    ],
  },
  { label: "Geri Dönüşler", path: "/feedbacks" },
];

// Rolü Türkçeye çeviren yardımcı fonksiyon
const getRoleLabel = (role: string) => {
  switch (role) {
    case "admin":
      return "Yönetici";
    case "doctor":
      return "Doktor";
    case "receptionist":
      return "Bankocu";
    case "branch_manager":
      return "Şube Müdürü";
    default:
      return role;
  }
};

export default function Sidebar({ open = false, onClose, onOpenPatientSelect }: { open?: boolean; onClose?: () => void; onOpenPatientSelect?: () => void }) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string>("");
  const [branch, setBranch] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  // Modal is managed by AppLayout; no local state here
  // Çıkış butonu animasyonu için state
  const [showLogout, setShowLogout] = useState(false);
  // Admin için şube yönetimi
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0); // 0 ile başla
  // Rol, şube ve isim localStorage'dan alınır
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("role") || "");
      setBranch(localStorage.getItem("branch") || "");
      setUserName(localStorage.getItem("name") || "");
      const branchId = localStorage.getItem("branchId");
      const selectedBranch = localStorage.getItem("selectedBranchId");
      if (selectedBranch) {
        setSelectedBranchId(parseInt(selectedBranch));
      } else if (branchId) {
        setSelectedBranchId(parseInt(branchId));
      }
    }
  }, []);

  // Şubeleri getir (sadece admin için)
  const fetchBranches = async () => {
    if (role !== "admin") return;
    
    try {
  const res = await fetch("https://dentalapi.karadenizdis.com/api/branch");
      const data = await res.json();
      if (data.success) {
        setBranches(data.data);
      }
    } catch (err) {
      console.error("Şubeler alınamadı:", err);
    }
  };

  React.useEffect(() => {
    if (role === "admin") {
      fetchBranches();
    }
  }, [role]);

  // Şube seçimi değiştiğinde localStorage'ı güncelle
  const handleBranchChange = (branchId: number) => {
    if (!branchId || branchId === 0) return; // Boş seçim engelle
    
    setSelectedBranchId(branchId);
    localStorage.setItem("selectedBranchId", branchId.toString());
    
    // Custom event ile diğer componentları bilgilendir (sayfa yenileme olmadan)
    window.dispatchEvent(new CustomEvent('branchChanged', { 
      detail: { branchId } 
    }));
  };

  const handleMenuClick = (item: any) => {
    if (item.children) {
      setMenuOpen(menuOpen === item.label ? null : item.label);
    } else if (item.label === "Hasta Kartı Görüntüle") {
      if (onOpenPatientSelect) onOpenPatientSelect();
      if (onClose) onClose();
    } else {
      router.push(item.path);
    }
  };

  // Rol bazlı menü filtreleme
  // Raporlar menüsünü doktor ve resepsiyonist için gizle
  const filteredMenu = menu
    .filter(item => {
      if (item.label === "Raporlar" && (role === "doctor" || role === "receptionist")) {
        return false;
      }
      return true;
    })
    .map(item => {
      // SMS Şablonları'nı doktor ve receptionist için gizle
      if (item.label === "SMS" && item.children && (role === "doctor" || role === "receptionist")) {
        return {
          ...item,
          children: item.children.filter((child: any) => child.label !== "SMS Şablonları")
        };
      }
      return item;
    });

  return (
    <aside
      className="sidebar"
      data-open={open ? 'true' : 'false'}
      style={{
        width: 240,
        background: "#3b5998",
        color: "#f8fafc",
        height: "100vh",
        minHeight: "100vh",
        maxHeight: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 110,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxSizing: "border-box",
        borderRight: "1px solid #dbeafe",
        overflowY: "auto",
        transition: "transform 200ms ease"
      }}>
      <div className="sidebar-branch-card">
        <div className="sidebar-branch-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="7" width="16" height="13" rx="3" fill="#fff" fillOpacity="0.95"/>
            <rect x="7.5" y="10.5" width="3" height="3" rx="1" fill="#1976d2"/>
            <rect x="13.5" y="10.5" width="3" height="3" rx="1" fill="#1976d2"/>
            <rect x="7.5" y="15" width="3" height="3" rx="1" fill="#1976d2"/>
            <rect x="13.5" y="15" width="3" height="3" rx="1" fill="#1976d2"/>
            <rect x="8" y="2" width="8" height="5" rx="2" fill="#fff" fillOpacity="0.95"/>
          </svg>
        </div>
        <div className="sidebar-branch-info">
          <div className="sidebar-branch-title" title={branch || "Klinik"}>{branch || "Klinik Adı"}</div>
          <div className="sidebar-branch-sub">{userName || "Şube Adı"}</div>
        </div>
      </div>
      <style jsx global>{`
        .sidebar-branch-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1976d2;
          border-radius: 13px;
          padding: 10px 14px 10px 10px;
          margin-bottom: 14px;
          box-shadow: 0 2px 10px #1976d122;
        }
        .sidebar-branch-icon {
          width: 38px;
          height: 38px;
          background: #1565c0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sidebar-branch-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        .sidebar-branch-title {
          color: #fff;
          font-size: 1.01rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        .sidebar-branch-sub {
          color: #e3eaff;
          font-size: 0.89rem;
          font-weight: 400;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
      `}</style>
      {/* Mobile close button */}
      <div className="sidebar-mobile-header" style={{ display: "none", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Menü</div>
        <button
          aria-label="Menüyü Kapat"
          onClick={() => onClose && onClose()}
          style={{ background: "transparent", border: 0, color: "#fff", fontSize: 22, width: 36, height: 36, cursor: "pointer" }}
        >
          ×
        </button>
      </div>
  {/* ...eski isim, şube ve rol alanları kaldırıldı... */}
      <button
        className="sidebar-new-patient-btn"
        onClick={() => router.push("/patients/new")}
      >
        <span className="sidebar-new-patient-btn-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className="sidebar-new-patient-btn-icon">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-2c0-2.66-5.33-4-8-4zm7-1v-2h-2v-2h-2v2h-2v2h2v2h2v-2h2z"/>
          </svg>
          <span>Yeni Hasta Ekle</span>
        </span>
      </button>
      <style jsx global>{`
        .sidebar-new-patient-btn {
          width: 100%;
          margin-bottom: 18px;
          background: #f3f4f6;
          color: #222;
          border: 2px solid;
          border-image: linear-gradient(90deg, #d1d5db 60%, #b6c6e6 100%);
          border-image-slice: 1;
          border-radius: 11px;
          padding: 7px 0 7px 0;
          font-weight: 600;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          box-shadow: 0 2px 10px #1976d111, 0 1px 4px #0001;
          cursor: pointer;
          transition: background .22s, color .22s, border .22s, box-shadow .22s;
        }
        .sidebar-new-patient-btn-content {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .sidebar-new-patient-btn-icon {
          display: inline-block;
          vertical-align: middle;
          transition: fill .22s;
          fill: #1976d2;
        }
        .sidebar-new-patient-btn:hover {
          background: linear-gradient(90deg, #1976d2 60%, #0a2972 100%);
          color: #fff;
          border-image: linear-gradient(90deg, #1976d2 60%, #e3eaff 100%);
          box-shadow: 0 4px 18px #1976d233;
        }
        .sidebar-new-patient-btn:hover .sidebar-new-patient-btn-icon {
          fill: #fff;
        }
        .sidebar-new-patient-btn:active {
          background: #1976d2;
          color: #fff;
          box-shadow: 0 2px 8px #1976d244;
        }
      `}</style>
      {filteredMenu.map((item) => {
        const isSelected = pathname === item.path || (item.children && item.children.some((child: any) => pathname === child.path));
        return (
          <div key={item.label} className="sidebar-modern-group">
            <div
              className={`sidebar-modern-title${isSelected ? " selected" : ""}`}
              onClick={() => !item.children && handleMenuClick(item)}
            >
              {item.label === "ANA SAYFA" && <span style={{fontSize:18,marginRight:4}}>🏠</span>}
              {item.label === "Randevu Takvimi" && <span style={{fontSize:18,marginRight:4}}>📅</span>}
              {item.label === "Hastalar" && <span style={{fontSize:18,marginRight:4}}>👤</span>}
              {item.label === "SMS" && <span style={{fontSize:18,marginRight:4}}>💬</span>}
              {item.label === "Raporlar" && <span style={{fontSize:18,marginRight:4}}>📊</span>}
              {item.label === "Geri Dönüşler" && <span style={{fontSize:18,marginRight:4}}>🔄</span>}
              {item.label}
            </div>
            {item.children && (
              <>
                <div className="sidebar-modern-underline" />
                <div className="sidebar-modern-submenu">
                  {item.children.map((child: any) => {
                    const isChildSelected = pathname === child.path;
                    if (child.label === "Hasta Kartı Görüntüle") {
                      return (
                        <div
                          key={child.label}
                          className="sidebar-modern-subitem"
                          onClick={() => {
                            if (onOpenPatientSelect) onOpenPatientSelect();
                            if (onClose) onClose();
                          }}
                        >
                          {child.label}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={child.label}
                        className={`sidebar-modern-subitem${isChildSelected ? " selected" : ""}`}
                        onClick={() => router.push(child.path)}
                      >
                        {child.label}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}
      <style jsx global>{`
        .sidebar-modern-group {
          margin-bottom: 7px;
        }
        .sidebar-modern-title {
          font-size: 0.89rem;
          font-weight: 600;
          color: #f8fafc;
          letter-spacing: 0.1px;
          padding: 2px 0 1px 0;
          cursor: pointer;
          transition: color .18s, background .18s;
          position: relative;
        }
        .sidebar-modern-title.selected {
          color: #ffe082;
        }
        .sidebar-modern-underline {
          width: 100%;
          height: 1.5px;
          background: linear-gradient(90deg, #ffe082 0%, #e3eaff 100%);
          border-radius: 1.5px;
          margin: 0 0 2px 0;
          animation: sidebar-underline-in .4s cubic-bezier(.4,0,.2,1);
        }
        .sidebar-modern-submenu {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-left: 4px;
          margin-bottom: 0;
        }
        .sidebar-modern-subitem {
          font-size: 0.78rem;
          font-weight: 500;
          color: #e3eaff;
          background: transparent;
          border-radius: 4px;
          padding: 2px 6px 2px 10px;
          margin: 0;
          cursor: pointer;
          opacity: 0.92;
          transition: background .18s, color .18s, opacity .18s, transform .18s;
        }
        .sidebar-modern-subitem.selected {
          background: linear-gradient(90deg, #ffe082 0%, #e3eaff 100%);
          color: #3b5998;
          opacity: 1;
          transform: translateX(1.5px) scale(1.03);
        }
        .sidebar-modern-subitem:hover {
          background: #fffde7;
          color: #1976d2;
          opacity: 1;
          transform: translateX(1.5px) scale(1.03);
        }
        @keyframes sidebar-underline-in {
          from { width: 0; opacity: 0; }
          to { width: 100%; opacity: 1; }
        }
      `}</style>
  {/* ...Çıkış Yap butonu kaldırıldı... */}
  <div className="sidebar-logout-card-wrapper sidebar-logout-sticky">
        <div
          className="sidebar-logout-card"
          tabIndex={0}
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("branch");
            localStorage.removeItem("name");
            localStorage.removeItem("branchId");
            localStorage.removeItem("selectedBranchId");
            router.push("/login");
          }}
        >
          <div className="sidebar-logout-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="7" fill="#fff" fillOpacity="0.95"/>
              <path d="M15.5 8.5L19 12M19 12L15.5 15.5M19 12H9" stroke="#1976d2" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="5" y="5" width="7" height="14" rx="3.5" fill="#1976d2" fillOpacity="0.12"/>
            </svg>
          </div>
          <div className="sidebar-logout-info">
            <div className="sidebar-logout-title">Çıkış Yap</div>
            <div className="sidebar-logout-sub">Oturumu kapat</div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .sidebar-logout-card-wrapper {
          width: 100%;
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          user-select: none;
        }
        .sidebar-logout-sticky {
          position: sticky;
          bottom: 0;
          left: 0;
          background: #3b5998;
          z-index: 120;
          padding-bottom: 8px;
          margin-top: auto;
        }
        .sidebar-logout-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1976d2;
          border-radius: 13px;
          padding: 10px 14px 10px 10px;
          box-shadow: 0 2px 10px #1976d122;
          cursor: pointer;
          transition: background .18s, box-shadow .18s;
        }
        .sidebar-logout-card:active {
          background: #1565c0;
        }
        .sidebar-logout-icon {
          width: 34px;
          height: 34px;
          background: #1565c0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sidebar-logout-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        .sidebar-logout-title {
          color: #fff;
          font-size: 1.01rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }
        .sidebar-logout-sub {
          color: #e3eaff;
          font-size: 0.89rem;
          font-weight: 400;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }
      `}</style>
    </aside>
  );
}
