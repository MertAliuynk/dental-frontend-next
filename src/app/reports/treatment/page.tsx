"use client";
import AppLayout from "../../components/AppLayout";
import { useEffect, useState } from "react";

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function TreatmentReports() {
  const [report, setReport] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"overview" | "doctors" | "popular" | "trends">("overview");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("2025-08-01");
  const [endDate, setEndDate] = useState<string>("2025-08-10");

  function fetchReport() {
    setError("");
    setReport(null);
    console.log("Fetching data for dates:", startDate, "to", endDate); // Debug
  fetch(`https://dentalapi.karadenizdis.com/api/reports/treatment?start=${startDate}&end=${endDate}`)
      .then(res => {
        console.log("Response status:", res.status); // Debug
        return res.json();
      })
      .then(data => {
        console.log("API Response:", data); // Debug log
        if (!data.success) {
          setError("Veri alınamadı.");
          return;
        }
        console.log("Setting report data..."); // Debug
        setReport(data);
        // İlk doktoru otomatik seç
        if (data.doctors && data.doctors.length > 0) {
          setSelectedDoctor(data.doctors[0].doctor_name);
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err); // Debug
        setError("Sunucuya bağlanılamadı.");
      });
  }

  useEffect(() => { fetchReport(); }, [startDate, endDate]);

  if (error) return (
    <AppLayout>
  {/* <Topbar /> kaldırıldı, AppLayout kullanılmalı */}
      <div style={{ color: 'red', padding: 32, textAlign: 'center' }}>{error}</div>
    </AppLayout>
  );

  if (!report) return (
    <AppLayout>
  {/* <Topbar /> kaldırıldı, AppLayout kullanılmalı */}
      <div style={{ padding: 32, textAlign: 'center', color: '#1976d2', fontSize: 18 }}>Yükleniyor...</div>
    </AppLayout>
  );

  // Debug: Veriyi ekrana yazdır
  console.log("Report data:", report);

  const getStatusChartData = () => {
    return {
      labels: ["Önerilen", "Onaylanan", "Tamamlanan"],
      datasets: [
        {
          data: [
            report.summary?.suggested_treatments || 0,
            report.summary?.approved_treatments || 0,
            report.summary?.completed_treatments || 0
          ],
          backgroundColor: ["#ff9800", "#2196f3", "#4caf50"],
          borderWidth: 0,
        },
      ],
    };
  };

  const getPopularTreatmentsChart = () => {
    return {
      labels: report.popular_treatments?.slice(0, 8).map((t: any) => t.name) || [],
      datasets: [
        {
          label: "Tedavi Sayısı",
          data: report.popular_treatments?.slice(0, 8).map((t: any) => t.total) || [],
          backgroundColor: "#1976d2",
          borderRadius: 8,
        },
      ],
    };
  };

  const getDoctorPerformanceChart = () => {
    return {
      labels: report.doctors?.slice(0, 10).map((d: any) => `Dr. ${d.doctor_name}`) || [],
      datasets: [
        {
          label: "Önerilen",
          data: report.doctors?.slice(0, 10).map((d: any) => d.suggested_treatments) || [],
          backgroundColor: "#ff9800",
          borderRadius: 4,
        },
        {
          label: "Onaylanan",
          data: report.doctors?.slice(0, 10).map((d: any) => d.approved_treatments) || [],
          backgroundColor: "#2196f3",
          borderRadius: 4,
        },
        {
          label: "Tamamlanan",
          data: report.doctors?.slice(0, 10).map((d: any) => d.completed_treatments) || [],
          backgroundColor: "#4caf50",
          borderRadius: 4,
        },
      ],
    };
  };

  const getTrendsChart = () => {
    const days = report.daily_treatments?.map((d: any) => d.date.slice(5).replace("-", ".")) || [];
    return {
      labels: days,
      datasets: [
        {
          label: "Önerilen",
          data: report.daily_treatments?.map((d: any) => d.suggested) || [],
          borderColor: "#ff9800",
          backgroundColor: "rgba(255, 152, 0, 0.1)",
          tension: 0.4,
          fill: false,
        },
        {
          label: "Onaylanan",
          data: report.daily_treatments?.map((d: any) => d.approved) || [],
          borderColor: "#2196f3",
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          tension: 0.4,
          fill: false,
        },
        {
          label: "Tamamlanan",
          data: report.daily_treatments?.map((d: any) => d.completed) || [],
          borderColor: "#4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          tension: 0.4,
          fill: false,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { 
        display: viewMode !== "overview",
        position: 'top' as const,
      },
      title: { display: false },
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: "#1a237e", font: { weight: 700 } } 
      },
      y: { 
        grid: { color: "#e3eafc" }, 
        ticks: { color: "#1a237e", font: { weight: 700 }, stepSize: 1 } 
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { 
        display: true,
        position: 'top' as const,
      },
      title: { display: false },
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: "#1a237e", font: { weight: 700 } } 
      },
      y: { 
        grid: { color: "#e3eafc" }, 
        ticks: { color: "#1a237e", font: { weight: 700 }, stepSize: 1 } 
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right' as const },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.label}: ${context.parsed} tedavi`
        }
      }
    },
  };

  return (
    <AppLayout>
  {/* <Topbar /> kaldırıldı, AppLayout kullanılmalı */}
      <main style={{ flex: 1, padding: 32 }}>
        <h2 style={{ color: "#0a2972", fontWeight: 700, fontSize: 26, marginBottom: 24 }}>
          🦷 Tedavi Raporları
        </h2>

        {/* Debug Bilgisi */}
        <div style={{ background: "#f0f0f0", padding: 16, marginBottom: 16, borderRadius: 8 }}>
          <strong>Debug:</strong> Total Treatments: {report?.summary?.total_treatments || "Veri yok"}, 
          Popular Treatments Count: {report?.popular_treatments?.length || 0},
          Doctors Count: {report?.doctors?.length || 0}
        </div>

        {/* Kontroller */}
        <div style={{ 
          background: "#fff", 
          borderRadius: 12, 
          padding: 20, 
          marginBottom: 24,
          boxShadow: "0 2px 8px #0001"
        }}>
          {/* Tarih Seçimi */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, color: '#1976d2' }}>Tarih Aralığı:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              style={{ 
                background: '#e3eafc', 
                border: '2px solid #1976d2', 
                borderRadius: 6, 
                padding: '6px 10px', 
                color: '#1a237e', 
                fontWeight: 600 
              }} 
            />
            <span style={{ color: '#1976d2', fontWeight: 700 }}>-</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              style={{ 
                background: '#e3eafc', 
                border: '2px solid #1976d2', 
                borderRadius: 6, 
                padding: '6px 10px', 
                color: '#1a237e', 
                fontWeight: 600 
              }} 
            />
          </div>

          {/* Görünüm Modu */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { key: "overview", label: "📊 Genel Görünüm", color: "#1976d2" },
              { key: "doctors", label: "👨‍⚕️ Doktor Analizi", color: "#388e3c" },
              { key: "popular", label: "🏆 Popüler Tedaviler", color: "#f57c00" },
              { key: "trends", label: "📈 Günlük Trendler", color: "#9c27b0" }
            ].map(mode => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key as any)}
                style={{
                  background: viewMode === mode.key ? mode.color : "#f5f5f5",
                  color: viewMode === mode.key ? "#fff" : mode.color,
                  border: `2px solid ${mode.color}`,
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Özet Kartları */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ 
            background: "linear-gradient(135deg, #1976d2, #42a5f5)", 
            color: "white", 
            borderRadius: 12, 
            padding: 20, 
            textAlign: "center" 
          }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{report.summary?.total_treatments || 0}</div>
            <div style={{ opacity: 0.9 }}>Toplam Tedavi</div>
          </div>
          <div style={{ 
            background: "linear-gradient(135deg, #ff9800, #ffb74d)", 
            color: "white", 
            borderRadius: 12, 
            padding: 20, 
            textAlign: "center" 
          }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{report.summary?.suggested_treatments || 0}</div>
            <div style={{ opacity: 0.9 }}>Önerilen</div>
          </div>
          <div style={{ 
            background: "linear-gradient(135deg, #2196f3, #64b5f6)", 
            color: "white", 
            borderRadius: 12, 
            padding: 20, 
            textAlign: "center" 
          }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{report.summary?.approved_treatments || 0}</div>
            <div style={{ opacity: 0.9 }}>Onaylanan</div>
          </div>
          <div style={{ 
            background: "linear-gradient(135deg, #4caf50, #66bb6a)", 
            color: "white", 
            borderRadius: 12, 
            padding: 20, 
            textAlign: "center" 
          }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{report.summary?.completed_treatments || 0}</div>
            <div style={{ opacity: 0.9 }}>Tamamlanan</div>
          </div>
          <div style={{ 
            background: "linear-gradient(135deg, #9c27b0, #ba68c8)", 
            color: "white", 
            borderRadius: 12, 
            padding: 20, 
            textAlign: "center" 
          }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>%{report.summary?.approval_rate || 0}</div>
            <div style={{ opacity: 0.9 }}>Onay Oranı</div>
          </div>
          <div style={{ 
            background: "linear-gradient(135deg, #e91e63, #f06292)", 
            color: "white", 
            borderRadius: 12, 
            padding: 20, 
            textAlign: "center" 
          }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>%{report.summary?.completion_rate || 0}</div>
            <div style={{ opacity: 0.9 }}>Tamamlama Oranı</div>
          </div>
        </div>

        {/* Ana İçerik */}
        <div style={{ display: "grid", gridTemplateColumns: viewMode === "overview" ? "1fr 1fr" : "1fr", gap: 24 }}>
          
          {/* Ana Grafik */}
          <div style={{ 
            background: "white", 
            borderRadius: 12, 
            boxShadow: "0 2px 8px #0001", 
            padding: 24 
          }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#1976d2" }}>
              {viewMode === "overview" && "📊 Tedavi Durum Analizi"}
              {viewMode === "doctors" && "👨‍⚕️ Doktor Performans Karşılaştırması"}
              {viewMode === "popular" && "🏆 En Çok Uygulanan Tedaviler"}
              {viewMode === "trends" && "📈 Günlük Tedavi Trendleri"}
            </h3>
            
            {viewMode === "overview" && (
              <Doughnut data={getStatusChartData()} options={pieOptions} />
            )}
            {viewMode === "doctors" && (
              <Bar data={getDoctorPerformanceChart()} options={chartOptions} />
            )}
            {viewMode === "popular" && (
              <Bar data={getPopularTreatmentsChart()} options={chartOptions} />
            )}
            {viewMode === "trends" && (
              <Line data={getTrendsChart()} options={lineOptions} />
            )}
          </div>

          {/* Yan Panel (sadece overview modunda) */}
          {viewMode === "overview" && (
            <div style={{ 
              background: "white", 
              borderRadius: 12, 
              boxShadow: "0 2px 8px #0001", 
              padding: 24 
            }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#1976d2" }}>
                🏆 Popüler Tedaviler (Top 5)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {report.popular_treatments?.slice(0, 5).map((treatment: any, index: number) => (
                  <div 
                    key={treatment.name}
                    style={{ 
                      background: "#f5f5f5", 
                      borderRadius: 8, 
                      padding: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#1976d2" }}>
                        #{index + 1} {treatment.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        Onay: {treatment.approved + treatment.completed}, Tamamlanan: {treatment.completed}
                      </div>
                    </div>
                    <div style={{ 
                      background: "#1976d2", 
                      color: "white", 
                      borderRadius: 6, 
                      padding: "4px 8px",
                      fontWeight: 700,
                      fontSize: 14
                    }}>
                      {treatment.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detaylı Tablolar */}
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginTop: 24 }}>
          
          {/* Doktor Tablosu */}
          <div style={{ 
            background: "white", 
            borderRadius: 12, 
            boxShadow: "0 2px 8px #0001", 
            padding: 24
          }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#1976d2" }}>👨‍⚕️ Doktor Performans Detayları</h3>
            <div style={{ maxHeight: 400, overflowY: "auto", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 480 }}>
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    <th style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Doktor</th>
                    <th style={{ padding: "8px", textAlign: "center", borderBottom: "2px solid #e0e0e0" }}>Toplam</th>
                    <th style={{ padding: "8px", textAlign: "center", borderBottom: "2px solid #e0e0e0" }}>Onay %</th>
                    <th style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>En Çok</th>
                  </tr>
                </thead>
                <tbody>
                  {report.doctors?.slice(0, 10).map((doctor: any) => (
                    <tr key={doctor.doctor_id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "8px" }}>
                        <div>Dr. {doctor.doctor_name}</div>
                        <div style={{ fontSize: 11, color: "#666" }}>{doctor.branch_name}</div>
                      </td>
                      <td style={{ padding: "8px", textAlign: "center", fontWeight: "bold" }}>{doctor.total_treatments}</td>
                      <td style={{ padding: "8px", textAlign: "center", fontWeight: "bold" }}>%{doctor.approval_rate}</td>
                      <td style={{ padding: "8px", fontSize: 11 }}>
                        {doctor.most_used_treatment} ({doctor.most_used_count})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Popüler Tedaviler Tablosu */}
          <div style={{ 
            background: "white", 
            borderRadius: 12, 
            boxShadow: "0 2px 8px #0001", 
            padding: 24
          }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#1976d2" }}>🏆 Tedavi Türleri Detayları</h3>
            <div style={{ maxHeight: 400, overflowY: "auto", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 480 }}>
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    <th style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Tedavi</th>
                    <th style={{ padding: "8px", textAlign: "center", borderBottom: "2px solid #e0e0e0" }}>Toplam</th>
                    <th style={{ padding: "8px", textAlign: "center", borderBottom: "2px solid #e0e0e0" }}>Onaylanan</th>
                    <th style={{ padding: "8px", textAlign: "center", borderBottom: "2px solid #e0e0e0" }}>Tamamlanan</th>
                  </tr>
                </thead>
                <tbody>
                  {report.popular_treatments?.slice(0, 10).map((treatment: any, index: number) => (
                    <tr key={treatment.name} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "8px" }}>
                        <span style={{ fontWeight: 600, color: "#f57c00" }}>#{index + 1}</span> {treatment.name}
                      </td>
                      <td style={{ padding: "8px", textAlign: "center", fontWeight: "bold" }}>{treatment.total}</td>
                      <td style={{ padding: "8px", textAlign: "center", color: "#2196f3", fontWeight: "bold" }}>{treatment.approved}</td>
                      <td style={{ padding: "8px", textAlign: "center", color: "#4caf50", fontWeight: "bold" }}>{treatment.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
