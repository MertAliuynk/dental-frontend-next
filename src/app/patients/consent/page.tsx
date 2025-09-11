
"use client";
import { useState, useEffect, useRef } from "react";
import PatientSelectModal from "../../components/PatientSelectModal";
import DoctorSelectModal from "../../components/DoctorSelectModal";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

export default function ConsentFormsPage() {
    const printRef = useRef<HTMLDivElement>(null);
  const [showPatientModal, setShowPatientModal] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedConsent, setSelectedConsent] = useState<string>("");

  // Hasta seçildiğinde onam formu modalı açılır
  const handlePatientSelect = (patientId: number | string) => {
    // Eğer hasta listesi boşsa, fetch et
    if (patients.length === 0) {
      fetch("https://dentalapi.karadenizdis.com/api/patient?limit=1000")
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPatients(data.data);
            const found = data.data.find((p: any) => p.patient_id == patientId);
            setSelectedPatient(found || null);
          }
        });
    } else {
      const found = patients.find((p: any) => p.patient_id == patientId);
      setSelectedPatient(found || null);
    }
    setShowPatientModal(false);
    setShowConsentModal(true);
  };

  // Onam formu seçildiğinde doktor modalı açılır
  const handleConsentSelect = (form: string) => {
    setSelectedConsent(form);
    setShowConsentModal(false);
    setTimeout(() => setShowDoctorModal(true), 200); // Modal çakışmasını önlemek için gecikme
  };

  // Doktor seçildiğinde özet gösterilir
  const handleDoctorSelect = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(false);
  };

  // Tek bir onam formu
  const consentFormName = "Genel Bilgilendirme ve Onam Formu";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ zIndex: 110, position: "relative" }}>
        <Topbar />
      </div>
      <div style={{ flex: 1, display: "flex", minHeight: "100vh" }}>
        <Sidebar />

        <main style={{ flex: 1, padding: 32, background: "#f5f6fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <h2 style={{ fontWeight: 900, fontSize: 28, color: "#1976d2", marginBottom: 24, textAlign: "center" }}>Onam Formları</h2>

          {/* Hasta kartı */}
          {selectedPatient && (
            <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px #1976d211", padding: 24, marginBottom: 24, maxWidth: 500, width: "100%", textAlign: "left" }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: "#0d1a4a", marginBottom: 10, letterSpacing: 0.2 }}>Hasta Bilgileri</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#222", marginBottom: 4 }}><b>Ad Soyad:</b> <span style={{ color: '#1976d2', fontWeight: 900 }}>{selectedPatient.first_name} {selectedPatient.last_name}</span></div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#222", marginBottom: 4 }}><b>Telefon:</b> <span style={{ color: '#1976d2', fontWeight: 900 }}>{selectedPatient.phone}</span></div>
              {selectedPatient.branch_name && <div style={{ fontWeight: 700, fontSize: 17, color: "#222", marginBottom: 4 }}><b>Şube:</b> <span style={{ color: '#1976d2', fontWeight: 900 }}>{selectedPatient.branch_name}</span></div>}
            </div>
          )}

          {/* Özet ve yazdır butonu */}
          {selectedPatient && selectedDoctor && selectedConsent && (
            <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px #1976d211", padding: 24, marginBottom: 24, maxWidth: 500, width: "100%", textAlign: "left" }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: "#0d1a4a", marginBottom: 10, letterSpacing: 0.2 }}>Seçilen Bilgiler</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#222", marginBottom: 4 }}><b>Hasta:</b> <span style={{ color: '#1976d2', fontWeight: 900 }}>{selectedPatient.first_name} {selectedPatient.last_name}</span></div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#222", marginBottom: 4 }}><b>Onam Formu:</b> <span style={{ color: '#1976d2', fontWeight: 900 }}>{selectedConsent}</span></div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#222", marginBottom: 4 }}><b>Doktor:</b> <span style={{ color: '#1976d2', fontWeight: 900 }}>{selectedDoctor.first_name} {selectedDoctor.last_name}</span></div>
              <button style={{ marginTop: 18, background: "#1976d2", color: "#fff", border: 0, borderRadius: 10, padding: "10px 28px", fontWeight: 900, fontSize: 17, cursor: "pointer", letterSpacing: 0.1 }}
                onClick={() => {
                  if (printRef.current) {
                    const printContents = printRef.current.innerHTML;
                    const win = window.open('', '', 'height=900,width=900');
                    if (win) {
                      win.document.write('<html><head><title>Onam Formu</title>');
                      win.document.write('<style>@media print { body { background: #fff; color: #222; } button { display: none !important; } .page-break { page-break-after: always; } }</style>');
                      win.document.write('</head><body>');
                      win.document.write(printContents);
                      win.document.write('</body></html>');
                      win.document.close();
                      win.focus();
                      setTimeout(() => { win.print(); win.close(); }, 300);
                    }
                  }
                }}
              >Yazdır</button>
          {/* YAZDIRILACAK PDF İÇERİĞİ (GİZLİ) */}
          <div style={{ display: 'none' }}>
            <div ref={printRef} id="print-area">
              {/* 1. Sayfa: Diş Hekimine Bilgilendirme */}
              <div className="page-break">
                <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16 }}>DİŞ HEKİMİNE BİLGİLENDİRME</div>
                <div style={{ marginBottom: 16 }}>
                  Değerli Meslektaşım,<br /><br />
                  Hastaya yapılacak her türlü müdahale için hastanın aydınlatılmış onamının alınmış olması zorunludur.<br /><br />
                  Bu onam, ağız ve diş sağlığı için yapılabilecek tıbbi işlemler ile bunların beklenen etkilerine ilişkin olarak hastanın anlayıp değerlendirebileceği açıklıkta bilgi verildikten sonra hastanın kararının açıklanması şeklinde ortaya çıkar.<br /><br />
                  Büyük cerrahi işlemlerle klinik olarak hastadan alınacak aydınlatılmış onamın yazılı olması şarttır. Diğer işlemlerde aydınlatılmış onamın yazılı olması şart değilse de yazılı olmasında gereklilik tıbbi etik açısından bakımından yarar vardır.<br /><br />
                  Ekli sunulan aydınlatılmış onam örneği bütünlüğü örnek olması için hazırlanmıştır. Hastaya gerekli bilgilerin tarafınızdan verilmesinden sonra, bu örnekten aydınlatılmış onam/aydınlatılmış onam belgesi hazırlanabilir. Tıbbi tedavinin özellikli olması ve/veya hastanın kişisel durumu sebebiyle ek risklerin olduğu halinde bu durumun hasta ile paylaşılması ve onam formunda ayrıca belirtilmesi gereklidir.<br /><br />
                  Son olarak vurgulamak gerekir ki, aydınlatma yapılmadan hastanın imzasının alınması gerçek bir onam olarak kabul edilemeyebilir. Onam, tedavi seçenekleri, yapılacak işlemler ve olası riskleri konusunda hastanın anlayabileceği açıklıkta bilimsel bilginin anlatılması ve rızanın bunun üzerine verilmesi halinde geçerlidir.<br /><br />
                  Saygılarımızla.
                </div>
                <hr style={{ margin: '32px 0' }} />
              </div>
              {/* 2. Sayfa: Genel Bilgilendirme ve Genel Onam Formu Başlangıcı */}
              <div className="page-break">
                <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16 }}>GENEL BİLGİLENDİRME</div>
                <div style={{ marginBottom: 16 }}>
                  Sayın <b>{selectedPatient?.first_name} {selectedPatient?.last_name}</b>,<br /><br />
                  Ağız diş sağlığı sorununuzun giderilebilmesi için size önerilen tıbbi işlem ve bu işlemle ilgili sözlü anlatılan ve Yetişkin Hasta Bilgilendirme Broşürü/Çocuk Hasta Bilgilendirme Broşürü'nde tarafınızdan okunarak bilgi edinilen hususların bir kısmı aşağıda yazılı olarak sunulmuştur.<br /><br />
                  Size verilen bilgileri okuyunuz. Böylece size ya da vasisi olduğunuz kişiye uygulanacak tedaviler hakkında bilgi sahibi olacaksınız. Bu açıklamaların amacı ağız diş sağlığınızı iyileştirmek ve korumak için sizlerin bilgilendirilmeniz ve tedavi sürecine katılımınızı sağlamaktır.<br /><br />
                  Mevcut sistemik hastalıklarınız, kullandığınız ilaçlar ve genel sağlık durumunuz ilgili olarak hekiminizi bilgilendirmeniz gerekmektedir. Herhangi bir konuyu saklamış olmanız veya beyan etmemenizden kaynaklanacak sorumluluk size aittir.<br /><br />
                  Kliniğimize başvurunuz sırasında diş hekimliği tedavisi öncesinde yapılacak muayene ve değerlendirme, tetkikler, işlemler ve maliyetleri hakkında bilgi sahibi olmak sizin en doğal hakkınızdır.<br /><br />
                  Tedavi ve işlemlerin yararlarını, olası risklerini ve maliyetlerini öğrendikten sonra yapılacak işleme onay vermek sizin kararınıza bağlıdır.<br /><br />
                  Sağlık kuruluşumuzun düzenini ve tedavi programının aksamamasını için randevularınıza sadık olmaya ve zamanında gelmeye özen gösteriniz. Gelmeniz mümkün olmadığında, randevunuzu 24 saat öncesinden iptal ettiriniz.<br /><br />
                  Sağlıklı ve mutlu bir yaşam dileriz.<br /><br />
                </div>
                <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16 }}>GENEL ONAM FORMU</div>
                <div style={{ marginBottom: 16 }}>
                  Aşağıda imzası olan ben/hastanın vasisi <b>{selectedPatient?.first_name} {selectedPatient?.last_name}</b> ...<br /><br />
                  Diş Hekimi <b>{selectedDoctor?.first_name} {selectedDoctor?.last_name}</b> tarafından konulan tanı ve tedavi ile ilgili planlama, alternatif tedaviler, sonuçlar, istenmeyen yan etkileri hakkında bilgilendirildim, anladım. Uygulanacak olan tedaviyi kabul ettim.<br /><br />
                  Tedavi süresinde/sırasında ortaya çıkabilecek yeni durumlarla planlamanın değişebileceği anladım ve kabul ettim.<br /><br />
                  Tedavi uygulandığı takdirde ortaya çıkabilecek olası riskler, tedavinin alternatif uygulamalarına göre maliyet hesapları, gerekli görüldüğü takdirde diğer hekimlerden konsültasyon istenebileceğini kabul ettim.<br /><br />
                  Tedavim/vasisi olduğum kişinin tedavisi hakkında merak ettiğim tüm sorulara cevap verildi. Yapılacak tedavilerin başarısının bana da bağlı olduğu, evde üzerime düşenleri yerine getirmem ve önerilere uymam gerektiği, verilmeyen randevulara zamanında gelmediğimde işlemin diğer zamana erteleneceği ve uygulama bedelinin ilgili tarife uygun doz ve sürelerde kullanma gerekliliği anlatıldı, anladım ve kabul ettim.<br /><br />
                </div>
              </div>
              {/* 3. Sayfa: Onam devamı ve imza alanları */}
              <div className="page-break">
                <div style={{ marginBottom: 16 }}>
                  Uygulanacak tedavilerin ağız ve diş sağlığını korumayı amaçladığını, tıbbi hizmetlerin özenle yürütüleceği ancak tıbbi işlemlerde sonucun garanti edilemeyeceği tarafıma anlatıldı, anladım ve kabul ettim.<br /><br />
                  Yukarıda belirtildiği gibi tedavi planlaması sırasında bana/vasisi olduğum kişiye anlatılan ve benim tarafımdan kabul edilen diş tedavilerini onayladım ve kabul ettim.<br /><br />
                  Hasta hakları ve sorumlulukları, hekim hakları ve yükümlülükleri konularında detaylı olarak bilgilendirildim.<br /><br />
                  Tedaviyi kabul ettikten sonra bana/vasisi olduğum kişiye ait radyografi, fotoğraf, video ve diğer dokümanların, eğitim ve/veya bilimsel amaçlı çalışmalarda anonimleştirilmiş veri olarak kullanılmasına izin veriyorum. Kişisel verilerimin Kamu kurum ve kuruluşları da dahil olmak üzere üçüncü kişi ve kurumlarla paylaşılmasına izin ................. (El yazınız ile “veriyorum” ya da “vermiyorum” yazınız.)<br /><br />
                </div>
                <div style={{ marginBottom: 24 }}>
                  .................................................... El yazınız ile “okuduğumu anladım, kabul ediyorum” yazınız.<br /><br />
                  Tarih: <span style={{ minWidth: 120, display: 'inline-block', borderBottom: '1px solid #222' }}></span>
                </div>
                <div style={{ marginBottom: 16 }}>
                  Hasta Adı-Soyadı: <b>{selectedPatient?.first_name} {selectedPatient?.last_name}</b><br />
                  Hekimin Adı-Soyadı: <b>{selectedDoctor?.first_name} {selectedDoctor?.last_name}</b><br />
                  Telefon: <b>{selectedPatient?.phone}</b><br />
                  Şube: <b>{selectedPatient?.branch_name || ''}</b><br />
                  İmza: ....................................................
                </div>
                <div style={{ marginBottom: 16 }}>
                  <b>Hastanın Yasal Temsilcisi (Varsa):</b> ....................................................<br />
                  <b>Adı-Soyadı:</b> ....................................................<br />
                  <b>İmza:</b> ....................................................
                </div>
              </div>
              {/* 4. Sayfa: Tedavi Planındaki Değişiklikler */}
              <div>
                <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16 }}>TEDAVİ PLANINDAKİ DEĞİŞİKLİKLER</div>
                <div style={{ marginBottom: 12 }}>
                  ............... tarihinde yapılan tedavi planında aşağıda belirtilmiş olan değişiklikler yapılmıştır.
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }} border={1}>
                  <thead>
                    <tr>
                      <th style={{ padding: 6 }}>DİŞ</th>
                      <th style={{ padding: 6 }}>TEŞHİS</th>
                      <th style={{ padding: 6 }}>PLANLANAN TEDAVİ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ height: 32 }}></td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr>
                      <td style={{ height: 32 }}></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginBottom: 16 }}>
                  Diş hekimim tedavi değişikliğinin neden gerektiğini, içerdiği riskleri, oluşabilecek problemleri, alternatif yöntemleri, tedavi sırasında oluşabilecek değişiklikleri, başarı olasılığı ve iyileşme sürecinde yaşanabilecek olayları açıkladı.<br /><br />
                  Yukarıda belirtilmiş olan tedavi planındaki değişikliği kabul ....................(El yazınız ile “ediyorum” ya da “etmiyorum” yazınız.)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }} border={1}>
                  <thead>
                    <tr>
                      <th>Adı-Soyadı</th>
                      <th>İmza</th>
                      <th>Tarih/Saat</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ height: 32 }}></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ fontSize: 13, color: '#444' }}>
                  <b>Hasta / Hastanın Yasal Temsilcisi (*) – yakınlık derecesi</b><br />
                  <b>Bilgilendirmeyi yapan Hekim</b><br />
                  <b>Tercüman (kullanılması halinde)</b><br />
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 12 }}>
                  * Yasal Temsilci: Vesayet altındakiler için vasi, reşit olmayanlar için anne-baba, bunların bulunmadığı durumlarda 1. derece kanuni mirasçılardır. (Hasta yakınının isminin yanında yakınlık derecesini belirtiniz)
                </div>
              </div>
            </div>
          </div>
          {/* Print için sadece print-area'yı göster */}
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #print-area, #print-area * { visibility: visible !important; }
              #print-area { position: absolute; left: 0; top: 0; width: 100vw; background: #fff; color: #222; }
              button { display: none !important; }
              .page-break { page-break-after: always; }
            }
          `}</style>
            </div>
          )}

          {/* Hasta seçme modalı */}
          {showPatientModal && (
            <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#0007", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PatientSelectModal
                open={showPatientModal}
                onClose={() => setShowPatientModal(false)}
                onSelect={handlePatientSelect}
              />
            </div>
          )}

          {/* Onam formu seçme modalı */}
          {showConsentModal && (
            <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#0007", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#fff", borderRadius: 16, minWidth: 340, maxWidth: 420, boxShadow: "0 8px 32px #0002", padding: 24, position: "relative" }}>
                <h3 style={{ fontWeight: 800, fontSize: 22, color: "#1a237e", marginBottom: 18 }}>Onam Formu Seç</h3>
                <button onClick={() => setShowConsentModal(false)} style={{ position: "absolute", top: 12, right: 12, background: "#fbeaea", color: "#b91c1c", border: "1.5px solid #e6b6b6", borderRadius: 8, padding: "4px 12px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Kapat</button>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  <li
                    style={{ padding: "12px 0", fontSize: 16, color: "#222", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    onClick={() => handleConsentSelect(consentFormName)}
                  >
                    {consentFormName}
                    <span style={{ fontSize: 18, color: "#1976d2", fontWeight: 900, marginLeft: 8 }}>{'>'}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Doktor seçme modalı */}
          {showDoctorModal && (
            <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#0007", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DoctorSelectModal
                open={showDoctorModal}
                onClose={() => setShowDoctorModal(false)}
                onSelect={handleDoctorSelect}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
