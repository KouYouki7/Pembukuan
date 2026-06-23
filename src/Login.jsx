import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    // 🔐 GANTI PASSWORD DI BAWAH INI SESUAI KEINGINANMU
    if (password === 'sandigacha') {
      localStorage.setItem('isYagezLoggedIn', 'true');
      onLogin(); // Memberitahu App.jsx bahwa login sukses
    } else {
      setError('Password salah! Silakan coba lagi.');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#070a13] p-4 font-sans text-white">
      <div className="w-full max-w-md bg-[#0f1322] p-8 rounded-2xl border border-slate-800/80 shadow-2xl">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-[#111] rounded-2xl flex items-center justify-center border border-blue-900 shadow-[0_0_15px_rgba(30,58,138,0.3)] overflow-hidden mb-4 shrink-0">
            <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">YAGEZ TRACKER</h1>
          <p className="text-gray-400 text-sm mt-1 text-center">Sistem Pembukuan Internal</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Password Akses</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                className="w-full bg-black border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-[#00e68a] focus:shadow-[0_0_10px_rgba(0,230,138,0.2)] transition-all"
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
            </div>
            {error && <p className="text-rose-500 text-xs font-bold mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-[#00e68a]/10 hover:bg-[#00e68a]/20 text-[#00e68a] border border-[#00e68a]/40 hover:border-[#00e68a] py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Masuk Sistem
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </form>

      </div>
    </div>
  );
}