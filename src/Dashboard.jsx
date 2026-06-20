import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function Dashboard() {
    const [stats, setStats] = useState({ hariIni: 0, mingguIni: 0, bulanIni: 0, totalOrder: 0 });
    const [topCustomers, setTopCustomers] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // Mengambil seluruh data transaksi dari Supabase
        const { data, error } = await supabase.from('transactions').select('*');
        if (data) {
            hitungStatistik(data);
        }
    };

    const hitungStatistik = (data) => {
        let hariIni = 0;
        let mingguIni = 0;
        let bulanIni = 0;
        let totalOrder = data.length;

        // Mendapatkan string format tanggal saat ini (WIB/Lokal)
        const hariIniStr = new Date().toLocaleDateString('sv-SE'); // Format: YYYY-MM-DD
        const bulanIniStr = hariIniStr.substring(0, 7); // Format: YYYY-MM

        const pelangganMap = {};

        data.forEach(trx => {
            const laba = trx.harga_jual_saat_transaksi - trx.modal_saat_transaksi;
            
            // Konversi tanggal dari database agar pas dengan tanggal lokal
            const tglTrx = new Date(trx.created_at).toLocaleDateString('sv-SE');
            const blnTrx = tglTrx.substring(0, 7);

            // 1. Akumulasi Laba Berdasarkan Waktu
            if (tglTrx === hariIniStr) hariIni += laba;
            if (blnTrx === bulanIniStr) bulanIni += laba;
            
            // Perkiraan filter 7 hari terakhir untuk mingguan
            const selisihHari = (new Date() - new Date(trx.created_at)) / (1000 * 60 * 60 * 24);
            if (selisihHari <= 7) mingguIni += laba;

            // 2. Pemetaan Data untuk Top Pelanggan Setia
            if (!pelangganMap[trx.target_id]) {
                pelangganMap[trx.target_id] = { target_id: trx.target_id, order: 0, belanja: 0, untung: 0 };
            }
            pelangganMap[trx.target_id].order += 1;
            pelangganMap[trx.target_id].belanja += trx.harga_jual_saat_transaksi;
            pelangganMap[trx.target_id].untung += laba;
        });

        setStats({ hariIni, mingguIni, bulanIni, totalOrder });

        // Mengurutkan pelanggan berdasarkan jumlah order terbanyak
        const sortedPelanggan = Object.values(pelangganMap)
            .sort((a, b) => b.order - a.order)
            .slice(0, 6); // Ambil top 6 teratas saja
        setTopCustomers(sortedPelanggan);
    };

    return (
        <div>
            <h3 className="fw-bold mb-1 text-body">Dashboard Laporan</h3>
            <p className="text-muted small mb-4">Ringkasan performa penjualan tokomu.</p>

            {/* BARIS KOTAK RINGKASAN PERFORMA */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 bg-body-tertiary p-3 border-start border-4 border-info shadow-sm">
                        <small className="text-muted fw-bold text-uppercase" style={{fontSize: '0.75rem'}}>UNTUNG HARI INI</small>
                        <h4 className="fw-bold text-info mt-1">Rp {stats.hariIni.toLocaleString('id-ID')}</h4>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 bg-body-tertiary p-3 border-start border-4 border-warning shadow-sm">
                        <small className="text-muted fw-bold text-uppercase" style={{fontSize: '0.75rem'}}>UNTUNG MINGGU INI</small>
                        <h4 className="fw-bold text-warning mt-1">Rp {stats.mingguIni.toLocaleString('id-ID')}</h4>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 bg-body-tertiary p-3 border-start border-4 border-success shadow-sm">
                        <small className="text-muted fw-bold text-uppercase" style={{fontSize: '0.75rem'}}>UNTUNG BULAN INI</small>
                        <h4 className="fw-bold text-success mt-1">Rp {stats.bulanIni.toLocaleString('id-ID')}</h4>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 bg-body-tertiary p-3 border-start border-4 border-secondary shadow-sm">
                        <small className="text-muted fw-bold text-uppercase" style={{fontSize: '0.75rem'}}>TOTAL ORDERAN</small>
                        <h4 className="fw-bold text-secondary mt-1">{stats.totalOrder} <span className="fs-6 fw-normal text-muted">Sukses</span></h4>
                    </div>
                </div>
            </div>

            {/* TABEL DATA TOP PELANGGAN */}
            <div className="card border-0 bg-body-tertiary shadow-sm">
                <div className="card-header bg-transparent fw-bold border-bottom py-3">
                    🏆 Top Pelanggan Setia
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0" style={{fontSize: '0.9rem'}}>
                            <thead>
                                <tr>
                                    <th style={{width: '5%'}}>#</th>
                                    <th>Target ID / Akun</th>
                                    <th>Order</th>
                                    <th>Total Belanja</th>
                                    <th className="text-success">Keuntungan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCustomers.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-5 text-muted">Belum ada data jurnal transaksi masuk.</td></tr>
                                ) : (
                                    topCustomers.map((c, index) => (
                                        <tr key={c.target_id}>
                                            <td>{index + 1}</td>
                                            <td className="fw-bold text-info">{c.target_id}</td>
                                            <td><span className="badge bg-secondary">{c.order}x Order</span></td>
                                            <td className="fw-bold">Rp {c.belanja.toLocaleString('id-ID')}</td>
                                            <td className="text-success fw-bold">+ Rp {c.untung.toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}