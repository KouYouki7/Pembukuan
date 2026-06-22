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
  }, [allTrx, prodMap, startDate, endDate, appliedSearch, sortPelanggan]);

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
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold transition-transform active:scale-95 flex items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            >
              <span>📗</span> Unduh Excel
            </button>
            <button 
              onClick={() => window.print()} 
              className="bg-transparent border-2 border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-black px-4 py-2 rounded-lg font-bold transition-transform active:scale-95 flex items-center gap-2 shadow-[0_0_10px_rgba(236,72,153,0.3)]"
            >
              <span>🖨️</span> Cetak PDF
            </button>
          </div>
        </div>

        {/* FILTER RENTANG TANGGAL */}
        <div className="bg-[#111] p-4 rounded-xl border border-blue-900 mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900/40 border border-blue-600 p-2 md:p-3 rounded-lg text-xl">📅</div>
            <div>
              <h3 className="font-bold text-base md:text-lg">Filter Waktu</h3>
              <p className="text-yellow-400 text-xs md:text-sm font-bold">Sesuaikan laporan (Harian/Mingguan/Bulanan)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto bg-black p-2 rounded-lg border border-blue-600">
            <input 
              type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} 
              className="bg-transparent outline-none text-white text-xs md:text-sm cursor-pointer" 
            />
            <span className="text-gray-500 font-bold">s/d</span>
            <input 
              type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} 
              className="bg-transparent outline-none text-white text-xs md:text-sm cursor-pointer" 
            />
          </div>
        </div>

        {/* 4 KOTAK STATISTIK */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 print:grid-cols-4 print:gap-2">
          {[ 
            { t: 'UNTUNG HARI INI', v: stats.hari, c: 'text-[#0dcaf0] print:text-black' }, 
            { t: 'UNTUNG MINGGU INI', v: stats.minggu, c: 'text-yellow-400 print:text-black' }, 
            { t: 'UNTUNG BULAN INI', v: stats.bulan, c: 'text-emerald-400 print:text-black' }, 
            { t: 'TOTAL ORDERAN', v: `${stats.total} Sukses`, c: 'text-white print:text-black' } 
          ].map((item, i) => (
            <div key={i} className="bg-[#111] print:bg-white print:border-black print:shadow-none p-3 md:p-4 rounded-xl border border-blue-900">
              <p className="text-[9px] md:text-[10px] text-gray-400 print:text-gray-600 tracking-widest">{item.t}</p>
              <h3 className={`text-lg md:text-2xl font-bold mt-1 md:mt-2 ${item.c}`}>{typeof item.v === 'number' ? formatRp(item.v) : item.v}</h3>
            </div>
          ))}
        </div>

        {/* GRAFIK */}
        <div className="bg-[#111] p-5 rounded-xl border border-blue-900 mb-6 print:hidden">
          <h4 className="font-bold mb-4 flex items-center gap-2">📈 Grafik Tren Keuntungan (Periode Terpilih)</h4>
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
          <div className="lg:col-span-4 bg-[#111] p-4 md:p-5 rounded-xl border border-blue-900 h-fit print:bg-white print:border-black print:mb-6 print:break-inside-avoid">
            <h4 className="font-bold mb-4 md:mb-5 flex items-center gap-2 print:text-black">📊 Keuntungan per Kategori</h4>
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

          <div className="lg:col-span-8 bg-[#111] rounded-xl border border-blue-900 overflow-hidden flex flex-col print:bg-white print:border-black print:break-inside-avoid">
            <div className="p-4 border-b border-blue-900 print:border-black flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-[#0a0a0a] print:bg-white shrink-0">
              <h4 className="font-bold flex items-center gap-2 print:text-black">🏆 Top Pelanggan Setia</h4>
              
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto print:hidden">
                <div className="flex gap-2 w-full md:w-auto">
                  <input 
                    type="text" 
                    placeholder="Cari ID Akun..." 
                    value={searchTarget} 
                    onChange={(e) => setSearchTarget(e.target.value)} 
                    className="bg-black border border-blue-600 text-white text-xs md:text-sm px-3 py-2 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition w-full md:w-32"
                  />
                  <button 
                    onClick={() => setAppliedSearch(searchTarget)} 
                    className="bg-blue-900 hover:bg-blue-700 text-cyan-400 border border-blue-600 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                  >
                    Cari
                  </button>
                </div>
                <select 
                  value={sortPelanggan} 
                  onChange={(e) => setSortPelanggan(e.target.value)} 
                  className="bg-black border border-blue-600 text-white text-xs md:text-sm px-3 py-2 rounded-lg outline-none focus:border-yellow-400 focus:shadow-[0_0_8px_#facc15] transition cursor-pointer w-full md:w-auto"
                >
                  <option value="terbanyak">🔥 Paling Sering Order</option>
                  <option value="sultan">💎 Paling Banyak Belanja</option>
                  <option value="terdikit">💤 Jarang Order</option>
                </select>
              </div>
            </div>

            <div className="overflow-auto max-h-[400px] relative print:max-h-none print:overflow-visible">
              <table className="w-full text-xs md:text-sm text-left whitespace-nowrap print:border-collapse">
                <thead className="text-gray-400 print:text-black bg-[#0a0a0a] print:bg-gray-100 sticky top-0 z-10 border-b border-blue-900 print:border-black">
                  <tr>
                    <th className="p-3 md:p-4 font-bold w-10 print:border print:border-black">#</th>
                    <th className="p-3 md:p-4 font-bold print:border print:border-black">Target ID / Akun</th>
                    <th className="p-3 md:p-4 font-bold text-center print:border print:border-black">Order</th>
                    <th className="p-3 md:p-4 font-bold print:border print:border-black">Total Belanja</th>
                    <th className="p-3 md:p-4 font-bold print:border print:border-black">Keuntungan</th>
                  </tr>
                </thead>
                <tbody>
                  {pelanggan.map(([id, d], i) => (
                    <tr key={id} className="border-b border-blue-900/30 print:border-black hover:bg-blue-900/20 transition print:hover:bg-transparent">
                      <td className="p-3 md:p-4 font-bold text-gray-500 print:text-black print:border print:border-black">{i + 1}</td>
                      <td className="p-3 md:p-4 font-bold text-white print:text-black print:border print:border-black">{id}</td>
                      <td className="p-3 md:p-4 text-center print:border print:border-black">
                        <span className="bg-blue-900/40 print:bg-transparent print:border-none print:text-black border border-blue-600 text-yellow-400 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold">{d.order}x</span>
                      </td>
                      <td className="p-3 md:p-4 text-gray-400 print:text-black print:border print:border-black">{formatRp(d.belanja)}</td>
                      <td className="p-3 md:p-4 text-emerald-400 font-bold print:text-black print:border print:border-black">+ {formatRp(d.laba)}</td>
                    </tr>
                  ))}
                  {pelanggan.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">Tidak ada data pelanggan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}