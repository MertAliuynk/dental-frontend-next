"use client";

<style jsx global>{`
  .rbc-addons-dnd-resize-ns-anchor {
          border: none !important;
          background: transparent !important;
        }
        .rbc-addons-dnd-resize-ew-anchor {
          border: none !important;
          background: transparent !important;
        }
  }
`}</style>

// SMS Gönderme Bölümü Bileşeni
function SmsSendSection({ createForm, patients, currentUser }: any) {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hasta ve şube bilgilerini bul
  const patient = patients.find((p: any) => p.patient_id == createForm.patientId);
  const branchName = currentUser?.branch_name || currentUser?.branch || "";
  const fullName = patient ? `${patient.first_name} ${patient.last_name}` : "";
  // Tarih ve saat formatlama
  let dateStr = "";
  let timeStr = "";
  if (createForm.selectedTime) {
    const dateObj = new Date(createForm.selectedTime);
    dateStr = dateObj.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
    timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  // Mesaj şablonu
  const smsText =
    `Sayın ${fullName} Karadeniz Diş Ağız ve diş sağlığı poliklinikleri tarafından ${dateStr} günü saat ${timeStr}'de ${branchName} şubesinde randevunuz oluşturulmuştur.`;

  // SMS gönderme fonksiyonu
  const sendSms = async () => {
    setSending(true);
    setSuccess(null);
    setError(null);
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: patient?.phone,
          message: smsText
        })
      });
      if (response.ok) {
        setSuccess("SMS başarıyla gönderildi.");
      } else {
        setError("SMS gönderilemedi.");
      }
    } catch (e) {
      setError("SMS gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      background: "#f8f9fa",
  border: "none",
      borderRadius: 8,
      padding: 16,
      marginBottom: 8
    }}>
      <div style={{ fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>SMS Önizleme:</div>
      <div style={{ fontSize: 15, color: "#222", marginBottom: 8 }}>{smsText}</div>
      <button
        onClick={sendSms}
        disabled={sending || !patient?.phone}
        style={{
          padding: "10px 20px",
          background: sending ? "#bdbdbd" : "#1976d2",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: sending ? "not-allowed" : "pointer",
          fontWeight: 600,
          fontSize: 14
        }}
      >
        {sending ? "Gönderiliyor..." : `SMS Gönder (${patient?.phone ? patient.phone : "Numara yok"})`}
      </button>
      {success && <div style={{ color: "#388e3c", marginTop: 8 }}>{success}</div>}
      {error && <div style={{ color: "#d32f2f", marginTop: 8 }}>{error}</div>}
    </div>
  );
}
import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import "./calendarResponsive.css";

// Define our custom event type
interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  rawData?: any;
}

const locales = { "tr-TR": tr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => 1, // Pazartesi başlangıcı (0: Pazar, 1: Pazartesi)
  getDay,
  locales,
});

// Drag and Drop Calendar oluştur
const DragAndDropCalendar = withDragAndDrop<CalendarEvent, object>(Calendar);

// Custom event component - tek renk ve mobil geliştirmeler
const CustomEvent = ({ event }: { event: CalendarEvent }) => {
  // Türkçe durum etiketi
  const statusMap: Record<string, string> = {
    pending: 'Bekliyor',
    approved: 'Onaylandı',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
    ongoing: 'Devam Ediyor',
    missed: 'Kaçırıldı',
    // Diğer olası durumlar eklenebilir
    'bekliyor': 'Bekliyor',
    'onaylandı': 'Onaylandı',
    'tamamlandı': 'Tamamlandı',
    'iptal': 'İptal',
    'devam': 'Devam Ediyor',
    'kaçırıldı': 'Kaçırıldı',
  };
  const raw = event.rawData || {};
  const session = raw.session_number || raw.session || null;
  const status = raw.status || raw.appointment_status || '';
  const statusLabel = statusMap[status?.toLowerCase?.()] || status;
  
  return (
    <div 
      className="custom-event"
      style={{
  cursor: 'move',
  height: '100%',
  padding: '4px 12px',
  borderRadius: '8px',
  background: '#1976d2', // dışardaki mavi ile aynı renk
  color: '#fff', // yazı beyaz
  fontSize: '13px',
  position: 'relative',
  border: 'none',
  boxShadow: '0 1px 4px #e3eaff33',
  fontWeight: 600,
  userSelect: 'none',
  touchAction: 'none'
      }}
    >
      <div style={{ 
        pointerEvents: 'none', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap',
        background: 'transparent'
      }}>
        {session && <span style={{ fontWeight: 700 }}>{`Seans ${session} - `}</span>}
        {event.title}
        {statusLabel && (
          <span style={{ marginLeft: 6, fontWeight: 600, fontSize: 11, color: '#1976d2', background: '#e3eafc', borderRadius: 4, padding: '1px 6px' }}>
            {statusLabel}
          </span>
        )}
      </div>
      {/* Notu alt satırda göster */}
      {event.rawData?.notes && (
        <div style={{
          marginTop: 2,
          fontSize: '12px',
          color: '#fff',
          fontWeight: 400,
          background: 'transparent',
          whiteSpace: 'pre-line',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {event.rawData.notes}
        </div>
      )}
    </div>
  );
};

export default function FullAppointmentCalendar() {
  // Şube filtreleme için state ve şube listesini çek
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  useEffect(() => {
    fetch("https://dentalapi.karadenizdis.com/api/branch")
      .then(res => res.json())
      .then(data => {
        if (data.success) setBranches(data.data);
      });
  }, []);
  // Kullanıcı rolünü ve ID'sini al
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('role');
      const userStr = localStorage.getItem('user');
      let userId = null;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.user_id;
        } catch {}
      }
      setCurrentUser({ role, userId });
      // Eğer doktor ise sadece kendi randevularını göster
      if (role === 'doctor' && userId) {
        setSelectedDoctorId(userId.toString());
      }
    }
  }, []);
  // Doktor renk paleti (rastgele veya sabit)
  const doctorColors = [
    '#3174ad', '#e53935', '#43a047', '#fbc02d', '#8e24aa', '#00897b', '#fb8c00', '#3949ab', '#d81b60', '#00acc1', '#7cb342', '#c62828'
  ];

  // Hekim ID'sine göre renk seç
  const getDoctorColor = (doctorId: string | number, idx: number) => {
    if (typeof doctorId === 'undefined' || doctorId === null) return doctorColors[idx % doctorColors.length];
    const idNum = parseInt(doctorId.toString(), 10);
    return doctorColors[(idNum + idx) % doctorColors.length];
  };
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<string>("day"); // Default olarak günlük
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Responsive design için ekran genişliğini takip et
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Ekran genişliğine göre uyarlanmış minimum genişlik
  const calendarMinWidth = windowWidth <= 550 
    ? (viewMode === "week" ? 500 : 320) 
    : windowWidth <= 768
      ? (viewMode === "week" ? 700 : 500)
      : (viewMode === "week" ? 900 : 650);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    notes: '',
    patient_name: '',
    doctor_name: ''
  });

  // Doktor seçimi için state'ler
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);

  // Yeni randevu oluşturma state'leri
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    patientId: '',
    doctorId: '',
    notes: '',
    duration: 30, // varsayılan 30 dakika
    selectedTime: null as Date | null
  });

  // Sayfa ilk açıldığında URL'den patientId parametresi varsa createForm'a ata
  useEffect(() => {
    const urlPatientId = searchParams.get('patientId');
    if (urlPatientId) {
      setCreateForm(prev => ({ ...prev, patientId: urlPatientId }));
    }
  }, [searchParams]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  // Arama state'leri
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [searchedPatients, setSearchedPatients] = useState<any[]>([]);

  // Hasta arama fonksiyonu (API'den)
  const searchPatients = async (search: string) => {
    if (!search) {
      setSearchedPatients([]);
      return;
    }
    try {
      const params = new URLSearchParams();
      params.append("search", search);
      if (selectedBranch) {
        params.append("branch_id", selectedBranch.toString());
      }
      const res = await fetch(`https://dentalapi.karadenizdis.com/api/patient?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSearchedPatients(data.data);
      } else {
        setSearchedPatients([]);
      }
    } catch (err) {
      setSearchedPatients([]);
    }
  };

  async function fetchAppointments() {
    try {
  let url = "https://dentalapi.karadenizdis.com/api/appointment";
      const params = new URLSearchParams();
      
      // Tarih aralığı seçilmişse API parametrelerini ekle
      if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else if (viewMode === "day") {
        // Günlük görünümde sadece seçilen günü getir
        const dateStr = selectedDate.toISOString().split('T')[0];
        params.append('start_date', dateStr);
        params.append('end_date', dateStr);
      } else if (viewMode === "week") {
        // Haftalık görünümde haftanın başı ve sonu
        const startOfWeekDate = new Date(selectedDate);
        startOfWeekDate.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // Pazartesi
        const endOfWeekDate = new Date(startOfWeekDate);
        endOfWeekDate.setDate(startOfWeekDate.getDate() + 6); // Pazar
        
        params.append('start_date', startOfWeekDate.toISOString().split('T')[0]);
        params.append('end_date', endOfWeekDate.toISOString().split('T')[0]);
      } else if (viewMode === "month") {
        // Aylık görünümde ayın başı ve sonu
        const startOfMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endOfMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        
        params.append('start_date', startOfMonthDate.toISOString().split('T')[0]);
        params.append('end_date', endOfMonthDate.toISOString().split('T')[0]);
      }

      // Doktor filtresi ekle
      if (selectedDoctorId && selectedDoctorId !== "all") {
        params.append('doctor_id', selectedDoctorId);
      }

      // URL'i oluştur
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🔄 Fetching appointments from URL:', url);
      console.log('📅 Selected date:', selectedDate);
      console.log('👁️ View mode:', viewMode);
      console.log('🩺 Selected doctor ID:', selectedDoctorId);
      
      const res = await fetch(url);
      const data = await res.json();
      console.log('📥 API Response:', data);
      
      if (data.success) {
        const mapped = data.data.map((item: any) => ({
            title:
              (item.patient_name
                ? `${item.patient_name} - Dr. ${item.doctor_first_name || ''} ${item.doctor_last_name || ''}`.trim() + (item.notes ? ` - ${item.notes}` : '')
                : (item.notes || "Randevu")),
            start: new Date(item.appointment_time),
            end: new Date(new Date(item.appointment_time).getTime() + (item.duration_minutes || 30) * 60000),
            id: item.appointment_id,
            rawData: item, // Tüm randevu verilerini saklayalım
          }));
        console.log('📊 Mapped events:', mapped);
        setEvents(mapped);
      }
    } catch (err) {
      console.error('❌ Fetch appointments error:', err);
      setEvents([]);
    }
  }

  useEffect(() => { 
    loadUserInfo();
    fetchAvailableDoctors();
  }, []); // İlk yüklemede çalış

  useEffect(() => { 
    fetchAppointments(); 
    fetchPatients();
    fetchDoctors();
  }, [selectedDate, viewMode, startDate, endDate, selectedDoctorId]); // Doktor seçimi değiştiğinde de güncelle

  // Events state'i değiştiğinde console'a yazdır
  useEffect(() => {
    console.log('🎯 Events state updated:', events);
    console.log('📊 Events count:', events.length);
    if (events.length > 0) {
      console.log('📝 First event:', events[0]);
    }
  }, [events]);

  // Kullanıcı bilgilerini yükle
  const loadUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        
        // Eğer giriş yapan kullanıcı doktor ise, otomatik olarak kendi randevularını göster
        if (user.role === 'doctor') {
          setSelectedDoctorId(user.user_id.toString());
          // Yeni randevu oluştururken otomatik doktor ataması
          setCreateForm(prev => ({ ...prev, doctorId: user.user_id.toString() }));
        }
      }
    } catch (err) {
      console.error('Kullanıcı bilgisi alınamadı:', err);
    }
  };

  // Mevcut doktorları getir (admin/manager/receptionist için)
  const fetchAvailableDoctors = async () => {
    try {
      const res = await fetch("https://dentalapi.karadenizdis.com/api/user/doctors");
      const data = await res.json();
      if (data.success) {
        let branchId = null;
        if (currentUser && (currentUser.branch_id || currentUser.branchId)) {
          branchId = currentUser.branch_id || currentUser.branchId;
        } else {
          // localStorage'dan al
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            branchId = user.branch_id || user.branchId;
          }
        }
        if (branchId !== null && branchId !== undefined && branchId !== "") {
          const filtered = data.data.filter((d: any) => String(d.branch_id) === String(branchId));
          setAvailableDoctors(filtered);
        } else {
          setAvailableDoctors(data.data);
        }
      }
    } catch (err) {
      console.error('Doktorlar alınamadı:', err);
    }
  };

  // Hastaları getir
  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) {
        params.append("branch_id", selectedBranch.toString());
      }
      const res = await fetch(`https://dentalapi.karadenizdis.com/api/patient?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPatients(data.data);
      }
    } catch (err) {
      console.error('Hastalar alınamadı:', err);
    }
  };

  // Doktorları getir
  const fetchDoctors = async () => {
    try {
      const res = await fetch("https://dentalapi.karadenizdis.com/api/user/doctors");
      const data = await res.json();
      if (data.success) {
        let branchId = null;
        if (currentUser && (currentUser.branch_id || currentUser.branchId)) {
          branchId = currentUser.branch_id || currentUser.branchId;
        } else {
          // localStorage'dan al
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            branchId = user.branch_id || user.branchId;
          }
        }
        if (branchId !== null && branchId !== undefined && branchId !== "") {
          const filtered = data.data.filter((d: any) => String(d.branch_id) === String(branchId));
          setDoctors(filtered);
        } else {
          setDoctors(data.data);
        }
      }
    } catch (err) {
      console.error('Doktorlar alınamadı:', err);
    }
  };

  // Navigasyon fonksiyonları
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Navigation fonksiyonları - view mode'a göre
  const goToPrevious = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(selectedDate.getDate() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(selectedDate.getDate() - 7);
    } else if (viewMode === "month") {
      newDate.setMonth(selectedDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(selectedDate.getDate() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(selectedDate.getDate() + 7);
    } else if (viewMode === "month") {
      newDate.setMonth(selectedDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  // Basit Drag & Drop Event Handlers
  const moveEvent = async ({ event, start, end }: any) => {
    try {
      // 15 dakikalık grid'e hizala
      const alignedStart = new Date(Math.round(start.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000));
      const alignedEnd = new Date(Math.round(end.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000));
      const duration = Math.round((alignedEnd.getTime() - alignedStart.getTime()) / (1000 * 60));

      console.log('🔄 Moving event:', {
        eventId: event.id,
        originalStart: event.start,
        originalEnd: event.end,
        newStart: alignedStart,
        newEnd: alignedEnd,
        duration: duration
      });

      // UTC olarak gönder
      const requestBody = {
        appointmentTime: alignedStart.toISOString(),
        duration: duration
      };
      
      console.log('📤 Request body (with timezone fix):', requestBody);

  const response = await fetch(`https://dentalapi.karadenizdis.com/api/appointment/${event.id}/time-duration`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log('📥 Backend response:', result);

      if (response.ok && result.success) {
        // Başarılı ise events state'ini güncelle
        setEvents(prevEvents => 
          prevEvents.map(existingEvent => 
            existingEvent.id === event.id 
              ? { ...existingEvent, start: alignedStart, end: alignedEnd }
              : existingEvent
          )
        );
        console.log('✅ Event updated successfully');
      } else {
        console.error('❌ Update failed:', result.message);
        fetchAppointments(); // Hata durumunda yenile
      }
    } catch (error) {
      console.error('❌ Move event error:', error);
      fetchAppointments(); // Hata durumunda yenile
    }
  };

  const resizeEvent = async ({ event, start, end }: any) => {
    try {
      // 15 dakikalık grid'e hizala
      const alignedStart = new Date(Math.round(start.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000));
      const alignedEnd = new Date(Math.round(end.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000));
      const newDuration = Math.round((alignedEnd.getTime() - alignedStart.getTime()) / (1000 * 60));

      // Minimum 15 dakika kontrolü
      if (newDuration < 15) {
        fetchAppointments();
        return;
      }

      // Türkiye saat dilimine göre düzeltme - UTC+3
      const localTime = new Date(alignedStart.getTime() + (3 * 60 * 60 * 1000));

      // Backend'e randevu süre güncelleme isteği gönder
  const response = await fetch(`https://dentalapi.karadenizdis.com/api/appointment/${event.id}/time-duration`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentTime: localTime.toISOString(),
          duration: newDuration
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        // Başarılı ise events state'ini güncelle
        setEvents(prevEvents => 
          prevEvents.map(existingEvent => 
            existingEvent.id === event.id 
              ? { ...existingEvent, start: alignedStart, end: alignedEnd }
              : existingEvent
          )
        );
      } else {
        fetchAppointments(); // Hata durumunda yenile
      }
    } catch (error) {
      fetchAppointments(); // Hata durumunda yenile
    }
  };

  // Randevu seçimi (tıklama) - Modal açmak için
  const selectEvent = (event: any) => {
    setEditingAppointment(event);
    setEditForm({
      notes: event.rawData?.notes || '',
      patient_name: event.rawData?.patient_name || 'Bilinmiyor',
      doctor_name: event.rawData?.doctor_first_name && event.rawData?.doctor_last_name 
        ? `Dr. ${event.rawData.doctor_first_name} ${event.rawData.doctor_last_name}`
        : 'Bilinmiyor'
    });
    setShowEditModal(true);
  };

  // Randevu not güncelleme - PATCH endpoint kullan
  const updateAppointmentNotes = async () => {
    if (!editingAppointment) return;

    try {
  const response = await fetch(`https://dentalapi.karadenizdis.com/api/appointment/${editingAppointment.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: editForm.notes
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        // Başarılı ise events state'inde güncelle
        setEvents(prevEvents => prevEvents.map(event => {
          if (event.id === editingAppointment.id) {
            return {
              ...event,
              title: event.title.replace(/ - .*$/, '') + (editForm.notes ? ` - ${editForm.notes}` : ''),
              rawData: {
                ...event.rawData,
                notes: editForm.notes
              }
            };
          }
          return event;
        }));
        setShowEditModal(false);
        setEditingAppointment(null);
        alert('Randevu notu güncellendi!');
      } else {
        alert(result.message || 'Güncelleme başarısız!');
      }
    } catch (error) {
      alert('Sunucu hatası!');
    }
  };

  // Randevu silme - DELETE endpoint kullan
  const deleteAppointment = async () => {
    if (!editingAppointment) return;

    if (!confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) return;

    try {
  const response = await fetch(`https://dentalapi.karadenizdis.com/api/appointment/${editingAppointment.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (response.ok && result.success) {
        // Başarılı ise silinen randevuyu events'ten çıkar
        setEvents(prevEvents => prevEvents.filter(event => event.id !== editingAppointment.id));
        setShowEditModal(false);
        setEditingAppointment(null);
        alert('Randevu silindi!');
      } else {
        alert(result.message || 'Silme başarısız!');
      }
    } catch (error) {
      alert('Sunucu hatası!');
    }
  };

  // Modal kapatma
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAppointment(null);
    setEditForm({ notes: '', patient_name: '', doctor_name: '' });
  };

  // Boş alana tıklama - Yeni randevu oluşturma modalı aç
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // 15 dakikalık grid'e hizala
    const alignedStart = new Date(Math.round(start.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000));
    
    setCreateForm({
      patientId: '',
      doctorId: currentUser?.role === 'doctor' ? String(currentUser.user_id) : '',
      notes: '',
      duration: 30,
      selectedTime: alignedStart
    });
    setShowCreateModal(true);
  };

  // Yeni randevu oluştur
  const createAppointment = async () => {
    // Doktor ise zorunlu olarak kendi id'sini kullan
    const enforcedDoctorId = currentUser?.role === 'doctor' ? String(currentUser.user_id) : createForm.doctorId;
    if (!createForm.patientId || !enforcedDoctorId || !createForm.selectedTime) {
      alert('Lütfen hasta, doktor ve zaman seçiniz!');
      return;
    }

    try {
      console.log('Randevu oluşturma isteği:', {
        patientId: parseInt(createForm.patientId),
        doctorId: parseInt(enforcedDoctorId),
        appointmentTime: createForm.selectedTime.toISOString(),
        duration: createForm.duration,
        notes: createForm.notes
      });

  const response = await fetch('https://dentalapi.karadenizdis.com/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: parseInt(createForm.patientId),
          doctorId: parseInt(enforcedDoctorId),
          appointmentTime: createForm.selectedTime.toISOString(),
          duration: createForm.duration,
          notes: createForm.notes
        }),
      });

      const result = await response.json();
      console.log('Backend response:', result);

      if (response.ok && result.success) {
        // Backend'den dönen hasta ve doktor adını kullan
        const d = result.data;
        const newEvent = {
          title: `Dr. ${d.doctor_first_name || ''} ${d.doctor_last_name || ''}`.trim() + (createForm.notes ? ` - ${createForm.notes}` : ''),
          start: createForm.selectedTime,
          end: new Date(createForm.selectedTime.getTime() + createForm.duration * 60000),
          id: d.appointment_id,
          rawData: {
            ...d
          }
        };

        setEvents(prevEvents => [...prevEvents, newEvent]);
        setShowCreateModal(false);
        setCreateForm({
          patientId: '',
          doctorId: '',
          notes: '',
          duration: 30,
          selectedTime: null
        });
        setPatientSearch('');
        setDoctorSearch('');
        setShowPatientDropdown(false);
        setShowDoctorDropdown(false);
  // alert('Randevu oluşturuldu!'); // Bildirim kaldırıldı, istek üzerine
      } else {
        alert(result.message || 'Randevu oluşturulamadı!');
      }
    } catch (error) {
      console.error('Randevu oluşturma hatası:', error);
      alert('Sunucu hatası!');
    }
  };

  // Yeni randevu modalını kapat
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm({
      patientId: '',
      doctorId: '',
      notes: '',
      duration: 30,
      selectedTime: null
    });
    // Arama state'lerini temizle
    setPatientSearch('');
    setDoctorSearch('');
    setShowPatientDropdown(false);
    setShowDoctorDropdown(false);
  };

  // Hasta seçimi fonksiyonları
  const selectPatient = (patient: any) => {
    setCreateForm({...createForm, patientId: patient.patient_id.toString()});
    setPatientSearch(`${patient.first_name} ${patient.last_name} - ${patient.phone}`);
    setShowPatientDropdown(false);
  };

  const clearPatientSelection = () => {
    setCreateForm({...createForm, patientId: ''});
    setPatientSearch('');
    setShowPatientDropdown(false);
  };

  // Doktor seçimi fonksiyonları
  const selectDoctor = (doctor: any) => {
    setCreateForm({...createForm, doctorId: doctor.user_id.toString()});
    setDoctorSearch(`Dr. ${doctor.first_name} ${doctor.last_name}`);
    setShowDoctorDropdown(false);
  };

  const clearDoctorSelection = () => {
    setCreateForm({...createForm, doctorId: ''});
    setDoctorSearch('');
    setShowDoctorDropdown(false);
  };

  // Filtrelenmiş hasta listesi
  const filteredPatients = patients.filter(patient => 
    `${patient.first_name} ${patient.last_name} ${patient.phone}`.toLowerCase()
    .includes(patientSearch.toLowerCase())
  );

  // Filtrelenmiş doktor listesi
  const filteredDoctors = doctors.filter(doctor => 
    `${doctor.first_name} ${doctor.last_name}`.toLowerCase()
    .includes(doctorSearch.toLowerCase())
  );

  return (
    <div style={{
      background: "#f5f6fa",
      borderRadius: 12,
      padding: windowWidth <= 550 ? 8 : (windowWidth <= 768 ? 12 : 24),
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      margin: windowWidth <= 550 ? 4 : (windowWidth <= 768 ? 8 : 24),
      minHeight: windowWidth <= 550 ? "auto" : (windowWidth <= 768 ? "auto" : 800),
      maxWidth: "100%",
      boxSizing: "border-box"
    }}>
      {/* Header with Navigation */}
      <div className="cal-toolbar" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: windowWidth <= 550 ? 10 : (windowWidth <= 768 ? 16 : 24),
        flexWrap: "wrap",
        gap: windowWidth <= 550 ? 8 : 12
      }}>
        <h2 className="cal-title" style={{
          fontWeight: 700,
          fontSize: 24,
          margin: 0,
          color: "#2d3a4a"
        }}>
          Randevu Takvimi
        </h2>
        
        {/* Tarih Aralığı ve Görünüm Kontrolleri */}
  <div className="cal-filters" style={{ 
    display: "flex", 
    gap: windowWidth <= 550 ? 8 : 16, 
    alignItems: "center", 
    flex: windowWidth <= 550 ? "1 1 auto" : "1 1 600px", 
    minWidth: windowWidth <= 550 ? "auto" : 260 
  }}>
          {/* Görünüm Seçici */}
          <div style={{ display: "flex", alignItems: "center", gap: windowWidth <= 550 ? 4 : 8 }}>
            <span style={{ 
              fontSize: windowWidth <= 550 ? 12 : 14, 
              fontWeight: 600, 
              color: "#2d3a4a" 
            }}>Görünüm:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              style={{
                padding: windowWidth <= 550 ? "4px 8px" : "6px 12px",
                border: "2px solid #e3eafc",
                borderRadius: 6,
                fontSize: windowWidth <= 550 ? 12 : 14,
                fontWeight: 600,
                background: "#fff",
                color: "#2d3a4a",
                cursor: "pointer",
                maxWidth: windowWidth <= 550 ? 85 : "auto"
              }}
            >
              <option value="day">Günlük</option>
              <option value="week">Haftalık</option>
              <option value="month">Aylık</option>
            </select>
          </div>

          {/* Tarih Aralığı Seçici kaldırıldı */}

          {/* Doktor Seçici - Sadece admin, branch_manager, receptionist için */}
          {currentUser && ['admin', 'branch_manager', 'receptionist'].includes(currentUser.role) && (
            <div style={{ display: "flex", alignItems: "center", gap: windowWidth <= 550 ? 4 : 8 }}>
              <span style={{ 
                fontSize: windowWidth <= 550 ? 12 : 14, 
                fontWeight: 600, 
                color: "#2d3a4a" 
              }}>Doktor:</span>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{
                  padding: windowWidth <= 550 ? "4px 8px" : "6px 12px",
                  border: "2px solid #e3eafc",
                  borderRadius: 6,
                  fontSize: windowWidth <= 550 ? 12 : 14,
                  fontWeight: 600,
                  background: "#fff",
                  color: "#2d3a4a",
                  cursor: "pointer",
                  minWidth: windowWidth <= 550 ? 90 : (windowWidth <= 768 ? 120 : 150),
                  maxWidth: windowWidth <= 550 ? 120 : "none"
                }}
              >
                <option value="all">Tüm Doktorlar</option>
                {availableDoctors.map(doctor => (
                  <option key={doctor.user_id} value={doctor.user_id.toString()}>
                    Dt. {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
  <div className="cal-nav" style={{ 
    display: "flex", 
    gap: windowWidth <= 550 ? 2 : 8, 
    alignItems: "center", 
    flex: windowWidth <= 550 ? "1 1 auto" : "1 1 320px", 
    justifyContent: "flex-end", 
    flexWrap: "nowrap", 
    maxWidth: "100%"
  }}>
          <button
            onClick={goToPrevious}
            style={{
              padding: windowWidth <= 550 ? "5px 8px" : "8px 16px",
              background: "#fff",
              border: "2px solid #e3eafc",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              color: "#2d3a4a",
              fontSize: windowWidth <= 550 ? 12 : 14,
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: windowWidth <= 550 ? "33%" : "auto"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#e3eafc";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.transform = "translateY(0px)";
            }}
          >
            ← {windowWidth <= 550 
                ? (viewMode === "day" ? "Önce" : viewMode === "week" ? "Önce" : "Önce") 
                : (viewMode === "day" ? "Önceki Gün" : viewMode === "week" ? "Önceki Hafta" : "Önceki Ay")
              }
          </button>
          
          <button
            onClick={goToToday}
            style={{
              padding: windowWidth <= 550 ? "5px 8px" : "8px 16px",
              background: "#1a237e",
              border: "2px solid #1a237e",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              color: "#fff",
              fontSize: windowWidth <= 550 ? 12 : 14,
              transition: "all 0.2s ease",
              flex: windowWidth <= 550 ? "0 0 auto" : "none"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#0d1559";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#1a237e";
              e.currentTarget.style.transform = "translateY(0px)";
            }}
          >
            Bugün
          </button>
          
          <button
            onClick={goToNext}
            style={{
              padding: windowWidth <= 550 ? "5px 8px" : "8px 16px",
              background: "#fff",
              border: "2px solid #e3eafc",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              color: "#2d3a4a",
              fontSize: windowWidth <= 550 ? 12 : 14,
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: windowWidth <= 550 ? "33%" : "auto"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#e3eafc";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.transform = "translateY(0px)";
            }}
          >
            {windowWidth <= 550
              ? (viewMode === "day" ? "Sonra" : viewMode === "week" ? "Sonra" : "Sonra")
              : (viewMode === "day" ? "Sonraki Gün" : viewMode === "week" ? "Sonraki Hafta" : "Sonraki Ay")
            } →
          </button>
        </div>
  </div>

      {/* Main Calendar Container - Ana sayfadaki ile aynı stil */}
      <div style={{ 
        background: "white", 
        borderRadius: 12, 
        padding: windowWidth <= 550 ? 10 : (windowWidth <= 768 ? 16 : 24),
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)", 
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden"
      }}>
        <div style={{ 
          fontWeight: 700, 
          marginBottom: windowWidth <= 550 ? 10 : 16, 
          textAlign: "center", 
          color: "#1a237e", 
          fontSize: windowWidth <= 550 ? 16 : (windowWidth <= 768 ? 18 : 20),
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: windowWidth <= 550 ? "normal" : "nowrap"
        }}>
          {startDate && endDate ? (
            `${new Date(startDate).toLocaleDateString('tr-TR')} - ${new Date(endDate).toLocaleDateString('tr-TR')} Randevuları`
          ) : viewMode === "day" ? (
            `${selectedDate.toLocaleDateString('tr-TR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} Randevuları`
          ) : viewMode === "week" ? (
            (() => {
              const startOfWeekDate = new Date(selectedDate);
              startOfWeekDate.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // Pazartesi
              const endOfWeekDate = new Date(startOfWeekDate);
              endOfWeekDate.setDate(startOfWeekDate.getDate() + 6); // Pazar
              
              return `${startOfWeekDate.getDate()}-${endOfWeekDate.getDate()} ${endOfWeekDate.toLocaleDateString('tr-TR', { 
                month: 'long',
                year: 'numeric'
              })} Haftalık Randevular`;
            })()
          ) : (
            `${selectedDate.toLocaleDateString('tr-TR', { 
              year: 'numeric', 
              month: 'long' 
            })} Randevuları`
          )}
        </div>
        
        {/* Calendar - Günlük görünümde tüm doktorlar için grid bölme */}
        {viewMode === 'day' && selectedDoctorId === 'all' ? (
          <div style={{ width: '100%', display: 'flex', gap: 18, overflowX: 'auto', maxWidth: '100vw', minHeight: 600 }}>
            {availableDoctors.map((doctor, idx) => {
              const doctorEvents = events.filter(ev => String(ev.rawData?.doctor_id) === String(doctor.user_id));
              return (
                <div key={doctor.user_id} style={{ minWidth: 340, flex: '1 1 0', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 8, border: `2px solid ${getDoctorColor(doctor.user_id, idx)}` }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: getDoctorColor(doctor.user_id, idx), textAlign: 'center', marginBottom: 8 }}>
                    Dt. {doctor.first_name} {doctor.last_name}
                  </div>
                  <DragAndDropCalendar
                    localizer={localizer}
                    events={doctorEvents}
                    view={'day'}
                    views={{ day: true }}
                    date={selectedDate}
                    onView={() => {}}
                    onNavigate={setSelectedDate}
                    min={new Date(selectedDate.setHours(8, 0, 0, 0))}
                    max={new Date(selectedDate.setHours(23, 0, 0, 0))}
                    step={15}
                    timeslots={4}
                    style={{ height: windowWidth <= 550 ? 600 : 700, background: 'white', borderRadius: 12, marginBottom: 24 }}
                    toolbar={false}
                    eventPropGetter={() => ({
                      style: {
                        backgroundColor: getDoctorColor(doctor.user_id, idx),
                        color: 'white',
                        borderRadius: 6,
                        border: `1.5px solid ${getDoctorColor(doctor.user_id, idx)}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontWeight: 600,
                      },
                    })}
                    components={{ event: CustomEvent }}
                    onEventDrop={moveEvent}
                    onEventResize={resizeEvent}
                    onSelectEvent={selectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable={true}
                    longPressThreshold={10}
                    formats={{
                      timeGutterFormat: (date) => {
                        const minutes = date.getMinutes();
                        // 24 saatlik Türk formatı
                        return minutes === 0 ? date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                      },
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", maxWidth: "100%", touchAction: "pan-x", userSelect: "none" }}>
            <div style={{ minWidth: windowWidth <= 550 ? "100%" : calendarMinWidth, width: "100%", overflow: windowWidth <= 550 ? "auto" : "visible" }}>
              <DragAndDropCalendar
                localizer={localizer}
                events={events}
                view={viewMode as any}
                views={{ day: true, week: true, month: true }}
                date={selectedDate}
                onView={(view) => setViewMode(view)}
                onNavigate={setSelectedDate}
                min={new Date(new Date().setHours(8, 0, 0, 0))}
                max={new Date(new Date().setHours(23, 0, 0, 0))}
                step={15}
                timeslots={4}
                style={{ height: windowWidth <= 550 ? (viewMode === "month" ? 320 : viewMode === "week" ? 350 : 400) : windowWidth <= 768 ? (viewMode === "month" ? 550 : viewMode === "week" ? 600 : 700) : (viewMode === "month" ? 600 : viewMode === "week" ? 700 : 800), width: "100%", background: "white" }}
                toolbar={false}
                onEventDrop={viewMode !== "month" ? moveEvent : undefined}
                onEventResize={viewMode !== "month" ? resizeEvent : undefined}
                resizable={viewMode !== "month"}
                draggableAccessor={() => viewMode !== "month"}
                resizableAccessor={() => viewMode !== "month"}
                eventPropGetter={(event: any) => ({
                  className: 'calendar-event rbc-event-with-touch-support',
                  style: {
                    backgroundColor: '#3174ad',
                    touchAction: 'none',
                    border: windowWidth <= 768 ? '2px solid rgba(255, 255, 255, 0.3)' : undefined
                  }
                })}
                longPressThreshold={10}
                startAccessor="start"
                endAccessor="end"
                components={{
                  event: CustomEvent,
                  month: {
                    event: ({ event }: any) => {
                      const raw = event.rawData || {};
                      const session = raw.session_number || raw.session || null;
                      const status = raw.status || raw.appointment_status || '';
                      const statusMap: Record<string, string> = {
                        pending: 'Bekliyor',
                        approved: 'Onaylandı',
                        completed: 'Tamamlandı',
                        cancelled: 'İptal',
                        ongoing: 'Devam Ediyor',
                        missed: 'Kaçırıldı',
                        'bekliyor': 'Bekliyor',
                        'onaylandı': 'Onaylandı',
                        'tamamlandı': 'Tamamlandı',
                        'iptal': 'İptal',
                        'devam': 'Devam Ediyor',
                        'kaçırıldı': 'Kaçırıldı',
                      };
                      const statusLabel = statusMap[status?.toLowerCase?.()] || status;
                      return (
                        <div 
                          style={{
                            cursor: 'pointer',
                            height: '100%',
                            padding: '2px 4px',
                            borderRadius: '2px',
                            backgroundColor: '#3174ad',
                            color: 'white',
                            fontSize: '10px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {session && <span style={{ fontWeight: 700 }}>Seans {session} - </span>}
                          {event.title}
                          {statusLabel && (
                            <span style={{ marginLeft: 4, fontWeight: 600, fontSize: 10, color: '#ffe082', background: '#1976d2', borderRadius: 4, padding: '0 4px' }}>
                              {statusLabel}
                            </span>
                          )}
                        </div>
                      );
                    }
                  }
                }}
                onSelectEvent={selectEvent}
                onSelectSlot={viewMode !== "month" ? handleSelectSlot : undefined}
                selectable={viewMode !== "month"}
                messages={{
                  today: 'Bugün',
                  previous: 'Önceki',
                  next: 'Sonraki',
                  month: 'Ay',
                  week: 'Hafta',
                  day: 'Gün',
                  agenda: 'Ajanda',
                  date: 'Tarih',
                  time: 'Saat',
                  event: 'Randevu',
                  noEventsInRange: 'Bu aralıkta randevu yok.',
                  showMore: (total) => `+${total} daha fazla`
                }}
                formats={{
                  dayFormat: 'dd',
                  dayRangeHeaderFormat: ({ start }) =>
                    format(start, 'MMMM yyyy', { locale: tr }),
                  dayHeaderFormat: (date) =>
                    format(date, 'EEEE dd', { locale: tr }),
                  monthHeaderFormat: (date) =>
                    format(date, 'MMMM yyyy', { locale: tr }),
                  weekdayFormat: (date) =>
                    format(date, 'EEE', { locale: tr }),
                  timeGutterFormat: (date) => {
                    // Sadece saat başlarında göster
                    const minutes = date.getMinutes();
                    return minutes === 0 ? format(date, 'HH:mm', { locale: tr }) : '';
                  },
                  eventTimeRangeFormat: ({ start, end }) =>
                    `${format(start, 'HH:mm', { locale: tr })} - ${format(end, 'HH:mm', { locale: tr })}`,
                  agendaTimeFormat: (date) =>
                    format(date, 'HH:mm', { locale: tr }),
                  agendaDateFormat: (date) =>
                    format(date, 'dd MMM yyyy', { locale: tr })
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Randevu Düzenleme Modalı */}
      {showEditModal && editingAppointment && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: window.innerWidth <= 550 ? 12 : window.innerWidth <= 768 ? 20 : 32,
              maxWidth: 500,
              width: "95%",
              maxHeight: window.innerWidth <= 550 ? "95vh" : window.innerWidth <= 768 ? "90vh" : "80vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0, color: "#1a237e", fontSize: 20 }}>
                📅 Randevu Düzenle
              </h3>
              <button
                onClick={closeEditModal}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#666"
                }}
              >
                ✕
              </button>
            </div>

            {/* Randevu Bilgileri */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                background: "#f8f9fa",
                padding: 16,
                borderRadius: 8,
                border: "1px solid #e9ecef"
              }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div>
                    <strong style={{ color: "#495057" }}>👤 Hasta:</strong>
                    <span
                      style={{ marginLeft: 8, color: "#1976d2", fontWeight: 700, cursor: "pointer", textDecoration: "underline dotted" }}
                      onClick={() => {
                        if (editingAppointment?.rawData?.patient_id) {
                          window.open(`/patients/card?id=${editingAppointment.rawData.patient_id}`, '_blank');
                        }
                      }}
                      title="Hasta kartını aç"
                    >
                      {editForm.patient_name}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#495057" }}>👨‍⚕️ Doktor:</strong>
                    <span style={{ marginLeft: 8, color: "#212529" }}>{editForm.doctor_name}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#495057" }}>🕐 Saat:</strong>
                    <span style={{ marginLeft: 8, color: "#212529" }}>
                      {editingAppointment.start.toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {editingAppointment.end.toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#495057" }}>⏱️ Süre:</strong>
                    <span style={{ marginLeft: 8, color: "#212529" }}>
                      {Math.round((editingAppointment.end - editingAppointment.start) / (1000 * 60))} dakika
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Not Düzenleme */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 600, 
                color: "#495057" 
              }}>
                📝 Randevu Notu:
              </label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "2px solid #e9ecef",
                  borderRadius: 8,
                  fontSize: 14,
                  minHeight: 100,
                  resize: "vertical",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                placeholder="Randevu ile ilgili notlarınızı yazın..."
                onFocus={(e) => e.target.style.borderColor = "#1a237e"}
                onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <div style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                position: window.innerWidth <= 550 ? "sticky" : "static",
                bottom: window.innerWidth <= 550 ? 0 : undefined,
                background: window.innerWidth <= 550 ? "white" : undefined,
                zIndex: 2,
                paddingBottom: window.innerWidth <= 550 ? 8 : 0,
                borderTop: window.innerWidth <= 550 ? "1px solid #e9ecef" : undefined
              }}>
                <button
                  onClick={closeEditModal}
                  style={{
                    padding: "10px 20px",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  İptal
                </button>
                <button
                  onClick={deleteAppointment}
                  style={{
                    padding: "10px 20px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  🗑️ Sil
                </button>
                <button
                  onClick={updateAppointmentNotes}
                  style={{
                    padding: "10px 20px",
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  💾 Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Randevu Oluşturma Modalı */}
      {showCreateModal && createForm.selectedTime && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: 32,
            maxWidth: 500,
            width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            position: 'relative',
            maxHeight: '95vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: "2px solid #f8f9fa"
            }}>
              <h3 style={{ 
                margin: 0, 
                color: "#1a237e", 
                fontSize: 22,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                ➕ Yeni Randevu Oluştur
              </h3>
              <button
                onClick={closeCreateModal}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#666"
                }}
              >
                ✕
              </button>
            </div>

            {/* Seçilen Zaman Bilgisi */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                background: "#e3f2fd",
                padding: 16,
                borderRadius: 8,
                border: "2px solid #1976d2"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🕐</span>
                  <strong style={{ color: "#1565c0" }}>Seçilen Zaman:</strong>
                  <span style={{ color: "#0d47a1" }}>
                    {createForm.selectedTime.toLocaleTimeString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {new Date(createForm.selectedTime.getTime() + createForm.duration * 60 * 1000).toLocaleTimeString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Alanları */}
            <div style={{ display: "grid", gap: 16 }}>
              {/* Hasta Seçimi + Şube Filtreleme */}
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: 600, 
                  color: "#495057" 
                }}>
                  👤 Hasta Seçiniz *
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <select
                    value={selectedBranch ?? ""}
                    onChange={e => setSelectedBranch(e.target.value ? Number(e.target.value) : null)}
                    style={{ padding: 8, borderRadius: 6, border: "2px solid #1976d2", fontWeight: 700, fontSize: 14, background: '#e3eafc', color: '#1a237e', minWidth: 90 }}
                  >
                    <option value="" style={{ color: '#1a237e', fontWeight: 700 }}>Tüm Şubeler</option>
                    {branches.map(b => (
                      <option key={b.branch_id} value={b.branch_id} style={{ color: '#1a237e', fontWeight: 700 }}>{b.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={(() => {
                      if (createForm.patientId) {
                        const p = patients.find((x: any) => x.patient_id == createForm.patientId) || searchedPatients.find((x: any) => x.patient_id == createForm.patientId);
                        return p ? `${p.first_name} ${p.last_name}` : '';
                      }
                      return patientSearch;
                    })()}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setPatientSearch(value);
                      setShowPatientDropdown(true);
                      if (!value) {
                        clearPatientSelection();
                        setSearchedPatients([]);
                      } else {
                        await searchPatients(value);
                      }
                    }}
                    readOnly={!!createForm.patientId}
                    onClick={() => {
                      setShowPatientDropdown(true);
                    }}
                    style={{
                      flex: 1,
                      padding: 12,
                      border: "2px solid #e9ecef",
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      color: "#222",
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: '#fff'
                    }}
                    placeholder="Hasta adı veya telefon ile arayın veya seçin..."
                    onBlur={(e) => {
                      setTimeout(() => setShowPatientDropdown(false), 200);
                      e.target.style.borderColor = "#e9ecef";
                    }}
                  />
                  {createForm.patientId && (
                    <button
                      type="button"
                      onClick={clearPatientSelection}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: 16
                      }}
                    >
                      ✕
                    </button>
                  )}
                  
                  {/* Dropdown Listesi */}
                  {showPatientDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '2px solid #1a237e',
                      borderRadius: 8,
                      maxHeight: 200,
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                      {(patientSearch ? searchedPatients : patients)
                        .filter((patient: any) => {
                          // Eğer şube seçiliyse, sadece o şubedeki hastaları göster
                          if (selectedBranch) {
                            return String(patient.branch_id) === String(selectedBranch);
                          }
                          return true;
                        })
                        .map((patient: any) => (
                          <div
                            key={patient.patient_id}
                            onClick={() => selectPatient(patient)}
                            style={{
                              padding: 12,
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                          >
                            <div style={{ fontWeight: 600, color: '#212529' }}>
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              📞 {patient.phone} {patient.email && `• ✉️ ${patient.email}`}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Doktor Seçimi */}
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: 600, 
                  color: "#495057" 
                }}>
                  👨‍⚕️ Doktor Seçiniz *
                </label>
                <div style={{ position: 'relative' }}>
                  {currentUser?.role === 'doctor' ? (
                    <input
                      type="text"
                      value={currentUser ? `Dr. ${currentUser.first_name} ${currentUser.last_name}` : ''}
                      disabled
                      style={{
                        width: "100%",
                        padding: 12,
                        border: "2px solid #e9ecef",
                        borderRadius: 8,
                        fontSize: 14,
                        backgroundColor: "#f8f9fa",
                        color: "#666"
                      }}
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        value={(() => {
                          const doc = doctors.find((d: any) => d.user_id == createForm.doctorId);
                          return doc ? `Dr. ${doc.first_name} ${doc.last_name}` : '';
                        })()}
                        readOnly
                        onClick={() => setShowDoctorDropdown((v) => !v)}
                        style={{
                          width: "100%",
                          padding: 12,
                          border: "2px solid #e9ecef",
                          borderRadius: 8,
                          fontSize: 14,
                          outline: "none",
                          transition: "border-color 0.2s",
                          color: "#222",
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: '#fff'
                        }}
                        placeholder="Doktor seçiniz..."
                        onBlur={(e) => {
                          setTimeout(() => setShowDoctorDropdown(false), 200);
                          e.target.style.borderColor = "#e9ecef";
                        }}
                      />
                      {createForm.doctorId && (
                        <button
                          type="button"
                          onClick={clearDoctorSelection}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: '#666',
                            cursor: 'pointer',
                            fontSize: 16
                          }}
                        >
                          ✕
                        </button>
                      )}
                      {/* Dropdown Listesi */}
                      {showDoctorDropdown && doctors.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '2px solid #1a237e',
                          borderRadius: 8,
                          maxHeight: 200,
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}>
                          {doctors.map((doctor) => (
                            <div
                              key={doctor.user_id}
                              onClick={() => selectDoctor(doctor)}
                              style={{
                                padding: 12,
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                            >
                              <div style={{ fontWeight: 600, color: '#212529' }}>
                                Dt. {doctor.first_name} {doctor.last_name}
                              </div>
                              <div style={{ fontSize: 12, color: '#666' }}>
                                👨‍⚕️ Doktor {doctor.username && `• @${doctor.username}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Süre Seçimi */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: 600, 
                  color: "#495057" 
                }}>
                  ⏱️ Randevu Süresi (15 dk'nın katları)
                </label>
                <select
                  value={createForm.duration}
                  onChange={(e) => setCreateForm({...createForm, duration: parseInt(e.target.value)})}
                  style={{
                    width: "100%",
                    padding: 12,
                    border: "2px solid #e9ecef",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    color: "#222",
                    fontWeight: 700
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#1a237e"}
                  onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                >
                  <option value="15">15 dakika</option>
                  <option value="30">30 dakika</option>
                  <option value="45">45 dakika</option>
                  <option value="60">1 saat</option>
                  <option value="75">1 saat 15 dk</option>
                  <option value="90">1 saat 30 dk</option>
                  <option value="105">1 saat 45 dk</option>
                  <option value="120">2 saat</option>
                </select>
              </div>

              {/* Not */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: 600, 
                  color: "#495057" 
                }}>
                  📝 Randevu Notu
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                  style={{
                    width: "100%",
                    padding: 12,
                    border: "2px solid #e9ecef",
                    borderRadius: 8,
                    fontSize: 14,
                    minHeight: 80,
                    resize: "vertical",
                    fontFamily: "inherit",
                    outline: "none",
                    transition: "border-color 0.2s",
                    color: "#222",
                    fontWeight: 700
                  }}
                  placeholder="Randevu ile ilgili notlar..."
                  onFocus={(e) => e.target.style.borderColor = "#1a237e"}
                  onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                />
              </div>
            </div>

            {/* Action Buttons & SMS Gönderme */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
              {/* SMS Preview & Button */}
              <SmsSendSection 
                createForm={createForm}
                patients={patients}
                currentUser={currentUser}
              />
              <div style={{ height: 60 }} />
            </div>
            {/* Sticky footer for mobile: action buttons */}
            <div style={{
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#fff',
              padding: '12px 0 0 0',
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              borderTop: '1px solid #e9ecef',
              zIndex: 10
            }}>
              <button
                onClick={closeCreateModal}
                style={{
                  padding: "10px 20px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                İptal
              </button>
              <button
                onClick={createAppointment}
                style={{
                  padding: "10px 20px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                Randevu Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Custom CSS for better resize/drag experience */
<style jsx global>{`
  /* Calendar toolbar wrapping rules */
  .cal-toolbar { row-gap: 10px; }
  .cal-filters { flex-wrap: wrap; gap: 12px; }
  .cal-nav { flex-wrap: wrap; }
  .cal-nav button { flex: 1 1 180px; min-width: 0; }
  /* Keep extra tightening on very small screens */
  @media (max-width: 640px) {
    .cal-toolbar { flex-wrap: wrap; gap: 10px; }
    .cal-title { flex: 1 1 100%; }
    .cal-filters { gap: 10px; }
    .cal-nav button { flex-basis: 140px; }
  }
  /* Event stilleri - tek renk - FORCED */
  .rbc-event,
  .rbc-event-content,
  .rbc-event:before,
  .rbc-event:after,
  .rbc-addons-dnd .rbc-event {
    border-radius: 6px !important;
    border: 1px solid #2c5aa0 !important;
    background: #3174ad !important; /* Tek renk, gradient yok */
    background-image: none !important; /* Gradient'i tamamen kaldır */
    background-color: #3174ad !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
    transition: all 0.2s ease !important;
    position: relative !important;
  }

  .rbc-event:hover,
  .rbc-event-content:hover {
    box-shadow: 0 4px 12px rgba(49, 116, 173, 0.3) !important;
    z-index: 10 !important;
    background: #3174ad !important; /* Hover'da da aynı renk */
    background-image: none !important;
    background-color: #3174ad !important;
  }

  /* Resize handles - tamamen görünmez */
  .rbc-addons-dnd-resize-ns-anchor {
    width: 100% !important;
    height: 10px !important;
    background: transparent !important;
    background-image: none !important;
    border: none !important;
    opacity: 0 !important;
    transition: background-color 0.2s ease !important;
  }

  /* Resize handles hover durumu - çok hafif renk değişimi */
  .rbc-addons-dnd-resize-ns-anchor:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    background-image: none !important;
    opacity: 1 !important;
    border: none !important;
  }

  /* Top resize handle */
  .rbc-addons-dnd-resize-ns-anchor:first-child {
    top: -5px !important;
    cursor: n-resize !important;
    background: transparent !important;
    background-image: none !important;
    border: none !important;
  }

  /* Bottom resize handle */
  .rbc-addons-dnd-resize-ns-anchor:last-child {
    bottom: -5px !important;
    cursor: s-resize !important;
    background: transparent !important;
    background-image: none !important;
    border: none !important;
  }

  /* Event content area - middle area for dragging */
  .rbc-event-content {
    cursor: move !important;
    padding: 4px 8px !important;
    user-select: none !important;
    position: relative !important;
    background: transparent !important;
    background-image: none !important;
    border: none !important;
  }

  /* Dragging state */
  .rbc-addons-dnd-dragging .rbc-event {
    opacity: 0.8 !important;
    transform: rotate(2deg) scale(1.02) !important;
    z-index: 1000 !important;
    box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important;
    background: #3174ad !important;
    background-image: none !important;
  }

  /* Resizing state */
  .rbc-addons-dnd-resizing .rbc-event {
    opacity: 0.9 !important;
    box-shadow: 0 4px 15px rgba(49, 116, 173, 0.4) !important;
    background: #3174ad !important;
    background-image: none !important;
  }

  /* Calendar time slots */
  .rbc-time-slot {
  border-top: 1px solid #e8e8e8 !important;
  transition: background-color 0.1s ease !important;
  min-height: 40px !important;
  height: 40px !important;
  line-height: 40px !important;
  }

  .rbc-time-slot:hover {
    background-color: rgba(49, 116, 173, 0.05) !important;
  }

  .rbc-time-slot:nth-child(4n) {
    border-top: 2px solid #d0d0d0 !important;
  }

  /* Drag over feedback */
  .rbc-addons-dnd-drag-over {
    background-color: rgba(49, 116, 173, 0.1) !important;
    border: 2px dashed #3174ad !important;
  }

  /* Time gutter */
  .rbc-time-gutter {
    border-right: 1px solid #d0d0d0 !important;
  }

  /* Labels */
  .rbc-label {
    color: #666 !important;
    font-weight: 500 !important;
  }

  /* Prevent text selection during drag */
  .rbc-addons-dnd-dragging * {
    user-select: none !important;
  }

  .rbc-addons-dnd-resizing * {
    user-select: none !important;
  }

  /* Haftalık görünüm özel stilleri */
  .rbc-time-view .rbc-time-gutter,
  .rbc-time-view .rbc-time-content {
    border-left: 1px solid #e0e6ed !important;
  }

  .rbc-time-view .rbc-time-header-gutter {
    background: #f8f9fa !important;
  }

  .rbc-time-view .rbc-header {
    background: #f8f9fa !important;
    border-bottom: 1px solid #e0e6ed !important;
    font-weight: 600 !important;
    color: #495057 !important;
    padding: 8px !important;
  }

  /* Hafta sonu günleri için farklı arka plan */
  .rbc-time-view .rbc-day-slot:nth-child(6),
  .rbc-time-view .rbc-day-slot:nth-child(7) {
    background-color: #f8f9fa !important;
  }

  /* Aylık görünüm özel stilleri */
  .rbc-month-view {
    border: 1px solid #e0e6ed !important;
    border-radius: 8px !important;
    overflow: hidden !important;
  }

  .rbc-month-view .rbc-month-row {
    border-bottom: 1px solid #e0e6ed !important;
  }

  .rbc-month-view .rbc-date-cell {
    padding: 8px !important;
    border-right: 1px solid #e0e6ed !important;
    min-height: 80px !important;
  }

  .rbc-month-view .rbc-date-cell.rbc-off-range {
    background-color: #f8f9fa !important;
    color: #adb5bd !important;
  }

  .rbc-month-view .rbc-date-cell.rbc-today {
    background-color: #e3f2fd !important;
  }

  .rbc-month-view .rbc-date-cell:last-child {
    border-right: none !important;
  }

  /* Aylık görünümde event stilleri */
  .rbc-month-view .rbc-event {
    font-size: 10px !important;
    padding: 1px 4px !important;
    margin: 1px 0 !important;
    border-radius: 3px !important;
    background: #3174ad !important;
    border: none !important;
    color: white !important;
  }

  /* Haftalık görünümde saat çizgileri */
  .rbc-time-view .rbc-time-slot {
    border-top: 1px solid #f1f3f5 !important;
  }

  .rbc-time-view .rbc-timeslot-group {
    border-bottom: 1px solid #e9ecef !important;
  }

  /* Haftalık ve günlük görünümde başlık stilleri */
  .rbc-time-view .rbc-header + .rbc-header {
    border-left: 1px solid #e0e6ed !important;
  }

  /* Mevcut saat çizgisi */
  .rbc-current-time-indicator {
    background-color: #dc3545 !important;
    height: 2px !important;
    z-index: 3 !important;
  }

  /* Mobile tweaks */
  @media (max-width: 480px) {
    .rbc-toolbar { flex-wrap: wrap !important; gap: 8px !important; }
    .rbc-time-gutter { width: 42px !important; min-width: 42px !important; }
    .rbc-time-header-gutter { width: 42px !important; min-width: 42px !important; }
    .rbc-event { font-size: 11px !important; }
    .rbc-label { font-size: 10px !important; }
    .rbc-time-view .rbc-allday-cell { display: none !important; }
  }
`}</style>
