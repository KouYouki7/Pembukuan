import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ active }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* TOP BAR KHUSUS MOBILE */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-black border-b-2 border-blue-600 z-40 flex items-center px-4 shadow-[0_4px_15px_rgba(0,0,0,0.8)]">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black border-2 border-yellow-400 text-yellow-400 p-1.5 rounded-md shadow-[0_0_8px_#facc15] flex items-center justify-center transition-transform active:scale-95"
        >
          <span className="text-xl leading-none">☰</span>
        </button>
        
        <h1 className="ml-4 text-yellow-400 font-extrabold tracking-widest uppercase text-sm drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">
          YAGEZ STORE
        </h1>
      </div>

      {/* OVERLAY GELAP */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* SIDEBAR UTAMA */}
      <div 
        className={`fixed md:relative inset-y-0 left-0 z-50 w-[260px] bg-black border-r-4 border-blue-600 p-5 flex flex-col h-full shadow-[4px_0_15px_rgba(37,99,235,0.2)] transform transition-transform duration-300 ease-in-out print:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-4 right-4 text-red-500 hover:text-red-400 font-bold text-2xl transition-transform active:scale-90"
        >
          ✕
        </button>

        <div className="mb-8 flex flex-col items-center text-center border-b-4 border-blue-600 pb-5 mt-2 md:mt-0">
          <img 
            src="/logo.png" 
            alt="Logo Yagez Store" 
            className="h-16 w-auto object-contain mb-3 rounded-lg border-2 border-yellow-400 p-1 bg-black"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h2 className="text-2xl font-extrabold text-yellow-400 tracking-widest uppercase drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
            YAGEZ STORE
          </h2>
          <p className="text-cyan-400 text-[11px] font-bold tracking-widest mt-1 uppercase">Kasir Top-Up</p>
          
          <div className="mt-3 px-3 py-1 bg-blue-900/30 border border-blue-500 rounded-full">
            <p className="text-blue-200 text-[10px] font-bold tracking-widest uppercase">
              Workspace Admin
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-3 flex-grow mt-2 overflow-y-auto">
          <small className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1">Pilih Mode</small>
          
          <button 
            onClick={() => { navigate('/'); setIsOpen(false); }} 
            className={`font-bold p-3 rounded text-left transition-all border-2 flex items-center gap-3 ${
              active === 'dashboard' ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_10px_#facc15]' : 'bg-transparent text-blue-300 border-blue-900 hover:border-blue-500 hover:text-white'
            }`}
          >
            <span className="text-xl">📊</span> Dashboard
          </button>
          
          <button 
            onClick={() => { navigate('/kasir'); setIsOpen(false); }} 
            className={`font-bold p-3 rounded text-left transition-all border-2 flex items-center gap-3 ${
              active === 'kasir' ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_10px_#facc15]' : 'bg-transparent text-blue-300 border-blue-900 hover:border-blue-500 hover:text-white'
            }`}
          >
            <span className="text-xl">👾</span> Layar Kasir
          </button>
          
          <button 
            onClick={() => { navigate('/produk'); setIsOpen(false); }} 
            className={`font-bold p-3 rounded text-left transition-all border-2 flex items-center gap-3 ${
              active === 'produk' ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_10px_#facc15]' : 'bg-transparent text-blue-300 border-blue-900 hover:border-blue-500 hover:text-white'
            }`}
          >
            <span className="text-xl">📦</span> Kelola Produk
          </button>
        </nav>

        <button className="text-red-500 border-2 border-red-600 bg-transparent hover:bg-red-600 hover:text-white hover:shadow-[0_0_10px_#dc2626] p-3 rounded mt-auto font-bold transition-all flex justify-center items-center gap-2">
          <span>👻</span> Keluar Akun
        </button>
      </div>
    </>
  );
}