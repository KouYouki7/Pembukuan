import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Sidebar from './Sidebar';

export default function Transaksi() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]); 
  const [editId, setEditId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kode_barang: '',
    target_id: '',
    modal_saat_transaksi: '',
    harga_jual_saat_transaksi: ''
  });

  useEffect(() => { fetchTransactions(); fetchProducts(); }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (data) setTransactions(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('nama_barang', { ascending: true });
    if (data) setProducts(data);
  };

  const handleInputChange = (e) => { 
    setForm({ ...form, [e.target.name]: e.target.value }); 
  };

  const handleSelectProduct = (prod) => {
    setForm({
      ...form,
      kode_barang: prod.kode_barang,
      modal_saat_transaksi: prod.modal,
      harga_jual_saat_transaksi: prod.harga_jual
    });
    setSearchTerm(`${prod.nama_barang} (${prod.kode_barang})`);
    setShowDropdown(false);
  };

  const handleSimpan = async () => {
    if (!form.kode_barang || !form.target_id || !form.modal_saat_transaksi || !form.harga_jual_saat_transaksi) {
      alert("⚠️ Harap isi semua kolom atau pilih produk dari daftar dengan benar!");
      return;
    }
    const jamSekarang = new Date().toTimeString().slice(0, 8);
    const timestamp = new Date(`${form.tanggal}T${jamSekarang}`).toISOString();
    const payload = {
      kode_barang: form.kode_barang,
      target_id: form.target_id,
      modal_saat_transaksi: Number(form.modal_saat_transaksi),
      harga_jual_saat_transaksi: Number(form.harga_jual_saat_transaksi),
    };
    
    if (editId) {
      await supabase.from('transactions').update(payload).eq('id', editId);
    } else {
      payload.created_at = timestamp;
      await supabase.from('transactions').insert([payload]);
    }
    
    setForm({ ...form, kode_barang: '', target_id: '', modal_saat_transaksi: '', harga_jual_saat_transaksi: '' });
    setSearchTerm('');
    setEditId(null);
    fetchTransactions();
  };

  const handleEdit = (trx) => {
    const tgl = new Date(trx.created_at).toISOString().split('T')[0];
    const prod = products.find(p => p.kode_barang === trx.kode_barang);
    setSearchTerm(prod ? `${prod.nama_barang} (${prod.kode_barang})` : trx.kode_barang);

    setForm({ 
      tanggal: tgl, 
      kode_barang: trx.kode_barang, 
      target_id: trx.target_id, 
      modal_saat_transaksi: trx.modal_saat_transaksi, 
      harga_jual_saat_transaksi: trx.harga_jual_saat_transaksi 
    });
    setEditId(trx.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHapus = async (id) => {
    if (window.confirm("⚠️ Yakin ingin menghapus transaksi ini?")) {
      await supabase.from('transactions').delete().eq('id', id);
      fetchTransactions();
    }
  };

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  const formatTanggal = (dateStr) => {
    const date = new Date(dateStr);
    return { 
      baris1: `${date.toLocaleDateString('id-ID', { weekday: 'long' })}, ${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 
      baris2: `${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` 
    };
  };

  const filteredProducts = products.filter(p => 
    p.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.kode_barang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <Sidebar active="transaksi" />

      <div className="flex-1 p-5 md:p-8 overflow-y-auto relative pt-20 md:pt-8 w-full">
        
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Menu Transaksi</h2>
          <p className="text-gray-400 text-sm md:text-base">Catat penjualan produk top-up dan layanan digital di sini.</p>
        </div>

        <div className={`border-2 rounded-xl mb-8 shadow-sm transition-all duration-300 ${editId ? 'bg-[#111] border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : 'bg-[#111] border-blue-900'}`}>
          <div className={`px-5 py-4 border-b-2 ${editId ? 'border-yellow-400' : 'border-blue-900'}`}>
            <h3 className={`font-bold text-lg flex items-center gap-2 ${editId ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 'text-cyan-400'}`}>
              {editId ? '✏️ Sedang Mengubah Data Transaksi...' : '📄 Catat Transaksi Baru'}
            </h3>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-5 items-start">
              <div>
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Tanggal</label>
                <input type="date" name="tanggal" value={form.tanggal} onChange={handleInputChange} disabled={editId !== null} className="w-full bg-black border border-blue-600 text-white p-3 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition disabled:opacity-50" />
              </div>
              
              <div className="relative">
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Pilih Produk</label>
                <input 
                  type="text" placeholder="🔍 Ketik nama / kode..." value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                  className="w-full bg-black border border-blue-600 text-white p-3 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition"
                />
                {showDropdown && (
                  <ul className="absolute z-50 w-full bg-black border-2 border-blue-600 mt-1 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)] max-h-60 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(prod => (
                        <li key={prod.id} onClick={() => handleSelectProduct(prod)} className="p-3 border-b border-blue-900 hover:bg-blue-900 cursor-pointer transition">
                          <div className="font-bold text-white text-sm">{prod.nama_barang}</div>
                          <div className="text-[10px] text-yellow-400 font-mono mt-0.5">{prod.kode_barang}</div>
                        </li>
                      ))
                    ) : (<li className="p-3 text-sm text-gray-500 text-center">Tidak ditemukan...</li>)}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Target ID / Akun</label>
                <input type="text" name="target_id" value={form.target_id} onChange={handleInputChange} placeholder="Contoh: 12345678 (2321)" className="w-full bg-black border border-blue-600 text-white p-3 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition" />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Uang Modal (Rp)</label>
                <input type="number" name="modal_saat_transaksi" value={form.modal_saat_transaksi} onChange={handleInputChange} placeholder="0" className="w-full bg-black border border-blue-600 text-gray-300 p-3 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="w-full md:w-1/4">
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Harga Jual (Rp)</label>
                <input type="number" name="harga_jual_saat_transaksi" value={form.harga_jual_saat_transaksi} onChange={handleInputChange} placeholder="0" className="w-full bg-black border border-blue-600 text-white font-bold p-3 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition" />
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 w-full md:flex-1">
                <button onClick={handleSimpan} className={`w-full md:flex-1 font-bold text-base md:text-lg p-3 rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${editId ? 'bg-yellow-400 hover:bg-yellow-500 text-black shadow-[0_0_10px_#facc15]' : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_10px_#22d3ee]'}`}>
                  {editId ? '💾 Simpan Perubahan' : '💾 Simpan Transaksi'}
                </button>
                {editId && (
                  <button onClick={() => { setEditId(null); setForm({...form, kode_barang: '', target_id: '', modal_saat_transaksi: '', harga_jual_saat_transaksi: ''}); setSearchTerm(''); }} className="w-full md:w-auto bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-base md:text-lg p-3 rounded-lg transition px-6 active:scale-95">
                    Batal
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">🗂️ Riwayat Transaksi Terakhir</h3>
        <div className="bg-[#111] border border-blue-900 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
              <thead className="text-gray-400 bg-[#0a0a0a] border-b-2 border-blue-900">
                <tr>
                  <th className="px-4 py-4 font-bold w-10 text-center">#</th>
                  <th className="px-4 py-4 font-bold">Hari, Tanggal</th>
                  <th className="px-4 py-4 font-bold">Target ID</th>
                  <th className="px-4 py-4 font-bold">Produk</th>
                  <th className="px-4 py-4 font-bold">Modal</th>
                  <th className="px-4 py-4 font-bold">Jual</th>
                  <th className="px-4 py-4 font-bold">Keuntungan</th>
                  <th className="px-4 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr><td colSpan="8" className="text-center p-6 text-gray-500">Belum ada transaksi tersimpan.</td></tr>
                )}
                {transactions.map((trx, index) => {
                  const waktu = formatTanggal(trx.created_at); 
                  const keuntungan = Number(trx.harga_jual_saat_transaksi) - Number(trx.modal_saat_transaksi);
                  return (
                    <tr key={trx.id || index} className="border-b border-blue-900/40 hover:bg-blue-900/20 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-500 text-center">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white text-xs md:text-sm">{waktu.baris1}</div>
                        <div className="text-[10px] md:text-[11px] text-gray-400 mt-0.5">{waktu.baris2}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-white">{trx.target_id}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-900/50 border border-blue-600 text-[9px] md:text-[10px] px-2 py-1 rounded text-cyan-400 font-bold font-mono inline-block">
                          {trx.kode_barang}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{formatRp(trx.modal_saat_transaksi)}</td>
                      <td className="px-4 py-3 font-bold text-white">{formatRp(trx.harga_jual_saat_transaksi)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">+ {formatRp(keuntungan)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleEdit(trx)} className="bg-transparent border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-bold text-[10px] md:text-xs px-3 py-1.5 rounded transition">Ubah</button>
                          <button onClick={() => handleHapus(trx.id)} className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-[10px] md:text-xs px-3 py-1.5 rounded transition">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}