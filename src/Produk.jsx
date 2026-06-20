import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function Produk() {
    const [products, setProducts] = useState([]);
    
    // State untuk form input
    const [kode, setKode] = useState('');
    const [nama, setNama] = useState('');
    const [modal, setModal] = useState('');
    const [jual, setJual] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('nama_barang', { ascending: true });
            
        if (data) setProducts(data);
    };

    const simpanProduk = async (e) => {
        e.preventDefault();
        
        const { data, error } = await supabase.from('products').insert([
            {
                kode_barang: kode,
                nama_barang: nama,
                modal: modal,
                harga_jual: jual
            }
        ]);

        if (!error) {
            alert('✅ Produk Berhasil Ditambahkan!');
            setKode('');
            setNama('');
            setModal('');
            setJual('');
            fetchProducts();
        } else {
            alert('❌ Gagal menyimpan: ' + error.message);
        }
    };

    const hapusProduk = async (id) => {
        if(window.confirm('Yakin ingin menghapus produk ini?')) {
            await supabase.from('products').delete().eq('id', id);
            fetchProducts();
        }
    };

    return (
        <div>
            {/* FORM TAMBAH PRODUK */}
            <div className="card shadow-sm border-0 mb-4 bg-body-tertiary">
                <div className="card-header bg-transparent fw-bold border-bottom py-3">
                    <span className="fs-5 me-2">📦</span> Tambah Produk Baru
                </div>
                <div className="card-body">
                    <form onSubmit={simpanProduk}>
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label text-muted fw-bold" style={{fontSize: '0.8rem'}}>KODE PRODUK</label>
                                <input type="text" className="form-control" placeholder="Contoh: ML-86" value={kode} onChange={e => setKode(e.target.value)} required />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label text-muted fw-bold" style={{fontSize: '0.8rem'}}>NAMA PRODUK</label>
                                <input type="text" className="form-control" placeholder="Mobile Legends 86 DM" value={nama} onChange={e => setNama(e.target.value)} required />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label text-muted fw-bold" style={{fontSize: '0.8rem'}}>HARGA MODAL</label>
                                <input type="number" className="form-control border-warning text-warning fw-bold" placeholder="20000" value={modal} onChange={e => setModal(e.target.value)} required />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label text-muted fw-bold" style={{fontSize: '0.8rem'}}>HARGA JUAL</label>
                                <input type="number" className="form-control border-success text-success fw-bold" placeholder="22000" value={jual} onChange={e => setJual(e.target.value)} required />
                            </div>
                            <div className="col-md-2 d-flex align-items-end">
                                <button type="submit" className="btn btn-primary w-100 fw-bold shadow-sm text-white" style={{background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', border: 'none'}}>
                                    ➕ Tambah
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* TABEL DAFTAR PRODUK */}
            <div className="card shadow-sm border-0 bg-body-tertiary">
                <div className="card-header bg-transparent fw-bold border-bottom py-3">
                    <span className="fs-5 me-2">📋</span> Daftar Produk Tersedia
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0" style={{fontSize: '0.9rem'}}>
                            <thead>
                                <tr>
                                    <th>Kode</th>
                                    <th>Nama Produk</th>
                                    <th>Modal</th>
                                    <th>Jual</th>
                                    <th className="text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-4 text-muted">Belum ada produk. Silakan tambahkan di atas.</td></tr>
                                ) : (
                                    products.map((p) => (
                                        <tr key={p.id}>
                                            <td><span className="badge bg-secondary">{p.kode_barang}</span></td>
                                            <td className="fw-bold">{p.nama_barang}</td>
                                            <td className="text-warning fw-bold">Rp {p.modal.toLocaleString('id-ID')}</td>
                                            <td className="text-success fw-bold">Rp {p.harga_jual.toLocaleString('id-ID')}</td>
                                            <td className="text-center">
                                                <button onClick={() => hapusProduk(p.id)} className="btn btn-danger btn-sm fw-bold">Hapus</button>
                                            </td>
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