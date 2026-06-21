import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Sidebar from './Sidebar';

export default function Kasir() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]); 
  const [editId, setEditId] = useState(null);
  
  // STATE UNTUK DROPDOWN PENCARIAN
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

  const handleInputChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); };

  // FUNGSI KETIKA PRODUK DIKLIK DARI HASIL PENCARIAN
  const handleSelectProduct = (prod) => {
    setForm({
      ...form,
      kode_barang: prod.kode_barang,
      modal_saat_transaksi: prod.modal,
      harga_jual_saat_transaksi: prod.harga_jual
    });
    setSearchTerm(`${prod.nama_barang} (${prod.kode_barang})`); // Isi teks ke input
    setShowDropdown(false); // Tutup dropdown
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
    
    // Reset Form
    setForm({ ...form, kode_barang: '', target_id: '', modal_saat_transaksi: '', harga_jual_saat_transaksi: '' });
    setSearchTerm(''); // Kosongkan input pencarian produk
    setEditId(null);
    fetchTransactions();
  };

  const handleEdit = (trx) => {
    const tgl = new Date(trx.created_at).toISOString().split('T')[0];
    
    // Cari nama produk untuk ditampilkan di input pencarian
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
    return { baris1: `${date.toLocaleDateString('id-ID', { weekday: 'long' })}, ${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, baris2: `${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` };
  };

  // Filter produk berdasarkan yang diketik user
  const filteredProducts = products.filter(p => 
    p.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.kode_barang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#161925] text-white font-sans overflow-hidden">
      <Sidebar active="kasir" />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 overflow-y-auto relative">
        <div className={`border rounded-xl mb-6 shadow-sm transition-colors duration-300 ${editId ? 'bg-[#2a2119] border-yellow-600' : 'bg-[#1e2230] border-[#2d3345]'}`}>
          <div className={`px-6 py-4 border-b ${editId ? 'border-yellow-600' : 'border-[#2d3345]'}`}>
            <h3 className={`font-bold text-lg flex items-center gap-2 ${editId ? 'text-yellow-500' : 'text-white'}`}>
              {editId ? '✏️ Ubah Data Transaksi' : '📄 Catat Transaksi Baru'}
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Tanggal</label>
                <input type="date" name="tanggal" value={form.tanggal} onChange={handleInputChange} disabled={editId !== null} className="w-full bg-[#161925] border border-[#2d3345] text-white p-3 rounded outline-none focus:border-[#0dcaf0] transition disabled:opacity-50" />
              </div>
              
              {/* KOLOM PILIH PRODUK (SEARCHABLE DROPDOWN) */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Pilih Produk</label>
                <input 
                  type="text" 
                  placeholder="🔍 Ketik nama / kode..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  // Delay agar event onClick di daftar menu sempat dieksekusi sebelum hilang
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                  className="w-full bg-[#161925] border border-[#2d3345] text-white p-3 rounded outline-none focus:border-[#0dcaf0] transition"
                />
                
                {/* MENU DAFTAR PRODUK (Tampil saat diklik/diketik) */}
                {showDropdown && (
                  <ul className="absolute z-50 w-full bg-[#161925] border border-[#2d3345] mt-1 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(prod => (
                        <li 
                          key={prod.id} 
                          onClick={() => handleSelectProduct(prod)}
                          className="p-3 border-b border-[#2d3345] hover:bg-[#2d3345] cursor-pointer transition"
                        >
                          <div className="font-bold text-white text-sm">{prod.nama_barang}</div>
                          <div className="text-[10px] text-[#0dcaf0] font-mono mt-0.5">{prod.kode_barang}</div>
                        </li>
                      ))
                    ) : (
                      <li className="p-3 text-sm text-gray-500 text-center">Tidak ditemukan...</li>
                    )}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Target ID / Akun</label>
                <input type="text" name="target_id" value={form.target_id} onChange={handleInputChange} placeholder="Contoh: 12345678" className="w-full bg-[#161925] border border-[#2d3345] text-white p-3 rounded outline-none focus:border-[#0dcaf0] transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Uang Modal (Rp)</label>
                <input type="number" name="modal_saat_transaksi" value={form.modal_saat_transaksi} onChange={handleInputChange} placeholder="0" className="w-full bg-[#161925] border border-[#2d3345] text-gray-400 p-3 rounded outline-none focus:border-[#0dcaf0] transition" />
              </div>
            </div>

            <div className="flex items-end gap-4">
              <div className="w-[23%]">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Harga Jual (Rp)</label>
                <input type="number" name="harga_jual_saat_transaksi" value={form.harga_jual_saat_transaksi} onChange={handleInputChange} placeholder="0" className="w-full bg-[#161925] border border-[#2d3345] text-white font-bold p-3 rounded outline-none focus:border-[#0dcaf0] transition" />
              </div>
              <button onClick={handleSimpan} className={`flex-1 font-bold text-lg p-3 rounded transition flex items-center justify-center gap-2 ${editId ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-[#0dcaf0] hover:bg-cyan-400 text-[#161925]'}`}>{editId ? '💾 Simpan Perubahan' : '💾 Simpan ke Buku Kasir'}</button>
              {editId && <button onClick={() => { setEditId(null); setForm({...form, kode_barang: '', target_id: '', modal_saat_transaksi: '', harga_jual_saat_transaksi: ''}); setSearchTerm(''); }} className="bg-gray-600 hover:bg-gray-500 text-white font-bold text-lg p-3 rounded px-6 transition">Batal</button>}
            </div>
          </div>
        </div>

        {/* TABEL RIWAYAT TRANSAKSI */}
        <div className="bg-[#1e2230] border border-[#2d3345] rounded-xl shadow-sm">
          <div className="overflow-x-auto pb-20">
            <table className="w-full text-sm text-left">
              <thead className="text-white text-xs bg-[#161925] border-b border-[#2d3345]"><tr><th className="px-6 py-4 font-bold w-12">#</th><th className="px-6 py-4 font-bold">Hari, Tanggal</th><th className="px-6 py-4 font-bold">Target ID</th><th className="px-6 py-4 font-bold">Produk</th><th className="px-6 py-4 font-bold">Modal</th><th className="px-6 py-4 font-bold">Jual</th><th className="px-6 py-4 font-bold">Keuntungan</th><th className="px-6 py-4 font-bold text-center">Aksi</th></tr></thead>
              <tbody>
                {transactions.map((trx, index) => {
                  const waktu = formatTanggal(trx.created_at); const keuntungan = Number(trx.harga_jual_saat_transaksi) - Number(trx.modal_saat_transaksi);
                  return (
                    <tr key={trx.id || index} className="border-b border-[#2d3345] hover:bg-[#1a1e2b] transition">
                      <td className="px-6 py-4 font-bold text-gray-400">{index + 1}</td>
                      <td className="px-6 py-4"><div className="font-bold text-white">{waktu.baris1}</div><div className="text-[11px] text-gray-400">{waktu.baris2}</div></td>
                      <td className="px-6 py-4 font-bold text-white">{trx.target_id}</td>
                      <td className="px-6 py-4"><span className="bg-slate-700 text-[10px] px-2 py-0.5 rounded text-[#0dcaf0] font-bold font-mono inline-block">{trx.kode_barang}</span></td>
                      <td className="px-6 py-4 text-gray-300">{formatRp(trx.modal_saat_transaksi)}</td>
                      <td className="px-6 py-4 font-bold text-white">{formatRp(trx.harga_jual_saat_transaksi)}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">+ {formatRp(keuntungan)}</td>
                      <td className="px-6 py-4"><div className="flex gap-2 justify-center"><button onClick={() => handleEdit(trx)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs px-3 py-1.5 rounded transition">Ubah</button><button onClick={() => handleHapus(trx.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded transition">Hapus</button></div></td>
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