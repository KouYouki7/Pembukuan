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
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <Sidebar active="dashboard" />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-5 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full">
        
        {/* HEADER DENGAN TOMBOL CETAK */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Laporan Penjualan</h2>
            <p className="text-gray-400 text-sm md:text-base">Ringkasan performa penjualan tokomu.</p>
          </div>
          
          <button 
            onClick={() => window.print()} 
            className="bg-transparent border-2 border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-black px-4 py-2 rounded-lg font-bold transition-transform active:scale-95 flex items-center gap-2 w-fit shadow-[0_0_10px_rgba(236,72,153,0.3)] hover:shadow-[0_0_15px_rgba(236,72,153,0.6)]"
          >
            <span className="text-xl">🖨️</span> Cetak Laporan
          </button>
        </div>

        {/* 4 KOTAK STATISTIK */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[ 
            { t: 'UNTUNG HARI INI', v: stats.hari, c: 'text-[#0dcaf0]' }, 
            { t: 'UNTUNG MINGGU INI', v: stats.minggu, c: 'text-yellow-400' }, 
            { t: 'UNTUNG BULAN INI', v: stats.bulan, c: 'text-emerald-400' }, 
            { t: 'TOTAL ORDERAN', v: `${stats.total} Sukses`, c: 'text-white' } 
          ].map((item, i) => (
            <div key={i} className="bg-[#111] p-3 md:p-4 rounded-xl border border-blue-900 hover:border-blue-600 transition-colors">
              <p className="text-[9px] md:text-[10px] text-gray-400 tracking-widest">{item.t}</p>
              <h3 className={`text-lg md:text-2xl font-bold mt-1 md:mt-2 ${item.c}`}>{typeof item.v === 'number' ? formatRp(item.v) : item.v}</h3>
            </div>
          ))}
        </div>

        {/* BAR DETAIL LAPORAN BULANAN */}
        <div className="bg-[#111] p-4 rounded-xl border border-blue-900 mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-blue-900/40 border border-blue-600 p-2 md:p-3 rounded-lg text-xl">📊</div>
            <div>
              <h3 className="font-bold text-base md:text-lg leading-tight">Detail Laporan Bulanan</h3>
              <p className="text-yellow-400 text-xs md:text-sm font-bold">Periode: {formatBulanTeks(filterBulan)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-gray-400 text-xs md:text-sm font-bold whitespace-nowrap">Filter Bulan:</label>
            <input 
              type="month" 
              value={filterBulan} 
              onChange={(e) => setFilterBulan(e.target.value)} 
              className="bg-black border border-blue-600 px-3 py-2 rounded-lg outline-none text-white focus:border-yellow-400 transition cursor-pointer w-full md:w-auto" 
            />
          </div>
        </div>

        {/* GRID KONTEN BAWAH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
          
          {/* KOLOM KATEGORI */}
          <div className="lg:col-span-4 bg-[#111] p-4 md:p-5 rounded-xl border border-blue-900 h-fit">
            <h4 className="font-bold mb-4 md:mb-5 flex items-center gap-2">📈 Keuntungan per Kategori</h4>
            {kategori.length === 0 && <p className="text-gray-500 text-sm">Belum ada transaksi di bulan ini.</p>}
            {kategori.map(([nama, data], i) => (
              <div key={i} className="mb-3 md:mb-4 border-b border-blue-900/50 pb-3 last:border-0 last:mb-0 last:pb-0">
                <div className="flex justify-between mb-1 items-center">
                  <span className="font-bold text-xs md:text-sm flex items-center gap-2"><span className="text-base md:text-lg">{getIconKategori(nama)}</span> {nama}</span>
                  <span className="bg-blue-900/50 border border-blue-600 text-blue-300 text-[9px] md:text-[10px] px-2 py-0.5 rounded-full font-bold">{data.order}x Order</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm mt-2">
                  <span className="text-gray-400">Total Laba:</span> 
                  <span className="text-emerald-400 font-bold">+ {formatRp(data.laba)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* KOLOM KANAN: TOP PELANGGAN */}
          <div className="lg:col-span-8 bg-[#111] rounded-xl border border-blue-900 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-blue-900 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-[#0a0a0a] shrink-0">
              <h4 className="font-bold flex items-center gap-2">🏆 Top Pelanggan Setia</h4>
              
              <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                <select value={sortPelanggan} onChange={(e) => setSortPelanggan(e.target.value)} className="bg-black border border-blue-600 text-blue-400 font-semibold px-3 py-1.5 rounded outline-none text-xs md:text-sm cursor-pointer flex-1 md:flex-none">
                  <option value="terbanyak">Terbanyak</option>
                  <option value="terdikit">Terdikit</option>
                  <option value="sultan">Sultan</option>
                </select>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input type="text" placeholder="Cari ID..." value={searchTarget} onChange={(e) => setSearchTarget(e.target.value)} className="bg-black border border-blue-600 px-3 py-1.5 rounded text-xs md:text-sm w-full md:w-32 outline-none focus:border-yellow-400 transition placeholder-gray-600" />
                  <button onClick={() => setAppliedSearch(searchTarget)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs md:text-sm font-bold transition">Cari</button>
                  <button onClick={() => { setSearchTarget(''); setAppliedSearch(''); }} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-xs md:text-sm font-bold transition">✕</button>
                </div>
              </div>
            </div>

            <div className="overflow-auto max-h-[400px] relative">
              <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
                <thead className="text-gray-400 bg-[#0a0a0a] sticky top-0 z-10 border-b border-blue-900">
                  <tr>
                    <th className="p-3 md:p-4 font-bold w-10">#</th>
                    <th className="p-3 md:p-4 font-bold">Target ID / Akun</th>
                    <th className="p-3 md:p-4 font-bold text-center">Order</th>
                    <th className="p-3 md:p-4 font-bold">Total Belanja</th>
                    <th className="p-3 md:p-4 font-bold">Keuntungan</th>
                  </tr>
                </thead>
                <tbody>
                  {pelanggan.length === 0 && (
                    <tr><td colSpan="5" className="text-center p-6 text-gray-500">Data tidak ditemukan.</td></tr>
                  )}
                  {pelanggan.map(([id, d], i) => (
                    <tr key={id} className="border-b border-blue-900/30 hover:bg-blue-900/20 transition">
                      <td className="p-3 md:p-4 font-bold text-gray-500">{i + 1}</td>
                      <td className="p-3 md:p-4 font-bold text-white">{id}</td>
                      <td className="p-3 md:p-4 text-center">
                        <span className="bg-blue-900/40 border border-blue-600 text-yellow-400 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold">{d.order}x</span>
                      </td>
                      <td className="p-3 md:p-4 text-gray-400">{formatRp(d.belanja)}</td>
                      <td className="p-3 md:p-4 text-emerald-400 font-bold">+ {formatRp(d.laba)}</td>
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