import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './Dashboard' // <-- Mengaktifkan file Dashboard baru
import Kasir from './Kasir'
import Produk from './Produk'

// --- KOMPONEN SIDEBAR ---
function Sidebar() {
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const sidebarBg = theme === 'dark' ? '#0f172a' : '#f8fafc';
  const sidebarBorder = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const textMenuOff = theme === 'dark' ? 'text-secondary' : 'text-secondary';

  return (
    <div className="d-flex flex-column p-3 flex-shrink-0" style={{ width: '260px', minHeight: '100vh', backgroundColor: sidebarBg, borderRight: `1px solid ${sidebarBorder}`, transition: 'all 0.3s ease' }}>
        
        <div className="text-center my-4">
            <div className="mb-2 fs-3">🎮 <strong className="text-info">YAGEZ</strong>STORE</div>
            <h6 className="fw-bold m-0 text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>Kasir Top-Up Pro</h6>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>React Web Version</small>
        </div>
        
        <hr className="my-3 opacity-25" />

        <div className="mb-auto d-flex flex-column gap-2">
             <small className="text-muted fw-bold d-block mb-1 ps-2 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Menu Utama</small>
             
             <Link to="/" className={`btn text-start fw-bold px-3 py-2 ${location.pathname === '/' ? 'btn-info text-white' : `btn-transparent ${textMenuOff}`}`}>
                📊 Dashboard Laporan
             </Link>
             
             <Link to="/kasir" className={`btn text-start fw-bold px-3 py-2 ${location.pathname === '/kasir' ? 'btn-info text-white' : `btn-transparent ${textMenuOff}`}`}>
                💻 Layar Kasir
             </Link>

             <Link to="/produk" className={`btn text-start fw-bold px-3 py-2 ${location.pathname === '/produk' ? 'btn-info text-white' : `btn-transparent ${textMenuOff}`}`}>
                📦 Kelola Produk
             </Link>
        </div>

        <div className="mt-auto pt-3 border-top border-secondary border-opacity-10">
            <button onClick={toggleTheme} className={`btn w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2 ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'}`} style={{ transition: 'all 0.2s ease' }}>
                {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
        </div>
    </div>
  );
}

// --- KOMPONEN UTAMA ---
export default function App() {
  return (
    <Router>
        <div className="d-flex flex-nowrap" style={{ minHeight: '100vh' }}>
            <Sidebar />
            
            <div className="flex-grow-1 p-3 p-lg-4 overflow-auto" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
                <div className="container-fluid p-0">
                    <Routes>
                        {/* Rute Utama mengarah ke Dashboard Komponen */}
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/kasir" element={<Kasir />} />
                        <Route path="/produk" element={<Produk />} />
                    </Routes>
                </div>
            </div>
        </div>
    </Router>
  )
}