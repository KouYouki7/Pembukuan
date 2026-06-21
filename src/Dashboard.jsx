import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Sidebar from './Sidebar';

export default function Dashboard() {
  const [allTrx, setAllTrx] = useState([]);
  const [prodMap, setProdMap] = useState({}); 

  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7)); 
  const [sortPelanggan, setSortPelanggan] = useState('terbanyak');
  const [searchTarget, setSearchTarget] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [stats, setStats] = useState({ hari: 0, minggu: 0, bulan: 0, total: 0 });
  const [kategori, setKategori] = useState([]);
  const [pelanggan, setPelanggan] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: txData } = await supabase.from('transactions').select('*');
      const { data: prData } = await supabase.from('products').select('*');

      if (txData) setAllTrx(txData);
      
      if (prData) {
        const map = {};
        prData.forEach(p => { map[p.kode_barang] = p.kategori || 'Lainnya'; });
        setProdMap(map);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (allTrx.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    
    let uHari = 0, uMinggu = 0, uBulan = 0;
    
    allTrx.forEach(trx => {
      const tgl = trx.created_at.split('T')[0];
      const bln = trx.created_at.slice(0, 7);
      const laba = Number(trx.harga_jual_saat_transaksi) - Number(trx.modal_saat_transaksi);

      if (tgl === todayStr) uHari += laba;
      if (bln === currentMonthStr) uBulan += laba; 
    });

    setStats({ hari: uHari, minggu: uHari * 3, bulan: uBulan, total: allTrx.length }); 

    const filteredTrx = allTrx.filter(trx => trx.created_at.startsWith(filterBulan));

    const catMap = {};
    filteredTrx.forEach(trx => {
      const cat = prodMap[trx.kode_barang] || 'Lainnya';
      if (!catMap[cat]) catMap[cat] = { order: 0, laba: 0 };
      catMap[cat].order += 1;
      catMap[cat].laba += (Number(trx.harga_jual_saat_transaksi) - Number(trx.modal_saat_transaksi));
    });
    setKategori(Object.entries(catMap).sort((a, b) => b[1].laba - a[1].laba));

    const userMap = {};
    filteredTrx.forEach(trx => {
      const tid = trx.target_id;
      if (!userMap[tid]) userMap[tid] = { order: 0, belanja: 0, laba: 0 };
      userMap[tid].order += 1;
      userMap[tid].belanja += Number(trx.harga_jual_saat_transaksi);
      userMap[tid].laba += (Number(trx.harga_jual_saat_transaksi) - Number(trx.modal_saat_transaksi));
    });

    let userArr = Object.entries(userMap);

    if (appliedSearch) {
      userArr = userArr.filter(([id]) => id.toLowerCase().includes(appliedSearch.toLowerCase()));
    }

    if (sortPelanggan === 'terbanyak') userArr.sort((a, b) => b[1].order - a[1].order);
    else if (sortPelanggan === 'terdikit') userArr.sort((a, b) => a[1].order - b[1].order);
    else if (sortPelanggan === 'sultan') userArr.sort((a, b) => b[1].belanja - a[1].belanja);

    setPelanggan(userArr); 
  }, [allTrx, prodMap, filterBulan, appliedSearch, sortPelanggan]);

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  
  const formatBulanTeks = (yyyymm) => {
    if (!yyyymm) return '';
    const [y, m] = yyyymm.split('-');
    const date = new Date(y, m - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }); 
  };

  const getIconKategori = (nama) => {
    const n = nama.toLowerCase();
    if (n.includes('mobile legend')) return '⚔️';
    if (n.includes('free fire')) return '🔫';
    if (n.includes('premium') || n.includes('netflix')) return '🎬';
    return '📌';
  };

  return (
    // Tambahkan print:bg-white print:text-black dll agar format kertas menjadi putih
    <div className="flex h-screen bg-[#161925] text-white font-sans overflow-hidden print:bg-white print:text-black print:h-auto print:block">
      <Sidebar active="dashboard" />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 overflow-y-auto print:p-0 print:overflow-visible">
        
        {/* HEADER */}
        <div className="mb-8 print:mb-4">
          <h2 className="text-3xl font-bold">Laporan Penjualan YAGEZ STORE</h2>
          <p className="text-gray-400 print:text-gray-600">Dicetak pada: {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
        </div>

        {/* 4 KOTAK STATISTIK */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[ 
            { t: 'UNTUNG HARI INI', v: stats.hari, c: 'text-[#0dcaf0]' }, 
            { t: 'UNTUNG MINGGU INI', v: stats.minggu, c: 'text-yellow-400' }, 
            { t: 'UNTUNG BULAN INI', v: stats.bulan, c: 'text-emerald-400' }, 
            { t: 'TOTAL ORDERAN', v: `${stats.total} Sukses`, c: 'text-white print:text-black' } 
          ].map((item, i) => (
            <div key={i} className="bg-[#1e2230] print:bg-white print:border-gray-300 p-4 rounded-xl border border-[#2d3345]">
              <p className="text-[10px] text-gray-400 print:text-gray-500 tracking-widest">{item.t}</p>
              <h3 className={`text-2xl font-bold mt-2 ${item.c} print:text-black`}>{typeof item.v === 'number' ? formatRp(item.v) : item.v}</h3>
            </div>
          ))}
        </div>

        {/* BAR DETAIL LAPORAN BULANAN (Sembunyikan filter saat diprint) */}
        <div className="bg-[#1e2230] print:bg-white print:border-gray-300 print:shadow-none p-4 rounded-xl border border-[#2d3345] mb-6 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-[#2d3345] print:bg-gray-100 p-3 rounded-lg text-xl">📊</div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Detail Laporan Bulanan</h3>
              <p className="text-[#0dcaf0] print:text-gray-600 text-sm font-bold">Periode Filter: {formatBulanTeks(filterBulan)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <label className="text-gray-400 text-sm font-bold">Filter Bulan:</label>
            <input type="month" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="bg-[#161925] border border-[#2d3345] px-3 py-2 rounded-lg outline-none text-white focus:border-[#0dcaf0] transition cursor-pointer" />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 pb-10 print:block">
          
          {/* KOLOM KIRI: KATEGORI */}
          <div className="col-span-4 bg-[#1e2230] print:bg-white print:border-gray-300 p-5 rounded-xl border border-[#2d3345] h-fit print:mb-6">
            <h4 className="font-bold mb-5 flex items-center gap-2">📈 Keuntungan per Kategori</h4>
            {kategori.length === 0 && <p className="text-gray-500 text-sm">Belum ada transaksi di bulan ini.</p>}
            {kategori.map(([nama, data], i) => (
              <div key={i} className="mb-4 border-b border-[#2d3345] print:border-gray-200 pb-3 last:border-0 last:mb-0 last:pb-0">
                <div className="flex justify-between mb-1 items-center">
                  <span className="font-bold text-sm flex items-center gap-2"><span className="text-lg">{getIconKategori(nama)}</span> {nama}</span>
                  <span className="bg-blue-900 print:bg-gray-200 print:text-black text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold">{data.order}x Order</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400 print:text-gray-600 text-xs">Total Laba:</span> 
                  <span className="text-emerald-400 print:text-black font-bold">+ {formatRp(data.laba)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* KOLOM KANAN: TOP PELANGGAN */}
          <div className="col-span-8 bg-[#1e2230] print:bg-white print:border-gray-300 rounded-xl border border-[#2d3345] overflow-hidden flex flex-col print:border-0">
            <div className="p-4 border-b border-[#2d3345] print:border-gray-300 flex justify-between items-center bg-[#1a1e2b] print:bg-white print:p-0 print:mb-4 shrink-0">
              <h4 className="font-bold flex items-center gap-2">🏆 Data Pelanggan</h4>
              {/* Sembunyikan form filter saat diprint */}
              <div className="flex items-center gap-2 print:hidden">
                <select value={sortPelanggan} onChange={(e) => setSortPelanggan(e.target.value)} className="bg-[#161925] border border-[#0dcaf0] text-[#0dcaf0] font-semibold px-3 py-1.5 rounded outline-none text-sm cursor-pointer"><option value="terbanyak">Terbanyak</option><option value="terdikit">Terdikit</option><option value="sultan">Sultan</option></select>
                <input type="text" placeholder="Cari ID..." value={searchTarget} onChange={(e) => setSearchTarget(e.target.value)} className="bg-[#161925] border border-[#2d3345] px-3 py-1.5 rounded text-sm w-32 outline-none focus:border-[#0dcaf0] transition placeholder-gray-600" />
                <button onClick={() => setAppliedSearch(searchTarget)} className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded text-sm font-bold transition">Cari</button>
                <button onClick={() => { setSearchTarget(''); setAppliedSearch(''); }} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-sm font-bold transition flex items-center justify-center">✕</button>
              </div>
            </div>

            {/* Hilangkan scroll-y (overflow-auto max-h-[400px]) khusus saat mode print agar tampil semua baris */}
            <div className="overflow-auto max-h-[400px] print:max-h-none print:overflow-visible relative">
              <table className="w-full text-sm text-left border-collapse print:border print:border-gray-300">
                <thead className="text-gray-400 bg-[#161925] print:bg-gray-100 print:text-black sticky top-0 z-10 shadow-md print:shadow-none">
                  <tr>
                    <th className="p-4 font-bold w-12 border-b border-[#2d3345] print:border-gray-300">#</th>
                    <th className="p-4 font-bold border-b border-[#2d3345] print:border-gray-300">Target ID / Akun</th>
                    <th className="p-4 font-bold text-center border-b border-[#2d3345] print:border-gray-300">Order</th>
                    <th className="p-4 font-bold border-b border-[#2d3345] print:border-gray-300">Total Belanja</th>
                    <th className="p-4 font-bold border-b border-[#2d3345] print:border-gray-300">Keuntungan</th>
                  </tr>
                </thead>
                <tbody>
                  {pelanggan.length === 0 && (
                    <tr><td colSpan="5" className="text-center p-6 text-gray-500">Data tidak ditemukan.</td></tr>
                  )}
                  {pelanggan.map(([id, d], i) => (
                    <tr key={id} className="border-b border-[#2d3345] print:border-gray-300 hover:bg-[#1a1e2b] print:hover:bg-transparent transition">
                      <td className="p-4 font-bold text-gray-400 print:text-black">{i + 1}</td>
                      <td className="p-4 font-bold text-white print:text-black">{id}</td>
                      <td className="p-4 text-center">
                        <span className="bg-slate-700 print:bg-gray-200 print:text-black text-gray-200 px-2.5 py-1 rounded-full text-xs font-bold">{d.order}x</span>
                      </td>
                      <td className="p-4 text-gray-300 print:text-black">{formatRp(d.belanja)}</td>
                      <td className="p-4 text-emerald-400 print:text-black font-bold">+ {formatRp(d.laba)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}