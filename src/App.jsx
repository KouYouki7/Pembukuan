import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Kasir from './Kasir';
import Produk from './Produk';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/kasir" element={<Kasir />} />
        <Route path="/produk" element={<Produk />} />
      </Routes>
    </Router>
  );
}