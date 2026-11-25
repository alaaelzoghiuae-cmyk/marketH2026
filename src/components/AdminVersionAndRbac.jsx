import React, { useMemo, useState } from 'react';
import {
  History, RotateCcw, ShieldCheck, Plus, Save, AlertTriangle, CheckCircle2,
  GitCompare, Archive, Trash2, UserCheck
} from 'lucide-react';
import {
  ADVANCED_RBAC_ROLES,
  CAPABILITY_LABELS,
  readVersionHistory,
  createVersionSnapshot,
  computeJsonDiff,
  applyThemeTokensToDocument
} from '../lib/adminControlCenter.js';

export function AdminVersionHistoryPanel({
  siteSettings,
  setSiteSettings,
  saveSiteSettingsImmediate,
  adminSession,
  showToast
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [scopeFilter, setScopeFilter] = useState('ALL');

  const history = useMemo(() => readVersionHistory(siteSettings), [siteSettings]);
  const filtered = useMemo(
    () => (scopeFilter === 'ALL' ? history : history.filter((h) => h.scope === scopeFilter)),
    [history, scopeFilter]
  );
  const selected = useMemo(() => history.find((h) => h.id === selectedId) || filtered[0] || null, [history, filtered, selectedId]);
  const diffs = useMemo(() => (selected ? computeJsonDiff(selected.previousValue, selected.newValue) : []), [selected]);

  const createManualBackup = () => {
    const snap = {
      themeTokens: siteSettings?.themeTokens || null,
      homeSectionsConfig: siteSettings?.homeSectionsConfig || null,
      cmsPages: siteSettings?.cmsPages || null,
      discoveredControls: siteSettings?.discoveredControls || null,
      storeName: siteSettings?.storeName || 'ELZOGHBI'
    };
    const entry = createVersionSnapshot({
      scope: 'full_backup',
      label: `نسخة احتياطية كاملة (${new Date().toLocaleDateString('ar-EG')})`,
      actorName: adminSession?.displayName || adminSession?.username || 'المالك',
      actorRole: adminSession?.roleLabel || 'super_admin',
      previousValue: snap,
      newValue: snap,
      isMajorBackup: true
    });
    const nextHist = [entry, ...history].slice(0, 60);
    setSiteSettings((prev) => ({ ...prev, adminVersionHistory: nextHist }));
    if (saveSiteSettingsImmediate) saveSiteSettingsImmediate({ adminVersionHistory: nextHist });
    showToast && showToast('تم إنشاء نسخة احتياطية كاملة وحفظها في السجل ✓', 'success');
  };

  const restoreEntry = (entry) => {
    if (!entry || !entry.previousValue) {
      showToast && showToast('لا توجد بيانات سابقة قابلة للاستعادة في هذا السجل', 'warning');
      return;
    }
    const ok = window.confirm(
      `تحذير أمان: سيتم استعادة الحالة السابقة قبل «${entry.label}».\nسيتم حفظ نسخة احتياطية تلقائية من الوضع الحالي قبل الاستعادة لضمان عدم فقدان أي بيانات.\nهل تريد المتابعة؟`
    );
    if (!ok) return;

    // Auto-backup before restoring
    const safetyBackup = createVersionSnapshot({
      scope: entry.scope,
      label: `نسخة أمان تلقائية قبل استعادة: ${entry.label}`,
      actorName: adminSession?.displayName || adminSession?.username || 'المالك',
      actorRole: adminSession?.roleLabel || 'super_admin',
      previousValue: entry.newValue,
      newValue: entry.previousValue,
      isMajorBackup: true
    });

    const patch = {};
    const pv = entry.previousValue;
    if (entry.scope === 'theme') {
      patch.themeTokens = pv;
      applyThemeTokensToDocument(pv);
    } else if (entry.scope === 'sections' && pv.homeSectionsConfig) {
      patch.homeSectionsConfig = pv.homeSectionsConfig;
    } else if (entry.scope === 'pages' && pv.cmsPages) {
      patch.cmsPages = pv.cmsPages;
    } else if (entry.scope === 'visual_editor') {
      if (pv.homeSectionsConfig) patch.homeSectionsConfig = pv.homeSectionsConfig;
      if (pv.storeName) patch.storeName = pv.storeName;
      if (pv.trustBadges) patch.discoveredControls = { ...(siteSettings?.discoveredControls || {}), trustBadges: pv.trustBadges };
    } else if (entry.scope === 'settings' && pv.discoveredControls) {
      patch.discoveredControls = pv.discoveredControls;
    } else if (entry.scope === 'full_backup') {
      if (pv.themeTokens) { patch.themeTokens = pv.themeTokens; applyThemeTokensToDocument(pv.themeTokens); }
      if (pv.homeSectionsConfig) patch.homeSectionsConfig = pv.homeSectionsConfig;
      if (pv.cmsPages) patch.cmsPages = pv.cmsPages;
      if (pv.discoveredControls) patch.discoveredControls = pv.discoveredControls;
      if (pv.storeName) patch.storeName = pv.storeName;
    }

    patch.adminVersionHistory = [safetyBackup, ...history].slice(0, 60);
    setSiteSettings((prev) => ({ ...prev, ...patch }));
    if (saveSiteSettingsImmediate) saveSiteSettingsImmediate(patch);
    showToast && showToast('تمت استعادة النسخة السابقة بنجاح مع حفظ نسخة أمان تلقائية ✓', 'success');
  };

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; }
  };

  return (
    <div className="space-y-4">
      <div className="elz-admin-card !p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-black text-fg">سجل الإصدارات والنسخ الاحتياطي (Version History & Backup)</h2>
            <p className="text-xs text-muted">تتبع جميع تعديلات التصميم والأقسام والصفحات مع مقارنة الفروقات واستعادة آمنة بضغطة واحدة</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {history[0] && (
            <button type="button" onClick={() => restoreEntry(history[0])} className="px-3.5 py-2 rounded-xl bg-surface2 border border-line text-xs font-extrabold text-fg inline-flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> التراجع عن آخر تعديل
            </button>
          )}
          <button type="button" onClick={createManualBackup} className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-black inline-flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5" /> إنشاء نسخة احتياطية الآن
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[['ALL', 'الكل'], ['theme', 'الهوية والألوان'], ['visual_editor', 'المحرر المرئي'], ['sections', 'الأقسام'], ['pages', 'الصفحات'], ['settings', 'الإعدادات'], ['full_backup', 'نسخ كاملة']].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setScopeFilter(k)} className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${scopeFilter === k ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface border-line text-fg'}`}>{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-5 elz-admin-card space-y-2">
          <h3 className="text-xs font-black text-muted">سجل التعديلات ({filtered.length})</h3>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-muted">لا توجد إصدارات مسجلة بعد — اضغط «إنشاء نسخة احتياطية الآن» للبدء.</div>
          ) : (
            filtered.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedId(h.id)}
                className={`w-full text-start p-3 rounded-xl border transition space-y-1 ${
                  selected?.id === h.id ? 'border-[#0071E3] bg-[#0071E3]/10' : 'border-line bg-surface2/50 hover:border-[#0071E3]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-fg truncate">{h.label}</span>
                  {h.isMajorBackup && <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-500/15 text-emerald-600 shrink-0">نسخة رئيسية</span>}
                </div>
                <div className="text-[11px] text-muted flex items-center justify-between gap-2">
                  <span>بواسطة: <b>{h.actorName}</b></span>
                  <span>{fmtDate(h.createdAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="xl:col-span-7 elz-admin-card space-y-4">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <div>
                  <h3 className="text-sm font-black text-fg flex items-center gap-1.5"><GitCompare className="w-4 h-4 text-[#0071E3]" /> مقارنة التغييرات — {selected.label}</h3>
                  <div className="text-[11px] text-muted mt-0.5">المدير: {selected.actorName} ({selected.actorRole}) · {fmtDate(selected.createdAt)}</div>
                </div>
                <button type="button" onClick={() => restoreEntry(selected)} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black inline-flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> استعادة هذه النسخة
                </button>
              </div>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-[11px] text-fg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>الاستعادة آمنة تماماً: يقوم النظام تلقائياً بأخذ نسخة احتياطية من إعداداتك الحالية قبل الرجوع للإصدار المختار ولا يمس بيانات الطلبات أو العملاء.</span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-black text-muted">الحقول المتغيرة ({diffs.length}):</div>
                {diffs.length === 0 ? (
                  <div className="p-4 rounded-xl bg-surface2 text-xs font-bold text-muted">هذه نسخة احتياطية مرجعية متطابقة (Snapshot).</div>
                ) : (
                  <div className="elz-admin-table-wrap rounded-xl border border-line">
                    <table className="w-full text-xs text-start">
                      <thead>
                        <tr className="bg-surface2">
                          <th className="p-2.5 text-start">الإعداد / المفتاح</th>
                          <th className="p-2.5 text-start">القيمة السابقة</th>
                          <th className="p-2.5 text-start">القيمة الجديدة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {diffs.map((d) => (
                          <tr key={d.key}>
                            <td className="p-2.5 font-mono font-bold text-fg">{d.key}</td>
                            <td className="p-2.5 text-rose-500 font-mono text-[11px] break-all">{d.before}</td>
                            <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] break-all">{d.after}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted">اختر إصداراً من السجل لمقارنة التغييرات أو استعادته.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminAdvancedRolesStudio({
  siteSettings,
  setSiteSettings,
  saveSiteSettingsImmediate,
  onApplyRoleToEmployeeForm,
  showToast
}) {
  const customRoles = Array.isArray(siteSettings?.customAdminRoles) ? siteSettings.customAdminRoles : [];
  const allRoles = [...ADVANCED_RBAC_ROLES, ...customRoles];
  const [selectedRoleId, setSelectedRoleId] = useState(allRoles[0].id);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const selectedRole = allRoles.find((r) => r.id === selectedRoleId) || allRoles[0];
  const isCustom = customRoles.some((r) => r.id === selectedRole.id);

  const createCustomRole = () => {
    const name = newRoleName.trim();
    if (!name) { showToast && showToast('اكتب اسم الدور المخصص أولاً', 'warning'); return; }
    const roleObj = {
      id: `custom_role_${Date.now()}`,
      nameAr: name,
      nameEn: name,
      color: 'blue',
      desc: newRoleDesc.trim() || 'دور إداري مخصص',
      pages: ['overview'],
      capabilities: { canView: true, canEdit: true, canDelete: false, canPublish: false, canManageUsers: false, canEditTheme: false, canManagePermissions: false, canRestoreVersions: false }
    };
    const next = [...customRoles, roleObj];
    setSiteSettings((prev) => ({ ...prev, customAdminRoles: next }));
    if (saveSiteSettingsImmediate) saveSiteSettingsImmediate({ customAdminRoles: next });
    setSelectedRoleId(roleObj.id);
    setNewRoleName('');
    setNewRoleDesc('');
    showToast && showToast(`تم إنشاء الدور المخصص «${name}» ✓`, 'success');
  };

  const toggleCustomCap = (capKey) => {
    if (!isCustom) return;
    const next = customRoles.map((r) =>
      r.id === selectedRole.id
        ? { ...r, capabilities: { ...r.capabilities, [capKey]: !r.capabilities?.[capKey] } }
        : r
    );
    setSiteSettings((prev) => ({ ...prev, customAdminRoles: next }));
    if (saveSiteSettingsImmediate) saveSiteSettingsImmediate({ customAdminRoles: next });
  };

  const deleteCustomRole = (id) => {
    if (!window.confirm('حذف الدور المخصص؟')) return;
    const next = customRoles.filter((r) => r.id !== id);
    setSiteSettings((prev) => ({ ...prev, customAdminRoles: next }));
    if (saveSiteSettingsImmediate) saveSiteSettingsImmediate({ customAdminRoles: next });
    setSelectedRoleId(ADVANCED_RBAC_ROLES[0].id);
    showToast && showToast('تم حذف الدور المخصص', 'info');
  };

  return (
    <div className="elz-admin-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h3 className="text-sm font-black text-fg flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0071E3]" />
            مصفوفة الأدوار الإدارية المتقدمة (9 أدوار قياسية + أدوار مخصصة)
          </h3>
          <p className="text-[11px] text-muted">تحكم دقيق في الصفحات والقدرات التشغيلية (تعديل، حذف، نشر، تعديل التصميم، إدارة الصلاحيات) مع ربط مباشر بـ Supabase RLS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-5 space-y-2">
          <div className="grid grid-cols-1 gap-1.5">
            {allRoles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRoleId(r.id)}
                className={`w-full text-start px-3 py-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                  selectedRole.id === r.id ? 'border-[#0071E3] bg-[#0071E3]/10 text-fg' : 'border-line bg-surface2/50 text-fg hover:border-[#0071E3]/50'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-black truncate">{r.nameAr}</div>
                  <div className="text-[10.5px] text-muted truncate">{r.desc}</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface border border-line shrink-0">
                  {r.pages.includes('*') ? 'كامل' : `${r.pages.length} قسم`}
                </span>
              </button>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-surface2/70 border border-line space-y-2">
            <div className="text-xs font-black text-fg">إنشاء دور مخصص جديد</div>
            <input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="اسم الدور (مثال: مشرف الفروع)" className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-bold" />
            <input value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} placeholder="وصف مختصر للدور" className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-bold" />
            <button type="button" onClick={createCustomRole} className="w-full py-2 rounded-lg bg-[#0071E3] text-white text-xs font-black inline-flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" /> إضافة دور مخصص
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 p-4 rounded-2xl bg-surface2/50 border border-line space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-black text-fg">{selectedRole.nameAr}</div>
              <div className="text-xs text-muted">{selectedRole.desc}</div>
            </div>
            <div className="flex items-center gap-2">
              {onApplyRoleToEmployeeForm && (
                <button
                  type="button"
                  onClick={() => onApplyRoleToEmployeeForm(selectedRole)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" /> إنشاء موظف بهذا الدور
                </button>
              )}
              {isCustom && (
                <button type="button" onClick={() => deleteCustomRole(selectedRole.id)} className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-black text-muted">صلاحيات العمليات (Capabilities):</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CAPABILITY_LABELS.map(([capKey, capLabel]) => {
                const enabled = !!selectedRole.capabilities?.[capKey];
                return (
                  <label
                    key={capKey}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold ${isCustom ? 'cursor-pointer' : ''} ${
                      enabled ? 'bg-emerald-500/10 border-emerald-500/30 text-fg' : 'bg-surface border-line text-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={!isCustom}
                      onChange={() => toggleCustomCap(capKey)}
                    />
                    <span>{capLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-black text-muted">الأقسام المسموح بدخولها:</div>
            <div className="flex flex-wrap gap-1.5">
              {selectedRole.pages.map((p) => (
                <span key={p} className="px-2.5 py-1 rounded-full bg-surface border border-line text-[11px] font-bold text-fg">
                  {p === '*' ? 'جميع أقسام النظام (صلاحية مطلقة)' : p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
