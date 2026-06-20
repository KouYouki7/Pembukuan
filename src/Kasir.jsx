import { useState, useEffect } from 'react';
import Select from 'react-select';
import { supabase } from './supabase';

export default function Kasir() {
    const [products, setProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    
    // State untuk form input
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [targetId, setTargetId] = useState('');
    const [modal, setModal] = useState('');
    const [jual, setJual] = useState('');

    // Mengambil data dari Supabase saat halaman dimuat
    useEffect(() => {
        fetchProducts();
        fetchTransactions();
    }, []);

    const fetchProducts = async () => {
        const { data, error } = await supabase.from('products').select('*');
        if (data) {
            // Urutkan nama barang 
            const sortedData = data.sort((a, b) => a.nama_barang.localeCompare(b.nama_barang, undefined, { numeric: true }));
            setProducts(sortedData);
        }
    };

    const fetchTransactions = async () => {
        const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (data) setTransactions(data);
    };

    // Saat produk dipilih dari Dropdown
    const handleProductChange = (selectedOption) => {
        setSelectedProduct(selectedOption);
        if (selectedOption) {
            setModal(selectedOption.modal);
            setJual(selectedOption.harga_jual);
        } else {
            setModal('');
            setJual('');
        }
    };

    // Fungsi Simpan Transaksi ke Supabase
    const simpanTransaksi = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return alert("Pilih produk terlebih dahulu!");

        const { data, error } = await supabase.from('transactions').insert([
            {
                kode_barang: selectedProduct.value,
                target_id: targetId,
                modal_saat_transaksi: modal,
                harga_jual_saat_transaksi: jual,
                created_at: new Date(tanggal).toISOString()
            }
        ]);

        if (!error) {
            alert('Transaksi Berhasil Disimpan!');
            setTargetId('');
            setSelectedProduct(null);
            setModal('');
            setJual('');
            fetchTransactions(); // Segarkan tabel
        }
    };

    // Fungsi Hapus Transaksi
    const hapusTransaksi = async (id) => {
        if(window.confirm('Yakin ingin menghapus transaksi ini?')) {
            await supabase.from('transactions').delete().eq('id', id);
            fetchTransactions();
        }
    };

    // Kustomisasi desain React-Select
    const selectStyles = {
        control: (base) => ({ ...base, backgroundColor: 'transparent', borderColor: '#6c757d', minHeight: '43px' }),
        singleValue: (base) => ({ ...base, color: 'inherit' }),
        menu: (base) => ({ ...base, backgroundColor: 'var(--bs-body-bg)', zIndex: 50 }),
        option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#06b6d4' : 'transparent', color: state.isFocused ? 'white' : 'inherit' })
    };

    // Format Data Produk untuk Dropdown Select
    const productOptions = products.map(p => ({
        value: p.kode_barang,
        label: p.nama_barang,
        modal: p.modal,
        harga_jual: p.harga_jual
    }));

    return (
        <div>
            {/* FORM TRANSAKSI */}
            <div className="card shadow-sm border-0 mb-4 bg-body-tertiary">
                <div className="card-header bg-transparent fw-bold border-bottom py-3">
                    <span className="fs-5 me-2">📝</span> Catat Transaksi Baru
                </div>
                <div className="card-body">
                    <form onSubmit={simpanTransaksi}>
                        <div className="row g-3">
                            <div className="col-md-2">
                                <label className="form-label text-muted fw-bold" style={{fontSize: '0.8rem'}}>TANGGAL</label>
                                <input type="date" className="form-control" value={tanggal} onChange={e => setTanggal(e.target.value)} style={{height: '43px'}} required />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label text-muted fw-bold" style={{fontSize: '0.8rem'}}>PILIH PRODUK</label>
                                <Select 
                                    options={productOptions} 
                                    value={selectedProduct} 
                                    onChange={handleProductChange} 
                                    styles={selectStyles} 
                                    placeholder="-- Ketik Nama Produk --" 
                                    isClearable 
                                    required 
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label text-muted fw-bold" style={{fontSize: '0.8rem'}}>TARGET ID / AKUN</label>
                                <input type="text" className="form-control border-info" placeholder="Contoh: 12345678" value={targetId} onChange={e => setTargetId(e.target.value)} style={{height: '43px'}} required />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label text-muted fw-bold" style={{fontSize: '0.8rem'}}>UANG MODAL</label>
                                <input type="number" className="form-control border-warning text-warning fw-bold" value={modal} onChange={e => setModal(e.target.value)} style={{height: '43px'}} required />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label text-muted fw-bold" style={{fontSize: '0.8rem'}}>HARGA JUAL</label>
                                <input type="number" className="form-control border-success text-success fw-bold" value={jual} onChange={e => setJual(e.target.value)} style={{height: '43px'}} required />
                            </div>
                            <div className="col-md-9 d-flex align-items-end">
                                <button type="submit" className="btn btn-primary w-100 fw-bold shadow-sm text-white" style={{background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', border: 'none', height: '43px'}}>
                                    💾 Simpan ke Buku Kasir
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* TABEL RIWAYAT */}
            <div className="card shadow-sm border-0 bg-body-tertiary">
                <div className="card-header bg-transparent fw-bold border-bottom py-3">
                    <span className="fs-5 me-2">📚</span> Riwayat Jurnal Transaksi
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0" style={{fontSize: '0.9rem'}}>
                            <thead>
                                <tr>
                                    <th>Target ID / Akun</th>
                                    <th>Kode Produk</th>
                                    <th>Modal</th>
                                    <th>Jual</th>
                                    <th className="text-success">Keuntungan</th>
                                    <th className="text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-4 text-muted">Belum ada transaksi</td></tr>
                                ) : (
                                    transactions.map((trx) => {
                                        const laba = trx.harga_jual_saat_transaksi - trx.modal_saat_transaksi;
                                        return (
                                            <tr key={trx.id}>
                                                <td className="fw-bold">{trx.target_id}</td>
                                                <td><span className="badge bg-secondary">{trx.kode_barang}</span></td>
                                                <td className="text-warning fw-bold">Rp {trx.modal_saat_transaksi.toLocaleString('id-ID')}</td>
                                                <td className="fw-bold">Rp {trx.harga_jual_saat_transaksi.toLocaleString('id-ID')}</td>
                                                <td className="text-success fw-bold">+ Rp {laba.toLocaleString('id-ID')}</td>
                                                <td className="text-center">
                                                    <button onClick={() => hapusTransaksi(trx.id)} className="btn btn-danger btn-sm fw-bold">Hapus</button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}