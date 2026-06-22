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

  // === FITUR AUTO-SCROLL ===
  const handleEdit = (prod) => {
    setForm({
      kategori: prod.kategori || '',
      kode_barang: prod.kode_barang,
      nama_barang: prod.nama_barang, 
      modal: prod.modal,             
      harga_jual: prod.harga_jual
    });
    setEditId(prod.id);

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
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <Sidebar active="produk" />

      <div className="flex-1 p-5 md:p-8 overflow-y-auto relative scroll-smooth pt-20 md:pt-8 w-full">
        
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Kelola Produk</h2>
          <p className="text-gray-400 text-sm md:text-base">Daftar harga modal dan harga jual produk tokomu.</p>
        </div>

        <div 
          id="area-form" 
          className={`border-2 rounded-xl mb-8 shadow-sm transition-all duration-500 ${editId ? 'bg-[#111] border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : 'bg-[#111] border-blue-900'}`}
        >
          <div className={`px-5 py-4 border-b-2 ${editId ? 'border-yellow-400' : 'border-blue-900'}`}>
            <h3 className={`font-bold text-lg flex items-center gap-2 ${editId ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 'text-cyan-400'}`}>
              {editId ? '✏️ Ubah Data Produk' : '📦 Tambah Produk Baru'}
            </h3>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Kategori</label>
                <select 
                  name="kategori" 
                  value={form.kategori} 
                  onChange={handleInputChange} 
                  className="w-full bg-black border border-blue-600 text-white p-3 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] uppercase transition cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Kategori --</option>
                  <option value="MOBILE LEGENDS">Mobile Legends</option>
                  <option value="FREE FIRE">Free Fire</option>
                  <option value="PUBG MOBILE">PUBG Mobile</option>
                  <option value="VALORANT">Valorant</option>
                  <option value="GENSHIN IMPACT">Genshin Impact</option>
                  <option value="AKUN PREMIUM">Akun Premium (Netflix, dll)</option>
                  <option value="PULSA & DATA">Pulsa & Data</option>
                  <option value="LAINNYA">Lainnya...</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Kode Produk</label>
                <input type="text" name="kode_barang" value={form.kode_barang} onChange={handleInputChange} placeholder="Cth: FF70" className="w-full bg-black border border-blue-600 text-white p-3 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] uppercase transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Nama Produk</label>
                <input type="text" name="nama_barang" value={form.nama_barang} onChange={handleInputChange} placeholder="Cth: DM FREE FIRE 70" className="w-full bg-black border border-blue-600 text-white p-3 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Modal (Rp)</label>
                <input type="number" name="modal" value={form.modal} onChange={handleInputChange} placeholder="0" className="w-full bg-black border border-blue-600 text-gray-300 p-3 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Jual (Rp)</label>
                <input type="number" name="harga_jual" value={form.harga_jual} onChange={handleInputChange} placeholder="0" className="w-full bg-black border border-blue-600 text-white font-bold p-3 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition" />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 w-full">
              <button onClick={handleSimpan} className={`w-full md:flex-1 font-bold text-base md:text-lg p-3 rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${editId ? 'bg-yellow-400 hover:bg-yellow-500 text-black shadow-[0_0_10px_#facc15]' : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_10px_#22d3ee]'}`}>
                {editId ? '💾 Simpan Perubahan Produk' : '➕ Tambahkan ke Daftar Jualan'}
              </button>
              {editId && (
                <button onClick={() => { setEditId(null); setForm({ kategori: '', kode_barang: '', nama_barang: '', modal: '', harga_jual: '' }); }} className="w-full md:w-auto bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-base md:text-lg p-3 rounded-lg transition px-8 active:scale-95">
                  Batal
                </button>
              )}
            </div>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">📋 Daftar Produk Aktif</h3>
        <div className="bg-[#111] border border-blue-900 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
              <thead className="text-gray-400 bg-[#0a0a0a] border-b-2 border-blue-900">
                <tr>
                  <th className="px-4 py-4 font-bold">Kode</th>
                  <th className="px-4 py-4 font-bold">Nama Produk</th>
                  <th className="px-4 py-4 font-bold">Modal</th>
                  <th className="px-4 py-4 font-bold">Jual</th>
                  <th className="px-4 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedProducts).map(([kategori, items]) => (
                  <React.Fragment key={kategori}>
                    <tr className="bg-blue-900/30 border-b-2 border-blue-900">
                      <td colSpan="5" className="px-4 py-3 font-extrabold text-cyan-400 uppercase tracking-wide">
                        📌 KATEGORI: {kategori}
                      </td>
                    </tr>
                    
                    {items.map((prod) => (
                      <tr key={prod.id} className="border-b border-blue-900/40 hover:bg-blue-900/20 transition-colors">
                        <td className="px-4 py-3 font-bold text-yellow-400 font-mono">{prod.kode_barang}</td>
                        <td className="px-4 py-3 text-white font-bold uppercase">{prod.nama_barang}</td>
                        <td className="px-4 py-3 text-gray-400">{formatRp(prod.modal)}</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">{formatRp(prod.harga_jual)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => handleEdit(prod)} className="bg-transparent border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-bold text-[10px] md:text-xs px-3 py-1.5 rounded transition">
                              Ubah
                            </button>
                            <button onClick={() => handleHapus(prod.id)} className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-[10px] md:text-xs px-3 py-1.5 rounded transition">
                              Hapus
                            </button>
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
    </div>
  );
}