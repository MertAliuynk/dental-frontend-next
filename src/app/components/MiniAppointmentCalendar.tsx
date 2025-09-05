"use client";

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { tr } from "date-fns/locale";

const locales = { "tr-TR": tr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => 1,
  getDay,
  locales,
});


const today = new Date();

type Doctor = { id: number; name: string };
type Appointment = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  doctorId: number;
  patient: string;
  note: string;
  patientId?: number;
};

const messages = {
  today: "Bugün",
  previous: "Önceki",
  next: "Sonraki",
  month: "Ay",
  week: "Hafta",
  day: "Gün",
  agenda: "Ajanda",
  date: "Tarih",
  time: "Saat",
  event: "Randevu",
  noEventsInRange: "Bu gün için randevu yok.",
  showMore: (total: number) => `+${total} daha`
};

const MiniAppointmentCalendar: React.FC = () => {

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorOrders, setDoctorOrders] = useState<any[]>([]);
  const [events, setEvents] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // Kullanıcı şubesi ve rolü localStorage'dan alınacak (gelişmiş auth varsa burası değişebilir)
  useEffect(() => {
    // Şube id'si ve rolü localStorage'dan al
    const branchId = localStorage.getItem("branchId");
    if (!branchId) return;
    setLoading(true);
    // Doktorları ve sıralama verisini paralel çek
    Promise.all([
      fetch(`https://dentalapi.karadenizdis.com/api/branch/${branchId}/doctors`).then(res => res.json()),
      fetch('https://dentalapi.karadenizdis.com/api/doctor-order/doctor-order').then(res => res.json())
    ]).then(([docRes, orderRes]) => {
      let doctorList: Doctor[] = [];
      if (docRes.success && Array.isArray(docRes.data)) {
        doctorList = docRes.data.map((d: any) => ({ id: d.user_id, name: `${d.first_name} ${d.last_name}` }));
      }
      const orders = orderRes.success && Array.isArray(orderRes.data) ? orderRes.data : [];
      setDoctorOrders(orders);
      // Sıralama: önce order_num'u olanlar küçükten büyüğe, sonra order_num'u olmayanlar
      const sorted = [
        ...orders
          .map((order: any) => {
            const doc = doctorList.find(d => String(d.id) === String(order.doctor_id));
            if (!doc) return null;
            return { ...doc, order_num: order.order_num };
          })
          .filter(Boolean),
        ...doctorList.filter(d => !orders.some((o: any) => String(o.doctor_id) === String(d.id))).map(d => ({ ...d, order_num: 9999 }))
      ];
      setDoctors(sorted as Doctor[]);
    }).catch(() => setDoctors([])).finally(() => setLoading(false));
  }, []);

  // Doktorlar değişince bugünkü randevuları çek
  useEffect(() => {
    if (doctors.length === 0) return;
    setLoading(true);
    const branchId = localStorage.getItem("branchId");
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    Promise.all(
      doctors.map(doc =>
        fetch(`https://dentalapi.karadenizdis.com/api/appointment?branch_id=${branchId}&doctor_id=${doc.id}&start_date=${todayStr}&end_date=${todayStr}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && Array.isArray(data.data)) {
              return data.data.map((item: any) => ({
                id: item.appointment_id,
                title: `${item.patient_name || item.patient_first_name + ' ' + item.patient_last_name} - ${item.notes || ''}`,
                start: new Date(item.appointment_time),
                end: new Date(new Date(item.appointment_time).getTime() + (item.duration_minutes || 30) * 60000),
                doctorId: doc.id,
                patient: item.patient_name || item.patient_first_name + ' ' + item.patient_last_name,
                note: item.notes || "",
                patientId: item.patient_id || item.patientId
              }));
            }
            return [];
          })
      )
    ).then(results => {
      setEvents(results.flat());
      setLoading(false);
    });
  }, [doctors]);

  // Takvimde her doktoru ayrı kaynak (resource) olarak göster
  const resources = doctors.map(d => ({ resourceId: d.id, resourceTitle: d.name }));

  return (
  <div style={{ background: "#fafdff", borderRadius: 22, boxShadow: "0 4px 24px #b6c2e233", padding: 32, minWidth: 340, maxWidth: 1100, minHeight: 520, height: '100%', maxHeight: 900, border: "1.5px solid #e3eaff", display: 'flex', flexDirection: 'column', justifyContent: 'stretch' }}>
      <div style={{ fontWeight: 900, fontSize: 24, color: "#1976d2", marginBottom: 18, letterSpacing: 0.3, textShadow: "0 2px 8px #e3eaff77" }}>Bugünkü Randevu Takvimi</div>
      {loading ? (
        <div style={{ color: "#1976d2", fontWeight: 700, fontSize: 18, textAlign: "center", margin: 40 }}>Yükleniyor...</div>
      ) : (
        <Calendar
          localizer={localizer}
          events={events}
          defaultView={Views.DAY}
          views={{ day: true }}
          step={15}
          timeslots={1}
          min={new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0)}
          max={new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 0)}
          resources={resources}
          resourceIdAccessor="resourceId"
          resourceTitleAccessor="resourceTitle"
          eventPropGetter={(event) => {
            return {
              style: {
                background: "linear-gradient(90deg, #0d1a4a 0%, #1976d2 100%)",
                border: "1.5px solid #1976d2",
                color: "#fff",
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 15,
                boxShadow: "0 4px 18px #1976d244",
                cursor: "pointer",
                transition: "transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s cubic-bezier(.4,2,.6,1)",
                display: "flex",
                alignItems: "center",
                padding: "10px 16px",
                margin: "3px 0",
                letterSpacing: 0.1,
                outline: "none"
              },
              className: "modern-event"
            };
          }}
          onSelectEvent={event => setSelectedEvent(event)}
          messages={messages}
          culture="tr-TR"
          formats={{
            // Sadece saat başlarında saat yazısı göster
            timeGutterFormat: (date, culture, loc) => {
              const minutes = date.getMinutes();
              if (minutes === 0 && loc) {
                return loc.format(date, "HH:mm", culture);
              }
              return "";
            },
            eventTimeRangeFormat: ({ start, end }, culture, loc) =>
              loc ? `${loc.format(start, "HH:mm", culture)} - ${loc.format(end, "HH:mm", culture)}` : "",
          }}
          style={{ height: 420, minHeight: 320, maxHeight: 700, width: "100%" }}
          resourceAccessor={event => event.doctorId}
          components={{
            toolbar: () => null // Toolbarı tamamen gizle
          }}
        />
      )}
      {/* Modal/Popup için placeholder */}
      {selectedEvent && (
        <div className="modern-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modern-modal-card modern-modal-animated" onClick={e => e.stopPropagation()} tabIndex={0}>
            <div className="modern-modal-glow"></div>
            <div className="modern-modal-title">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{marginRight:8,verticalAlign:'middle'}}><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.12"/><path d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#1976d2"/></svg>
              Randevu Özeti
            </div>
            <div className="modern-modal-patient">
              <a
                href={selectedEvent.patientId ? `/patients/card?id=${selectedEvent.patientId}` : undefined}
                onClick={e => {
                  e.stopPropagation();
                  if (selectedEvent.patientId) {
                    window.location.href = `/patients/card?id=${selectedEvent.patientId}`;
                  }
                }}
                className="modern-modal-patient-link"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{marginRight:5,verticalAlign:'middle'}}><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.18"/><path d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#1976d2"/></svg>
                {selectedEvent.patient}
              </a>
            </div>
            <div className="modern-modal-note">{selectedEvent.note}</div>
            <div className="modern-modal-time">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{marginRight:5,verticalAlign:'middle'}}><circle cx="12" cy="12" r="12" fill="#1976d2" opacity="0.13"/><path d="M12 7v5l4 2" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#1976d2" strokeWidth="2"/></svg>
              {format(selectedEvent.start, "HH:mm", { locale: tr })} - {format(selectedEvent.end, "HH:mm", { locale: tr })}
            </div>
            <button className="modern-modal-close" onClick={() => setSelectedEvent(null)}>
              <span>Kapat</span>
            </button>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
            @keyframes glowPulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            .modern-modal-overlay {
              position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; background: #0d1a4a33; z-index: 1000;
              display: flex; align-items: center; justify-content: center; animation: fadeIn .22s;
            }
            .modern-modal-card {
              background: linear-gradient(120deg, #fafdff 60%, #e3eaff 100%);
              border-radius: 28px; min-width: 340px; max-width: 460px; padding: 54px 38px 36px 38px;
              box-shadow: 0 12px 48px #0d1a4a44, 0 1.5px 0 #1976d2;
              animation: popIn .32s cubic-bezier(.4,2,.6,1);
              border: 2.5px solid #1976d2;
              display: flex; flex-direction: column; align-items: center;
              position: relative;
              outline: none;
              transition: box-shadow .18s, transform .18s;
            }
            .modern-modal-animated:active {
              transform: scale(0.98);
              box-shadow: 0 4px 18px #1976d244;
            }
            .modern-modal-glow {
              position: absolute; top: -18px; left: 50%; transform: translateX(-50%);
              width: 80%; height: 32px; border-radius: 50%;
              background: radial-gradient(ellipse at center, #1976d2 0%, #e3eaff00 80%);
              opacity: 0.18; filter: blur(6px);
              z-index: 0; pointer-events: none;
              animation: glowPulse 2.2s infinite;
            }
            .modern-modal-title {
              font-weight: 900; font-size: 25px; color: #1976d2; margin-bottom: 18px; letter-spacing: 0.2px; text-shadow: 0 2px 8px #e3eaff77;
              display: flex; align-items: center; z-index: 1;
            }
            .modern-modal-patient {
              margin-bottom: 10px; z-index: 1;
            }
            .modern-modal-patient-link {
              color: #1976d2; font-weight: 900; font-size: 20px; text-decoration: underline; cursor: pointer;
              transition: color .18s, text-shadow .18s, background .18s, box-shadow .18s;
              border-radius: 8px; padding: 2px 8px 2px 2px; outline: none; display: inline-flex; align-items: center;
            }
            .modern-modal-patient-link:hover, .modern-modal-patient-link:focus {
              color: #fff; background: #1976d2; text-shadow: 0 2px 8px #0d1a4a33;
              box-shadow: 0 2px 12px #1976d244;
            }
            .modern-modal-note {
              font-size: 16px; color: #6073a6; margin: 12px 0 18px 0; text-align: center; z-index: 1;
            }
            .modern-modal-time {
              font-size: 18px; color: #1976d2; font-weight: 800; margin-bottom: 22px; display: flex; align-items: center; z-index: 1;
            }
            .modern-modal-close {
              margin-top: 10px; padding: 13px 38px; border-radius: 14px; border: none;
              background: linear-gradient(90deg, #1976d2 0%, #0d1a4a 100%);
              color: #fff; font-weight: 900; font-size: 17px; cursor: pointer;
              box-shadow: 0 2px 12px #e3eaff55; letter-spacing: 0.1px; transition: background .18s, transform .12s, box-shadow .18s;
              z-index: 1;
            }
            .modern-modal-close:hover, .modern-modal-close:focus {
              background: linear-gradient(90deg, #0d1a4a 0%, #1976d2 100%);
              transform: scale(1.04);
              box-shadow: 0 4px 18px #1976d244;
            }
          `}</style>
        </div>
      )}
      {/* Takvim slot yüksekliğini küçültmek için özel CSS */}
      <style>{`
        .rbc-time-slot {
          min-height: 15px !important;
          height: 15px !important;
        }
        .rbc-timeslot-group {
          min-height: 15px !important;
          height: 15px !important;
        }
        .rbc-time-content {
          font-size: 13px;
        }
        .rbc-time-gutter-cell {
          font-size: 13px;
          color: #1976d2;
          font-weight: 800;
          letter-spacing: 0.1px;
        }
        .rbc-event, .modern-event {
          box-shadow: 0 4px 18px #1976d244 !important;
          transition: transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s cubic-bezier(.4,2,.6,1);
        }
        .modern-event:hover {
          transform: scale(1.04);
          box-shadow: 0 8px 32px #0d1a4a33 !important;
          filter: brightness(1.08);
        }
        .rbc-header {
          font-weight: 800;
          color: #1976d2;
          font-size: 15px;
          background: #fafdff;
          border-bottom: 1.5px solid #e3eaff;
          pointer-events: none;
          user-select: none;
        }
        .rbc-today {
          background: #e3eaff !important;
        }
      `}</style>
    </div>
  );
};

export default MiniAppointmentCalendar;
          