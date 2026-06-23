import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import Transaksi from './Transaksi'; 
import Produk from './Produk'; // <--- Sudah disesuaikan dengan nama file aslimu
import Login from './Login'; 

export default function App() {
  // Mengecek memori HP/Laptop apakah sebelumnya sudah pernah login
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isYagezLoggedIn') === 'true'
  );

  // Jika BELUM login, cegat dan hanya tampilkan halaman Login!
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  // Jika SUDAH login, tampilkan isi aplikasi seperti biasa
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transaksi" element={<Transaksi />} />
        <Route path="/produk" element={<Produk />} /> 
      </Routes>
    </BrowserRouter>
  );
}