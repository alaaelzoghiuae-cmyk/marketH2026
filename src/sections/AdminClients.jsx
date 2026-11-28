import { Plus, Lock, Check, Bell, Search, Eye, User, Wallet, FileText, Upload, Save, Trash2, Minus, X } from 'lucide-react';
import { PasswordInput } from '../components/widgets.jsx';
import { AVATAR_PRESETS } from '../data/constants.jsx';
import { normalizeDigits } from '../lib/utils.jsx';

export function renderAdminClients(ctx) {
 const { accountRequests, activeRole, adminClientDossierTab, adminClientSearch, adminClientsFilterType, adminClientsGroupFilter, adminEditClientForm, askConfirmDelete, clients, groups, handleAdminSaveClientFullEdits, handleAdminUploadClientAvatar, handleSwitchRole, invalidateSessionTableCache, manualPayAmount, manualPayNote, orders, renderClientAvatar, sbUpsert, selectedAdminClient, selectedAdminClientId, setAccountRequests, setActiveRole, setAdminClientDossierTab, setAdminClientSearch, setAdminClientsFilterType, setAdminClientsGroupFilter, setAdminCreateClientModalOpen, setAdminEditClientForm, setAdminTab, setApprovingRequestObj, setClients, setEditingOrder, setManualPayAmount, setManualPayNote, setSelectedAdminClientId, showToast, siteSettings } = ctx;
 const pendingRequests = accountRequests.filter(r => r.status === 'pending');
 const passwordResetClients = clients.filter(c => c && c.passwordResetRequest);

 const handleApprovePasswordReset = async (clientObj) => {
 const nextPass = String(clientObj.requestedNewPassword || clientObj.password || '123').trim();
 const updated = {
 ...clientObj,
 password: nextPass,
 passwordResetRequest: false,
 requestedNewPassword: '',
 resetOtp: '',
 resetOtpExpires: 0
 };
 setClients(prev => prev.map(c => (c.id === clientObj.id ? updated : c)));
 if (selectedAdminClientId === clientObj.id) {
 setAdminEditClientForm(prev => (prev ? { ...prev, password: nextPass } : prev));
 }
 await sbUpsert('clients', updated);
 invalidateSessionTableCache('clients');
 showToast(`✓ تم اعتماد وتفعيل كلمة السر الجديدة للعميل "${clientObj.name}" فوراً!`, 'success');
 };

 const handleGenerateAndSendOtp = async (clientObj) => {
 const otpCode = String(Math.floor(100000 + Math.random() * 900000));
 const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes validity
 const updated = {
 ...clientObj,
 resetOtp: otpCode,
 resetOtpExpires: expiresAt
 };
 setClients(prev => prev.map(c => (c.id === clientObj.id ? updated : c)));
 await sbUpsert('clients', updated);
 invalidateSessionTableCache('clients');
 const cleanPhone = String(clientObj.phone || '').replace(/[^0-9]/g, '');
 const waPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
 const waMsg = `مرحباً ${clientObj.name}، كود التحقق السري (OTP) لاستعادة كلمة المرور في ${siteSettings.storeName || 'ELZOGHBI'} هو: *${otpCode}* (صالح لمدة 30 دقيقة).`;
 window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`, '_blank');
 showToast(`🔑 تم توليد كود الاستعادة (${otpCode}) للعميل "${clientObj.name}" وفتح واتساب!`, 'success');
 };
 const selectedClient = selectedAdminClient;
 const clientOrders = orders.filter(o => o.clientId === selectedClient?.id);

 const totalCreditForClients = clients.reduce((acc, c) => acc + (c.walletBalance > 0 ? c.walletBalance : 0), 0);
 const totalDebtOnClients = clients.reduce((acc, c) => acc + (c.walletBalance < 0 ? Math.abs(c.walletBalance) : 0), 0);
 const debtClientsCount = clients.filter(c => c.walletBalance < 0).length;
 const creditClientsCount = clients.filter(c => c.walletBalance > 0).length;

 const filteredClients = clients.filter(c => {
 if (adminClientsGroupFilter !== 'ALL' && c.groupId !== adminClientsGroupFilter) return false;
 if (adminClientsFilterType === 'DEBT' && !(c.walletBalance < 0)) return false;
 if (adminClientsFilterType === 'CREDIT' && !(c.walletBalance > 0)) return false;
 if (!adminClientSearch.trim()) return true;
 const q = adminClientSearch.trim().toLowerCase();
 return `${c.name} ${c.owner} ${c.phone} ${c.email || ''} ${c.address || ''}`.toLowerCase().includes(q);
 });

 const handleRecordManualPayment = (isCollection = true) => {
 const amt = Number(manualPayAmount);
 if (!amt || amt <= 0) {
 showToast('يرجى إدخال المبلغ أولاً في خانة المبلغ.', 'warning');
 return;
 }
 const signedAmt = isCollection ? amt : -amt;

 setClients(prev =>
 prev.map(c => {
 if (c.id !== selectedClient.id) return c;
 const nextBal = c.walletBalance + signedAmt;
 return {
 ...c,
 walletBalance: nextBal,
 ledger: [
 {
 id: `ldg_${Date.now()}`,
 date: new Date().toISOString().slice(0, 16).replace('T', ' '),
 type: isCollection ? 'payment' : 'adjustment',
 ref: `PAY-${Math.floor(100 + Math.random() * 899)}`,
 desc: manualPayNote || (isCollection ? 'تحصيل دفعة نقدية / بنكية من التاجر' : 'قيد مديونية يدوي'),
 amount: signedAmt,
 balanceAfter: nextBal
 },
 ...(c.ledger || [])
 ]
 };
 })
 );
 setManualPayAmount('');
 setManualPayNote('');
 showToast('تم تسجيل الحركة المالية وتحديث رصيد وكشف حساب العميل فوراً ✓', 'success');
 };

 return (
 <div className="space-y-5">
 {/* 1. Clean Executive Summary Cards for Accounts */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 <div
 onClick={() => setAdminClientsFilterType('ALL')}
 className={`p-4 rounded-2xl border cursor-pointer transition ${
 adminClientsFilterType === 'ALL' ? 'bg-nav2 text-white border-line shadow-md' : 'bg-surface text-fg border-line hover:border-blue-400'
 }`}
 >
 <div className={`text-[11px] font-bold ${adminClientsFilterType === 'ALL' ? 'text-muted' : 'text-muted'}`}>إجمالي الحسابات المسجلة</div>
 <div className="text-2xl font-black mt-1 font-mono">{clients.length}</div>
 <div className={`text-[10px] mt-1 font-bold ${adminClientsFilterType === 'ALL' ? 'text-[#2997FF]' : 'text-blue-600'}`}>اضغط لعرض الجميع</div>
 </div>

 <div
 onClick={() => setAdminClientsFilterType(adminClientsFilterType === 'DEBT' ? 'ALL' : 'DEBT')}
 className={`p-4 rounded-2xl border cursor-pointer transition ${
 adminClientsFilterType === 'DEBT' ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-surface text-fg border-line hover:border-rose-400'
 }`}
 >
 <div className={`text-[11px] font-bold ${adminClientsFilterType === 'DEBT' ? 'text-rose-100' : 'text-muted'}`}>إجمالي المديونيات (عليهم)</div>
 <div className={`text-xl sm:text-2xl font-black mt-1 font-mono ${adminClientsFilterType === 'DEBT' ? 'text-white' : 'text-rose-600'}`}>
 {totalDebtOnClients.toLocaleString()} <span className="text-xs">ج.م</span>
 </div>
 <div className={`text-[10px] mt-1 font-bold ${adminClientsFilterType === 'DEBT' ? 'text-white' : 'text-rose-500 dark:text-rose-400'}`}>عدد الحسابات المدينة: {debtClientsCount}</div>
 </div>

 <div
 onClick={() => setAdminClientsFilterType(adminClientsFilterType === 'CREDIT' ? 'ALL' : 'CREDIT')}
 className={`p-4 rounded-2xl border cursor-pointer transition ${
 adminClientsFilterType === 'CREDIT' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-surface text-fg border-line hover:border-emerald-400'
 }`}
 >
 <div className={`text-[11px] font-bold ${adminClientsFilterType === 'CREDIT' ? 'text-emerald-100' : 'text-muted'}`}>أرصدة دائنة للعملاء (لهم)</div>
 <div className={`text-xl sm:text-2xl font-black mt-1 font-mono ${adminClientsFilterType === 'CREDIT' ? 'text-white' : 'text-emerald-600'}`}>
 {totalCreditForClients.toLocaleString()} <span className="text-xs">ج.م</span>
 </div>
 <div className={`text-[10px] mt-1 font-bold ${adminClientsFilterType === 'CREDIT' ? 'text-white' : 'text-accent-text'}`}>عدد الحسابات الدائنة: {creditClientsCount}</div>
 </div>

 <div
 onClick={() => setAdminCreateClientModalOpen(true)}
 className="p-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 to-slate-700 text-white cursor-pointer hover:brightness-110 transition shadow-sm flex flex-col justify-between"
 >
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-bold text-blue-100">إضافة حساب جديد</span>
 <Plus className="w-5 h-5 text-[#2997FF]" />
 </div>
 <div className="text-sm sm:text-base font-extrabold mt-1">+ إنشاء حساب تاجر / عميل</div>
 <div className="text-[10px] text-blue-100 font-bold">تحديد الفئة وسقف الآجل فوراً</div>
 </div>
 </div>

 {/* 1B. Password Reset Requests Banner (Shown when a client requests password recovery) */}
 {passwordResetClients.length > 0 && (
 <div className="bg-surface2 border-2 border-accent rounded-2xl p-4 space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <h3 className="text-sm font-extrabold text-fg flex items-center gap-2">
 <Lock className="w-4 h-4 text-accent-text" />
 <span>طلبات استعادة وتغيير كلمة المرور ({passwordResetClients.length})</span>
 </h3>
 <span className="text-[11px] font-bold text-accent-text">
 اعتمد كلمة السر الجديدة بضغطة واحدة أو أرسل كود OTP للعميل عبر واتساب
 </span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {passwordResetClients.map(rc => (
 <div key={rc.id} className="bg-surface rounded-xl p-3.5 border border-line shadow-xs flex flex-col justify-between gap-3 text-xs">
 <div className="space-y-1">
 <div className="flex items-center justify-between gap-2">
 <span className="font-extrabold text-fg">{rc.name}</span>
 <span className="px-2 py-0.5 rounded bg-accent/15 text-accent-text font-mono font-bold text-[10px]">
 {rc.passwordResetRequestedAt || 'الآن'}
 </span>
 </div>
 <div className="text-muted font-bold">
 {rc.owner} • <span className="font-mono text-fg font-extrabold">{rc.phone}</span>
 </div>
 {rc.requestedNewPassword && (
 <div className="text-[11px] bg-surface2 px-2.5 py-1.5 rounded-lg border border-line">
 كلمة السر الجديدة المطلوبة: <span className="font-mono font-black text-accent-text">{rc.requestedNewPassword}</span>
 </div>
 )}
 {rc.resetOtp && (
 <div className="text-[11px] text-go font-extrabold">
 كود OTP الفعال حالياً: <span className="font-mono">{rc.resetOtp}</span>
 </div>
 )}
 </div>
 <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line">
 {rc.requestedNewPassword && (
 <button
 type="button"
 onClick={() => handleApprovePasswordReset(rc)}
 className="flex-1 py-2 px-3 rounded-xl bg-go hover:brightness-110 text-go-ink font-extrabold flex items-center justify-center gap-1"
 >
 <Check className="w-3.5 h-3.5" />
 <span>اعتماد كلمة السر الجديدة فوراً</span>
 </button>
 )}
 <button
 type="button"
 onClick={() => handleGenerateAndSendOtp(rc)}
 className="flex-1 py-2 px-3 rounded-xl bg-accent hover:brightness-110 text-accent-ink font-extrabold flex items-center justify-center gap-1"
 >
 <span>🔑 توليد وإرسال كود OTP واتساب</span>
 </button>
 <button
 type="button"
 onClick={async () => {
 const cleared = { ...rc, passwordResetRequest: false, requestedNewPassword: '' };
 setClients(prev => prev.map(c => (c.id === rc.id ? cleared : c)));
 await sbUpsert('clients', cleared);
 }}
 className="py-2 px-2.5 rounded-xl bg-rose-500/15 text-rose-500 font-bold"
 title="إخفاء الطلب"
 >
 ✕
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* 2. Pending Account Join Requests Banner (Shown cleanly if any exist) */}
 {pendingRequests.length > 0 && (
 <div className="bg-surface2 border-2 border-amber-500/50 rounded-2xl p-4 space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <h3 className="text-sm font-extrabold text-fg flex items-center gap-2">
 <Bell className="w-4 h-4 text-amber-600" />
 طلبات فتح حسابات جديدة بانتظار المراجعة ({pendingRequests.length})
 </h3>
 <span className="text-[11px] font-bold text-amber-600 dark:text-amber-300">راجع البيانات واضغط موافقة لتفعيل الحساب فوراً</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 {pendingRequests.map(req => (
 <div key={req.id} className="bg-surface rounded-xl p-3.5 border border-amber-200 shadow-xs flex flex-col justify-between gap-3 text-xs">
 <div className="space-y-1">
 <div className="flex items-center justify-between gap-2">
 <span className="font-extrabold text-fg truncate">{req.shopName || req.name}</span>
 <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold text-[10px] shrink-0">{req.shopType || 'محل'}</span>
 </div>
 <div className="text-muted font-bold">{req.ownerName || req.owner} • <span className="font-mono text-fg">{req.phone}</span></div>
 <div className="text-muted text-[11px] truncate">{req.address}</div>
 </div>
 <div className="flex items-center gap-2 pt-2 border-t border-line">
 <button
 type="button"
 onClick={() =>
 setApprovingRequestObj({
 req,
 groupId:
 req.accountCategory === 'individual' || (req.shopType || '').includes('فردي')
 ? groups.find(g => g.isDefault)?.id || groups[0].id
 : groups[1]?.id || groups[0].id,
 creditLimit:
 req.accountCategory === 'individual' || (req.shopType || '').includes('فردي')
 ? 0
 : 15000,
 password: req.requestedPassword || String(Math.floor(100000 + Math.random() * 900000)),
 avatar: (req.shopName || req.name || 'EL').slice(0, 2),
 avatarBg: 'from-emerald-600 to-slate-700'
 })
 }
 className="flex-1 py-2 px-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-extrabold flex items-center justify-center gap-1"
 >
 <Check className="w-3.5 h-3.5" />
 موافقة وتفعيل
 </button>
 <button
 type="button"
 onClick={() => {
 askConfirmDelete(
 'رفض طلب فتح حساب',
 `هل أنت متأكد من رفض طلب فتح الحساب الخاص بـ "${req.shopName || req.name}"؟`,
 () => {
 setAccountRequests(prev => prev.map(r => (r.id === req.id ? { ...r, status: 'rejected' } : r)));
 showToast(`تم رفض طلب الحساب الخاص بـ "${req.shopName || req.name}".`, 'info');
 },
 'نعم، رفض الطلب'
 );
 }}
 className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white font-bold transition"
 >
 رفض
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* 3. Main Organized Split View: Right Directory List + Left Tabbed Client Workspace */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
 {/* Directory Column (4 cols on desktop) */}
 <div className="lg:col-span-4 bg-surface rounded-2xl border border-line p-4 space-y-3 shadow-xs">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-extrabold text-fg">دليل الحسابات ({filteredClients.length})</h3>
 {adminClientsFilterType !== 'ALL' && (
 <button
 type="button"
 onClick={() => setAdminClientsFilterType('ALL')}
 className="text-[11px] font-bold text-blue-600 hover:underline"
 >
 إظهار الكل
 </button>
 )}
 </div>

 {/* Search & Group Filter */}
 <div className="space-y-2">
 <div className="relative">
 <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={adminClientSearch}
 onChange={e => setAdminClientSearch(e.target.value)}
 placeholder="ابحث بالاسم أو رقم الموبايل..."
 className="w-full pe-9 ps-3 py-2 rounded-xl border border-line text-xs font-bold"
 />
 </div>

 <div className="flex items-center gap-1.5">
 <select
 value={adminClientsGroupFilter}
 onChange={e => setAdminClientsGroupFilter(e.target.value)}
 className="flex-1 px-2.5 py-1.5 rounded-xl border border-line bg-surface2 text-[11px] font-bold text-muted"
 >
 <option value="ALL">كل الفئات التسعيرية ({groups.length})</option>
 {groups.map(g => (
 <option key={g.id} value={g.id}>{g.name}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Clean Scrollable Clients List */}
 <div className="space-y-2 ps-1">
 {filteredClients.length === 0 ? (
 <div className="py-10 text-center text-xs text-muted font-bold">لا توجد حسابات مطابقة للبحث</div>
 ) : (
 filteredClients.map(c => {
 const grp = groups.find(g => g.id === c.groupId);
 const isSelected = selectedClient?.id === c.id;
 return (
 <div
 key={c.id}
 onClick={() => setSelectedAdminClientId(c.id)}
 className={`p-3 rounded-xl border cursor-pointer transition ${
 isSelected
 ? 'border-accent bg-accent/10 ring-2 ring-accent/20'
 : 'border-line hover:bg-surface2'
 }`}
 >
 <div className="flex items-center gap-2.5">
 {renderClientAvatar(c, 'w-9 h-9 text-xs')}
 <div className="flex-1 min-w-0">
 <div className="text-xs font-extrabold text-fg truncate">{c.name}</div>
 <div className="text-[11px] text-muted truncate">
 {c.owner} • <span className="font-mono font-bold text-muted">{c.phone}</span>
 </div>
 </div>
 <span
 className={`px-2 py-1 rounded-lg text-[11px] font-extrabold font-mono shrink-0 ${
 c.walletBalance > 0
 ? 'bg-accent/15 text-accent-text border border-accent/30'
 : c.walletBalance < 0
 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
 : 'bg-surface2 text-muted'
 }`}
 >
 {c.walletBalance > 0 ? `له ${c.walletBalance}` : c.walletBalance < 0 ? `عليه ${Math.abs(c.walletBalance)}` : '0 ج.م'}
 </span>
 </div>
 <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-line text-[10px]">
 <span className="font-bold text-accent-text bg-surface2 px-2 py-0.5 rounded truncate max-w-[70%]">
 {grp?.name || 'الفئة الأساسية'}
 </span>
 <span className="text-muted font-bold">
 {orders.filter(o => o.clientId === c.id).length} فواتير
 </span>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>

 {/* Selected Client Workspace Column (8 cols on desktop) with Clean Sub-Tabs */}
 {selectedClient && adminEditClientForm ? (
 <div className="lg:col-span-8 bg-surface rounded-2xl border border-line shadow-xs overflow-hidden">
 {/* Top Client Header Banner */}
 <div className="p-4 sm:p-5 bg-nav2 text-white flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-3 min-w-0">
 {renderClientAvatar({ ...selectedClient, ...adminEditClientForm }, 'w-12 h-12 text-sm')}
 <div className="min-w-0">
 <h2 className="text-base font-extrabold truncate">{selectedClient.name}</h2>
 <div className="text-xs text-muted flex items-center gap-2 flex-wrap">
 <span>{selectedClient.owner}</span>
 <span>•</span>
 <span className="font-mono text-[#2997FF] font-bold">{selectedClient.phone}</span>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 <span
 className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
 selectedClient.walletBalance >= 0
 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
 : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
 }`}
 >
 {selectedClient.walletBalance >= 0 ? 'رصيد دائن (له): ' : 'مديونية (عليه): '}
 {Math.abs(selectedClient.walletBalance).toLocaleString()} ج.م
 </span>

 <button
 type="button"
 onClick={() => handleSwitchRole(selectedClient.id)}
 className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface text-white text-xs font-bold flex items-center gap-1"
 title="معاينة المتجر بحساب هذا العميل"
 >
 <Eye className="w-3.5 h-3.5 text-[#2997FF]" />
 <span>معاينة المتجر</span>
 </button>
 </div>
 </div>

 {/* Clean 3-Tab Navigation Bar (No Clutter!) */}
 <div className="grid grid-cols-3 border-b border-line bg-surface2 text-xs font-extrabold">
 <button
 type="button"
 onClick={() => setAdminClientDossierTab('profile')}
 className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
 adminClientDossierTab === 'profile'
 ? 'border-blue-600 text-blue-600 bg-surface'
 : 'border-transparent text-muted hover:text-fg'
 }`}
 >
 <User className="w-4 h-4" />
 <span>1. بيانات الحساب والفئة</span>
 </button>
 <button
 type="button"
 onClick={() => setAdminClientDossierTab('wallet')}
 className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
 adminClientDossierTab === 'wallet'
 ? 'border-emerald-600 text-accent-text bg-surface'
 : 'border-transparent text-muted hover:text-fg'
 }`}
 >
 <Wallet className="w-4 h-4" />
 <span>2. المحفظة وكشف الحساب ({(selectedClient.ledger || []).length})</span>
 </button>
 <button
 type="button"
 onClick={() => setAdminClientDossierTab('orders')}
 className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
 adminClientDossierTab === 'orders'
 ? 'border-accent text-accent-text bg-surface'
 : 'border-transparent text-muted hover:text-fg'
 }`}
 >
 <FileText className="w-4 h-4" />
 <span>3. الفواتير والطلبات ({clientOrders.length})</span>
 </button>
 </div>

 {/* Tab 1: Account Details & Pricing Tier */}
 {adminClientDossierTab === 'profile' && (
 <form onSubmit={handleAdminSaveClientFullEdits} className="p-5 space-y-4 text-xs">
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
 <div>
 <label className="font-bold text-muted block mb-1">اسم المحل / العميل:</label>
 <input
 type="text"
 required
 value={adminEditClientForm.name}
 onChange={e => setAdminEditClientForm(prev => ({ ...prev, name: e.target.value }))}
 className="w-full p-2.5 rounded-xl border border-line font-bold"
 />
 </div>

 <div>
 <label className="font-bold text-muted block mb-1">اسم المسؤول:</label>
 <input
 type="text"
 required
 value={adminEditClientForm.owner}
 onChange={e => setAdminEditClientForm(prev => ({ ...prev, owner: e.target.value }))}
 className="w-full p-2.5 rounded-xl border border-line font-bold"
 />
 </div>

 <div>
 <label className="font-bold text-muted block mb-1">رقم الموبايل (كود الدخول):</label>
 <input
 type="text"
 required
 value={adminEditClientForm.phone}
 onChange={e => setAdminEditClientForm(prev => ({ ...prev, phone: e.target.value }))}
 className="w-full p-2.5 rounded-xl border border-line font-mono font-bold"
 />
 </div>

 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="font-bold text-rose-500 dark:text-rose-400">كلمة المرور (Password):</label>
 <button
 type="button"
 onClick={() => handleGenerateAndSendOtp(selectedClient)}
 className="text-[10px] font-extrabold text-accent-text hover:underline"
 title="توليد كود استعادة من 6 أرقام وإرساله للعميل عبر واتساب"
 >
 🔑 إرسال كود OTP واتساب
 </button>
 </div>
 <PasswordInput
 type="text"
 required
 value={adminEditClientForm.password}
 onChange={e => setAdminEditClientForm(prev => ({ ...prev, password: e.target.value }))}
 className="w-full p-2.5 rounded-xl border border-line bg-bg font-mono font-extrabold text-fg"
 />
 </div>

 <div>
 <label className="font-bold text-accent-text block mb-1">فئة التسعير والخصم:</label>
 <select
 value={adminEditClientForm.groupId}
 onChange={e => setAdminEditClientForm(prev => ({ ...prev, groupId: e.target.value }))}
 className="w-full p-2.5 rounded-xl border border-line bg-bg font-extrabold text-fg"
 >
 {groups.map(g => (
 <option key={g.id} value={g.id}>
 {g.name} ({g.currency})
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="font-bold text-muted block mb-1">سقف الآجل المسموح (ج.م):</label>
 <input
 type="number"
 value={adminEditClientForm.creditLimit}
 onChange={e => setAdminEditClientForm(prev => ({ ...prev, creditLimit: e.target.value }))}
 className="w-full p-2.5 rounded-xl border border-line font-extrabold"
 />
 </div>

 <div className="sm:col-span-2">
 <label className="font-bold text-muted block mb-1">العنوان بالتفصيل:</label>
 <input
 type="text"
 value={adminEditClientForm.address}
 onChange={e => setAdminEditClientForm(prev => ({ ...prev, address: e.target.value }))}
 className="w-full p-2.5 rounded-xl border border-line"
 />
 </div>

 <div>
 <label className="font-bold text-muted block mb-1">البريد الإلكتروني (اختياري):</label>
 <input
 type="text"
 value={adminEditClientForm.email}
 onChange={e => setAdminEditClientForm(prev => ({ ...prev, email: e.target.value }))}
 className="w-full p-2.5 rounded-xl border border-line"
 />
 </div>

 <div>
 <label className="font-black text-amber-500 block mb-1">🎂 تاريخ الميلاد (لقسيمة عيد الميلاد):</label>
 <input
 type="date"
 value={adminEditClientForm.birthDate || ''}
 onChange={e => setAdminEditClientForm(prev => ({ ...prev, birthDate: e.target.value }))}
 className="w-full p-2.5 rounded-xl border border-amber-500/40 font-mono font-bold"
 />
 </div>
 </div>

 {/* Compact Avatar Bar */}
 <div className="p-3 rounded-xl bg-surface2 border border-line flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="font-bold text-muted">صورة الحساب:</span>
 <label className="px-3 py-1.5 rounded-lg bg-nav2 text-white font-bold cursor-pointer flex items-center gap-1">
 <Upload className="w-3.5 h-3.5" />
 رفع صورة (WebP مصغرة)
 <input type="file" accept="image/*" onChange={handleAdminUploadClientAvatar} className="hidden" />
 </label>
 {AVATAR_PRESETS.map(p => (
 <button
 key={p.id}
 type="button"
 onClick={() => setAdminEditClientForm(prev => ({ ...prev, avatarBg: p.bg, avatarImage: '' }))}
 className={`w-6 h-6 rounded-lg bg-gradient-to-br ${p.bg} ${
 adminEditClientForm.avatarBg === p.bg && !adminEditClientForm.avatarImage ? 'ring-2 ring-line scale-110' : 'opacity-70'
 }`}
 />
 ))}
 </div>

 <div className="flex items-center gap-2">
 <button
 type="submit"
 className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm"
 >
 <Save className="w-4 h-4" />
 حفظ تعديلات الحساب
 </button>
 <button
 type="button"
 onClick={() =>
 askConfirmDelete(
 'حذف حساب العميل نهائياً',
 `هل أنت متأكد من حذف حساب "${selectedClient.name}" (${selectedClient.phone}) نهائياً؟${(Number(selectedClient.walletBalance) || 0) !== 0 ? `\n⚠️ تنبيه: العميل عنده رصيد محفظة غير صفري (${selectedClient.walletBalance} ج.م) — الحذف هيضيّع تتبّع المبلغ ده نهائياً.` : ''}${orders.some(o => String(o.clientId) === String(selectedClient.id) && !['تم التسليم', 'ملغي'].includes(o.status)) ? '\n⚠️ تنبيه: العميل عنده طلبات لسه مفتوحة (مش متسلمة ولا ملغية) وهتفضل فواتيرها يتيمة بعد الحذف.' : ''}`,
 () => {
 const remaining = clients.filter(c => c.id !== selectedClient.id);
 setClients(remaining);
 if (activeRole === selectedClient.id) setActiveRole('guest');
 setSelectedAdminClientId(remaining[0]?.id || '');
 showToast(`تم حذف الحساب "${selectedClient.name}" نهائياً.`, 'info');
 }
 )
 }
 className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-200 font-extrabold flex items-center gap-1 transition"
 >
 <Trash2 className="w-4 h-4" />
 حذف
 </button>
 </div>
 </div>
 </form>
 )}

 {/* Tab 2: Wallet & Financial Ledger */}
 {adminClientDossierTab === 'wallet' && (
 <div className="p-5 space-y-4 text-xs">
 <div className="bg-surface2 p-4 rounded-2xl border border-line space-y-3">
 <div className="font-extrabold text-fg">تسجيل دفعة مالية أو تعديل الرصيد فوراً:</div>
 <div className="flex flex-wrap gap-2">
 <input
 type="number"
 value={manualPayAmount}
 onChange={e => setManualPayAmount(e.target.value)}
 placeholder="المبلغ بالجنيه..."
 className="w-40 px-3 py-2.5 rounded-xl border border-line font-extrabold bg-surface text-fg"
 />
 <input
 type="text"
 value={manualPayNote}
 onChange={e => setManualPayNote(e.target.value)}
 placeholder="ملاحظة أو بيان الحركة (اختياري)..."
 className="flex-1 min-w-[180px] px-3 py-2.5 rounded-xl border border-line bg-surface"
 />
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 <button
 type="button"
 onClick={() => handleRecordManualPayment(true)}
 className="py-2.5 px-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-extrabold transition"
 >
 + تحصيل / إضافة رصيد
 </button>
 <button
 type="button"
 onClick={() => handleRecordManualPayment(false)}
 className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold transition"
 >
 - تسجيل مديونية
 </button>
 <button
 type="button"
 onClick={() => {
 if (manualPayAmount === '' || isNaN(Number(manualPayAmount))) {
 showToast('اكتب الرصيد الجديد في خانة المبلغ أولاً.', 'warning');
 return;
 }
 const exactVal = Number(manualPayAmount);
 askConfirmDelete(
 'تثبيت رصيد العميل',
 `هل أنت متأكد من تثبيت رصيد "${selectedClient.name}" عند ${exactVal} ج.م؟ (الرصيد الحالي: ${selectedClient.walletBalance} ج.م — الفرق هيتسجل كحركة تسوية)`,
 () => {
 setClients(prev =>
 prev.map(c => {
 if (c.id !== selectedClient.id) return c;
 const diff = exactVal - c.walletBalance;
 return {
 ...c,
 walletBalance: exactVal,
 ledger: [
 {
 id: `ldg_${Date.now()}`,
 date: new Date().toISOString().slice(0, 16).replace('T', ' '),
 type: 'adjustment',
 ref: `SET-${Math.floor(100 + Math.random() * 899)}`,
 desc: manualPayNote || `تحديد الرصيد يدوياً إلى ${exactVal} ج.م`,
 amount: diff,
 balanceAfter: exactVal
 },
 ...(c.ledger || [])
 ]
 };
 })
 );
 setManualPayAmount('');
 setManualPayNote('');
 showToast(`تم تثبيت رصيد العميل عند ${exactVal} ج.م ✓`, 'success');
 },
 'نعم، ثبّت الرصيد'
 );
 }}
 className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold transition"
 >
 = تثبيت الرصيد بهذا الرقم
 </button>
 <button
 type="button"
 onClick={() => {
 askConfirmDelete(
 'تصفير محفظة العميل',
 `هل أنت متأكد من تصفير رصيد ومديونية "${selectedClient.name}" ليصبح 0 ج.م؟`,
 () => {
 setClients(prev =>
 prev.map(c => {
 if (c.id !== selectedClient.id) return c;
 return {
 ...c,
 walletBalance: 0,
 ledger: [
 {
 id: `ldg_${Date.now()}`,
 date: new Date().toISOString().slice(0, 16).replace('T', ' '),
 type: 'adjustment',
 ref: 'ZERO',
 desc: manualPayNote || 'تصفير الرصيد والمديونية بواسطة الإدارة',
 amount: -c.walletBalance,
 balanceAfter: 0
 },
 ...(c.ledger || [])
 ]
 };
 })
 );
 showToast('تم تصفير رصيد العميل إلى 0 ج.م ✓', 'info');
 },
 'نعم، تصفير الرصيد'
 );
 }}
 className="py-2.5 px-3 rounded-xl bg-nav2 hover:bg-nav2 text-white font-extrabold transition"
 >
 × تصفير الرصيد (0)
 </button>
 </div>
 </div>

 {/* Ledger Table */}
 <div className="space-y-2">
 <h4 className="font-extrabold text-fg">سجل الحركات المالية ({(selectedClient.ledger || []).length}):</h4>
 {(!selectedClient.ledger || selectedClient.ledger.length === 0) ? (
 <div className="py-8 text-center text-muted border border-line rounded-xl">لا توجد حركات مالية مسجلة بعد</div>
 ) : (
 <div className=" border border-line rounded-xl divide-y divide-line">
 {selectedClient.ledger.map(entry => (
 <div key={entry.id} className="p-3 flex items-center justify-between gap-2 bg-surface hover:bg-surface2">
 <div>
 <div className="font-bold text-fg">{entry.desc}</div>
 <div className="text-[10px] text-muted font-mono">{entry.date} • المرجع: {entry.ref}</div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className={`font-mono font-extrabold ${entry.amount >= 0 ? 'text-accent-text' : 'text-rose-500 dark:text-rose-400'}`}>
 {entry.amount >= 0 ? `+${entry.amount}` : entry.amount} ج.م
 </span>
 <button
 type="button"
 onClick={() => {
 askConfirmDelete(
 'حذف حركة مالية وعكس تأثيرها',
 `هل تريد حذف الحركة "${entry.desc}" (${entry.amount} ج.م) وعكس قيمتها من الرصيد؟`,
 () => {
 setClients(prev =>
 prev.map(c => {
 if (c.id !== selectedClient.id) return c;
 const nextBal = c.walletBalance - Number(entry.amount || 0);
 let runBal = nextBal;
 const fixedLedger = (c.ledger || [])
 .filter(l => l.id !== entry.id)
 .map(l => {
 const upd = { ...l, balanceAfter: runBal };
 runBal -= Number(l.amount || 0);
 return upd;
 });
 return {
 ...c,
 walletBalance: nextBal,
 ledger: fixedLedger
 };
 })
 );
 showToast('تم حذف الحركة المالية وتحديث الرصيد.', 'info');
 }
 );
 }}
 className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white transition"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 {/* Tab 3: Client Orders */}
 {adminClientDossierTab === 'orders' && (
 <div className="p-5 space-y-3 text-xs">
 {clientOrders.length === 0 ? (
 <div className="py-10 text-center text-muted font-bold">لا توجد فواتير سابقة لهذا العميل</div>
 ) : (
 <div className="space-y-2 ">
 {clientOrders.map(o => (
 <div key={o.id} className="p-3.5 rounded-xl border border-line flex flex-wrap items-center justify-between gap-2 hover:bg-surface2">
 <div>
 <div className="flex items-center gap-2">
 <span className="font-mono font-extrabold text-fg text-sm">{o.id}</span>
 <span className="px-2 py-0.5 rounded-full bg-surface2 text-accent-text font-bold text-[10px]">{o.status}</span>
 </div>
 <div className="text-[11px] text-muted mt-0.5">
 {o.createdAt} • {(o.items || []).length} أصناف • {o.paymentMethod}
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => {
 setEditingOrder(JSON.parse(JSON.stringify(o)));
 setAdminTab('orders');
 }}
 className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 font-extrabold"
 >
 فتح وتعديل الفاتورة
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 ) : (
 <div className="lg:col-span-8 bg-surface rounded-2xl border border-line p-12 text-center text-xs text-muted font-bold">
 اختر حساب عميل من القائمة الجانبية لعرض أو تعديل بياناته وكشف حسابه
 </div>
 )}
 </div>
 </div>
 );
 
}

export function renderAdminReturnsAndComplaints(ctx) {
 const { adminReturnsSubTab, complaintReplies, complaints, handleResolveReturn, openAdminCards, renderAdminSubTabBar, returnAdminNotes, returnsList, sbDelete, setAdminReturnsSubTab, setComplaintReplies, setComplaints, setConfirmDialog, setLightbox, setOpenAdminCards, setReturnAdminNotes, setReturnsList, setShowClosedItems, showClosedItems, showToast, toggleAdminCard } = ctx;
 return (<div className="space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 {renderAdminSubTabBar(
 [
 { id: 'returns', icon: '🔄', label: 'طلبات المرتجعات والضمان', badge: returnsList.length },
 { id: 'complaints', icon: '💬', label: 'الشكاوى والمقترحات', badge: complaints.length },
 { id: 'both', icon: '📋', label: 'عرض الاثنين معاً' }
 ],
 adminReturnsSubTab,
 setAdminReturnsSubTab
 )}
 <label className="flex items-center gap-2 text-xs font-bold text-muted cursor-pointer px-3 py-2 rounded-xl bg-surface border border-line">
 <input
 type="checkbox"
 checked={showClosedItems}
 onChange={e => setShowClosedItems(e.target.checked)}
 className="w-4 h-4 accent-slate-900"
 />
 إظهار المقفولة ({returnsList.filter(r => r.closed).length + complaints.filter(c => c.status === 'مغلق').length})
 </label>
 </div>
 <div className={`grid grid-cols-1 ${adminReturnsSubTab === 'both' ? 'lg:grid-cols-2' : ''} gap-6`}>
 {/* Returns Inspection Column */}
 {(adminReturnsSubTab === 'returns' || adminReturnsSubTab === 'both') && (
 <div className="space-y-4">
 <div>
 <h3 className="text-base font-extrabold text-fg">
 طلبات استرجاع الضمان وفحص القطع ({returnsList.filter(r => showClosedItems || !r.closed).length} من {returnsList.length})
 </h3>
 <p className="text-xs text-muted">
 تحكم كامل: يمكنك القبول أو الرفض أو تعديل قرارك في أي وقت وإرسال أكثر من رد للعميل مع تسوية تلقائية للمخزن والحساب
 </p>
 </div>

 {returnsList.filter(r => showClosedItems || !r.closed).map(ret => (
 <div key={ret.id} className="bg-surface rounded-2xl p-4 border border-line shadow-xs space-y-3">
 <button type="button" onClick={() => toggleAdminCard(ret.id)} className="w-full flex items-center justify-between gap-2 text-right">
 <span className="flex items-center gap-2 min-w-0 flex-wrap">
 <span className="font-mono font-extrabold text-fg text-xs">{ret.id}</span>
 <span className="text-[11px] font-bold text-accent-text truncate">{ret.clientName}</span>
 <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${ret.closed ? 'bg-surface2 text-muted' : ret.status === 'مقبول' ? 'bg-accent/15 text-accent-text border border-accent/30' : ret.status === 'مرفوض' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30' : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'}`}>
 {ret.closed ? 'مقفول' : ret.status}
 </span>
 </span>
 <span className="w-7 h-7 shrink-0 rounded-lg bg-nav2 text-white flex items-center justify-center">
 {openAdminCards[ret.id] ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
 </span>
 </button>
 {openAdminCards[ret.id] && (
 <div className="space-y-3">
 <div className="flex justify-between items-center text-xs">
 <span className="font-mono font-extrabold text-fg">
 {ret.id} • فاتورة {ret.orderId}
 </span>
 <span
 className={`px-2.5 py-1 rounded-full font-extrabold ${
 ret.status === 'مقبول'
 ? 'bg-accent/15 text-accent-text border border-accent/30'
 : ret.status === 'مرفوض'
 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
 : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
 }`}
 >
 القرار الحالي: {ret.status} {ret.resolutionType ? `(${ret.resolutionType})` : ''}
 </span>
 </div>

 <div className="text-xs font-bold text-accent-text">{ret.clientName}</div>
 <div className="text-sm font-extrabold text-fg">
 {ret.partName} (الكمية: {ret.qty} • قيمة التعويض: {ret.refundAmountBase} ج.م)
 </div>
 <p className="text-xs text-muted bg-surface2 p-3 rounded-xl">{ret.reason}</p>

 {/* Uploaded Inspection Photos */}
 <div className="flex items-center gap-2 flex-wrap">
 {(ret.photos || []).length === 0 ? (
 <span className="text-[11px] text-muted font-bold">العميل ماضافش صور</span>
 ) : (
 (ret.photos || []).map((img, i) => (
 <img
 key={i}
 src={img}
 alt="صورة الفحص"
 onClick={() => setLightbox({ list: ret.photos, index: i })}
 className="w-16 h-16 rounded-lg object-cover border border-line cursor-pointer hover:ring-2 hover:ring-blue-500"
 />
 ))
 )}
 {(ret.photos || []).length > 0 && (
 <span className="text-[11px] text-muted font-bold">دوس على الصورة عشان تكبّرها</span>
 )}
 </div>

 {/* Previous Admin Replies History on this Return */}
 {(ret.replies || []).length > 0 && (
 <div className="space-y-1.5 pe-3 border-r-2 border-emerald-300">
 {ret.replies.map(rrep => (
 <div key={rrep.id} className="p-2 rounded-lg bg-accent/15 border border-accent/30 text-xs text-fg">
 <div className="flex justify-between text-[10px] font-bold text-accent-text">
 <span>رد الإدارة ({rrep.statusSet})</span>
 <span>{rrep.date}</span>
 </div>
 <div>{rrep.text}</div>
 </div>
 ))}
 </div>
 )}

 {/* Always-Available Decision & Reply Controls (Accept / Change to Reject / Reply Multiple Times) */}
 <div className="space-y-2 pt-3 border-t border-line">
 <div className="text-[11px] font-bold text-muted">
 إصدار قرار جديد أو تغيير القرار الحالي أو إرسال رد إضافي:
 </div>
 <input
 type="text"
 value={returnAdminNotes[ret.id] || ''}
 onChange={e =>
 setReturnAdminNotes(prev => ({ ...prev, [ret.id]: e.target.value }))
 }
 placeholder="اكتب رد الفحص الفني أو ملاحظة جديدة للعميل..."
 className="w-full p-2.5 rounded-xl border border-line text-xs"
 />
 <div className="flex flex-wrap gap-2">
 <button
 onClick={() => {
 setConfirmDialog({
 title: 'قبول المرتجع وإرجاعه للمخزن',
 message: 'هيتم قبول المرتجع، إرجاع القطعة للمخزن كسليمة، وصرف التعويض لمحفظة العميل فوراً. متأكد؟',
 confirmText: 'أيوه، تنفيذ',
 onConfirm: () => {
 handleResolveReturn(ret.id, 'مقبول', true, returnAdminNotes[ret.id]);
 setReturnAdminNotes(prev => ({ ...prev, [ret.id]: '' }));
 setConfirmDialog(null);
 }
 });
 }}
 className={`flex-1 py-2 px-3 rounded-xl text-white text-xs font-bold transition ${
 ret.status === 'مقبول' && ret.resolutionType === 'مرتجع سليم للمخزن'
 ? 'bg-emerald-800 ring-2 ring-emerald-400'
 : 'bg-emerald-600 hover:bg-emerald-700'
 }`}
 >
 قبول (إرجاع للمخزن كـ سليم + تعويض)
 </button>
 <button
 onClick={() => {
 setConfirmDialog({
 title: 'قبول المرتجع كتالف',
 message: 'هيتم قبول المرتجع وتسجيله كتالف (مش هيرجع للمخزن) وصرف التعويض لمحفظة العميل فوراً. متأكد؟',
 confirmText: 'أيوه، تنفيذ',
 onConfirm: () => {
 handleResolveReturn(ret.id, 'مقبول', false, returnAdminNotes[ret.id]);
 setReturnAdminNotes(prev => ({ ...prev, [ret.id]: '' }));
 setConfirmDialog(null);
 }
 });
 }}
 className={`flex-1 py-2 px-3 rounded-xl text-white text-xs font-bold transition ${
 ret.status === 'مقبول' && ret.resolutionType === 'هالك / تالف'
 ? 'bg-amber-800 ring-2 ring-amber-400'
 : 'bg-amber-600 hover:bg-amber-700'
 }`}
 >
 قبول (تسجيل كـ تالف + تعويض)
 </button>
 <button
 onClick={() => {
 setConfirmDialog({
 title: 'رفض المرتجع',
 message: 'هيتم رفض المرتجع وعكس أي تعويض اتصرف للعميل قبل كده. متأكد؟',
 confirmText: 'أيوه، تنفيذ',
 onConfirm: () => {
 handleResolveReturn(ret.id, 'مرفوض', false, returnAdminNotes[ret.id]);
 setReturnAdminNotes(prev => ({ ...prev, [ret.id]: '' }));
 setConfirmDialog(null);
 }
 });
 }}
 className={`py-2 px-3 rounded-xl text-white text-xs font-bold transition ${
 ret.status === 'مرفوض'
 ? 'bg-rose-800 ring-2 ring-rose-400'
 : 'bg-rose-600 hover:bg-rose-700'
 }`}
 >
 رفض المرتجع (وعكس التعويض إن وجد)
 </button>
 </div>
 </div>
 <div className="flex flex-wrap gap-2 pt-2 border-t border-line text-xs font-extrabold">
 <button
 type="button"
 onClick={() => {
 setReturnsList(prev => prev.map(r => (r.id === ret.id ? { ...r, closed: !r.closed } : r)));
 setOpenAdminCards(prev => ({ ...prev, [ret.id]: false }));
 }}
 className="px-3.5 py-2 rounded-xl bg-surface2 hover:bg-surface2 text-fg"
 >
 {ret.closed ? 'افتح الطلب تاني' : 'اقفل الطلب'}
 </button>
 <button
 type="button"
 onClick={() =>
 setConfirmDialog({
 title: 'مسح طلب المرتجع',
 message: `هتمسح طلب المرتجع ${ret.id} نهائياً من السجل. المسح مابيرجّعش أي تسوية اتعملت قبل كده على المخزن أو الحساب.`,
 confirmText: 'امسح الطلب',
 onConfirm: () => {
 setReturnsList(prev => prev.filter(r => r.id !== ret.id));
 sbDelete('returns_list', ret.id);
 setConfirmDialog(null);
 showToast('طلب المرتجع اتمسح.', 'success');
 }
 })
 }
 className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30"
 >
 مسح الطلب
 </button>
 </div>
 </div>
 )}
 </div>
 ))}
 </div>

 )}

 {/* Complaints Column (Multi-Reply Thread Support + Status Toggle) */}
 {(adminReturnsSubTab === 'complaints' || adminReturnsSubTab === 'both') && (
 <div className="space-y-4">
 <div>
 <h3 className="text-base font-extrabold text-fg">
 الشكاوى ومقترحات توفير الأصناف ({complaints.filter(c => showClosedItems || c.status !== 'مغلق').length} من {complaints.length})
 </h3>
 <p className="text-xs text-muted">
 يمكنك الرد أكثر من مرة في نفس التذكرة وتغيير حالتها في أي وقت
 </p>
 </div>

 {complaints.filter(c => showClosedItems || c.status !== 'مغلق').map(tck => (
 <div key={tck.id} className="bg-surface rounded-2xl p-4 border border-line shadow-xs space-y-3">
 <button type="button" onClick={() => toggleAdminCard(tck.id)} className="w-full flex items-center justify-between gap-2 text-right">
 <span className="flex items-center gap-2 min-w-0 flex-wrap">
 <span className="font-extrabold text-slate-600 text-xs">{tck.id}</span>
 <span className="text-[11px] font-bold text-muted truncate">{tck.clientName} — {tck.subject}</span>
 <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${tck.status === 'مغلق' ? 'bg-surface2 text-muted' : tck.status === 'تم الرد' ? 'bg-accent/15 text-accent-text border border-accent/30' : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'}`}>
 {tck.status}
 </span>
 </span>
 <span className="w-7 h-7 shrink-0 rounded-lg bg-nav2 text-white flex items-center justify-center">
 {openAdminCards[tck.id] ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
 </span>
 </button>
 {openAdminCards[tck.id] && (
 <div className="space-y-3">
 <div className="flex justify-between items-center text-xs">
 <span className="font-bold text-slate-600">
 {tck.id} • {tck.clientName}
 </span>
 <div className="flex items-center gap-2">
 <select
 value={tck.status}
 onChange={e => {
 const nextSt = e.target.value;
 setComplaints(prev =>
 prev.map(c => (c.id === tck.id ? { ...c, status: nextSt } : c))
 );
 }}
 className="px-2.5 py-1 rounded-lg border border-line text-[11px] font-bold bg-surface2"
 >
 <option value="مفتوح">الحالة: مفتوح</option>
 <option value="قيد المتابعة">الحالة: قيد المتابعة</option>
 <option value="تم الرد">الحالة: تم الرد</option>
 <option value="مغلق">الحالة: مغلق</option>
 </select>
 </div>
 </div>

 <div className="text-sm font-extrabold text-fg">{tck.subject}</div>
 <p className="text-xs text-muted bg-surface2 p-3 rounded-xl">{tck.message}</p>

 {/* Full Conversation Thread */}
 {(tck.replies || []).length > 0 && (
 <div className="space-y-2 pe-3 border-r-2 border-slate-200 ">
 {tck.replies.map(rep => (
 <div
 key={rep.id}
 className={`p-2.5 rounded-xl text-xs ${
 rep.sender === 'admin'
 ? 'bg-accent/15 border border-accent/30 text-fg'
 : 'bg-surface2 border border-line text-fg'
 }`}
 >
 <div className="flex justify-between text-[10px] font-bold opacity-75 mb-0.5">
 <span>{rep.sender === 'admin' ? '🛡️ رد الإدارة' : `👤 ${rep.senderName}`}</span>
 <span>{rep.date}</span>
 </div>
 <div>{rep.text}</div>
 </div>
 ))}
 </div>
 )}

 {/* Always-active Reply Input for Unlimited Replies */}
 <div className="flex gap-2 pt-2 border-t border-line">
 <input
 type="text"
 value={complaintReplies[tck.id] || ''}
 onChange={e =>
 setComplaintReplies(prev => ({ ...prev, [tck.id]: e.target.value }))
 }
 placeholder="اكتب رداً جديداً للعميل (يمكنك إرسال أكثر من رد)..."
 className="flex-1 px-3 py-2 rounded-xl border border-line text-xs"
 />
 <button
 onClick={() => {
 const replyText = (complaintReplies[tck.id] || '').trim();
 if (!replyText) return;
 const doSendComplaintReply = () => {
 setComplaints(prev =>
 prev.map(c =>
 c.id === tck.id
 ? {
 ...c,
 status: 'تم الرد',
 adminReply: replyText,
 replies: [
 ...(c.replies || []),
 {
 id: `rep_${Date.now()}`,
 sender: 'admin',
 senderName: 'إدارة الدعم والمشتريات',
 text: replyText,
 date: new Date().toISOString().slice(0, 16).replace('T', ' ')
 }
 ]
 }
 : c
 )
 );
 setComplaintReplies(prev => ({ ...prev, [tck.id]: '' }));
 showToast('تم إرسال الرد وإضافته لسجل المحادثة مع التاجر!', 'success');
 };
 if (tck.status === 'مغلق') {
 setConfirmDialog({
 title: 'الشكوى دي مقفولة',
 msg: 'إرسال الرد هيعيد فتح الشكوى ويرجعها لحالة «تم الرد». تكمل؟',
 confirmLabel: 'أيوه، ابعت وافتحها',
 onConfirm: () => {
 doSendComplaintReply();
 setConfirmDialog(null);
 }
 });
 } else {
 doSendComplaintReply();
 }
 }}
 className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold"
 >
 إرسال رد
 </button>
 </div>
 <div className="flex flex-wrap gap-2 pt-2 border-t border-line text-xs font-extrabold">
 <button
 type="button"
 onClick={() => {
 setComplaints(prev => prev.map(c => (c.id === tck.id ? { ...c, status: c.status === 'مغلق' ? 'مفتوح' : 'مغلق' } : c)));
 setOpenAdminCards(prev => ({ ...prev, [tck.id]: false }));
 }}
 className="px-3.5 py-2 rounded-xl bg-surface2 hover:bg-surface2 text-fg"
 >
 {tck.status === 'مغلق' ? 'افتح الشكوى تاني' : 'اقفل الشكوى'}
 </button>
 <button
 type="button"
 onClick={() =>
 setConfirmDialog({
 title: 'مسح الشكوى',
 message: `هتمسح الرسالة ${tck.id} من ${tck.clientName} نهائياً مع كل الردود.`,
 confirmText: 'امسح الشكوى',
 onConfirm: () => {
 setComplaints(prev => prev.filter(c => c.id !== tck.id));
 sbDelete('complaints', tck.id);
 setConfirmDialog(null);
 showToast('الشكوى اتمسحت.', 'success');
 }
 })
 }
 className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30"
 >
 مسح الشكوى
 </button>
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>);
}

export function renderAdminApproveRequestModal(ctx) {
 const { approvingRequestObj, clients, groups, setAccountRequests, setApprovingRequestObj, setClients, setSelectedAdminClientId, showToast } = ctx;
 if (!approvingRequestObj) return null;
 const { req } = approvingRequestObj;

 const handleConfirmApproval = (e) => {
 e.preventDefault();
 // Login is by phone — never create a second account with a phone
 // that already belongs to an existing client.
 const cleanReqPhone = normalizeDigits(req.phone || '').trim().replace(/\s+/g, '');
 const dupClient = clients.find(c => String(c.phone || '').trim() === cleanReqPhone && cleanReqPhone);
 if (dupClient) {
 showToast(`⚠️ الرقم ${cleanReqPhone} مسجّل أصلاً على حساب "${dupClient.name}" — مش هينفع إنشاء حساب تاني بنفس الرقم.`, 'error');
 return;
 }
 const newClientId = `cli_${Date.now()}`;
 const newClient = {
 id: newClientId,
 name: req.shopName,
 owner: req.ownerName,
 phone: req.phone,
 email: req.email || '',
 password: approvingRequestObj.password || '123',
 accountType: approvingRequestObj.accountCategory === 'individual' ? 'individual' : 'shop',
 address: req.address,
 secondaryAddress: '',
 groupId: approvingRequestObj.groupId,
 walletBalance: 0,
 creditLimit: Number(approvingRequestObj.creditLimit) || 15000,
 avatar: approvingRequestObj.avatar || req.shopName.slice(0, 2),
 avatarBg: approvingRequestObj.avatarBg || 'from-emerald-600 to-slate-700',
 avatarImage: '',
 status: 'active',
 createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
 ledger: [
 {
 id: `ldg_${Date.now()}`,
 date: new Date().toISOString().slice(0, 16).replace('T', ' '),
 type: 'opening',
 ref: 'OPEN-ACC',
 desc: 'اعتماد وفتح الحساب التجاري بواسطة الإدارة',
 amount: 0,
 balanceAfter: 0
 }
 ]
 };

 setClients(prev => [newClient, ...prev]);
 setAccountRequests(prev =>
 prev.map(r => (r.id === req.id ? { ...r, status: 'approved' } : r))
 );
 setSelectedAdminClientId(newClientId);
 setApprovingRequestObj(null);
 showToast(
 `تمت الموافقة وإنشاء حساب "${newClient.name}" بنجاح! يمكنك التعديل عليه أو الدخول به الآن.`,
 'success'
 );
 };

 return (
 <div className="fixed inset-0 bg-nav backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <form
 onSubmit={handleConfirmApproval}
 className="bg-surface rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs"
 >
 <div className="flex items-center justify-between border-b border-line pb-3">
 <h3 className="text-base font-extrabold text-fg">
 اعتماد وتفعيل حساب: <span className="text-emerald-600">{req.shopName}</span>
 </h3>
 <button type="button" onClick={() => setApprovingRequestObj(null)} className="p-1 text-muted">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-3.5 rounded-xl bg-surface2 border border-line space-y-1">
 <div><b>المسؤول:</b> {req.ownerName} • <b>الموبايل:</b> <span className="font-mono">{req.phone}</span></div>
 <div><b>العنوان:</b> {req.address}</div>
 </div>

 <div className="space-y-3">
 <div>
 <label className="font-bold text-accent-text block mb-1">
 حدد فئة ومجموعة التسعير لهذا العميل (ستكون مخفية عنه):
 </label>
 <select
 value={approvingRequestObj.groupId}
 onChange={e =>
 setApprovingRequestObj(prev => ({ ...prev, groupId: e.target.value }))
 }
 className="w-full p-2.5 rounded-xl border border-line bg-bg font-extrabold text-fg"
 >
 {groups.map(g => (
 <option key={g.id} value={g.id}>
 {g.name} — العملة: {g.currency}
 </option>
 ))}
 </select>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="font-bold text-muted block mb-1">كلمة سر الحساب المعتمدة:</label>
 <PasswordInput
 type="text"
 required
 value={approvingRequestObj.password}
 onChange={e =>
 setApprovingRequestObj(prev => ({ ...prev, password: e.target.value }))
 }
 className="w-full p-2.5 rounded-xl border border-line font-mono font-bold"
 />
 </div>

 <div>
 <label className="font-bold text-muted block mb-1">سقف الائتمان / الآجل (ج.م):</label>
 <input
 type="number"
 value={approvingRequestObj.creditLimit}
 onChange={e =>
 setApprovingRequestObj(prev => ({ ...prev, creditLimit: e.target.value }))
 }
 className="w-full p-2.5 rounded-xl border border-line font-extrabold"
 />
 </div>
 </div>

 <div className="flex items-center gap-2 pt-1">
 <span className="font-bold text-muted">شعار الحساب:</span>
 {AVATAR_PRESETS.map(p => (
 <button
 key={p.id}
 type="button"
 onClick={() =>
 setApprovingRequestObj(prev => ({ ...prev, avatarBg: p.bg }))
 }
 className={`w-6 h-6 rounded-lg bg-gradient-to-br ${p.bg} ${
 approvingRequestObj.avatarBg === p.bg ? 'ring-2 ring-line scale-110' : 'opacity-70'
 }`}
 />
 ))}
 <input
 type="text"
 maxLength={3}
 value={approvingRequestObj.avatar}
 onChange={e =>
 setApprovingRequestObj(prev => ({ ...prev, avatar: e.target.value }))
 }
 className="w-16 px-2 py-1 rounded border border-line text-center font-extrabold"
 />
 </div>
 </div>

 <button
 type="submit"
 className="w-full py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-extrabold text-sm shadow-md"
 >
 تأكيد الموافقة وتفعيل الحساب الآن
 </button>
 </form>
 </div>
 );
 
}

export function renderAdminCreateClientModal(ctx) {
 const { adminCreateClientModalOpen, clients, directClientForm, groups, handleDirectClientAvatarUpload, renderClientAvatar, setAdminCreateClientModalOpen, setClients, setDirectClientForm, setSelectedAdminClientId, showToast } = ctx;
 if (!adminCreateClientModalOpen) return null;

 const handleCreateDirectClient = (e) => {
 e.preventDefault();
 if (!directClientForm.name.trim() || !directClientForm.phone.trim()) return;
 const cleanNewPhone = normalizeDigits(directClientForm.phone).trim().replace(/\s+/g, '');
 const dupClient = clients.find(c => String(c.phone || '').trim() === cleanNewPhone && cleanNewPhone);
 if (dupClient) {
 showToast(`⚠️ الرقم ${cleanNewPhone} مسجّل أصلاً على حساب "${dupClient.name}" — مش هينفع إنشاء حساب تاني بنفس الرقم.`, 'error');
 return;
 }

 const newId = `cli_${Date.now()}`;
 const created = {
 id: newId,
 name: directClientForm.name.trim(),
 owner: directClientForm.owner.trim() || directClientForm.name.trim(),
 phone: directClientForm.phone.trim(),
 email: directClientForm.email.trim(),
 password: directClientForm.password || String(Math.floor(100000 + Math.random() * 900000)),
 address: directClientForm.address.trim() || 'القاهرة',
 secondaryAddress: '',
 birthDate: directClientForm.birthDate || '',
 groupId: directClientForm.groupId,
 walletBalance: 0,
 creditLimit: Number(directClientForm.creditLimit) || 0,
 avatar: directClientForm.avatar || directClientForm.name.slice(0, 2),
 avatarBg: directClientForm.avatarBg,
 avatarImage: directClientForm.avatarImage || '',
 status: 'active',
 createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
 ledger: [
 {
 id: `ldg_${Date.now()}`,
 date: new Date().toISOString().slice(0, 16).replace('T', ' '),
 type: 'opening',
 ref: 'NEW-ACC',
 desc: 'إنشاء حساب تاجر جديد بواسطة الإدارة',
 amount: 0,
 balanceAfter: 0
 }
 ]
 };

 setClients(prev => [created, ...prev]);
 setSelectedAdminClientId(newId);
 setAdminCreateClientModalOpen(false);
 setDirectClientForm({
 name: '',
 owner: '',
 phone: '',
 email: '',
 password: '',
 address: '',
 groupId: groups[1]?.id || groups[0].id,
 creditLimit: 20000,
 avatar: 'SH',
 avatarBg: 'from-blue-600 to-slate-700',
 avatarImage: ''
 });
 showToast(`تم إنشاء حساب "${created.name}" بنجاح وإدراجه في قائمة العملاء!`, 'success');
 };

 return (
 <div className="fixed inset-0 bg-nav backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <form
 onSubmit={handleCreateDirectClient}
 className="bg-surface rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto text-xs"
 >
 <div className="flex items-center justify-between border-b border-line pb-3">
 <h3 className="text-base font-extrabold text-fg">
 إنشاء حساب مستخدم / تاجر جديد بواسطة الإدارة
 </h3>
 <button
 type="button"
 onClick={() => setAdminCreateClientModalOpen(false)}
 className="p-1 text-muted"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Avatar Picker */}
 <div className="p-3.5 rounded-xl bg-surface2 border border-line flex flex-wrap items-center gap-3">
 {renderClientAvatar(directClientForm, 'w-12 h-12 text-sm')}
 <div className="space-y-1.5">
 <div className="font-bold text-fg">صورة أو شعار العميل:</div>
 <div className="flex flex-wrap items-center gap-2">
 <label className="px-3 py-1 rounded-lg bg-nav2 text-white font-bold cursor-pointer">
 رفع صورة
 <input
 type="file"
 accept="image/*"
 onChange={handleDirectClientAvatarUpload}
 className="hidden"
 />
 </label>
 {AVATAR_PRESETS.map(p => (
 <button
 key={p.id}
 type="button"
 onClick={() =>
 setDirectClientForm(prev => ({ ...prev, avatarBg: p.bg, avatarImage: '' }))
 }
 className={`w-6 h-6 rounded-lg bg-gradient-to-br ${p.bg} ${
 directClientForm.avatarBg === p.bg && !directClientForm.avatarImage
 ? 'ring-2 ring-line'
 : 'opacity-70'
 }`}
 />
 ))}
 <input
 type="text"
 maxLength={3}
 value={directClientForm.avatar}
 onChange={e => setDirectClientForm(prev => ({ ...prev, avatar: e.target.value }))}
 className="w-14 px-2 py-1 rounded border border-line text-center font-extrabold bg-surface"
 />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="font-bold text-muted block mb-1">اسم المحل / الشركة *</label>
 <input
 type="text"
 required
 value={directClientForm.name}
 onChange={e => setDirectClientForm(prev => ({ ...prev, name: e.target.value }))}
 placeholder="مثال: مؤسسة الهدى للتجارة والتوريدات..."
 className="w-full p-2.5 rounded-xl border border-line font-bold"
 />
 </div>

 <div>
 <label className="font-bold text-muted block mb-1">اسم المسؤول / المالك *</label>
 <input
 type="text"
 required
 value={directClientForm.owner}
 onChange={e => setDirectClientForm(prev => ({ ...prev, owner: e.target.value }))}
 placeholder="مثال: أ. ياسر محمود..."
 className="w-full p-2.5 rounded-xl border border-line font-bold"
 />
 </div>

 <div>
 <label className="font-bold text-muted block mb-1">رقم الموبايل (اسم الدخول) *</label>
 <input
 type="text"
 required
 value={directClientForm.phone}
 onChange={e => setDirectClientForm(prev => ({ ...prev, phone: e.target.value }))}
 placeholder="01xxxxxxxxx"
 className="w-full p-2.5 rounded-xl border border-line font-mono font-bold"
 />
 </div>

 <div>
 <label className="font-bold text-rose-500 dark:text-rose-400 block mb-1">كلمة المرور (Password) *</label>
 <PasswordInput
 type="text"
 required
 value={directClientForm.password}
 onChange={e => setDirectClientForm(prev => ({ ...prev, password: e.target.value }))}
 className="w-full p-2.5 rounded-xl border border-line bg-bg font-mono font-extrabold text-fg"
 />
 </div>

 <div>
 <label className="font-bold text-accent-text block mb-1">فئة التسعير والعملة *</label>
 <select
 value={directClientForm.groupId}
 onChange={e => setDirectClientForm(prev => ({ ...prev, groupId: e.target.value }))}
 className="w-full p-2.5 rounded-xl border border-line bg-bg font-extrabold text-fg"
 >
 {groups.map(g => (
 <option key={g.id} value={g.id}>
 {g.name} ({g.currency})
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="font-bold text-muted block mb-1">سقف الائتمان / الآجل (ج.م):</label>
 <input
 type="number"
 value={directClientForm.creditLimit}
 onChange={e =>
 setDirectClientForm(prev => ({ ...prev, creditLimit: e.target.value }))
 }
 className="w-full p-2.5 rounded-xl border border-line font-extrabold"
 />
 </div>

 <div className="sm:col-span-2">
 <label className="font-bold text-muted block mb-1">العنوان التفصيلي:</label>
 <input
 type="text"
 required
 value={directClientForm.address}
 onChange={e => setDirectClientForm(prev => ({ ...prev, address: e.target.value }))}
 placeholder="المحافظة - المنطقة - الشارع..."
 className="w-full p-2.5 rounded-xl border border-line"
 />
 </div>
 </div>

 <button
 type="submit"
 className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md"
 >
 إنشاء وتفعيل الحساب الآن
 </button>
 </form>
 </div>
 );
 
}

export function renderAdminSecurityModal(ctx) {
 const { adminCredentials, adminNewPassword, adminNewUsername, adminSecurityModalOpen, getSupabaseConfig, sbHeaders, setAdminCredentials, setAdminLoginPass, setAdminLoginUser, setAdminNewPassword, setAdminNewUsername, setAdminSecurityModalOpen, showToast } = ctx;
 if (!adminSecurityModalOpen) return null;
 const handleSaveAdminCreds = async (e) => {
 e.preventDefault();
 if (!adminNewUsername.trim() || !adminNewPassword.trim()) return;
 const nextCreds = {
 username: adminNewUsername.trim(),
 password: adminNewPassword
 };
 // The credentials column is locked for the public key (security fix
 // #7), so credentials are updated only through the server-side gated
 // RPC, which first verifies the CURRENT credentials on the server.
 try {
 const { sbUrl, sbKey, isValid } = getSupabaseConfig();
 if (!isValid) throw new Error('no-config');
 const res = await fetch(`${sbUrl}/rest/v1/rpc/admin_update_credentials`, {
 method: 'POST',
 headers: sbHeaders(sbKey, { 'Content-Type': 'application/json' }),
 body: JSON.stringify({
 p_current_username: adminCredentials.username || '',
 p_current_password: adminCredentials.password || '',
 p_new_username: nextCreds.username,
 p_new_password: nextCreds.password
 })
 });
 if (!res.ok) throw new Error('rpc-unreachable');
 const ok = await res.json();
 if (ok !== true) {
 showToast('تعذّر تحديث بيانات الدخول: بيانات الدخول الحالية غير مطابقة على السيرفر.', 'error');
 return;
 }
 } catch (err) {
 showToast('تعذّر تحديث بيانات الدخول على السيرفر — تأكد من تشغيل SQL دالة admin_update_credentials أولاً.', 'error');
 return;
 }
 setAdminCredentials(nextCreds);
 try { window.localStorage.setItem('elzoghbi_v2_adminCredentials', JSON.stringify(nextCreds)); } catch (e2) {}
 setAdminLoginUser(nextCreds.username);
 setAdminLoginPass(nextCreds.password);
 setAdminSecurityModalOpen(false);
 showToast('تم تحديث اسم المستخدم وكلمة المرور الخاصة بلوحة تحكم الإدارة!', 'success');
 };

 return (
 <div className="fixed inset-0 bg-nav backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <form
 onSubmit={handleSaveAdminCreds}
 className="bg-surface rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs"
 >
 <div className="flex items-center justify-between border-b border-line pb-3">
 <h3 className="text-base font-extrabold text-fg">
 بيانات دخول مدير النظام (Admin Credentials)
 </h3>
 <button
 type="button"
 onClick={() => setAdminSecurityModalOpen(false)}
 className="p-1 text-muted"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div>
 <label className="font-bold text-muted block mb-1">اسم مستخدم الأدمن (Username):</label>
 <input
 type="text"
 required
 value={adminNewUsername}
 onChange={e => setAdminNewUsername(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-line font-mono font-bold"
 />
 </div>

 <div>
 <label className="font-bold text-muted block mb-1">كلمة مرور الأدمن (Password):</label>
 <PasswordInput
 type="text"
 required
 value={adminNewPassword}
 onChange={e => setAdminNewPassword(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-line font-mono font-bold"
 />
 </div>

 <button
 type="submit"
 className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-fg font-extrabold"
 >
 حفظ بيانات دخول الإدارة
 </button>
 </form>
 </div>
 );
 
}
