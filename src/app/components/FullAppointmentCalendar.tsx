// Custom event renderer: Saat ve başlık tek satırda
const CustomEvent = ({ event }: { event: any }) => {
  return (
    <span>{event.title}</span>
  );
};
// Diş Kliniği Randevu Takvimi - Sıfırdan modern ve bol yorumlu
// Gereksinimler: rol tabanlı görünüm, canlı veri, doktor renkleri, responsive tasarım


// Randevu Takvimi (Dental Bulut tarzı) – Hamburger ile açılan sol menü, rol tabanlı doktor filtreleri,
// drag&drop ve resize, 15 dk slotlar, saat başı etiketleri, kaynak (resource) sütunları

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PatientSelectModal from './PatientSelectModal';
import { useRouter } from "next/navigation";
import AddPatientModal from './AddPatientModal';
import Sidebar from './Sidebar';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './FullAppointmentCalendar.custom.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { format, parse, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CalendarEvent extends Event {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string | number;
  raw?: any;
}

const locales = { 'tr-TR': tr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => tr.options && typeof tr.options.weekStartsOn === 'number' ? startOfWeek(date, { weekStartsOn: tr.options.weekStartsOn }) : startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales
});

// Sabit renk paleti (doktorlara deterministik renk ataması için)
const palette = [
  '#3174ad', '#e53935', '#43a047', '#fbc02d', '#8e24aa', '#00897b', '#fb8c00', '#3949ab', '#d81b60', '#00acc1', '#7cb342', '#c62828'
];
const colorForDoctor = (doctorId: number | string) => {
  const n = parseInt(String(doctorId), 10);
  if (!isNaN(n)) return palette[Math.abs(n) % palette.length];
  // string fallback hash
  let hash = 0;
  const s = String(doctorId);
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
};

const DnDCalendar = withDragAndDrop(Calendar);

type Role = 'doctor' | 'admin' | 'manager' | 'receptionist' | string;

export default function FullAppointmentCalendar() {
  const router = useRouter();
  // Hasta ekleme modalı için state
  const [showAddPatient, setShowAddPatient] = useState(false);
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  // Hasta seçme modalı için state
  const [showPatientSelect, setShowPatientSelect] = useState(false);

  // Auth & role
  const [user, setUser] = useState<any>(null);
  const role: Role | undefined = user?.role as Role | undefined;
  const branchId = user?.branch_id || user?.branchId || null;

  // Doctors
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [doctorOrders, setDoctorOrders] = useState<any[]>([]); // Sıralı doktorlar

  // Appointments
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const appointmentTypes = [
    'Muayene',
    'Özel',
    'Kontrol',
    'İmplant',
    'Protez',
    'Peridontoloji',
    'Pedodonti',
    'Dolgu',
    'Kanal Tedavisi',
    'Beyazlatma',
    'Ölçü',
    'İmplant üstü ölçü',
    'altyapı prova',
    'dentin prova',
    'protez bitim',
    'diş kesimi',
    'vuruk alma',
    'çekim',
    'iyileştirme başlığı',
    'botoks',
    'gece plağı',
    'abutment takımı',
    'metal prova',
    'geçici',
    'dikiş alımı',
    'implant kontrol filmi',
    'kaplama sökümü',
    'fiber-metal post',
    'kanal pansuman',
    'gömülü çekim',
    'cerrahi çekim',
    'genel anestezi',
    'zirkonyum kor prova',
    'rezin prova',
    'simantasyon'
  ];
  const [createForm, setCreateForm] = useState({
    doctorId: '',
    patientId: '',
    notes: '',
    duration: 30,
    when: null as Date | null,
    patientSearch: '',
    patientOffset: 0,
    patientList: [] as any[],
    selectedPatient: null as any,
    selectedBranchId: branchId || '', // Şube filtreleme için
    appointmentType: '',
    showTypeDropdown: false,
    appointmentTypeSearch: '',
    saatKapa: false,
  });
  const [branchName, setBranchName] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]); // Şube listesi

  // Summary modal
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [editFields, setEditFields] = useState<{ date: string; time: string; duration: number; notes: string; status: string }>({ date: '', time: '', duration: 30, notes: '', status: '' });
  const [updating, setUpdating] = useState(false);

  // Load user
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const u = localStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
    } catch {}
  }, []);

  // Load doctors
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        if (role === 'doctor' && user?.user_id) {
          // Sadece kendisi
          setDoctors([{ user_id: user.user_id, first_name: user.first_name || 'Doktor', last_name: user.last_name || '' }]);
          setSelectedDoctorId(String(user.user_id));
          return;
        }
        // Şubedeki doktorlar
        const token = localStorage.getItem('token');
        const res = await fetch('https://dentalapi.karadenizdis.com/api/user/doctors/by-branch', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (data?.success) setDoctors(data.data || []);
      } catch {}
    };
    const loadDoctorOrders = async () => {
      try {
        const res = await fetch('https://dentalapi.karadenizdis.com/api/doctor-order/doctor-order');
        const data = await res.json();
        if (data?.success) setDoctorOrders(data.data || []);
      } catch {}
    };
    loadDoctors();
    loadDoctorOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user?.user_id]);

  // Şubeleri ve branch adını yükle
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await fetch('https://dentalapi.karadenizdis.com/api/branch');
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setBranches(data.data);
          if (branchId) {
            const b = data.data.find((x: any) => String(x.branch_id) === String(branchId));
            if (b) setBranchName(b.name || '');
          }
        }
      } catch {}
    };
    loadBranches();
  }, [branchId]);

  // Compute date range based on view
  const range = useMemo(() => {
    if (viewMode === 'day') {
      const d = viewDate;
      const iso = d.toISOString().slice(0, 10);
      return { start: iso, end: iso };
    }
    if (viewMode === 'week') {
      // Haftanın Pazartesi'den başlayıp Pazar'da bitmesi için weekStartsOn: 1 kullan
      const s = startOfWeek(viewDate, { weekStartsOn: 1 });
      const e = endOfWeek(viewDate, { weekStartsOn: 1 });
      return { start: format(s, 'yyyy-MM-dd'), end: format(e, 'yyyy-MM-dd') };
    }
    // month
    const s = startOfMonth(viewDate);
    const e = endOfMonth(viewDate);
    return { start: format(s, 'yyyy-MM-dd'), end: format(e, 'yyyy-MM-dd') };
  }, [viewDate, viewMode]);

  const isAllDoctors = useMemo(() => role !== 'doctor' && selectedDoctorId === 'all', [role, selectedDoctorId]);
  const allowedViews = useMemo(() => (isAllDoctors ? ['day', 'week'] : ['day', 'week', 'month']), [isAllDoctors]);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
  let url = `https://dentalapi.karadenizdis.com/api/appointment?start_date=${range.start}&end_date=${range.end}`;
      // Tek doktor
      if (!isAllDoctors && selectedDoctorId && selectedDoctorId !== 'all') {
        url += `&doctor_id=${encodeURIComponent(selectedDoctorId)}`;
      }
  const res = await fetch(url);
      const data = await res.json();
      let list: any[] = data?.success ? data.data : [];
      // Tüm doktorlar: şubedeki doktorlar ile filtrele
      if (isAllDoctors && doctors.length) {
        const allowed = new Set(doctors.map(d => String(d.user_id)));
        list = list.filter(a => allowed.has(String(a.doctor_id)));
      }
      // Map to RBC events
      const evs: CalendarEvent[] = list.map((a) => {
        const start = new Date(a.appointment_time);
        const end = new Date(start.getTime() + (a.duration_minutes || 30) * 60000);
        let statusIcon = '🔴';
        if (a.status_tr) {
          if (a.status_tr.toLowerCase().includes('tamamlandı') || a.status_tr.toLowerCase().includes('geldi')) {
            statusIcon = '🟢';
          } else if (a.status_tr.toLowerCase().includes('bekleniyor')) {
            statusIcon = '�';
          }
        }
        const title = `${a.patient_name || ''}${a.patient_name && a.notes ? ' - ' : ''}${a.notes || ''}${a.status_tr ? ' | ' + statusIcon + ' ' + a.status_tr : ' | ' + statusIcon + ' Durum Yok'}`.trim();
        return {
          id: a.appointment_id,
          title,
          start,
          end,
          resourceId: a.doctor_id,
          raw: a,
        };
      });
      setEvents(evs);
    } catch (e) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end, selectedDoctorId, isAllDoctors, doctors]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Time gutter formatter: only at hour starts
  const timeGutterFormat = (date: Date) => date.getMinutes() === 0 ? date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

  // Event time formatters (Türkçe, 24 saat, AM/PM olmadan)
  const fmtTime = (d: Date) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const eventTimeRangeFormat = ({ start, end }: any) => `${fmtTime(start)} – ${fmtTime(end)}`;
  const eventTimeRangeStartFormat = ({ start }: any) => fmtTime(start);
  const eventTimeRangeEndFormat = ({ end }: any) => fmtTime(end);
  const agendaTimeRangeFormat = ({ start, end }: any) => `${fmtTime(start)} – ${fmtTime(end)}`;

  // Handlers
  const goPrev = () => {
    if (viewMode === 'day') setViewDate(addDays(viewDate, -1));
    else if (viewMode === 'week') setViewDate(addDays(viewDate, -7));
    else setViewDate(addDays(viewDate, -30));
  };
  const goNext = () => {
    if (viewMode === 'day') setViewDate(addDays(viewDate, 1));
    else if (viewMode === 'week') setViewDate(addDays(viewDate, 7));
    else setViewDate(addDays(viewDate, 30));
  };
  const goToday = () => setViewDate(new Date());

  // Create
  const onSelectSlot = ({ start }: { start: Date }) => {
    setShowCreate(true);
    setCreateForm(f => ({
      ...f,
      when: new Date(start),
      doctorId: role === 'doctor' ? String(user?.user_id) : (selectedDoctorId !== 'all' ? selectedDoctorId : ''),
      notes: '',
      patientId: '',
      patientSearch: '',
      patientOffset: 0,
      patientList: [],
    }));
  };

  const onSelectEvent = async (event: CalendarEvent) => {
    try {
      const patientId = event.raw?.patient_id;
      let patient: any = null;
      if (patientId) {
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/patient/${patientId}`);
        const data = await res.json();
        if (data?.success) patient = data.data;
      }
      const a = event.raw || {};
      const dt = new Date(a.appointment_time);
      const dateStr = dt.toISOString().slice(0, 10);
      const timeStr = dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
      setSummaryData({ event: a, patient });
      setEditFields({
        date: dateStr,
        time: timeStr,
        duration: a.duration_minutes || 30,
        notes: a.notes || '',
        status: a.status || 'scheduled',
      });
      setShowSummary(true);
    } catch {
      setSummaryData({ event: event.raw, patient: null });
      setShowSummary(true);
    }
  };

  const onEventDrop = async ({ event, start, end, resourceId }: any) => {
    try {
      const id = Number(event.id);
      const duration = Math.max(15, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
      const alignedDuration = Math.ceil(duration / 15) * 15;
      // Eğer resourceId (yeni doktor) değiştiyse, doktor_id de güncellensin
      const newDoctorId = resourceId !== undefined ? resourceId : event.resourceId;
      const body: any = { appointmentTime: new Date(start).toISOString(), duration: alignedDuration };
      if (newDoctorId !== undefined && String(newDoctorId) !== String(event.resourceId)) {
        body.doctorId = newDoctorId;
      }
      const res = await fetch(`https://dentalapi.karadenizdis.com/api/appointment/${id}/time-duration`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!(res.ok && data?.success)) throw new Error('update failed');
      fetchAppointments();
    } catch {
      fetchAppointments();
    }
  };

  const onEventResize = async ({ event, start, end }: any) => {
    await onEventDrop({ event, start, end });
  };

  // Patients search (limit/offset compatible)
  const searchPatients = async (q: string, offset = 0) => {
    const params = new URLSearchParams();
    params.set('limit', '20');
    params.set('offset', String(offset));
    if (q.trim()) params.set('search', q.trim());
    // Şube filtreleme
    if (createForm.selectedBranchId) params.set('branch_id', String(createForm.selectedBranchId));
    const res = await fetch(`https://dentalapi.karadenizdis.com/api/patient?${params.toString()}`);
    const data = await res.json();
    if (data?.success) {
      setCreateForm(f => ({ ...f, patientList: offset === 0 ? data.data : [...f.patientList, ...data.data], patientOffset: offset }));
    }
  };

  const createAppointment = async () => {
    // Saat Kapa ise özel davranış
    if (createForm.saatKapa) {
      if (!createForm.when || !(role === 'doctor' ? user?.user_id : createForm.doctorId)) return;
      const doctorId = role === 'doctor' ? String(user.user_id) : createForm.doctorId;
      try {
        const not = createForm.notes?.trim() ? `SAAT KAPATILDI - ${createForm.notes.trim()}` : 'SAAT KAPATILDI';
        const res = await fetch('https://dentalapi.karadenizdis.com/api/appointment', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: null,
            doctorId,
            appointmentTime: createForm.when.toISOString(),
            duration: createForm.duration,
            notes: not,
            branchId,
            status: 'saatkapatildi',
            created_by: user?.user_id || null,
          })
        });
        const data = await res.json();
        if (res.ok && data?.success) {
          setShowCreate(false);
          fetchAppointments();
          setCreateForm(f => ({ ...f, notes: '' }));
        } else {
          alert(data?.message || 'Randevu oluşturulamadı');
        }
      } catch {
        alert('Sunucu hatası');
      }
      return;
    }
    // Normal randevu
    if (!createForm.when || !createForm.patientId || !(role === 'doctor' ? user?.user_id : createForm.doctorId)) return;
    const doctorId = role === 'doctor' ? String(user.user_id) : createForm.doctorId;
    let notes = '';
    if (createForm.appointmentType) {
      notes = createForm.appointmentType;
    }
    if (notes) {
      notes += ' - ';
    }
    notes += createForm.notes || '';
    try {
      const res = await fetch('https://dentalapi.karadenizdis.com/api/appointment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: createForm.patientId,
          doctorId,
          appointmentTime: createForm.when.toISOString(),
          duration: createForm.duration,
          notes,
          branchId,
          created_by: user?.user_id || null,
        })
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setShowCreate(false);
        fetchAppointments();
        setCreateForm(f => ({ ...f, notes: '' }));
      } else {
        alert(data?.message || 'Randevu oluşturulamadı');
      }
    } catch {
      alert('Sunucu hatası');
    }
  };

  // Delete appointment from summary modal
  const deleteCurrentAppointment = async () => {
    const id = summaryData?.event?.appointment_id;
    if (!id) return;
    if (!window.confirm('Bu randevuyu silmek istediğinize emin misiniz?')) return;
    try {
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/appointment/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data?.success) {
        setShowSummary(false);
        fetchAppointments();
      } else {
        alert(data?.message || 'Randevu silinemedi');
      }
    } catch (e) {
      alert('Sunucu hatası');
    }
  };

  // Update appointment (time/date + duration + notes)
  const updateCurrentAppointment = async () => {
    const a = summaryData?.event;
    if (!a?.appointment_id) return;
    try {
      setUpdating(true);
      // Build ISO time from date + time
      const base = `${editFields.date}T${editFields.time}`;
      const iso = new Date(base).toISOString();
      // First: time + duration
      const res1 = await fetch(`https://dentalapi.karadenizdis.com/api/appointment/${a.appointment_id}/time-duration`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentTime: iso, duration: editFields.duration })
      });
      const data1 = await res1.json();
      if (!(res1.ok && data1?.success)) {
        alert(data1?.message || 'Saat/Süre güncellenemedi');
        setUpdating(false);
        return;
      }
      // Second: notes if changed
      if ((editFields.notes || '') !== (a.notes || '')) {
        const res2 = await fetch(`https://dentalapi.karadenizdis.com/api/appointment/${a.appointment_id}/notes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: editFields.notes })
        });
        const data2 = await res2.json();
        if (!(res2.ok && data2?.success)) {
          alert(data2?.message || 'Not güncellenemedi');
          setUpdating(false);
          return;
        }
      }
      // Third: status if changed
      if ((editFields.status || '') !== (a.status || 'scheduled')) {
        const res3 = await fetch(`https://dentalapi.karadenizdis.com/api/appointment/${a.appointment_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: editFields.status, notes: (editFields.notes ?? a.notes ?? '') })
        });
        const data3 = await res3.json();
        if (!(res3.ok && data3?.success)) {
          alert(data3?.message || 'Durum güncellenemedi');
          setUpdating(false);
          return;
        }
      }
      setShowSummary(false);
      fetchAppointments();
    } catch (e) {
      alert('Güncelleme sırasında hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  // Resources for all doctors (order_num'a göre sıralı)
  const resources = isAllDoctors
    ? [
        // Önce sırası olan doktorlar
        ...doctorOrders
          .map((order: any) => {
            const doctor = doctors.find((d: any) => String(d.user_id) === String(order.doctor_id));
            if (!doctor) return null;
            return {
              resourceId: doctor.user_id,
              resourceTitle: `${doctor.first_name} ${doctor.last_name}`,
              order_num: order.order_num
            };
          })
          .filter(Boolean),
        // Sonra sırası olmayan doktorlar
        ...doctors
          .filter((d: any) => !doctorOrders.some((o: any) => String(o.doctor_id) === String(d.user_id)))
          .map((d: any) => ({
            resourceId: d.user_id,
            resourceTitle: `${d.first_name} ${d.last_name}`,
            order_num: 9999 // Sona ekle
          }))
      ]
    : undefined;

  return (
  <div style={{ minHeight: '100vh', background: '#f5f7fb', overflowX: 'auto', maxWidth: '100vw', boxSizing: 'border-box', padding: 0 }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #e5e7eb', overflowX: 'auto', maxWidth: '100vw', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap', minWidth: 260, maxWidth: '100vw', boxSizing: 'border-box' }}>
          
          <button aria-label="menu" onClick={() => setSidebarOpen(true)} style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid #1f3755', background: '#1f3755', color: '#fff', cursor: 'pointer', fontWeight: 900 }}>
            ☰
          </button>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#1f3755' }}>Randevu Takvimi</div>
          <div style={{ flex: 1 }} />
          

          {/* Günlük görünümde ortada Türkçe tarih gösterimi */}
          {viewMode === 'day' && (
            <div style={{ flex: 2, textAlign: 'center', fontWeight: 900, fontSize: 22, color: '#1f3755', letterSpacing: '0.5px' }}>
              {(() => {
                const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                const d = viewDate;
                return `${d.getDate()} ${aylar[d.getMonth()]} ${gunler[d.getDay()]}`;
              })()}
            </div>
          )}

        

      {/* Hasta ekleme modalı */}
      {showAddPatient && (
        <AddPatientModal
          open={showAddPatient}
          onClose={() => setShowAddPatient(false)}
          doctors={doctors}
          onSave={(addedPatient: any) => {
            // Hasta başarıyla eklendiğinde otomatik olarak createForm'da seçili hasta yap
            setShowAddPatient(false);
            if (addedPatient && (addedPatient.patient_id || addedPatient.id)) {
              setCreateForm(f => ({
                ...f,
                patientId: String(addedPatient.patient_id || addedPatient.id),
                selectedPatient: addedPatient,
                patientSearch: `${addedPatient.first_name || addedPatient.firstName || ''} ${addedPatient.last_name || addedPatient.lastName || ''} - ${addedPatient.phone || ''}`.trim(),
                patientList: [],
              }));
            }
          }}
        />
      )}
          {/* View controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={goPrev} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: '#0f172a', fontWeight: 800 }}>←</button>
            <button onClick={goToday} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #3174ad', background: '#3174ad', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>Bugün</button>
            <button onClick={goNext} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: '#0f172a', fontWeight: 800 }}>→</button>
              <select value={viewMode} onChange={(e) => setViewMode(e.target.value as any)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, color: '#0f172a' }}>
              <option value="day">Günlük</option>
              <option value="week">Haftalık</option>
              {!isAllDoctors && <option value="month">Aylık</option>}
            </select>
            {role !== 'doctor' && (
              <select
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value);
                  if (e.target.value !== 'all' && viewMode === 'month') setViewMode('day');
                }}
                disabled={viewMode === 'month'}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, color: '#0f172a', opacity: viewMode === 'month' ? 0.6 : 1 }}
              >
                <option value="all">Tüm Doktorlar</option>
                {doctors.map((d: any) => (
                  <option key={d.user_id} value={String(d.user_id)}>{d.first_name} {d.last_name}</option>
                ))}
              </select>
            )}
              <input type="date" value={format(viewDate, 'yyyy-MM-dd')} onChange={(e) => setViewDate(new Date(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 800, color: '#0f172a' }} />
          </div>
        </div>
      </div>

      {/* Sidebar drawer */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0 as any, zIndex: 30 }}>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0 as any, background: 'rgba(0,0,0,0.35)' }} />
          <Sidebar 
            open={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            onOpenPatientSelect={() => setShowPatientSelect(true)}
          />
        </div>
      )}

      {/* Calendar */}
      <div style={{ maxWidth: 1800, margin: '16px auto', padding: '16px' }}>
        <DnDCalendar
          localizer={localizer}
          culture="tr-TR"
          events={events}
          date={viewDate}
          view={viewMode as any}
          onNavigate={(d) => setViewDate(d)}
          onView={(v) => setViewMode(v as any)}
          views={allowedViews as any}
          step={15}
          timeslots={4}
          selectable
          resizable
          onSelectSlot={onSelectSlot as any}
          onSelectEvent={onSelectEvent as any}
          onEventDrop={onEventDrop as any}
          onEventResize={onEventResize as any}
          resources={isAllDoctors ? resources as any : undefined}
          resourceIdAccessor={isAllDoctors ? ((r: any) => r.resourceId) : undefined}
          resourceTitleAccessor={isAllDoctors ? ((r: any) => r.resourceTitle) : undefined}
          eventPropGetter={(event: any) => {
            const doctorId = event.raw?.doctor_id || event.resourceId || 0;
            const color = colorForDoctor(doctorId);
            return {
              className: `doctor-card-bg-${doctorId}`,
              style: {
                border: `3px solid ${color} !important`,
                boxShadow: `inset 0 0 0 1px ${color}`,
                color: '#fff',
                borderRadius: 8,
                fontWeight: 700,
                opacity: 1,
              }
            };
          }}
          titleAccessor={(event: any) => event.title}
          formats={{
            timeGutterFormat,
            eventTimeRangeFormat: eventTimeRangeFormat as any,
            eventTimeRangeStartFormat: eventTimeRangeStartFormat as any,
            eventTimeRangeEndFormat: eventTimeRangeEndFormat as any,
            agendaTimeRangeFormat: agendaTimeRangeFormat as any,
            weekdayFormat: (date: Date, localizer: any) => {
              const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
              // Pazartesi=1, Pazar=0 (getDay: 0=Pazar, 1=Pazartesi...)
              const gun = gunler[(date.getDay() + 6) % 7];
              const gunNum = date.getDate();
              const ay = date.getMonth() + 1;
              return `${gun} ${gunNum < 10 ? '0' + gunNum : gunNum}.${ay < 10 ? '0' + ay : ay}`;
            },
            dayFormat: (date: Date, localizer: any) => {
              const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
              const gun = gunler[(date.getDay() + 6) % 7];
              const gunNum = date.getDate();
              const ay = date.getMonth() + 1;
              return `${gun} ${gunNum < 10 ? '0' + gunNum : gunNum}.${ay < 10 ? '0' + ay : ay}`;
            },
          }}
          messages={{ noEventsInRange: 'Randevu yok', today: 'Bugün', previous: 'Önceki', next: 'Sonraki' }}
          min={new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), 9, 0)}
          max={new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), 23, 59, 59)}
          scrollToTime={new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), 9, 0)}
          style={{ height: 820, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: 12 }}
          components={{
            toolbar: () => <></>,
            event: CustomEvent,
            resourceHeader: ({ resource }: any) => {
              const id = resource?.resourceId ?? resource?.id ?? 0;
              const title = resource?.resourceTitle ?? resource?.title ?? '';
              const color = colorForDoctor(id);
              return (
                <div style={{ fontWeight: 900, color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', textAlign: 'center' }}>
                  <span style={{ color, fontWeight: 900 }}>dt.</span>
                  <span style={{ color, fontWeight: 900 }}>{title}</span>
                </div>
              );
            },
          }}
        />
      </div>

      <style>{`
        /* Event kutularında yazı boyutunu küçült */
        .rbc-event, .modern-event {
          font-size: 12px !important;
        }
        /* Resize handle'ları belirgin ve büyük yap */
        .rbc-addons-dnd-resize-ns-anchor, .rbc-addons-dnd-resize-ew-anchor {
          border: none !important;
          background: transparent !important;
          opacity: 0.85 !important;
          width: 18px !important;
          height: 18px !important;
          border-radius: 50% !important;
          position: absolute;
          z-index: 10;
          cursor: ns-resize !important;
          transition: background 0.2s, border 0.2s;
        }
        .rbc-addons-dnd-resize-ns-anchor:hover, .rbc-addons-dnd-resize-ew-anchor:hover {
          background: #1d4ed8 !important;
          border-color: #1d4ed8 !important;
        }
        /* Handle'ı event'in tam kenarına yerleştir (üst/alt) */
        .rbc-addons-dnd-resize-ns-anchor {
          left: 50%;
          transform: translateX(-50%);
        }
        .rbc-addons-dnd-resize-ns-anchor.rbc-addons-dnd-resize-n {
          top: -9px;
        }
        .rbc-addons-dnd-resize-ns-anchor.rbc-addons-dnd-resize-s {
          bottom: -9px;
        }
        /* Drag ile karışmaması için event'in ortasında pointer-events: auto, handle'da pointer-events: all */
        .rbc-event-content { pointer-events: auto; }
        .rbc-addons-dnd-resize-ns-anchor, .rbc-addons-dnd-resize-ew-anchor { pointer-events: all; }
        .rbc-time-slot, .rbc-timeslot-group { min-height: 18px; }
        /* Doktor kolon başlıkları ve header'ları koyulaştır */
        .rbc-time-header .rbc-header { color: #0f172a !important; font-weight: 800 !important; }
        .rbc-header { color: #0f172a; font-weight: 800; }
        /* Her doktorun kartına özel arka plan rengi */
        ${Array.from({length: 100}).map((_, i) => {
          const color = colorForDoctor(i);
          return `.doctor-card-bg-${i} { background-color: ${color} !important; }`;
        }).join('\n')}
      `}</style>

      {/* Create Modal */}
      {showCreate && (
  <div style={{ position: 'fixed', inset: 0 as any, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, width: '96%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 12, color: '#1f3755', letterSpacing: '0.5px' }}>Randevu Oluştur</div>
            {role !== 'doctor' && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Doktor</div>
        <select value={createForm.doctorId} onChange={(e) => setCreateForm(f => ({ ...f, doctorId: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', color: '#0f172a', fontWeight: 700 }}>
                  <option value="">Seçiniz</option>
                  {doctors.map((d: any) => (
                    <option key={d.user_id} value={String(d.user_id)}>{d.first_name} {d.last_name}</option>
                  ))}
                </select>
              </div>
            )}
            {!createForm.saatKapa && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>Hasta</span>
                  <button
                    type="button"
                    onClick={() => setShowAddPatient(true)}
                    style={{ background: '#22c55e', color: '#fff', border: 0, borderRadius: 8, padding: '4px 12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginLeft: 8 }}
                  >+ Hasta Ekle</button>
                </div>
                {/* Şube seçici */}

                <input
                  value={createForm.patientSearch}
                  onChange={(e) => { const q = e.target.value; setCreateForm(f => ({ ...f, patientSearch: q })); searchPatients(q, 0); }}
                  placeholder="İsim/TC/Telefon ile ara"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', color: '#0f172a', fontWeight: 700 }}
                />
                {createForm.patientList.length > 0 && (
                  <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 6 }}>
                    {createForm.patientList.map((p: any) => (
                      <div key={p.patient_id} onClick={() => setCreateForm(f => ({ ...f, patientId: String(p.patient_id), patientSearch: `${p.first_name} ${p.last_name} - ${p.phone}` , selectedPatient: p, patientList: [] }))} style={{ padding: '8px 10px', cursor: 'pointer' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.first_name} {p.last_name} <span style={{ fontWeight: 600, color: '#1976d2', fontSize: 12, marginLeft: 6 }}>{p.branch_name ? `(${p.branch_name})` : ''}</span></div>
                        <div style={{ fontSize: 12, color: '#0f172a' }}>{p.phone} {p.tc_number ? ` • ${p.tc_number}` : ''}</div>
                      </div>
                    ))}
                    <div style={{ padding: 8, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center' }}>
                      <button onClick={() => searchPatients(createForm.patientSearch, createForm.patientOffset + 20)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}>Daha fazla</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!createForm.saatKapa && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 900, marginBottom: 6, color: '#0f172a', letterSpacing: '0.5px' }}>Randevu Türü</div>
                {/* Custom dropdown for appointment type */}
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <div
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      color: '#0f172a',
                      fontWeight: 700,
                      background: '#fff',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => setCreateForm(f => ({ ...f, showTypeDropdown: !f.showTypeDropdown }))}
                  >
                    {createForm.appointmentType || 'Tür seçiniz'}
                    <span style={{ float: 'right', fontWeight: 400 }}>&#9660;</span>
                  </div>
                  {createForm.showTypeDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '100%',
                        background: '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        maxHeight: 260,
                        overflowY: 'auto',
                        zIndex: 100,
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', background: '#f3f4f6' }}>
                        <input
                          type="text"
                          value={createForm.appointmentTypeSearch}
                          onChange={e => setCreateForm(f => ({ ...f, appointmentTypeSearch: e.target.value }))}
                          placeholder="Tür ara..."
                          style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontWeight: 700, color: '#0f172a' }}
                        />
                      </div>
                      <div
                        style={{
                          padding: '10px 12px',
                          color: '#64748b',
                          fontWeight: 700,
                          cursor: 'pointer',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                        onClick={() => setCreateForm(f => ({ ...f, appointmentType: '', showTypeDropdown: false, appointmentTypeSearch: '' }))}
                      >Tür seçiniz</div>
                      {appointmentTypes
                        .filter(type => type.toLowerCase().includes((createForm.appointmentTypeSearch || '').toLowerCase()))
                        .map(type => (
                          <div
                            key={type}
                            style={{
                              padding: '10px 12px',
                              color: '#0f172a',
                              fontWeight: 700,
                              cursor: 'pointer',
                              borderBottom: '1px solid #e5e7eb',
                              background: createForm.appointmentType === type ? '#e0e7ef' : '#fff',
                            }}
                            onClick={() => setCreateForm(f => ({ ...f, appointmentType: type, showTypeDropdown: false, appointmentTypeSearch: '' }))}
                          >{type}</div>
                        ))}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 900, marginBottom: 6, color: '#0f172a', letterSpacing: '0.5px' }}>Not</div>
                <input value={createForm.notes} onChange={(e) => setCreateForm(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', color: '#0f172a', fontWeight: 700 }} />
              </div>
            )}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 6, color: '#0f172a', letterSpacing: '0.5px' }}>Süre</div>
              <select
                value={createForm.duration}
                onChange={(e) => setCreateForm(f => ({ ...f, duration: Number(e.target.value) }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', color: '#0f172a', fontWeight: 700 }}
              >
                {[15,30,45,60,75,90,105,120].map(min => (
                  <option key={min} value={min}>{min} dk</option>
                ))}
              </select>
              {/* Saat Kapa seçeneği */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="saatkapa"
                  style={{ width: 18, height: 18 }}
                  checked={!!createForm.saatKapa}
                  onChange={e => setCreateForm(f => ({ ...f, saatKapa: e.target.checked }))}
                />
                <label htmlFor="saatkapa" style={{ fontWeight: 700, color: '#1976d2', cursor: 'pointer', userSelect: 'none', fontSize: 15 }}>Saat Kapa</label>
              </div>
            </div>
            {/* SMS Preview & Send */}
            {!createForm.saatKapa && (
              <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 10, paddingTop: 10 }}>
                <div style={{ fontWeight: 800, marginBottom: 6, color: '#0f172a' }}>SMS Önizleme</div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, background: '#f9fafb', color: '#0f172a', marginBottom: 8 }}>
                  {(() => {
                    const p = createForm.selectedPatient;
                    const name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : (createForm.patientSearch.split(' - ')[0] || 'Hasta');
                    const d = createForm.when ? createForm.when.toLocaleDateString('tr-TR') : 'gün';
                    const t = createForm.when ? createForm.when.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'saat';
                    const bn = branchName || 'şube';
                    return `Sayın ${name}, Karadeniz Ağız ve Diş Sağlığı Poliklinikleri tarafından ${bn} şubesine ${d} ${t} saatinde randevunuz oluşturulmuştur.`;
                  })()}
                </div>
                <button
                  onClick={async () => {
                    try {
                      if (!createForm.patientId) { alert('Lütfen hasta seçin'); return; }
                      if (!createForm.when) { alert('Lütfen tarih/saat seçin'); return; }
                      let patient = createForm.selectedPatient;
                      if (!patient) {
                        const resP = await fetch(`https://dentalapi.karadenizdis.com/api/patient/${createForm.patientId}`);
                        const dataP = await resP.json();
                        if (dataP?.success) patient = dataP.data;
                      }
                      const phone = patient?.phone;
                      const name = patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : (createForm.patientSearch.split(' - ')[0] || 'Hasta');
                      if (!phone) { alert('Hastanın telefon numarası bulunamadı'); return; }
                      const d = createForm.when.toLocaleDateString('tr-TR');
                      const t = createForm.when.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
                      const bn = branchName || 'şube';
                      const message = `Sayın ${name}, Karadeniz Ağız ve Diş Sağlığı Poliklinikleri tarafından ${bn} şubesine ${d} ${t} saatinde randevunuz oluşturulmuştur.`;
                      // Quick SMS ile aynı endpoint ve payload yapısı
                      const token = localStorage.getItem("token");
                      const response = await fetch("/api/sms/send", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          patientIds: [createForm.patientId],
                          templateId: null, // manuel mesaj için null
                          customMessage: message,
                          phone: phone
                        })
                      });
                      const data = await response.json();
                      if (response.ok && data?.success) alert('SMS gönderildi'); else alert(data?.message || 'SMS gönderilemedi');
                    } catch (e) { alert('SMS gönderiminde hata'); }
                  }}
                  style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #16a34a', background: '#22c55e', color: '#fff', fontWeight: 700 }}
                >
                  SMS Gönder
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '2px solid #dc2626', background: '#ef4444', color: '#fff', fontWeight: 900, letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(220,38,38,0.08)' }}>İptal</button>
              <button onClick={() => {
                createAppointment();
              }} style={{ padding: '10px 16px', borderRadius: 8, border: '2px solid #3174ad', background: '#3174ad', color: '#fff', fontWeight: 900, letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(49,116,173,0.08)' }}>Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && summaryData && (
        <div style={{ position: 'fixed', inset: 0 as any, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', overflow: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, width: '96%', maxWidth: '95vw', minWidth: 260, boxSizing: 'border-box', overflowY: 'auto' }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10, color: '#1f3755' }}>Randevu Özeti</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, color: '#0f172a', maxWidth: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontWeight: 700 }}>
                <span>Hasta: </span>
                {summaryData.event?.patient_id ? (
                  <a
                    href={`/patients/card?id=${summaryData.event.patient_id}`}
                    style={{ fontWeight: 800, color: '#1d4ed8', textDecoration: 'underline', cursor: 'pointer' }}
                    title="Hasta kartını aç"
                  >
                    {summaryData.event?.patient_name || '-'}
                  </a>
                ) : (
                  <span style={{ fontWeight: 800 }}>{summaryData.event?.patient_name || '-'}</span>
                )}
              </div>
              <div style={{ fontWeight: 700 }}><span>Doktor: </span><span style={{ fontWeight: 800 }}>{summaryData.event?.doctor_first_name} {summaryData.event?.doctor_last_name}</span></div>
              <div style={{ fontWeight: 700 }}><span>Tarih: </span><span style={{ fontWeight: 800 }}>{new Date(summaryData.event?.appointment_time).toLocaleString('tr-TR')}</span></div>
              <div style={{ fontWeight: 700 }}><span>Süre: </span><span style={{ fontWeight: 800 }}>{summaryData.event?.duration_minutes || 30} dk</span></div>
              <div style={{ gridColumn: '1 / -1', fontWeight: 700, maxWidth: '100%' }}>
                <span>Not: </span>
                <span
                  style={{
                    fontWeight: 800,
                    display: 'inline-block',
                    maxWidth: '100%',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  {summaryData.event?.notes || '-'}
                </span>
              </div>
              <div style={{ fontWeight: 700 }}><span>TC: </span><span style={{ fontWeight: 800 }}>{summaryData.patient?.tc_number || '-'}</span></div>
              <div style={{ fontWeight: 700 }}><span>Telefon: </span><span style={{ fontWeight: 800 }}>{summaryData.patient?.phone || '-'}</span></div>
              {/* Oluşturan hesap bilgisi */}
              <div style={{ gridColumn: '1 / -1', fontWeight: 700, color: '#1976d2', marginTop: 8 }}>
                <span>Bu randevuyu oluşturan hesap : </span>
                <span style={{ fontWeight: 800 }}>
                  {summaryData.event?.created_by_first_name || summaryData.event?.created_by_last_name
                    ? `${summaryData.event.created_by_first_name || ''} ${summaryData.event.created_by_last_name || ''}`.trim()
                    : 'Bilinmiyor'}
                </span>
              </div>
            </div>

            {/* Edit form */}
    <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 8, paddingTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
      <div style={{ fontWeight: 800, marginBottom: 6, color: '#0f172a' }}>Gün</div>
      <input type="date" value={editFields.date} onChange={(e) => setEditFields(f => ({ ...f, date: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', color: '#0f172a', fontWeight: 800 }} />
                </div>
                <div>
      <div style={{ fontWeight: 800, marginBottom: 6, color: '#0f172a' }}>Saat</div>
      <input type="time" step="900" value={editFields.time} onChange={(e) => setEditFields(f => ({ ...f, time: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', color: '#0f172a', fontWeight: 800 }} />
                </div>
                <div>
      <div style={{ fontWeight: 800, marginBottom: 6, color: '#0f172a' }}>Süre</div>
      <select value={editFields.duration} onChange={(e) => setEditFields(f => ({ ...f, duration: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', color: '#0f172a', fontWeight: 800 }}>
                    {[15,30,45,60,75,90,105,120].map(min => (
                      <option key={min} value={min}>{min} dk</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
      <div
        style={{
          fontWeight: 400,
          fontSize: '13px',
          marginBottom: 4,
          color: '#1976d2',
          letterSpacing: '0.1px',
          display: 'inline-block'
        }}
      >
        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px', marginRight: 4 }}>Not:</span>
        Durum değiştirirken lütfen açıklama ekleyin.
      </div>
      <textarea rows={3} value={editFields.notes} onChange={(e) => setEditFields(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', resize: 'vertical', color: '#0f172a', fontWeight: 800 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
      <div style={{ fontWeight: 800, marginBottom: 6, color: '#0f172a' }}>Durum</div>
      <select value={editFields.status} onChange={e => setEditFields(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', color: '#0f172a', fontWeight: 800 }}>
        <option value="scheduled">Bekleniyor</option>
        <option value="attended">Geldi</option>
        <option value="missed">Gelmedi</option>
        <option value="ertelendi">Ertelendi</option>
      </select>
                </div>
              </div>
            </div>
            {/* SMS Önizleme kutusu ve butonlar modern hizalı */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0, marginTop: 18 }}>
              <div style={{ width: '100%', maxWidth: 480, alignSelf: 'flex-end', marginBottom: 10 }}>
                <div style={{
                  fontWeight: 900,
                  fontSize: 15,
                  marginBottom: 4,
                  color: '#1976d2',
                  letterSpacing: '0.2px',
                  textAlign: 'left',
                  paddingLeft: 2
                }}>SMS Önizleme</div>
                <div style={{
                  border: '1.5px solid #1976d2',
                  borderRadius: 10,
                  padding: '14px 14px 12px 14px',
                  background: 'linear-gradient(90deg, #f0f6ff 0%, #e3eaff 100%)',
                  color: '#0f172a',
                  fontSize: 15.5,
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(25,118,210,0.07)',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  minHeight: 48
                }}>
                  {(() => {
                    const patient = summaryData.patient;
                    const event = summaryData.event;
                    if (!patient) return '';
                    const name = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
                    const d = event?.appointment_time ? new Date(event.appointment_time).toLocaleDateString('tr-TR') : 'gün';
                    const t = event?.appointment_time ? new Date(event.appointment_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'saat';
                    const bn = event?.branch_name || branchName || 'şube';
                    return `Sayın ${name}, Karadeniz Ağız ve Diş Sağlığı Poliklinikleri tarafından ${bn} şubesine ${d} ${t} saatinde randevunuz oluşturulmuştur.`;
                  })()}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 14, justifyContent: 'flex-end', width: '100%', maxWidth: 480, alignSelf: 'flex-end', marginTop: 2 }}>
                <button onClick={deleteCurrentAppointment} disabled={updating} style={{ padding: '10px 18px', borderRadius: 8, border: '1.5px solid #dc2626', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: 15, opacity: updating ? 0.7 : 1 }}>Sil</button>
                <button
                  onClick={async () => {
                    try {
                      const patient = summaryData.patient;
                      const event = summaryData.event;
                      if (!patient?.phone) { alert('Hastanın telefon numarası bulunamadı'); return; }
                      const name = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
                      const d = new Date(event.appointment_time).toLocaleDateString('tr-TR');
                      const t = new Date(event.appointment_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
                      const bn = event.branch_name || branchName || 'şube';
                      const message = `Sayın ${name}, Karadeniz Ağız ve Diş Sağlığı Poliklinikleri tarafından ${bn} şubesine ${d} ${t} saatinde randevunuz oluşturulmuştur.`;
                      const token = localStorage.getItem("token");
                      const response = await fetch("/api/sms/send", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          patientIds: [patient.patient_id],
                          templateId: null,
                          customMessage: message,
                          phone: patient.phone
                        })
                      });
                      const data = await response.json();
                      if (response.ok && data?.success) alert('SMS gönderildi'); else alert(data?.message || 'SMS gönderilemedi');
                    } catch (e) { alert('SMS gönderiminde hata'); }
                  }}
                  disabled={updating}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 8,
                    border: '2px solid #16a34a',
                    background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 15.5,
                    letterSpacing: '0.2px',
                    boxShadow: '0 2px 8px rgba(34,197,94,0.09)',
                    opacity: updating ? 0.7 : 1,
                    marginTop: 0,
                    marginBottom: 0,
                    transition: 'background 0.2s, box-shadow 0.2s'
                  }}
                >
                  SMS Gönder
                </button>
                <button onClick={updateCurrentAppointment} disabled={updating} style={{ padding: '10px 18px', borderRadius: 8, border: '1.5px solid #3174ad', background: '#3174ad', color: '#fff', fontWeight: 800, fontSize: 15, opacity: updating ? 0.7 : 1 }}>Güncelle</button>
                <button onClick={() => setShowSummary(false)} disabled={updating} style={{ padding: '10px 18px', borderRadius: 8, border: '2px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: '0.5px', opacity: updating ? 0.7 : 1, boxShadow: '0 2px 8px rgba(15,23,42,0.08)' }}>Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, background: '#111827', color: '#fff', padding: '8px 12px', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
          Yükleniyor…
        </div>
      )}

      {/* Hasta seçme modalı */}
      {showPatientSelect && (
        <PatientSelectModal 
          open={showPatientSelect}
          onClose={() => setShowPatientSelect(false)}
          onSelect={(id: any) => {
            setShowPatientSelect(false);
            router.push(`/patients/card?id=${id}`);
          }}
        />
      )}
    </div>
  );
}
