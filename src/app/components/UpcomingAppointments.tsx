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
        background: "white", 
        borderRadius: 12, 
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)", 
        padding: 18, 
        border: "1px solid #e3eafc",
        opacity: 0.6
      }}>
        <div style={{ 
          fontWeight: 700, 
          marginBottom: 10, 
          fontSize: 16, 
          color: "#1a237e", 
          textAlign: "center",
          borderBottom: "2px solid #e3eafc",
          paddingBottom: 8
        }}>
          Dt. {doctor.first_name} {doctor.last_name}
        </div>
        <div style={{ textAlign: "center", color: "#555", padding: "20px 0" }}>
          Sıradaki randevu yok
        </div>
      </div>
    );
  }

  const isDoctor = role === "doctor";
  const cardStyle = isDoctor ? {
    background: "white", 
    borderRadius: 12, 
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", 
    padding: 24, 
    minWidth: 350,
    maxWidth: 400,
    border: "2px solid #e3eafc"
  } : {
    background: "white", 
    borderRadius: 12, 
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", 
    padding: 18, 
    border: "1px solid #e3eafc"
  };

  return (
    <div style={cardStyle}>
      <div style={{ 
        fontWeight: 700, 
        marginBottom: isDoctor ? 12 : 10, 
        fontSize: isDoctor ? 18 : 16, 
        color: "#1a237e", 
        textAlign: "center",
        borderBottom: "2px solid #e3eafc",
        paddingBottom: 8
      }}>
  Dt. {doctor.first_name} {doctor.last_name}
      </div>
      

      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: isDoctor ? 15 : 15, color: '#0d1333', letterSpacing: 0.2 }}>
        Hasta: <span style={{ color: '#1976d2' }}>
          {appointment.patient_first_name || appointment.patient_last_name
            ? `${appointment.patient_first_name || ''} ${appointment.patient_last_name || ''}`.trim()
            : appointment.patient_name || 'Bilinmiyor'}
        </span>
      </div>

      <div style={{ fontSize: isDoctor ? 13 : 12, color: '#222', marginBottom: 8, fontWeight: 500 }}>
        Randevu: <span style={{ color: '#0d47a1' }}>{new Date(appointment.appointment_time).toLocaleString('tr-TR')}</span>
      </div>

      <div style={{ fontSize: isDoctor ? 15 : 14, color: '#333', marginBottom: 8, fontWeight: 500 }}>
        Biten Tedavi: <span style={{ color: '#1976d2', fontWeight: 700 }}>isteğe bağlı</span>
      </div>

      <div style={{ marginBottom: 8 }}>
        <select
          value={selectedTreatment || ""}
          onChange={(e) => setSelectedTreatment(e.target.value ? parseInt(e.target.value) : null)}
          style={{
            width: "100%",
            padding: isDoctor ? 9 : 7,
            borderRadius: 6,
            border: "1.5px solid #1976d2",
            fontSize: isDoctor ? 15 : 14,
            color: '#0d1333',
            background: '#f8fafc',
            fontWeight: 500
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

      <div style={{ marginBottom: isDoctor ? 12 : 10 }}>
        <input
          type="text"
          placeholder="NOT : (Zorunlu)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: "100%",
            padding: isDoctor ? 9 : 7,
            borderRadius: 6,
            border: notes.trim() ? "1.5px solid #4caf50" : "1.5px solid #f44336",
            fontSize: isDoctor ? 15 : 14,
            color: '#0d1333',
            background: '#f8fafc',
            fontWeight: 500
          }}
        />
      </div>
      
      <div style={{ display: "flex", gap: isDoctor ? 12 : 8, justifyContent: "center" }}>
        <button 
          onClick={() => handleStatusClick('geldi')}
          disabled={isLoading || !notes.trim()}
          style={{ 
            background: (!notes.trim() || isLoading) ? "#ccc" : "#4caf50", 
            color: "white", 
            border: 0, 
            borderRadius: 6, 
            padding: isDoctor ? "10px 28px" : "6px 20px", 
            fontWeight: 600, 
            cursor: (!notes.trim() || isLoading) ? "not-allowed" : "pointer", 
            fontSize: isDoctor ? 14 : 13 
          }}
        >
          {isLoading ? "Kaydediliyor..." : "Geldi"}
        </button>
        <button 
          onClick={() => handleStatusClick('gelmedi')}
          disabled={isLoading || !notes.trim() || !!selectedTreatment}
          style={{ 
            background: (!notes.trim() || isLoading || !!selectedTreatment) ? "#ccc" : "#e53935", 
            color: "white", 
            border: 0, 
            borderRadius: 6, 
            padding: isDoctor ? "10px 28px" : "6px 20px", 
            fontWeight: 600, 
            cursor: (!notes.trim() || isLoading || !!selectedTreatment) ? "not-allowed" : "pointer", 
            fontSize: isDoctor ? 14 : 13 
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
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const [userBranchId, setUserBranchId] = useState<number>(1);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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
    return appointments.find(apt => apt.doctor_id === doctorId) || null;
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
        gap: 20,
        marginTop: 32,
        padding: "0 12px",
        overflowX: "auto",
        maxWidth: "100vw",
        boxSizing: "border-box",
        justifyContent: "center",
        flexDirection: typeof window !== 'undefined' && window.innerWidth <= 600 ? 'column' : 'row',
        alignItems: typeof window !== 'undefined' && window.innerWidth <= 600 ? 'stretch' : 'flex-start'
      }}
    >
      {doctors.map((doctor) => {
        const nextAppointment = getDoctorNextAppointment(doctor.user_id);
        return (
          <div style={{ minWidth: 280, flex: "0 0 auto" }} key={doctor.user_id}>
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
