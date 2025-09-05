import React, { useState, useEffect } from "react";

interface Doctor {
  user_id: number;
  first_name: string;
  last_name: string;
  branch_id: number;
}

interface Treatment {
  treatment_id: number;
  treatment_type_name: string;
  tooth_numbers: number[];
}

interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  status: string;
  notes: string;
  patient_first_name: string;
  patient_last_name: string;
  doctor_first_name: string;
  doctor_last_name: string;
  patient_name?: string;
}

interface AppointmentCardProps {
  doctor: Doctor;
  appointment: Appointment | null;
  onStatusUpdate: (appointmentId: number, status: string, notes: string, completedTreatmentId?: number) => void;
  role: string;
}

function AppointmentCard({ doctor, appointment, onStatusUpdate, role }: AppointmentCardProps) {
  const [availableTreatments, setAvailableTreatments] = useState<Treatment[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hasta değiştiğinde onaylanan tedavileri getir
  useEffect(() => {
    if (appointment?.patient_id) {
      fetchApprovedTreatments(appointment.patient_id);
    } else {
      setAvailableTreatments([]);
    }
  }, [appointment?.patient_id]);

  const fetchApprovedTreatments = async (patientId: number) => {
    try {
  const response = await fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`);
      const data = await response.json();
      
      if (data.success) {
        // Sadece onaylanan tedavileri filtrele
        const approvedTreatments = data.data
          .filter((t: any) => t.status === 'onaylanan')
          .map((t: any) => ({
            treatment_id: t.treatment_id,
            // Backend'ten treatment_name geliyor, bunu treatment_type_name olarak map et
            treatment_type_name: t.treatment_name || t.treatment_type_name || 'Bilinmeyen Tedavi',
            tooth_numbers: t.tooth_numbers || []
          }));
        setAvailableTreatments(approvedTreatments);
        console.log('Approved treatments:', approvedTreatments); // Debug için
      }
    } catch (error) {
      console.error('Tedaviler alınırken hata:', error);
      setAvailableTreatments([]);
    }
  };

  const handleStatusClick = async (status: string) => {
    if (!appointment) return;
    
    // Not zorunlu kontrolü
    if (!notes.trim()) {
      alert("Not yazması zorunludur!");
      return;
    }

    // Eğer "geldi" seçiliyorsa ve tedavi seçiliyorsa
    if (status === 'geldi' && selectedTreatment) {
      setIsLoading(true);
      await onStatusUpdate(appointment.appointment_id, status, notes.trim(), selectedTreatment);
      setIsLoading(false);
    } 
    // Eğer "gelmedi" seçiliyorsa ve tedavi seçiliyorsa - hata ver
    else if (status === 'gelmedi' && selectedTreatment) {
      alert("Biten tedavi seçiliyken 'Gelmedi' seçilemez!");
      return;
    }
    // Normal durum
    else {
      setIsLoading(true);
      await onStatusUpdate(appointment.appointment_id, status, notes.trim());
      setIsLoading(false);
    }
  };

  if (!appointment) {
    return (
      <div style={{
        background: "linear-gradient(120deg, #fafdff 60%, #e3eaff 100%)",
        borderRadius: 22,
        boxShadow: "0 8px 32px #1976d233, 0 1.5px 0 #1976d2",
        padding: 28,
        minWidth: 340,
        maxWidth: 340,
        height: 360,
        border: "2px solid #1976d2",
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'flex-start',
        position: 'relative' as const,
        alignItems: 'center',
        opacity: 0.7,
        marginBottom: 0
      }}>
        <div style={{
          fontWeight: 900,
          marginBottom: 14,
          fontSize: 20,
          color: "#1976d2",
          textAlign: "center",
          borderBottom: "2.5px solid #e3eaff",
          paddingBottom: 10,
          letterSpacing: 0.2,
          textShadow: "0 2px 8px #e3eaff77",
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{marginRight:4,verticalAlign:'middle'}}><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.12"/><path d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#1976d2"/></svg>
          Dt. {doctor.first_name} {doctor.last_name}
        </div>
        <div style={{ textAlign: "center", color: "#6073a6", fontWeight: 700, fontSize: 17, marginTop: 40 }}>
          Sıradaki randevu yok
        </div>
      </div>
    );
  }

  const isDoctor = role === "doctor";
  const cardStyle = {
    background: "linear-gradient(120deg, #fafdff 60%, #e3eaff 100%)",
    borderRadius: 22,
    boxShadow: "0 8px 32px #1976d233, 0 1.5px 0 #1976d2",
    padding: 28,
    minWidth: 320,
    maxWidth: 340,
    height: 360,
    border: "2px solid #1976d2",
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
  position: 'relative' as const,
    transition: 'box-shadow .18s, transform .18s',
    outline: 'none',
  };

  return (
    <div style={cardStyle}>
      <div style={{
        fontWeight: 900,
        marginBottom: 10,
        fontSize: 16,
        color: "#1976d2",
        textAlign: "center",
        borderBottom: "2.5px solid #e3eaff",
        paddingBottom: 7,
        letterSpacing: 0.15,
        textShadow: "0 2px 8px #e3eaff77",
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{marginRight:4,verticalAlign:'middle'}}><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.12"/><path d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#1976d2"/></svg>
        Dt. {doctor.first_name} {doctor.last_name}
      </div>
      

  <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 13.5, color: '#0d1333', letterSpacing: 0.15, display: 'flex', alignItems: 'center', gap: 5 }}>
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.18"/><path d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#1976d2"/></svg>
        Hasta: <span style={{ color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', fontWeight: 900 }}
          onClick={() => window.open(`/patients/card?id=${appointment.patient_id}`, '_blank')}
        >
          {appointment.patient_first_name || appointment.patient_last_name
            ? `${appointment.patient_first_name || ''} ${appointment.patient_last_name || ''}`.trim()
            : appointment.patient_name || 'Bilinmiyor'}
        </span>
      </div>

      <div style={{ fontSize: 12.5, color: '#222', marginBottom: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.13"/><path d="M12 7v5l4 2" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#1976d2" strokeWidth="2"/></svg>
        Randevu: <span style={{ color: '#1976d2', fontWeight: 800 }}>{new Date(appointment.appointment_time).toLocaleString('tr-TR')}</span>
      </div>

      <div style={{ fontSize: 12.5, color: '#333', marginBottom: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.10"/><path d="M19 7v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="7" y="3" width="10" height="4" rx="2" fill="#1976d2" opacity="0.18"/></svg>
        <span>Biten Tedavi:</span> <span style={{ color: '#1976d2', fontWeight: 800, marginLeft: 2 }}>isteğe bağlı</span>
      </div>

  <div style={{ marginBottom: 6 }}>
        <select
          value={selectedTreatment || ""}
          onChange={(e) => setSelectedTreatment(e.target.value ? parseInt(e.target.value) : null)}
          style={{
            width: "100%",
            padding: 7,
            borderRadius: 8,
            border: "1.2px solid #1976d2",
            fontSize: 12.5,
            color: '#1976d2',
            background: '#fafdff',
            fontWeight: 700,
            boxShadow: '0 1.5px 0 #e3eaff',
            transition: 'border .18s, box-shadow .18s',
            outline: 'none',
            marginTop: 2
          }}
        >
          <option value="" style={{ color: '#888' }}>Tedavi seç (isteğe bağlı)</option>
          {availableTreatments.map(treatment => (
            <option key={treatment.treatment_id} value={treatment.treatment_id} style={{ color: '#0d1333' }}>
              {treatment.treatment_type_name}
              {treatment.tooth_numbers.length > 0 && ` (Dişler: ${treatment.tooth_numbers.join(', ')})`}
            </option>
          ))}
        </select>
      </div>

  <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="NOT : (Zorunlu)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: "100%",
            padding: 7,
            borderRadius: 8,
            border: notes.trim() ? "1.2px solid #43a047" : "1.2px solid #e53935",
            fontSize: 12.5,
            color: '#1976d2',
            background: '#fafdff',
            fontWeight: 700,
            boxShadow: '0 1.5px 0 #e3eaff',
            transition: 'border .18s, box-shadow .18s',
            outline: 'none',
            marginTop: 2
          }}
        />
      </div>
      
  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 4 }}>
        <button 
          onClick={() => handleStatusClick('geldi')}
          disabled={isLoading || !notes.trim()}
          style={{ 
            background: (!notes.trim() || isLoading) ? "#b2dfdb" : "linear-gradient(90deg, #43a047 0%, #1976d2 100%)", 
            color: "#fff", 
            border: 0, 
            borderRadius: 10, 
            padding: "8px 22px", 
            fontWeight: 800, 
            cursor: (!notes.trim() || isLoading) ? "not-allowed" : "pointer", 
            fontSize: 12.5,
            boxShadow: (!notes.trim() || isLoading) ? "none" : "0 2px 8px #43a04733",
            transition: 'background .18s, transform .12s, box-shadow .18s',
            outline: 'none',
            letterSpacing: 0.1
          }}
        >
          {isLoading ? "Kaydediliyor..." : "Geldi"}
        </button>
        <button 
          onClick={() => handleStatusClick('gelmedi')}
          disabled={isLoading || !notes.trim() || !!selectedTreatment}
          style={{ 
            background: (!notes.trim() || isLoading || !!selectedTreatment) ? "#ffcdd2" : "linear-gradient(90deg, #e53935 0%, #1976d2 100%)", 
            color: "#fff", 
            border: 0, 
            borderRadius: 10, 
            padding: "8px 22px", 
            fontWeight: 800, 
            cursor: (!notes.trim() || isLoading || !!selectedTreatment) ? "not-allowed" : "pointer", 
            fontSize: 12.5,
            boxShadow: (!notes.trim() || isLoading || !!selectedTreatment) ? "none" : "0 2px 8px #e5393533",
            transition: 'background .18s, transform .12s, box-shadow .18s',
            outline: 'none',
            letterSpacing: 0.1
          }}
        >
          {isLoading ? "Kaydediliyor..." : "Gelmedi"}
        </button>
      </div>
    </div>
  );
}

export default function UpcomingAppointments({ role }: { role: string }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const [userBranchId, setUserBranchId] = useState<number>(1);

  // Kullanıcı bilgilerini al
  useEffect(() => {
    if (typeof window !== "undefined") {
      const branchId = parseInt(localStorage.getItem("branchId") || "1");
      
      // Kullanıcı ID'sini al
      let userId = null;
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user.user_id;
        } catch (e) {
          console.log('User data parse error:', e);
        }
      }
      
      // Admin için seçili şubeyi al, diğerleri kendi şubelerini kullan
      let activeBranchId = branchId;
      if (role === "admin" || role === "branch_manager" || role === "receptionist") {
        const selectedBranch = localStorage.getItem("selectedBranchId");
        if (selectedBranch && selectedBranch !== "") {
          activeBranchId = parseInt(selectedBranch);
        }
      }
      
      setUserBranchId(branchId);
      setSelectedBranchId(activeBranchId);
      setCurrentUserId(userId);
    }
  }, [role]);

  // Kullanıcı id'yi localStorage'dan al
useEffect(() => {
  // Kullanıcı id'yi localStorage'dan al
  if (typeof window !== 'undefined') {
    try {
      const uStr = localStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u?.user_id) setCurrentUserId(Number(u.user_id));
      }
    } catch {}
    setLoadingUser(false);
  }
}, []);

// Şube değişikliklerini dinle
useEffect(() => {
  const handleBranchChange = (event: any) => {
    const newBranchId = event.detail.branchId;
    setSelectedBranchId(newBranchId);
    // Şube değişince doktorlar ve randevuları otomatik getir
    fetchDoctors();
    fetchAppointments();
  };

  if (role === "admin" || role === "branch_manager" || role === "receptionist") {
    window.addEventListener('branchChanged', handleBranchChange);
    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }
}, [role]);

  // Doktorları getir
  const fetchDoctors = async () => {
    if (!selectedBranchId || selectedBranchId === 0) {
      setDoctors([]);
      return;
    }

    try {
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/branch/${selectedBranchId}/doctors`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setDoctors(data.data);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      console.error("Doktor getirme hatası:", err);
      setDoctors([]);
    }
  };

  // Randevuları getir
  const fetchAppointments = async () => {
    if (!selectedBranchId || selectedBranchId === 0) {
      setAppointments([]);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/appointment?branch_id=${selectedBranchId}&start_date=${today}&end_date=${today}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        // Sadece planlanmış (scheduled) randevuları al ve zamana göre sırala
        const scheduledAppointments = data.data
          .filter((apt: Appointment) => apt.status === 'scheduled')
          .sort((a: Appointment, b: Appointment) => 
            new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()
          );
        setAppointments(scheduledAppointments);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error("Randevu getirme hatası:", err);
      setAppointments([]);
    }
  };

  useEffect(() => {
    if (selectedBranchId && selectedBranchId > 0) {
      fetchDoctors();
      fetchAppointments();
    }
  }, [selectedBranchId]);

  // Randevu durumunu güncelle
  const handleStatusUpdate = async (appointmentId: number, status: string, notes: string, completedTreatmentId?: number) => {
    try {
      // Randevu durumunu güncelle
  const updateResponse = await fetch(`https://dentalapi.karadenizdis.com/api/appointment/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status === 'geldi' ? 'attended' : 'missed',
          notes: notes
        })
      });

      const updateResult = await updateResponse.json();

      if (!updateResult.success) {
        alert('Randevu güncellenirken hata oluştu');
        return;
      }

      // Eğer tedavi tamamlandı ise, tedavi durumunu güncelle
      if (status === 'geldi' && completedTreatmentId) {
  const treatmentResponse = await fetch(`https://dentalapi.karadenizdis.com/api/treatment/${completedTreatmentId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'tamamlanan' })
        });

        const treatmentResult = await treatmentResponse.json();

        if (!treatmentResult.success) {
          alert('Tedavi durumu güncellenirken hata oluştu');
          return;
        }
      }

      alert(`Randevu başarıyla ${status === 'geldi' ? 'tamamlandı' : 'kaçırıldı olarak işaretlendi'}!`);
      
      // Randevuları yenile
      fetchAppointments();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      alert('Güncelleme sırasında hata oluştu');
    }
  };

  // Her doktor için ilk randevuyu bul
  const getDoctorNextAppointment = (doctorId: number): Appointment | null => {
    return appointments.find(apt => String(apt.doctor_id) === String(doctorId)) || null;
  };

  // Doktor ise: Tek büyük kart ortada
  if (role === "doctor") {
    const currentDoctor = doctors.find(d => d.user_id === currentUserId);
    
    if (!currentDoctor) {
      return (
        <div style={{ textAlign: "center", marginTop: 32, color: "#555" }}>
          Doktor bilgisi bulunamadı.
        </div>
      );
    }

    const nextAppointment = getDoctorNextAppointment(currentDoctor.user_id);
    
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
        <AppointmentCard 
          doctor={currentDoctor}
          appointment={nextAppointment}
          onStatusUpdate={handleStatusUpdate}
          role={role}
        />
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div style={{ textAlign: "center", marginTop: 32, color: "#1a237e", fontWeight: 700, fontSize: 18 }}>
        Kullanıcı bilgileri yükleniyor...
      </div>
    );
  }
  // Admin/Manager/Receptionist: Her doktor için ayrı kart
  if (doctors.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: 32, color: "#555" }}>
        Bu şubede doktor bulunamadı.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row" as const,
        gap: 28,
        marginTop: 32,
        padding: "0 12px 16px 12px",
        overflowX: "auto",
        overflowY: "hidden",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  justifyContent: "center",
  alignItems: "stretch",
  scrollbarWidth: 'thin',
  WebkitOverflowScrolling: 'touch',
  minHeight: 400,
  scrollSnapType: 'x mandatory',
  paddingLeft: 600,
  paddingRight: 32,
      }}
    >
      {doctors.map((doctor) => {
        const nextAppointment = getDoctorNextAppointment(doctor.user_id);
        return (
          <div
            style={{
              width: 340,
              minWidth: 340,
              maxWidth: 340,
              flex: "0 0 340px",
              height: 360,
              overflow: "hidden",
              display: 'flex',
              alignItems: 'stretch',
              transition: 'box-shadow .18s, transform .18s',
              scrollSnapAlign: 'start',
              marginBottom: 0
            }}
            key={doctor.user_id}
          >
            <AppointmentCard
              doctor={doctor}
              appointment={nextAppointment}
              onStatusUpdate={handleStatusUpdate}
              role={role}
            />
          </div>
        );
      })}
    </div>
  );
}
