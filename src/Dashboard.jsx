import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Sidebar from './Sidebar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const [allTrx, setAllTrx] = useState([]);
  const [prodMap, setProdMap] = useState({}); 

  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [sortPelanggan, setSortPelanggan] = useState('terbanyak');
  const [searchTarget, setSearchTarget] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [stats, setStats] = useState({ hari: 0, minggu: 0, bulan: 0, total: 0 });
  const [kategori, setKategori] = useState([]);
  const [pelanggan, setPelanggan] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  // STATE UNTUK PAGINATION LEADERBOARD
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getPastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

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

    const filteredTrx = allTrx.filter(trx => {
      const tgl = trx.created_at.split('T')[0];
      return tgl >= startDate && tgl <= endDate;
    });
    setFilteredTransactions(filteredTrx);

    const dateMap = {};
    filteredTrx.forEach(trx => {
      const tgl = trx.created_at.split('T')[0]; 
      if (!dateMap[tgl]) dateMap[tgl] = { tanggal: tgl, laba: 0, order: 0 };
      dateMap[tgl].laba += (Number(trx.harga_jual_saat_transaksi) - Number(trx.modal_saat_transaksi));
      dateMap[tgl].order += 1;
    });

    const dailyData = Object.values(dateMap).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    dailyData.forEach(d => {
      const parts = d.tanggal.split('-');
      d.label = `${parts[2]}/${parts[1]}`;
    });
    setChartData(dailyData);

    const catMap = {};
    const userMap = {};

    filteredTrx.forEach(trx => {
      const laba = Number(trx.harga_jual_saat_transaksi) - Number(trx.modal_saat_transaksi);
      
      const cat = prodMap[trx.kode_barang] || 'Lainnya';
      if (!catMap[cat]) catMap[cat] = { order: 0, laba: 0 };
      catMap[cat].order += 1;
      catMap[cat].laba += laba;

      const tid = trx.target_id;
      if (!userMap[tid]) userMap[tid] = { order: 0, belanja: 0, laba: 0 };
      userMap[tid].order += 1;
      userMap[tid].belanja += Number(trx.harga_jual_saat_transaksi);
      userMap[tid].laba += laba;
    });

    setKategori(Object.entries(catMap).sort((a, b) => b[1].laba - a[1].laba));

    let userArr = Object.entries(userMap);
    if (appliedSearch) {
      userArr = userArr.filter(([id]) => id.toLowerCase().includes(appliedSearch.toLowerCase()));
    }

    if (sortPelanggan === 'terbanyak') userArr.sort((a, b) => b[1].order - a[1].order);
    else if (sortPelanggan === 'terdikit') userArr.sort((a, b) => a[1].order - b[1].order);
    else if (sortPelanggan === 'sultan') userArr.sort((a, b) => b[1].belanja - a[1].belanja);

    setPelanggan(userArr); 
    setCurrentPage(1); 
  }, [allTrx, prodMap, startDate, endDate, appliedSearch, sortPelanggan]);

  const totalPages = Math.ceil(pelanggan.length / itemsPerPage);
  const currentPelanggan = pelanggan.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const getIconKategori = (nama) => {
    const n = nama.toLowerCase();
    if (n.includes('mobile legend')) return '⚔️';
    if (n.includes('free fire')) return '🔫';
    if (n.includes('akun premium') || n.includes('netflix')) return '🎬';
    return '📌';
  };

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) return alert("Tidak ada data untuk diekspor pada tanggal ini.");
    
    const dataToExport = filteredTransactions.map((trx, i) => ({
      "No": i + 1,
      "Tanggal": trx.created_at.split('T')[0],
      "Jam": trx.created_at.split('T')[1].slice(0,5),
      "Target ID": trx.target_id,
      "Produk": trx.kode_barang,
      "Modal (Rp)": Number(trx.modal_saat_transaksi),
      "Harga Jual (Rp)": Number(trx.harga_jual_saat_transaksi),
      "Keuntungan (Rp)": Number(trx.harga_jual_saat_transaksi) - Number(trx.modal_saat_transaksi)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");
    
    XLSX.writeFile(workbook, `Laporan_YagezTracker_${startDate}_sd_${endDate}.xlsx`);
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden print:bg-white print:text-black print:h-auto print:overflow-visible">
      <Sidebar active="dashboard" />

      <div className="flex-1 p-5 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full print:p-0 print:m-0">
        
        {/* HEADER KHUSUS PRINT */}
        <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-center">
          <h1 className="text-3xl font-extrabold uppercase tracking-widest">YAGEZ TRACKER</h1>
          <h2 className="text-xl font-bold mt-2">Laporan Pembukuan Keuangan</h2>
          <p className="mt-1 text-gray-700">Periode: {startDate} s/d {endDate}</p>
        </div>

        {/* HEADER WEB */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4 print:hidden">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Laporan Penjualan</h2>
            <p className="text-gray-400 text-sm md:text-base">Ringkasan performa penjualan tokomu.</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleExportExcel} 
              className="flex items-center gap-2 px-5 py-2.5 bg-[#01140d] text-[#00e68a] border border-[#00e68a]/40 hover:border-[#00e68a] hover:bg-[#00e68a]/10 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
                <path d="M12 15l-4-4m4 4l4-4m-4 4V4" />
              </svg>
              Export Excel
            </button>
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 px-5 py-2.5 bg-[#170e17] text-[#ff4da6] border border-[#ff4da6]/30 hover:border-[#ff4da6] hover:bg-[#ff4da6]/10 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Cetak Laporan
            </button>
          </div>
        </div>

        {/* RENTANG WAKTU & QUICK FILTER */}
        <div className="bg-[#111] p-4 rounded-xl border border-blue-900 mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <div className="bg-transparent border border-blue-500/40 p-2 md:p-2.5 rounded-xl text-blue-400">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg">Rentang Waktu</h3>
              <p className="text-yellow-400 text-xs md:text-sm font-bold">Sesuaikan laporan (Harian/Mingguan/Bulanan)</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => { setStartDate(todayStr); setEndDate(todayStr); }} className="flex-1 sm:flex-none bg-blue-900/30 hover:bg-blue-900/60 text-blue-300 border border-blue-700/50 px-3 py-2 rounded-lg text-xs font-bold transition">Hari Ini</button>
              <button onClick={() => { setStartDate(getPastDate(7)); setEndDate(todayStr); }} className="flex-1 sm:flex-none bg-blue-900/30 hover:bg-blue-900/60 text-blue-300 border border-blue-700/50 px-3 py-2 rounded-lg text-xs font-bold transition">7 Hari</button>
              <button onClick={() => { setStartDate(getPastDate(30)); setEndDate(todayStr); }} className="flex-1 sm:flex-none bg-blue-900/30 hover:bg-blue-900/60 text-blue-300 border border-blue-700/50 px-3 py-2 rounded-lg text-xs font-bold transition">30 Hari</button>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto bg-black p-2 rounded-lg border border-blue-600">
              <input 
                type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} 
                className="bg-transparent outline-none text-white text-xs md:text-sm cursor-pointer w-full [color-scheme:dark]" 
              />
              <span className="text-gray-500 font-bold">s/d</span>
              <input 
                type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} 
                className="bg-transparent outline-none text-white text-xs md:text-sm cursor-pointer w-full [color-scheme:dark]" 
              />
            </div>
          </div>
        </div>

        {/* KOTAK STATISTIK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:grid-cols-4 print:gap-2">
          {[ 
            { t: 'Total Keuntungan Hari Ini', v: stats.hari, c: 'text-blue-500 print:text-black', icon: 'wallet', iconStyle: 'text-blue-500 border-blue-500/30 bg-blue-500/10' }, 
            { t: 'Keuntungan 1 Minggu Terakhir', v: stats.minggu, c: 'text-yellow-500 print:text-black', icon: 'trend', iconStyle: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' }, 
            { t: 'Total Laba Bulan Ini', v: stats.bulan, c: 'text-emerald-500 print:text-black', icon: 'ribbon', iconStyle: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' }, 
            { t: 'Orderan Sukses', v: `${stats.total} Trx`, c: 'text-rose-500 print:text-black', icon: 'pulse', iconStyle: 'text-rose-500 border-rose-500/30 bg-rose-500/10' } 
          ].map((item, i) => (
            <div key={i} className="bg-[#111] print:bg-white print:border-black print:shadow-none p-4 rounded-xl border border-blue-900 flex justify-between items-center">
              <div>
                <p className="text-[11px] md:text-xs text-gray-400 print:text-gray-600 font-medium mb-1">{item.t}</p>
                <h3 className={`text-xl md:text-2xl font-bold ${item.c}`}>
                  {typeof item.v === 'number' ? formatRp(item.v) : item.v}
                </h3>
              </div>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 print:hidden ${item.iconStyle}`}>
                {item.icon === 'wallet' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" /></svg>}
                {item.icon === 'trend' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                {item.icon === 'ribbon' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                {item.icon === 'pulse' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h2l2 4 2-8 2 4h2" /></svg>}
              </div>
            </div>
          ))}
        </div>

        {/* GRAFIK */}
        <div className="bg-[#111] p-5 rounded-xl border border-blue-900 mb-6 print:hidden">
          <h4 className="font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
            Tren Keuntungan Transaksi
          </h4>
          
          <div className="w-full h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLaba" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `Rp${value / 1000}k` : value} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#2563eb', borderRadius: '8px', fontSize: '12px', color: '#fff' }} itemStyle={{ color: '#facc15', fontWeight: 'bold' }} formatter={(value) => [formatRp(value), 'Keuntungan']} />
                <Area type="monotone" dataKey="laba" stroke="#facc15" strokeWidth={3} fillOpacity={1} fill="url(#colorLaba)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRID KONTEN BAWAH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10 print:block">
          
          <div className="lg:col-span-4 bg-[#111] rounded-xl border border-blue-900 overflow-hidden flex flex-col h-fit print:bg-white print:border-black print:mb-6 print:break-inside-avoid">
            <div className="p-4 border-b border-blue-900 print:border-black bg-[#0a0a0a] print:bg-white shrink-0">
              <h4 className="font-bold flex items-center gap-2.5 print:text-black text-lg m-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-[#00e68a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span className="text-white">Analisis Kategori</span>
              </h4>
            </div>
            
            <div className="p-4 md:p-5">
              {kategori.map(([nama, data], i) => (
                <div key={i} className="mb-3 md:mb-4 border-b border-blue-900/50 print:border-gray-300 pb-3 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between mb-1 items-center">
                    <span className="font-bold text-xs md:text-sm flex items-center gap-2 print:text-black"><span className="text-base md:text-lg print:hidden">{getIconKategori(nama)}</span> {nama}</span>
                    <span className="bg-blue-900/50 print:bg-transparent print:border-black print:text-black border border-blue-600 text-blue-300 text-[9px] md:text-[10px] px-2 py-0.5 rounded-full font-bold">{data.order}x Order</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm mt-2">
                    <span className="text-gray-400 print:text-gray-700">Total Laba:</span> 
                    <span className="text-emerald-400 font-bold print:text-black">+ {formatRp(data.laba)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-[#111] rounded-xl border border-blue-900 overflow-hidden flex flex-col print:bg-white print:border-black print:break-inside-avoid">
            
            {/* HEADER LEADERBOARD: TINGGI & UKURANNYA SEKARANG DIBUAT IDENTIK/SIMETRIS (h-8) */}
            <div className="p-4 border-b border-blue-900 print:border-black flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 bg-[#0a0a0a] print:bg-white shrink-0">
              
              <h4 className="font-bold flex items-center gap-2.5 print:text-black text-lg whitespace-nowrap shrink-0 m-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-[#ff4da6]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span className="text-white">Leaderboard</span>
              </h4>
              
              <div className="flex flex-row items-center gap-2 w-full xl:w-auto print:hidden mt-2 xl:mt-0">
                <input 
                  type="text" 
                  placeholder="Cari ID..." 
                  value={searchTarget} 
                  onChange={(e) => setSearchTarget(e.target.value)} 
                  className="flex-1 min-w-[100px] xl:w-[150px] h-8 sm:h-9 bg-black border border-blue-600 text-white text-[10px] sm:text-xs px-3 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition"
                />
                <button 
                  onClick={() => setAppliedSearch(searchTarget)} 
                  className="shrink-0 h-8 sm:h-9 px-3 sm:px-4 bg-blue-900 hover:bg-blue-700 text-cyan-400 border border-blue-600 rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center justify-center shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                >
                  Cari
                </button>
                <select 
                  value={sortPelanggan} 
                  onChange={(e) => setSortPelanggan(e.target.value)} 
                  className="shrink-0 w-[95px] sm:w-[110px] h-8 sm:h-9 bg-black border border-blue-600 text-white text-[10px] sm:text-xs px-2 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition cursor-pointer"
                >
                  <option value="terbanyak">🔥 Sering</option>
                  <option value="sultan">💎 Sultan</option>
                  <option value="terdikit">💤 Jarang</option>
                </select>
              </div>

            </div>

            <div className="overflow-x-auto relative print:overflow-visible">
              <table className="w-full text-xs md:text-sm text-left whitespace-nowrap print:border-collapse">
                <thead className="text-gray-400 print:text-black bg-[#0a0a0a] print:bg-gray-100 border-b border-blue-900 print:border-black">
                  <tr>
                    <th className="p-3 md:p-4 font-bold w-10 print:border print:border-black">#</th>
                    <th className="p-3 md:p-4 font-bold print:border print:border-black">Target ID / Akun</th>
                    <th className="p-3 md:p-4 font-bold text-center print:border print:border-black">Order</th>
                    <th className="p-3 md:p-4 font-bold print:border print:border-black">Total Belanja</th>
                    <th className="p-3 md:p-4 font-bold print:border print:border-black">Keuntungan</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPelanggan.map(([id, d], i) => {
                    const rank = (currentPage - 1) * itemsPerPage + i + 1;
                    return (
                      <tr key={id} className="border-b border-blue-900/30 print:border-black hover:bg-blue-900/20 transition print:hover:bg-transparent">
                        <td className="p-3 md:p-4 font-bold text-gray-500 print:text-black print:border print:border-black">{rank}</td>
                        <td className="p-3 md:p-4 font-bold text-white print:text-black print:border print:border-black">{id}</td>
                        <td className="p-3 md:p-4 text-center print:border print:border-black">
                          <span className="bg-blue-900/40 print:bg-transparent print:border-none print:text-black border border-blue-600 text-yellow-400 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold">{d.order}x</span>
                        </td>
                        <td className="p-3 md:p-4 text-gray-400 print:text-black print:border print:border-black">{formatRp(d.belanja)}</td>
                        <td className="p-3 md:p-4 text-emerald-400 font-bold print:text-black print:border print:border-black">+ {formatRp(d.laba)}</td>
                      </tr>
                    )
                  })}
                  {pelanggan.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">Tidak ada data pelanggan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-t border-blue-900 bg-[#0a0a0a] print:hidden">
                <span className="text-xs text-gray-400">
                  Menampilkan <span className="text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-white font-bold">{Math.min(currentPage * itemsPerPage, pelanggan.length)}</span> dari <span className="text-white font-bold">{pelanggan.length}</span> pelanggan
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-4 py-2 bg-black disabled:opacity-40 disabled:cursor-not-allowed text-blue-400 text-xs rounded-lg hover:bg-blue-900/50 border border-blue-700 transition font-bold flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    Prev
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-4 py-2 bg-black disabled:opacity-40 disabled:cursor-not-allowed text-blue-400 text-xs rounded-lg hover:bg-blue-900/50 border border-blue-700 transition font-bold flex items-center gap-1"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}