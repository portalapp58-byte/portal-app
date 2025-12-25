import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, Plus, FileText, LogOut, Search, Calendar, 
  Image as ImageIcon, ChevronDown, Eye, X, Printer, 
  CheckCircle, Loader2, ZoomIn, ZoomOut, Settings, 
  Save, Trash2, Download, Upload, Shield, CreditCard,
  Building, RefreshCw, Key, Layout, HardDrive,
  AlertTriangle, ArrowRight, Palette, Type, Moon,
  Folder, ArrowLeft, CheckSquare, XSquare, Sun, Filter,
  Wallet, Truck, Percent, ShoppingBag, Camera, Pencil,
  BadgeCheck, TrendingUp, XCircle, Menu, WifiOff, Wifi,
  Database, Info, Bug, Terminal, Activity
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, onSnapshot, query, 
  deleteDoc, doc, serverTimestamp, updateDoc, setDoc, getDocs, writeBatch, where 
} from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- KONFIGURASI DATABASE ---
const USE_ROOT_COLLECTIONS = true; 
const APP_ID_PATH = 'portal-mfg-v1'; 

// --- HELPER UNTUK AKSES DATABASE ---
const getCollection = (colName, forceRoot = false) => {
  if (USE_ROOT_COLLECTIONS || forceRoot) {
    return collection(db, colName);
  }
  return collection(db, 'artifacts', APP_ID_PATH, 'public', 'data', colName);
};

const getDocRef = (colName, docId) => {
  if (USE_ROOT_COLLECTIONS) {
    return doc(db, colName, docId);
  }
  return doc(db, 'artifacts', APP_ID_PATH, 'public', 'data', colName, docId);
};

// --- THEME DEFINITIONS ---
const THEMES = {
  emerald: { name: 'Green', bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500', ring: 'ring-emerald-500', light: 'bg-emerald-50', gradient: 'from-emerald-600 to-teal-600', hover: 'hover:bg-emerald-700' },
  blue: { name: 'Blue', bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', ring: 'ring-blue-500', light: 'bg-blue-50', gradient: 'from-blue-600 to-indigo-600', hover: 'hover:bg-blue-700' },
  slate: { name: 'Slate', bg: 'bg-slate-800', text: 'text-slate-800', border: 'border-slate-800', ring: 'ring-slate-500', light: 'bg-slate-100', gradient: 'from-slate-700 to-slate-900', hover: 'hover:bg-slate-900' },
  violet: { name: 'Purple', bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-600', ring: 'ring-violet-500', light: 'bg-violet-50', gradient: 'from-violet-600 to-fuchsia-600', hover: 'hover:bg-violet-700' },
};

// --- AGENT THEMES ---
const AGENT_GRADIENTS = [
  'from-blue-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-violet-600 to-purple-700',
  'from-rose-600 to-pink-700',
  'from-amber-600 to-orange-700',
  'from-cyan-600 to-blue-700',
  'from-fuchsia-600 to-pink-700',
  'from-slate-600 to-gray-800'
];

const getAgentGradient = (name) => {
  if (!name) return AGENT_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }
  return AGENT_GRADIENTS[hash % AGENT_GRADIENTS.length];
};

// --- UTILS ---
const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
const formatDateShort = (dateStr) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
    } catch (e) { return '-'; }
};
const getMonthName = (monthKey) => {
    if(!monthKey) return '-';
    try {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch (e) { return monthKey; }
};

const compressImage = (file, maxWidth = 800, quality = 0.6, mimeType = 'image/jpeg') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        const width = (scale < 1) ? maxWidth : img.width;
        const height = (scale < 1) ? img.height * scale : img.height;
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(mimeType, quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const DEFAULT_COMPANY = {
  name: "CV. MALANG FLORIST GROUP",
  subname: "Flower Service & Decoration",
  address: "Jl. Candi Bajang Ratu 1 Selatan No 16B, Malang",
  phone: "0822-4444-7883",
  banks: [{ name: "BCA", number: "8161100846" }, { name: "MANDIRI", number: "144-00-1901971-7" }, { name: "BRI", number: "0051-01-208464-50-8" }],
  owner: "M. SYAFRIAN YULIANTO",
  adminPin: "123456",
  kopSurat: null,
  logo: null
};

// --- GLOBAL STYLES ---
const GlobalStyleInjector = ({ mode, fontSize }) => {
  return (
    <style>{`
      :root {
        --bg-main: ${mode === 'dark' ? '#0f172a' : '#f8fafc'};
        --bg-card: ${mode === 'dark' ? '#1e293b' : '#ffffff'};
        --text-main: ${mode === 'dark' ? '#f1f5f9' : '#0f172a'};
        --border: ${mode === 'dark' ? '#334155' : '#e2e8f0'};
        --font-scale: ${fontSize === 'x-small' ? '0.75' : fontSize === 'small' ? '0.85' : fontSize === 'large' ? '1.1' : '1'};
      }
      body { background-color: var(--bg-main); color: var(--text-main); font-size: calc(14px * var(--font-scale)); font-family: system-ui, sans-serif; }
      .card { background-color: var(--bg-card); border: 1px solid var(--border); }
      .input-field { background-color: ${mode === 'dark' ? '#0f172a' : '#fff'}; color: var(--text-main); border: 1px solid var(--border); }
      .settings-scroll::-webkit-scrollbar { width: 6px; }
      .settings-scroll::-webkit-scrollbar-track { background: transparent; }
      .settings-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }

      @media print {
        @page { size: A4 portrait; margin: 0; }
        body { background: white !important; color: black !important; font-size: 12px !important; }
        .no-print, header, .fixed, button { display: none !important; }
        .bg-white { width: 210mm !important; min-height: 297mm !important; margin: 0 !important; page-break-after: always; box-shadow: none !important; border: none !important; transform: none !important; }
        .bg-white:last-child { page-break-after: auto; }
        .grid-cols-3 { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
        img { object-fit: cover !important; }
        .absolute.bottom-12mm { bottom: 12mm !important; }
      }
    `}</style>
  );
};

// --- COMPONENTS ---

const SuccessPopup = () => (
  <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm px-4">
    <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in duration-300 border-4 border-emerald-100 w-full max-w-sm">
      <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
        <CheckCircle className="w-12 h-12 text-white" strokeWidth={3} />
      </div>
      <h3 className="text-2xl font-black text-gray-800 uppercase tracking-wide text-center">DATA TERSIMPAN</h3>
      <p className="text-sm text-gray-500 mt-1 font-medium text-center">Order berhasil diproses.</p>
    </div>
  </div>
);

const NotificationToast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[150] px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 w-[90%] max-w-[350px] animate-in slide-in-from-top-5 fade-in duration-300 ${type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
    {type === 'error' ? <AlertTriangle className="w-4 h-4 flex-shrink-0"/> : <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0"/>}
    <p className="font-bold text-xs flex-1 truncate">{typeof message === 'string' ? message : 'Notifikasi sistem'}</p>
    <button onClick={onClose}><X className="w-3 h-3 opacity-70 hover:opacity-100"/></button>
  </div>
);

const GridOrderCard = ({ item, index, globalIndex }) => {
  return (
    <div className="border border-gray-400 p-1 flex flex-col h-full w-full bg-white relative break-inside-avoid print:border-gray-400 overflow-hidden box-border">
      <div className="absolute top-0 left-0 bg-gray-900 text-white text-[8px] font-bold px-1.5 py-0.5 z-20 print:bg-gray-900 print:text-white rounded-br">#{globalIndex + 1}</div>
      <div className="h-[50%] w-full bg-gray-50 mb-1 overflow-hidden border border-gray-200 relative shrink-0">
        {item.photo ? <img src={item.photo} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[9px]"><ImageIcon className="w-5 h-5 mb-1 opacity-40"/><span>No Foto</span></div>}
      </div>
      <div className="flex-1 flex flex-col justify-between text-[8px] leading-tight min-h-0 px-0.5 pb-0.5">
        <div className="overflow-hidden">
          <div className="flex justify-between text-gray-600 mb-0.5 border-b border-gray-300 pb-0.5">
            <span className="font-medium">{formatDateShort(item.date)}</span>
            <span className="font-bold text-black">Kirim: {formatDateShort(item.deliveryDate)}</span>
          </div>
          <div className="max-h-[22px] overflow-hidden"><p className="font-bold text-gray-900 uppercase text-[8px] leading-3 line-clamp-2">{item.address}</p></div>
          {item.description && <p className="text-gray-500 italic truncate mt-0.5 text-[7px] bg-gray-50 px-1 rounded">{item.description}</p>}
        </div>
        <div className="mt-0.5 bg-gray-50 p-0.5 border border-gray-200 print:bg-transparent print:border-gray-300 shrink-0 rounded-sm">
          <div className="flex justify-between"><span>Harga</span><span>{formatCurrency(item.price)}</span></div>
          <div className="flex justify-between"><span>Ongkir</span><span>{formatCurrency(item.shipping)}</span></div>
          <div className="flex justify-between text-red-600"><span>Fee</span><span>-{formatCurrency(item.fee)}</span></div>
          <div className="border-t border-gray-400 mt-0.5 pt-0.5 flex justify-between font-black text-black text-[9px]"><span>TOTAL</span><span>{formatCurrency(item.totalPayment)}</span></div>
        </div>
      </div>
    </div>
  );
};

const FolderCard = ({ monthKey, stats, status, onClick, onToggleStatus, isAdmin }) => {
  return (
    <div onClick={onClick} className="cursor-pointer group relative">
        <div className="absolute inset-x-0 bottom-0 h-2 bg-black/5 rounded-b-xl transform scale-[0.85] translate-y-1"></div>
        <div className="absolute inset-x-0 bottom-0 h-2 bg-black/5 rounded-b-xl transform scale-[0.92] translate-y-0.5"></div>
        <div className={`relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border-b-4 ${status === 'lunas' ? 'border-b-emerald-500' : 'border-b-amber-400'}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Folder className="w-6 h-6"/></div>
                <div className="flex flex-col items-end">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                    </span>
                    {isAdmin && (
                        <button onClick={(e) => { e.stopPropagation(); onToggleStatus(); }} className="mt-1 text-[9px] text-gray-400 hover:text-gray-600 underline">
                            Ubah Status
                        </button>
                    )}
                </div>
            </div>
            <h3 className="font-black text-gray-800 uppercase text-sm mb-3">{getMonthName(monthKey)}</h3>
            <div className="space-y-1 text-[10px] text-gray-600 border-t border-dashed pt-2">
                <div className="flex justify-between"><span>Total Order</span><span className="font-bold">{stats.count} Unit</span></div>
                <div className="flex justify-between text-red-500"><span>Total Fee</span><span className="font-bold">-{formatCurrency(stats.totalFee)}</span></div>
                <div className="flex justify-between"><span>Total Ongkir</span><span className="font-bold">{formatCurrency(stats.totalOngkir)}</span></div>
                <div className="flex justify-between pt-1 border-t mt-1 font-bold text-gray-900 text-xs"><span>Tagihan</span><span>{formatCurrency(stats.totalPayment)}</span></div>
            </div>
        </div>
    </div>
  );
};

// --- MODALS ---

const OrderFormModal = ({ onClose, onSave, fixedAgentId, defaultDate, notify, agents, initialData }) => {
  const [formData, setFormData] = useState({ 
      agentId: fixedAgentId, 
      date: defaultDate, 
      deliveryDate: defaultDate, 
      address: '', price: '', shipping: '', fee: '', description: '', photo: null 
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
      if (initialData) {
          setFormData({
              ...initialData,
              price: initialData.price || '',
              shipping: initialData.shipping || '',
              fee: initialData.fee || ''
          });
      }
  }, [initialData]);

  const targetAgentName = agents.find(a => a.id === (initialData ? initialData.agentId : fixedAgentId))?.name || 'Mitra';

  const handleFileChange = async (e) => { 
      const file = e.target.files[0]; 
      if (file) { 
          try { 
              const compressed = await compressImage(file, 600, 0.6, 'image/jpeg'); 
              setFormData(prev => ({ ...prev, photo: compressed })); 
              notify("Foto siap!"); 
          } catch (err) { 
              notify("Gagal proses foto", "error"); 
          } 
          e.target.value = ''; 
      } 
  };

  const calculateTotal = () => { 
      const p = parseFloat(formData.price)||0; 
      const s = parseFloat(formData.shipping)||0; 
      const f = parseFloat(formData.fee)||0; 
      return (p + s) - f; 
  };

  const handleSubmit = async (e) => { 
      e.preventDefault(); 
      setLoading(true); 
      if(!formData.address || !formData.price) { 
          notify("Lengkapi Data!", "error"); 
          setLoading(false); 
          return; 
      } 
      
      const payload = { 
          ...formData, 
          totalPayment: calculateTotal(), 
          price: parseFloat(formData.price)||0, 
          shipping: parseFloat(formData.shipping)||0, 
          fee: parseFloat(formData.fee)||0,
          monthKey: formData.date.substring(0, 7)
      };
      
      if (!initialData) {
          payload.createdAt = serverTimestamp();
      }

      await onSave(payload); 
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in supports-[min-h:100dvh]:min-h-[100dvh]">
      <div className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
            <h2 className="text-lg font-black">{initialData ? 'REVISI ORDER' : 'INPUT ORDER'}</h2>
            <button onClick={onClose}><X className="w-5 h-5"/></button>
        </div>
        
        <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex items-center gap-3 shrink-0">
            <div className="bg-white p-2 rounded-full border border-emerald-200 text-emerald-600">
                <User className="w-4 h-4" />
            </div>
            <div>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider leading-none mb-1">
                    {initialData ? 'Edit Data Mitra' : 'Input Untuk Mitra'}
                </p>
                <p className="text-base font-black text-gray-800 uppercase leading-none">{targetAgentName}</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-bold opacity-60 block mb-1">TGL ORDER</label><input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="border w-full rounded p-2 text-sm" /></div><div><label className="text-[10px] font-bold opacity-60 block mb-1">TGL KIRIM</label><input type="date" required value={formData.deliveryDate} onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})} className="border w-full rounded p-2 text-sm" /></div></div>
          <div><label className="text-[10px] font-bold opacity-60 block mb-1">ALAMAT / UCAPAN</label><textarea required rows="2" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="border w-full rounded p-2 text-sm" placeholder="..." /></div>
          <div className="bg-green-50 p-4 rounded border border-green-100"><div className="grid grid-cols-3 gap-2 mb-2"><div><label className="text-[9px] font-bold opacity-60 block mb-1">HARGA</label><input type="number" min="0" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="border w-full p-2 rounded text-right text-sm font-bold"/></div><div><label className="text-[9px] font-bold opacity-60 block mb-1">ONGKIR</label><input type="number" min="0" value={formData.shipping} onChange={(e) => setFormData({...formData, shipping: e.target.value})} className="border w-full p-2 rounded text-right text-sm font-bold"/></div><div><label className="text-[9px] font-bold text-red-500 block mb-1">FEE</label><input type="number" min="0" value={formData.fee} onChange={(e) => setFormData({...formData, fee: e.target.value})} className="border w-full p-2 rounded text-right text-red-600 font-bold text-sm bg-white"/></div></div><div className="flex justify-between pt-2 border-t border-green-200"><span className="text-xs font-bold opacity-60">TOTAL</span><span className="text-xl font-black text-green-700">{formatCurrency(calculateTotal())}</span></div></div>
          <div><label className="text-[10px] font-bold opacity-60 block mb-1">KETERANGAN</label><input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="border w-full rounded p-2 text-sm" placeholder="..." /></div>
          <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:bg-gray-50"><input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />{formData.photo ? <div className="flex flex-col items-center text-green-600"><CheckCircle className="w-6 h-6 mb-1"/><span className="text-xs font-bold">FOTO TERLAMPIR</span><span className="text-[9px] text-gray-400 font-normal">Klik untuk ganti</span></div> : <div className="flex flex-col items-center text-gray-400"><Camera className="w-6 h-6 mb-1"/><span className="text-xs">Upload Bukti Foto</span></div>}</div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-black text-white rounded font-bold shadow-lg">{initialData ? 'UPDATE DATA' : 'SIMPAN DATA'}</button>
        </form>
      </div>
    </div>
  );
};

const SettingsModal = ({ onClose, companyInfo, agents, onUpdateCompany, notify, display, onUpdateDisplay }) => {
  const [activeTab, setActiveTab] = useState('display');
  const [tempCompany, setTempCompany] = useState(companyInfo);
  const [newAgent, setNewAgent] = useState({ name: '', code: '' });
  const [loading, setLoading] = useState(false);
  const kopSuratInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const restoreInputRef = useRef(null);
  
  const handleAddAgent = async (e) => { e.preventDefault(); if (!newAgent.name || !newAgent.code) return notify("Isi semua!", "error"); setLoading(true); await addDoc(getCollection('agents'), { ...newAgent, createdAt: serverTimestamp() }); setNewAgent({name:'',code:''}); setLoading(false); notify("Mitra ditambah!"); };
  const handleDeleteAgent = async (id) => { if (confirm("Hapus mitra?")) await deleteDoc(getDocRef('agents', id)); };
  const handleLogoChange = async (e) => { const file = e.target.files[0]; if(file) { const c = await compressImage(file, 300, 1.0, 'image/png'); setTempCompany({...tempCompany, logo: c}); notify("Logo siap simpan"); } };
  const handleKopChange = async (e) => { const file = e.target.files[0]; if(file) { const c = await compressImage(file, 800, 0.7, 'image/jpeg'); setTempCompany({...tempCompany, kopSurat: c}); notify("Kop siap simpan"); } };
  const handleSaveCompany = async () => { setLoading(true); await setDoc(getDocRef('settings_company', 'main'), tempCompany); onUpdateCompany(tempCompany); setLoading(false); notify("Disimpan!"); };
  const handleSaveDisplay = () => { localStorage.setItem('mfg_display_settings', JSON.stringify(display)); notify("Tampilan disimpan!"); };
  
  const handleBackup = async () => {
    setLoading(true);
    const ag = await getDocs(getCollection('agents'));
    const od = await getDocs(getCollection('orders'));
    const st = await getDocs(getCollection('monthly_status'));
    const data = { timestamp: new Date().toISOString(), company: tempCompany, agents: ag.docs.map(d=>d.data()), orders: od.docs.map(d=>d.data()), status: st.docs.map(d=>d.data()) };
    const a = document.createElement('a'); a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data)); a.download = "MFG_BACKUP.json"; document.body.appendChild(a); a.click(); a.remove(); setLoading(false); notify("Downloaded!");
  };
  
  const handleRestore = async (e) => {
      const f = e.target.files[0]; if(!f) return;
      if(!confirm("Data lama akan tertimpa. Lanjut?")) return;
      setLoading(true);
      const r = new FileReader(); r.onload = async(ev) => {
          try {
             const d = JSON.parse(ev.target.result);
             const b = writeBatch(db);
             if(d.company) b.set(getDocRef('settings_company', 'main'), d.company);
             if(d.agents) d.agents.forEach(x => b.set(getDocRef('agents', x.id || Date.now().toString()), x));
             if(d.orders) d.orders.forEach(x => b.set(getDocRef('orders', x.id || Date.now().toString()), x));
             if(d.status) d.status.forEach(x => b.set(getDocRef('monthly_status', x.id || Date.now().toString()), x));
             await b.commit(); setTimeout(()=>window.location.reload(), 1000);
          } catch(err) { notify("Error restore", "error"); }
          setLoading(false);
      }; r.readAsText(f);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm font-sans animate-in fade-in duration-200 supports-[min-h:100dvh]:min-h-[100dvh]">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl ring-1 ring-gray-200">
        {/* Responsive Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 flex flex-col shrink-0">
           <div className="hidden md:flex items-center gap-3 mb-8 text-gray-800 px-2"><Settings className="w-6 h-6"/><h2 className="text-lg font-black tracking-wide uppercase">SETTING</h2></div>
           <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 md:space-y-1 pb-2 md:pb-0 scrollbar-hide">
              {[{id: 'display', icon: Layout, label: 'Tampilan'},{id: 'user', icon: User, label: 'Akun'},{id: 'company', icon: Building, label: 'Profil'},{id: 'backup', icon: HardDrive, label: 'Backup'}].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-shrink-0 md:w-full text-left px-4 py-2 md:py-3 rounded-lg font-bold text-xs md:text-sm flex items-center gap-2 md:gap-3 transition-all whitespace-nowrap ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-gray-500 hover:bg-gray-100 bg-white md:bg-transparent border md:border-0'}`}><item.icon className="w-4 h-4" /> {item.label}</button>
              ))}
           </nav>
           <button onClick={onClose} className="hidden md:block w-full py-3 border border-gray-300 rounded-lg font-bold text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors mt-auto">TUTUP</button>
        </div>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-white settings-scroll relative">
           <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500"><X className="w-5 h-5"/></button>
           {activeTab === 'display' && (
               <div className="space-y-8 animate-in slide-in-from-right-4">
                   <div><h3 className="font-black text-gray-800 text-xs uppercase mb-4 flex items-center gap-2"><Palette className="w-4 h-4"/> Warna Tema</h3><div className="grid grid-cols-4 gap-4">{Object.entries(THEMES).map(([key, val]) => (<button key={key} onClick={() => onUpdateDisplay({...display, theme: key})} className={`p-2 md:p-4 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${display.theme === key ? `border-${val.name === 'Green' ? 'emerald' : val.name.toLowerCase()}-500 bg-gray-50 ring-2 ring-offset-2 ring-${val.name === 'Green' ? 'emerald' : val.name.toLowerCase()}-200` : 'border-gray-100 hover:border-gray-300'}`}><div className={`w-6 h-6 md:w-8 md:h-8 rounded-full ${val.bg} shadow-sm`}></div><span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide text-gray-600 hidden md:block">{val.name.toUpperCase()}</span></button>))}</div></div>
                   <div><h3 className="font-black text-gray-800 text-xs uppercase mb-4 flex items-center gap-2"><Type className="w-4 h-4"/> Ukuran Font</h3><div className="flex bg-gray-100 p-1 rounded-lg">{['x-small', 'small', 'normal', 'large'].map(s => (<button key={s} onClick={() => onUpdateDisplay({...display, fontSize: s})} className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${display.fontSize === s ? 'bg-white text-emerald-600 shadow-md transform scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}>{s}</button>))}</div></div>
                   <div><h3 className="font-black text-gray-800 text-xs uppercase mb-4 flex items-center gap-2"><Moon className="w-4 h-4"/> Mode Layar</h3><div className="flex bg-gray-100 p-1 rounded-lg"><button onClick={() => onUpdateDisplay({...display, mode: 'light'})} className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${display.mode === 'light' ? 'bg-white text-emerald-600 shadow-md transform scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}>Terang</button><button onClick={() => onUpdateDisplay({...display, mode: 'dark'})} className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${display.mode === 'dark' ? 'bg-gray-800 text-white shadow-md transform scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}>Gelap</button></div></div>
                   <button onClick={handleSaveDisplay} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all mt-4">Simpan Tampilan</button>
               </div>
           )}
           {activeTab === 'company' && (
               <div className="space-y-6 animate-in slide-in-from-right-4">
                   <div className="grid grid-cols-2 gap-4 md:gap-6">
                       <div onClick={()=>logoInputRef.current.click()} className="group border-2 border-dashed border-gray-200 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all relative overflow-hidden h-32 md:h-40"><label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase mb-2 group-hover:text-emerald-500 text-center">Logo Perusahaan</label>{tempCompany.logo ? <img src={tempCompany.logo} className="h-16 md:h-20 object-contain"/> : <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:text-emerald-400"><ImageIcon className="w-6 h-6 md:w-8 md:h-8"/></div>}<input ref={logoInputRef} type="file" hidden onChange={handleLogoChange}/></div>
                       <div onClick={()=>kopSuratInputRef.current.click()} className="group border-2 border-dashed border-gray-200 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all relative overflow-hidden h-32 md:h-40"><label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase mb-2 group-hover:text-emerald-500 text-center">Kop Surat (Banner)</label>{tempCompany.kopSurat ? <img src={tempCompany.kopSurat} className="h-full w-full object-contain"/> : <div className="w-full h-12 md:h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:text-emerald-400"><ImageIcon className="w-6 h-6 md:w-8 md:h-8"/></div>}<input ref={kopSuratInputRef} type="file" hidden onChange={handleKopChange}/></div>
                   </div>
                   <div className="space-y-4">
                       <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Perusahaan (PT/CV)</label><input value={tempCompany.name} onChange={e=>setTempCompany({...tempCompany,name:e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-sm font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"/></div>
                       <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Slogan / Sub-Nama</label><input value={tempCompany.subname} onChange={e=>setTempCompany({...tempCompany,subname:e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-emerald-500 outline-none"/></div>
                       <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alamat Lengkap</label><textarea value={tempCompany.address} onChange={e=>setTempCompany({...tempCompany,address:e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-emerald-500 outline-none" rows="2"/></div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">No. Telepon</label><input value={tempCompany.phone} onChange={e=>setTempCompany({...tempCompany,phone:e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono focus:border-emerald-500 outline-none"/></div>
                           <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Penanggung Jawab</label><input value={tempCompany.owner} onChange={e=>setTempCompany({...tempCompany,owner:e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-sm font-bold focus:border-emerald-500 outline-none"/></div>
                       </div>
                   </div>
                   <div className="pt-4 border-t border-gray-100"><h3 className="font-black text-gray-800 text-xs uppercase mb-3">Rekening Bank</h3><div className="space-y-2">{tempCompany.banks.map((b,i)=><div key={i} className="flex gap-2"><input placeholder="Bank" value={b.name} onChange={e=>{const n=[...tempCompany.banks];n[i].name=e.target.value;setTempCompany({...tempCompany,banks:n})}} className="w-1/3 p-3 border border-gray-300 rounded-lg text-xs font-bold uppercase"/><input placeholder="Nomor Rekening" value={b.number} onChange={e=>{const n=[...tempCompany.banks];n[i].number=e.target.value;setTempCompany({...tempCompany,banks:n})}} className="w-2/3 p-3 border border-gray-300 rounded-lg text-sm font-mono"/></div>)}</div></div>
                   <button onClick={handleSaveCompany} disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">Simpan Profil</button>
               </div>
           )}
           {activeTab === 'user' && (
               <div className="space-y-8 animate-in slide-in-from-right-4">
                   <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col gap-4"><div><h4 className="text-sm font-black text-blue-900 uppercase flex items-center gap-2"><Shield className="w-4 h-4"/> PIN Administrator</h4><p className="text-xs text-blue-600/70 mt-1">Digunakan untuk login sebagai admin.</p></div><div className="flex gap-2"><input value={tempCompany.adminPin} onChange={e=>setTempCompany({...tempCompany,adminPin:e.target.value})} className="flex-1 border-2 border-blue-200 p-3 rounded-lg text-center font-mono font-black text-xl tracking-[0.5em] text-blue-900 focus:border-blue-500 outline-none"/><button onClick={handleSaveCompany} className="bg-blue-600 text-white px-6 rounded-lg font-bold text-sm hover:bg-blue-700">UPDATE</button></div></div>
                   <div>
                       <div className="flex justify-between items-end mb-4 border-b pb-2"><div><h4 className="text-sm font-black text-gray-800 uppercase">Daftar Mitra Agen</h4><p className="text-xs text-gray-400 mt-1">Kelola akses login untuk mitra.</p></div><div className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">{agents.length} Mitra</div></div>
                       <div className="bg-gray-50 border border-gray-200 rounded-xl p-1 mb-4 max-h-60 overflow-y-auto">{agents.length === 0 ? <div className="text-center py-8 text-gray-400 text-xs">Belum ada mitra terdaftar.</div> : agents.map(a=>(<div key={a.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 mb-1 last:mb-0 hover:border-emerald-200 group transition-all"><div><p className="font-bold text-gray-800 text-sm">{a.name}</p><span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200">KODE: {a.code}</span></div><button onClick={()=>handleDeleteAgent(a.id)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 className="w-4 h-4"/></button></div>))}</div>
                       <div className="bg-white border-2 border-dashed border-gray-300 p-4 rounded-xl"><p className="text-[10px] font-bold text-gray-400 uppercase mb-3 text-center">Tambah Mitra Baru</p><div className="flex flex-col md:flex-row gap-3"><input placeholder="Nama Mitra" value={newAgent.name} onChange={e=>setNewAgent({...newAgent,name:e.target.value})} className="flex-1 p-3 border border-gray-300 rounded-lg text-sm font-bold outline-none focus:border-emerald-500"/><input placeholder="KODE UNIK" value={newAgent.code} onChange={e=>setNewAgent({...newAgent,code:e.target.value})} className="w-full md:w-1/3 p-3 border border-gray-300 rounded-lg text-sm font-mono uppercase outline-none focus:border-emerald-500"/><button onClick={handleAddAgent} disabled={loading} className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-black text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 w-full md:w-auto">+</button></div></div>
                   </div>
               </div>
           )}
           {activeTab === 'backup' && (
               <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in zoom-in py-10">
                   <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-2 ring-8 ring-blue-50/50"><HardDrive className="w-10 h-10"/></div>
                   <div className="text-center max-w-xs"><h3 className="text-lg font-black text-gray-800">BACKUP & RESTORE</h3><p className="text-sm text-gray-500 mt-2">Amankan data transaksi Anda secara berkala atau pulihkan data dari file JSON.</p></div>
                   <div className="w-full max-w-xs space-y-3"><button onClick={handleBackup} disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"><Download className="w-4 h-4"/> DOWNLOAD DATABASE</button><div className="relative"><input ref={restoreInputRef} type="file" className="hidden" accept=".json" onChange={handleRestore}/><button onClick={() => restoreInputRef.current.click()} disabled={loading} className="w-full bg-white border-2 border-gray-200 text-gray-600 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:border-gray-400 hover:text-gray-800 transition-all"><Upload className="w-4 h-4"/> UPLOAD FILE BACKUP</button></div></div>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

// REPORT PREVIEW MODAL
const ReportPreviewModal = ({ onClose, agentName, month, orders, stats, companyInfo, notify }) => {
  const handlePrint = () => window.print();
  const handlePdf = () => {
      // FIX: Ensure script doesn't duplicate and is ready
      if (!window.html2pdf) {
          const script = document.createElement('script');
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = () => executePdf();
          document.body.appendChild(script);
      } else {
          executePdf();
      }

      function executePdf() {
         const element = document.getElementById('report-content');
         const opt = { margin: 0, filename: `Laporan_${agentName || 'All'}_${month}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
         window.html2pdf().set(opt).from(element).save().then(() => { if(notify) notify("PDF berhasil diunduh!", "success"); });
      }
  };

  const [zoomLevel, setZoomLevel] = useState(0.5);
  const ITEMS_PER_PAGE = 9; 
  const pages = [];
  for (let i = 0; i < orders.length; i += ITEMS_PER_PAGE) pages.push(orders.slice(i, i + ITEMS_PER_PAGE));
  if (pages.length === 0) pages.push([]);

  useEffect(() => {
    const handleResize = () => setZoomLevel(Math.min((window.innerWidth - 32) / 820, 1));
    handleResize(); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center animate-in fade-in duration-300 supports-[min-h:100dvh]:min-h-[100dvh]">
      <div className="w-full bg-gray-900 border-b border-gray-800 p-3 flex justify-between items-center z-50 print:hidden shadow-lg shrink-0">
         <div className="text-white flex flex-col"><h3 className="font-bold text-sm flex items-center gap-2">Preview Laporan</h3></div>
         <div className="flex gap-2"><button onClick={handlePdf} className="bg-red-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold text-xs flex gap-2 hover:bg-red-700 transition-colors"><Download className="w-4 h-4"/><span className="hidden md:inline">Download PDF</span></button><button onClick={handlePrint} className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold text-xs flex gap-2 hover:bg-blue-700 transition-colors"><Printer className="w-4 h-4"/><span className="hidden md:inline">Cetak</span></button><button onClick={onClose} className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700"><X className="w-5 h-5"/></button></div>
      </div>
      <div className="flex-1 w-full overflow-auto p-4 print:p-0 flex flex-col items-center">
        <div id="report-content" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', width: '210mm' }} className="print:transform-none print:w-full">
            {/* Page 1: Invoice */}
            <div className="bg-white text-black shadow-2xl mb-8 relative flex flex-col print:shadow-none print:mb-0 print:break-after-page box-border overflow-hidden" style={{ width: '210mm', height: '296mm', padding: '20mm' }}>
                <div className="border-b-4 border-double border-gray-900 pb-6 mb-8 text-center h-[40mm] flex flex-col justify-end">
                    {companyInfo.kopSurat ? <img src={companyInfo.kopSurat} className="w-full h-full object-contain object-bottom"/> : <div className="flex flex-col items-center justify-end h-full">{companyInfo.logo && <img src={companyInfo.logo} className="h-16 mb-2 object-contain"/>}<h1 className="text-3xl font-black text-gray-900 tracking-wide leading-none mb-2">{companyInfo.name}</h1><p className="text-sm font-bold text-gray-600 uppercase tracking-[0.2em]">{companyInfo.subname}</p><div className="mt-4 text-xs text-gray-500 font-medium"><p>{companyInfo.address}</p><p>Telp: {companyInfo.phone}</p></div></div>}
                </div>
                <div className="text-center mb-10"><h2 className="text-3xl font-black uppercase text-gray-800 underline decoration-4 decoration-green-600 underline-offset-8">INVOICE TAGIHAN</h2><p className="text-sm text-gray-500 mt-2 font-medium tracking-wide">PERIODE: {month ? month.toUpperCase() : '-'}</p></div>
                <div className="flex justify-between items-start mb-10">
                   <div className="w-[48%]"><p className="text-xs font-bold text-gray-400 uppercase mb-1">DITAGIHKAN KEPADA:</p><div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><p className="font-bold text-xl text-gray-800 uppercase leading-tight">{agentName || '-'}</p><p className="text-sm text-gray-500 mt-1">Mitra Agen Resmi</p></div></div>
                   <div className="w-[48%] text-right"><p className="text-xs font-bold text-gray-400 uppercase mb-1">RINGKASAN:</p><div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><p className="text-sm text-gray-600">Total Transaksi</p><p className="font-black text-3xl text-gray-800">{stats.count} <span className="text-sm font-normal text-gray-500">Unit</span></p></div></div>
                </div>
                
                {/* --- SUMMARY BOX (Centered and Wider) --- */}
                <div className="flex justify-center mb-10">
                    <div className="w-full max-w-xl border-2 border-gray-300 rounded-xl overflow-hidden text-sm shadow-md">
                        <div className="flex justify-between p-4 border-b border-gray-200 bg-white items-center">
                            <span className="font-bold text-gray-500 uppercase text-xs tracking-wider">Total Harga</span>
                            <span className="font-black text-xl text-gray-800">{formatCurrency(stats.totalHarga)}</span>
                        </div>
                        <div className="flex justify-between p-4 border-b border-gray-200 bg-white items-center">
                            <span className="font-bold text-gray-500 uppercase text-xs tracking-wider">Total Ongkir</span>
                            <span className="font-black text-xl text-gray-800">{formatCurrency(stats.totalOngkir)}</span>
                        </div>
                        <div className="flex justify-between p-4 border-b border-gray-200 bg-red-50 text-red-600 items-center">
                            <span className="font-bold uppercase text-xs tracking-wider">Fee Agen</span>
                            <span className="font-black text-xl">({formatCurrency(stats.totalFee)})</span>
                        </div>
                        <div className="flex justify-between p-6 bg-gray-900 text-white items-center">
                            <span className="font-bold opacity-80 uppercase text-sm tracking-widest">Total Bayar</span>
                            <span className="font-black text-4xl">{formatCurrency(stats.totalPayment)}</span>
                        </div>
                    </div>
                </div>
                
                {/* --- BANK & INFO SECTION (Wide) --- */}
                <div className="mb-8">
                    <div className="mb-4 border-l-4 border-gray-800 pl-4 py-2 bg-gray-50/50 rounded-r-lg">
                        <p className="font-bold text-gray-800 text-xs mb-2">REKENING PEMBAYARAN:</p>
                        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs font-mono text-gray-600">
                            {companyInfo.banks.map((b,i)=> (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="font-bold text-gray-800">{b.name}</span>
                                    <span>{b.number}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">a.n. {companyInfo.owner}</p>
                    </div>
                    <div className="text-center italic text-gray-500 text-xs py-2 border-t border-gray-100">
                        "Terima kasih atas kepercayaan dan kerjasama Anda kepada kami."
                    </div>
                </div>

                {/* --- SIGNATURES --- */}
                <div className="flex justify-between items-end px-8 mt-auto">
                    <div className="text-center">
                        <p className="mb-16 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Diterima Oleh</p>
                        <p className="font-bold border-t border-gray-300 pt-2 min-w-[120px] text-xs uppercase">Mitra: {agentName || '-'}</p>
                    </div>
                    <div className="text-center">
                        <p className="mb-16 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hormat Kami</p>
                        <p className="font-bold border-t border-gray-300 pt-2 min-w-[120px] text-xs">{companyInfo.name}</p>
                    </div>
                </div>
            </div>
            {/* Subsequent Pages: Grid Orders */}
            {pages.map((pageItems, pageIndex) => (
              <div key={pageIndex} className="bg-white text-black shadow-2xl mb-8 relative flex flex-col print:shadow-none print:mb-0 print:break-after-page box-border overflow-hidden" style={{ width: '210mm', height: '296mm', padding: '10mm 12mm 15mm 12mm' }}>
                <div className="border-b-2 border-gray-200 pb-2 mb-3 flex justify-between items-end h-[15mm] shrink-0"><div><h2 className="font-black text-gray-800 text-xl leading-none uppercase tracking-tight">DETAIL KETERANGAN ORDER</h2><p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">{agentName || '-'} • {month}</p></div><div className="text-right"><span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-bold text-gray-600 border border-gray-200">Halaman {pageIndex + 1} dari {pages.length}</span></div></div>
                <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-3 h-full">
                    {pageItems.map((item, idx) => <GridOrderCard key={item.id} item={item} index={idx} globalIndex={(pageIndex * ITEMS_PER_PAGE) + idx} />)}
                    {Array.from({ length: 9 - pageItems.length }).map((_, i) => <div key={`empty-${i}`} className="border border-gray-100 border-dashed rounded-lg bg-gray-50/30"></div>)}
                </div>
                <div className="text-center text-[9px] text-gray-400 mt-3 font-medium tracking-wider uppercase">Dokumen Lampiran Resmi {companyInfo.name} • Halaman {pageIndex + 2}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// LOGIN SCREEN
const LoginScreen = ({ onLogin, agents, adminPin, notify, companyLogo, connectionStatus }) => {
  const [activeTab, setActiveTab] = useState('mitra');
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isMounted = useRef(true);

  useEffect(() => { return () => { isMounted.current = false; }; }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!inputCode.trim()) { setError("Mohon isi kode terlebih dahulu"); return; }
    
    setLoading(true);

    try {
        const code = inputCode.trim();
        
        // 1. ADMIN LOGIN (Immediate Check)
        const validAdminPin = adminPin || "123456";
        if (activeTab === 'admin') {
            if (code === validAdminPin) {
                onLogin({ role: 'admin', name: 'Admin Pusat' });
                return; // Component will unmount
            } else {
                throw new Error("PIN Salah!");
            }
        }

        // 2. MITRA LOGIN
        // A. Cek di data yang sudah ter-load (Synchronous)
        let agent = agents.find(a => String(a.code).trim().toLowerCase() === code.toLowerCase());
        
        if (agent) {
             onLogin({ ...agent, role: 'agent' });
             return;
        }

        // B. Coba fetch ke DB (Asynchronous dengan Timeout)
        // Promise Race: Fetch vs Timeout
        const fetchPromise = (async () => {
             // Try lowercase
             let collRef = getCollection('agents');
             let snap = await getDocs(collRef);
             if(snap.empty) {
                 collRef = getCollection('Agents', true);
                 snap = await getDocs(collRef);
             }
             return snap.docs.map(d => ({id: d.id, ...d.data(), code: d.data().code || d.data().Code || d.data().kode || d.data().KODE }));
        })();

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        try {
            const remoteAgents = await Promise.race([fetchPromise, timeoutPromise]);
            agent = remoteAgents.find(a => String(a.code).trim().toLowerCase() === code.toLowerCase());
        } catch (err) {
            console.error("Remote check failed:", err);
        }

        if (agent) {
            onLogin({ ...agent, role: 'agent' });
        } else {
            throw new Error("Kode Tidak Ditemukan");
        }

    } catch (err) {
        console.error("Login Error:", err);
        setError(err.message || "Gagal Login");
        setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden supports-[min-h:100dvh]:min-h-[100dvh]">
      {/* Background Blobs - Adjusted for mobile */}
      <div className="absolute top-[-10%] right-[-20%] w-[80%] h-[60%] bg-blue-200/40 rounded-full blur-[80px] md:blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-20%] w-[80%] h-[60%] bg-emerald-200/40 rounded-full blur-[80px] md:blur-[100px]"></div>
      
      {/* CASPER BACKGROUND IMAGE - MASSIVE SIZE on Left */}
      <img 
        src="https://pngimg.com/uploads/casper/casper_PNG6.png" 
        alt="Casper Background"
        className="absolute top-1/2 left-[-50%] md:left-[-15%] transform -translate-y-1/2 h-[110vh] md:h-[120vh] w-auto opacity-15 pointer-events-none z-0 animate-pulse object-contain transition-all duration-500"
        style={{ animationDuration: '4s' }}
      />

      <div className="w-full max-w-[350px] z-10 animate-in fade-in zoom-in duration-500 relative">
        <div className="text-center mb-6">
          <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center mx-auto -mb-2 translate-y-3 relative z-10">{companyLogo ? <img src={companyLogo} className="w-full h-full object-contain drop-shadow-2xl"/> : <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center shadow-lg"><FileText className="w-7 h-7 md:w-8 md:h-8 text-black" /></div>}</div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-widest mt-0 relative z-0 drop-shadow-sm whitespace-nowrap">MFG PORTAL</h1>
          <p className="text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded-full border border-emerald-100">Integrated Management System</p>
        </div>
        
        {/* Connection Status Indicator */}
        <div className={`mb-4 flex flex-col items-center justify-center gap-1`}>
            <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200`}>
                <Wifi className="w-3 h-3"/>
                <span>{connectionStatus}</span>
            </div>
        </div>

        <div className={`bg-white/90 backdrop-blur-md border-2 ${error ? 'border-red-500 animate-shake' : 'border-emerald-500/30'} rounded-xl shadow-2xl overflow-hidden p-4 transition-all`}>
          <div className="flex bg-emerald-50/50 p-1 rounded-xl mb-6 gap-2"><button onClick={() => { setActiveTab('mitra'); setInputCode(""); setError(""); }} className={`flex-1 py-3 md:py-4 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${activeTab === 'mitra' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-emerald-700 hover:bg-emerald-100 bg-emerald-50/50'}`}>Mitra</button><button onClick={() => { setActiveTab('admin'); setInputCode(""); setError(""); }} className={`flex-1 py-3 md:py-4 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${activeTab === 'admin' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100 bg-gray-50'}`}>Admin</button></div>
          <form onSubmit={handleSubmit} className="pb-2">
              <div className="relative mb-2">
                  <input type={activeTab === 'admin' ? "password" : "text"} value={inputCode} onChange={(e) => { setInputCode(e.target.value); setError(""); }} className={`block w-full py-4 bg-gray-100 border ${error ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl text-center text-lg font-black text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all uppercase tracking-[0.2em] shadow-inner`} placeholder={activeTab === 'mitra' ? "KODE" : "PIN"} autoFocus />
              </div>
              {error && (<div className="flex items-center justify-center gap-2 text-red-500 mb-4 animate-in fade-in slide-in-from-top-1"><XCircle className="w-4 h-4" /><p className="text-xs font-bold">{error}</p></div>)}
              {!error && (
                  <div className="text-center mb-6">
                      <p className="text-[10px] text-gray-400 font-medium italic">
                          {activeTab === 'mitra' ? 'Masukkan Kode Akses Mitra' : 'Masukkan PIN Keamanan Admin'}
                      </p>
                  </div>
              )}
              <button disabled={loading} className={`w-full py-3.5 rounded-xl text-xs font-black shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${activeTab === 'mitra' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200' : 'bg-gray-900 hover:bg-black text-white'}`}>{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'MASUK KE SISTEM'}</button>
          </form>
        </div>
        
        {/* Version Footer */}
        <div className="mt-8 text-center">
            <p className="text-[9px] text-gray-400 opacity-50">v8.6 (Mobile Ready)</p>
        </div>
        
      </div>
    </div>
  );
};

// --- 6. MAIN APP ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(DEFAULT_COMPANY);
  const [monthlyStatus, setMonthlyStatus] = useState({});
  const [display, setDisplay] = useState(() => { try { const s = JSON.parse(localStorage.getItem('mfg_display_settings')); return { theme: 'emerald', fontSize: 'normal', mode: 'light', ...s }; } catch { return { theme: 'emerald', fontSize: 'normal', mode: 'light' }; } });
  const [viewMode, setViewMode] = useState('folders'); 
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [notify, setNotify] = useState(null);
  const [modals, setModals] = useState({ add: false, preview: false, settings: false });
  const [successPopup, setSuccessPopup] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('all'); 
  const [editingOrder, setEditingOrder] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Loading...');
  const [dashboardReady, setDashboardReady] = useState(false);

  const currentTheme = THEMES[display?.theme] || THEMES.emerald;
  const showNotify = (msg, type='success') => { setNotify({ message: msg, type }); setTimeout(() => setNotify(null), 3000); };

  useEffect(() => {
    const init = async () => {
        try {
            // Attempt Anonymous Sign In
            await signInAnonymously(auth).catch((e) => {
                console.error("Auth Failed:", e);
                setConnectionStatus("Auth Failed");
            });
            
            setConnectionStatus("Terhubung (Memuat Data...)");

            // Listeners
            const unsubscribeAgents = onSnapshot(getCollection('agents'), (s) => { 
                console.log("Agents snapshot received. Count:", s.size);
                const fetchedAgents = s.docs.map(d => {
                    const data = d.data();
                    // Smart Mapping to handle inconsistent capitalization
                    return {
                        id: d.id,
                        ...data,
                        code: data.code || data.Code || data.kode || data.Kode || data.KODE
                    };
                });
                
                if (fetchedAgents.length === 0 && !localStorage.getItem('mfg_seeded')) { 
                   try {
                     addDoc(getCollection('agents'), { name: "Mitra A (Contoh)", code: "A001", createdAt: serverTimestamp() }); 
                     localStorage.setItem('mfg_seeded', 'true'); 
                   } catch(err) {
                       console.warn("Seeding failed (permission denied?), ignoring.", err);
                   }
                } 
                setAgents(fetchedAgents); 
                
                if (fetchedAgents.length > 0) {
                    setConnectionStatus("Siap Digunakan");
                } else {
                    setConnectionStatus("Data Kosong");
                }

            }, (error) => {
                console.error("Agents Snapshot Error:", error);
                setConnectionStatus("Permission Denied");
            });

            onSnapshot(getDocRef('settings_company', 'main'), (d) => { 
                if(d.exists()) setCompanyInfo(d.data()); 
            }, (e) => console.log("Company info read error (ignorable for demo)", e));

            onSnapshot(getCollection('monthly_status'), (s) => { 
                const statusMap = {}; 
                s.docs.forEach(d => { statusMap[d.id] = d.data().status; }); 
                setMonthlyStatus(statusMap); 
            }, (e) => console.log("Monthly status read error", e));
            
            return () => {
                unsubscribeAgents();
            };

        } catch (error) {
            console.error("Firebase Init General Error:", error);
            setConnectionStatus("Connection Error");
        }
    }; 
    init();
  }, []);

  useEffect(() => { 
      if (!currentUser) return; 
      
      const q = query(getCollection('orders'));
      const unsub = onSnapshot(q, (s) => { 
          // SANITIZE DATA TO PREVENT CRASHES
          const d = s.docs.map(d => {
              const data = d.data();
              return { 
                  id: d.id, 
                  ...data,
                  // Ensure numeric values are numbers
                  price: parseFloat(data.price) || 0,
                  shipping: parseFloat(data.shipping) || 0,
                  fee: parseFloat(data.fee) || 0,
                  totalPayment: parseFloat(data.totalPayment) || 0
              };
          }).filter(item => {
              // Filter out bad dates
              return item.date && !isNaN(new Date(item.date).getTime());
          });

          d.sort((a, b) => new Date(b.date) - new Date(a.date)); 
          setOrders(d); 
      }, (err) => {
          console.error("Orders Snapshot Error:", err);
      });
      return () => unsub();
  }, [currentUser]);

  // Dashboard Ready Effect
  useEffect(() => {
      if (currentUser) {
          // Simulate loading delay for smooth transition
          const timer = setTimeout(() => setDashboardReady(true), 500);
          return () => clearTimeout(timer);
      } else {
          setDashboardReady(false);
      }
  }, [currentUser]);

  const handleSaveOrder = async (d) => { 
      try { 
          if (d.id) { 
              const { id, ...data } = d; 
              await updateDoc(getDocRef('orders', id), data); 
              showNotify("Data diperbarui!"); 
          } else { 
              await addDoc(getCollection('orders'), d); 
              showNotify("Data tersimpan!"); 
          } 
          setModals({...modals, add: false}); setEditingOrder(null); setSuccessPopup(true); setTimeout(() => setSuccessPopup(false), 1500); 
      } catch (err) { console.error(err); showNotify("Gagal menyimpan (File Terlalu Besar atau Permission Error)", "error"); } 
  };
  
  const handleDeleteOrder = async (id) => { 
      if (confirm("Hapus?")) { 
          await deleteDoc(getDocRef('orders', id)); 
          showNotify("Terhapus"); 
      } 
  };

  const handleEditOrder = (order) => { setEditingOrder(order); setModals({...modals, add: true}); };
  const filteredOrders = useMemo(() => { if (!currentUser) return []; let res = orders; if (currentUser.role === 'agent') res = res.filter(o => o.agentId === currentUser.id); else if (selectedAgentId !== 'all') res = res.filter(o => o.agentId === selectedAgentId); return res; }, [orders, currentUser, selectedAgentId]);
  
  // SAFE FOLDER CALCULATION
  const folders = useMemo(() => { 
      try {
        const currentYear = new Date().getFullYear(); const allMonths = []; const groups = {}; 
        filteredOrders.forEach(o => { 
            const mKey = o.monthKey; 
            if (!mKey) return; // Skip invalid keys
            if (!groups[mKey]) groups[mKey] = { count: 0, totalFee: 0, totalOngkir: 0, totalPayment: 0, totalHarga: 0 }; 
            groups[mKey].count += 1; 
            groups[mKey].totalFee += o.fee; 
            groups[mKey].totalOngkir += o.shipping; 
            groups[mKey].totalPayment += o.totalPayment; 
            groups[mKey].totalHarga += o.price; 
        }); 
        for (let i = 0; i < 12; i++) { 
            const monthNum = String(i + 1).padStart(2, '0'); 
            const key = `${currentYear}-${monthNum}`; 
            allMonths.push({ key: key, stats: groups[key] || { count: 0, totalFee: 0, totalOngkir: 0, totalPayment: 0, totalHarga: 0 } }); 
        } 
        return allMonths; 
      } catch (e) {
          console.error("Folder calculation error", e);
          return [];
      }
  }, [filteredOrders]);

  // SAFE CURRENT MONTH STATS
  const currentMonthStats = useMemo(() => { 
      try {
        const now = new Date(); const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; 
        const currentOrders = filteredOrders.filter(o => o.monthKey === currentMonthKey); 
        return currentOrders.reduce((acc, o) => ({ count: acc.count + 1, totalHarga: acc.totalHarga + o.price, totalFee: acc.totalFee + o.fee, totalOngkir: acc.totalOngkir + o.shipping, totalPayment: acc.totalPayment + o.totalPayment }), { count: 0, totalHarga: 0, totalFee: 0, totalOngkir: 0, totalPayment: 0 }); 
      } catch(e) {
          console.error("Stats calculation error", e);
          return { count: 0, totalHarga: 0, totalFee: 0, totalOngkir: 0, totalPayment: 0 };
      }
  }, [filteredOrders]);
  
  const toggleMonthStatus = async (monthKey) => { 
      if(currentUser.role !== 'admin') return; 
      const targetAgentId = currentUser.role === 'agent' ? currentUser.id : selectedAgentId; 
      if(targetAgentId === 'all') { showNotify("Pilih Mitra spesifik untuk ubah status!", "error"); return; } 
      
      const docId = `status_${monthKey}_${targetAgentId}`; 
      const currentStatus = monthlyStatus[docId] || 'belum'; 
      const newStatus = currentStatus === 'lunas' ? 'belum' : 'lunas'; 

      await setDoc(getDocRef('monthly_status', docId), { monthKey, agentId: targetAgentId, status: newStatus, updatedAt: serverTimestamp() }); 
      showNotify(`Status: ${newStatus.toUpperCase()}`); 
  };
  
  const getStatus = (monthKey) => { const targetAgentId = currentUser.role === 'agent' ? currentUser.id : selectedAgentId; if(targetAgentId === 'all') return 'mixed'; return monthlyStatus[`status_${monthKey}_${targetAgentId}`] || 'belum'; };
  const targetAgentIdForInput = currentUser?.role === 'agent' ? currentUser.id : selectedAgentId;
  const showAddButton = viewMode === 'orders' && targetAgentIdForInput !== 'all';
  const isAgent = currentUser?.role === 'agent';
  const headerStyle = isAgent ? `bg-gradient-to-r ${getAgentGradient(currentUser.name)} text-white shadow-md` : 'backdrop-blur-md bg-opacity-80 card-bg shadow-sm border-b';

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} agents={agents} adminPin={companyInfo.adminPin} notify={showNotify} companyLogo={companyInfo.logo} connectionStatus={connectionStatus} />;

  // LOADING DASHBOARD STATE (Prevents blank screen)
  if (!dashboardReady) {
      return (
          <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
              <p className="text-gray-500 font-bold text-xs tracking-widest uppercase animate-pulse">Memuat Dashboard...</p>
          </div>
      );
  }

  return (
    <div className={`min-h-[100dvh] font-sans pb-32 transition-colors duration-300 supports-[min-h:100dvh]:min-h-[100dvh] ${display.mode === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <GlobalStyleInjector mode={display.mode} fontSize={display.fontSize} />
      {notify && <NotificationToast message={notify.message} type={notify.type} onClose={() => setNotify(null)} />}
      {successPopup && <SuccessPopup />}
      <header className={`sticky top-0 z-30 ${headerStyle}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
           <div className="flex items-center gap-3"><div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">{companyInfo.logo ? <img src={companyInfo.logo} className="w-full h-full object-contain drop-shadow-md" /> : <div className={`p-2 rounded-lg shadow-lg ${isAgent ? 'bg-white/20 text-white' : `${currentTheme.bg} text-white`}`}>{isAgent ? <BadgeCheck className="w-5 h-5 md:w-6 md:h-6"/> : <FileText className="w-5 h-5 md:w-6 md:h-6" />}</div>}</div><div><h1 className="font-black tracking-tight text-lg md:text-xl leading-none uppercase max-w-[200px] truncate">{isAgent ? currentUser.name : "MFG PORTAL"}</h1><p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isAgent ? 'text-white/80' : 'text-gray-500'}`}>{isAgent ? "Mitra Resmi Terdaftar" : "Integrated Management"}</p></div></div>
           <div className="flex gap-2">{currentUser.role === 'admin' && <button onClick={() => setModals({...modals, settings: true})} className={`p-2.5 rounded-xl transition-colors ${display.mode === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}><Settings className="w-5 h-5"/></button>}<button onClick={() => setCurrentUser(null)} className={`p-2.5 rounded-xl transition-colors ${isAgent ? 'text-white hover:bg-white/20' : `text-red-500 ${display.mode === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-red-50'}`}`}><LogOut className="w-5 h-5"/></button></div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {isAgent && viewMode === 'folders' && (<div className={`mb-8 rounded-2xl p-6 shadow-lg text-white bg-gradient-to-br ${getAgentGradient(currentUser.name)} relative overflow-hidden`}><div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div><div className="relative z-10"><div className="flex justify-between items-start mb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-1">Tagihan Periode Bulan Ini</p><h2 className="text-xl md:text-2xl font-black uppercase tracking-wide">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h2></div><div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><TrendingUp className="w-6 h-6 text-white"/></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/20"><div><p className="text-[10px] uppercase font-bold text-white/60 mb-1">Total Order</p><p className="text-lg font-bold">{currentMonthStats.count} Unit</p></div><div><p className="text-[10px] uppercase font-bold text-white/60 mb-1">TOTAL HARGA</p><p className="text-lg font-bold">{formatCurrency(currentMonthStats.totalHarga)}</p></div><div><p className="text-[10px] uppercase font-bold text-white/60 mb-1">Total Fee</p><p className="text-lg font-bold">{formatCurrency(currentMonthStats.totalFee)}</p></div><div><p className="text-[10px] uppercase font-bold text-white/60 mb-1">Tagihan Bersih</p><p className="text-xl font-black">{formatCurrency(currentMonthStats.totalPayment)}</p></div></div></div></div>)}
        {currentUser.role === 'admin' && viewMode === 'folders' && (<div className="mb-6 card p-4 rounded-xl shadow-sm border border-gray-200/60"><label className="text-[10px] font-bold opacity-50 uppercase ml-1 mb-1 block tracking-wider">Filter Data Mitra</label><div className="relative"><select value={selectedAgentId} onChange={(e) => { setSelectedAgentId(e.target.value); setViewMode('folders'); }} className="input-field w-full p-3 pl-4 pr-10 rounded-lg font-bold text-sm appearance-none outline-none cursor-pointer"><option value="all">-- Semua Data Mitra (Global) --</option>{agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none"/></div></div>)}
        {viewMode === 'folders' && (<div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">{currentUser.role === 'admin' && selectedAgentId === 'all' ? (<div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 bg-gray-50 flex flex-col items-center justify-center"><Filter className="w-10 h-10 mb-3 text-gray-300"/><p className="font-bold text-sm">Arsip Belum Tersedia</p><p className="text-xs mt-1">Silakan pilih Mitra dari menu filter di atas untuk melihat arsip laporan bulanan.</p></div>) : (<><h2 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2"><Folder className="w-4 h-4"/> Arsip Laporan Bulanan</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">{folders.map(f => (<FolderCard key={f.key} monthKey={f.key} stats={f.stats} status={getStatus(f.key)} isAdmin={currentUser.role === 'admin'} onToggleStatus={() => toggleMonthStatus(f.key)} onClick={() => { setSelectedMonth(f.key); setViewMode('orders'); }}/>))}</div></>)}</div>)}
        {viewMode === 'orders' && (
            <div className="animate-in slide-in-from-right-8 pb-20">
                <button onClick={() => setViewMode('folders')} className="mb-4 flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors px-1"><ArrowLeft className="w-4 h-4"/> KEMBALI KE FOLDER</button>
                <div className={`card rounded-xl p-5 shadow-sm mb-6 relative overflow-hidden border-l-4 ${getStatus(selectedMonth) === 'lunas' ? 'border-l-emerald-500' : 'border-l-amber-400'}`}>
                   <div className="flex justify-between items-start mb-4 relative z-10"><div><p className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1">Laporan Bulan</p><h2 className="text-xl md:text-2xl font-black tracking-tight uppercase text-gray-800">{getMonthName(selectedMonth)}</h2></div><div className="text-right"><span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatus(selectedMonth) === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{getStatus(selectedMonth) === 'lunas' ? 'Lunas' : 'Belum Lunas'}</span></div></div>
                   {(() => { const mStats = folders.find(f => f.key === selectedMonth)?.stats || { totalPayment:0, count:0, totalHarga:0, totalFee:0, totalOngkir:0 }; return (<div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10 pt-4 border-t ${display.mode === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}><div className="bg-gray-50 p-2 rounded border border-gray-100"><p className="text-[9px] font-bold opacity-50 uppercase tracking-wider mb-1 flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> Total Order</p><p className="text-lg font-black tracking-tight text-gray-800">{mStats.count} <span className="text-[10px] font-normal text-gray-500">Unit</span></p></div><div className="bg-gray-50 p-2 rounded border border-gray-100"><p className="text-[9px] font-bold opacity-50 uppercase tracking-wider mb-1 flex items-center gap-1"><Wallet className="w-3 h-3"/> TOTAL HARGA</p><p className="text-lg font-black tracking-tight text-gray-800">{formatCurrency(mStats.totalHarga)}</p></div><div className="bg-red-50 p-2 rounded border border-red-100"><p className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Percent className="w-3 h-3"/> Potongan Fee</p><p className="text-lg font-black tracking-tight text-red-600">-{formatCurrency(mStats.totalFee)}</p></div><div className="bg-emerald-50 p-2 rounded border border-emerald-100"><p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Tagihan Bersih</p><p className="text-lg font-black tracking-tight text-emerald-700">{formatCurrency(mStats.totalPayment)}</p></div></div>); })()}
                   <div className="mt-4 pt-2 border-t border-dashed border-gray-200"><button onClick={() => setModals({...modals, preview: true})} className={`w-full py-3 rounded-lg shadow font-bold text-sm flex gap-2 justify-center items-center text-white ${currentTheme.bg} hover:opacity-90 active:scale-95 transition-all`}><Eye className="w-4 h-4"/> Preview Invoice</button></div>
                </div>
                <div className="space-y-3"><h3 className="text-xs font-bold opacity-50 uppercase tracking-wider px-1">Rincian Transaksi</h3>{filteredOrders.filter(o => o.monthKey === selectedMonth).length === 0 ? (<div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">Tidak ada transaksi di bulan ini.</div>) : (filteredOrders.filter(o => o.monthKey === selectedMonth).map(order => (<div key={order.id} className="card p-3 rounded-lg shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow border border-gray-100 group"><div className="flex gap-3"><div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border ${display.mode === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}>{order.photo ? <img src={order.photo} className="w-full h-full object-cover"/> : <ImageIcon className="w-6 h-6 m-auto mt-5 opacity-30"/>}</div><div className="flex-1 min-w-0"><div className="flex justify-between items-start mb-1"><p className="text-xs font-bold truncate leading-tight pr-2 text-gray-800">{order.address}</p><span className={`text-[10px] font-medium whitespace-nowrap px-1.5 py-0.5 rounded ${display.mode === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{formatDateShort(order.date)}</span></div><p className="text-[10px] opacity-60 line-clamp-1 mb-2">{order.description || '-'}</p><div className={`grid grid-cols-3 gap-2 text-[9px] p-2 rounded ${display.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}><div><span className="block opacity-50">Harga</span><span className="font-bold">{formatCurrency(order.price)}</span></div><div><span className="block opacity-50">Ongkir</span><span className="font-bold">{formatCurrency(order.shipping)}</span></div><div className="text-red-500"><span className="block opacity-50">Fee</span><span className="font-bold">-{formatCurrency(order.fee)}</span></div></div></div></div><div className="flex justify-between items-center pt-2 border-t border-gray-100"><div className="flex items-center gap-2"><span className="text-[10px] font-bold opacity-50">TOTAL BAYAR</span><span className={`text-sm font-black ${currentTheme.text}`}>{formatCurrency(order.totalPayment)}</span></div>{currentUser.role === 'admin' && (<div className="flex gap-1"><button onClick={() => handleEditOrder(order)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"><Pencil className="w-3 h-3" /></button><button onClick={() => handleDeleteOrder(order.id)} className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors"><Trash2 className="w-3 h-3" /></button></div>)}</div></div>)))}</div>
            </div>
        )}
      </main>
      {showAddButton && (<button onClick={() => { setEditingOrder(null); setModals({...modals, add: true}); }} className={`fixed bottom-6 right-6 text-white px-6 py-3 rounded-xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-30 gap-2 ${currentTheme.bg} shadow-emerald-200`}><Plus className="w-5 h-5 stroke-[3]"/> INPUT ORDER</button>)}
      {modals.add && <OrderFormModal key={editingOrder ? editingOrder.id : 'new'} onClose={() => setModals({...modals, add: false})} onSave={handleSaveOrder} agents={agents} currentUser={currentUser} fixedAgentId={targetAgentIdForInput} defaultDate={`${selectedMonth}-01`} notify={showNotify} initialData={editingOrder} />}
      {modals.preview && <ReportPreviewModal onClose={() => setModals({...modals, preview: false})} agentName={currentUser.role === 'agent' ? currentUser.name : agents.find(a => a.id === targetAgentIdForInput)?.name} month={selectedMonth} orders={filteredOrders.filter(o => o.monthKey === selectedMonth)} stats={folders.find(f => f.key === selectedMonth)?.stats || stats} companyInfo={companyInfo} notify={showNotify} />}
      {modals.settings && <SettingsModal onClose={() => setModals({...modals, settings: false})} companyInfo={companyInfo} agents={agents} onUpdateCompany={setCompanyInfo} notify={showNotify} display={display} onUpdateDisplay={setDisplay} />}
    </div>
  );
}