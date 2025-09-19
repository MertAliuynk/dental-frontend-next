"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'treatments' | 'pricelists' | 'branches' | 'doctororders'>('users');
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    // Admin kontrolü
    const userRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    
    if (!token) {
      router.replace("/login");
      return;
    }
    
    if (userRole !== "admin") {
      router.replace("/");
      return;
    }
    
    setRole(userRole);
  }, [router]);

  const tabs = [
    { id: 'users', label: '👥 Kullanıcı Yönetimi', icon: '👥' },
    { id: 'treatments', label: '🦷 Tedavi Türleri', icon: '🦷' },
    { id: 'pricelists', label: '💰 Fiyat Listeleri', icon: '💰' },
    { id: 'branches', label: '🏢 Şubeler', icon: '🏢' },
    { id: 'doctororders', label: '📋 Doktor Sıraları', icon: '📋' }
  ];

  if (role !== "admin") {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa" }}>
      {/* Header */}
      <div style={{ 
        background: "#1a237e", 
        color: "white", 
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          ⚙️ Sistem Yönetim Paneli
        </h1>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "8px 16px",
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            🦷 Dental Paneli
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            style={{
              padding: "8px 16px",
              background: "#e53935",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Çıkış
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        background: "white", 
        borderBottom: "2px solid #e0e0e0",
        padding: "0 32px"
      }}>
        <div style={{ display: "flex", gap: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "16px 24px",
                background: activeTab === tab.id ? "#1a237e" : "transparent",
                color: activeTab === tab.id ? "white" : "#666",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid #1976d2" : "3px solid transparent",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: 32 }}>
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'treatments' && <TreatmentManagement />}
        {activeTab === 'pricelists' && <PriceListManagement />}
        {activeTab === 'branches' && <BranchManagement />}
        {activeTab === 'doctororders' && <DoctorOrderManagement />}
      </div>
    </div>
  );
}

// Kullanıcı Yönetimi Component
function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: '',
    branchId: '',
    firstName: '',
    lastName: ''
  });

  // Kullanıcıları getir
  const fetchUsers = async () => {
    try {
  const res = await fetch('https://dentalapi.karadenizdis.com/api/user');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Kullanıcılar alınamadı:', err);
    }
  };

  // Şubeleri getir
  const fetchBranches = async () => {
    try {
  const res = await fetch('https://dentalapi.karadenizdis.com/api/branch');
      const data = await res.json();
      if (data.success) {
        setBranches(data.data);
      }
    } catch (err) {
      console.error('Şubeler alınamadı:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  // Form temizle
  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: '',
      branchId: '',
      firstName: '',
      lastName: ''
    });
    setEditingUser(null);
    setShowCreateForm(false);
  };

  // Kullanıcı kaydet (yeni veya düzenle)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingUser 
        ? `https://dentalapi.karadenizdis.com/api/user/${editingUser.user_id}`
        : 'https://dentalapi.karadenizdis.com/api/user';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (data.success) {
        await fetchUsers(); // Listeyi yenile
        resetForm();
  // alert(editingUser ? 'Kullanıcı güncellendi!' : 'Kullanıcı oluşturuldu!');
      } else {
  // alert(data.message || 'Hata oluştu!');
      }
    } catch (err) {
  // alert('Sunucu hatası!');
    } finally {
      setLoading(false);
    }
  };

  // Düzenlemek için kullanıcı seç
  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Şifre boş bırak
      role: user.role,
      branchId: user.branch_id || '',
      firstName: user.first_name,
      lastName: user.last_name
    });
    setShowCreateForm(true);
  };

  // Kullanıcı sil
  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`"${username}" kullanıcısını silmek istediğinizden emin misiniz?`)) return;
    
    try {
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/user/${userId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      
      if (data.success) {
        await fetchUsers();
  // alert('Kullanıcı silindi!');
      } else {
  // alert(data.message || 'Hata oluştu!');
      }
    } catch (err) {
  // alert('Sunucu hatası!');
    }
  };

  const roleLabels: { [key: string]: string } = {
    'admin': '👑 Admin',
    'branch_manager': '🏢 Şube Müdürü', 
    'doctor': '👨‍⚕️ Doktor',
    'receptionist': '👩‍💼 Resepsiyonist'
  };
  
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#1a237e", fontSize: 20 }}>👥 Kullanıcı Yönetimi</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: "10px 20px",
            background: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          + Yeni Kullanıcı Ekle
        </button>
      </div>

      {/* Kullanıcı Listesi */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
              <th style={{ padding: "12px", textAlign: "left", color: "#222", fontWeight: 700 }}>Ad Soyad</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#222", fontWeight: 700 }}>Kullanıcı Adı</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#222", fontWeight: 700 }}>Yetki</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#222", fontWeight: 700 }}>Şube</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#222", fontWeight: 700 }}>Oluşturma</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#222", fontWeight: 700 }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "12px", fontWeight: 700, color: "#222" }}>
                  {user.first_name} {user.last_name}
                </td>
                <td style={{ padding: "12px", fontWeight: 600, color: "#222" }}>
                  {user.username}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    padding: "4px 8px",
                    background: user.role === 'admin' ? '#e8f5e8' : user.role === 'doctor' ? '#e3f2fd' : '#fff3e0',
                    color: user.role === 'admin' ? '#2e7d32' : user.role === 'doctor' ? '#1565c0' : '#ef6c00',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {roleLabels[user.role] || user.role}
                  </span>
                </td>
                <td style={{ padding: "12px", fontWeight: 600, color: "#222" }}>
                  {user.branch_name || '-'}
                </td>
                <td style={{ padding: "12px", fontWeight: 600, color: "#222", fontSize: 12 }}>
                  {new Date(user.created_at).toLocaleDateString('tr-TR')}
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <button
                    onClick={() => handleEdit(user)}
                    style={{
                      padding: "4px 8px",
                      background: "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      marginRight: 8,
                      fontSize: 12
                    }}
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(user.user_id, user.username)}
                    style={{
                      padding: "4px 8px",
                      background: "#e53935",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
            Henüz kullanıcı bulunmuyor.
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
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
          <div style={{
            background: "white",
            borderRadius: 12,
            padding: 32,
            maxWidth: 500,
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ marginTop: 0, color: "#1a237e" }}>
              {editingUser ? '✏️ Kullanıcı Düzenle' : '➕ Yeni Kullanıcı Ekle'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#555" }}>
                      Ad *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: 6,
                        fontSize: 14,
                        color: "#222",
                        fontWeight: 700
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#555" }}>
                      Soyad *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: 6,
                        fontSize: 14,
                        color: "#222",
                        fontWeight: 700
                      }}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#555" }}>
                    Kullanıcı Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      fontSize: 14,
                      color: "#222",
                      fontWeight: 700
                    }}
                    required
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#555" }}>
                    Şifre {editingUser ? '(Değiştirmek için doldurun)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      fontSize: 14,
                      color: "#222",
                      fontWeight: 700
                    }}
                    required={!editingUser}
                  />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#555" }}>
                      Yetki *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: 6,
                        fontSize: 14,
                        color: "#222",
                        fontWeight: 700
                      }}
                      required
                    >
                      <option value="">Seçiniz</option>
                      <option value="admin">👑 Admin</option>
                      <option value="branch_manager">🏢 Şube Müdürü</option>
                      <option value="doctor">👨‍⚕️ Doktor</option>
                      <option value="receptionist">👩‍💼 Resepsiyonist</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#555" }}>
                      Şube
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: 6,
                        fontSize: 14,
                        color: "#222",
                        fontWeight: 700
                      }}
                    >
                      <option value="">Şube Seçiniz</option>
                      {branches.map((branch) => (
                        <option key={branch.branch_id} value={branch.branch_id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: "10px 20px",
                    background: "#757575",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    background: loading ? "#ccc" : "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Kaydediliyor...' : (editingUser ? 'Güncelle' : 'Oluştur')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Tedavi Türleri Yönetimi Component  
function TreatmentManagement() {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    isPerTooth: false,
    isJawSpecific: false,
    feedbackIntervals: [] as string[]
  });

  // Tedavi türlerini getir
  const fetchTreatments = async () => {
    try {
  const res = await fetch('https://dentalapi.karadenizdis.com/api/treatment-type');
      const data = await res.json();
      if (data.success) {
        setTreatments(data.data);
      }
    } catch (err) {
      console.error('Tedavi türleri alınamadı:', err);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  // Form temizle
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      isPerTooth: false,
      isJawSpecific: false,
      feedbackIntervals: []
    });
    setEditingTreatment(null);
    setShowCreateForm(false);
  };

  // Tedavi türü kaydet (yeni veya düzenle)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingTreatment 
        ? `https://dentalapi.karadenizdis.com/api/treatment-type/${editingTreatment.treatment_type_id}`
        : 'https://dentalapi.karadenizdis.com/api/treatment-type';
      
      const method = editingTreatment ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (data.success) {
        await fetchTreatments(); // Listeyi yenile
        resetForm();
  // alert(editingTreatment ? 'Tedavi türü güncellendi!' : 'Tedavi türü oluşturuldu!');
      } else {
  // alert(data.message || 'Hata oluştu!');
      }
    } catch (err) {
  // alert('Sunucu hatası!');
    } finally {
      setLoading(false);
    }
  };

  // Düzenlemek için tedavi türü seç
  const handleEdit = (treatment: any) => {
    setEditingTreatment(treatment);
    setFormData({
      name: treatment.name,
      category: treatment.category,
      isPerTooth: treatment.is_per_tooth,
      isJawSpecific: treatment.is_jaw_specific,
      feedbackIntervals: treatment.feedback_intervals || []
    });
    setShowCreateForm(true);
  };

  // Tedavi türü sil
  const handleDelete = async (treatmentId: number, treatmentName: string) => {
    if (!confirm(`"${treatmentName}" tedavi türünü silmek istediğinizden emin misiniz?`)) return;
    
    try {
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/treatment-type/${treatmentId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      
      if (data.success) {
        await fetchTreatments();
        alert('Tedavi türü silindi!');
      } else {
        alert(data.message || 'Hata oluştu!');
      }
    } catch (err) {
      alert('Sunucu hatası!');
    }
  };

  // Feedback interval toggle
  const toggleFeedbackInterval = (interval: string) => {
    const currentIntervals = formData.feedbackIntervals;
    if (currentIntervals.includes(interval)) {
      setFormData({
        ...formData,
        feedbackIntervals: currentIntervals.filter(i => i !== interval)
      });
    } else {
      setFormData({
        ...formData,
        feedbackIntervals: [...currentIntervals, interval]
      });
    }
  };

  const categoryLabels: { [key: string]: string } = {
    'Restoratif': '🔧 Restoratif',
    'Endodonti': '🦷 Endodonti', 
    'Ortodonti': '📐 Ortodonti',
    'Periodontoloji': '🩸 Periodontoloji',
    'Cerrahi': '⚕️ Cerrahi',
    'Protez': '🦾 Protez',
    'Pedodonti': '👶 Pedodonti'
  };

  const feedbackOptions = [
    { value: '1_week', label: '1 Hafta' },
    { value: '1_month', label: '1 Ay' },
    { value: '3_months', label: '3 Ay' },
    { value: '6_months', label: '6 Ay' }
  ];
  
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#1a237e", fontSize: 20 }}>🦷 Tedavi Türleri</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: "10px 20px",
            background: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          + Yeni Tedavi Türü Ekle
        </button>
      </div>

      {/* Tedavi Türleri Listesi */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
              <th style={{ padding: "12px", textAlign: "left", color: "#222", fontWeight: 700 }}>Tedavi Adı</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#222", fontWeight: 700 }}>Kategori</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#222", fontWeight: 700 }}>Diş Bazlı</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#222", fontWeight: 700 }}>Çene Bazlı</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#222", fontWeight: 700 }}>Takip Süreleri</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#222", fontWeight: 700 }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {treatments.map((treatment) => (
              <tr key={treatment.treatment_type_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "12px", fontWeight: 700, color: "#222" }}>
                  {treatment.name}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    padding: "4px 8px",
                    background: "#e8f5e8",
                    color: "#2e7d32",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {categoryLabels[treatment.category] || treatment.category}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: "#222" }}>
                  {treatment.is_per_tooth ? (
                    <span style={{ color: "#4caf50", fontSize: 16, fontWeight: 700 }}>✓</span>
                  ) : (
                    <span style={{ color: "#ccc", fontSize: 16, fontWeight: 700 }}>✗</span>
                  )}
                </td>
                <td style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: "#222" }}>
                  {treatment.is_jaw_specific ? (
                    <span style={{ color: "#4caf50", fontSize: 16, fontWeight: 700 }}>✓</span>
                  ) : (
                    <span style={{ color: "#ccc", fontSize: 16, fontWeight: 700 }}>✗</span>
                  )}
                </td>
                <td style={{ padding: "12px", color: "#222", fontWeight: 600, fontSize: 12 }}>
                  {treatment.feedback_intervals?.length > 0 
                    ? treatment.feedback_intervals.map((interval: string) => (
                        feedbackOptions.find(opt => opt.value === interval)?.label || interval
                      )).join(', ')
                    : '-'
                  }
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <button
                    onClick={() => handleEdit(treatment)}
                    style={{
                      padding: "4px 8px",
                      background: "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      marginRight: 8,
                      fontSize: 12
                    }}
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(treatment.treatment_type_id, treatment.name)}
                    style={{
                      padding: "4px 8px",
                      background: "#e53935",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {treatments.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
            Henüz tedavi türü bulunmuyor.
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
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
          <div style={{
            background: "white",
            borderRadius: 12,
            padding: 32,
            maxWidth: 600,
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ marginTop: 0, color: "#1a237e" }}>
              {editingTreatment ? '✏️ Tedavi Türü Düzenle' : '➕ Yeni Tedavi Türü Ekle'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#555" }}>
                    Tedavi Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      fontSize: 14,
                      color: "#222",
                      fontWeight: 700
                    }}
                    required
                    placeholder="Örn: Dolgu, Kanal Tedavisi, Diş Teli"
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#555" }}>
                    Kategori *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      fontSize: 14,
                      color: "#222",
                      fontWeight: 700
                    }}
                    required
                    placeholder="Örn: Restoratif, Endodonti, Ortodonti"
                  />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.isPerTooth}
                        onChange={(e) => setFormData({...formData, isPerTooth: e.target.checked})}
                        style={{ transform: "scale(1.2)" }}
                      />
                      <span style={{ fontWeight: 600, color: "#555" }}>Diş Bazlı Tedavi</span>
                    </label>
                    <p style={{ fontSize: 12, color: "#666", margin: "4px 0 0 24px" }}>
                      Her diş için ayrı fiyatlandırılır
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.isJawSpecific}
                        onChange={(e) => setFormData({...formData, isJawSpecific: e.target.checked})}
                        style={{ transform: "scale(1.2)" }}
                      />
                      <span style={{ fontWeight: 600, color: "#555" }}>Çene Bazlı Tedavi</span>
                    </label>
                    <p style={{ fontSize: 12, color: "#666", margin: "4px 0 0 24px" }}>
                      Alt/üst çene için farklı fiyat
                    </p>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#555" }}>
                    Takip Süreleri
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
                    {feedbackOptions.map((option) => (
                      <label key={option.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={formData.feedbackIntervals.includes(option.value)}
                          onChange={() => toggleFeedbackInterval(option.value)}
                        />
                        <span style={{ fontSize: 13, color: '#222', fontWeight: 700 }}>{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                    Tedavi sonrası takip yapılacak süreleri seçiniz
                  </p>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: "10px 20px",
                    background: "#757575",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    background: loading ? "#ccc" : "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Kaydediliyor...' : (editingTreatment ? 'Güncelle' : 'Oluştur')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Fiyat Listesi Yönetimi Component
function PriceListManagement() {
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    branchId: '',
    isActive: true,
    items: [] as any[]
  });

  // Fiyat listelerini getir
  const fetchPriceLists = async () => {
    try {
  const res = await fetch('https://dentalapi.karadenizdis.com/api/price-list');
      const data = await res.json();
      if (data.success) {
        setPriceLists(data.data);
      }
    } catch (err) {
      console.error('Fiyat listeleri alınamadı:', err);
    }
  };

  // Tedavi türlerini getir
  const fetchTreatmentTypes = async () => {
    try {
  const res = await fetch('https://dentalapi.karadenizdis.com/api/treatment-type');
      const data = await res.json();
      if (data.success) {
        setTreatmentTypes(data.data);
      }
    } catch (err) {
      console.error('Tedavi türleri alınamadı:', err);
    }
  };

  // Şubeleri getir
  const fetchBranches = async () => {
    try {
  const res = await fetch('https://dentalapi.karadenizdis.com/api/branch');
      const data = await res.json();
      if (data.success) {
        setBranches(data.data);
      }
    } catch (err) {
      console.error('Şubeler alınamadı:', err);
    }
  };

  useEffect(() => {
    fetchPriceLists();
    fetchTreatmentTypes();
    fetchBranches();
  }, []);

  // Form temizle
  const resetForm = () => {
    setFormData({
      name: '',
      branchId: '',
      isActive: true,
      items: []
    });
    setEditingPriceList(null);
    setShowCreateForm(false);
  };

  // Fiyat listesi kaydet (yeni veya düzenle)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingPriceList 
        ? `https://dentalapi.karadenizdis.com/api/price-list/${editingPriceList.price_list_id}`
        : 'https://dentalapi.karadenizdis.com/api/price-list';
      
      const method = editingPriceList ? 'PUT' : 'POST';
      
      // Form verilerini hazırla
      const submitData = {
        name: formData.name,
        branchId: parseInt(formData.branchId),
        isActive: formData.isActive,
        items: formData.items.map(item => ({
          treatmentTypeId: parseInt(item.treatmentTypeId),
          price: parseFloat(item.price) || 0,
          upperJawPrice: parseFloat(item.upperJawPrice) || 0,
          lowerJawPrice: parseFloat(item.lowerJawPrice) || 0
        }))
      };

      console.log('Gönderilen veri:', submitData); // Debug için
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const data = await res.json();
      
      if (data.success) {
        await fetchPriceLists();
        resetForm();
        alert(editingPriceList ? 'Fiyat listesi güncellendi!' : 'Fiyat listesi oluşturuldu!');
      } else {
        console.error('Backend hatası:', data);
        alert(data.message || 'Hata oluştu!');
      }
    } catch (err) {
      console.error('Frontend hatası:', err);
      alert('Sunucu hatası!');
    } finally {
      setLoading(false);
    }
  };

  // Düzenlemek için fiyat listesi seç
  const handleEdit = async (priceList: any) => {
    try {
      // Fiyat listesi detayını kalemleri ile birlikte getir
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/price-list/${priceList.price_list_id}`);
      const data = await res.json();
      
      if (data.success) {
        const fullPriceList = data.data;
        setEditingPriceList(fullPriceList);
        
        // Form verilerini doldur
        const formItems = fullPriceList.items?.map((item: any) => ({
          treatmentTypeId: item.treatment_type_id?.toString() || '',
          price: item.base_price?.toString() || '',
          upperJawPrice: item.upper_jaw_price?.toString() || '',
          lowerJawPrice: item.lower_jaw_price?.toString() || ''
        })) || [];
        
        setFormData({
          name: fullPriceList.name,
          branchId: fullPriceList.branch_id.toString(),
          isActive: fullPriceList.is_active,
          items: formItems
        });
        setShowCreateForm(true);
      } else {
        alert('Fiyat listesi detayı alınamadı: ' + data.message);
      }
    } catch (err) {
      console.error('Fiyat listesi detayı alınamadı:', err);
      alert('Sunucu hatası!');
    }
  };

  // Fiyat listesi aktif/deaktif et
  const togglePriceListStatus = async (priceListId: number, currentStatus: boolean, priceListName: string) => {
    const newStatus = !currentStatus;
    const statusText = newStatus ? 'aktif' : 'deaktif';
    
    if (!confirm(`"${priceListName}" fiyat listesini ${statusText} yapmak istediğinizden emin misiniz?`)) return;
    
    try {
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/price-list/${priceListId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });

      const data = await res.json();
      
      if (data.success) {
        await fetchPriceLists();
        alert(`Fiyat listesi ${statusText} yapıldı!`);
      } else {
        alert(data.message || 'Hata oluştu!');
      }
    } catch (err) {
      alert('Sunucu hatası!');
    }
  };

  // Fiyat listesi sil
  const handleDelete = async (priceListId: number, priceListName: string) => {
    if (!confirm(`"${priceListName}" fiyat listesini silmek istediğinizden emin misiniz?`)) return;
    
    try {
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/price-list/${priceListId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      
      if (data.success) {
        await fetchPriceLists();
        alert('Fiyat listesi silindi!');
      } else {
        alert(data.message || 'Hata oluştu!');
      }
    } catch (err) {
      alert('Sunucu hatası!');
    }
  };

  // Fiyat kalemi ekle
  const addPriceItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        treatmentTypeId: '',
        price: '',
        isPerTooth: false,
        upperJawPrice: '',
        lowerJawPrice: ''
      }]
    });
  };

  // Fiyat kalemi sil
  const removePriceItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // Fiyat kalemi güncelle
  const updatePriceItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#1a237e", fontSize: 20 }}>💰 Fiyat Listeleri</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: "10px 20px",
            background: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          + Yeni Fiyat Listesi Ekle
        </button>
      </div>

      {/* Fiyat Listeleri */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
              <th style={{ padding: "12px", textAlign: "left", color: "#222", fontWeight: 700 }}>Liste Adı</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#222", fontWeight: 700 }}>Şube</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#222", fontWeight: 700 }}>Durum</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#222", fontWeight: 700 }}>Kalem Sayısı</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#222", fontWeight: 700 }}>Oluşturulma</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#222", fontWeight: 700 }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {priceLists.map((priceList) => (
              <tr key={priceList.price_list_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "12px", fontWeight: 700, color: "#222" }}>
                  {priceList.name}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    padding: "4px 8px",
                    background: "#e3f2fd",
                    color: "#1565c0",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {branches.find(b => b.branch_id === priceList.branch_id)?.name || 'Bilinmiyor'}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: "#222" }}>
                  <span style={{
                    padding: "4px 8px",
                    background: priceList.is_active ? "#e8f5e8" : "#ffebee",
                    color: priceList.is_active ? "#2e7d32" : "#c62828",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {priceList.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: "#222" }}>
                  <span style={{
                    padding: "4px 8px",
                    background: "#f3e5f5",
                    color: "#7b1fa2",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {priceList.item_count || 0} kalem
                  </span>
                </td>
                <td style={{ padding: "12px", color: "#222", fontWeight: 600, fontSize: 12 }}>
                  {new Date(priceList.created_at).toLocaleDateString('tr-TR')}
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <button
                    onClick={() => togglePriceListStatus(priceList.price_list_id, priceList.is_active, priceList.name)}
                    style={{
                      padding: "4px 8px",
                      background: priceList.is_active ? "#ff9800" : "#4caf50",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      marginRight: 4,
                      fontSize: 12,
                      fontWeight: 700
                    }}
                    title={priceList.is_active ? "Deaktif Et" : "Aktif Et"}
                  >
                    {priceList.is_active ? "Deaktif Et" : "Aktif Et"}
                  </button>
                  <button
                    onClick={() => handleEdit(priceList)}
                    style={{
                      padding: "4px 8px",
                      background: "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      marginRight: 4,
                      fontSize: 12
                    }}
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(priceList.price_list_id, priceList.name)}
                    style={{
                      padding: "4px 8px",
                      background: "#e53935",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {priceLists.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
            Henüz fiyat listesi bulunmuyor.
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
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
          <div style={{
            background: "white",
            borderRadius: 12,
            padding: 32,
            maxWidth: 800,
            width: "95%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ marginTop: 0, color: "#1a237e" }}>
              {editingPriceList ? '✏️ Fiyat Listesi Düzenle' : '➕ Yeni Fiyat Listesi Ekle'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: 16 }}>
                {/* Temel Bilgiler */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#555" }}>
                      Liste Adı *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: 6,
                        fontSize: 14,
                        color: "#222",
                        fontWeight: 700
                      }}
                      required
                      placeholder="Örn: Genel Fiyat Listesi 2025"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#555" }}>
                      Şube *
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: 6,
                        fontSize: 14,
                        color: "#222",
                        fontWeight: 700
                      }}
                      required
                    >
                      <option value="">Şube Seçiniz</option>
                      {branches.map((branch) => (
                        <option key={branch.branch_id} value={branch.branch_id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 32 }}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        style={{ transform: "scale(1.2)" }}
                      />
                      <span style={{ fontWeight: 600, color: "#555" }}>Aktif</span>
                    </label>
                  </div>
                </div>

                {/* Fiyat Kalemleri */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h4 style={{ margin: 0, color: "#1a237e" }}>Fiyat Kalemleri</h4>
                    <button
                      type="button"
                      onClick={addPriceItem}
                      style={{
                        padding: "6px 12px",
                        background: "#2196f3",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      + Kalem Ekle
                    </button>
                  </div>
                  
                  {formData.items.map((item, index) => {
                    const selectedTreatment = treatmentTypes.find(t => t.treatment_type_id.toString() === item.treatmentTypeId);
                    
                    return (
                      <div key={index} style={{
                        border: "1px solid #e0e0e0",
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                        background: "#fafafa"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <h5 style={{ margin: 0, color: "#666" }}>Kalem #{index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removePriceItem(index)}
                            style={{
                              background: "#f44336",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              padding: "4px 8px",
                              cursor: "pointer",
                              fontSize: 12
                            }}
                          >
                            Sil
                          </button>
                        </div>
                        
                        <div style={{ display: "grid", gap: 12 }}>
                          <div>
                            <label style={{ display: "block", marginBottom: 4, fontWeight: 700, fontSize: 13, color: "#222" }}>
                              Tedavi Türü *
                            </label>
                            <select
                              value={item.treatmentTypeId}
                              onChange={(e) => updatePriceItem(index, 'treatmentTypeId', e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #ddd",
                                borderRadius: 4,
                                fontSize: 13,
                                color: "#222",
                                fontWeight: 700
                              }}
                              required
                            >
                              <option value="">Tedavi seçiniz</option>
                              {treatmentTypes.map((treatment) => (
                                <option key={treatment.treatment_type_id} value={treatment.treatment_type_id}>
                                  {treatment.name} ({treatment.category})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Fiyat Alanları */}
                          {selectedTreatment?.is_jaw_specific ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                              <div>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 700, fontSize: 13, color: "#222" }}>
                                  Üst Çene Fiyatı (₺) *
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.upperJawPrice}
                                  onChange={(e) => updatePriceItem(index, 'upperJawPrice', e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "1px solid #ddd",
                                    borderRadius: 4,
                                    fontSize: 13,
                                    color: "#222",
                                    fontWeight: 700
                                  }}
                                  required
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 700, fontSize: 13, color: "#222" }}>
                                  Alt Çene Fiyatı (₺) *
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.lowerJawPrice}
                                  onChange={(e) => updatePriceItem(index, 'lowerJawPrice', e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "1px solid #ddd",
                                    borderRadius: 4,
                                    fontSize: 13,
                                    color: "#222",
                                    fontWeight: 700
                                  }}
                                  required
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label style={{ display: "block", marginBottom: 4, fontWeight: 700, fontSize: 13, color: "#222" }}>
                                {selectedTreatment?.is_per_tooth ? 'Diş Başına Fiyat (₺)' : 'Fiyat (₺)'} *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.price}
                                onChange={(e) => updatePriceItem(index, 'price', e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  border: "1px solid #ddd",
                                  borderRadius: 4,
                                  fontSize: 13,
                                  color: "#222",
                                  fontWeight: 700
                                }}
                                required
                              />
                              {selectedTreatment?.is_per_tooth && (
                                <p style={{ fontSize: 11, color: "#666", margin: "4px 0 0 0" }}>
                                  Bu fiyat her diş için geçerlidir
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {formData.items.length === 0 && (
                    <div style={{ textAlign: "center", padding: 20, color: "#666", border: "2px dashed #ddd", borderRadius: 8 }}>
                      Henüz fiyat kalemi eklenmemiş. "Kalem Ekle" butonuna tıklayın.
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: "10px 20px",
                    background: "#757575",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    background: loading ? "#ccc" : "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Kaydediliyor...' : (editingPriceList ? 'Güncelle' : 'Oluştur')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Şubeler Yönetimi Component
function BranchManagement() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<{ name: string; address: string; permanent_doctor_count: number }>({ name: '', address: '', permanent_doctor_count: 3 });

  const fetchBranches = async () => {
    try {
  const res = await fetch('https://dentalapi.karadenizdis.com/api/branch');
      const data = await res.json();
      if (data.success) setBranches(data.data || []);
    } catch (e) {
      console.error('Şubeler alınamadı', e);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const reset = () => {
  setEditing(null);
  setForm({ name: '', address: '', permanent_doctor_count: 3 });
  setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('Şube adı zorunludur'); return; }
    setLoading(true);
    try {
      const url = editing ? `https://dentalapi.karadenizdis.com/api/branch/${editing.branch_id}` : 'https://dentalapi.karadenizdis.com/api/branch';
      const method = editing ? 'PUT' : 'POST';
      const bodyObj: any = {
        name: form.name.trim(),
        address: form.address || null,
        permanent_doctor_count: Number(form.permanent_doctor_count)
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'İşlem başarısız');
      await fetchBranches();
      reset();
      alert(editing ? 'Şube güncellendi' : 'Şube eklendi');
    } catch (e: any) {
      alert(e?.message || 'Sunucu hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (b: any) => {
    setEditing(b);
    setForm({
      name: b.name || '',
      address: b.address || '',
      permanent_doctor_count: typeof b.permanent_doctor_count === 'number' ? b.permanent_doctor_count : 3
    });
    setShowForm(true);
  };

  const handleDelete = async (b: any) => {
    if (!confirm(`"${b.name}" şubesini silmek istediğinize emin misiniz?`)) return;
    try {
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/branch/${b.branch_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Silme başarısız');
      await fetchBranches();
      alert('Şube silindi');
    } catch (e: any) {
      alert(e?.message || 'Sunucu hatası');
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#1a237e', fontSize: 20 }}>🏢 Şubeler</h2>
  <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', address: '', permanent_doctor_count: 3 }); }} style={{ padding: '10px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>+ Yeni Şube</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ padding: 12, textAlign: 'left', color: '#222', fontWeight: 700 }}>Ad</th>
              <th style={{ padding: 12, textAlign: 'left', color: '#222', fontWeight: 700 }}>Adres</th>
              <th style={{ padding: 12, textAlign: 'left', color: '#222', fontWeight: 700 }}>Oluşturma</th>
              <th style={{ padding: 12, textAlign: 'center', color: '#222', fontWeight: 700 }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.branch_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 12, fontWeight: 700, color: '#222' }}>{b.name}</td>
                <td style={{ padding: 12, fontWeight: 600, color: '#222' }}>{b.address || '-'}</td>
                <td style={{ padding: 12, fontWeight: 600, color: '#222', fontSize: 12 }}>{b.created_at ? new Date(b.created_at).toLocaleDateString('tr-TR') : '-'}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <button onClick={() => handleEdit(b)} style={{ padding: '6px 10px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8, fontSize: 12 }}>Düzenle</button>
                  <button onClick={() => handleDelete(b)} style={{ padding: '6px 10px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {branches.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Henüz şube bulunmuyor.</div>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 480 }}>
            <h3 style={{ marginTop: 0, color: '#1a237e' }}>{editing ? '✏️ Şube Düzenle' : '➕ Yeni Şube Ekle'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 6 }}>Şube Adı</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Örn. Merkez" style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, color: '#222', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 6 }}>Adres (opsiyonel)</label>
                  <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Adres bilgisi" style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, minHeight: 80, color: '#222', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 6 }}>Devamlı Doktor Sayısı</label>
                  <input type="number" min={1} max={20} value={form.permanent_doctor_count} onChange={e => setForm(f => ({ ...f, permanent_doctor_count: Number(e.target.value) }))} placeholder="Örn. 3" style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, color: '#222', fontWeight: 700 }} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={reset} style={{ padding: '8px 14px', background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#222', fontWeight: 700 }}>Vazgeç</button>
                <button type="submit" disabled={loading} style={{ padding: '8px 14px', background: loading ? '#9e9e9e' : '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {editing ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// Doktor Sıraları Yönetimi Component
function DoctorOrderManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ doctor_id: '', order_num: '' });
  const [error, setError] = useState('');

  // Sıraları ve doktorları getir
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://dentalapi.karadenizdis.com/api/doctor-order/doctor-order');
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (err) { setError('Sıralar alınamadı'); }
    setLoading(false);
  };
  const fetchDoctors = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('https://dentalapi.karadenizdis.com/api/user/doctors/by-branch', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) setDoctors(data.data);
    } catch {}
  };
  const fetchBranches = async () => {
    try {
      const res = await fetch('https://dentalapi.karadenizdis.com/api/branch');
      const data = await res.json();
      if (data.success) setBranches(data.data || []);
    } catch {}
  };
  useEffect(() => { fetchOrders(); fetchDoctors(); fetchBranches(); }, []);

  // Sıra ekle
  const handleAdd = async (e: any) => {
    e.preventDefault();
    setError('');
    if (!form.doctor_id || !form.order_num) { setError('Doktor ve sıra numarası zorunlu'); return; }
    try {
      const res = await fetch('https://dentalapi.karadenizdis.com/api/doctor-order/doctor-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doctor_id: form.doctor_id, order_num: Number(form.order_num) })
      });
      const data = await res.json();
      if (data.success) { setForm({ doctor_id: '', order_num: '' }); fetchOrders(); }
      else setError(data.message || 'Ekleme hatası');
    } catch { setError('Sunucu hatası'); }
  };

  // Sıra sil
  const handleDelete = async (id: any) => {
    if (!window.confirm('Bu doktor sırasını silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`https://dentalapi.karadenizdis.com/api/doctor-order/doctor-order/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchOrders();
      else setError(data.message || 'Silme hatası');
    } catch { setError('Sunucu hatası'); }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ margin: 0, color: '#1a237e', fontSize: 20 }}>📋 Doktor Sıraları</h2>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
  <select value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))} style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd', fontWeight: 700, color: '#222' }}>
          <option value=''>Doktor Seçiniz</option>
          {doctors.map((d: any) => {
            const branch = branches.find((b: any) => b.branch_id === d.branch_id);
            return (
              <option key={d.user_id} value={d.user_id}>
                {d.first_name} {d.last_name} {branch ? `- ${branch.name}` : ''}
              </option>
            );
          })}
        </select>
  <input type='number' min={1} value={form.order_num} onChange={e => setForm(f => ({ ...f, order_num: e.target.value }))} placeholder='Sıra No' style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd', width: 100, fontWeight: 700, color: '#222' }} />
        <button type='submit' style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700 }}>Ekle</button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
            <th style={{ padding: 12, textAlign: 'left', color: '#222', fontWeight: 700 }}>Doktor</th>
            <th style={{ padding: 12, textAlign: 'left', color: '#222', fontWeight: 700 }}>Şube</th>
            <th style={{ padding: 12, textAlign: 'left', color: '#222', fontWeight: 700 }}>Sıra No</th>
            <th style={{ padding: 12, textAlign: 'center', color: '#222', fontWeight: 700 }}>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o: any) => {
            const doctor = doctors.find((d: any) => String(d.user_id) === String(o.doctor_id));
            const branch = doctor ? branches.find((b: any) => b.branch_id === doctor.branch_id) : null;
            return (
              <tr key={o.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 12, fontWeight: 700, color: '#222' }}>{doctor ? `${doctor.first_name} ${doctor.last_name}` : ''}</td>
                <td style={{ padding: 12, fontWeight: 600, color: '#222' }}>{branch ? branch.name : '-'}</td>
                <td style={{ padding: 12, fontWeight: 700, color: '#222' }}>{o.order_num}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <button onClick={() => handleDelete(o.id)} style={{ padding: '4px 8px', background: '#e53935', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Sil</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {orders.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Henüz doktor sırası eklenmemiş.</div>}
    </div>
  );
}
