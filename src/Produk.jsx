import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Sidebar from './Sidebar';

export default function Produk() {
  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    kategori: '',
    kode_barang: '',
    nama_barang: '', 
    modal: '',       
    harga_jual: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('kategori', { ascending: true })
      .order('kode_barang', { ascending: true });
    
    if (data) setProducts(data);
    if (error) console.error("Error ambil produk:", error);
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSimpan = async () => {
    if (!form.kategori || !form.kode_barang || !form.nama_barang || !form.modal || !form.harga_jual) {
      alert("⚠️ Harap isi semua kolom produk!");
      return;
    }

    const payload = {
      kategori: form.kategori.toUpperCase(),
      kode_barang: form.kode_barang.toUpperCase(),
      nama_barang: form.nama_barang, 
      modal: Number(form.modal),     
      harga_jual: Number(form.harga_jual)
    };

    if (editId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editId);
      if (error) alert("❌ Gagal memperbarui produk!");
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (error) alert("❌ Gagal menambah produk baru!");
    }

    setForm({ kategori: '', kode_barang: '', nama_barang: '', modal: '', harga_jual: '' });
    setEditId(null);
    fetchProducts();
  };

  // === FITUR AUTO-SCROLL DITAMBAHKAN DI SINI ===
  const handleEdit = (prod) => {
    setForm({
      kategori: prod.kategori || '',
      kode_barang: prod.kode_barang,
      nama_barang: prod.nama_barang, 
      modal: prod.modal,             
      harga_jual: prod.harga_jual
    });
    setEditId(prod.id);

    // Memerintahkan layar untuk scroll mulus ke elemen dengan ID 'area-form'
    const formElement = document.getElementById('area-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleHapus = async (id) => {
    const konfirmasi = window.confirm("⚠️ Yakin ingin menghapus produk ini?");
    if (konfirmasi) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) alert("❌ Gagal menghapus produk!");
      else fetchProducts();
    }
  };

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const groupedProducts = products.reduce((acc, curr) => {
    const cat = curr.kategori || 'TANPA KATEGORI';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-[#161925] text-white font-sans overflow-hidden">
      {/* SIDEBAR */}
      <Sidebar active="produk" />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 overflow-y-auto relative scroll-smooth">
        
        {/* FORM KELOLA PRODUK (Diberi ID 'area-form' sebagai target scroll) */}
        <div 
          id="area-form" 
          className={`border rounded-xl mb-6 shadow-sm transition-all duration-500 ${editId ? 'bg-[#2a2119] border-yellow-600 shadow-yellow-900/20' : 'bg-[#1e2230] border-[#2d3345]'}`}
        >
          <div className={`px-6 py-4 border-b ${editId ? 'border-yellow-600' : 'border-[#2d3345]'}`}>
            <h3 className={`font-bold text-lg flex items-center gap-2 ${editId ? 'text-yellow-500' : 'text-white'}`}>
              {editId ? '✏️ Ubah Data Produk' : '📦 Tambah Produk Baru'}
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-5 gap-4 items-end mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Kategori</label>
                <input type="text" name="kategori" value={form.kategori} onChange={handleInputChange} placeholder="Cth: FREE FIRE" className="w-full bg-[#161925] border border-[#2d3345] p-3 rounded outline-none focus:border-[#0dcaf0] uppercase transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Kode Produk</label>
                <input type="text" name="kode_barang" value={form.kode_barang} onChange={handleInputChange} placeholder="Cth: FF70" className="w-full bg-[#161925] border border-[#2d3345] p-3 rounded outline-none focus:border-[#0dcaf0] transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Nama Produk</label>
                <input type="text" name="nama_barang" value={form.nama_barang} onChange={handleInputChange} placeholder="Cth: DM FREE FIRE 70" className="w-full bg-[#161925] border border-[#2d3345] p-3 rounded outline-none focus:border-[#0dcaf0] transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Modal (Rp)</label>
                <input type="number" name="modal" value={form.modal} onChange={handleInputChange} placeholder="0" className="w-full bg-[#161925] border border-[#2d3345] p-3 rounded outline-none focus:border-[#0dcaf0] transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Jual (Rp)</label>
                <input type="number" name="harga_jual" value={form.harga_jual} onChange={handleInputChange} placeholder="0" className="w-full bg-[#161925] border border-[#2d3345] p-3 rounded outline-none focus:border-[#0dcaf0] transition" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSimpan} className={`flex-1 font-bold p-3 rounded transition ${editId ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-[#0dcaf0] hover:bg-cyan-400 text-[#161925]'}`}>
                {editId ? '💾 Simpan Perubahan Produk' : '➕ Tambahkan ke Daftar Jualan'}
              </button>
              {editId && (
                <button onClick={() => { setEditId(null); setForm({ kategori: '', kode_barang: '', nama_barang: '', modal: '', harga_jual: '' }); }} className="bg-gray-600 hover:bg-gray-500 text-white p-3 rounded px-6 font-bold transition">Batal</button>
              )}
            </div>
          </div>
        </div>

        {/* TABEL DAFTAR PRODUK */}
        <div className="bg-[#1e2230] border border-[#2d3345] rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-white text-sm bg-[#161925] border-b border-[#2d3345]">
              <tr>
                <th className="px-6 py-4 font-bold">Kode</th>
                <th className="px-6 py-4 font-bold">Nama Produk</th>
                <th className="px-6 py-4 font-bold">Modal</th>
                <th className="px-6 py-4 font-bold">Jual</th>
                <th className="px-6 py-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedProducts).map(([kategori, items]) => (
                <React.Fragment key={kategori}>
                  <tr className="bg-[#323b4e] border-b border-[#2d3345]">
                    <td colSpan="5" className="px-6 py-3 font-extrabold text-[#0dcaf0] uppercase tracking-wide">
                      📌 KATEGORI: {kategori}
                    </td>
                  </tr>
                  
                  {items.map((prod) => (
                    <tr key={prod.id} className="border-b border-[#2d3345] hover:bg-[#1a1e2b] transition">
                      <td className="px-6 py-4 font-bold text-white">{prod.kode_barang}</td>
                      <td className="px-6 py-4 text-gray-300 uppercase">{prod.nama_barang}</td>
                      <td className="px-6 py-4 text-gray-200">{formatRp(prod.modal)}</td>
                      <td className="px-6 py-4 text-gray-200">{formatRp(prod.harga_jual)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleEdit(prod)} className="bg-[#ffc107] hover:bg-yellow-500 text-black font-bold text-xs px-4 py-2 rounded transition">Ubah</button>
                          <button onClick={() => handleHapus(prod.id)} className="bg-[#dc3545] hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded transition">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Belum ada produk yang ditambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}