"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "../components/AppLayout";

interface PendingFeedback {
  patient_id: number;
  patient_name: string;
  phone: string;
  earliest_feedback_date: string;
  feedback_items: FeedbackItem[];
}

interface FeedbackItem {
  planning_id: number;
  treatment_id: number;
  interval: string;
  interval_display: string;
  planned_date: string;
  treatment_name: string;
  completed_at: string;
  status: string;
  days_until_due: number;
}

interface FeedbackHistory {
  patient_id: number;
  patient_name: string;
  phone: string;
  total_feedbacks: number;
  last_feedback_date: string;
  feedback_items: HistoryFeedbackItem[];
}

interface HistoryFeedbackItem {
  feedback_id: number;
  treatment_id: number;
  interval: string;
  interval_display: string;
  feedback_date: string;
  notes: string;
  treatment_name: string;
  completed_at: string;
  created_at: string;
}

export default function FeedbacksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pendingFeedbacks, setPendingFeedbacks] = useState<PendingFeedback[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PendingFeedback | null>(null);
  const [selectedFeedbackItem, setSelectedFeedbackItem] = useState<FeedbackItem | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");

  useEffect(() => {
    // Auth kontrolü
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
    
    if (!token) {
      router.replace("/login");
      return;
    }
    
  // Rol kontrolü kaldırıldı; tüm kullanıcılar erişebilir
    
    loadPendingFeedbacks();
  }, [router]);

  const loadPendingFeedbacks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://dentalapi.karadenizdis.com/api/feedback/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingFeedbacks(data.data || []);
      }
    } catch (error) {
      console.error('Bekleyen geri dönüşler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbackHistory = async () => {
    try {
      const token = localStorage.getItem("token");
  const response = await fetch(`https://dentalapi.karadenizdis.com/api/feedback/history?search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedbackHistory(data.data || []);
      }
    } catch (error) {
      console.error('Geri dönüş geçmişi yüklenirken hata:', error);
    }
  };

  const handleTabChange = (tab: 'pending' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      loadFeedbackHistory();
    }
  };

  const handleCreateFeedback = async () => {
    if (!selectedFeedbackItem) return;
    
    try {
      const token = localStorage.getItem("token");
  const response = await fetch(`https://dentalapi.karadenizdis.com/api/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planning_id: selectedFeedbackItem.planning_id,
          notes: feedbackNotes
        })
      });
      
      if (response.ok) {
        alert('Geri dönüş başarıyla kaydedildi');
        setShowModal(false);
        setFeedbackNotes("");
        setSelectedPatient(null);
        setSelectedFeedbackItem(null);
        loadPendingFeedbacks();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Geri dönüş kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Geri dönüş kaydedilirken hata:', error);
      alert('Geri dönüş kaydedilirken hata oluştu');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'due': return '#ff4757';
      case 'upcoming': return '#ffa502';
      default: return '#2ed573';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'due': return 'Geçmiş';
      case 'upcoming': return 'Yaklaşan';
      default: return 'Gelecek';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        Yükleniyor...
      </div>
    );
  }

  return (
    <AppLayout>
  <main style={{ padding: "16px 16px 0 16px", display: "flex", flexDirection: "column", minHeight: "100vh", background: "#e3eafc" }}>
          <div style={{ minHeight: "100vh", background: "#f5f6fa", padding: "20px", borderRadius: "8px" }}>
      {/* Header */}
      <div style={{ 
        background: "#1a237e", 
        color: "white", 
        padding: "16px 32px",
        borderRadius: "8px",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          🔄 Geri Dönüşler
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ 
        background: "white", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #e1e5e9"
      }}>
        <div style={{ 
          display: "flex", 
          borderBottom: "1px solid #e1e5e9" 
        }}>
          <button
            onClick={() => handleTabChange('pending')}
            style={{
              padding: "12px 24px",
              border: "none",
              background: activeTab === 'pending' ? "#1a237e" : "transparent",
              color: activeTab === 'pending' ? "white" : "#666",
              cursor: "pointer",
              fontWeight: activeTab === 'pending' ? "600" : "normal",
              borderRadius: activeTab === 'pending' ? "8px 0 0 0" : "0"
            }}
          >
            ⏰ Bekleyen Geri Dönüşler ({pendingFeedbacks.reduce((total, patient) => total + patient.feedback_items.length, 0)})
          </button>
          <button
            onClick={() => handleTabChange('history')}
            style={{
              padding: "12px 24px",
              border: "none",
              background: activeTab === 'history' ? "#1a237e" : "transparent",
              color: activeTab === 'history' ? "white" : "#666",
              cursor: "pointer",
              fontWeight: activeTab === 'history' ? "600" : "normal"
            }}
          >
            📋 Geri Dönüş Geçmişi
          </button>
        </div>

        {activeTab === 'pending' && (
          <div style={{ padding: "20px" }}>
            {pendingFeedbacks.length === 0 ? (
              <div style={{ 
                textAlign: "center", 
                padding: "40px", 
                color: "#666" 
              }}>
                <p>Bekleyen geri dönüş bulunmuyor.</p>
              </div>
            ) : (
              <div style={{ 
                display: "grid", 
                gap: "20px" 
              }}>
                {pendingFeedbacks.map((patient, index) => {
                  // En yakın feedback'in durumunu belirle
                  const earliestFeedback = patient.feedback_items.reduce((earliest, current) => 
                    new Date(current.planned_date) < new Date(earliest.planned_date) ? current : earliest
                  );
                  
                  return (
                    <div
                      key={index}
                      style={{
                        border: "1px solid #e1e5e9",
                        borderRadius: "8px",
                        padding: "20px",
                        background: "#fff",
                        borderLeft: `4px solid ${getStatusColor(earliestFeedback.status)}`
                      }}
                    >
                      {/* Hasta Bilgileri */}
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "flex-start",
                        marginBottom: "16px"
                      }}>
                        <div>
                          <h3 style={{ 
                            margin: "0 0 8px 0", 
                            color: "#2c3e50",
                            fontSize: "20px"
                          }}>
                            👤 {patient.patient_name}
                          </h3>
                          <p style={{ 
                            margin: "0 0 4px 0", 
                            color: "#666",
                            fontSize: "14px"
                          }}>
                            📞 {patient.phone}
                          </p>
                        </div>
                        <span style={{
                          background: getStatusColor(earliestFeedback.status),
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          En Yakın: {getStatusText(earliestFeedback.status)}
                        </span>
                      </div>
                      
                      {/* Geri Dönüş Listesi */}
                      <div style={{ 
                        background: "#f8f9fa",
                        borderRadius: "6px",
                        padding: "16px",
                        marginBottom: "16px"
                      }}>
                        <h4 style={{ 
                          margin: "0 0 12px 0",
                          color: "#495057",
                          fontSize: "16px"
                        }}>
                          Bekleyen Kontroller:
                        </h4>
                        <div style={{ 
                          display: "grid",
                          gap: "8px"
                        }}>
                          {patient.feedback_items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px",
                                background: "white",
                                borderRadius: "4px",
                                border: `1px solid ${getStatusColor(item.status)}20`
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ 
                                  fontWeight: "500",
                                  color: "#2c3e50",
                                  marginBottom: "4px"
                                }}>
                                  🦷 {item.treatment_name} - {item.interval_display}
                                </div>
                                <div style={{ 
                                  fontSize: "13px",
                                  color: "#666"
                                }}>
                                  📅 {formatDate(item.planned_date)}
                                  {item.days_until_due <= 0 && (
                                    <span style={{ 
                                      color: "#dc3545",
                                      fontWeight: "600",
                                      marginLeft: "8px"
                                    }}>
                                      ({Math.abs(Math.floor(item.days_until_due))} gün geçmiş)
                                    </span>
                                  )}
                                  {item.days_until_due > 0 && item.days_until_due <= 3 && (
                                    <span style={{ 
                                      color: "#fd7e14",
                                      fontWeight: "600",
                                      marginLeft: "8px"
                                    }}>
                                      ({Math.floor(item.days_until_due)} gün kaldı)
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setSelectedFeedbackItem(item);
                                  setShowModal(true);
                                }}
                                style={{
                                  background: getStatusColor(item.status),
                                  color: "white",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  marginLeft: "12px"
                                }}
                              >
                                Geri Dönüş Yaz
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
      <div style={{ padding: "20px" }}>
            <div style={{ marginBottom: "20px" }}>
        <input
                type="text"
                placeholder="Hasta adı, soyadı veya telefon ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  marginRight: "12px",
                  color: "#222",
                  fontWeight: 700
                }}
              />
              <button
                onClick={loadFeedbackHistory}
                style={{
                  background: "#1a237e",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Ara
              </button>
            </div>

            {feedbackHistory.length === 0 ? (
              <div style={{ 
                textAlign: "center", 
                padding: "40px", 
                color: "#666" 
              }}>
                <p>Geri dönüş geçmişi bulunmuyor.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px", width: "100%" }}>
                {feedbackHistory.map((patient) => (
                  <PatientHistoryCard key={patient.patient_id} patient={patient} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedPatient && selectedFeedbackItem && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "8px",
            width: "500px",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <h2 style={{ marginTop: 0, color: "#1a237e" }}>
              Geri Dönüş Kaydet
            </h2>
            
            <div style={{ marginBottom: "16px" }}>
              <strong>Hasta:</strong> {selectedPatient.patient_name}<br/>
              <strong>Telefon:</strong> {selectedPatient.phone}<br/>
              <strong>Tedavi:</strong> {selectedFeedbackItem.treatment_name}<br/>
              <strong>Kontrol Türü:</strong> {selectedFeedbackItem.interval_display}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: 700,
                color: "#222",
                fontSize: 15
              }}>
                Geri Dönüş Notları:
              </label>
              <textarea
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Hastanın durumu, şikayetleri, öneriler..."
                rows={6}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  color: "#222",
                  fontWeight: 700,
                  fontSize: "15px"
                }}
              />
            </div>

            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px"
            }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFeedbackNotes("");
                  setSelectedPatient(null);
                  setSelectedFeedbackItem(null);
                }}
                style={{
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                İptal
              </button>
              <button
                onClick={handleCreateFeedback}
                style={{
                  background: "#1a237e",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
          </div>
    </main>
  </AppLayout>
  );
}

// Hasta geçmişi kartı komponenti
function PatientHistoryCard({ patient }: { patient: FeedbackHistory }) {
  const [editModal, setEditModal] = useState<{ open: boolean; feedback: any | null }>({ open: false, feedback: null });
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Feedback güncelleme fonksiyonu
  const handleEditSave = async () => {
    if (!editModal.feedback) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://dentalapi.karadenizdis.com/api/feedback/${editModal.feedback.feedback_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ notes: editNote })
      });
      const data = await res.json();
      if (data.success) {
        // Güncellenen feedback'i localde değiştir
        if (typeof window !== "undefined") {
          editModal.feedback.notes = editNote;
        }
        setEditModal({ open: false, feedback: null });
      } else {
        alert(data.message || "Güncelleme başarısız");
      }
    } catch (e) {
      alert("Sunucu hatası: " + e);
    }
    setSaving(false);
  };
  const [selectedInterval, setSelectedInterval] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFeedbacks = selectedInterval === 'all' 
    ? patient.feedback_items 
    : patient.feedback_items.filter(item => item.interval === selectedInterval);

  const intervalOptions = [
    { value: 'all', label: 'Tümü' },
    { value: '1_week', label: '1 Hafta' },
    { value: '1_month', label: '1 Ay' },
    { value: '3_months', label: '3 Ay' },
    { value: '6_months', label: '6 Ay' }
  ];

  return (
    <div style={{
      border: "1px solid #e1e5e9",
      borderRadius: "8px",
      background: "#fff",
      overflow: "hidden"
    }}>
      {/* Hasta Başlığı */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: isExpanded ? "#f0f4ff" : "#f8f9fa",
          padding: "8px 12px",
          borderBottom: isExpanded ? "1px solid #e1e5e9" : "none",
          cursor: "pointer",
          transition: "background 0.18s, box-shadow 0.18s, transform 0.12s",
          boxShadow: isExpanded ? "0 2px 8px 0 rgba(30,34,90,0.06)" : "none",
          borderRadius: isExpanded ? "8px 8px 0 0" : "8px",
          minHeight: 0
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = "#f0f4ff";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px 0 rgba(30,34,90,0.08)";
          (e.currentTarget as HTMLElement).style.transform = "scale(1.012)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = isExpanded ? "#f0f4ff" : "#f8f9fa";
          (e.currentTarget as HTMLElement).style.boxShadow = isExpanded ? "0 2px 8px 0 rgba(30,34,90,0.06)" : "none";
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        }}
        onMouseDown={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
        }}
        onMouseUp={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.012)";
        }}
      >
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: isExpanded ? "6px" : "0"
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ 
              margin: "0 0 2px 0", 
              color: "#2c3e50",
              fontSize: "15px",
              fontWeight: 600,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {patient.patient_name}
            </h3>
            <div style={{
              fontSize: "11px",
              color: "#888",
              textAlign: "right",
              lineHeight: 1.1
            }}>
              Son geri dönüş: {formatDate(patient.last_feedback_date)}
            </div>
          </div>
          <div style={{
            fontSize: "18px",
            color: "#666",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease"
          }}>
            ▼
          </div>
        </div>

        {/* Interval Filtresi - sadece açık olduğunda göster */}
        {isExpanded && (
          <div style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap"
          }}>
            {intervalOptions.map(option => (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation(); // Parent'ın onClick'ini engelle
                  setSelectedInterval(option.value);
                }}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "20px",
                  background: selectedInterval === option.value ? "#1a237e" : "#fff",
                  color: selectedInterval === option.value ? "#fff" : "#666",
                  cursor: "pointer",
                  fontSize: "12px",
                  transition: "all 0.2s"
                }}
              >
                {option.label} 
                {option.value !== 'all' && ` (${patient.feedback_items.filter(item => item.interval === option.value).length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Geri Dönüş Listesi - sadece açık olduğunda göster */}
      {isExpanded && (
        <div style={{ padding: "8px 0 0 0" }}>
          {filteredFeedbacks.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "20px", 
              color: "#888",
              fontSize: "14px"
            }}>
              {selectedInterval === 'all' 
                ? 'Bu hasta için geri dönüş kaydı bulunmuyor.' 
                : 'Seçilen interval için geri dönüş kaydı bulunmuyor.'}
            </div>
          ) : (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
                <thead>
                  <tr style={{ background: "#f7f8fa", color: "#222", fontSize: 13, fontWeight: 600 }}>
                    <th style={{ padding: "8px 6px", borderBottom: "1px solid #ececec", textAlign: "left", width: 36 }}>#</th>
                    <th style={{ padding: "8px 6px", borderBottom: "1px solid #ececec", textAlign: "left" }}>Tedavi</th>
                    <th style={{ padding: "8px 6px", borderBottom: "1px solid #ececec", textAlign: "left" }}>Interval</th>
                    <th style={{ padding: "8px 6px", borderBottom: "1px solid #ececec", textAlign: "left" }}>Tarih</th>
                    <th style={{ padding: "8px 6px", borderBottom: "1px solid #ececec", textAlign: "left" }}>Not</th>
                    <th style={{ padding: "8px 6px", borderBottom: "1px solid #ececec", textAlign: "center", width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedbacks.map((feedback, idx) => (
                    <tr key={feedback.feedback_id} style={{ borderBottom: "1px solid #f0f0f0", background: idx % 2 === 0 ? "#fff" : "#fafbfc", transition: "background 0.2s" }}>
                      <td style={{ padding: "10px 6px", color: "#888", fontSize: 13 }}>{idx + 1}</td>
                      <td style={{ padding: "10px 6px", color: "#222", fontSize: 14, fontWeight: 500 }}>
                        🦷 {feedback.treatment_name}
                      </td>
                      <td style={{ padding: "10px 6px" }}>
                        <span style={{
                          background: "#e3e7fa",
                          color: "#1a237e",
                          padding: "2px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 500
                        }}>
                          {feedback.interval_display}
                        </span>
                      </td>
                      <td style={{ padding: "10px 6px", color: "#8a8fa3", fontSize: 13 }}>
                        {formatDate(feedback.feedback_date)}
                      </td>
                      <td style={{ padding: "10px 6px", color: feedback.notes ? "#555" : "#bbb", fontSize: 13, maxWidth: 220, whiteSpace: "pre-line", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {feedback.notes || <span style={{ color: "#ccc" }}>-</span>}
                      </td>
                      <td style={{ padding: "10px 6px", textAlign: "center" }}>
                        <button
                          style={{
                            background: "#f0f4ff",
                            border: "1px solid #c3d0f7",
                            color: "#1a237e",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "13px",
                            cursor: "pointer",
                            transition: "background 0.15s, border 0.15s"
                          }}
                          onClick={() => {
                            setEditModal({ open: true, feedback });
                            setEditNote(feedback.notes || "");
                          }}
                          title="Geri dönüşü düzenle"
                        >
                          Düzenle
                        </button>
                      </td>
      {/* Düzenleme Modalı */}
      {editModal.open && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 10,
            minWidth: 320,
            maxWidth: 400,
            boxShadow: "0 4px 24px 0 rgba(30,34,90,0.13)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}>
            <h4 style={{ margin: 0, fontSize: 18, color: "#1a237e" }}>Geri Dönüş Notunu Düzenle</h4>
            <textarea
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              rows={4}
              style={{ width: "100%", fontSize: 14, borderRadius: 6, border: "1px solid #c3d0f7", padding: 8, resize: "vertical" }}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setEditModal({ open: false, feedback: null })}
                style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #eee", background: "#f7f8fa", color: "#333", cursor: saving ? "not-allowed" : "pointer" }}
                disabled={saving}
              >İptal</button>
              <button
                onClick={handleEditSave}
                style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #1a237e", background: "#1a237e", color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
                disabled={saving}
              >Kaydet</button>
            </div>
          </div>
        </div>
      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
