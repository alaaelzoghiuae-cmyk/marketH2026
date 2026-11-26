import React, { useState, useEffect, useRef, useMemo } from 'react';
import { resolveCategoryIconKey } from './lib/categoryIcons.jsx';
import { AdminThemeGuard } from './components/AdminThemeGuard.jsx';
import { OR_BRAND_IMAGES } from './data/brandImages';
import { X, Check, Phone } from 'lucide-react';
import { AD_THEMES, CREDIT_PAYMENT_ID, DEFAULT_SPIN_PRIZES, ELZOGHBI_LOGO, EMPTY_REG_FORM, INITIAL_ACCOUNT_REQUESTS, INITIAL_AUTO_TEMPLATES, INITIAL_BRANDS, INITIAL_CLIENTS, INITIAL_COMPLAINTS, INITIAL_CURRENCIES, INITIAL_GROUPS, INITIAL_MODELS, INITIAL_ORDERS, INITIAL_PARTS, INITIAL_PROMO_CODES, INITIAL_RETURNS, INITIAL_SHOWCASE_BARS, INITIAL_SITE_SETTINGS, INITIAL_STORE_ADS, PART_IMAGES, SHORTCUT_ICON_PRESETS, SRC_DEPOSIT_LABEL } from './data/constants.jsx';
import { getAdminJwt, adminSignIn, adminSignOut, fetchMyAdminProfile, ensureFreshAdminJwt } from './lib/sbAuth.js';
import { applyThemeTokensToDocument, DEFAULT_CMS_PAGES } from './lib/adminControlCenter.js';
import { ensureCacheVersions } from './lib/cacheVersions.js';
import { MarketplacePage, MarketplaceHost } from './sections/Marketplace.jsx';
import { B64_UPLOAD_CACHE, applyVisit, b64Key, detectVisitSource, escapeHtml, getPaymentMethods, loadPersisted, localDayKey, normalizeDigits, nowStamp, readFileAsDataUrl } from './lib/utils.jsx';
import { isOrCatalogDisabledInStorage, isOrPrefixedName, mergeOrBrandsList, mergeOrModelsList, mergeOrPartsList, normalizePartCategory, readPersistedDeletedSliceMap } from './lib/catalogUtils.js';
import { I18N_ATTRS, i18nRestoreNode, i18nTranslateNode } from './i18n.jsx';
import { renderVvipBrandEmblem as renderVvipBrandEmblemImpl, renderRoleSwitcherBar as renderRoleSwitcherBarImpl, renderClientAvatar as renderClientAvatarImpl, renderProductCard as renderProductCardImpl, renderSocialIconsGroup as renderSocialIconsGroupImpl, renderClientHeader as renderClientHeaderImpl, renderCheckoutFooter as renderCheckoutFooterImpl, renderAnnouncements as renderAnnouncementsImpl, renderRecentlyViewedStrip as renderRecentlyViewedStripImpl, renderHomeView as renderHomeViewImpl, renderStickyCartBar as renderStickyCartBarImpl, renderStorefront as renderStorefrontImpl, renderFreeShippingProgressBar as renderFreeShippingProgressBarImpl, renderSmartCrossSellBundles as renderSmartCrossSellBundlesImpl, renderCashierImpulseShelf as renderCashierImpulseShelfImpl, renderCartDrawer as renderCartDrawerImpl, renderVipRouteView as renderVipRouteViewImpl, renderFilterSheet as renderFilterSheetImpl, renderLightbox as renderLightboxImpl, renderClientFooter as renderClientFooterImpl } from './sections/Storefront.jsx';
import { renderKaramboStrip as renderKaramboStripImpl, renderKaramboPage as renderKaramboPageImpl, renderAdminKarambo as renderAdminKaramboImpl, parseGuideSitemap, parseGuidePhoneHtml, computeValueScore } from './sections/Karambo.jsx';
import { GUIDE_PHONES_SEED } from './data/guidePhonesSeed.js';
import { mergeKaramboCfg } from './data/karamboConfig.js';
import { STORE_REVIEW_ENTITIES_SEED, STORE_REVIEW_ENTRIES_SEED, STORE_REVIEW_QUESTIONS_SEED } from './data/storeReviewsSeed.js';
import { renderCheckoutView as renderCheckoutViewImpl } from './sections/Checkout.jsx';
import { renderClientOrdersView as renderClientOrdersViewImpl, renderClientLedgerView as renderClientLedgerViewImpl, renderClientReturnsView as renderClientReturnsViewImpl, renderClientComplaintsView as renderClientComplaintsViewImpl, renderClientProfileSettingsView as renderClientProfileSettingsViewImpl, renderClientAccountPortal as renderClientAccountPortalImpl } from './sections/Account.jsx';
import { renderAdminDashboard as renderAdminDashboardImpl, renderAdminSubTabBar as renderAdminSubTabBarImpl, renderAdminOverview as renderAdminOverviewImpl, renderVisitorStats as renderVisitorStatsImpl, renderAdminOrders as renderAdminOrdersImpl, renderAdminTeam as renderAdminTeamImpl } from './sections/AdminMain.jsx';
import { renderAdminCatalog as renderAdminCatalogImpl, renderAdminQuickStock as renderAdminQuickStockImpl, renderAdminGroups as renderAdminGroupsImpl, renderProfitProtectionShieldCard as renderProfitProtectionShieldCardImpl } from './sections/AdminCatalog.jsx';
import { renderAdminPromoCodes as renderAdminPromoCodesImpl, renderAdSeg as renderAdSegImpl, renderAdToggle as renderAdToggleImpl, renderAdminRestockAlertsView as renderAdminRestockAlertsViewImpl, renderAdminFeatureFlagsDashboard as renderAdminFeatureFlagsDashboardImpl } from './sections/AdminMarketing.jsx';
import { renderAdminSiteSettings as renderAdminSiteSettingsImpl, renderAdminStorefrontCms as renderAdminStorefrontCmsImpl, renderCmsAccordionHeader as renderCmsAccordionHeaderImpl, renderPrecisionImageControls as renderPrecisionImageControlsImpl } from './sections/AdminCms.jsx';
import { renderAdminClients as renderAdminClientsImpl, renderAdminReturnsAndComplaints as renderAdminReturnsAndComplaintsImpl, renderAdminApproveRequestModal as renderAdminApproveRequestModalImpl, renderAdminCreateClientModal as renderAdminCreateClientModalImpl, renderAdminSecurityModal as renderAdminSecurityModalImpl } from './sections/AdminClients.jsx';
import { renderGmReportDocumentContent as renderGmReportDocumentContentImpl, renderAdminExecutiveReportsView as renderAdminExecutiveReportsViewImpl, renderGmReportPrintModal as renderGmReportPrintModalImpl, renderAdminDatabaseSchema as renderAdminDatabaseSchemaImpl } from './sections/AdminReports.jsx';
import { renderConfirmDialogModal as renderConfirmDialogModalImpl, renderSpinToWinModal as renderSpinToWinModalImpl, renderFloatingSpinTrigger as renderFloatingSpinTriggerImpl, renderLiveSocialProofToast as renderLiveSocialProofToastImpl, renderExitIntentModal as renderExitIntentModalImpl, renderCustomerRestockNotifyModal as renderCustomerRestockNotifyModalImpl, renderAdminRestockWhatsappModal as renderAdminRestockWhatsappModalImpl, renderWarrantyLookupModal as renderWarrantyLookupModalImpl, renderFamilyDevicesModal as renderFamilyDevicesModalImpl, renderConfettiOverlay as renderConfettiOverlayImpl, renderLoginModal as renderLoginModalImpl, renderReturnRequestModal as renderReturnRequestModalImpl } from './sections/Modals.jsx';
import { renderSrcChat as renderSrcChatImpl, renderSourcingBanner as renderSourcingBannerImpl, renderSourcingFormModal as renderSourcingFormModalImpl, renderClientSourcingSection as renderClientSourcingSectionImpl, renderAdminSourcing as renderAdminSourcingImpl } from './sections/Sourcing.jsx';
import { renderPrintModal as renderPrintModalImpl, renderProductOrAdDetailModal as renderProductOrAdDetailModalImpl, renderPartGroupPricesModal as renderPartGroupPricesModalImpl, renderBrandManagerModal as renderBrandManagerModalImpl, renderTemplateManagerModal as renderTemplateManagerModalImpl, renderBrandImageModal as renderBrandImageModalImpl, renderAddPartToModelModal as renderAddPartToModelModalImpl, renderEditPartModal as renderEditPartModalImpl, renderEditModelModal as renderEditModelModalImpl } from './sections/ProductModals.jsx';

Object.keys(SHORTCUT_ICON_PRESETS).forEach((presetKey) => {
  const item = SHORTCUT_ICON_PRESETS[presetKey];
  if (!item) return;
  if (!item.svg && typeof item.render === 'function') {
    item.svg = item.render();
  }
  if (typeof item.render !== 'function' && item.svg) {
    const cachedSvg = item.svg;
    item.render = () => cachedSvg;
  }
});

export default function App() {
  let ctxBag = {};
  const renderVvipBrandEmblem = (...args) => renderVvipBrandEmblemImpl(ctxBag, ...args);
  const renderRoleSwitcherBar = (...args) => renderRoleSwitcherBarImpl(ctxBag, ...args);
  const renderClientAvatar = (...args) => renderClientAvatarImpl(ctxBag, ...args);
  const renderProductCard = (...args) => renderProductCardImpl(ctxBag, ...args);
  const renderSocialIconsGroup = (...args) => renderSocialIconsGroupImpl(ctxBag, ...args);
  const renderClientHeader = (...args) => renderClientHeaderImpl(ctxBag, ...args);
  const renderCheckoutFooter = (...args) => renderCheckoutFooterImpl(ctxBag, ...args);
  const renderAnnouncements = (...args) => renderAnnouncementsImpl(ctxBag, ...args);
  const renderRecentlyViewedStrip = (...args) => renderRecentlyViewedStripImpl(ctxBag, ...args);
  const renderHomeView = (...args) => renderHomeViewImpl(ctxBag, ...args);
  const renderStickyCartBar = (...args) => renderStickyCartBarImpl(ctxBag, ...args);
  const renderStorefront = (...args) => renderStorefrontImpl(ctxBag, ...args);
  const renderKaramboStrip = (...args) => renderKaramboStripImpl(ctxBag, ...args);
  const renderKaramboPage = (...args) => renderKaramboPageImpl(ctxBag, ...args);
  const renderAdminKarambo = (...args) => renderAdminKaramboImpl(ctxBag, ...args);
  const renderFreeShippingProgressBar = (...args) => renderFreeShippingProgressBarImpl(ctxBag, ...args);
  const renderSmartCrossSellBundles = (...args) => renderSmartCrossSellBundlesImpl(ctxBag, ...args);
  const renderCashierImpulseShelf = (...args) => renderCashierImpulseShelfImpl(ctxBag, ...args);
  const renderCartDrawer = (...args) => renderCartDrawerImpl(ctxBag, ...args);
  const renderVipRouteView = (...args) => renderVipRouteViewImpl(ctxBag, ...args);
  const renderFilterSheet = (...args) => renderFilterSheetImpl(ctxBag, ...args);
  const renderLightbox = (...args) => renderLightboxImpl(ctxBag, ...args);
  const renderClientFooter = (...args) => renderClientFooterImpl(ctxBag, ...args);
  const renderCheckoutView = (...args) => renderCheckoutViewImpl(ctxBag, ...args);
  const renderClientOrdersView = (...args) => renderClientOrdersViewImpl(ctxBag, ...args);
  const renderClientLedgerView = (...args) => renderClientLedgerViewImpl(ctxBag, ...args);
  const renderClientReturnsView = (...args) => renderClientReturnsViewImpl(ctxBag, ...args);
  const renderClientComplaintsView = (...args) => renderClientComplaintsViewImpl(ctxBag, ...args);
  const renderClientProfileSettingsView = (...args) => renderClientProfileSettingsViewImpl(ctxBag, ...args);
  const renderClientAccountPortal = (...args) => renderClientAccountPortalImpl(ctxBag, ...args);
  const renderAdminDashboard = (...args) => renderAdminDashboardImpl(ctxBag, ...args);
  const renderAdminSubTabBar = (...args) => renderAdminSubTabBarImpl(ctxBag, ...args);
  const renderAdminOverview = (...args) => renderAdminOverviewImpl(ctxBag, ...args);
  const renderAdminTeam = (...args) => renderAdminTeamImpl(ctxBag, ...args);
  const renderVisitorStats = (...args) => renderVisitorStatsImpl(ctxBag, ...args);
  const renderAdminOrders = (...args) => renderAdminOrdersImpl(ctxBag, ...args);
  const renderAdminCatalog = (...args) => renderAdminCatalogImpl(ctxBag, ...args);
  const renderAdminQuickStock = (...args) => renderAdminQuickStockImpl(ctxBag, ...args);
  const renderAdminGroups = (...args) => renderAdminGroupsImpl(ctxBag, ...args);
  const renderProfitProtectionShieldCard = (...args) => renderProfitProtectionShieldCardImpl(ctxBag, ...args);
  const renderAdminPromoCodes = (...args) => renderAdminPromoCodesImpl(ctxBag, ...args);
  const renderAdSeg = (...args) => renderAdSegImpl(ctxBag, ...args);
  const renderAdToggle = (...args) => renderAdToggleImpl(ctxBag, ...args);
  const renderAdminRestockAlertsView = (...args) => renderAdminRestockAlertsViewImpl(ctxBag, ...args);
  const renderAdminFeatureFlagsDashboard = (...args) => renderAdminFeatureFlagsDashboardImpl(ctxBag, ...args);
  const renderAdminSiteSettings = (...args) => renderAdminSiteSettingsImpl(ctxBag, ...args);
  const renderAdminStorefrontCms = (...args) => renderAdminStorefrontCmsImpl(ctxBag, ...args);
  const renderCmsAccordionHeader = (...args) => renderCmsAccordionHeaderImpl(ctxBag, ...args);
  const renderPrecisionImageControls = (...args) => renderPrecisionImageControlsImpl(ctxBag, ...args);
  const renderAdminClients = (...args) => renderAdminClientsImpl(ctxBag, ...args);
  const renderAdminReturnsAndComplaints = (...args) => renderAdminReturnsAndComplaintsImpl(ctxBag, ...args);
  const renderAdminApproveRequestModal = (...args) => renderAdminApproveRequestModalImpl(ctxBag, ...args);
  const renderAdminCreateClientModal = (...args) => renderAdminCreateClientModalImpl(ctxBag, ...args);
  const renderAdminSecurityModal = (...args) => renderAdminSecurityModalImpl(ctxBag, ...args);
  const renderGmReportDocumentContent = (...args) => renderGmReportDocumentContentImpl(ctxBag, ...args);
  const renderAdminExecutiveReportsView = (...args) => renderAdminExecutiveReportsViewImpl(ctxBag, ...args);
  const renderGmReportPrintModal = (...args) => renderGmReportPrintModalImpl(ctxBag, ...args);
  const renderAdminDatabaseSchema = (...args) => renderAdminDatabaseSchemaImpl(ctxBag, ...args);
  const renderConfirmDialogModal = (...args) => renderConfirmDialogModalImpl(ctxBag, ...args);
  const renderSpinToWinModal = (...args) => renderSpinToWinModalImpl(ctxBag, ...args);
  const renderFloatingSpinTrigger = (...args) => renderFloatingSpinTriggerImpl(ctxBag, ...args);
  const renderLiveSocialProofToast = (...args) => renderLiveSocialProofToastImpl(ctxBag, ...args);
  const renderExitIntentModal = (...args) => renderExitIntentModalImpl(ctxBag, ...args);
  const renderCustomerRestockNotifyModal = (...args) => renderCustomerRestockNotifyModalImpl(ctxBag, ...args);
  const renderAdminRestockWhatsappModal = (...args) => renderAdminRestockWhatsappModalImpl(ctxBag, ...args);
  const renderWarrantyLookupModal = (...args) => renderWarrantyLookupModalImpl(ctxBag, ...args);
  const renderFamilyDevicesModal = (...args) => renderFamilyDevicesModalImpl(ctxBag, ...args);
  const renderConfettiOverlay = (...args) => renderConfettiOverlayImpl(ctxBag, ...args);
  const renderLoginModal = (...args) => renderLoginModalImpl(ctxBag, ...args);
  const renderReturnRequestModal = (...args) => renderReturnRequestModalImpl(ctxBag, ...args);
  const renderSrcChat = (...args) => renderSrcChatImpl(ctxBag, ...args);
  const renderSourcingBanner = (...args) => renderSourcingBannerImpl(ctxBag, ...args);
  const renderSourcingFormModal = (...args) => renderSourcingFormModalImpl(ctxBag, ...args);
  const renderClientSourcingSection = (...args) => renderClientSourcingSectionImpl(ctxBag, ...args);
  const renderAdminSourcing = (...args) => renderAdminSourcingImpl(ctxBag, ...args);
  const renderPrintModal = (...args) => renderPrintModalImpl(ctxBag, ...args);
  const renderProductOrAdDetailModal = (...args) => renderProductOrAdDetailModalImpl(ctxBag, ...args);
  const renderPartGroupPricesModal = (...args) => renderPartGroupPricesModalImpl(ctxBag, ...args);
  const renderBrandManagerModal = (...args) => renderBrandManagerModalImpl(ctxBag, ...args);
  const renderTemplateManagerModal = (...args) => renderTemplateManagerModalImpl(ctxBag, ...args);
  const renderBrandImageModal = (...args) => renderBrandImageModalImpl(ctxBag, ...args);
  const renderAddPartToModelModal = (...args) => renderAddPartToModelModalImpl(ctxBag, ...args);
  const renderEditPartModal = (...args) => renderEditPartModalImpl(ctxBag, ...args);
  const renderEditModelModal = (...args) => renderEditModelModalImpl(ctxBag, ...args);
const [adminSidebarCollapsed, setAdminSidebarCollapsed] = useState(false);
const [adminSidebarSearch, setAdminSidebarSearch] = useState('');
const [adminCmsSubTab, setAdminCmsSubTab] = useState('ads');
const [adminFlagsSubTab, setAdminFlagsSubTab] = useState('switchboard');
const [adminSettingsSubTab, setAdminSettingsSubTab] = useState('identity');
const [adminReturnsSubTab, setAdminReturnsSubTab] = useState('returns');
const [adminSourcingSubTab, setAdminSourcingSubTab] = useState('requests');
const [adPreviewDevice, setAdPreviewDevice] = useState('desktop');
const [confirmDialog, setConfirmDialog] = useState(null);
const askConfirmDelete = (title, message, onConfirm, confirmText = 'نعم، تأكيد الحذف النهائي') => {
    setConfirmDialog({
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      confirmText
    });
  };
const [walletManageClient, setWalletManageClient] = useState(null);
const [walletActionType, setWalletActionType] = useState('add_credit');
const [walletInputAmount, setWalletInputAmount] = useState('');
const [walletActionNote, setWalletActionNote] = useState('');
const [cardImageIdx, setCardImageIdx] = useState({});
const [detailImageIdx, setDetailImageIdx] = useState(0);
const getCategoryFallbackImg = (part) => {
    const hay = `${part?.category || ''} ${part?.name || ''}`;
    if (/بطار|battery/i.test(hay)) return PART_IMAGES.battery;
    if (/كام|عدس|camera/i.test(hay)) return PART_IMAGES.camera;
    if (/شحن|فلات|بورد|جرس|سماعة|مايك|سوكيت|درج|فيرام|هاوس|شاسيه|flex/i.test(hay)) return PART_IMAGES.flex;
    return PART_IMAGES.screen;
  };
const getPartImagesList = (part) => {
    if (!part) return [PART_IMAGES.screen];
    const catFallback = getCategoryFallbackImg(part);
    const rawPrimary = String(part?.image_url || part?.imageUrl || part?.image || '').trim();
    const primarySplit = rawPrimary.startsWith('data:')
      ? [rawPrimary]
      : rawPrimary.split(/[\n|]+/).map(s => s.trim()).filter(Boolean);
    const cgpImages = Array.isArray(part?.customGroupPrices?._images) ? part.customGroupPrices._images.filter(Boolean) : [];
    const metaImages = Array.isArray(siteSettings?.partExtraMeta?.[part.id]?.images) ? siteSettings.partExtraMeta[part.id].images.filter(Boolean) : [];
    const rawArr = Array.isArray(part?.images) && part.images.length > 0
      ? part.images.filter(Boolean)
      : (Array.isArray(part?.imageUrls) && part.imageUrls.length > 0 ? part.imageUrls.filter(Boolean) : []);
    const combined = Array.from(new Set([...primarySplit, ...rawArr, ...cgpImages, ...metaImages].map(s => String(s || '').trim()).filter(Boolean))).slice(0, 8);
    if (combined.length > 1) {
      const withoutDefaultSvg = combined.filter(u => u !== PART_IMAGES.screen);
      if (withoutDefaultSvg.length > 0) return withoutDefaultSvg;
    }
    if (combined.length === 1 && combined[0] === PART_IMAGES.screen && catFallback !== PART_IMAGES.screen) {
      return [catFallback];
    }
    if (combined.length > 0) return combined;
    return [catFallback];
  };
const [uiTheme, setUiTheme] = useState(() => {
    try {
      const saved = window.localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch (e) {}
    return 'dark';
  });
useEffect(() => {
    try {
      const isDark = uiTheme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.setAttribute('data-theme', uiTheme);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', isDark ? '#000000' : '#ffffff');
    } catch (e) {}
  }, [uiTheme]);
const [favoritePartIds, setFavoritePartIds] = useState(() => {
    try {
      const raw = window.localStorage.getItem('elzoghbi_v2_favorites');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (e) {
      return [];
    }
  });
const isPartFavorited = (partId) => favoritePartIds.includes(String(partId));
const toggleFavoritePart = (partId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const pid = String(partId);
    setFavoritePartIds(prev => {
      const exists = prev.includes(pid);
      const next = exists ? prev.filter(id => id !== pid) : [...prev, pid];
      try {
        window.localStorage.setItem('elzoghbi_v2_favorites', JSON.stringify(next));
      } catch (err) {}
      showToast(exists ? 'تمت إزالة المنتج من قائمة المفضلة' : '❤️ تمت إضافة المنتج إلى قائمة المفضلة', 'info');
      return next;
    });
  };
const [newsletterEmail, setNewsletterEmail] = useState('');
const [nlSubject, setNlSubject] = useState('عروض وخصومات جديدة من متجر ELZOGHBI ');
const [nlBody, setNlBody] = useState('مرحباً عميلنا العزيز،\nيسعدنا إبلاغك بتوفر أحدث المنتجات والعروض الحصرية الآن في متجر ELZOGHBI بأفضل الأسعار والضمان المعتمد.');
const [nlPromoCode, setNlPromoCode] = useState('');
const handleNewsletterSubscribe = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const val = String(newsletterEmail || '').trim();
    if (!val) {
      showToast('يرجى إدخال بريدك الإلكتروني أو رقم واتساب للاشتراك في النشرة البريدية', 'warning');
      return;
    }
    try {
      const list = JSON.parse(window.localStorage.getItem('elzoghbi_v2_newsletter') || '[]');
      if (!list.includes(val)) {
        list.push(val);
        window.localStorage.setItem('elzoghbi_v2_newsletter', JSON.stringify(list));
      }
    } catch (err) {}
    setSiteSettings(prev => {
      const existing = Array.isArray(prev.newsletterSubscribers) ? prev.newsletterSubscribers : [];
      if (existing.some(s => String(s.email || s).toLowerCase() === val.toLowerCase())) return prev;
      const nextSubs = [{ id: `nl_${Date.now()}`, email: val, joinedAt: new Date().toISOString().slice(0, 10) }, ...existing];
      const nextSettings = { ...prev, newsletterSubscribers: nextSubs };
      try {
        window.localStorage.setItem('elzoghbi_v2_siteSettings', JSON.stringify(nextSettings));
      } catch (err) {}
      return nextSettings;
    });
    setNewsletterEmail('');
    showToast('🎉 تم اشتراكك في نشرة ELZOGHBI البريدية بنجاح! ستصلك أحدث العروض والخصومات أولاً بأول.', 'success');
  };
const getHeaderConfig = (settings = siteSettings) => {
    const raw = (settings && settings.headerConfig && typeof settings.headerConfig === 'object') ? settings.headerConfig : {};
    return {
      logoMode: raw.logoMode || 'geometric_svg', // 'geometric_svg' | 'emblem_webp' | 'custom_image' | 'text_only'
      customLogoUrl: raw.customLogoUrl || '',
      brandTitle: raw.brandTitle !== undefined ? raw.brandTitle : (settings?.storeName || 'ELZOGHBI'),
      brandSubtitle: raw.brandSubtitle !== undefined ? raw.brandSubtitle : 'E-COMMERCE',
      showSubtitle: raw.showSubtitle !== false,
      stickyHeader: raw.stickyHeader !== false,
      compactHeight: Boolean(raw.compactHeight),
      forceDarkHeader: Boolean(raw.forceDarkHeader),
      showSearchBar: raw.showSearchBar !== false,
      searchPlaceholder: raw.searchPlaceholder || 'ابحث عن منتج، موديل، أو كود...',
      showCartBtn: raw.showCartBtn !== false,
      showWishlistBtn: raw.showWishlistBtn !== false,
      showAccountBtn: raw.showAccountBtn !== false,
      showThemeToggle: raw.showThemeToggle !== false,
      showWhatsappBtn: Boolean(raw.showWhatsappBtn),
      showWarrantyBtn: Boolean(raw.showWarrantyBtn),
      showHomeLink: raw.showHomeLink !== false,
      homeLabel: raw.homeLabel || 'الرئيسية',
      showProductsLink: raw.showProductsLink !== false,
      productsLabel: raw.productsLabel || 'المنتجات',
      showCategoriesMenu: raw.showCategoriesMenu !== false,
      categoriesLabel: raw.categoriesLabel || 'الأقسام',
      showOffersLink: Boolean(raw.showOffersLink),
      offersLabel: raw.offersLabel || 'العروض',
      showAboutLink: raw.showAboutLink !== false,
      aboutLabel: raw.aboutLabel || 'من نحن',
      showContactLink: raw.showContactLink !== false,
      contactLabel: raw.contactLabel || 'تواصل معنا',
      customNavEnabled: Boolean(raw.customNavEnabled),
      customNavLabel: raw.customNavLabel || '⚡ وصل حديثاً',
      customNavTarget: raw.customNavTarget || 'BEST_SELLERS',
      customNavExternalUrl: raw.customNavExternalUrl || ''
    };
  };
const getFooterConfig = (settings = siteSettings) => {
    const raw = (settings && settings.footerConfig && typeof settings.footerConfig === 'object') ? settings.footerConfig : {};
    return {
      showFooter: raw.showFooter !== false,
      footerTheme: raw.footerTheme || 'auto', // 'auto' | 'dark' | 'light'
      // Brand Column
      showBrandCol: raw.showBrandCol !== false,
      showFooterLogo: raw.showFooterLogo !== false,
      footerDescription: raw.footerDescription !== undefined ? raw.footerDescription : (settings?.storeTagline || 'تشكيلة مختارة من المنتجات الأصلية بأعلى معايير الجودة • ضمان معتمد وشحن سريع لجميع المحافظات'),
      showSocialIcons: raw.showSocialIcons !== false,
      // Quick Links Column
      showQuickLinksCol: raw.showQuickLinksCol !== false,
      quickLinksTitle: raw.quickLinksTitle || 'روابط سريعة',
      showLinkHome: raw.showLinkHome !== false,
      showLinkProducts: raw.showLinkProducts !== false,
      showLinkBestSellers: raw.showLinkBestSellers !== false,
      showLinkOffers: raw.showLinkOffers !== false,
      showLinkFavorites: raw.showLinkFavorites !== false,
      customFooterLinkLabel: raw.customFooterLinkLabel || '',
      customFooterLinkUrl: raw.customFooterLinkUrl || '',
      // Customer Service Column
      showSupportCol: raw.showSupportCol !== false,
      supportColTitle: raw.supportColTitle || 'خدمة العملاء',
      showWarrantyLink: raw.showWarrantyLink !== false,
      showReturnPolicyLink: raw.showReturnPolicyLink !== false,
      showTermsLink: raw.showTermsLink !== false,
      showShippingPolicyLink: raw.showShippingPolicyLink !== false,
      // Payment Methods Column
      showPaymentsCol: raw.showPaymentsCol !== false,
      paymentsColTitle: raw.paymentsColTitle || 'طرق الدفع الآمنة',
      showBadgeVisa: raw.showBadgeVisa !== false,
      showBadgeMastercard: raw.showBadgeMastercard !== false,
      showBadgeApplePay: raw.showBadgeApplePay !== false,
      showBadgeInstaPay: raw.showBadgeInstaPay !== false,
      showBadgeVCash: raw.showBadgeVCash !== false,
      codNoteText: raw.codNoteText !== undefined ? raw.codNoteText : '✅ الدفع عند الاستلام والمعاينة متاح لجميع المحافظات',
      // Contact Column
      showContactCol: raw.showContactCol !== false,
      contactColTitle: raw.contactColTitle || 'معلومات التواصل',
      customFooterPhone: raw.customFooterPhone || '',
      customFooterHours: raw.customFooterHours || '',
      footerLocationText: raw.footerLocationText !== undefined ? raw.footerLocationText : 'مصر',
      // Bottom Copyright & Floating Widgets
      bottomSloganPrefix: raw.bottomSloganPrefix !== undefined ? raw.bottomSloganPrefix : 'تسوّق بذكاء .. مع',
      copyrightText: raw.copyrightText || '',
      showScrollTopButton: raw.showScrollTopButton !== false,
      showFloatingWhatsapp: raw.showFloatingWhatsapp !== false
    };
  };
const [brandImages, setBrandImages] = useState(() => ({ ...OR_BRAND_IMAGES, ...loadPersisted('brandImages', {}) }));
const [editingBrandImageFor, setEditingBrandImageFor] = useState(null);
const normalizeArabicSearch = (rawStr) => {
    if (!rawStr) return '';
    return String(rawStr)
      .toLowerCase()
      .replace(/[ً-ٰٟ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .trim();
  };
const [isInitialCloudBooting, setIsInitialCloudBooting] = useState(() => {
    try {
      return !window.localStorage.getItem('elzoghbi_v2_parts');
    } catch (e) {
      return false;
    }
  });
const [siteSettings, setSiteSettings] = useState(() => loadPersisted('siteSettings', INITIAL_SITE_SETTINGS));
const [activeCmsPageSlug, setActiveCmsPageSlug] = useState('');
useEffect(() => {
    try {
      if (siteSettings && siteSettings.themeTokens) {
        applyThemeTokensToDocument(siteSettings.themeTokens, uiTheme);
      }
      const seo = siteSettings && siteSettings.discoveredControls && siteSettings.discoveredControls.seo;
      if (seo && seo.siteTitle) document.title = seo.siteTitle;
      if (seo && seo.metaDescription) {
        let md = document.querySelector('meta[name="description"]');
        if (md) md.setAttribute('content', seo.metaDescription);
      }
    } catch (e) {}
  }, [siteSettings?.themeTokens, siteSettings?.discoveredControls?.seo, uiTheme]);
  // Admin-controlled look & feel (accent colour, tile radius, content width). Falls back to defaults when unset.
  useEffect(() => {
    try {
      const root = document.documentElement;
      const hex = String(siteSettings?.brandAccent || '').trim();
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(' ');
        root.style.setProperty('--accent', rgb);
        root.style.setProperty('--go', rgb);
        root.style.setProperty('--accent-text', rgb);
        root.style.setProperty('--apple-blue', hex);
      } else {
        ['--accent', '--go', '--accent-text', '--apple-blue'].forEach(k => root.style.removeProperty(k));
      }
      const r = Number(siteSettings?.tileRadius);
      if ([8, 18, 28].includes(r)) root.style.setProperty('--r-tile', r + 'px'); else root.style.removeProperty('--r-tile');
      const w = Number(siteSettings?.containerWidth);
      if (w >= 1100 && w <= 1800) root.style.setProperty('--container', w + 'px'); else root.style.removeProperty('--container');
    } catch (e) {}
  }, [siteSettings?.brandAccent, siteSettings?.tileRadius, siteSettings?.containerWidth]);

const toggleUiTheme = () => {
    const next = uiTheme === 'dark' ? 'light' : 'dark';
    setUiTheme(next);
    try {
      window.localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.setAttribute('data-theme', next);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#000000' : '#ffffff');
    } catch (e) {}
    if (homeElRef && homeElRef.current) homeElRef.current = null;
    if (searchElRef && searchElRef.current) searchElRef.current = null;
  };
const [currencies, setCurrencies] = useState(() => loadPersisted('currencies', INITIAL_CURRENCIES));
const [groups, setGroups] = useState(() => loadPersisted('groups', INITIAL_GROUPS));
const [brands, setBrands] = useState(() =>
    mergeOrBrandsList(loadPersisted('brands', INITIAL_BRANDS), readPersistedDeletedSliceMap('brands'), isOrCatalogDisabledInStorage())
  );
const [autoTemplates, setAutoTemplates] = useState(() => loadPersisted('autoTemplates', INITIAL_AUTO_TEMPLATES));
const [models, setModels] = useState(() =>
    mergeOrModelsList(loadPersisted('models', INITIAL_MODELS), readPersistedDeletedSliceMap('models'), isOrCatalogDisabledInStorage())
  );
const [parts, setParts] = useState(() =>
    mergeOrPartsList(loadPersisted('parts', INITIAL_PARTS), readPersistedDeletedSliceMap('parts'), isOrCatalogDisabledInStorage())
  );
const [adminOrFilterMode, setAdminOrFilterMode] = useState('ALL');
const [orCloudSyncState, setOrCloudSyncState] = useState({ busy: false, done: 0, total: 0, msg: '' });
const [orLiveFetchState, setOrLiveFetchState] = useState({ busy: false, msg: '' });
const [clients, setClients] = useState(() => loadPersisted('clients', INITIAL_CLIENTS));
const [accountRequests, setAccountRequests] = useState(() => loadPersisted('accountRequests', INITIAL_ACCOUNT_REQUESTS));
const [orders, setOrders] = useState(() => loadPersisted('orders', INITIAL_ORDERS));
const [returnsList, setReturnsList] = useState(() => loadPersisted('returnsList', INITIAL_RETURNS));
const [complaints, setComplaints] = useState(() => loadPersisted('complaints', INITIAL_COMPLAINTS));
const [promoCodes, setPromoCodes] = useState(() => loadPersisted('promoCodes', INITIAL_PROMO_CODES));
const [storeAds, setStoreAds] = useState(() => loadPersisted('storeAds', INITIAL_STORE_ADS));
const [showcaseBars, setShowcaseBars] = useState(() => loadPersisted('showcaseBars', INITIAL_SHOWCASE_BARS));
const [cloudSyncStatus, setCloudSyncStatus] = useState('local_ready');
const [notifications, setNotifications] = useState(() => loadPersisted('notifications', [
    {
      id: 'ntf_1',
      target: 'admin',
      title: 'طلبية جديدة #INV-1048',
      msg: 'شركة النور للتجارة والتوريدات الحديثة أرسلت طلبية جديدة بقيمة 28,175 ج.م',
      time: 'منذ 10 دقائق',
      read: false,
      orderId: 'INV-1048'
    },
    {
      id: 'ntf_2',
      target: 'cli_2',
      title: 'تحديث على فاتورتك #INV-1048',
      msg: 'تم تحديث حالة طلبك إلى (جاري التجهيز) ومراجعة الأصناف بالمخزن',
      time: 'منذ 5 دقائق',
      read: false,
      orderId: 'INV-1048'
    }
  ]));
const [sourcingRequests, setSourcingRequests] = useState(() => loadPersisted('sourcingRequests', []));
const [guidePhones, setGuidePhones] = useState(() => loadPersisted('guidePhones', []));
const [karamboUi, setKaramboUi] = useState({ page: 'guide', compare: [] });
const [karamboStats, setKaramboStats] = useState(() => loadPersisted('karamboStats', { visits: {}, topPhones: {} }));
const [storeReviewEntities, setStoreReviewEntities] = useState(() => {
  const saved = loadPersisted('storeReviewEntities', STORE_REVIEW_ENTITIES_SEED);
  const arr = Array.isArray(saved) ? saved : STORE_REVIEW_ENTITIES_SEED;
  const seen = new Set(arr.map(e => e && e.id));
  const missing = STORE_REVIEW_ENTITIES_SEED.filter(s => !seen.has(s.id));
  return missing.length ? [...arr, ...missing] : arr;
});
const [storeReviewEntries, setStoreReviewEntries] = useState(() => loadPersisted('storeReviewEntries', STORE_REVIEW_ENTRIES_SEED));
const [storeReviewQuestions, setStoreReviewQuestions] = useState(() => loadPersisted('storeReviewQuestions', STORE_REVIEW_QUESTIONS_SEED));
const [guideSyncState, setGuideSyncState] = useState({ status: 'idle' });
const [priceAlertsAdmin, setPriceAlertsAdmin] = useState([]);
const guideFetchedRef = useRef(false);
const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
const [heroAdIndex, setHeroAdIndex] = useState(0);
const [adminNotifPanelOpen, setAdminNotifPanelOpen] = useState(false);
const [selectedDetailItem, setSelectedDetailItem] = useState(null);
const [expandedClientOrders, setExpandedClientOrders] = useState({});
const [clientOrdersSearch, setClientOrdersSearch] = useState('');
const [clientOrdersStatusFilter, setClientOrdersStatusFilter] = useState('ALL');
const [clientOrdersSort, setClientOrdersSort] = useState('date_desc');
const [collapsedAdminModels, setCollapsedAdminModels] = useState({});
const [expandedAdminBrands, setExpandedAdminBrands] = useState({});
const [expandedAdminModels, setExpandedAdminModels] = useState({});
const storeGridTopRef = useRef(null);
const productsGridAnchorRef = useRef(null);
const pendingScrollToProductsRef = useRef(false);
const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);
const [activeCatalogPricingGroupId, setActiveCatalogPricingGroupId] = useState('ALL');
const [brandDeleteProtectionModal, setBrandDeleteProtectionModal] = useState(null);
const [appPortal, setAppPortal] = useState(() => {
    try {
      const h = (window.location.hash || '').toLowerCase();
      const p = (window.location.pathname || '').toLowerCase();
      const s = (window.location.search || '').toLowerCase();
      if (
        h.includes('alaadb') || h.includes('admin') ||
        p.includes('/alaadb') || p.includes('/admin') ||
        s.includes('alaadb') || s.includes('admin')
      ) {
        return 'admin';
      }
    } catch (e) {}
    return 'storefront';
  });
const [activeRole, setActiveRole] = useState(() => loadPersisted('activeClientRole', 'guest'));
const [clientTab, setClientTab] = useState('home');
useEffect(() => {
    if (clientTab === 'search' && pendingScrollToProductsRef.current) {
      pendingScrollToProductsRef.current = false;
      const timer = setTimeout(() => {
        const target = productsGridAnchorRef.current || storeGridTopRef.current;
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [clientTab]);
const [accountSubTab, setAccountSubTab] = useState('profile');
const [adminTab, setAdminTab] = useState('overview');
const [aiCommandOpen, setAiCommandOpen] = useState(false);
const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
const [smartNotifsOpen, setSmartNotifsOpen] = useState(false);
const [adminAuthenticated, setAdminAuthenticated] = useState(() => loadPersisted('adminAuth', false));
const [adminPwMap, setAdminPwMap] = useState({});
useEffect(() => {
    if (!adminAuthenticated) return;
    const u = (adminCredentials.username || '').trim().toLowerCase();
    const p = adminCredentials.password || '';
    if (!u || !p) return;
    (async () => {
      try {
        const { sbUrl, sbKey, isValid } = getSupabaseConfig();
        if (!isValid) return;
        const res = await fetch(`${sbUrl}/rest/v1/rpc/admin_client_passwords`, {
          method: 'POST',
          headers: sbHeaders(sbKey, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ p_username: u, p_password: p })
        });
        if (!res.ok) return;
        const rows = await res.json();
        if (Array.isArray(rows)) {
          const map = {};
          rows.forEach(r => { if (r && r.id) map[r.id] = r.password || ''; });
          setAdminPwMap(map);
        }
      } catch (err) {}
    })();
  }, [adminAuthenticated]);
useEffect(() => {
    if (!adminAuthenticated || !Object.keys(adminPwMap).length) return;
    setClients(prev => {
      let changed = false;
      const next = prev.map(c => {
        const pw = adminPwMap[c.id];
        if (pw !== undefined && pw !== c.password) { changed = true; return { ...c, password: pw }; }
        return c;
      });
      return changed ? next : prev;
    });
  }, [adminPwMap, clients, adminAuthenticated]);
const [adminReqPwMap, setAdminReqPwMap] = useState({});
useEffect(() => {
    if (!adminAuthenticated) return;
    const u = (adminCredentials.username || '').trim().toLowerCase();
    const p = adminCredentials.password || '';
    if (!u || !p) return;
    (async () => {
      try {
        const { sbUrl, sbKey, isValid } = getSupabaseConfig();
        if (!isValid) return;
        const res = await fetch(`${sbUrl}/rest/v1/rpc/admin_account_request_passwords`, {
          method: 'POST',
          headers: sbHeaders(sbKey, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ p_username: u, p_password: p })
        });
        if (!res.ok) return;
        const rows = await res.json();
        if (Array.isArray(rows)) {
          const map = {};
          rows.forEach(r => { if (r && r.id) map[r.id] = r.requested_password || ''; });
          setAdminReqPwMap(map);
        }
      } catch (err) {}
    })();
  }, [adminAuthenticated]);
useEffect(() => {
    if (!adminAuthenticated || !Object.keys(adminReqPwMap).length) return;
    setAccountRequests(prev => {
      let changed = false;
      const next = prev.map(r => {
        const pw = adminReqPwMap[r.id];
        if (pw !== undefined && pw !== r.requestedPassword) { changed = true; return { ...r, requestedPassword: pw }; }
        return r;
      });
      return changed ? next : prev;
    });
  }, [adminReqPwMap, accountRequests, adminAuthenticated]);
useEffect(() => {
    const onKeyDown = (e) => {
      if (appPortal !== 'admin' || !adminAuthenticated) return;
      if ((e.ctrlKey || e.metaKey) && String(e.key || '').toLowerCase() === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setCmdPaletteOpen(false);
        setSmartNotifsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [appPortal, adminAuthenticated]);
const [adminCredentials, setAdminCredentials] = useState(() =>
    loadPersisted('adminCredentials', { username: '', password: '' })
  );
const [adminSession, setAdminSession] = useState(() => loadPersisted('adminSession', null));
const [teamUsers, setTeamUsers] = useState([]);
const [teamLoading, setTeamLoading] = useState(false);
const [teamForm, setTeamForm] = useState(null);
const [teamDeleteId, setTeamDeleteId] = useState('');
const isAdminOwner = !adminSession || adminSession.isOwner !== false;
const canAdmin = (tabId) => {
    if (tabId === 'team') return isAdminOwner;
    if (!adminSession || adminSession.isOwner) return true;
    if (Array.isArray(adminSession.permissions) && adminSession.permissions.includes('*')) return true;
    return Array.isArray(adminSession.permissions) && adminSession.permissions.includes(tabId);
  };
useEffect(() => {
    try {
      if (adminSession) window.localStorage.setItem('elzoghbi_v2_adminSession', JSON.stringify(adminSession));
      else window.localStorage.removeItem('elzoghbi_v2_adminSession');
    } catch (e) {}
  }, [adminSession]);
const adminWasAuthRef = useRef(false);
useEffect(() => {
    if (adminWasAuthRef.current && !adminAuthenticated) adminSignOut();
    adminWasAuthRef.current = !!adminAuthenticated;
  }, [adminAuthenticated]);
useEffect(() => {
    if (!adminSession || adminSession.authMode !== 'supabase') return undefined;
    const { sbUrl, sbKey } = getSupabaseConfig();
    ensureFreshAdminJwt(sbUrl, sbKey).then((t) => { if (!t) { setAdminAuthenticated(false); setAdminSession(null); } });
    const iv = setInterval(() => { ensureFreshAdminJwt(sbUrl, sbKey); }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [adminSession]);
const [adminLoginUser, setAdminLoginUser] = useState('');
const [adminLoginPass, setAdminLoginPass] = useState('');
const [searchQuery, setSearchQuery] = useState('');
const [selectedBrand, setSelectedBrand] = useState('ALL');
const [selectedModelId, setSelectedModelId] = useState('ALL');
const [selectedCategory, setSelectedCategory] = useState('ALL');
const [selectedColors, setSelectedColors] = useState({});
const [storeSortBy, setStoreSortBy] = useState('date_desc');
const [storeStockFilter, setStoreStockFilter] = useState('ALL');
const [storeQualityFilter, setStoreQualityFilter] = useState('ALL');
const [adminCatalogSearch, setAdminCatalogSearch] = useState('');
const [adminCatalogBrand, setAdminCatalogBrand] = useState('ALL');
const [adminCatalogSort, setAdminCatalogSort] = useState('date_desc');
const [adminStockFilter, setAdminStockFilter] = useState('ALL');
const [adminOrderSearch, setAdminOrderSearch] = useState('');
const [adminOrderStatusFilter, setAdminOrderStatusFilter] = useState('ALL');
const [adminOrderSort, setAdminOrderSort] = useState('date_desc');
const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
const [brandManagerOpen, setBrandManagerOpen] = useState(false);
const [addingPartToModel, setAddingPartToModel] = useState(null);
const [editingPartObj, setEditingPartObj] = useState(null);
const [editingModelObj, setEditingModelObj] = useState(null);
const [cart, setCart] = useState(() => loadPersisted('cart_v4', {}));
useEffect(() => {
    const handleHashChange = () => {
      try {
        const h = (window.location.hash || '').toLowerCase();
        if (h.includes('alaadb') || h.includes('admin')) {
          setAppPortal('admin');
        } else if (h.startsWith('#/page/')) {
          const slug = decodeURIComponent((window.location.hash || '').slice(7).split('?')[0]).trim();
          if (slug) { setAppPortal('storefront'); setActiveCmsPageSlug(slug); setClientTab('cms_page'); }
        } else if (window.location.hash === '#/' || window.location.hash === '#store') {
          setAppPortal('storefront');
        }
      } catch (e) {}
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
const switchPortal = (targetPortal) => {
    setAppPortal(targetPortal);
    try {
      window.history.replaceState(window.history.state, '', targetPortal === 'admin' ? '#/AlaaDB' : '#/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  };
const myTabId = useMemo(() => Math.random().toString(36).slice(2) + '_' + Date.now(), []);
const isIncomingSyncRef = React.useRef(false);
const isCustomerMutatingCloudRef = React.useRef(false);
const lastSavedPayloadRef = React.useRef('');
const hasCloudInitialPullCompletedRef = React.useRef(false);
const isSavingRef = React.useRef(false);
const pendingReflushRef = React.useRef(false);
const ordersRef = React.useRef(orders);
ordersRef.current = orders;
const submittingCustomerActionRef = React.useRef(false);
const pendingSaveBundleRef = React.useRef(null);
const saveDebounceTimerRef = React.useRef(null);
const lastLocalMutationAtRef = React.useRef(0);
const lastKnownRemoteUpdatedAtRef = React.useRef('');
const lastKnownRemoteTimestampMsRef = React.useRef(0);
const lastSeenOrderCountRef = React.useRef(orders.length);
const lastSeenReqCountRef = React.useRef(accountRequests.length);
const [migratingImages, setMigratingImages] = useState(false);
const [migrationProgress, setMigrationProgress] = useState('');
const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  };
const getSupabaseConfig = () => {
    const DEFAULT_SB_URL = 'https://pomuumsgsujcgvamaxmr.supabase.co';
    const DEFAULT_SB_KEY = 'sb_publishable_Y4XbNsaCNXR9_VUctCpimg_P2C7Cu_Q';
    let envUrl = '';
    let envKey = '';
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        envUrl = import.meta.env.VITE_SUPABASE_URL || '';
        envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      }
    } catch (e) {}
    let savedUrl = '';
    let savedKey = '';
    try {
      savedUrl = window.localStorage.getItem('elzoghbi_sb_url') || '';
      savedKey = window.localStorage.getItem('elzoghbi_sb_key') || '';
    } catch (e) {}
    const sbUrl = (
      envUrl ||
      window.__ELZOGHBI_SUPABASE_URL__ ||
      siteSettings?.supabaseUrl ||
      savedUrl ||
      DEFAULT_SB_URL
    ).trim().replace(/\/$/, '');
    const sbKey = (
      envKey ||
      window.__ELZOGHBI_SUPABASE_KEY__ ||
      siteSettings?.supabaseAnonKey ||
      savedKey ||
      DEFAULT_SB_KEY
    ).trim();
    const isValid = Boolean(sbUrl && sbKey && sbUrl.startsWith('http'));
    if (isValid) {
      try {
        window.localStorage.setItem('elzoghbi_sb_url', sbUrl);
        window.localStorage.setItem('elzoghbi_sb_key', sbKey);
      } catch (e) {}
    }
    return { sbUrl, sbKey, isValid };
  };
const estimateDataUrlBytes = (dataUrl) => {
    if (!dataUrl || typeof dataUrl !== 'string') return 0;
    const base64Part = dataUrl.split(',')[1] || '';
    return Math.round((base64Part.length * 3) / 4);
  };
const compressImageDataUrl = (fileOrDataUrl, maxDim = 640, quality = 0.72, mode = 'full') => {
    return new Promise((resolve) => {
      const isThumb = mode === 'thumb' || maxDim <= 260;
      const isBanner = mode === 'banner' || maxDim >= 950;
      const targetDim = isThumb ? 240 : isBanner ? 1040 : 640;
      const maxAllowedBytes = isThumb ? 14 * 1024 : isBanner ? 62 * 1024 : 36 * 1024;
      const initialQual = isThumb ? 0.68 : isBanner ? 0.75 : Math.min(0.76, Math.max(0.66, quality || 0.72));
      const minQual = isThumb ? 0.42 : 0.54;

      const processImg = (srcUrl) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            let srcW = img.width || targetDim;
            let srcH = img.height || targetDim;
            let scale = 1;
            if (srcW > targetDim || srcH > targetDim) {
              scale = targetDim / Math.max(srcW, srcH);
            }
            let w = Math.max(1, Math.round(srcW * scale));
            let h = Math.max(1, Math.round(srcH * scale));

            const renderAt = (cw, ch, q) => {
              const canvas = document.createElement('canvas');
              canvas.width = cw;
              canvas.height = ch;
              const ctx = canvas.getContext('2d');
              // Preserve full alpha transparency for PNG/WebP cutouts!
              ctx.clearRect(0, 0, cw, ch);
              ctx.drawImage(img, 0, 0, cw, ch);
              let out = canvas.toDataURL('image/webp', q);
              if (!out.startsWith('data:image/webp')) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, cw, ch);
                ctx.drawImage(img, 0, 0, cw, ch);
                out = canvas.toDataURL('image/jpeg', q);
              }
              return out;
            };

            let q = initialQual;
            let compressedDataUrl = renderAt(w, h, q);
            let bytes = estimateDataUrlBytes(compressedDataUrl);

            while (bytes > maxAllowedBytes && q > minQual) {
              q = Math.max(minQual, Number((q - 0.05).toFixed(2)));
              compressedDataUrl = renderAt(w, h, q);
              bytes = estimateDataUrlBytes(compressedDataUrl);
            }

            let dimFactor = 0.88;
            while (bytes > maxAllowedBytes && dimFactor >= 0.52) {
              const nw = Math.max(110, Math.round(w * dimFactor));
              const nh = Math.max(110, Math.round(h * dimFactor));
              compressedDataUrl = renderAt(nw, nh, q);
              bytes = estimateDataUrlBytes(compressedDataUrl);
              dimFactor -= 0.10;
            }

            resolve(compressedDataUrl);
          } catch (err) {
            resolve(srcUrl);
          }
        };
        img.onerror = () => resolve(srcUrl);
        img.src = srcUrl;
      };

      if (typeof fileOrDataUrl === 'string') {
        processImg(fileOrDataUrl);
      } else if (fileOrDataUrl instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => processImg(reader.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrDataUrl);
      } else {
        resolve('');
      }
    });
  };
const dataUrlToBlob = (dataUrl) => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };
const uploadBlobToStorage = async (blob, folder, ext, contentType) => {
    const { sbUrl, sbKey, isValid } = getSupabaseConfig();
    if (!isValid) return null;
    try {
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const uploadRes = await fetch(`${sbUrl}/storage/v1/object/product-images/${fileName}`, {
        method: 'POST',
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
          'cache-control': 'public, max-age=31536000, immutable'
        },
        body: blob
      });
      if (uploadRes.ok) return `${sbUrl}/storage/v1/object/public/product-images/${fileName}`;
    } catch (err) {}
    return null;
  };
const processAndUploadImage = async (fileOrDataUrl, folder = 'parts', forceRecompressRemote = false) => {
    if (!forceRecompressRemote && typeof fileOrDataUrl === 'string' && /^https?:\/\//i.test(fileOrDataUrl)) return fileOrDataUrl;
    let sourceInput = fileOrDataUrl;
    if (forceRecompressRemote && typeof fileOrDataUrl === 'string' && /^https?:\/\//i.test(fileOrDataUrl)) {
      try {
        const resp = await fetch(fileOrDataUrl, { mode: 'cors' });
        if (!resp.ok) return fileOrDataUrl;
        sourceInput = await resp.blob();
      } catch (e) {
        return fileOrDataUrl;
      }
    }
    const isThumbFolder = folder === 'avatars' || folder === 'models' || folder === 'thumbs' || folder === 'brands';
    const isBannerFolder = folder === 'ads';
    const compressedDataUrl = await compressImageDataUrl(
      sourceInput,
      isThumbFolder ? 240 : isBannerFolder ? 1040 : 640,
      isThumbFolder ? 0.68 : isBannerFolder ? 0.75 : 0.72,
      isThumbFolder ? 'thumb' : isBannerFolder ? 'banner' : 'full'
    );
    if (!compressedDataUrl || !compressedDataUrl.startsWith('data:image/')) {
      return compressedDataUrl;
    }
    const { isValid } = getSupabaseConfig();
    if (!isValid) {
      // وضع محلي بدون سيرفر فقط (مفيش Supabase متوصّل)
      return compressedDataUrl;
    }
    const mime = (compressedDataUrl.match(/^data:(image\/[a-z0-9+.-]+)/i) || [])[1] || 'image/webp';
    const ext = mime.includes('webp') ? 'webp' : mime.includes('png') ? 'png' : 'jpg';
    const url = await uploadBlobToStorage(dataUrlToBlob(compressedDataUrl), folder, ext, mime);
    if (url) return url;
    showToast('فشل رفع الصورة على الـ Storage. اتأكد من الـ bucket (product-images) وصلاحياته وجرّب تاني.', 'error');
    return '';
  };
const externalizeBase64Deep = async root => {
    const { isValid } = getSupabaseConfig();
    if (!isValid || !root) return root;
    let failed = 0;
    const handleString = async str => {
      const isImg = str.startsWith('data:image/');
      const isPdf = str.startsWith('data:application/pdf');
      if ((!isImg && !isPdf) || str.length < 1500) return str;
      const key = b64Key(str);
      if (B64_UPLOAD_CACHE.has(key)) return B64_UPLOAD_CACHE.get(key);
      const mime = (str.match(/^data:([^;]+)/) || [])[1] || 'image/webp';
      const ext = isPdf ? 'pdf' : mime.includes('webp') ? 'webp' : mime.includes('png') ? 'png' : 'jpg';
      let blob;
      try { blob = dataUrlToBlob(str); } catch (e) { failed += 1; return ''; }
      const url = await uploadBlobToStorage(blob, isPdf ? 'files' : 'auto', ext, mime);
      if (url) { B64_UPLOAD_CACHE.set(key, url); return url; }
      failed += 1;
      return '';
    };
    const walk = async node => {
      if (typeof node === 'string') return handleString(node);
      if (Array.isArray(node)) {
        let changed = false;
        const out = [];
        for (const it of node) { const r = await walk(it); if (r !== it) changed = true; out.push(r); }
        return changed ? out : node;
      }
      if (node && typeof node === 'object') {
        let changed = false;
        const out = {};
        for (const k of Object.keys(node)) { const v = node[k]; const r = await walk(v); if (r !== v) changed = true; out[k] = r; }
        return changed ? out : node;
      }
      return node;
    };
    const res = await walk(root);
    if (failed > 0) showToast(`${failed} صورة/ملف ماتحمّلوش على الـ Storage فمش هيتحفظوا على السيرفر لحد ما الرفع ينجح.`, 'warning');
    return res;
  };
const handleMigrateAllBase64ImagesToStorage = async () => {
    const { isValid } = getSupabaseConfig();
    if (!isValid) {
      showToast('يرجى إدخال رابط ومفتاح Supabase في إعدادات الموقع أولاً.', 'warning');
      return;
    }
    if (migratingImages) return;

    setMigratingImages(true);
    setMigrationProgress('جاري فحص الصور داخل الصف...');
    let migratedCount = 0;

    try {
      const isBase64 = (str) => typeof str === 'string' && str.startsWith('data:image/') && str.length > 500;

      // 1. Migrate Parts Images
      const nextParts = [...parts];
      for (let i = 0; i < nextParts.length; i++) {
        const p = { ...nextParts[i] };
        let changed = false;
        if (isBase64(p.image)) {
          setMigrationProgress(`جاري ضغط ونقل صورة المنتج (${i + 1}/${nextParts.length})...`);
          const url = await processAndUploadImage(p.image, 'parts');
          if (url && url !== p.image) {
            p.image = url;
            changed = true;
            migratedCount++;
          }
        }
        if (Array.isArray(p.images) && p.images.length > 0) {
          const newGallery = [];
          for (let j = 0; j < p.images.length; j++) {
            const imgItem = p.images[j];
            if (isBase64(imgItem)) {
              const url = await processAndUploadImage(imgItem, 'parts');
              newGallery.push(url || imgItem);
              if (url && url !== imgItem) migratedCount++;
              changed = true;
            } else {
              newGallery.push(imgItem);
            }
          }
          p.images = newGallery;
          if (newGallery[0]) p.image = newGallery[0];
        }
        if (changed) nextParts[i] = p;
      }

      // 2. Migrate Models Images
      const nextModels = [...models];
      for (let i = 0; i < nextModels.length; i++) {
        const m = { ...nextModels[i] };
        if (isBase64(m.image)) {
          setMigrationProgress(`جاري نقل صورة الموديل (${i + 1}/${nextModels.length})...`);
          const url = await processAndUploadImage(m.image, 'models');
          if (url && url !== m.image) {
            m.image = url;
            nextModels[i] = m;
            migratedCount++;
          }
        }
      }

      // 3. Migrate Store Ads Images
      const nextAds = [...storeAds];
      for (let i = 0; i < nextAds.length; i++) {
        const a = { ...nextAds[i] };
        if (isBase64(a.image)) {
          setMigrationProgress(`جاري نقل صورة الإعلان (${i + 1}/${nextAds.length})...`);
          const url = await processAndUploadImage(a.image, 'ads');
          if (url && url !== a.image) {
            a.image = url;
            nextAds[i] = a;
            migratedCount++;
          }
        }
      }

      // 4. Migrate Client Avatars
      const nextClients = [...clients];
      for (let i = 0; i < nextClients.length; i++) {
        const c = { ...nextClients[i] };
        if (isBase64(c.avatarImage)) {
          const url = await processAndUploadImage(c.avatarImage, 'avatars');
          if (url && url !== c.avatarImage) {
            c.avatarImage = url;
            nextClients[i] = c;
            migratedCount++;
          }
        }
      }

      setParts(nextParts);
      setModels(nextModels);
      setStoreAds(nextAds);
      setClients(nextClients);

      const cleanBundle = {
        siteSettings,
        adminCredentials,
        currencies,
        groups,
        brands,
        autoTemplates,
        models: nextModels,
        parts: nextParts,
        clients: nextClients,
        accountRequests,
        orders,
        returnsList,
        complaints,
        promoCodes,
        storeAds: nextAds,
        showcaseBars,
        sourcingRequests,
        notifications
      };

      setMigrationProgress('جاري حفظ الصف الخفيف في السيرفر...');
      await pushToSupabaseCloud(cleanBundle, true);
      showToast(
        migratedCount > 0
          ? `تم ضغط ونقل (${migratedCount}) صورة إلى Supabase Storage وتصغير حجم الصف بنجاح!`
          : 'جميع الصور مضغوطة ومنقولة بالفعل! الصف في حالة ممتازة.',
        'success'
      );
    } catch (err) {
      showToast('حدث خطأ أثناء نقل الصور: ' + String(err.message || err), 'error');
    } finally {
      setMigratingImages(false);
      setMigrationProgress('');
    }
  };
const [siteImageAuditStats, setSiteImageAuditStats] = useState(null);
const runSiteImagesAudit = () => {
    let base64Count = 0;
    let nonWebpStorageCount = 0;
    let optimizedWebpCount = 0;
    let externalCdnCount = 0;
    const inspectUrl = (u) => {
      if (!u || typeof u !== 'string') return;
      if (u.startsWith('data:image/')) {
        if (u.length > 1800) base64Count++;
        return;
      }
      if (/supabase\.co\/storage/i.test(u)) {
        if (/\.webp(\?|$)/i.test(u)) optimizedWebpCount++;
        else nonWebpStorageCount++;
      } else if (/^https?:\/\//i.test(u)) {
        externalCdnCount++;
      }
    };
    storeAds.forEach(a => inspectUrl(a?.image));
    if (siteSettings?.sourcingBanner?.image) inspectUrl(siteSettings.sourcingBanner.image);
    models.forEach(m => inspectUrl(m?.image));
    Object.values(brandImages || {}).forEach(u => inspectUrl(u));
    parts.forEach(p => {
      inspectUrl(p?.image);
      if (Array.isArray(p?.images)) p.images.forEach(inspectUrl);
    });
    const result = { base64Count, nonWebpStorageCount, optimizedWebpCount, externalCdnCount, totalNeedsOptimization: base64Count + nonWebpStorageCount };
    setSiteImageAuditStats(result);
    return result;
  };
const handleOptimizeAllSiteImagesToWebP = async () => {
    const { isValid } = getSupabaseConfig();
    if (!isValid) {
      showToast('يرجى التأكد من ربط Supabase أولاً لضغط وحفظ الصور.', 'warning');
      return;
    }
    if (migratingImages) return;
    setMigratingImages(true);
    setMigrationProgress('جاري فحص وضغط صور الإعلانات والمنتجات إلى WebP فائق الخفة...');
    let optimizedCount = 0;
    let savedBytesApprox = 0;

    const needsOpt = (u) => {
      if (!u || typeof u !== 'string') return false;
      if (u.startsWith('data:image/') && u.length > 1800) return true;
      if (/supabase\.co\/storage/i.test(u) && !/\.webp(\?|$)/i.test(u)) return true;
      return false;
    };

    const recompressOne = async (urlStr, folder) => {
      try {
        let oldLen = urlStr.startsWith('data:') ? estimateDataUrlBytes(urlStr) : 145000;
        if (/^https?:\/\//i.test(urlStr)) {
          const r = await fetch(urlStr, { mode: 'cors' });
          if (!r.ok) return urlStr;
          const blb = await r.blob();
          oldLen = blb.size || oldLen;
          if (oldLen <= (folder === 'ads' ? 58000 : 34000) && /\.webp/i.test(urlStr)) return urlStr;
          const newUrl = await processAndUploadImage(blb, folder, false);
          if (newUrl && newUrl !== urlStr) {
            optimizedCount++;
            savedBytesApprox += Math.max(0, oldLen - (folder === 'ads' ? 42000 : 22000));
            return newUrl;
          }
          return urlStr;
        } else {
          const newUrl = await processAndUploadImage(urlStr, folder, false);
          if (newUrl && newUrl !== urlStr) {
            optimizedCount++;
            savedBytesApprox += Math.max(0, oldLen - 22000);
            return newUrl;
          }
          return urlStr;
        }
      } catch (e) {
        return urlStr;
      }
    };

    try {
      // 1. Optimize Store Ads + Sourcing Banner first (Biggest visual + Egress impact!)
      const nextAds = [...storeAds];
      for (let i = 0; i < nextAds.length; i++) {
        if (needsOpt(nextAds[i]?.image)) {
          setMigrationProgress(`ضغط صورة البانر الإعلاني (${i + 1}/${nextAds.length}) إلى WebP...`);
          const nu = await recompressOne(nextAds[i].image, 'ads');
          if (nu !== nextAds[i].image) {
            nextAds[i] = { ...nextAds[i], image: nu };
            markLocalUpsert('storeAds', nextAds[i]);
          }
        }
      }
      setStoreAds(nextAds);

      if (needsOpt(siteSettings?.sourcingBanner?.image)) {
        setMigrationProgress('ضغط صورة بانر الاستيراد إلى WebP...');
        const nu = await recompressOne(siteSettings.sourcingBanner.image, 'ads');
        if (nu !== siteSettings.sourcingBanner.image) {
          saveSiteSettingsImmediate(prev => ({
            ...prev,
            sourcingBanner: { ...(prev.sourcingBanner || {}), image: nu }
          }));
        }
      }

      // 2. Optimize Brand Images
      const nextBrandImgs = { ...(brandImages || {}) };
      let brandChanged = false;
      for (const bKey of Object.keys(nextBrandImgs)) {
        if (needsOpt(nextBrandImgs[bKey])) {
          setMigrationProgress(`ضغط شعار براند ${bKey}...`);
          const nu = await recompressOne(nextBrandImgs[bKey], 'brands');
          if (nu !== nextBrandImgs[bKey]) {
            nextBrandImgs[bKey] = nu;
            brandChanged = true;
          }
        }
      }
      if (brandChanged) setBrandImages(nextBrandImgs);

      // 3. Optimize Models Images
      const nextModels = [...models];
      for (let i = 0; i < nextModels.length; i++) {
        if (needsOpt(nextModels[i]?.image)) {
          setMigrationProgress(`ضغط صورة الموديل (${i + 1}/${nextModels.length})...`);
          const nu = await recompressOne(nextModels[i].image, 'models');
          if (nu !== nextModels[i].image) {
            nextModels[i] = { ...nextModels[i], image: nu };
            markLocalUpsert('models', nextModels[i]);
          }
        }
      }
      setModels(nextModels);

      // 4. Optimize Parts Images
      const nextParts = [...parts];
      for (let i = 0; i < nextParts.length; i++) {
        const p = nextParts[i];
        let pChanged = false;
        let nextMain = p.image;
        if (needsOpt(nextMain)) {
          setMigrationProgress(`ضغط صورة المنتج (${i + 1}/${nextParts.length})...`);
          nextMain = await recompressOne(nextMain, 'parts');
          if (nextMain !== p.image) pChanged = true;
        }
        let nextGal = p.images;
        if (Array.isArray(p.images) && p.images.some(needsOpt)) {
          nextGal = [];
          for (const gImg of p.images) {
            if (needsOpt(gImg)) {
              const ng = await recompressOne(gImg, 'parts');
              nextGal.push(ng);
              if (ng !== gImg) pChanged = true;
            } else {
              nextGal.push(gImg);
            }
          }
        }
        if (pChanged) {
          nextParts[i] = { ...p, image: (Array.isArray(nextGal) && nextGal[0]) ? nextGal[0] : nextMain, images: nextGal };
          markLocalUpsert('parts', nextParts[i]);
        }
      }
      setParts(nextParts);

      await flushPendingDiffsToSupabase(false);
      runSiteImagesAudit();
      const mbSaved = (savedBytesApprox / (1024 * 1024)).toFixed(2);
      showToast(
        optimizedCount > 0
          ? `✅ تم ضغط وتحويل ${optimizedCount} صورة إلى WebP خفيف وتوفير ~${mbSaved} MB مع تفعيل الكاش السنوي!`
          : 'جميع صور الموقع مضغوطة بالفعل بأفضل صيغة WebP خفيفة!',
        'success'
      );
    } catch (e) {
      showToast('حدث خطأ غير متوقع أثناء فحص بعض الصور.', 'warning');
    } finally {
      setMigratingImages(false);
      setMigrationProgress('');
    }
  };
const getMobilePushConfig = (settings = siteSettings) => {
    const raw = (settings && settings.mobilePushConfig && typeof settings.mobilePushConfig === 'object') ? settings.mobilePushConfig : {};
    let defaultTopic = raw.ntfyTopic || '';
    if (!defaultTopic) {
      try {
        defaultTopic = window.localStorage.getItem('elzoghbi_ntfy_topic_v1') || '';
        if (!defaultTopic) {
          defaultTopic = `elzoghbi_vip_${Math.random().toString(36).slice(2, 9)}`;
          window.localStorage.setItem('elzoghbi_ntfy_topic_v1', defaultTopic);
        }
      } catch (e) {
        defaultTopic = 'elzoghbi_orders_live_2026';
      }
    }
    return {
      ntfyEnabled: raw.ntfyEnabled !== false,
      ntfyTopic: defaultTopic,
      telegramEnabled: Boolean(raw.telegramEnabled),
      telegramBotToken: (raw.telegramBotToken || '').trim(),
      telegramChatId: (raw.telegramChatId || '').trim(),
      notifyOnOrders: raw.notifyOnOrders !== false,
      notifyOnSourcing: raw.notifyOnSourcing !== false,
      notifyOnReturns: raw.notifyOnReturns !== false,
      notifyOnAccounts: raw.notifyOnAccounts !== false
    };
  };
const sendMobileOrderPushAlert = async ({ eventType = 'order', title = '', body = '', clickUrl = '' } = {}) => {
    try {
      const cfg = getMobilePushConfig(siteSettings);
      if (eventType === 'order' && !cfg.notifyOnOrders) return false;
      if (eventType === 'sourcing' && !cfg.notifyOnSourcing) return false;
      if (eventType === 'return' && !cfg.notifyOnReturns) return false;
      if (eventType === 'account' && !cfg.notifyOnAccounts) return false;

      const adminLink = clickUrl || `${window.location.origin}${window.location.pathname}#/AlaaDB`;
      const tasks = [];

      // 1. ntfy.sh Instant Mobile Push (Wakes Android/iOS ntfy app with high-priority chime even when browser is closed!)
      if (cfg.ntfyEnabled && cfg.ntfyTopic && cfg.ntfyTopic.trim().length >= 4) {
        const cleanTopic = cfg.ntfyTopic.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        tasks.push(
          fetch('https://ntfy.sh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: cleanTopic,
              title: title || '🔔 إشعار جديد — متجر الزغبي ELZOGHBI',
              message: body || 'وصل طلب جديد على المتجر الآن.',
              priority: 5,
              tags: eventType === 'order' ? ['shopping_cart', 'moneybag'] : ['bell'],
              click: adminLink
            })
          }).catch(() => null)
        );
      }

      // 2. Telegram Bot Instant Push (Direct message to Merchant's Telegram App on Mobile!)
      if (cfg.telegramEnabled && cfg.telegramBotToken && cfg.telegramChatId) {
        const tgText = `${title}
━━━━━━━━━━━━━━
${body}

🔗 فتح لوحة التحكم:
${adminLink}`;
        tasks.push(
          fetch(`https://api.telegram.org/bot${cfg.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cfg.telegramChatId,
              text: tgText,
              disable_web_page_preview: true
            })
          }).catch(() => null)
        );
      }

      if (tasks.length === 0) return false;
      await Promise.allSettled(tasks);
      return true;
    } catch (e) {
      return false;
    }
  };
const formatSyncHttpError = (status) => {
    if (status === 413) return 'حجم البيانات كبير جداً (كود 413 Payload Too Large) — اضغط زر "ضغط ونقل الصور لـ Storage" لتصغير حجم الصف فوراً.';
    if (status === 401 || status === 403) return `خطأ في صلاحيات مفتاح Supabase (كود ${status} Unauthorized) — تأكد من صحة Anon Key وتشغيل ملف SQL.`;
    if (status === 429) return 'ضغط طلبات متتالية على السيرفر (كود 429 Rate Limit) — جاري إعادة المحاولة تلقائياً...';
    if (status >= 500) return `خطأ مؤقت في سيرفر قاعدة البيانات (كود ${status} Server Error) — جاري إعادة المحاولة...`;
    return `فشل حفظ البيانات في السيرفر (كود الخطأ: ${status})`;
  };
const sbHeaders = (sbKey, extra = {}) => ({
    apikey: sbKey,
    Authorization: `Bearer ${getAdminJwt() || sbKey}`,
    'Content-Type': 'application/json',
    ...extra
  });
const CAMEL_TO_SNAKE_MAP = {
    modelId: 'model_id',
    qualityGrade: 'quality_grade',
    basePrice: 'base_price',
    costPrice: 'cost_price',
    lowStockThreshold: 'low_stock_threshold',
    warrantyText: 'warranty_text',
    searchAliases: 'search_aliases',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    compatibleModels: 'compatible_models',
    customGroupPrices: 'custom_group_prices',
    maxOrderQty: 'max_order_qty',
    waitlistCount: 'waitlist_count',
    soldOut: 'sold_out',
    clientId: 'client_id',
    clientName: 'client_name',
    clientPhone: 'client_phone',
    groupId: 'group_id',
    creditLimit: 'credit_limit',
    walletBalance: 'wallet_balance',
    avatarImage: 'avatar_image',
    avatarBg: 'avatar_bg',
    secondaryAddress: 'secondary_address',
    accountType: 'account_type',
    paymentMethod: 'payment_method',
    deliveryFeeBase: 'delivery_fee_base',
    discountBase: 'discount_base',
    walletUsedBase: 'wallet_used_base',
    adminEdited: 'admin_edited',
    adminEditNote: 'admin_edit_note',
    exchangeRateUsed: 'exchange_rate_used',
    modifierType: 'modifier_type',
    modifierValue: 'modifier_value',
    isDefault: 'is_default',
    adminReply: 'admin_reply',
    orderId: 'order_id',
    partId: 'part_id',
    partName: 'part_name',
    refundAmountBase: 'refund_amount_base',
    adminResponse: 'admin_response',
    resolutionType: 'resolution_type',
    warrantyConfirmed: 'warranty_confirmed',
    shopName: 'shop_name',
    ownerName: 'owner_name',
    assignedGroupId: 'assigned_group_id',
    accountCategory: 'account_category',
    requestedPassword: 'requested_password',
    shopType: 'shop_type',
    acceptedTermsAt: 'accepted_terms_at',
    buttonText: 'button_text',
    linkedPartId: 'linked_part_id',
    imageFit: 'image_fit',
    showBadge: 'show_badge',
    showButton: 'show_button',
    startDate: 'start_date',
    endDate: 'end_date',
    sortOrder: 'sort_order',
    badgeColor: 'badge_color',
    partIds: 'part_ids',
    maxDiscountCap: 'max_discount_cap',
    minOrderAmount: 'min_order_amount',
    usageLimit: 'usage_limit',
    usedCount: 'used_count',
    expiryDate: 'expiry_date',
    isActive: 'is_active',
    skuPrefix: 'sku_prefix',
    namePattern: 'name_pattern',
    imageKey: 'image_key',
    defaultStock: 'default_stock',
    desc: 'desc_text',
    depositStatus: 'deposit_status',
    imagesAllowed: 'images_allowed',
    unreadAdmin: 'unread_admin',
    unreadClient: 'unread_client',
    cashbackEnabled: 'cashback_enabled',
    cashbackPct: 'cashback_pct',
    cashbackAwarded: 'cashback_awarded',
    cashbackAmountBase: 'cashback_amount_base',
    isVipOnly: 'is_vip_only',
    vipPrice: 'vip_price',
    orderCount: 'order_count',
    isVip: 'is_vip',
    birthDate: 'birth_date',
    referralCode: 'referral_code',
    referredByCode: 'referred_by_code'
  };
const SNAKE_TO_CAMEL_MAP = Object.fromEntries(
    Object.entries(CAMEL_TO_SNAKE_MAP).map(([c, s]) => [s, c])
  );
const TABLE_ALLOWED_COLUMNS = {
    spare_parts: [
      'id', 'sku', 'model_id', 'category', 'name', 'quality_grade',
      'colors', 'compatible_models', 'search_aliases', 'description', 'warranty_text',
      'image_url', 'image', 'images', 'stock', 'low_stock_threshold', 'max_order_qty',
      'cost_price', 'base_price', 'custom_group_prices', 'waitlist_count',
      'sold_out', 'is_promoted_ad', 'created_at', 'data'
    ],
    mobile_models: ['id', 'brand', 'name', 'aliases', 'image', 'is_promoted_ad', 'data'],
    brands: ['name', 'sort_order', 'image_url'],
    pricing_groups: [
      'id', 'name', 'currency', 'modifier_type', 'modifier_value',
      'delivery_fee_base', 'is_default', 'description', 'data'
    ],
    store_ads: [
      'id', 'badge', 'title', 'subtitle', 'theme', 'gradient', 'image',
      'button_text', 'linked_part_id', 'layout', 'align', 'image_fit',
      'overlay', 'show_badge', 'show_button', 'start_date', 'end_date',
      'active', 'sort_order', 'data'
    ],
    showcase_bars: [
      'id', 'title', 'subtitle', 'badge_color', 'part_ids', 'active', 'sort_order', 'data'
    ],
    promo_codes: [
      'id', 'code', 'type', 'value', 'max_discount_cap', 'min_order_amount',
      'usage_limit', 'used_count', 'expiry_date', 'description', 'active', 'data'
    ],
    clients: [
      'id', 'name', 'owner', 'phone', 'email', 'address',
      'secondary_address', 'group_id', 'credit_limit', 'wallet_balance',
      'ledger', 'status', 'type', 'account_type', 'avatar', 'avatar_bg',
      'avatar_image', 'created_at', 'data'
    ],
    account_requests: [
      'id', 'name', 'shop_name', 'owner', 'owner_name', 'phone', 'email',
      'password', 'requested_password', 'address', 'type', 'account_category',
      'shop_type', 'notes', 'status', 'assigned_group_id', 'credit_limit',
      'created_at', 'accepted_terms_at', 'data'
    ],
    orders: [
      'id', 'client_id', 'client_name', 'group_id', 'currency',
      'exchange_rate_used', 'status', 'payment_method', 'address', 'notes',
      'items', 'delivery_fee_base', 'discount_base', 'wallet_used_base', 'total',
      'admin_edited', 'admin_edit_note', 'created_at', 'data'
    ],
    returns_list: [
      'id', 'order_id', 'client_id', 'client_name', 'part_id', 'part_name',
      'qty', 'refund_amount_base', 'reason', 'status', 'photos',
      'admin_response', 'resolution_type', 'warranty_confirmed', 'replies',
      'closed', 'created_at', 'data'
    ],
    complaints: [
      'id', 'client_id', 'client_name', 'type', 'subject', 'message',
      'status', 'admin_reply', 'replies', 'created_at', 'data'
    ],
    auto_templates: [
      'id', 'sku_prefix', 'category', 'name_pattern', 'quality_grade',
      'colors', 'warranty_text', 'image_key', 'cost_price', 'base_price',
      'default_stock', 'low_stock_threshold', 'max_order_qty', 'enabled', 'data'
    ],
    sourcing_requests: [
      'id', 'client_id', 'client_name', 'phone', 'client_phone', 'part_id',
      'part_name', 'name', 'desc_text', 'notes', 'image', 'status', 'price',
      'deposit', 'deposit_status', 'messages', 'images_allowed',
      'unread_admin', 'unread_client', 'closed', 'created_at', 'updated_at',
      'accepted_terms_at', 'data'
    ],
    site_settings: [
      'id', 'settings', 'currencies', 'notifications', 'updated_at'
    ]
  };
const unsupportedColumnsRef = useRef({});
const resolveActualTableName = (name) => {
    if (name === 'models' || name === 'mobile_models') return 'mobile_models';
    if (name === 'parts' || name === 'spare_parts') return 'spare_parts';
    return name;
  };
const toSnakeCaseRow = (row, tableName = '', rowIndex = 0) => {
    if (!row || typeof row !== 'object') return row;
    const realTable = resolveActualTableName(tableName);
    if (realTable === 'site_settings') return row;

    const rawSnake = {};
    for (const [k, v] of Object.entries(row)) {
      if (k === 'data') continue;
      const sk = CAMEL_TO_SNAKE_MAP[k] || k;
      rawSnake[sk] = v;
    }

    // Table-specific defaults & normalizations so NOT NULL constraints never fail
    if (realTable === 'spare_parts') {
      rawSnake.sku = rawSnake.sku || `PRT-${rawSnake.id || Date.now()}`;
      rawSnake.name = rawSnake.name || 'قطعة غيار';
      rawSnake.category = rawSnake.category || 'أقسام عامة';
      rawSnake.quality_grade = rawSnake.quality_grade || 'قياسي';
      rawSnake.colors = Array.isArray(rawSnake.colors) ? rawSnake.colors : ['قياسي'];
      rawSnake.compatible_models = Array.isArray(rawSnake.compatible_models) ? rawSnake.compatible_models : [];
      const primaryUrl = row.image_url || row.imageUrl || rawSnake.image_url || rawSnake.image || (Array.isArray(rawSnake.images) && rawSnake.images[0]) || '';
      rawSnake.image_url = primaryUrl;
      rawSnake.image = primaryUrl;
      const cleanImgsArr = Array.from(new Set(
        (Array.isArray(row.images) && row.images.length > 0 ? row.images : (Array.isArray(rawSnake.images) && rawSnake.images.length > 0 ? rawSnake.images : (primaryUrl ? [primaryUrl] : [])))
          .map(u => String(u || '').trim())
          .filter(Boolean)
      )).slice(0, 8);
      rawSnake.images = cleanImgsArr;
      rawSnake.is_promoted_ad = Boolean(row.isPromotedAd || rawSnake.is_promoted_ad);
      const baseCgp = (rawSnake.custom_group_prices && typeof rawSnake.custom_group_prices === 'object' && !Array.isArray(rawSnake.custom_group_prices))
        ? { ...rawSnake.custom_group_prices }
        : {};
      if (cleanImgsArr.length > 0) {
        baseCgp._images = cleanImgsArr;
      }
      if (row.oldPrice !== undefined) {
        baseCgp._oldPrice = Number(row.oldPrice) || 0;
      }
      if (row.hidden !== undefined) {
        baseCgp._hidden = Boolean(row.hidden);
      }
      if (row.isPromotedAd !== undefined) {
        baseCgp._isPromotedAd = Boolean(row.isPromotedAd);
      }
      if (row.cashbackEnabled !== undefined) {
        baseCgp._cashbackEnabled = Boolean(row.cashbackEnabled);
      }
      if (row.cashbackPct !== undefined) {
        baseCgp._cashbackPct = Number(row.cashbackPct) >= 0 ? Number(row.cashbackPct) : 2;
      }
      if (row.isVipOnly !== undefined) {
        baseCgp._isVipOnly = Boolean(row.isVipOnly);
      }
      if (row.vipPrice !== undefined) {
        baseCgp._vipPrice = Number(row.vipPrice) || 0;
      }
      if (row.tierOriginalPrice !== undefined) {
        baseCgp._tierOriginalPrice = Number(row.tierOriginalPrice) || 0;
      }
      if (row.tierFirstClassPrice !== undefined) {
        baseCgp._tierFirstClassPrice = Number(row.tierFirstClassPrice) || 0;
      }
      if (row.tierEconomyPrice !== undefined) {
        baseCgp._tierEconomyPrice = Number(row.tierEconomyPrice) || 0;
      }
      rawSnake.custom_group_prices = baseCgp;
      rawSnake.stock = Number(rawSnake.stock) || 0;
      rawSnake.low_stock_threshold = Number(rawSnake.low_stock_threshold) || 5;
      rawSnake.max_order_qty = Number(rawSnake.max_order_qty) || 10;
      rawSnake.cost_price = Number(rawSnake.cost_price) || 0;
      rawSnake.base_price = Number(rawSnake.base_price) || 0;
      rawSnake.waitlist_count = Number(rawSnake.waitlist_count) || 0;
      rawSnake.sold_out = Boolean(rawSnake.sold_out);
      rawSnake.created_at = rawSnake.created_at || new Date().toISOString().slice(0, 16).replace('T', ' ');
    } else if (realTable === 'mobile_models') {
      rawSnake.brand = rawSnake.brand || 'عام';
      rawSnake.name = rawSnake.name || 'موديل';
      rawSnake.aliases = rawSnake.aliases || rawSnake.name;
      if (typeof rawSnake.image === 'string' && rawSnake.image.startsWith('data:')) {
        rawSnake.image = '';
      }
    } else if (realTable === 'pricing_groups') {
      rawSnake.currency = rawSnake.currency || 'EGP';
      rawSnake.modifier_type = rawSnake.modifier_type || 'none';
      rawSnake.modifier_value = Number(rawSnake.modifier_value) || 0;
      rawSnake.delivery_fee_base = Number(rawSnake.delivery_fee_base ?? 75);
      rawSnake.is_default = Boolean(rawSnake.is_default);
    } else if (realTable === 'clients') {
      rawSnake.name = rawSnake.name || 'عميل';
      rawSnake.owner = rawSnake.owner || rawSnake.name || 'عميل فردي';
      rawSnake.phone = rawSnake.phone || '';
      rawSnake.email = rawSnake.email || '';
      rawSnake.password = rawSnake.password || '';
      // Security fix #7 (Stage B2.2): never write an empty password back —
      // client rows are no longer fetched with their password column, so an
      // empty value here means "unchanged", not "set to empty".
      if (!rawSnake.password) delete rawSnake.password;
      rawSnake.address = rawSnake.address || '';
      rawSnake.credit_limit = Number(rawSnake.credit_limit) || 0;
      rawSnake.wallet_balance = Number(rawSnake.wallet_balance) || 0;
      rawSnake.ledger = Array.isArray(rawSnake.ledger) ? rawSnake.ledger : [];
      rawSnake.status = rawSnake.status || 'active';
      rawSnake.type = rawSnake.type || rawSnake.account_type || 'shop';
      rawSnake.account_type = rawSnake.account_type || rawSnake.type || 'shop';
    } else if (realTable === 'account_requests') {
      rawSnake.shop_name = rawSnake.shop_name || rawSnake.name || 'عميل جديد';
      rawSnake.name = rawSnake.name || rawSnake.shop_name;
      rawSnake.owner_name = rawSnake.owner_name || rawSnake.owner || rawSnake.name || 'عميل فردي';
      rawSnake.owner = rawSnake.owner || rawSnake.owner_name;
      rawSnake.status = rawSnake.status || 'pending';
    } else if (realTable === 'orders') {
      rawSnake.currency = rawSnake.currency || 'EGP';
      rawSnake.exchange_rate_used = Number(rawSnake.exchange_rate_used) || 1;
      rawSnake.status = rawSnake.status || 'تم الاستلام';
      rawSnake.payment_method = rawSnake.payment_method || 'كاش عند الاستلام';
      rawSnake.address = rawSnake.address || 'عنوان مسجل';
      rawSnake.items = Array.isArray(rawSnake.items) ? rawSnake.items : [];
      rawSnake.delivery_fee_base = Number(rawSnake.delivery_fee_base) || 0;
      rawSnake.discount_base = Number(rawSnake.discount_base) || 0;
      rawSnake.wallet_used_base = Number(rawSnake.wallet_used_base) || 0;
      rawSnake.admin_edited = Boolean(rawSnake.admin_edited);
      const rawCreated = String(rawSnake.created_at || '');
      rawSnake.created_at = /^\d{4}-\d{2}-\d{2}/.test(rawCreated)
        ? rawCreated
        : new Date().toISOString().slice(0, 16).replace('T', ' ');
    } else if (realTable === 'store_ads') {
      rawSnake.active = rawSnake.active !== undefined ? Boolean(rawSnake.active) : true;
      rawSnake.sort_order = typeof rawSnake.sort_order === 'number' ? rawSnake.sort_order : rowIndex;
      rawSnake.layout = rawSnake.layout || 'blend';
      rawSnake.align = rawSnake.align || 'right';
      rawSnake.image_fit = rawSnake.image_fit || 'cover';
      rawSnake.overlay = rawSnake.overlay !== undefined ? Number(rawSnake.overlay) : 55;
      rawSnake.show_badge = rawSnake.show_badge !== false;
      rawSnake.show_button = rawSnake.show_button !== false;
    } else if (realTable === 'showcase_bars') {
      rawSnake.part_ids = Array.isArray(rawSnake.part_ids) ? rawSnake.part_ids : [];
      rawSnake.active = rawSnake.active !== undefined ? Boolean(rawSnake.active) : true;
      rawSnake.sort_order = typeof rawSnake.sort_order === 'number' ? rawSnake.sort_order : rowIndex;
    } else if (realTable === 'promo_codes') {
      rawSnake.value = Number(rawSnake.value) || 0;
      rawSnake.active = rawSnake.active !== undefined ? Boolean(rawSnake.active) : (rawSnake.is_active !== undefined ? Boolean(rawSnake.is_active) : true);
    } else if (realTable === 'returns_list') {
      rawSnake.qty = Number(rawSnake.qty) || 1;
      rawSnake.refund_amount_base = Number(rawSnake.refund_amount_base) || 0;
      rawSnake.status = rawSnake.status || 'قيد المراجعة';
      rawSnake.photos = Array.isArray(rawSnake.photos) ? rawSnake.photos : [];
      rawSnake.admin_response = rawSnake.admin_response || '';
      rawSnake.resolution_type = rawSnake.resolution_type || '';
      rawSnake.warranty_confirmed = Boolean(rawSnake.warranty_confirmed);
      rawSnake.replies = Array.isArray(rawSnake.replies) ? rawSnake.replies : [];
      rawSnake.closed = Boolean(rawSnake.closed);
      rawSnake.created_at = rawSnake.created_at || new Date().toISOString().slice(0, 16).replace('T', ' ');
    } else if (realTable === 'complaints') {
      rawSnake.status = rawSnake.status || 'مفتوح';
      rawSnake.admin_reply = rawSnake.admin_reply || '';
      rawSnake.replies = Array.isArray(rawSnake.replies) ? rawSnake.replies : [];
      rawSnake.created_at = rawSnake.created_at || new Date().toISOString().slice(0, 16).replace('T', ' ');
    } else if (realTable === 'sourcing_requests') {
      rawSnake.status = rawSnake.status || 'جديد';
      rawSnake.deposit_status = rawSnake.deposit_status || 'none';
      rawSnake.messages = Array.isArray(rawSnake.messages) ? rawSnake.messages : [];
      rawSnake.images_allowed = Boolean(rawSnake.images_allowed);
      rawSnake.unread_admin = Boolean(rawSnake.unread_admin);
      rawSnake.unread_client = Boolean(rawSnake.unread_client);
      rawSnake.closed = Boolean(rawSnake.closed);
      const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      rawSnake.created_at = rawSnake.created_at || nowStamp;
      rawSnake.updated_at = rawSnake.updated_at || nowStamp;
    } else if (realTable === 'auto_templates') {
      rawSnake.cost_price = Number(rawSnake.cost_price) || 0;
      rawSnake.base_price = Number(rawSnake.base_price) || 0;
      rawSnake.default_stock = Number(rawSnake.default_stock) || 0;
      rawSnake.low_stock_threshold = Number(rawSnake.low_stock_threshold) || 5;
      rawSnake.max_order_qty = Number(rawSnake.max_order_qty) || 10;
      rawSnake.enabled = rawSnake.enabled !== false;
    }

    // Store lightweight metadata in `data` JSONB (stripping heavy fields AND secret auth/OTP keys so `data` never leaks secrets!)
    const cleanDataCopy = { ...row };
    delete cleanDataCopy.data;
    delete cleanDataCopy.image;
    delete cleanDataCopy.images;
    delete cleanDataCopy.photos;
    delete cleanDataCopy.messages;
    delete cleanDataCopy.ledger;
    delete cleanDataCopy.avatarImage;
    delete cleanDataCopy.items;
    delete cleanDataCopy.description;
    if (realTable === 'clients') {
      delete cleanDataCopy.password;
      delete cleanDataCopy.resetOtp;
      delete cleanDataCopy.reset_otp;
      delete cleanDataCopy.resetOtpExpires;
      delete cleanDataCopy.reset_otp_expires;
      delete cleanDataCopy.requestedNewPassword;
      delete cleanDataCopy.requested_new_password;
    } else if (realTable === 'account_requests') {
      delete cleanDataCopy.password;
      delete cleanDataCopy.requestedPassword;
      delete cleanDataCopy.requested_password;
    }
    rawSnake.data = cleanDataCopy;

    const allowedList = TABLE_ALLOWED_COLUMNS[realTable];
    const blockedSet = unsupportedColumnsRef.current[realTable] || new Set();
    if (!allowedList) return rawSnake;

    // Ensure every row in a batch has the EXACT same keys (prevents PGRST102 batch error)
    const normalized = {};
    for (const col of allowedList) {
      if (blockedSet.has(col)) continue;
      normalized[col] = rawSnake[col] !== undefined ? rawSnake[col] : null;
    }
    return normalized;
  };
const NUMERIC_CAMEL_FIELDS = new Set([
    'basePrice', 'costPrice', 'stock', 'lowStockThreshold', 'maxOrderQty',
    'waitlistCount', 'modifierValue', 'deliveryFeeBase', 'creditLimit',
    'walletBalance', 'value', 'maxDiscountCap', 'minOrderAmount',
    'usageLimit', 'usedCount', 'qty', 'refundAmountBase', 'exchangeRateUsed',
    'discountBase', 'walletUsedBase', 'overlay'
  ]);
const toCamelCaseRow = (row) => {
    if (!row || typeof row !== 'object') return row;
    // Start with `row.data` (if present) so all rich UI properties (layout, theme, overlay, etc.) are restored intact
    const baseData = (row.data && typeof row.data === 'object' && !Array.isArray(row.data)) ? { ...row.data } : {};
    const out = { ...baseData };

    for (const [k, v] of Object.entries(row)) {
      if (k === 'data' || v === null || v === undefined) continue;
      const ck = SNAKE_TO_CAMEL_MAP[k] || k;
      out[ck] = v;
    }

    for (const nf of NUMERIC_CAMEL_FIELDS) {
      if (out[nf] !== undefined && out[nf] !== null && out[nf] !== '') {
        const n = Number(out[nf]);
        if (!Number.isNaN(n)) out[nf] = n;
      }
    }

    if (out.shopName && !out.name) out.name = out.shopName;
    if (out.name && !out.shopName) out.shopName = out.name;
    if (out.ownerName && !out.owner) out.owner = out.ownerName;
    if (out.owner && !out.ownerName) out.ownerName = out.owner;
    if (out.desc_text && !out.desc) out.desc = out.desc_text;
    const cgpObj = (out.customGroupPrices && typeof out.customGroupPrices === 'object') ? out.customGroupPrices : {};
    if (Array.isArray(cgpObj._images) && cgpObj._images.length > 0 && (!Array.isArray(out.images) || out.images.length <= 1)) {
      out.images = cgpObj._images.filter(Boolean).slice(0, 8);
    }
    if (cgpObj._oldPrice !== undefined && out.oldPrice === undefined) {
      out.oldPrice = Number(cgpObj._oldPrice) || 0;
    }
    if (cgpObj._hidden !== undefined && out.hidden === undefined) {
      out.hidden = Boolean(cgpObj._hidden);
    }
    if (cgpObj._isPromotedAd !== undefined && out.isPromotedAd === undefined) {
      out.isPromotedAd = Boolean(cgpObj._isPromotedAd);
    }
    // Always prioritize customGroupPrices metadata over default false DB columns so Cashback/VIP toggles never revert!
    if (cgpObj._cashbackEnabled !== undefined) {
      out.cashbackEnabled = Boolean(cgpObj._cashbackEnabled);
    }
    if (cgpObj._cashbackPct !== undefined) {
      out.cashbackPct = Number(cgpObj._cashbackPct);
    }
    if (cgpObj._isVipOnly !== undefined) {
      out.isVipOnly = Boolean(cgpObj._isVipOnly);
    }
    if (cgpObj._vipPrice !== undefined) {
      out.vipPrice = Number(cgpObj._vipPrice) || 0;
    }
    if (cgpObj._tierOriginalPrice !== undefined) {
      out.tierOriginalPrice = Number(cgpObj._tierOriginalPrice) || 0;
    }
    if (cgpObj._tierFirstClassPrice !== undefined) {
      out.tierFirstClassPrice = Number(cgpObj._tierFirstClassPrice) || 0;
    }
    if (cgpObj._tierEconomyPrice !== undefined) {
      out.tierEconomyPrice = Number(cgpObj._tierEconomyPrice) || 0;
    }
    if (out.phone && !out.birthDate) {
      out.birthDate = '1996-12-30';
    }
    if (out.phone && !out.referralCode) {
      out.referralCode = `REF-${String(out.phone || out.id || '1000').replace(/[^0-9]/g, '').slice(-5) || '1000'}`;
    }
    const resolvedImgUrl = row.image_url || out.image_url || out.imageUrl || out.image || (Array.isArray(out.images) && out.images[0]) || '';
    if (resolvedImgUrl) {
      out.image_url = resolvedImgUrl;
      out.imageUrl = resolvedImgUrl;
      if (!out.image) out.image = resolvedImgUrl;
    }
    if ((!Array.isArray(out.images) || out.images.length === 0) && out.image) {
      out.images = [out.image];
    }
    if (Array.isArray(out.images) && out.images.length > 0 && out.image && !out.images.includes(out.image)) {
      out.images = [out.image, ...out.images].slice(0, 8);
    }
    if (Array.isArray(out.images) && out.images.length > 8) {
      out.images = out.images.slice(0, 8);
    }
    if (!out.image && Array.isArray(out.images) && out.images[0]) {
      out.image = out.images[0];
      out.image_url = out.images[0];
      out.imageUrl = out.images[0];
    }
    if (out.isPromotedAd !== undefined && out.isPromotedAd !== null) {
      out.isPromotedAd = out.isPromotedAd === true || out.isPromotedAd === 'true';
    }
    if (out.brand || row.brand_id || row.brand_name) {
      out.brand = String(out.brand || row.brand_id || row.brand_name || '').trim();
    }
    if (out.modelId !== undefined && out.modelId !== null) {
      out.modelId = String(out.modelId).trim();
    }
    if ((out.sku !== undefined || out.modelId !== undefined || out.qualityGrade !== undefined) && (!out.basePrice || Number(out.basePrice) <= 0)) {
      out.basePrice = Number(out.costPrice) > 0 ? Math.round(Number(out.costPrice) * 1.25) : 450;
    }
    if ((out.sku !== undefined || out.modelId !== undefined) && (out.stock === undefined || out.stock === null)) {
      out.stock = 15;
    }
    if (out.sku !== undefined || out.modelId !== undefined || out.category !== undefined) {
      const skuUpper = String(out.sku || '').trim().toUpperCase();
      const rawCreated = String(out.createdAt || '').trim();
      const imgStr = String(out.image || out.image_url || '').trim();
      const isTemplateSku = /^(GLS-ORG|BAT-ORG|FLX-CHG|CAM-REAR|BCK-GLS)-/.test(skuUpper);
      const isDefaultSvgImg = !imgStr || imgStr.startsWith('data:image/svg');
      const isHardcodedTemplateDate = rawCreated === '2026-11-01 08:25' || rawCreated === '2020-01-01 08:25';
      const isAutoTemplate = isTemplateSku && isHardcodedTemplateDate && isDefaultSvgImg;
      out._isCustomUploaded = !isAutoTemplate;
      // Fix the future '2026-11-01 08:25' template timestamp so template rows never bury real products uploaded in 2025/2026!
      if (isAutoTemplate && rawCreated === '2026-11-01 08:25') {
        out.createdAt = '2020-01-01 08:25';
      }
    }
    return out;
  };
const loadSessionMap = (storageKey) => {
    try {
      const raw = (storageKey === 'hm_deleted_ids_v8' ? (window.localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey)) : sessionStorage.getItem(storageKey));
      if (raw) return JSON.parse(raw) || {};
    } catch (e) {}
    return {};
  };
const localModifiedMapRef = useRef(loadSessionMap('hm_local_mod_v8'));
const deletedIdsMapRef = useRef(loadSessionMap('hm_deleted_ids_v8'));
const prevSlicesRef = useRef(null);
const incomingSyncUntilRef = useRef(0);
const pendingDiffUpsertsRef = useRef({});
const pendingDiffDeletesRef = useRef({});
const diffFlushTimerRef = useRef(null);
const persistMutationMaps = () => {
    try {
      sessionStorage.setItem('hm_local_mod_v8', JSON.stringify(localModifiedMapRef.current));
      const delJson = JSON.stringify(deletedIdsMapRef.current);
      sessionStorage.setItem('hm_deleted_ids_v8', delJson);
      window.localStorage.setItem('hm_deleted_ids_v8', delJson);
    } catch (e) {}
  };
const markLocalUpsert = (sliceKey, item) => {
    if (!item) return;
    const id = String(typeof item === 'string' ? item : (item.id || item.code || item.name || ''));
    if (!id) return;
    if (!localModifiedMapRef.current[sliceKey]) localModifiedMapRef.current[sliceKey] = {};
    localModifiedMapRef.current[sliceKey][id] = { item, ts: Date.now() };
    if (deletedIdsMapRef.current[sliceKey]) {
      delete deletedIdsMapRef.current[sliceKey][id];
    }
    if (!pendingDiffUpsertsRef.current[sliceKey]) pendingDiffUpsertsRef.current[sliceKey] = {};
    pendingDiffUpsertsRef.current[sliceKey][id] = item;
    persistMutationMaps();
  };
const markLocalDelete = (sliceKey, rawId) => {
    const id = String(rawId || '');
    if (!id) return;
    if (!deletedIdsMapRef.current[sliceKey]) deletedIdsMapRef.current[sliceKey] = {};
    deletedIdsMapRef.current[sliceKey][id] = Date.now();
    if (localModifiedMapRef.current[sliceKey]) {
      delete localModifiedMapRef.current[sliceKey][id];
    }
    if (pendingDiffUpsertsRef.current[sliceKey]) {
      delete pendingDiffUpsertsRef.current[sliceKey][id];
    }
    if (!pendingDiffDeletesRef.current[sliceKey]) pendingDiffDeletesRef.current[sliceKey] = {};
    pendingDiffDeletesRef.current[sliceKey][id] = true;
    persistMutationMaps();
  };
const mergeServerWithLocal = (sliceKey, currentLocalArray, serverRows) => {
    const delMap = deletedIdsMapRef.current[sliceKey] || {};
    const modMap = localModifiedMapRef.current[sliceKey] || {};
    const now = Date.now();
    const TTL_MS = 15 * 60 * 1000; // Keep local edits protected for 15 minutes against stale cache/tables

    if (!Array.isArray(serverRows) || serverRows.length === 0) {
      return (Array.isArray(currentLocalArray) ? currentLocalArray : []).filter(item => {
        const id = String(typeof item === 'string' ? item : (item?.id || item?.code || item?.name || ''));
        return id && !delMap[id];
      });
    }

    // 1. Filter out deleted items and overlay any local edits on matching server rows
    const seenIds = new Set();
    const mergedServer = [];
    for (const sRow of serverRows) {
      const id = String(typeof sRow === 'string' ? sRow : (sRow?.id || sRow?.code || sRow?.name || ''));
      if (!id || delMap[id]) continue;
      seenIds.add(id);
      const localMod = modMap[id];
      if (localMod && localMod.item && (now - (localMod.ts || 0) < TTL_MS)) {
        if (sliceKey === 'orders' && typeof sRow === 'object' && sRow !== null) {
          const statusRank = { 'تم الاستلام': 1, 'جاري التجهيز': 2, 'جاهز للتسليم': 3, 'في الطريق (دليفري)': 4, 'تم التسليم': 5, 'ملغي': 6 };
          const sTs = Number(sRow.statusUpdatedAt || 0);
          const lTs = Number(localMod.item.statusUpdatedAt || localMod.ts || 0);
          const sRank = statusRank[sRow.status] || 0;
          const lRank = statusRank[localMod.item.status] || 0;
          if (sTs > lTs || sRank > lRank || (sRow.cashbackAwarded && !localMod.item.cashbackAwarded)) {
            mergedServer.push({ ...localMod.item, ...sRow, status: sRow.status, cashbackAwarded: Boolean(sRow.cashbackAwarded || localMod.item.cashbackAwarded), statusUpdatedAt: Math.max(sTs, lTs) });
          } else {
            mergedServer.push({ ...sRow, ...localMod.item });
          }
        } else {
          mergedServer.push(typeof sRow === 'string' ? localMod.item : { ...sRow, ...localMod.item });
        }
      } else {
        mergedServer.push(sRow);
      }
    }

    // 2. Prepend any locally added items that are not in serverRows yet
    const newLocalItems = [];
    for (const [id, entry] of Object.entries(modMap)) {
      if (!seenIds.has(id) && !delMap[id] && entry && entry.item && (now - (entry.ts || 0) < TTL_MS)) {
        newLocalItems.push(entry.item);
        seenIds.add(id);
      }
    }

    // 3. For catalog slices, only preserve on-demand server rows or admin-uploaded items — NEVER preserve hardcoded demo INITIAL_PARTS once real server data arrives!
    const DEMO_INITIAL_PART_IDS = new Set(['prt_1','prt_2','prt_3','prt_4','prt_5','prt_6','prt_7','prt_8','prt_9','prt_10','prt_11','prt_12','prt_13']);
    const preservedCatalogItems = [];
    if (sliceKey === 'parts' && Array.isArray(currentLocalArray)) {
      for (const localItem of currentLocalArray) {
        const id = String(localItem?.id || '');
        if (!id || seenIds.has(id) || delMap[id]) continue;
        if (DEMO_INITIAL_PART_IDS.has(id) && !localItem._isCustomUploaded) continue;
        // Skip old auto-generated template placeholders from local memory if not in server response
        if (String(localItem?.createdAt || '') === '2026-11-01 08:25' && !localItem._isCustomUploaded) continue;
        preservedCatalogItems.push(localItem);
        seenIds.add(id);
      }
    }

    return [...newLocalItems, ...mergedServer, ...preservedCatalogItems];
  };
const STATIC_SESSION_TABLES = new Set([
    'spare_parts', 'mobile_models', 'brands', 'pricing_groups',
    'store_ads', 'showcase_bars', 'promo_codes', 'auto_templates', 'site_settings'
  ]);
const SESSION_CACHE_PREFIX = 'elzoghbi_lcache_v31_';
try {
    if (window.localStorage.getItem('elzoghbi_app_version') !== 'v31_market_security') {
      window.sessionStorage.clear();
      // Remove only obsolete v27 session keys without wiping valid local catalog cache unnecessarily
      const oldKeys = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('elzoghbi_scache_') || k.startsWith('elzoghbi_lcache_v29_'))) oldKeys.push(k);
      }
      oldKeys.forEach(k => window.localStorage.removeItem(k));
      window.localStorage.setItem('elzoghbi_app_version', 'v31_market_security');
    }
  } catch (e) {}
const SESSION_CACHE_TTL = 24 * 60 * 60 * 1000;
const CACHE_SCHEMA_VER = 3;
const readSessionTableCache = (cacheKey, table) => {
    try {
      const raw = window.localStorage.getItem(SESSION_CACHE_PREFIX + cacheKey);
      if (!raw) return null;
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch (e) { window.localStorage.removeItem(SESSION_CACHE_PREFIX + cacheKey); return null; }
      if (!parsed || !Array.isArray(parsed.rows) || parsed.ver !== CACHE_SCHEMA_VER) return null;
      const globalBustTs = Number(window.localStorage.getItem('elzoghbi_cache_bust_ts') || 0);
      if ((parsed.ts || 0) <= globalBustTs || (Date.now() - (parsed.ts || 0)) >= SESSION_CACHE_TTL) return null;
      const sv = window.__elzCacheVers && table ? window.__elzCacheVers[table] : undefined;
      if (sv !== undefined && parsed.sv !== sv) return null; // table changed on the server → refetch
      return parsed.rows;
    } catch (e) { return null; }
  };
const writeSessionTableCache = (cacheKey, rows, table) => {
    try {
      if (!Array.isArray(rows)) return;
      const sv = window.__elzCacheVers && table ? window.__elzCacheVers[table] : undefined;
      const payloadStr = JSON.stringify({ rows, ts: Date.now(), ver: CACHE_SCHEMA_VER, sv });
      try { window.localStorage.setItem(SESSION_CACHE_PREFIX + cacheKey, payloadStr); } catch (quotaErr) { /* quota: skip, never fall back to sessionStorage */ }
    } catch (e) {}
  };
const invalidateSessionTableCache = (tableName) => {
    try {
      if (!tableName) window.localStorage.setItem('elzoghbi_cache_bust_ts', String(Date.now())); // Per-table invalidation only; never wipe unrelated tables!
      const clearMatching = (store) => {
        const keysToRemove = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && k.startsWith(SESSION_CACHE_PREFIX + (tableName ? resolveActualTableName(tableName) : ''))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => store.removeItem(k));
      };
      clearMatching(window.localStorage);
      clearMatching(window.sessionStorage);
    } catch (e) {}
  };
// Storefront gets only public columns. cost_price / warranty_text / compatible_models are NOT in the public list
// (cost lives in spare_parts_private → admin only; warranty/compat load on product open).
const PART_ADMIN_COLUMNS = 'id,sku,model_id,category,name,quality_grade,colors,compatible_models,warranty_text,image,stock,low_stock_threshold,max_order_qty,cost_price,base_price,custom_group_prices,waitlist_count,sold_out,created_at';
const TABLE_LIGHT_COLUMNS = {
  guide_phones: 'id,data,created_at,updated_at',
  price_alerts: 'id,data,created_at,updated_at',
    spare_parts: 'id,sku,model_id,category,name,quality_grade,colors,image,stock,low_stock_threshold,max_order_qty,base_price,custom_group_prices,waitlist_count,sold_out,created_at',
    mobile_models: 'id,brand,name,aliases',
    brands: 'name,sort_order',
    pricing_groups: 'id,name,currency,modifier_type,modifier_value,delivery_fee_base,is_default,description',
    store_ads: 'id,badge,title,subtitle,theme,gradient,image,button_text,linked_part_id,layout,align,image_fit,overlay,show_badge,show_button,start_date,end_date,active,sort_order',
    showcase_bars: 'id,title,subtitle,badge_color,part_ids,active,sort_order',
    promo_codes: 'id,code,type,value,max_discount_cap,min_order_amount,usage_limit,used_count,expiry_date,description,active',
    auto_templates: 'id,sku_prefix,category,name_pattern,quality_grade,colors,warranty_text,image_key,cost_price,base_price,default_stock,low_stock_threshold,max_order_qty,enabled',
    site_settings: 'id,settings,currencies,notifications,updated_at',
    clients: 'id,name,owner,phone,email,address,secondary_address,group_id,credit_limit,wallet_balance,ledger,status,type,account_type,avatar,avatar_bg,avatar_image,created_at,data',
    orders: 'id,client_id,client_name,group_id,currency,exchange_rate_used,status,payment_method,address,notes,items,delivery_fee_base,discount_base,wallet_used_base,total,admin_edited,admin_edit_note,created_at',
    complaints: 'id,client_id,client_name,type,subject,message,status,admin_reply,replies,created_at',
    returns_list: 'id,order_id,client_id,client_name,part_id,part_name,qty,refund_amount_base,reason,status,admin_response,resolution_type,warranty_confirmed,replies,closed,created_at',
    account_requests: 'id,name,shop_name,owner,owner_name,phone,email,address,type,account_category,shop_type,notes,status,assigned_group_id,credit_limit,created_at',
    sourcing_requests: 'id,client_id,client_name,phone,client_phone,part_id,part_name,name,desc_text,notes,status,price,deposit,deposit_status,images_allowed,unread_admin,unread_client,closed,created_at,updated_at'
  };
const TABLE_DEFAULT_QUERY = {
    spare_parts: '&order=created_at.desc&limit=20',
    mobile_models: '&limit=400',
    orders: '&order=created_at.desc&limit=40',
    clients: '&limit=100',
    complaints: '&order=created_at.desc&limit=40',
    returns_list: '&order=created_at.desc&limit=40',
    account_requests: '&order=created_at.desc&limit=40',
    sourcing_requests: '&order=created_at.desc&limit=25'
  };
const inFlightRequestsMapRef = useRef(new Map());
const hasInitialBootPullRanRef = useRef(false);
const hasAdminTablesPulledRef = useRef(false);
const isFirstFilterRenderRef = useRef(true);
const filterFetchDebounceRef = useRef(null);
const fetchedModelPartsSetRef = useRef(new Set());
const fetchedPartDetailsSetRef = useRef(new Set());
const fetchedPartImagesSetRef = useRef(new Set());
const fetchedStorePagesSetRef = useRef(new Set([1]));
useEffect(() => {
    try {
      const { sbUrl, sbKey } = getSupabaseConfig();
      const createQueryBuilder = (tableName) => {
        const realTbl = resolveActualTableName(tableName);
        let selectCols = '*';
        const filters = [];
        let limitNum = null;
        const builder = {
          select: (cols = '*') => {
            selectCols = cols;
            return builder;
          },
          eq: (col, val) => {
            filters.push(`${col}=eq.${encodeURIComponent(val)}`);
            return builder;
          },
          ilike: (col, val) => {
            filters.push(`${col}=ilike.${encodeURIComponent(val)}`);
            return builder;
          },
          order: (col, opts = {}) => {
            filters.push(`order=${col}.${opts && opts.ascending === false ? 'desc' : 'asc'}`);
            return builder;
          },
          limit: (n) => {
            limitNum = n;
            return builder;
          },
          then: async (resolve, reject) => {
            try {
              const wantsSparePartsJoin = String(selectCols).includes('spare_parts');
              const actualSelect = wantsSparePartsJoin ? 'id,brand,name,aliases' : selectCols;
              const q = (filters.length ? '&' + filters.join('&') : '') + (limitNum ? `&limit=${limitNum}` : '');
              const res = await fetch(`${sbUrl}/rest/v1/${realTbl}?select=${encodeURIComponent(actualSelect)}${q}`, {
                headers: sbHeaders(sbKey)
              });
              if (!res.ok) {
                const errText = await res.text();
                return resolve({ data: null, error: { status: res.status, message: errText } });
              }
              let data = await res.json();
              if (wantsSparePartsJoin && realTbl === 'mobile_models' && Array.isArray(data)) {
                const spRes = await fetch(`${sbUrl}/rest/v1/spare_parts?select=id,sku,model_id,category,name,base_price,stock`, {
                  headers: sbHeaders(sbKey)
                });
                const spRows = spRes.ok ? await spRes.json() : [];
                const byModel = {};
                (spRows || []).forEach(sp => {
                  const mid = String(sp.model_id || '');
                  if (!byModel[mid]) byModel[mid] = [];
                  byModel[mid].push(sp);
                });
                data = data.map(m => ({ ...m, spare_parts: byModel[String(m.id)] || [] }));
              }
              resolve({ data, error: null });
            } catch (err) {
              if (reject) reject(err);
              else resolve({ data: null, error: err });
            }
          }
        };
        return builder;
      };
      window.supabase = { from: createQueryBuilder };
    } catch (e) {}
  }, []);
const sbFetchTableBase = async (tableName, select = null, query = null, forceNetwork = false) => {
    const { sbUrl, sbKey, isValid } = getSupabaseConfig();
    if (!isValid) return null;
    const realTable = resolveActualTableName(tableName);
    const isAdminCtx = (appPortal === 'admin' || adminAuthenticated);
    await ensureCacheVersions(sbUrl, sbKey);
    let colsList = ((!select || select === '*') ? ((realTable === 'spare_parts' && isAdminCtx) ? PART_ADMIN_COLUMNS : (TABLE_LIGHT_COLUMNS[realTable] || 'id')) : select)
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);
    const qStr = (query === null || query === undefined || query === '') ? (TABLE_DEFAULT_QUERY[realTable] || '') : query;
    const cacheKey = `${realTable}_${colsList.join(',')}_${qStr}${isAdminCtx ? '_adm' : ''}`;

    // 1. Serve from SessionStorage cache if available (prevents repeated network requests!)
    if (!forceNetwork && STATIC_SESSION_TABLES.has(realTable)) {
      const cached = readSessionTableCache(cacheKey, realTable);
      if (cached && cached.length > 0) {
        return cached;
      }
    }

    // 2. Deduplicate identical concurrent or back-to-back requests within 5 seconds
    const existingInFlight = inFlightRequestsMapRef.current.get(cacheKey);
    if (existingInFlight && (Date.now() - existingInFlight.ts < 5000)) {
      return existingInFlight.promise;
    }

    const fetchPromise = (async () => {
      try {
        let currentQuery = qStr;
        let fetchTable = (realTable === 'site_settings' && !isAdminCtx) ? 'site_settings_public' : realTable;

        for (let attempt = 0; attempt < 3; attempt++) {
          const currentCols = colsList.join(',');
          const res = await fetch(`${sbUrl}/rest/v1/${fetchTable}?select=${currentCols}${currentQuery}`, {
            headers: sbHeaders(sbKey)
          });
          if (res.status === 404 && fetchTable !== realTable) { fetchTable = realTable; continue; } // sql/07 not applied yet

          if (res.ok) {
            let rows = await res.json();
            if (Array.isArray(rows)) {
              const mapped = rows.map(toCamelCaseRow);
              if (STATIC_SESSION_TABLES.has(realTable)) {
                writeSessionTableCache(cacheKey, mapped, realTable);
              }
              return mapped;
            }
            return rows;
          }

          if (res.status === 400) {
            const errText = await res.text();
            const colMatch =
              errText.match(/column [^."]*\.?([a-zA-Z0-9_]+) does not exist/i) ||
              errText.match(/Could not find the '([^']+)' column/i);
            if (colMatch && colMatch[1]) {
              const missingCol = colMatch[1].trim();
              colsList = colsList.filter(c => c !== missingCol);
              if (currentQuery.includes(missingCol)) {
                currentQuery = currentQuery
                  .replace(new RegExp(`&?order=${missingCol}\\.(asc|desc)(,[a-zA-Z0-9_.]+)?`, 'ig'), '')
                  .replace(new RegExp(`&?${missingCol}=[^&]+`, 'ig'), '');
              }
              if (colsList.length > 0) continue;
            }
            // Minimal safe fallback without heavy JSONB blobs unless unavoidable
            colsList = realTable === 'brands' ? ['name'] : ['id'];
            continue;
          }
          break;
        }
      } catch (err) {}
      return null;
    })();

    inFlightRequestsMapRef.current.set(cacheKey, { ts: Date.now(), promise: fetchPromise });
    return fetchPromise;
  };
// ---------------------------------------------------------------------------
// Stage D (security phase 3): customer-data tables are RLS-locked (SQL 08).
// Reads/writes for them flow through security-definer RPCs that authenticate
// the caller (owner credentials / RBAC employee / Supabase Auth JWT / the
// logged-in customer for their own rows). While the RPCs are not installed
// yet (SQL 08 not run), every gated call falls back to the previous direct
// table access, so deploying this code first is safe.
// ---------------------------------------------------------------------------
const GATED_TABLES = new Set(['orders', 'complaints', 'returns_list', 'sourcing_requests', 'account_requests', 'clients', 'price_alerts', 'guide_phones']);
const CLIENT_GATED_READ_TABLES = new Set(['orders', 'complaints', 'returns_list', 'sourcing_requests', 'clients']);
const CLIENT_GATED_WRITE_TABLES = new Set(['complaints', 'returns_list', 'sourcing_requests', 'clients']);
const adminRpcCredsRef = useRef(null);
const clientRpcPassRef = useRef('');
const getClientRpcCreds = () => {
    if (currentClient && currentClient.id && clientRpcPassRef.current) {
      return { id: currentClient.id, password: clientRpcPassRef.current };
    }
    return null;
};
const getAdminRpcCreds = () => {
    if (adminCredentials && adminCredentials.username && adminCredentials.password) {
      return { username: adminCredentials.username, password: adminCredentials.password };
    }
    if (adminRpcCredsRef.current && adminRpcCredsRef.current.username) return adminRpcCredsRef.current;
    if (getAdminJwt()) return { username: '', password: '' };
    return null;
};
const gatedRpcCall = async (fn, body) => {
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (!isValid) return { ok: false, status: 0 };
      const jwt = getAdminJwt();
      const res = await fetch(`${sbUrl}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: { apikey: sbKey, Authorization: `Bearer ${jwt || sbKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) return { ok: false, status: res.status };
      return { ok: true, data: await res.json() };
    } catch (e) { return { ok: false, status: 0 }; }
};
const tryGatedFetch = async (realTable, query) => {
    const q = String(query || '');
    const lim = parseInt((q.match(/limit=(\d+)/) || [])[1] || '500', 10);
    const off = parseInt((q.match(/offset=(\d+)/) || [])[1] || '0', 10);
    const creds = getAdminRpcCreds();
    if (creds) {
      const g = await gatedRpcCall('gated_rows', { p_username: creds.username, p_password: creds.password, p_table: realTable, p_limit: lim, p_offset: off });
      if (g.ok && Array.isArray(g.data)) return g.data.map(toCamelCaseRow);
      if (g.ok) return null; // RPC answered but denied/unavailable -> fall back
      if (g.status !== 404 && g.status !== 400) return null;
      return null;
    }
    const clientCreds = getClientRpcCreds();
    if (clientCreds && CLIENT_GATED_READ_TABLES.has(realTable)) {
      const g = await gatedRpcCall('client_rows', { p_client_id: clientCreds.id, p_password: clientCreds.password, p_table: realTable, p_limit: lim });
      if (g.ok && Array.isArray(g.data)) return g.data.map(toCamelCaseRow);
    }
    return null;
};
useEffect(() => { if (!adminAuthenticated) adminRpcCredsRef.current = null; }, [adminAuthenticated]);
const sbFetchTable = async (tableName, select = null, query = null, forceNetwork = false) => {
    const gatedReal = resolveActualTableName(tableName);
    if (GATED_TABLES.has(gatedReal) && gatedReal !== 'guide_phones') {
      const gatedRows = await tryGatedFetch(gatedReal, query === null || query === undefined || query === '' ? (TABLE_DEFAULT_QUERY[gatedReal] || '') : query);
      if (gatedRows) return gatedRows;
    }
    const rows = await sbFetchTableBase(tableName, select, query, forceNetwork);
    try {
      if (Array.isArray(rows) && resolveActualTableName(tableName) === 'spare_parts' && (appPortal === 'admin' || adminAuthenticated) && getAdminJwt()) {
        const costs = await loadAdminCostMap();
        if (costs) return rows.map(r => (r && costs[String(r.id)] !== undefined ? { ...r, costPrice: costs[String(r.id)] } : r));
      }
    } catch (e) {}
    return rows;
  };
const adminCostCacheRef = useRef({ ts: 0, map: null });
const loadAdminCostMap = async () => {
    const jwt = getAdminJwt();
    if (!jwt) return null;
    if (adminCostCacheRef.current.map && Date.now() - adminCostCacheRef.current.ts < 60000) return adminCostCacheRef.current.map;
    try {
      const { sbUrl, sbKey } = getSupabaseConfig();
      const r = await fetch(`${sbUrl}/rest/v1/spare_parts_private?select=part_id,cost_price&limit=5000`, { headers: sbHeaders(sbKey) });
      if (!r.ok) return null;
      const map = {};
      (await r.json()).forEach(x => { map[String(x.part_id)] = x.cost_price; });
      adminCostCacheRef.current = { ts: Date.now(), map };
      return map;
    } catch (e) { return null; }
  };
const fetchVisiblePartImagesOnDemand = async () => {
    // No-op: `image` (external URL) is already included directly in the paginated `limit=20` query!
  };
const fetchSparePartsSliceOnDemand = async ({ brand = 'ALL', modelId = 'ALL', category = 'ALL', search = '', page = 1, limit = 250 } = {}) => {
    const { isValid } = getSupabaseConfig();
    if (!isValid) return;
    const cols = TABLE_LIGHT_COLUMNS.spare_parts;
    const filters = [];

    if (modelId && modelId !== 'ALL') {
      filters.push(`model_id=eq.${encodeURIComponent(String(modelId).trim())}`);
    } else if (brand && brand !== 'ALL') {
      const targetBrandClean = String(brand).trim().toLowerCase();
      const brandModelIds = models
        .filter(m => m && String(m.brand || '').trim().toLowerCase() === targetBrandClean)
        .map(m => String(m.id).trim())
        .filter(Boolean)
        .slice(0, 80);
      if (brandModelIds.length > 0) {
        // PostgREST requires literal commas separating values inside in.(val1,val2)
        const inStr = brandModelIds.map(id => encodeURIComponent(id)).join(',');
        filters.push(`model_id=in.(${inStr})`);
      }
    }

    if (category && category !== 'ALL') {
      filters.push(`category=eq.${encodeURIComponent(category)}`);
    }
    if (search && search.trim() !== '') {
      const cleanQ = search.trim().replace(/[%*,()]/g, '');
      const words = cleanQ.split(/\s+/).filter(w => w.length >= 2);
      const primaryWord = words[0] || cleanQ;
      if (primaryWord) {
        const enc = encodeURIComponent(primaryWord);
        filters.push(`or=(name.ilike.*${enc}*,category.ilike.*${enc}*,sku.ilike.*${enc}*,quality_grade.ilike.*${enc}*)`);
      }
    }

    const offset = page <= 1 ? 0 : Math.max(0, (page - 1) * limit);
    const fetchLimit = page <= 1 ? Math.max(limit, 250) : limit;
    const filterQuery = (filters.length > 0 ? '&' + filters.join('&') : '') + `&order=id.asc&limit=${fetchLimit}&offset=${offset}`;

    const rows = await sbFetchTable('spare_parts', cols, filterQuery, false);
    if (Array.isArray(rows) && rows.length > 0) {
      incomingSyncUntilRef.current = Date.now() + 250;
      isIncomingSyncRef.current = true;
      setParts(prev => {
        const map = new Map(prev.map(p => [String(p.id), p]));
        rows.forEach(r => {
          const existing = map.get(String(r.id));
          if (existing) {
            map.set(String(r.id), {
              ...existing,
              ...r,
              cashbackEnabled: existing.cashbackEnabled !== undefined ? existing.cashbackEnabled : r.cashbackEnabled,
              cashbackPct: existing.cashbackPct !== undefined ? existing.cashbackPct : r.cashbackPct,
              isVipOnly: existing.isVipOnly !== undefined ? existing.isVipOnly : r.isVipOnly,
              vipPrice: existing.vipPrice !== undefined ? existing.vipPrice : r.vipPrice,
              customGroupPrices: { ...(r.customGroupPrices || {}), ...(existing.customGroupPrices || {}) }
            });
          } else {
            map.set(String(r.id), r);
          }
        });
        const merged = mergeServerWithLocal('parts', prev, Array.from(map.values()));
        if (prevSlicesRef.current) prevSlicesRef.current.parts = merged;
        return merged;
      });
    }
  };
const fetchSinglePartFullDetailsOnDemand = async (partId) => {
    if (!partId || fetchedPartDetailsSetRef.current.has(String(partId))) return;
    const { sbUrl, sbKey, isValid } = getSupabaseConfig();
    if (!isValid) return;
    fetchedPartDetailsSetRef.current.add(String(partId));
    try {
      const res = await fetch(
        `${sbUrl}/rest/v1/spare_parts?id=eq.${encodeURIComponent(partId)}&select=id,image,description,images,search_aliases,warranty_text,compatible_models`,
        { headers: sbHeaders(sbKey) }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]) {
          const detail = toCamelCaseRow(rows[0]);
          incomingSyncUntilRef.current = Date.now() + 250;
          isIncomingSyncRef.current = true;
          setParts(prev => prev.map(p => {
            if (String(p.id) !== String(partId)) return p;
            const bestImages = (Array.isArray(detail.images) && detail.images.length > 1)
              ? detail.images
              : (Array.isArray(p.images) && p.images.length > 1 ? p.images : (detail.images || p.images));
            return { ...p, ...detail, images: bestImages };
          }));
          setSelectedDetailItem(prev => {
            if (prev && prev.part && String(prev.part.id) === String(partId)) {
              const bestImages = (Array.isArray(detail.images) && detail.images.length > 1)
                ? detail.images
                : (Array.isArray(prev.part.images) && prev.part.images.length > 1 ? prev.part.images : (detail.images || prev.part.images));
              return { ...prev, part: { ...prev.part, ...detail, images: bestImages } };
            }
            return prev;
          });
        }
      }
    } catch (e) {}
  };
const fetchSingleSourcingDetailsOnDemand = async (srcId) => {
    if (!srcId) return;
    const { sbUrl, sbKey, isValid } = getSupabaseConfig();
    if (!isValid) return;
    try {
      const res = await fetch(
        `${sbUrl}/rest/v1/sourcing_requests?id=eq.${encodeURIComponent(srcId)}&select=id,image,messages`,
        { headers: sbHeaders(sbKey) }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]) {
          const detail = toCamelCaseRow(rows[0]);
          incomingSyncUntilRef.current = Date.now() + 250;
          isIncomingSyncRef.current = true;
          setSourcingRequests(prev => prev.map(r => (String(r.id) === String(srcId) ? { ...r, ...detail } : r)));
        }
      }
    } catch (e) {}
  };
const sbUpsert = async (tableName, recordOrArray) => {
    const { sbUrl, sbKey, isValid } = getSupabaseConfig();
    if (!isValid || !recordOrArray) return false;
    const realTable = resolveActualTableName(tableName);
    invalidateSessionTableCache(realTable);
    if (!unsupportedColumnsRef.current[realTable]) {
      unsupportedColumnsRef.current[realTable] = new Set();
    }

    try {
      const cleanedInput = await externalizeBase64Deep(recordOrArray);
      const rawList = Array.isArray(cleanedInput) ? cleanedInput : [cleanedInput];
      if (rawList.length === 0) return true;

      // Chunk large arrays into batches of 100 to prevent payload timeouts
      const BATCH_SIZE = 100;
      for (let b = 0; b < rawList.length; b += BATCH_SIZE) {
        const chunk = rawList.slice(b, b + BATCH_SIZE);
        let success = false;

        // Stage D: gated tables are written through the RPC when we hold
        // credentials (admin, or the logged-in customer for their own rows).
        if (GATED_TABLES.has(realTable)) {
          const adminCreds = getAdminRpcCreds();
          const clientCreds = (!adminCreds && CLIENT_GATED_WRITE_TABLES.has(realTable)) ? getClientRpcCreds() : null;
          if (adminCreds || clientCreds) {
            const payload = chunk.map((r, idx) => toSnakeCaseRow(r, realTable, b + idx));
            let gatedDone = true;
            for (const row of payload) {
              const g = await gatedRpcCall('gated_upsert', {
                p_username: adminCreds ? adminCreds.username : '',
                p_password: adminCreds ? adminCreds.password : clientCreds.password,
                p_table: realTable, p_row: row
              });
              if (!g.ok) { gatedDone = false; break; }
              if (g.data !== true) return false;
            }
            if (gatedDone) success = true;
          }
        }

        for (let attempt = 0; attempt < 12 && !success; attempt++) {
          const payload = chunk.map((r, idx) => toSnakeCaseRow(r, realTable, b + idx));
          const res = await fetch(`${sbUrl}/rest/v1/${realTable}`, {
            method: 'POST',
            headers: sbHeaders(sbKey, {
              Prefer: 'resolution=merge-duplicates,return=minimal'
            }),
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            success = true;
            break;
          }

          const errText = await res.text();
          // Detect PGRST204 / 42703 missing column and strip it automatically!
          const colMatch =
            errText.match(/Could not find the '([^']+)' column/i) ||
            errText.match(/column "([^"]+)" of relation/i);
          if (colMatch && colMatch[1]) {
            const badCol = colMatch[1];
            unsupportedColumnsRef.current[realTable].add(badCol);
            continue;
          } else {
            console.warn(`⚠️ [ELZOGHBI] تحذير حفظ جدول ${realTable} (${res.status}):`, errText);
            break;
          }
        }

        if (!success) return false;
      }
      return true;
    } catch (err) {
      console.error(`❌ [ELZOGHBI] خطأ اتصال أثناء حفظ ${realTable}:`, err);
      return false;
    }
  };
const sbUpdate = async (tableName, id, patchObj) => {
    const { sbUrl, sbKey, isValid } = getSupabaseConfig();
    if (!isValid || !id || !patchObj) return false;
    const realTable = resolveActualTableName(tableName);
    invalidateSessionTableCache(realTable);
    if (!unsupportedColumnsRef.current[realTable]) {
      unsupportedColumnsRef.current[realTable] = new Set();
    }
    const pkCol = realTable === 'brands' ? 'name' : 'id';
    // Stage D: gated tables patch through the RPC when we hold credentials.
    if (GATED_TABLES.has(realTable)) {
      const adminCreds = getAdminRpcCreds();
      const clientCreds = (!adminCreds && CLIENT_GATED_WRITE_TABLES.has(realTable)) ? getClientRpcCreds() : null;
      if (adminCreds || clientCreds) {
        const payload = {};
        for (const [k, v] of Object.entries(patchObj)) { payload[CAMEL_TO_SNAKE_MAP[k] || k] = v; }
        const g = await gatedRpcCall('gated_patch', {
          p_username: adminCreds ? adminCreds.username : '',
          p_password: adminCreds ? adminCreds.password : clientCreds.password,
          p_table: realTable, p_id: id, p_patch: payload
        });
        if (g.ok) return g.data === true;
      }
    }
    try {
      for (let attempt = 0; attempt < 8; attempt++) {
        const blocked = unsupportedColumnsRef.current[realTable];
        const payload = {};
        for (const [k, v] of Object.entries(patchObj)) {
          const sk = CAMEL_TO_SNAKE_MAP[k] || k;
          if (!blocked.has(sk)) payload[sk] = v;
        }
        const res = await fetch(`${sbUrl}/rest/v1/${realTable}?${pkCol}=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: sbHeaders(sbKey, { Prefer: 'return=minimal' }),
          body: JSON.stringify(payload)
        });
        if (res.ok) return true;
        const errText = await res.text();
        const colMatch =
          errText.match(/Could not find the '([^']+)' column/i) ||
          errText.match(/column "([^"]+)" of relation/i);
        if (colMatch && colMatch[1]) {
          unsupportedColumnsRef.current[realTable].add(colMatch[1]);
          continue;
        }
        break;
      }
    } catch (err) {}
    return false;
  };
const sbDelete = async (tableName, id) => {
    const { sbUrl, sbKey, isValid } = getSupabaseConfig();
    if (!isValid || !id) return false;
    const realTable = resolveActualTableName(tableName);
    invalidateSessionTableCache(realTable);
    const pkCol = realTable === 'brands' ? 'name' : 'id';
    // Stage D: gated tables delete through the RPC when admin credentials exist.
    if (GATED_TABLES.has(realTable)) {
      const adminCreds = getAdminRpcCreds();
      if (adminCreds) {
        const g = await gatedRpcCall('gated_delete', { p_username: adminCreds.username, p_password: adminCreds.password, p_table: realTable, p_id: id });
        if (g.ok) return g.data === true;
      }
    }
    try {
      const res = await fetch(`${sbUrl}/rest/v1/${realTable}?${pkCol}=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: sbHeaders(sbKey)
      });
      return res.ok;
    } catch (err) {}
    return false;
  };
const flushPendingDiffsToSupabase = async (showSuccessToast = false) => {
    const { isValid } = getSupabaseConfig();
    if (!isValid) return false;
    if (isSavingRef.current) {
      pendingReflushRef.current = true;
      return false;
    }
    isSavingRef.current = true;
    pendingReflushRef.current = false;

    const SLICE_TO_TABLE = {
      parts: 'spare_parts',
      models: 'mobile_models',
      brands: 'brands',
      groups: 'pricing_groups',
      storeAds: 'store_ads',
      showcaseBars: 'showcase_bars',
      promoCodes: 'promo_codes',
      clients: 'clients',
      accountRequests: 'account_requests',
      orders: 'orders',
      returnsList: 'returns_list',
      complaints: 'complaints',
      autoTemplates: 'auto_templates',
      sourcingRequests: 'sourcing_requests'
    };

    try {
      setCloudSyncStatus('syncing');
      const taskEntries = [];

      // 1. Snapshot and process all pending deletes
      for (const [sliceKey, idMap] of Object.entries(pendingDiffDeletesRef.current)) {
        const tbl = SLICE_TO_TABLE[sliceKey];
        if (!tbl || !idMap) continue;
        const ids = Object.keys(idMap);
        delete pendingDiffDeletesRef.current[sliceKey];
        for (const id of ids) {
          taskEntries.push({ kind: 'delete', sliceKey, id, promise: sbDelete(tbl, id) });
        }
      }

      // 2. Snapshot and process all pending upserts
      for (const [sliceKey, itemMap] of Object.entries(pendingDiffUpsertsRef.current)) {
        if (sliceKey === 'site_settings') {
          const payload = itemMap.main;
          delete pendingDiffUpsertsRef.current.site_settings;
          if (payload) {
            taskEntries.push({ kind: 'settings', sliceKey, payload, promise: sbUpsert('site_settings', [payload]) });
          }
          continue;
        }
        const tbl = SLICE_TO_TABLE[sliceKey];
        if (!tbl || !itemMap) continue;
        const snapshotMap = { ...itemMap };
        const items = Object.values(snapshotMap);
        delete pendingDiffUpsertsRef.current[sliceKey];
        if (items.length > 0) {
          const formatted = sliceKey === 'brands'
            ? items.map((b, i) => (typeof b === 'string' ? { name: b, sort_order: i, image_url: brandImages[b] || '' } : b))
            : items;
          taskEntries.push({ kind: 'upsert', sliceKey, snapshotMap, promise: sbUpsert(tbl, formatted) });
        }
      }

      let anyFailed = false;
      if (taskEntries.length > 0) {
        const results = await Promise.all(taskEntries.map(t => t.promise));
        results.forEach((ok, idx) => {
          if (ok === true) return;
          anyFailed = true;
          const entry = taskEntries[idx];
          // Re-queue failed mutations so they are never silently lost
          if (entry.kind === 'delete') {
            if (!pendingDiffDeletesRef.current[entry.sliceKey]) pendingDiffDeletesRef.current[entry.sliceKey] = {};
            pendingDiffDeletesRef.current[entry.sliceKey][entry.id] = true;
          } else if (entry.kind === 'settings') {
            if (!pendingDiffUpsertsRef.current.site_settings) pendingDiffUpsertsRef.current.site_settings = {};
            if (!pendingDiffUpsertsRef.current.site_settings.main) {
              pendingDiffUpsertsRef.current.site_settings.main = entry.payload;
            }
          } else if (entry.kind === 'upsert') {
            if (!pendingDiffUpsertsRef.current[entry.sliceKey]) pendingDiffUpsertsRef.current[entry.sliceKey] = {};
            for (const [k, v] of Object.entries(entry.snapshotMap)) {
              if (!(k in pendingDiffUpsertsRef.current[entry.sliceKey])) {
                pendingDiffUpsertsRef.current[entry.sliceKey][k] = v;
              }
            }
          }
        });
      }

      if (anyFailed) {
        setCloudSyncStatus('local_ready');
        if (showSuccessToast) {
          showToast('تعذر حفظ بعض التعديلات في السيرفر — هتتعاد المحاولة تلقائياً مع الاتصال.', 'error');
        }
        return false;
      }

      setCloudSyncStatus('cloud_synced');
      if (showSuccessToast) {
        showToast('تم حفظ وتثبيت كافة التعديلات في قاعدة البيانات بنجاح ✓', 'success');
      }
      return true;
    } catch (err) {
      setCloudSyncStatus('local_ready');
      return false;
    } finally {
      isSavingRef.current = false;
      if (pendingReflushRef.current) {
        pendingReflushRef.current = false;
        setTimeout(() => { flushPendingDiffsToSupabase(false); }, 150);
      }
    }
  };
const pushToSupabaseCloud = async (customBundle = null, showSuccessToast = false) => {
    const { isValid } = getSupabaseConfig();
    if (!isValid) {
      if (showSuccessToast) showToast('تم حفظ جميع التعديلات محلياً في المتصفح بنجاح!', 'success');
      return false;
    }

    lastLocalMutationAtRef.current = Date.now();
    await flushPendingDiffsToSupabase(false);

    setCloudSyncStatus('syncing');
    try {
      const b = customBundle || {
        siteSettings,
        adminCredentials,
        currencies,
        groups,
        brands,
        autoTemplates,
        models,
        parts,
        clients,
        accountRequests,
        orders,
        returnsList,
        complaints,
        promoCodes,
        storeAds,
        showcaseBars,
        sourcingRequests,
        notifications
      };

      // Anti-Egress Smart Delta Save: Only upload modified rows + lightweight UI config unless customBundle.forceFullCatalog is explicitly requested!
      const isFullCatalogSync = Boolean(customBundle && customBundle.forceFullCatalog);
      const tasks = [
        sbUpsert('store_ads', (b.storeAds || storeAds).map((ad, idx) => ({ ...ad, sortOrder: idx }))),
        sbUpsert('showcase_bars', (b.showcaseBars || showcaseBars).map((bar, idx) => ({ ...bar, sortOrder: idx }))),
        sbUpsert('pricing_groups', b.groups || groups),
        sbUpsert('promo_codes', b.promoCodes || promoCodes),
        sbUpsert('brands', (b.brands || brands).map((br, idx) => (typeof br === 'string' ? { name: br, sort_order: idx, image_url: brandImages[br] || '' } : { ...br, image_url: br.image_url || brandImages[br.name] || '' }))),
        sbUpsert('site_settings', [{
          id: 'main',
          settings: b.siteSettings || siteSettings,
          currencies: b.currencies || currencies,
          notifications: (b.notifications || notifications || []).slice(0, 50),
          updated_at: new Date().toISOString()
        }])
      ];
      if (isFullCatalogSync) {
        tasks.push(
          sbUpsert('mobile_models', b.models || models),
          sbUpsert('spare_parts', b.parts || parts),
          sbUpsert('clients', b.clients || clients),
          sbUpsert('orders', b.orders || orders),
          sbUpsert('returns_list', b.returnsList || returnsList),
          sbUpsert('complaints', b.complaints || complaints),
          sbUpsert('account_requests', b.accountRequests || accountRequests),
          sbUpsert('auto_templates', b.autoTemplates || autoTemplates),
          sbUpsert('sourcing_requests', b.sourcingRequests || sourcingRequests)
        );
      }

      const syncResults = await Promise.all(tasks);
      if (syncResults.some(r => r === false)) {
        setCloudSyncStatus('local_ready');
        showToast('بعض البيانات لم تُحفظ في السيرفر — راجع الاتصال وحاول الحفظ مرة أخرى.', 'error');
        return false;
      }
      setCloudSyncStatus('cloud_synced');
      if (showSuccessToast) {
        showToast('تم تأكيد وحفظ كافة الجداول والتعديلات في السيرفر السحابي بنجاح ✓', 'success');
      }
      return true;
    } catch (err) {
      setCloudSyncStatus('local_ready');
      if (showSuccessToast) {
        showToast('تعذر الحفظ الكامل في السيرفر، يرجى التأكد من تشغيل ملف SQL المحدث.', 'error');
      }
      return false;
    }
  };
const commitCustomerCloudTransaction = async (mutatorFn) => {
    try {
      await flushPendingDiffsToSupabase(false);
    } catch (e) {}
  };
const visitSbHeaders = (sbKey, extra = {}) => ({ apikey: sbKey, Authorization: `Bearer ${sbKey}`, ...extra });
const loadVisitStats = async () => {
    const { sbUrl, sbKey, isValid } = getSupabaseConfig();
    setVisitInfo(v => ({ ...v, loading: true, error: '' }));
    let local = null;
    try { local = JSON.parse(localStorage.getItem('hm_visit_stats_local') || 'null'); } catch (e) {}
    if (!isValid) {
      setVisitStats(local || { days: {}, sources: {} });
      setVisitInfo({ loading: false, error: '', cloud: false });
      return;
    }
    try {
      let rows = null;
      const rr = await fetch(`${sbUrl}/rest/v1/rpc/get_visit_stats`, { method: 'POST', headers: visitSbHeaders(sbKey, { 'Content-Type': 'application/json' }), body: '{}' });
      if (rr.ok) { rows = [{ payload: await rr.json() }]; }
      else {
        const r = await fetch(`${sbUrl}/rest/v1/app_state_sync?id=eq.visit_stats&select=payload`, { headers: visitSbHeaders(sbKey, { 'Cache-Control': 'no-cache' }) });
        if (!r.ok) throw new Error('http ' + r.status);
        rows = await r.json();
      }
      const payload = Array.isArray(rows) && rows[0] && rows[0].payload && typeof rows[0].payload === 'object' ? rows[0].payload : { days: {}, sources: {} };
      setVisitStats(payload);
      setVisitInfo({ loading: false, error: '', cloud: true });
    } catch (e) {
      setVisitStats(local || { days: {}, sources: {} });
      setVisitInfo({ loading: false, error: 'مقدرتش أقرا إحصائيات الزوار من السيرفر.', cloud: false });
    }
  };
useEffect(() => {
    if (adminAuthenticated) {
      try { localStorage.setItem('hm_is_admin_device', '1'); } catch (e) {}
    }
  }, [adminAuthenticated]);
useEffect(() => {
    if (appPortal === 'admin' && adminAuthenticated) {
      loadVisitStats();
    }
    return undefined;
  }, [appPortal, adminAuthenticated]);
useEffect(() => {
    try {
      if (appPortal === 'admin' || adminAuthenticated) return;
      if ((window.location.hash || '').toLowerCase().includes('alaadb')) return;
      if (localStorage.getItem('hm_is_admin_device') === '1') return;
      const vDayKey = 'hm_visit_synced_' + localDayKey(0);
      if (sessionStorage.getItem('hm_sess') || localStorage.getItem(vDayKey)) return;
      sessionStorage.setItem('hm_sess', '1');
      localStorage.setItem(vDayKey, '1');
    } catch (e) {
      return;
    }
    const today = localDayKey(0);
    let firstToday = true;
    let isNewDevice = true;
    try {
      isNewDevice = !localStorage.getItem('hm_dev_id');
      if (isNewDevice) localStorage.setItem('hm_dev_id', `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      firstToday = localStorage.getItem('hm_dev_day') !== today;
      localStorage.setItem('hm_dev_day', today);
    } catch (e) {}
    const info = { today, firstToday, isNewDevice, source: detectVisitSource() };
    try {
      const cur = JSON.parse(localStorage.getItem('hm_visit_stats_local') || 'null');
      localStorage.setItem('hm_visit_stats_local', JSON.stringify(applyVisit(cur, info)));
    } catch (e) {}
    (async () => {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (!isValid) return;
      try {
        // Atomic server-side increment (no JSON read-modify-write). Falls back to legacy only if the RPC is not installed (404).
        const rr = await fetch(`${sbUrl}/rest/v1/rpc/track_visit`, { method: 'POST', headers: visitSbHeaders(sbKey, { 'Content-Type': 'application/json' }), body: JSON.stringify({ p_day: info.today, p_source: info.source, p_first_today: !!info.firstToday, p_new_device: !!info.isNewDevice }) });
        if (rr.status !== 404) return;
        const r = await fetch(`${sbUrl}/rest/v1/app_state_sync?id=eq.visit_stats&select=payload`, { headers: visitSbHeaders(sbKey, { 'Cache-Control': 'no-cache' }) });
        const rows = r.ok ? await r.json() : [];
        const cur = Array.isArray(rows) && rows[0] && rows[0].payload ? rows[0].payload : { days: {}, sources: {} };
        await fetch(`${sbUrl}/rest/v1/app_state_sync`, {
          method: 'POST',
          headers: visitSbHeaders(sbKey, { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }),
          body: JSON.stringify({ id: 'visit_stats', payload: applyVisit(cur, info), updated_at: new Date().toISOString() })
        });
      } catch (e) {}
    })();
  }, []);
const APPEND_ONLY_SLICES = new Set(['returnsList', 'complaints', 'orders', 'accountRequests', 'sourcingRequests']);
useEffect(() => {
    const currentSlices = {
      parts,
      models,
      brands,
      groups,
      storeAds,
      showcaseBars,
      promoCodes,
      clients,
      accountRequests,
      orders,
      returnsList,
      complaints,
      autoTemplates,
      sourcingRequests
    };

    // 1. Non-blocking localStorage persistence (skips serializing >2,000 parts on every keystroke so 5,000+ products stay 60FPS!)
    try {
      Object.entries(currentSlices).forEach(([k, v]) => {
        if (prevSlicesRef.current && prevSlicesRef.current[k] === v) return;
        if (k === 'parts' && Array.isArray(v) && v.length > 2000) {
          // Warm-cache the 2,000 most recently updated parts instead of skipping persistence entirely
          const trimmedParts = [...v]
            .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))
            .slice(0, 2000);
          window.localStorage.setItem('elzoghbi_v2_' + k, JSON.stringify(trimmedParts));
          return;
        }
        window.localStorage.setItem('elzoghbi_v2_' + k, JSON.stringify(v));
      });
      window.localStorage.setItem('elzoghbi_v2_siteSettings', JSON.stringify(siteSettings));
      if (adminAuthenticated && (adminCredentials.username || '').trim()) {
        window.localStorage.setItem('elzoghbi_v2_adminCredentials', JSON.stringify(adminCredentials));
      }
      window.localStorage.setItem('elzoghbi_v2_currencies', JSON.stringify(currencies));
      window.localStorage.setItem('elzoghbi_v2_notifications', JSON.stringify(notifications));
      window.localStorage.setItem('elzoghbi_v2_brandImages', JSON.stringify(brandImages));
    } catch (e) {}

    // Initialize baseline snapshot on first mount without triggering network writes
    if (!prevSlicesRef.current) {
      prevSlicesRef.current = {
        ...currentSlices,
        siteSettings,
        adminCredentials,
        currencies,
        notifications
      };
      return;
    }

    // If initial server pull hasn't completed yet, or this render was triggered by incoming server pull / cross-tab event, update baseline and skip diffing!
    if (!hasCloudInitialPullCompletedRef.current || isIncomingSyncRef.current || Date.now() < incomingSyncUntilRef.current) {
      isIncomingSyncRef.current = false;
      prevSlicesRef.current = {
        ...currentSlices,
        siteSettings,
        adminCredentials,
        currencies,
        notifications
      };
      return;
    }

    // 2. Compute exact row-level diffs (Added, Modified, Deleted) across all slices
    let hasAnyMutation = false;
    const prev = prevSlicesRef.current;

    for (const [sliceKey, currArr] of Object.entries(currentSlices)) {
      const prevArr = prev[sliceKey];
      if (prevArr === currArr) continue;
      if (!Array.isArray(currArr) || !Array.isArray(prevArr)) continue;

      if (sliceKey === 'brands') {
        const prevSet = new Set(prevArr);
        const currSet = new Set(currArr);
        currArr.forEach(b => {
          if (!prevSet.has(b)) {
            markLocalUpsert('brands', b);
            hasAnyMutation = true;
          }
        });
        prevArr.forEach(b => {
          if (!currSet.has(b)) {
            markLocalDelete('brands', b);
            hasAnyMutation = true;
          }
        });
        continue;
      }

      const prevMap = new Map();
      prevArr.forEach((item, idx) => {
        const id = String(item?.id || item?.code || item?.name || '');
        if (id) prevMap.set(id, { item, idx });
      });

      const currIds = new Set();
      currArr.forEach((item, idx) => {
        const id = String(item?.id || item?.code || item?.name || '');
        if (!id) return;
        currIds.add(id);
        const prevEntry = prevMap.get(id);
        const itemWithOrder = (sliceKey === 'storeAds' || sliceKey === 'showcaseBars')
          ? { ...item, sortOrder: idx }
          : item;
        const orderChanged = (sliceKey === 'storeAds' || sliceKey === 'showcaseBars') && prevEntry && prevEntry.idx !== idx;
        if (prevEntry && prevEntry.item === item && !orderChanged) return;
        if (!prevEntry || orderChanged || JSON.stringify(prevEntry.item) !== JSON.stringify(item)) {
          markLocalUpsert(sliceKey, itemWithOrder);
          hasAnyMutation = true;
        }
      });

      prevMap.forEach((_, id) => {
        if (!currIds.has(id)) {
          if (APPEND_ONLY_SLICES.has(sliceKey)) return;
          markLocalDelete(sliceKey, id);
          hasAnyMutation = true;
        }
      });
    }

    // Check settings / credentials / currencies / notifications diff
    if (
      prev.siteSettings !== siteSettings ||
      prev.adminCredentials !== adminCredentials ||
      prev.currencies !== currencies ||
      prev.notifications !== notifications
    ) {
      if (
        JSON.stringify(prev.siteSettings) !== JSON.stringify(siteSettings) ||
        JSON.stringify(prev.adminCredentials) !== JSON.stringify(adminCredentials) ||
        JSON.stringify(prev.currencies) !== JSON.stringify(currencies) ||
        JSON.stringify(prev.notifications) !== JSON.stringify(notifications)
      ) {
        if (!pendingDiffUpsertsRef.current.site_settings) pendingDiffUpsertsRef.current.site_settings = {};
        pendingDiffUpsertsRef.current.site_settings.main = {
          id: 'main',
          settings: siteSettings,
          currencies: currencies,
          notifications: notifications,
          updated_at: new Date().toISOString()
        };
        try {
          sessionStorage.setItem('hm_local_settings_v8', JSON.stringify({
            settings: siteSettings,
            credentials: adminCredentials,
            currencies: currencies,
            ts: Date.now()
          }));
        } catch (e) {}
        hasAnyMutation = true;
      }
    }

    prevSlicesRef.current = {
      ...currentSlices,
      siteSettings,
      adminCredentials,
      currencies,
      notifications
    };

    if (hasAnyMutation) {
      const nowTs = Date.now();
      lastLocalMutationAtRef.current = nowTs;

      // Broadcast only when an actual user mutation occurred
      try {
        window.localStorage.setItem(
          'elzoghbi_v2_master_bundle',
          JSON.stringify({
            ...currentSlices,
            siteSettings,
            adminCredentials,
            currencies,
            notifications,
            senderTabId: myTabId,
            senderRole: (appPortal === 'admin' && adminAuthenticated) ? 'admin' : 'client',
            updatedAt: nowTs
          })
        );
      } catch (e) {}

      if (diffFlushTimerRef.current) clearTimeout(diffFlushTimerRef.current);
      diffFlushTimerRef.current = setTimeout(() => {
        diffFlushTimerRef.current = null;
        flushPendingDiffsToSupabase(false);
      }, 350);
    }
  }, [
    siteSettings,
    adminCredentials,
    currencies,
    groups,
    brands,
    autoTemplates,
    models,
    parts,
    clients,
    accountRequests,
    orders,
    returnsList,
    complaints,
    promoCodes,
    storeAds,
    showcaseBars,
    sourcingRequests,
    notifications,
    adminAuthenticated,
    appPortal
  ]);
useEffect(() => {
    try {
      window.localStorage.setItem('elzoghbi_v2_activeClientRole', JSON.stringify(activeRole));
      // Only an admin-authenticated tab persists the admin session. A
      // storefront tab sharing this browser used to overwrite the saved
      // admin login with its own logged-out state on any cart/role
      // change, so refreshing the dashboard signed the admin out.
      // Explicit logout writes 'false' itself (see the logout buttons).
      if (adminAuthenticated) {
        window.localStorage.setItem('elzoghbi_v2_adminAuth', 'true');
        if ((adminCredentials.username || '').trim()) {
          window.localStorage.setItem('elzoghbi_v2_adminCredentials', JSON.stringify(adminCredentials));
        }
      }
      window.localStorage.setItem('elzoghbi_v2_cart_v4', JSON.stringify(cart));
    } catch (e) {}
  }, [activeRole, adminAuthenticated, adminCredentials, cart]);
useEffect(() => {
    const handleStorageEvent = (e) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === 'elzoghbi_v2_master_bundle') {
          const data = JSON.parse(e.newValue);
          if (data.senderTabId === myTabId) return;

          incomingSyncUntilRef.current = Date.now() + 250;
          isIncomingSyncRef.current = true;

          if (Array.isArray(data.clients)) {
            data.clients.forEach(c => {
              if (c && c.id && localModifiedMapRef.current?.clients?.[c.id]) {
                localModifiedMapRef.current.clients[c.id] = { item: c, ts: Date.now() };
              }
            });
            setClients(data.clients);
          }
          if (Array.isArray(data.accountRequests)) setAccountRequests(data.accountRequests);
          if (Array.isArray(data.orders)) {
            const statusRank = { 'تم الاستلام': 1, 'جاري التجهيز': 2, 'جاهز للتسليم': 3, 'في الطريق (دليفري)': 4, 'تم التسليم': 5, 'ملغي': 6 };
            setOrders(prevOrders => {
              const prevMap = new Map((Array.isArray(prevOrders) ? prevOrders : []).map(o => [String(o.id), o]));
              const merged = data.orders.map(inc => {
                const loc = prevMap.get(String(inc.id));
                if (!loc) return inc;
                const incTs = Number(inc.statusUpdatedAt || 0);
                const locTs = Number(loc.statusUpdatedAt || 0);
                const incRank = statusRank[inc.status] || 0;
                const locRank = statusRank[loc.status] || 0;
                const winner = (incTs >= locTs || incRank >= locRank || inc.cashbackAwarded) ? { ...loc, ...inc } : { ...inc, ...loc };
                if (localModifiedMapRef.current?.orders?.[winner.id]) {
                  localModifiedMapRef.current.orders[winner.id] = { item: winner, ts: Date.now() };
                }
                return winner;
              });
              try { persistMutationMaps(); } catch (e) {}
              return merged;
            });
          }
          if (Array.isArray(data.returnsList)) setReturnsList(data.returnsList);
          if (Array.isArray(data.complaints)) setComplaints(data.complaints);
          if (Array.isArray(data.notifications)) setNotifications(data.notifications);
          if (Array.isArray(data.parts)) setParts(data.parts);
          if (Array.isArray(data.sourcingRequests)) setSourcingRequests(data.sourcingRequests);

          if (data.senderRole === 'admin') {
            if (data.siteSettings) setSiteSettings(data.siteSettings);
            if (data.adminCredentials) setAdminCredentials(data.adminCredentials);
            if (data.currencies) setCurrencies(data.currencies);
            if (Array.isArray(data.groups)) setGroups(data.groups);
            if (Array.isArray(data.brands)) setBrands(data.brands);
            if (Array.isArray(data.autoTemplates)) setAutoTemplates(data.autoTemplates);
            if (Array.isArray(data.models)) setModels(data.models);
            if (Array.isArray(data.promoCodes)) setPromoCodes(data.promoCodes);
            if (Array.isArray(data.storeAds)) setStoreAds(data.storeAds);
            if (Array.isArray(data.showcaseBars)) setShowcaseBars(data.showcaseBars);
          } else if (data.siteSettings) {
            // Sync customer-side additions (restockWaitlist, analytics counters) immediately to Admin tab!
            setSiteSettings(prev => {
              const incWaitlist = Array.isArray(data.siteSettings.restockWaitlist) ? data.siteSettings.restockWaitlist : [];
              const curWaitlist = Array.isArray(prev.restockWaitlist) ? prev.restockWaitlist : [];
              const seenW = new Set();
              const mergedWaitlist = [];
              [...incWaitlist, ...curWaitlist].forEach(w => {
                if (!w || !w.id || seenW.has(w.id)) return;
                seenW.add(w.id);
                mergedWaitlist.push(w);
              });
              const nextS = {
                ...prev,
                restockWaitlist: mergedWaitlist,
                analyticsRecoveredCartsCount: Math.max(Number(prev.analyticsRecoveredCartsCount) || 0, Number(data.siteSettings.analyticsRecoveredCartsCount) || 0),
                analyticsRecoveredCartsValue: Math.max(Number(prev.analyticsRecoveredCartsValue) || 0, Number(data.siteSettings.analyticsRecoveredCartsValue) || 0),
                analyticsCouponsUsedCount: Math.max(Number(prev.analyticsCouponsUsedCount) || 0, Number(data.siteSettings.analyticsCouponsUsedCount) || 0)
              };
              try { window.localStorage.setItem('elzoghbi_v2_siteSettings', JSON.stringify(nextS)); } catch (e) {}
              return nextS;
            });
          }
        }
      } catch (err) {}
    };
    const handleDirectSettingsStorage = (e) => {
      if (!e.key || !e.newValue) return;
      if (e.key === 'elzoghbi_v2_siteSettings' || e.key === 'elzoghbi_live_flags_ping') {
        try {
          const parsed = JSON.parse(e.newValue);
          const nextSettingsObj = e.key === 'elzoghbi_live_flags_ping' ? parsed.settings : parsed;
          if (nextSettingsObj && typeof nextSettingsObj === 'object') {
            incomingSyncUntilRef.current = Date.now() + 250;
            isIncomingSyncRef.current = true;
            try { sessionStorage.removeItem('hm_local_settings_v8'); } catch (err) {}
            if (homeElRef && homeElRef.current) homeElRef.current = null;
            if (searchElRef && searchElRef.current) searchElRef.current = null;
            if (prevSlicesRef.current) prevSlicesRef.current.siteSettings = nextSettingsObj;
            setSiteSettings(nextSettingsObj);
            if (nextSettingsObj.enableQualityTiers === false) {
              setSelectedQualityTiers({});
            }
          }
        } catch (err) {}
      }
    };

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('elzoghbi_live_flags_channel');
        bc.onmessage = (ev) => {
          const msg = ev.data;
          if (msg && msg.type === 'SITE_SETTINGS_UPDATED' && msg.settings && msg.senderTabId !== myTabId) {
            incomingSyncUntilRef.current = Date.now() + 250;
            isIncomingSyncRef.current = true;
            try {
              sessionStorage.removeItem('hm_local_settings_v8');
              window.localStorage.setItem('elzoghbi_v2_siteSettings', JSON.stringify(msg.settings));
            } catch (err) {}
            if (homeElRef && homeElRef.current) homeElRef.current = null;
            if (searchElRef && searchElRef.current) searchElRef.current = null;
            if (prevSlicesRef.current) prevSlicesRef.current.siteSettings = msg.settings;
            setSiteSettings(msg.settings);
            if (msg.settings.enableQualityTiers === false) {
              setSelectedQualityTiers({});
            }
          }
        };
      }
    } catch (err) {}

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('storage', handleDirectSettingsStorage);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('storage', handleDirectSettingsStorage);
      if (bc) {
        try { bc.close(); } catch (err) {}
      }
    };
  }, [myTabId]);
const lastKnownTableTimestampsRef = useRef({});
const hasRestoredLegacyFallbackRef = useRef(false);
const pullFromSupabaseCloud = async (silent = false) => {
    const { sbUrl, sbKey, isValid } = getSupabaseConfig();
    if (!isValid) {
      setIsInitialCloudBooting(false);
      hasCloudInitialPullCompletedRef.current = true;
      return;
    }

    const isInitialBoot = !hasCloudInitialPullCompletedRef.current;

    // Never overwrite while a genuine user local save is in-flight (unless this is the very first boot pull!)
    if (!isInitialBoot && silent && (isSavingRef.current || diffFlushTimerRef.current !== null || (Date.now() - lastLocalMutationAtRef.current < 5000))) {
      return;
    }

    try {
      const isAdmin = appPortal === 'admin' || adminAuthenticated;
      if (!isInitialBoot && silent && hasInitialBootPullRanRef.current && (!isAdmin || hasAdminTablesPulledRef.current)) {
        return;
      }
      hasInitialBootPullRanRef.current = true;
      if (isAdmin) hasAdminTablesPulledRef.current = true;

      setCloudSyncStatus('syncing');
      const forceRefresh = !silent; // Respect 6h localStorage cache on normal boot/F5; force only on explicit manual sync

      // Helper to apply incoming state safely without triggering false local mutation diffs
      const markIncomingWindow = () => {
        incomingSyncUntilRef.current = Date.now() + 250;
        isIncomingSyncRef.current = true;
      };

      // =========================================================================
      // PHASE A (ULTRA-FAST ~150ms): Launch Settings, Ads, Showcase Bars, Brands, Groups & Promos
      // They apply to the screen IMMEDIATELY as soon as they resolve — NEVER blocked by spare_parts!
      // =========================================================================
      const fastUiPromise = Promise.all([
        sbFetchTable('site_settings', null, '&limit=5', forceRefresh),
        sbFetchTable('store_ads', null, '&order=sort_order.asc&limit=30', forceRefresh),
        sbFetchTable('showcase_bars', null, '&order=sort_order.asc&limit=30', forceRefresh),
        sbFetchTable('brands', null, '&order=sort_order.asc&limit=200', forceRefresh),
        sbFetchTable('pricing_groups', null, '&limit=50', forceRefresh),
        sbFetchTable('promo_codes', null, '&limit=100', forceRefresh)
      ]).then(([settingsRows, adsRows, barsRows, brandsRows, groupsRows, promosRows]) => {
        markIncomingWindow();

        // 1. Apply site_settings immediately
        const latestLocalSettings = (() => {
          try {
            const raw = window.localStorage.getItem('elzoghbi_v2_siteSettings');
            if (raw) return JSON.parse(raw);
          } catch (e) {}
          return null;
        })();
        const cfgRow = (Array.isArray(settingsRows) && settingsRows.length > 0)
          ? (settingsRows.find(r => r.id === 'main') || settingsRows[0])
          : null;
        if (cfgRow) {
          const srvSettings = cfgRow.settings || {};
          const localTs = Number(latestLocalSettings?._updatedAt || 0);
          const srvTs = Number(srvSettings?._updatedAt || (cfgRow.updated_at ? Date.parse(cfgRow.updated_at) : 0) || 0);
          const winningSettings = (latestLocalSettings && localTs > srvTs)
            ? { ...srvSettings, ...latestLocalSettings }
            : { ...(latestLocalSettings || {}), ...srvSettings };
          if (winningSettings && typeof winningSettings === 'object' && Object.keys(winningSettings).length > 0) {
            const mergedSettings = {
              ...siteSettings,
              ...winningSettings,
              supabaseUrl: winningSettings.supabaseUrl || sbUrl,
              supabaseAnonKey: winningSettings.supabaseAnonKey || sbKey
            };
            if (prevSlicesRef.current) prevSlicesRef.current.siteSettings = mergedSettings;
            setSiteSettings(mergedSettings);
            try { window.localStorage.setItem('elzoghbi_v2_siteSettings', JSON.stringify(mergedSettings)); } catch (e) {}
          }
          if (cfgRow.credentials && typeof cfgRow.credentials === 'object' && cfgRow.credentials.username) {
            if (prevSlicesRef.current) prevSlicesRef.current.adminCredentials = cfgRow.credentials;
            setAdminCredentials(cfgRow.credentials);
            try { window.localStorage.setItem('elzoghbi_v2_adminCredentials', JSON.stringify(cfgRow.credentials)); } catch (e) {}
          }
          if (cfgRow.currencies && typeof cfgRow.currencies === 'object' && Object.keys(cfgRow.currencies).length > 0) {
            if (prevSlicesRef.current) prevSlicesRef.current.currencies = cfgRow.currencies;
            setCurrencies(cfgRow.currencies);
            try { window.localStorage.setItem('elzoghbi_v2_currencies', JSON.stringify(cfgRow.currencies)); } catch (e) {}
          }
          if (Array.isArray(cfgRow.notifications) && cfgRow.notifications.length > 0) {
            setNotifications(prev => {
              const seen = new Set();
              const combined = [];
              [...cfgRow.notifications, ...(Array.isArray(prev) ? prev : [])].forEach(n => {
                if (n && n.id && !seen.has(n.id)) {
                  seen.add(n.id);
                  combined.push(n);
                }
              });
              const sliced = combined.slice(0, 120);
              if (prevSlicesRef.current) prevSlicesRef.current.notifications = sliced;
              try { window.localStorage.setItem('elzoghbi_v2_notifications', JSON.stringify(sliced)); } catch (e) {}
              return sliced;
            });
          }
        }

        // 2. Apply store_ads immediately (replaces INITIAL_STORE_ADS right away!)
        if (Array.isArray(adsRows) && adsRows.length > 0) {
          setStoreAds(() => {
            const cleanAds = adsRows.slice().sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
            if (prevSlicesRef.current) prevSlicesRef.current.storeAds = cleanAds;
            try { window.localStorage.setItem('elzoghbi_v2_storeAds', JSON.stringify(cleanAds)); } catch (e) {}
            return cleanAds;
          });
        }

        // 3. Apply showcase_bars immediately (replaces INITIAL_SHOWCASE_BARS right away!)
        if (Array.isArray(barsRows) && barsRows.length > 0) {
          setShowcaseBars(() => {
            const cleanBars = barsRows.slice().sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
            if (prevSlicesRef.current) prevSlicesRef.current.showcaseBars = cleanBars;
            try { window.localStorage.setItem('elzoghbi_v2_showcaseBars', JSON.stringify(cleanBars)); } catch (e) {}
            return cleanBars;
          });
        }

        // 4. Apply brands & brand images immediately
        if (Array.isArray(brandsRows) && brandsRows.length > 0) {
          const fetchedBrandImgs = {};
          brandsRows.forEach(b => {
            if (b && typeof b === 'object' && b.name && (b.image_url || b.imageUrl || b.image)) {
              fetchedBrandImgs[String(b.name).trim()] = b.image_url || b.imageUrl || b.image;
            }
          });
          setBrandImages(prev => {
            const next = { ...OR_BRAND_IMAGES, ...prev, ...fetchedBrandImgs };
            try { window.localStorage.setItem('elzoghbi_v2_brandImages', JSON.stringify(next)); } catch (e) {}
            return next;
          });
          const explicitBrands = brandsRows
            .map(b => String(typeof b === 'object' && b !== null ? (b.name || b.id || '') : b).trim())
            .filter(Boolean);
          if (explicitBrands.length > 0) {
            setBrands(() => {
              const mergedB = mergeOrBrandsList(explicitBrands, deletedIdsMapRef.current.brands || {}, isOrCatalogDisabledInStorage());
              if (prevSlicesRef.current) prevSlicesRef.current.brands = mergedB;
              try { window.localStorage.setItem('elzoghbi_v2_brands', JSON.stringify(mergedB)); } catch (e) {}
              return mergedB;
            });
          }
        }

        // 5. Apply pricing_groups & promo_codes immediately
        if (Array.isArray(groupsRows) && groupsRows.length > 0) {
          setGroups(prev => {
            const merged = mergeServerWithLocal('groups', prev, groupsRows);
            if (prevSlicesRef.current) prevSlicesRef.current.groups = merged;
            try { window.localStorage.setItem('elzoghbi_v2_groups', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
        if (Array.isArray(promosRows) && promosRows.length > 0) {
          setPromoCodes(prev => {
            const merged = mergeServerWithLocal('promoCodes', prev, promosRows);
            if (prevSlicesRef.current) prevSlicesRef.current.promoCodes = merged;
            try { window.localStorage.setItem('elzoghbi_v2_promoCodes', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      }).catch(() => {});

      // =========================================================================
      // PHASE B (FAST CATALOG ~250ms): Fetch Models + First 100 Custom/Latest Products
      // Renders the storefront products immediately without waiting for thousands of rows!
      // =========================================================================
      const normalizeAndLinkParts = (partsInput, modelsInput) => {
        const rawModels = Array.isArray(modelsInput) ? [...modelsInput] : [];
        const modelIdsSet = new Set(rawModels.map(m => String(m?.id || '')));
        const linkedParts = (Array.isArray(partsInput) ? partsInput : []).map(p => {
          const fixedPart = { ...p };
          if (!fixedPart.basePrice || Number(fixedPart.basePrice) <= 0) {
            fixedPart.basePrice = Number(fixedPart.costPrice) > 0 ? Math.round(Number(fixedPart.costPrice) * 1.25) : 450;
          }
          if (fixedPart.stock === undefined || fixedPart.stock === null) {
            fixedPart.stock = 15;
          }
          const currMdlId = String(fixedPart.modelId || '').trim();
          if (!currMdlId || !modelIdsSet.has(currMdlId)) {
            const pName = String(fixedPart.name || '').toLowerCase();
            const pCompat = Array.isArray(fixedPart.compatibleModels) ? fixedPart.compatibleModels.join(' ').toLowerCase() : '';
            const pHaystack = `${currMdlId.toLowerCase()} ${pName} ${pCompat} ${String(fixedPart.sku || '').toLowerCase()}`;
            const matchedMdl = rawModels.find(m => {
              const mn = String(m?.name || '').trim().toLowerCase();
              return mn.length >= 2 && (pHaystack.includes(mn) || currMdlId.toLowerCase() === mn);
            });
            if (matchedMdl) {
              fixedPart.modelId = matchedMdl.id;
            }
          }
          return fixedPart;
        });
        return { linkedParts, rawModels };
      };

      const [modelsRows, fastCustomParts, fastLatestParts] = await Promise.all([
        sbFetchTable('mobile_models', null, '&order=id.asc&limit=500', forceRefresh),
        sbFetchTable('spare_parts', null, '&order=created_at.desc&limit=60', forceRefresh),
        Promise.resolve([]),
        fastUiPromise
      ]);

      const fastMap = new Map();
      [fastCustomParts, fastLatestParts].forEach(arr => {
        if (Array.isArray(arr)) {
          arr.forEach(r => {
            if (r && r.id !== undefined) {
              const k = String(r.id).trim();
              if (!fastMap.has(k)) fastMap.set(k, r);
            }
          });
        }
      });

      const fastPartsList = Array.from(fastMap.values());
      const { linkedParts: initialLinkedParts, rawModels: initialModels } = normalizeAndLinkParts(fastPartsList, modelsRows);

      markIncomingWindow();
      if (initialModels.length > 0) {
        setModels(() => {
          const mergedM = mergeOrModelsList(initialModels, deletedIdsMapRef.current.models || {}, isOrCatalogDisabledInStorage());
          if (prevSlicesRef.current) prevSlicesRef.current.models = mergedM;
          try { window.localStorage.setItem('elzoghbi_v2_models', JSON.stringify(mergedM)); } catch (e) {}
          return mergedM;
        });
      }
      if (initialLinkedParts.length > 0) {
        setParts(prev => {
          const mergedRaw = mergeServerWithLocal('parts', prev, initialLinkedParts);
          const merged = mergeOrPartsList(mergedRaw, deletedIdsMapRef.current.parts || {}, isOrCatalogDisabledInStorage());
          if (prevSlicesRef.current) prevSlicesRef.current.parts = merged;
          try { window.localStorage.setItem('elzoghbi_v2_parts', JSON.stringify(merged)); } catch (e) {}
          return merged;
        });
      }

      // Immediately unlock the UI so the user sees the real ads & products in ~0.3s!
      setIsInitialCloudBooting(false);
      setCloudSyncStatus('cloud_synced');
      hasCloudInitialPullCompletedRef.current = true;

      // =========================================================================
      // PHASE C (NON-BLOCKING BACKGROUND HYDRATION): Fetch remaining catalog items & Admin tables
      // Runs quietly in the background without blocking the user or delaying ads/products!
      // =========================================================================
      setTimeout(async () => {
        try {
          // Single paginated catalog hydration (Cached in localStorage for 35m -> Zero redundant multi-query Egress!)
          // Egress fix (2026-11-22): the extra catalog waves were made admin-only.
          // BUT (2026-11-26): Phase B loads only the newest 60 rows, and when those are
          // dominated by a hidden model/brand/category a fresh visitor sees almost no
          // products (reproduced live: newest 60 -> 57 hidden-model rows -> 3 visible).
          // So customers now also hydrate the newest 500 rows in the background
          // (offset 60, limit 440, light columns, session-cached). The asc wave and
          // the full 650 desc wave stay admin-only; deeper catalog still loads
          // on demand via fetchSparePartsSliceOnDemand.
          const [moreCustomDate, moreAsc] = await Promise.all([
            isAdmin ? sbFetchTable('spare_parts', null, '&order=created_at.desc&limit=650&offset=60', false) : sbFetchTable('spare_parts', null, '&order=created_at.desc&limit=440&offset=60', false),
            isAdmin ? sbFetchTable('spare_parts', null, '&order=created_at.asc&limit=650', false) : Promise.resolve([])
          ]);
          const moreCustomSku = [];
          const bgMap = new Map(initialLinkedParts.map(p => [String(p.id).trim(), p]));
          [moreCustomDate, moreCustomSku, moreAsc].forEach(arr => {
            if (Array.isArray(arr)) {
              arr.forEach(r => {
                if (r && r.id !== undefined) {
                  const k = String(r.id).trim();
                  if (!bgMap.has(k)) bgMap.set(k, r);
                }
              });
            }
          });
          // Products deleted from the dashboard (maybe on another device) must not survive in this device's cache.
          // Ask the server which cached ids still exist (read-only, tiny id-only query) and drop the ones that are gone.
          try {
            const cachedRaw = JSON.parse(window.localStorage.getItem('elzoghbi_v2_parts') || '[]');
            const modMap = localModifiedMapRef.current.parts || {};
            const cand = (Array.isArray(cachedRaw) ? cachedRaw : [])
              .map(x => String(x && x.id || '').trim())
              .filter(id => id && !bgMap.has(id) && !modMap[id])
              .slice(0, 600);
            if (cand.length > 0) {
              const alive = new Set();
              let allOk = true;
              for (let i = 0; i < cand.length; i += 50) {
                const chunk = cand.slice(i, i + 50);
                const inList = chunk.map(id => '"' + id.replace(/"/g, '') + '"').join(',');
                const rr = await fetch(`${sbUrl}/rest/v1/spare_parts?select=id&id=in.(${encodeURIComponent(inList)})`, { headers: sbHeaders(sbKey) });
                if (!rr.ok) { allOk = false; break; }
                (await rr.json()).forEach(r => alive.add(String(r.id).trim()));
              }
              if (allOk) {
                const gone = new Set(cand.filter(id => !alive.has(id)));
                if (gone.size > 0) {
                  markIncomingWindow();
                  setParts(prev => {
                    const next = prev.filter(x => !gone.has(String(x && x.id || '').trim()));
                    if (prevSlicesRef.current) prevSlicesRef.current.parts = next;
                    try { window.localStorage.setItem('elzoghbi_v2_parts', JSON.stringify(next)); } catch (e) {}
                    return next;
                  });
                }
              }
            }
          } catch (e) {}
          if (bgMap.size > initialLinkedParts.length) {
            const { linkedParts: fullLinked } = normalizeAndLinkParts(Array.from(bgMap.values()), initialModels);
            markIncomingWindow();
            setParts(prev => {
              const merged = mergeServerWithLocal('parts', prev, fullLinked);
              if (prevSlicesRef.current) prevSlicesRef.current.parts = merged;
              try { window.localStorage.setItem('elzoghbi_v2_parts', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }
        } catch (e) {}
      }, 250);

      if (isAdmin) {
        const [clientsRows, ordersRows, complaintsRows, returnsRows, reqsRows, sourcingRows, templatesRows] = await Promise.all([
          sbFetchTable('clients', null, '&limit=150', forceRefresh),
          sbFetchTable('orders', null, '&order=created_at.desc&limit=80', forceRefresh),
          sbFetchTable('complaints', null, '&order=created_at.desc&limit=50', forceRefresh),
          sbFetchTable('returns_list', null, '&order=created_at.desc&limit=50', forceRefresh),
          sbFetchTable('account_requests', null, '&order=created_at.desc&limit=50', forceRefresh),
          sbFetchTable('sourcing_requests', null, '&order=created_at.desc&limit=40', forceRefresh),
          sbFetchTable('auto_templates', null, '&limit=50', forceRefresh)
        ]);
        markIncomingWindow();
        if (Array.isArray(templatesRows) && templatesRows.length > 0) {
          setAutoTemplates(prev => {
            const merged = mergeServerWithLocal('autoTemplates', prev, templatesRows);
            if (prevSlicesRef.current) prevSlicesRef.current.autoTemplates = merged;
            try { window.localStorage.setItem('elzoghbi_v2_autoTemplates', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
        if (Array.isArray(clientsRows) && clientsRows.length > 0) {
          setClients(prev => {
            const merged = mergeServerWithLocal('clients', prev, clientsRows);
            if (prevSlicesRef.current) prevSlicesRef.current.clients = merged;
            try { window.localStorage.setItem('elzoghbi_v2_clients', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
        if (Array.isArray(ordersRows) && ordersRows.length > 0) {
          setOrders(prev => {
            const merged = mergeServerWithLocal('orders', prev, ordersRows);
            if (prevSlicesRef.current) prevSlicesRef.current.orders = merged;
            try { window.localStorage.setItem('elzoghbi_v2_orders', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
        if (Array.isArray(complaintsRows) && complaintsRows.length > 0) {
          setComplaints(prev => {
            const merged = mergeServerWithLocal('complaints', prev, complaintsRows);
            if (prevSlicesRef.current) prevSlicesRef.current.complaints = merged;
            try { window.localStorage.setItem('elzoghbi_v2_complaints', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
        if (Array.isArray(returnsRows) && returnsRows.length > 0) {
          setReturnsList(prev => {
            const merged = mergeServerWithLocal('returnsList', prev, returnsRows);
            if (prevSlicesRef.current) prevSlicesRef.current.returnsList = merged;
            try { window.localStorage.setItem('elzoghbi_v2_returnsList', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
        if (Array.isArray(reqsRows) && reqsRows.length > 0) {
          setAccountRequests(prev => {
            const merged = mergeServerWithLocal('accountRequests', prev, reqsRows);
            if (prevSlicesRef.current) prevSlicesRef.current.accountRequests = merged;
            try { window.localStorage.setItem('elzoghbi_v2_accountRequests', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
        if (Array.isArray(sourcingRows) && sourcingRows.length > 0) {
          setSourcingRequests(prev => {
            const merged = mergeServerWithLocal('sourcingRequests', prev, sourcingRows);
            if (prevSlicesRef.current) prevSlicesRef.current.sourcingRequests = merged;
            try { window.localStorage.setItem('elzoghbi_v2_sourcingRequests', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      }

      if (!silent) showToast('تمت مزامنة وتحديث كافة الجداول من السيرفر بنجاح ✓', 'success');
    } catch (err) {
      setIsInitialCloudBooting(false);
      hasCloudInitialPullCompletedRef.current = true;
    }
  };
const [realtimeConnected, setRealtimeConnected] = useState(false);
useEffect(() => {
    // Safety fallback: ensure initial boot loader never blocks for more than 1.8s even on slow/offline networks
    const bootTimer = setTimeout(() => setIsInitialCloudBooting(false), 1800);
    // 1. Single initial load on mount / portal switch
    pullFromSupabaseCloud(true);

    // 2. Establish lightweight Supabase Realtime Phoenix WebSocket for instant Order & SRC- notifications
    const { sbUrl, sbKey, isValid } = getSupabaseConfig();
    if (!isValid) return undefined;

    let ws = null;
    let heartbeatTimer = null;
    let reconnectTimer = null;
    let refCounter = 1;
    let isUnmounted = false;

    const connectRealtime = () => {
      if (isUnmounted) return;
      try {
        const wsBase = sbUrl.replace(/^http/i, 'ws');
        const wsUrl = `${wsBase}/realtime/v1/websocket?apikey=${encodeURIComponent(sbKey)}&vsn=1.0.0`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isUnmounted) return;
          setRealtimeConnected(true);
          const joinPayload = {
            topic: 'realtime:public',
            event: 'phx_join',
            payload: {
              config: {
                broadcast: { self: false },
                presence: { key: '' },
                postgres_changes: [
                  { event: '*', schema: 'public', table: 'orders' },
                  { event: '*', schema: 'public', table: 'sourcing_requests' },
                  { event: '*', schema: 'public', table: 'account_requests' },
                  { event: '*', schema: 'public', table: 'returns_list' },
                  { event: '*', schema: 'public', table: 'complaints' },
                  { event: '*', schema: 'public', table: 'spare_parts' },
                  { event: '*', schema: 'public', table: 'mobile_models' },
                  { event: '*', schema: 'public', table: 'store_ads' }
                ]
              }
            },
            ref: String(refCounter++)
          };
          ws.send(JSON.stringify(joinPayload));

          if (heartbeatTimer) clearInterval(heartbeatTimer);
          heartbeatTimer = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                topic: 'phoenix',
                event: 'heartbeat',
                payload: {},
                ref: String(refCounter++)
              }));
            }
          }, 30000);
        };

        ws.onmessage = (evt) => {
          if (isUnmounted || !evt.data) return;
          try {
            const msg = JSON.parse(evt.data);
            const changeData = msg?.payload?.data;
            if (!changeData || !changeData.table) return;

            const { table, type, record, old_record } = changeData;
            invalidateSessionTableCache(table);
            incomingSyncUntilRef.current = Date.now() + 250;
            isIncomingSyncRef.current = true;

            const applyRealtimeRow = (setter, storageKey, rowObj, isDelete, delId) => {
              setter(prev => {
                const list = Array.isArray(prev) ? prev : [];
                let next;
                if (isDelete) {
                  next = list.filter(item => String(item?.id) !== String(delId));
                } else {
                  if (storageKey === 'elzoghbi_v2_orders' && rowObj && rowObj.id) {
                    const stamped = { ...rowObj, statusUpdatedAt: Date.now() };
                    if (localModifiedMapRef.current?.orders) {
                      localModifiedMapRef.current.orders[stamped.id] = { item: stamped, ts: Date.now() };
                      try { persistMutationMaps(); } catch (e) {}
                    }
                    rowObj = stamped;
                  }
                  const exists = list.some(item => String(item?.id) === String(rowObj.id));
                  next = exists
                    ? list.map(item => (String(item?.id) === String(rowObj.id) ? { ...item, ...rowObj } : item))
                    : [rowObj, ...list];
                }
                try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch (e) {}
                return next;
              });
            };

            const isDel = type === 'DELETE';
            const delId = old_record?.id || record?.id;
            const camelRow = record ? toCamelCaseRow(record) : null;

            if (table === 'orders' && (camelRow || isDel)) {
              applyRealtimeRow(setOrders, 'elzoghbi_v2_orders', camelRow, isDel, delId);
              if (type === 'INSERT' && camelRow) {
                try {
                  if (typeof window.__elzoghbiEnqueueSocialProof === 'function') {
                    window.__elzoghbiEnqueueSocialProof(camelRow);
                  }
                } catch (e) {}
                const notif = {
                  id: `ntf_rt_${Date.now()}`,
                  target: 'admin',
                  type: 'new_order',
                  title: `⚡ أوردر جديد فوري (${camelRow.id})`,
                  msg: `العميل ${camelRow.clientName || 'زائر'} أرسل طلباً جديداً الآن عبر Realtime`,
                  time: 'الآن',
                  read: false,
                  orderId: camelRow.id
                };
                setNotifications(prev => [notif, ...prev]);
                if (appPortal === 'admin' || adminAuthenticated) {
                  showToast(`⚡ وصل أوردر جديد الآن: ${camelRow.id} (${camelRow.clientName || ''})`, 'success');
                }
              }
            } else if (table === 'sourcing_requests' && (camelRow || isDel)) {
              applyRealtimeRow(setSourcingRequests, 'elzoghbi_v2_sourcingRequests', camelRow, isDel, delId);
              if (type === 'INSERT' && camelRow) {
                const notif = {
                  id: `ntf_src_${Date.now()}`,
                  target: 'admin',
                  type: 'sourcing',
                  title: `🌍 طلب توفير خاص جديد (${camelRow.id})`,
                  msg: `${camelRow.clientName || 'عميل'}: ${camelRow.partName || camelRow.name || 'قطعة خاصة'}`,
                  time: 'الآن',
                  read: false
                };
                setNotifications(prev => [notif, ...prev]);
                if (appPortal === 'admin' || adminAuthenticated) {
                  showToast(`🌍 طلب توفير جديد (${camelRow.id}): ${camelRow.partName || camelRow.name}`, 'info');
                }
              }
            } else if (table === 'account_requests' && (camelRow || isDel)) {
              applyRealtimeRow(setAccountRequests, 'elzoghbi_v2_accountRequests', camelRow, isDel, delId);
              if (type === 'INSERT' && camelRow && (appPortal === 'admin' || adminAuthenticated)) {
                showToast(`👤 طلب فتح حساب جديد من: ${camelRow.shopName || camelRow.name}`, 'info');
              }
            } else if (table === 'returns_list' && (camelRow || isDel)) {
              applyRealtimeRow(setReturnsList, 'elzoghbi_v2_returnsList', camelRow, isDel, delId);
            } else if (table === 'complaints' && (camelRow || isDel)) {
              applyRealtimeRow(setComplaints, 'elzoghbi_v2_complaints', camelRow, isDel, delId);
            } else if (table === 'spare_parts' && (camelRow || isDel)) {
              applyRealtimeRow(setParts, 'elzoghbi_v2_parts', camelRow, isDel, delId);
            } else if (table === 'mobile_models' && (camelRow || isDel)) {
              applyRealtimeRow(setModels, 'elzoghbi_v2_models', camelRow, isDel, delId);
            } else if (table === 'store_ads' && (camelRow || isDel)) {
              applyRealtimeRow(setStoreAds, 'elzoghbi_v2_storeAds', camelRow, isDel, delId);
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          setRealtimeConnected(false);
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
          if (!isUnmounted) {
            reconnectTimer = setTimeout(connectRealtime, 5000);
          }
        };

        ws.onerror = () => {
          try { ws.close(); } catch (e) {}
        };
      } catch (e) {}
    };

    // Egress fix (2026-11-22): Realtime is only needed in the admin panel (order alerts
    // + cross-device sync). Storefront visitors were also subscribing to postgres_changes
    // on 8 tables, so every bulk catalog edit broadcast full rows to every open shop tab
    // and invalidated their table caches (refetch storms) — a major egress multiplier.
    if (appPortal === 'admin' || adminAuthenticated) {
      connectRealtime();
    }

    return () => {
      isUnmounted = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        try { ws.close(); } catch (e) {}
      }
    };
  }, [siteSettings?.supabaseUrl, siteSettings?.supabaseAnonKey, adminAuthenticated, appPortal]);
useEffect(() => {
    if (appPortal !== 'admin' && !adminAuthenticated) return undefined;
    const pollAdminAlerts = async () => {
      try {
        if (typeof document !== 'undefined' && document.hidden) return;
        const { sbUrl, sbKey, isValid } = getSupabaseConfig();
        if (!isValid) return;
        // Step 1: Tiny ID probe; only fetch full order rows if a truly new order ID appeared!
        // Stage D: with RLS on, the anon key cannot read orders — poll through
        // gated_rows when admin credentials exist; fall back to the direct
        // probe while the RPC is not installed.
        let rawOrders = null;
        const rpcCreds = getAdminRpcCreds();
        if (rpcCreds) {
          const g = await gatedRpcCall('gated_rows', { p_username: rpcCreds.username, p_password: rpcCreds.password, p_table: 'orders', p_limit: 5, p_offset: 0 });
          if (g.ok && Array.isArray(g.data)) rawOrders = g.data;
        }
        if (rawOrders === null) {
          const probeRes = await fetch(`${sbUrl}/rest/v1/orders?select=id&order=created_at.desc&limit=1`, {
            headers: sbHeaders(sbKey)
          });
          if (!probeRes.ok) return;
          const probeRows = await probeRes.json();
          const latestId = Array.isArray(probeRows) && probeRows[0]?.id ? String(probeRows[0].id) : '';
          if (!latestId || (ordersRef.current || []).some(o => String(o.id) === latestId)) return;
          const ordRes = await fetch(`${sbUrl}/rest/v1/orders?select=${TABLE_LIGHT_COLUMNS.orders}&order=created_at.desc&limit=5`, {
            headers: sbHeaders(sbKey)
          });
          if (ordRes.ok) rawOrders = await ordRes.json();
        }
        if (Array.isArray(rawOrders) && rawOrders.length > 0) {
            const freshOrders = rawOrders.map(toCamelCaseRow);
            setOrders(prev => {
              const prevIds = new Set(prev.map(o => String(o.id)));
              const brandNew = freshOrders.filter(o => o && o.id && !prevIds.has(String(o.id)));
              if (brandNew.length > 0) {
                playNotificationSound();
                brandNew.forEach(bo => {
                  const notif = {
                    id: `ntf_poll_${bo.id}_${Date.now()}`,
                    target: 'admin',
                    type: 'new_order',
                    title: `🔔 طلبية جديدة #${bo.id} (${bo.clientName || 'عميل'})`,
                    msg: `وصل الآن طلب جديد من "${bo.clientName || 'عميل'}" بقيمة ${(bo.items || []).reduce((s, i) => s + (Number(i.unitPriceBase) || 0) * (Number(i.qty) || 1), 0)} ج.م`,
                    time: 'الآن',
                    read: false,
                    orderId: bo.id
                  };
                  setNotifications(nPrev => [notif, ...nPrev.filter(x => x.orderId !== bo.id)]);
                  showToast(`🔔 وصل أوردر جديد الآن: #${bo.id} (${bo.clientName || ''})`, 'success');
                });
              }
              return mergeServerWithLocal('orders', prev, freshOrders);
            });
        }
      } catch (e) {}
    };
    const timer = setInterval(pollAdminAlerts, 300000); // 5 minutes (Realtime WS handles instant alerts)
    return () => clearInterval(timer);
  }, [appPortal, adminAuthenticated, siteSettings?.supabaseUrl, siteSettings?.supabaseAnonKey]);
const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
const [placedOrderInfo, setPlacedOrderInfo] = useState(null);
const [toast, setToast] = useState(null);
const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4200);
  };
const [loginModalOpen, setLoginModalOpen] = useState(false);
const [printModalOrder, setPrintModalOrder] = useState(null);
const [editingOrder, setEditingOrder] = useState(null);
const [selectedAdminClientId, setSelectedAdminClientId] = useState('cli_1');
const [returnModalOrder, setReturnModalOrder] = useState(null);
const [newPartModalOpen, setNewPartModalOpen] = useState(false);
const [newModelModalOpen, setNewModelModalOpen] = useState(false);
const [checkoutAddressChoice, setCheckoutAddressChoice] = useState('primary');
const [customAddressText, setCustomAddressText] = useState('');
const [orderNotes, setOrderNotes] = useState('');
const [promoCodeInput, setPromoCodeInput] = useState('');
const [appliedPromo, setAppliedPromo] = useState(null);
const [useWalletBalance, setUseWalletBalance] = useState(true);
const [paymentMethod, setPaymentMethod] = useState('كاش عند الاستلام');
const [placingOrder, setPlacingOrder] = useState(false);
const [paymentBoxOpen, setPaymentBoxOpen] = useState(false);
const [visibilityBoxOpen, setVisibilityBoxOpen] = useState(false);
const [adminMenuOpen, setAdminMenuOpen] = useState(false);
const [openAdminCards, setOpenAdminCards] = useState({});
const [showClosedItems, setShowClosedItems] = useState(false);
const toggleAdminCard = id => {
    setOpenAdminCards(prev => {
      const nextOpen = !prev[id];
      if (nextOpen && String(id).startsWith('src_')) {
        fetchSingleSourcingDetailsOnDemand(String(id).slice(4));
      }
      return { ...prev, [id]: nextOpen };
    });
  };
const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('hm_lang') === 'en' ? 'en' : 'ar'; } catch (e) { return 'ar'; }
  });
const changeLang = l => {
    setLang(l);
    try { localStorage.setItem('hm_lang', l); } catch (e) {}
  };
const [announceBoxOpen, setAnnounceBoxOpen] = useState(false);
const [headerCompact, setHeaderCompact] = useState(false);
const [filterSheet, setFilterSheet] = useState(null);
const [gridLimit, setGridLimit] = useState(18);
const [storePage, setStorePage] = useState(1);
const [storeExtraEightShown, setStoreExtraEightShown] = useState(false);
const [quickStockPage, setQuickStockPage] = useState(1);
const [adminSelectedModelId, setAdminSelectedModelId] = useState('ALL');
const [adminClientsFilterType, setAdminClientsFilterType] = useState('ALL');
const [adminClientsGroupFilter, setAdminClientsGroupFilter] = useState('ALL');
const [adminClientDossierTab, setAdminClientDossierTab] = useState('profile');
useEffect(() => {
    setStorePage(1);
    setStoreExtraEightShown(false);
    setGridLimit(18);
    if (selectedModelId && selectedModelId !== 'ALL') {
      fetchSparePartsSliceOnDemand({ modelId: selectedModelId, limit: 300 });
    } else if (selectedBrand && selectedBrand !== 'ALL') {
      fetchSparePartsSliceOnDemand({ brand: selectedBrand, limit: 500 });
    } else if (searchQuery && searchQuery.trim().length >= 2) {
      fetchSparePartsSliceOnDemand({ search: searchQuery.trim(), limit: 200 });
    }
  }, [selectedBrand, selectedModelId, selectedCategory, searchQuery, storeStockFilter, storeQualityFilter, storeSortBy]);
useEffect(() => {
    if (selectedDetailItem?.part?.id) {
      fetchSinglePartFullDetailsOnDemand(selectedDetailItem.part.id);
    }
  }, [selectedDetailItem?.part?.id]);
useEffect(() => {
    if (clientTab === 'search') {
      const timer = requestAnimationFrame(() => {
        if (storeGridTopRef.current) {
          const rect = storeGridTopRef.current.getBoundingClientRect();
          const targetY = Math.max(0, rect.top + window.scrollY - 96);
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
      return () => cancelAnimationFrame(timer);
    }
    return undefined;
  }, [storePage]);
const handleToggleTargetedAdPart = (partObj, e) => {
    if (e) e.stopPropagation();
    const nextPromoted = !partObj.isPromotedAd;
    setParts(prev => prev.map(p => (p.id === partObj.id ? { ...p, isPromotedAd: nextPromoted } : p)));
    const targetUrl = `${window.location.origin}${window.location.pathname}#p-${encodeURIComponent(partObj.id)}`;
    if (nextPromoted) {
      try { navigator.clipboard && navigator.clipboard.writeText(targetUrl); } catch (err) {}
      showToast(`⭐ تمت إضافة "${partObj.name}" لقائمة الإعلانات ونسخ الرابط المباشر ✓`, 'success');
    } else {
      showToast(`تمت إزالة "${partObj.name}" من قائمة الإعلانات.`, 'info');
    }
  };
const handleToggleTargetedAdModel = (modelObj, e) => {
    if (e) e.stopPropagation();
    const nextPromoted = !modelObj.isPromotedAd;
    setModels(prev => prev.map(m => (m.id === modelObj.id ? { ...m, isPromotedAd: nextPromoted } : m)));
    const targetUrl = `${window.location.origin}${window.location.pathname}#m-${encodeURIComponent(modelObj.id)}`;
    if (nextPromoted) {
      try { navigator.clipboard && navigator.clipboard.writeText(targetUrl); } catch (err) {}
      showToast(`⭐ تمت إضافة موديل "${modelObj.name}" لقائمة الإعلانات ونسخ الرابط المباشر ✓`, 'success');
    } else {
      showToast(`تمت إزالة موديل "${modelObj.name}" من قائمة الإعلانات.`, 'info');
    }
  };
const [sheetExpanded, setSheetExpanded] = useState(false);
const [sheetDrag, setSheetDrag] = useState(0);
const [sheetDragging, setSheetDragging] = useState(false);
const sheetStartYRef = React.useRef(0);
const blankSrcForm = c => ({ name: '', desc: '', phone: (c && c.phone) || '', image: '', accept: false });
const [sourcingFormOpen, setSourcingFormOpen] = useState(false);
const [srcSheetExp, setSrcSheetExp] = useState(false);
const [srcSheetDrag, setSrcSheetDrag] = useState(0);
const [srcSheetDragging, setSrcSheetDragging] = useState(false);
const srcSheetStartRef = React.useRef(0);
const [srcForm, setSrcForm] = useState(() => blankSrcForm(null));
const [pendingSourcingOpen, setPendingSourcingOpen] = useState(false);
const [srcDrafts, setSrcDrafts] = useState({});
const [srcDraftImgs, setSrcDraftImgs] = useState({});
const [srcDraftPdf, setSrcDraftPdf] = useState({});
const [srcFilter, setSrcFilter] = useState('active');
const [srcSettingsOpen, setSrcSettingsOpen] = useState(false);
const [srcPriceDraft, setSrcPriceDraft] = useState({});
const [visitStats, setVisitStats] = useState(null);
const [visitInfo, setVisitInfo] = useState({ loading: false, error: '', cloud: false });
const [mobileCols, setMobileCols] = useState(() => {
    try { return localStorage.getItem('hm_cols') === '2' ? 2 : 1; } catch (e) { return 1; }
  });
const changeCols = n => {
    setMobileCols(n);
    try { localStorage.setItem('hm_cols', String(n)); } catch (e) {}
  };
const [filterSheetQuery, setFilterSheetQuery] = useState('');
const [headerFullH, setHeaderFullH] = useState(0);
const headerInnerRef = React.useRef(null);
const headerCompactRef = React.useRef(false);
headerCompactRef.current = headerCompact;
useEffect(() => {
    const el = headerInnerRef.current;
    if (!el) return undefined;
    const measure = force => {
      if (headerCompactRef.current) return;
      const h = el.offsetHeight;
      if (h) setHeaderFullH(prev => (force ? h : Math.max(prev, h)));
    };
    measure(true);
    const onResize = () => measure(true);
    let ro;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => measure(false));
      ro.observe(el);
    }
    window.addEventListener('resize', onResize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [appPortal, lang]);
useEffect(() => {
    if (headerCompact) setHeaderCompact(false);
  }, [headerCompact]);
const [bannerClosedText, setBannerClosedText] = useState(() => {
    try { return sessionStorage.getItem('hm_banner_closed') || ''; } catch (e) { return ''; }
  });
const handleShareProduct = async part => {
    const url = `${window.location.origin}${window.location.pathname}#p-${encodeURIComponent(part.id)}`;
    const store = siteSettings.storeName || '';
    const text =
      lang === 'en'
        ? `Check out this product: ${part.name}${store ? ' — ' + store : ''}`
        : `شوف المنتج ده: ${part.name}${store ? ' — ' + store : ''}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: part.name, text, url });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
    try { navigator.clipboard && navigator.clipboard.writeText(url); } catch (e) {}
  };
useEffect(() => {
    const openFromHash = () => {
      const rawHash = window.location.hash || '';
      const mp = /^#p-(.+)$/.exec(rawHash);
      if (mp) {
        let id = mp[1];
        try { id = decodeURIComponent(id); } catch (e) {}
        const part = parts.find(pp => String(pp.id) === id);
        if (!part) return;
        setAppPortal('storefront');
        setDetailImageIdx(0);
        setSelectedDetailItem({ type: 'part', part });
        try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search); } catch (e) {}
        return;
      }
      const mm = /^#m-(.+)$/.exec(rawHash);
      if (mm) {
        let mid = mm[1];
        try { mid = decodeURIComponent(mid); } catch (e) {}
        const mdl = models.find(x => String(x.id) === mid);
        if (!mdl) return;
        setAppPortal('storefront');
        setSelectedBrand(mdl.brand || 'ALL');
        setSelectedModelId(mdl.id);
        setSelectedCategory('ALL');
        setClientTab('search');
        try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search); } catch (e) {}
      }
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [parts, models]);
const [lightbox, setLightbox] = useState(null);
const swipeStartRef = React.useRef(null);
const swipeSuppressRef = React.useRef(false);
const swipeProps = (onNext, onPrev) => ({
    style: { touchAction: 'pan-y' },
    onPointerDown: e => {
      swipeStartRef.current = { x: e.clientX, y: e.clientY };
      swipeSuppressRef.current = false;
    },
    onPointerUp: e => {
      const st = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!st) return;
      const dx = e.clientX - st.x;
      const dy = e.clientY - st.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swipeSuppressRef.current = true;
        if (dx < 0) onNext();
        else onPrev();
        setTimeout(() => { swipeSuppressRef.current = false; }, 80);
      }
    },
    onPointerCancel: () => { swipeStartRef.current = null; },
    onDragStart: e => e.preventDefault()
  });
useEffect(() => {
    try {
      let meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
    } catch (e) {}
  }, []);
const [termsBoxOpen, setTermsBoxOpen] = useState(false);
useEffect(() => {
    const enabled = getPaymentMethods(siteSettings).filter(m => m.enabled);
    if (enabled.length > 0 && !enabled.some(m => m.id === paymentMethod)) {
      setPaymentMethod(enabled[0].id);
    }
  }, [siteSettings.paymentMethods]);
const updatePaymentMethods = (mutator) => {
    setSiteSettings(prev => ({ ...prev, paymentMethods: mutator(getPaymentMethods(prev)) }));
  };
const [deliveryFeeBase] = useState(65);
const currentClient = useMemo(() => {
    if (!activeRole || activeRole === 'guest' || activeRole === 'admin') return null;
    if (activeRole === 'client_1') return clients.find(c => c.id === 'cli_1') || null;
    if (activeRole === 'client_2') return clients.find(c => c.id === 'cli_2') || null;
    if (activeRole === 'client_3') return clients.find(c => c.id === 'cli_3') || null;
    return clients.find(c => c.id === activeRole) || null;
  }, [activeRole, clients]);
const currentGroup = useMemo(() => {
    if (currentClient) {
      return groups.find(g => g.id === currentClient.groupId) || groups.find(g => g.isDefault) || groups[0];
    }
    return groups.find(g => g.isDefault) || groups[0];
  }, [currentClient, groups]);
const FLAG_KEY_TO_SETTING_KEY = {
    live_social_proof: 'enableLiveSocialProof',
    spin_to_win: 'enableSpinToWin',
    free_shipping_bar: 'enableFreeShippingBar',
    smart_cross_sell: 'enableSmartCrossSell',
    wallet_cashback: 'enableWalletCashback',
    quality_tiers: 'enableQualityTiers',
    trust_badges: 'enableTrustBadges',
    exit_intent_popup: 'enableExitIntentPopup',
    buy_more_save_more: 'enableBuyMoreSaveMore',
    cashier_impulse: 'enableCashierImpulse',
    loyalty_tiers: 'enableLoyaltyTiers',
    family_saved_devices: 'enableFamilySavedDevices',
    repurchase_reminders: 'enableRepurchaseReminders',
    vip_secret_route: 'enableVipSecretRoute',
    warranty_lookup: 'enableWarrantyLookup',
    referral_program: 'enableReferralProgram',
    birthday_and_seasonal: 'enableBirthdayAndSeasonal',
    out_of_stock_notify: 'keepOutOfStockVisible',
    sales_cap_guard: 'enableSalesCapGuard'
  };
const [serverFeatureFlags, setServerFeatureFlags] = useState({});
const refreshServerFeatureFlags = async () => {
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (!isValid) return;
      const res = await fetch(`${sbUrl}/rest/v1/feature_flags?select=key,enabled,config,updated_at`, {
        headers: sbHeaders(sbKey)
      });
      if (!res.ok) return;
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const nextMap = {};
        rows.forEach(r => {
          if (!r || !r.key) return;
          nextMap[r.key] = { enabled: Boolean(r.enabled), config: r.config || {}, updatedAt: r.updated_at };
        });
        incomingSyncUntilRef.current = Date.now() + 250;
        isIncomingSyncRef.current = true;
        setServerFeatureFlags(nextMap);
        setSiteSettings(prev => {
          const localUpdatedAt = Number(prev?._updatedAt || 0);
          const patch = {};
          rows.forEach(r => {
            const sKey = FLAG_KEY_TO_SETTING_KEY[r.key];
            if (!sKey) return;
            const rowTs = r.updated_at ? Date.parse(r.updated_at) : 0;
            // Only apply server flag row if local settings were not modified more recently
            if (!localUpdatedAt || (rowTs > localUpdatedAt + 2000)) {
              patch[sKey] = Boolean(r.enabled);
            }
          });
          if (Object.keys(patch).length === 0) return prev;
          const merged = { ...prev, ...patch };
          try { window.localStorage.setItem('elzoghbi_v2_siteSettings', JSON.stringify(merged)); } catch (e) {}
          return merged;
        });
      }
    } catch (e) {}
  };
useEffect(() => {
    refreshServerFeatureFlags();
  }, []);
const useFlag = (flagKey) => {
    const sKey = FLAG_KEY_TO_SETTING_KEY[flagKey] || flagKey;
    const serverRow = serverFeatureFlags[flagKey];
    const enabled =
      siteSettings[sKey] !== undefined
        ? siteSettings[sKey] !== false
        : serverRow !== undefined
        ? Boolean(serverRow.enabled)
        : true;
    const config = serverRow?.config || {};

    const updateFlag = async (nextEnabled, configPatch = null) => {
      const boolVal = Boolean(nextEnabled);
      setServerFeatureFlags(prev => ({
        ...prev,
        [flagKey]: {
          enabled: boolVal,
          config: configPatch ? { ...(prev[flagKey]?.config || {}), ...configPatch } : (prev[flagKey]?.config || {}),
          updatedAt: new Date().toISOString()
        }
      }));
      saveSiteSettingsImmediate(prev => ({
        ...prev,
        [sKey]: boolVal,
        ...(configPatch || {})
      }));
      try {
        const { sbUrl, sbKey, isValid } = getSupabaseConfig();
        if (isValid) {
          await fetch(`${sbUrl}/rest/v1/feature_flags?on_conflict=key`, {
            method: 'POST',
            headers: sbHeaders(sbKey, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
            body: JSON.stringify([{
              key: flagKey,
              enabled: boolVal,
              config: configPatch ? { ...(serverRow?.config || {}), ...configPatch } : (serverRow?.config || {}),
              updated_at: new Date().toISOString()
            }])
          });
        }
      } catch (e) {}
    };

    return { key: flagKey, enabled, config, updateFlag };
  };
const callServerCroRpc = async (rpcName, rpcParams) => {
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (!isValid) return null;
      const res = await fetch(`${sbUrl}/rest/v1/rpc/${rpcName}`, {
        method: 'POST',
        headers: sbHeaders(sbKey),
        body: JSON.stringify(rpcParams)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  };
const [liveSocialToast, setLiveSocialToast] = useState(null);
const liveSocialQueueRef = useRef([]);
const shownSocialOrderIdsRef = useRef(new Set());
const lastSocialToastTsRef = useRef(0);
const extractEgyptianCityFromAddress = (addrStr) => {
    const raw = String(addrStr || '').trim();
    const knownCities = ['المنصورة', 'الدقهلية', 'القاهرة', 'الإسكندرية', 'طنطا', 'الزقازيق', 'دمياط', 'المحلة', 'بنها', 'الجيزة', 'بورسعيد', 'الإسماعيلية', 'العاشر من رمضان', 'كفر الشيخ', 'شبين الكوم'];
    for (const c of knownCities) {
      if (raw.includes(c)) return c;
    }
    return 'مصر';
  };
const getFirstLetterMaskedName = (fullName) => {
    const clean = String(fullName || 'عميل').trim();
    if (!clean) return 'ع.';
    return `${clean.charAt(0)}.`;
  };
const triggerLiveSocialToastImmediate = (customOrderOrPart = null, forceInAdmin = false) => {
    const socialFlag = useFlag('live_social_proof');
    if (!socialFlag.enabled && !forceInAdmin) return;

    const nowMs = Date.now();
    const lookbackMs = 24 * 60 * 60 * 1000; // Last 24 hours only!
    const recentRealOrders = orders.filter(o => {
      if (!o || o.status === 'ملغي' || !Array.isArray(o.items) || o.items.length === 0) return false;
      if (!forceInAdmin && shownSocialOrderIdsRef.current.has(String(o.id))) return false;
      const parsedTs = Date.parse(String(o.createdAt || '').replace(' ', 'T'));
      if (!Number.isNaN(parsedTs)) {
        return (nowMs - parsedTs) <= lookbackMs;
      }
      return true;
    });

    const targetOrd = (customOrderOrPart && customOrderOrPart.items)
      ? customOrderOrPart
      : recentRealOrders[0];

    if (!targetOrd) {
      if (forceInAdmin) {
        showToast('لا توجد طلبات جديدة خلال آخر 24 ساعة لعرضها، سيتم عرض نموذج تجريبي للأدمن فقط.', 'info');
      } else {
        return; // Strictly real orders from last 24h for visitors!
      }
    }

    const firstItem = targetOrd?.items?.[0] || {};
    const matchedPart = parts.find(p => String(p.id) === String(firstItem.partId)) || parts[0];
    if (targetOrd?.id && !forceInAdmin) {
      shownSocialOrderIdsRef.current.add(String(targetOrd.id));
    }

    const toastPayload = {
      id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      orderId: targetOrd?.id || 'TEST',
      customerInitial: getFirstLetterMaskedName(targetOrd?.clientName || 'أحمد'),
      city: extractEgyptianCityFromAddress(targetOrd?.address || 'المنصورة'),
      productName: firstItem.name || matchedPart?.name || 'منتج أصلي',
      productImage: matchedPart?.image || PART_IMAGES.screen,
      partId: firstItem.partId || matchedPart?.id || null,
      timeLabel: targetOrd?.createdAt ? 'خلال آخر 24 ساعة' : 'منذ لحظات',
      forceShowInAdmin: forceInAdmin
    };

    setLiveSocialToast(toastPayload);
    setTimeout(() => {
      setLiveSocialToast(curr => (curr && curr.id === toastPayload.id ? null : curr));
    }, 6500);
  };
const enqueueLiveSocialProofOrder = (orderObj) => {
    const socialFlag = useFlag('live_social_proof');
    if (!orderObj || !socialFlag.enabled) return;
    if (shownSocialOrderIdsRef.current.has(String(orderObj.id))) return;
    const firstItem = Array.isArray(orderObj.items) && orderObj.items[0] ? orderObj.items[0] : null;
    if (!firstItem) return;
    const matchedPart = parts.find(p => String(p.id) === String(firstItem.partId) || p.sku === firstItem.sku);
    shownSocialOrderIdsRef.current.add(String(orderObj.id));
    liveSocialQueueRef.current.push({
      id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      orderId: orderObj.id,
      customerInitial: getFirstLetterMaskedName(orderObj.clientName),
      city: extractEgyptianCityFromAddress(orderObj.address),
      productName: firstItem.name || matchedPart?.name || 'منتج أصلي',
      productImage: matchedPart?.image || PART_IMAGES.screen,
      partId: firstItem.partId || matchedPart?.id || null,
      timeLabel: 'منذ لحظات',
      forceShowInAdmin: false
    });
  };
useEffect(() => {
    window.__elzoghbiEnqueueSocialProof = enqueueLiveSocialProofOrder;
    return () => {
      delete window.__elzoghbiEnqueueSocialProof;
    };
  });
useEffect(() => {
    const socialFlag = useFlag('live_social_proof');
    if (!socialFlag.enabled) {
      setLiveSocialToast(null);
      return undefined;
    }
    // Interval strictly between 20 and 40 seconds!
    const randomGapMs = () => {
      const baseSec = Number(siteSettings.socialProofIntervalSec) || 35;
      return Math.max(5000, baseSec * (0.7 + Math.random() * 0.6) * 1000);
    };
    let timerId = null;

    const scheduleNext = () => {
      timerId = setTimeout(() => {
        if (appPortal !== 'admin' && useFlag('live_social_proof').enabled) {
          if (liveSocialQueueRef.current.length > 0) {
            const nextToast = liveSocialQueueRef.current.shift();
            if (nextToast) {
              setLiveSocialToast(nextToast);
              setTimeout(() => {
                setLiveSocialToast(curr => (curr && curr.id === nextToast.id ? null : curr));
              }, 6500);
            }
          } else {
            triggerLiveSocialToastImmediate(null, false);
          }
        }
        scheduleNext();
      }, randomGapMs());
    };

    scheduleNext();
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [appPortal, siteSettings.enableLiveSocialProof, orders.length]);
const SPIN_STORAGE_KEY = 'elzoghbi_spin_wheel_v2_server';
const activeSpinPrizes = useMemo(() => {
    const arr = Array.isArray(siteSettings.spinWheelPrizes) && siteSettings.spinWheelPrizes.length >= 2
      ? siteSettings.spinWheelPrizes
      : DEFAULT_SPIN_PRIZES;
    return arr;
  }, [siteSettings.spinWheelPrizes]);
const [spinWheelState, setSpinWheelState] = useState(null);
const [spinModalOpen, setSpinModalOpen] = useState(false);
const [isSpinningWheel, setIsSpinningWheel] = useState(false);
const [spinRotationDeg, setSpinRotationDeg] = useState(0);
const [spinContactInput, setSpinContactInput] = useState('');
const [spinCooldownMessage, setSpinCooldownMessage] = useState('');
const getSpinCooldownInfoForUser = (userId, contactStr) => {
    const cooldownDays = Math.max(1, Number(siteSettings.spinCooldownDays) || 7);
    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    const cleanPhone = normalizeDigits(contactStr || currentClient?.phone || '').trim();
    const uid = String(userId || currentClient?.id || cleanPhone || '').trim();
    if (!uid && !cleanPhone) return { allowed: false, requireAuth: true, daysRemaining: 0 };

    const historyMap = siteSettings.serverSpinsRegistry || {};
    const record = historyMap[uid] || (cleanPhone ? historyMap[cleanPhone] : null);
    if (record && record.spunAt) {
      const elapsed = Date.now() - Number(record.spunAt);
      if (elapsed < cooldownMs) {
        const daysRem = Math.max(1, Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000)));
        return {
          allowed: false,
          requireAuth: false,
          daysRemaining: daysRem,
          record
        };
      }
    }
    return { allowed: true, requireAuth: false, daysRemaining: 0, record: null };
  };
useEffect(() => {
    if (currentClient?.phone && !spinContactInput) {
      setSpinContactInput(currentClient.phone);
    }
    const check = getSpinCooldownInfoForUser(currentClient?.id, currentClient?.phone || spinContactInput);
    if (!check.allowed && check.record) {
      setSpinWheelState(check.record);
      setSpinCooldownMessage(`تقدر تلف تاني بعد ${check.daysRemaining} يوم`);
    } else if (check.allowed) {
      setSpinCooldownMessage('');
    }
  }, [currentClient?.id, currentClient?.phone, siteSettings.spinCooldownDays, siteSettings.serverSpinsRegistry]);
const [confettiActive, setConfettiActive] = useState(false);
const triggerConfettiCelebration = () => {
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 4200);
  };
const recordRecoveredCartEvent = (estimatedVal = 250) => {
    saveSiteSettingsImmediate(prev => ({
      ...prev,
      analyticsRecoveredCartsCount: (Number(prev.analyticsRecoveredCartsCount) || 0) + 1,
      analyticsRecoveredCartsValue: (Number(prev.analyticsRecoveredCartsValue) || 0) + (Number(estimatedVal) || 250)
    }));
  };
const applySpinPrizePromo = (prizeObj, silent = false) => {
    if (!useFlag('spin_to_win').enabled) {
      showToast('ميزة عجلة الحظ متوقفة حالياً.', 'warning');
      return;
    }
    if (!prizeObj || !prizeObj.code) return;
    const found = promoCodes.find(p => p.code.toUpperCase() === prizeObj.code.toUpperCase());
    const promoToApply = found || {
      id: `prm_${prizeObj.id || Date.now()}`,
      code: prizeObj.code,
      type: prizeObj.type || (prizeObj.code.includes('FREE') ? 'free_delivery' : prizeObj.code.includes('OFF') ? 'percentage' : 'fixed'),
      value: Number(prizeObj.value) || (prizeObj.code.includes('FREE') ? 100 : prizeObj.code.includes('5OFF') ? 5 : 50),
      maxDiscountCap: Math.max(0, Number(siteSettings.spinMaxDiscountCap ?? 150)),
      minOrderAmount: Math.max(0, Number(siteSettings.spinMinOrderAmount ?? 250)),
      usageLimit: 1,
      maxUsesPerUser: 1,
      assignedUserId: currentClient?.id || normalizeDigits(spinContactInput).trim(),
      usedCount: 0,
      expiryDate: new Date(Date.now() + (Math.max(1, Number(siteSettings.spinCooldownDays) || 7) * 86400000)).toISOString().slice(0, 10),
      sourceFeature: 'spin_to_win',
      description: prizeObj.desc || prizeObj.label,
      active: true
    };
    setPromoCodeInput(promoToApply.code);
    setAppliedPromo(promoToApply);
    if (!silent) {
      showToast(`🎁 تم تفعيل جائزتك (${prizeObj.label}) في السلة تلقائياً! (صالحة لمدة 7 أيام وتستخدم مرة واحدة)`, 'success');
    }
  };
const handleSpinTheWheel = async () => {
    const spinFlag = useFlag('spin_to_win');
    if (!spinFlag.enabled) {
      showToast('ميزة عجلة الحظ متوقفة حالياً من الإدارة.', 'warning');
      setSpinModalOpen(false);
      return;
    }
    if (isSpinningWheel) return;

    // Rule 5: Visitor without account MUST register with phone or email before taking any gift or coupon!
    const cleanContact = normalizeDigits(spinContactInput || currentClient?.phone || '').trim() || String(spinContactInput || currentClient?.email || '').trim();
    if (!currentClient && cleanContact.length < 10 && !cleanContact.includes('@')) {
      showToast('⚠️ لازم تسجّل برقم تليفونك (11 رقم) أو الإيميل الأول قبل لف العجلة عشان الكوبون يتسجل باسمك!', 'warning');
      return;
    }

    const userKey = currentClient?.id || cleanContact;
    const cooldownInfo = getSpinCooldownInfoForUser(userKey, cleanContact);
    if (!cooldownInfo.allowed && !cooldownInfo.requireAuth) {
      setSpinCooldownMessage(`تقدر تلف تاني بعد ${cooldownInfo.daysRemaining} يوم`);
      showToast(`⏳ تقدر تلف تاني بعد ${cooldownInfo.daysRemaining} يوم!`, 'warning');
      return;
    }

    setIsSpinningWheel(true);

    // Call Server RPC (`rpc_spin_wheel`) first so the result is determined on the server!
    const serverResp = await callServerCroRpc('rpc_spin_wheel', {
      p_user_id: String(userKey),
      p_phone_or_email: String(cleanContact),
      p_prizes: activeSpinPrizes
    });

    if (serverResp && serverResp.ok === false && serverResp.error === 'COOLDOWN_ACTIVE') {
      setIsSpinningWheel(false);
      const rem = Number(serverResp.days_remaining) || 7;
      setSpinCooldownMessage(`تقدر تلف تاني بعد ${rem} يوم`);
      if (serverResp.last_prize) {
        setSpinWheelState({ spun: true, prize: serverResp.last_prize, spunAt: Date.now() });
      }
      showToast(serverResp.message || `تقدر تلف تاني بعد ${rem} يوم!`, 'warning');
      return;
    }

    const winningIdx = (serverResp && typeof serverResp.win_idx === 'number')
      ? (serverResp.win_idx % activeSpinPrizes.length)
      : Math.floor(Math.random() * activeSpinPrizes.length);
    const segmentAngle = 360 / activeSpinPrizes.length;
    const targetRotation = 360 * 6 + (360 - winningIdx * segmentAngle - segmentAngle / 2);
    setSpinRotationDeg(targetRotation);

    setTimeout(() => {
      const basePrize = activeSpinPrizes[winningIdx];
      const cooldownDays = Math.max(1, Number(siteSettings.spinCooldownDays) || 7);
      const personalCode = serverResp?.coupon_code || `SPIN-${String(cleanContact).slice(-4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const expireDateStr = new Date(Date.now() + cooldownDays * 86400000).toISOString().slice(0, 10);

      const wonPrize = {
        ...basePrize,
        code: personalCode,
        assignedUserId: userKey,
        expiryDate: expireDateStr
      };

      const savedState = {
        spun: true,
        userId: userKey,
        contact: cleanContact,
        spunAt: Date.now(),
        nextEligibleAt: Date.now() + cooldownDays * 86400000,
        prize: wonPrize
      };

      setSpinWheelState(savedState);
      setIsSpinningWheel(false);
      setSpinCooldownMessage(`تقدر تلف تاني بعد ${cooldownDays} يوم`);

      // Register personal 7-day single-use coupon in promoCodes & serverSpinsRegistry
      const newPersonalPromo = {
        id: `prm_spin_${Date.now()}`,
        code: personalCode,
        type: wonPrize.type || 'percentage',
        value: Number(wonPrize.value) || 5,
        maxDiscountCap: 400,
        minOrderAmount: 0,
        usageLimit: 1,
        maxUsesPerUser: 1,
        assignedUserId: userKey,
        sourceFeature: 'spin_to_win',
        usedCount: 0,
        expiryDate: expireDateStr,
        description: `${wonPrize.label} (خاص بالعميل ${cleanContact} — صالح ${cooldownDays} أيام لمرة واحدة)`,
        active: true
      };
      setPromoCodes(prev => [newPersonalPromo, ...prev]);
      markLocalUpsert('promoCodes', newPersonalPromo);
      sbUpsert('promo_codes', newPersonalPromo);

      saveSiteSettingsImmediate(prev => ({
        ...prev,
        serverSpinsRegistry: {
          ...(prev.serverSpinsRegistry || {}),
          [userKey]: savedState,
          [cleanContact]: savedState
        }
      }));

      applySpinPrizePromo(wonPrize, true);
      recordRecoveredCartEvent(300);
      triggerConfettiCelebration();
      showToast(`🎉 مبروك! كسبت "${wonPrize.label}" بكود خاص باسمك (${personalCode}) صالح لمدة ${cooldownDays} أيام!`, 'success');
    }, 4100);
  };
const [bundleDiscountPartIds, setBundleDiscountPartIds] = useState(() => {
    try {
      const raw = window.sessionStorage.getItem('elzoghbi_bundle_disc_ids');
      if (raw) return JSON.parse(raw) || {};
    } catch (e) {}
    return {};
  });
const handleAddCrossSellBundleItem = (targetPart) => {
    if (!targetPart) return;
    const discPct = Number(siteSettings.crossSellBundleDiscountPct) || 10;
    const pid = String(targetPart.id);
    setBundleDiscountPartIds(prev => {
      const next = { ...prev, [pid]: discPct };
      try { window.sessionStorage.setItem('elzoghbi_bundle_disc_ids', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    updateCartQty(targetPart.id, 1);
    recordRecoveredCartEvent(Number(targetPart.basePrice) || 150);
    showToast(`🎁 تمت إضافة "${targetPart.name}" للسلة بخصم الباقة الذكية (-${discPct}%) فوراً!`, 'success');
  };
const isPartCashbackEnabled = (part) => {
    if (!part || siteSettings.enableWalletCashback === false) return false;
    const pid = String(part.id || '').trim();
    // 1. Explicit per-product manual toggle in cashbackPartMap takes priority
    if (siteSettings?.cashbackPartMap && siteSettings.cashbackPartMap[pid] !== undefined) {
      return Boolean(siteSettings.cashbackPartMap[pid]);
    }
    if (siteSettings?.partExtraMeta?.[pid]?.cashbackEnabled !== undefined) {
      return Boolean(siteSettings.partExtraMeta[pid].cashbackEnabled);
    }
    // 2. Bulk price rule stored in siteSettings.cashbackBulkRule (evaluated in 0.001ms without looping localStorage!)
    const bulkRule = siteSettings?.cashbackBulkRule;
    if (bulkRule && bulkRule.mode) {
      const cap = Number(bulkRule.cap ?? siteSettings.cashbackMaxPartPrice) || 1500;
      const price = Number(part.basePrice) || 0;
      if (bulkRule.mode === 'affordable_only') {
        return price > 0 && price <= cap;
      }
      if (bulkRule.mode === 'disable_above_cap' && price > cap) {
        return false;
      }
    }
    // 3. Fallback to part properties
    if (part.customGroupPrices?._cashbackEnabled !== undefined) {
      return Boolean(part.customGroupPrices._cashbackEnabled);
    }
    if (part.cashbackEnabled !== undefined) {
      return Boolean(part.cashbackEnabled);
    }
    return false;
  };
const getPartCashbackPct = (part) => {
    if (!part) return Number(siteSettings.defaultCashbackPct) || 2;
    const pid = String(part.id || '').trim();
    const rawPct =
      siteSettings?.partExtraMeta?.[pid]?.cashbackPct ??
      part.customGroupPrices?._cashbackPct ??
      part.cashbackPct ??
      siteSettings?.cashbackBulkRule?.pct ??
      siteSettings.defaultCashbackPct ??
      2;
    const n = Number(rawPct);
    return !Number.isNaN(n) && n > 0 ? Math.min(35, n) : (Number(siteSettings.defaultCashbackPct) || 2);
  };
const togglePartSoldOut = (partObj) => {
    if (!partObj || !partObj.id) return;
    const next = !partObj.soldOut;
    let updatedPartRef = null;
    setParts(prev =>
      prev.map(p => {
        if (p.id !== partObj.id) return p;
        updatedPartRef = { ...p, soldOut: next };
        return updatedPartRef;
      })
    );
    if (updatedPartRef) {
      markLocalUpsert('parts', updatedPartRef);
      sbUpsert('spare_parts', updatedPartRef);
    }
    showToast(next ? `تم تعليم "${partObj.name}" كنافد` : `تم تعليم "${partObj.name}" كمتاح`, 'success');
  };
const togglePartCashback = (partObj, e) => {
    if (e) e.stopPropagation();
    if (!partObj || !partObj.id) return;
    const pid = String(partObj.id).trim();
    const currentlyOn = isPartCashbackEnabled(partObj);
    const nextOn = !currentlyOn;
    const pct = getPartCashbackPct(partObj);

    let updatedPartRef = null;
    setParts(prev =>
      prev.map(p => {
        if (String(p.id).trim() !== pid) return p;
        const updatedP = {
          ...p,
          cashbackEnabled: nextOn,
          cashbackPct: pct,
          customGroupPrices: {
            ...(p.customGroupPrices || {}),
            _cashbackEnabled: nextOn,
            _cashbackPct: pct
          }
        };
        updatedPartRef = updatedP;
        return updatedP;
      })
    );
    if (updatedPartRef) {
      markLocalUpsert('parts', updatedPartRef);
      sbUpsert('spare_parts', updatedPartRef);
    }
    saveSiteSettingsImmediate(prev => ({
      ...prev,
      cashbackPartMap: {
        ...(prev.cashbackPartMap || {}),
        [pid]: nextOn
      },
      partExtraMeta: {
        ...(prev.partExtraMeta || {}),
        [pid]: {
          ...(prev.partExtraMeta?.[pid] || {}),
          cashbackEnabled: nextOn,
          cashbackPct: pct
        }
      }
    }));
    showToast(
      nextOn
        ? `💰 تم تفعيل الكاش باك (${pct}%) للمنتج "${partObj.name}" فوراً ✓`
        : `🛑 تم إيقاف الكاش باك عن المنتج "${partObj.name}" فوراً ✓`,
      nextOn ? 'success' : 'info'
    );
  };
const handleBulkDisableExpensiveCashback = (maxPriceThreshold) => {
    const cap = Number(maxPriceThreshold ?? siteSettings.cashbackMaxPartPrice) || 1500;
    let affectedCount = 0;
    const nextCashbackMap = { ...(siteSettings.cashbackPartMap || {}) };
    const nextExtraMeta = { ...(siteSettings.partExtraMeta || {}) };

    parts.forEach(p => {
      const pid = String(p.id).trim();
      if ((Number(p.basePrice) || 0) > cap) {
        affectedCount += 1;
        nextCashbackMap[pid] = false;
        if (nextExtraMeta[pid]) {
          nextExtraMeta[pid] = { ...nextExtraMeta[pid], cashbackEnabled: false };
        }
      }
    });

    if (parts.length <= 500) {
      setParts(prev =>
        prev.map(p =>
          (Number(p.basePrice) || 0) > cap
            ? { ...p, cashbackEnabled: false, customGroupPrices: { ...(p.customGroupPrices || {}), _cashbackEnabled: false } }
            : p
        )
      );
    }

    saveSiteSettingsImmediate(prev => ({
      ...prev,
      cashbackMaxPartPrice: cap,
      cashbackBulkRule: { mode: 'disable_above_cap', cap, pct: Number(prev.defaultCashbackPct) || 2, updatedAt: Date.now() },
      cashbackPartMap: nextCashbackMap,
      partExtraMeta: nextExtraMeta
    }));
    showToast(
      `🛡️ تم فوراً إيقاف الكاش باك عن كل المنتجات الأغلى من ${cap.toLocaleString()} ج.م (${affectedCount} منتج) بدون أي بطء!`,
      'success'
    );
  };
const handleBulkEnableAffordableCashback = (maxPriceThreshold) => {
    const cap = Number(maxPriceThreshold ?? siteSettings.cashbackMaxPartPrice) || 1500;
    const pct = Number(siteSettings.defaultCashbackPct) || 2;
    let enabledCount = 0;
    const nextCashbackMap = {};
    const nextExtraMeta = { ...(siteSettings.partExtraMeta || {}) };

    parts.forEach(p => {
      const pid = String(p.id).trim();
      const price = Number(p.basePrice) || 0;
      const isAffordable = price > 0 && price <= cap;
      nextCashbackMap[pid] = isAffordable;
      if (isAffordable) enabledCount += 1;
      if (nextExtraMeta[pid]) {
        nextExtraMeta[pid] = { ...nextExtraMeta[pid], cashbackEnabled: isAffordable, cashbackPct: nextExtraMeta[pid].cashbackPct ?? pct };
      }
    });

    if (parts.length <= 500) {
      setParts(prev =>
        prev.map(p => {
          const price = Number(p.basePrice) || 0;
          const isAffordable = price > 0 && price <= cap;
          // Preserve a product's own custom cashback rate — only products
          // without one fall back to the default rate.
          const customPct = p.customGroupPrices?._cashbackPct ?? siteSettings.partExtraMeta?.[String(p.id).trim()]?.cashbackPct;
          const effPct = customPct !== undefined && customPct !== null && customPct !== '' ? Number(customPct) : pct;
          return {
            ...p,
            cashbackEnabled: isAffordable,
            cashbackPct: effPct,
            customGroupPrices: { ...(p.customGroupPrices || {}), _cashbackEnabled: isAffordable, _cashbackPct: effPct }
          };
        })
      );
    }

    saveSiteSettingsImmediate(prev => ({
      ...prev,
      cashbackMaxPartPrice: cap,
      cashbackBulkRule: { mode: 'affordable_only', cap, pct, updatedAt: Date.now() },
      cashbackPartMap: nextCashbackMap,
      partExtraMeta: nextExtraMeta
    }));
    showToast(
      `✅ تم في لحظة تفعيل كاش باك (${pct}%) على ${enabledCount} منتج بسعر ${cap.toLocaleString()} ج.م فأقل وإيقافه عن الأغلى!`,
      'success'
    );
  };
const isPartPinnedToCashier = (part) => {
    if (!part) return false;
    const pid = String(part.id || '').trim();
    const pinnedList = Array.isArray(siteSettings.pinnedCashierPartIds) ? siteSettings.pinnedCashierPartIds.map(String) : [];
    if (pinnedList.includes(pid)) return true;
    return Boolean(siteSettings?.partExtraMeta?.[pid]?.pinnedCashier || part.pinnedCashier);
  };
const togglePartCashierPin = (partObj, e) => {
    if (e) e.stopPropagation();
    if (!partObj || !partObj.id) return;
    const pid = String(partObj.id).trim();
    const currentlyPinned = isPartPinnedToCashier(partObj);
    const nextPinned = !currentlyPinned;

    saveSiteSettingsImmediate(prev => {
      const curList = Array.isArray(prev.pinnedCashierPartIds) ? prev.pinnedCashierPartIds.map(String) : [];
      const nextList = nextPinned
        ? Array.from(new Set([...curList, pid]))
        : curList.filter(x => x !== pid);
      return {
        ...prev,
        pinnedCashierPartIds: nextList,
        partExtraMeta: {
          ...(prev.partExtraMeta || {}),
          [pid]: {
            ...(prev.partExtraMeta?.[pid] || {}),
            pinnedCashier: nextPinned
          }
        }
      };
    });
    showToast(
      nextPinned
        ? `🛒 تم تثبيت "${partObj.name}" ليظهر في رف الكاشير السريع للعملاء ✓`
        : `تمت إزالة "${partObj.name}" من التثبيت اليدوي لرف الكاشير ✓`,
      nextPinned ? 'success' : 'info'
    );
  };
const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(() => {
    try {
      const saved = window.localStorage.getItem('elzoghbi_sound_alerts_v1');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });
const [browserNotifPermission, setBrowserNotifPermission] = useState(() => {
    try {
      return typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
    } catch (e) {
      return 'unsupported';
    }
  });
const playAppNotificationSound = (toneType = 'default') => {
    try {
      if (!soundAlertsEnabled) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes =
        toneType === 'order'
          ? [523.25, 659.25, 783.99, 1046.5] // C5 -> E5 -> G5 -> C6 celebratory chime
          : toneType === 'status'
          ? [587.33, 880.0] // D5 -> A5 status update chime
          : [440.0, 659.25, 880.0]; // A4 -> E5 -> A5 alert chime

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + idx * 0.11 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.11);
        osc.stop(ctx.currentTime + idx * 0.11 + 0.25);
      });
    } catch (e) {}
  };
const triggerBrowserAndSoundNotification = (title, body, toneType = 'default') => {
    playAppNotificationSound(toneType);
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title || (siteSettings.storeName || 'ELZOGHBI'), {
          body: body || '',
          icon: ELZOGHBI_LOGO,
          badge: ELZOGHBI_LOGO
        });
      }
    } catch (e) {}
  };
const handleToggleSoundAndRequestPermission = async () => {
    const nextVal = !soundAlertsEnabled;
    setSoundAlertsEnabled(nextVal);
    try {
      window.localStorage.setItem('elzoghbi_sound_alerts_v1', JSON.stringify(nextVal));
    } catch (e) {}

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        setBrowserNotifPermission(perm);
      } catch (e) {}
    }

    if (nextVal) {
      playAppNotificationSound('order');
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`🔔 إشعارات ${siteSettings.storeName || 'ELZOGHBI'} مفعّلة`, {
            body: 'سيصلك تنبيه صوتي وإشعار متصفح فوري مع كل تحديث أو طلب جديد!',
            icon: ELZOGHBI_LOGO
          });
        }
      } catch (e) {}
      showToast('🔊 تم تفعيل التنبيهات الصوتية وإشعارات المتصفح بنجاح!', 'success');
    } else {
      showToast('🔇 تم كتم التنبيهات الصوتية مؤقتاً.', 'info');
    }
  };
const seenNotifIdsRef = useRef(new Set());
const notifInitializedRef = useRef(false);
useEffect(() => {
    if (!Array.isArray(notifications)) return;
    if (!notifInitializedRef.current) {
      notifications.forEach(n => { if (n?.id) seenNotifIdsRef.current.add(n.id); });
      notifInitializedRef.current = true;
      return;
    }
    const targetKey = appPortal === 'admin' ? 'admin' : (currentClient?.id || 'guest');
    const newlyArrived = notifications.filter(n => n && n.id && !seenNotifIdsRef.current.has(n.id));
    if (newlyArrived.length > 0) {
      newlyArrived.forEach(n => seenNotifIdsRef.current.add(n.id));
      const relevant = newlyArrived.find(n =>
        appPortal === 'admin'
          ? n.target === 'admin'
          : (String(n.target) === String(targetKey) || n.target === 'all')
      );
      if (relevant) {
        const tone = relevant.type === 'new_order' ? 'order' : relevant.type === 'restock_waitlist' ? 'alert' : 'status';
        triggerBrowserAndSoundNotification(relevant.title, relevant.msg, tone);
      }
    }
  }, [notifications, appPortal, currentClient?.id, soundAlertsEnabled]);
const [vipLinkUnlocked, setVipLinkUnlocked] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const vipParam = params.get('vip');
      const path = window.location.pathname.toLowerCase();
      const expectedToken = String(siteSettings.vipSecretToken || 'elzoghbi-vip');
      if ((vipParam && vipParam === expectedToken) || path === '/vip' || path.endsWith('/vip')) {
        window.sessionStorage.setItem('elzoghbi_vip_secret_unlocked', '1');
        return true;
      }
      return window.sessionStorage.getItem('elzoghbi_vip_secret_unlocked') === '1';
    } catch (e) {
      return false;
    }
  });
const [vipAdminPreviewUnlocked, setVipAdminPreviewUnlocked] = useState(false);
const isPartVipOnly = (part) => {
    if (!part) return false;
    const pid = String(part.id || '').trim();
    if (siteSettings?.partExtraMeta?.[pid]?.isVipOnly !== undefined) {
      return Boolean(siteSettings.partExtraMeta[pid].isVipOnly);
    }
    return Boolean(part.isVipOnly || part.customGroupPrices?._isVipOnly);
  };
const togglePartVipOnly = (partObj, e) => {
    if (e) e.stopPropagation();
    if (!partObj || !partObj.id) return;
    const pid = String(partObj.id).trim();
    const nextVip = !isPartVipOnly(partObj);
    const defaultVipPrice = Number(partObj.vipPrice || partObj.customGroupPrices?._vipPrice) || Math.max(partObj.costPrice || 0, Math.round(partObj.basePrice * 0.85));

    setParts(prev =>
      prev.map(p => {
        if (String(p.id).trim() !== pid) return p;
        const updatedP = {
          ...p,
          isVipOnly: nextVip,
          vipPrice: defaultVipPrice,
          customGroupPrices: {
            ...(p.customGroupPrices || {}),
            _isVipOnly: nextVip,
            _vipPrice: defaultVipPrice
          }
        };
        markLocalUpsert('parts', updatedP);
        return updatedP;
      })
    );
    saveSiteSettingsImmediate(prev => ({
      ...prev,
      partExtraMeta: {
        ...(prev.partExtraMeta || {}),
        [pid]: {
          ...(prev.partExtraMeta?.[pid] || {}),
          isVipOnly: nextVip,
          vipPrice: defaultVipPrice
        }
      }
    }));
    showToast(
      nextVip
        ? `👑 تم تخصيص "${partObj.name}" لعملاء الرابط السري VIP بسعر خاص (${defaultVipPrice} ج.م) ✓`
        : `تمت إعادة "${partObj.name}" للكتالوج العام ✓`,
      'info'
    );
  };
useEffect(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      if (refParam) {
        window.sessionStorage.setItem('elzoghbi_referral_code', refParam.trim().toUpperCase());
      }
      if (path === '/vip' || path.endsWith('/vip') || params.get('tab') === 'vip' || params.get('vip')) {
        window.sessionStorage.setItem('elzoghbi_vip_secret_unlocked', '1');
        setVipLinkUnlocked(true);
        setClientTab('vip');
      }
    } catch (e) {}
  }, []);
const [selectedQualityTiers, setSelectedQualityTiers] = useState({});
const getPartQualityTiers = (part, basePriceEgp) => {
    const qualityFlag = useFlag('quality_tiers');
    const origPrice = Number(
      siteSettings?.partExtraMeta?.[part?.id]?.tierOriginalPrice ||
      part?.customGroupPrices?._tierOriginalPrice ||
      part?.tierOriginalPrice ||
      basePriceEgp ||
      part?.basePrice ||
      100
    );
    const firstRatio = (Number(siteSettings.tierFirstClassRatio) || 60) / 100;
    const econRatio = (Number(siteSettings.tierEconomyRatio) || 35) / 100;

    const firstPrice = Number(
      siteSettings?.partExtraMeta?.[part?.id]?.tierFirstClassPrice ||
      part?.customGroupPrices?._tierFirstClassPrice ||
      part?.tierFirstClassPrice ||
      Math.max(10, Math.round(origPrice * firstRatio))
    );
    const econPrice = Number(
      siteSettings?.partExtraMeta?.[part?.id]?.tierEconomyPrice ||
      part?.customGroupPrices?._tierEconomyPrice ||
      part?.tierEconomyPrice ||
      Math.max(5, Math.round(origPrice * econRatio))
    );

    if (!qualityFlag.enabled) {
      return [
        { id: 'original', label: siteSettings.tierOriginalLabel || 'أصلي 100%', shortLabel: 'أصلي', priceEgp: origPrice, badge: '' }
      ];
    }

    return [
      { id: 'original', label: siteSettings.tierOriginalLabel || 'أصلي 100%', shortLabel: 'أصلي', priceEgp: origPrice, badge: '' },
      { id: 'first_class', label: siteSettings.tierFirstClassLabel || 'فرز أول', shortLabel: 'فرز أول', priceEgp: firstPrice, badge: '⭐' },
      { id: 'economy', label: siteSettings.tierEconomyLabel || 'اقتصادي', shortLabel: 'اقتصادي', priceEgp: econPrice, badge: '💡' }
    ];
  };
useEffect(() => {
    if (!useFlag('quality_tiers').enabled) {
      setSelectedQualityTiers({});
    }
  }, [siteSettings.enableQualityTiers]);
const [exitIntentModalOpen, setExitIntentModalOpen] = useState(false);
const [exitIntentContactInput, setExitIntentContactInput] = useState('');
const pageLoadedAtRef = useRef(Date.now());
const hasInteractedWithCartRef = useRef(false);
const hasCompletedOrderInSessionRef = useRef(false);
useEffect(() => {
    const cartKeys = Object.keys(cart || {});
    if (cartKeys.length > 0) {
      hasInteractedWithCartRef.current = true;
    }
  }, [cart, cartDrawerOpen, clientTab]);
const canTriggerExitIntentNow = () => {
    if (appPortal === 'admin' || !useFlag('exit_intent_popup').enabled) return false;
    if (hasCompletedOrderInSessionRef.current) return false;
    const cartItemCount = Object.values(cart || {}).reduce((s, it) => s + (Number(it?.qty) || 0), 0);
    if (cartItemCount <= 0) return false;
    if (Date.now() - pageLoadedAtRef.current < 10000) return false;

    const cooldownHours = Math.max(1, Number(siteSettings.exitIntentCooldownHours) || 24);
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const uKey = currentClient?.id || currentClient?.phone || 'visitor';
    const lastShownTs = Number(siteSettings?.exitIntentShownMap?.[uKey] || 0);
    if (lastShownTs > 0 && (Date.now() - lastShownTs) < cooldownMs) return false;
    try {
      const localTs = Number(window.localStorage.getItem(`elzoghbi_exit_24h_${uKey}`) || 0);
      if (localTs > 0 && (Date.now() - localTs) < cooldownMs) return false;
    } catch (e) {}
    return true;
  };
const markExitIntentTriggered24h = () => {
    const uKey = currentClient?.id || currentClient?.phone || 'visitor';
    const nowTs = Date.now();
    try {
      window.localStorage.setItem(`elzoghbi_exit_24h_${uKey}`, String(nowTs));
    } catch (e) {}
    saveSiteSettingsImmediate(prev => ({
      ...prev,
      exitIntentShownMap: {
        ...(prev.exitIntentShownMap || {}),
        [uKey]: nowTs
      }
    }));
  };
useEffect(() => {
    if (appPortal === 'admin' || !useFlag('exit_intent_popup').enabled) {
      setExitIntentModalOpen(false);
      return undefined;
    }

    const handleMouseLeave = (e) => {
      if (e.clientY <= 8 && canTriggerExitIntentNow()) {
        markExitIntentTriggered24h();
        playAppNotificationSound('alert');
        setExitIntentModalOpen(true);
      }
    };

    const idleSec = Math.max(15, Number(siteSettings.exitIntentMobileIdleSec) || 30);
    let mobileIdleTimer = null;
    const resetMobileIdle = () => {
      if (mobileIdleTimer) clearTimeout(mobileIdleTimer);
      mobileIdleTimer = setTimeout(() => {
        if (window.innerWidth <= 1024 && canTriggerExitIntentNow()) {
          markExitIntentTriggered24h();
          playAppNotificationSound('alert');
          setExitIntentModalOpen(true);
        }
      }, idleSec * 1000);
    };

    const handlePopStateExit = () => {
      if (canTriggerExitIntentNow()) {
        markExitIntentTriggered24h();
        playAppNotificationSound('alert');
        setExitIntentModalOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchstart', resetMobileIdle, { passive: true });
    window.addEventListener('scroll', resetMobileIdle, { passive: true });
    window.addEventListener('popstate', handlePopStateExit);
    resetMobileIdle();

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', resetMobileIdle);
      window.removeEventListener('scroll', resetMobileIdle);
      window.removeEventListener('popstate', handlePopStateExit);
      if (mobileIdleTimer) clearTimeout(mobileIdleTimer);
    };
  }, [appPortal, siteSettings.enableExitIntentPopup, siteSettings.exitIntentMobileIdleSec, cart, currentClient?.id]);
const handleApplyExitIntentOffer = async () => {
    if (!useFlag('exit_intent_popup').enabled) {
      setExitIntentModalOpen(false);
      return;
    }
    const contactStr = normalizeDigits(exitIntentContactInput || currentClient?.phone || '').trim() || String(exitIntentContactInput || currentClient?.email || '').trim();
    if (!currentClient && contactStr.length < 10 && !contactStr.includes('@')) {
      showToast('⚠️ اكتب رقم موبايلك أو إيميلك الأول لتفعيل كوبون الخصم الفوري!', 'warning');
      return;
    }
    const codeStr = String(siteSettings.exitIntentPromoCode || 'STAY5').trim().toUpperCase();
    const pctVal = Number(siteSettings.exitIntentDiscountPct) || 5;
    const durationMins = Math.max(5, Number(siteSettings.exitIntentDurationMinutes) || 15);
    const userKey = currentClient?.id || contactStr;

    const exitPromo = {
      id: `prm_exit_${codeStr}_${userKey}`,
      code: codeStr,
      type: 'percentage',
      value: pctVal,
      maxDiscountCap: 350,
      minOrderAmount: 0,
      usageLimit: 1,
      maxUsesPerUser: 1,
      assignedUserId: userKey,
      sourceFeature: 'exit_intent_popup',
      usedCount: 0,
      expiryDate: new Date(Date.now() + durationMins * 60 * 1000 + 86400000).toISOString().slice(0, 10),
      description: `خصم نافذة الخروج الذكية (-${pctVal}%) صالح لمدة ${durationMins} دقيقة`,
      active: true
    };
    setPromoCodeInput(codeStr);
    setAppliedPromo(exitPromo);
    recordRecoveredCartEvent(cartSummary?.subtotalBase || 300);
    setExitIntentModalOpen(false);
    showToast(`🎁 تم تفعيل خصم ${pctVal}% الفوري (${codeStr}) على سلتك!`, 'success');
  };
const getClientLoyaltyStatus = (clientObj) => {
    const silverMinSpent = Math.max(500, Number(siteSettings.loyaltySilverMinSpentEgp) || 5000);
    const goldMinSpent = Math.max(silverMinSpent + 1000, Number(siteSettings.loyaltyGoldMinSpentEgp) || 15000);
    const diamondMinSpent = Math.max(goldMinSpent + 1000, Number(siteSettings.loyaltyDiamondMinSpentEgp) || 30000);

    const silverDiscPct = Math.max(0, Number(siteSettings.loyaltySilverDiscountPct) || 3);
    const goldDiscPct = Math.max(0, Number(siteSettings.loyaltyGoldDiscountPct) || 7);
    const diamondDiscPct = Math.max(0, Number(siteSettings.loyaltyDiamondDiscountPct) || 12);

    const deliveredOrders = clientObj
      ? orders.filter(o => String(o.clientId) === String(clientObj.id) && (o.status === 'تم التسليم' || o.status === 'Delivered'))
      : [];
    const deliveredCount = deliveredOrders.length;

    const grossDeliveredSpent = deliveredOrders.reduce((sum, ord) => {
      const itemsSum = (ord.items || []).reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.unitPriceBase) || 0), 0);
      return sum + Math.max(0, itemsSum - (Number(ord.discountBase) || 0));
    }, 0);

    const approvedReturnsTotal = clientObj
      ? returnsList
          .filter(r => String(r.clientId) === String(clientObj.id) && r.status === 'مقبول')
          .reduce((s, r) => s + (Number(r.refundAmountBase) || 0), 0)
      : 0;

    const netPaidSpentEgp = Math.max(0, grossDeliveredSpent - approvedReturnsTotal, Number(clientObj?.totalPaidSpent) || 0);

    const tiers = [
      { idx: 0, id: 'bronze', name: 'برونزي', icon: '🥉', minSpentEgp: 0, minOrders: 0, autoDiscountPct: 0, bonusCashbackPct: 0, freeShipping: false, color: 'from-amber-700 to-orange-800', badgeBg: 'bg-amber-600/20 text-amber-500 border-amber-500/40' },
      { idx: 1, id: 'silver', name: 'فضي', icon: '🥈', minSpentEgp: silverMinSpent, minOrders: 5, autoDiscountPct: silverDiscPct, bonusCashbackPct: 1, freeShipping: false, color: 'from-slate-400 to-slate-600', badgeBg: 'bg-slate-400/20 text-slate-300 border-slate-400/40' },
      { idx: 2, id: 'gold', name: 'ذهبي', icon: '🥇', minSpentEgp: goldMinSpent, minOrders: 12, autoDiscountPct: goldDiscPct, bonusCashbackPct: 2, freeShipping: false, color: 'from-amber-400 to-yellow-600', badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/40' },
      { idx: 3, id: 'diamond', name: 'ألماسي', icon: '', minSpentEgp: diamondMinSpent, minOrders: 20, autoDiscountPct: diamondDiscPct, bonusCashbackPct: 3, freeShipping: true, color: 'from-slate-400 to-slate-600', badgeBg: 'bg-slate-400/20 text-[#2997FF] border-[#0071E3]/40' }
    ];

    let effectiveTierIdx = 0;
    if (netPaidSpentEgp >= diamondMinSpent) effectiveTierIdx = 3;
    else if (netPaidSpentEgp >= goldMinSpent) effectiveTierIdx = 2;
    else if (netPaidSpentEgp >= silverMinSpent) effectiveTierIdx = 1;

    const currentTier = tiers[effectiveTierIdx];
    const nextTier = tiers[Math.min(3, effectiveTierIdx + 1)];
    const remainingSpentToNextTier = effectiveTierIdx < 3
      ? Math.max(0, nextTier.minSpentEgp - netPaidSpentEgp)
      : 0;
    const progressToDiamondPct = Math.min(100, Math.round((netPaidSpentEgp / diamondMinSpent) * 100));

    return {
      deliveredCount,
      netPaidSpentEgp,
      currentTier,
      nextTier: effectiveTierIdx < 3 ? nextTier : null,
      remainingSpentToNextTier,
      ordersToNextTier: effectiveTierIdx < 3 ? Math.max(1, Math.ceil(remainingSpentToNextTier / 1000)) : 0,
      progressToDiamondPct,
      diamondMin: diamondMinSpent,
      daysSinceLastOrder: 0,
      wasDowngraded: false,
      tiers
    };
  };
const [restockNotifyModalPart, setRestockNotifyModalPart] = useState(null);
const [restockVisitorName, setRestockVisitorName] = useState('');
const [restockVisitorPhone, setRestockVisitorPhone] = useState('');
const [adminRestockWhatsappPart, setAdminRestockWhatsappPart] = useState(null);
const [notifiedPartIds, setNotifiedPartIds] = useState(() => {
    try {
      const raw = window.localStorage.getItem('elzoghbi_notified_parts_v1');
      if (raw) return JSON.parse(raw) || {};
    } catch (e) {}
    return {};
  });
const hasCustomerRegisteredRestock = (partObj) => {
    if (!partObj || !partObj.id) return false;
    const pid = String(partObj.id);
    if (notifiedPartIds && notifiedPartIds[pid]) return true;
    const myPhone = normalizeDigits(currentClient?.phone || '').trim();
    if (myPhone.length >= 10 && Array.isArray(siteSettings.restockWaitlist)) {
      return siteSettings.restockWaitlist.some(
        w => String(w.partId) === pid && normalizeDigits(w.phone || '').trim() === myPhone
      );
    }
    return false;
  };
const getPartWaitlistEntries = (partId) => {
    const list = Array.isArray(siteSettings.restockWaitlist) ? siteSettings.restockWaitlist : [];
    return list.filter(w => String(w.partId) === String(partId));
  };
const openCustomerRestockModal = (partObj) => {
    if (!partObj) return;
    if (hasCustomerRegisteredRestock(partObj)) {
      showToast(`✅ تم تسجيل طلب تنبيهك للمنتج "${partObj.name}" بالفعل! سنراسلك على واتساب فور توفره.`, 'info');
      return;
    }
    setRestockVisitorName(currentClient?.name || '');
    setRestockVisitorPhone(currentClient?.phone || '');
    setRestockNotifyModalPart(partObj);
  };
const handleSubmitCustomerRestockNotify = (e) => {
    if (e) e.preventDefault();
    if (!restockNotifyModalPart) return;
    const pid = String(restockNotifyModalPart.id);
    const cleanPhone = normalizeDigits(restockVisitorPhone).trim();
    if (cleanPhone.length < 10) {
      showToast('اكتب رقم واتساب صحيح (11 رقم) عشان نبعتلك رسالة أول ما المنتج يتوفر!', 'warning');
      return;
    }
    const existingList = Array.isArray(siteSettings.restockWaitlist) ? siteSettings.restockWaitlist : [];
    const alreadyInList = existingList.some(
      w => String(w.partId) === pid && normalizeDigits(w.phone || '').trim() === cleanPhone
    );

    const nextNotifiedMap = { ...(notifiedPartIds || {}), [pid]: cleanPhone };
    setNotifiedPartIds(nextNotifiedMap);
    try {
      window.localStorage.setItem('elzoghbi_notified_parts_v1', JSON.stringify(nextNotifiedMap));
    } catch (err) {}

    if (alreadyInList || hasCustomerRegisteredRestock(restockNotifyModalPart)) {
      setRestockNotifyModalPart(null);
      showToast(`✅ رقمك (${cleanPhone}) مسجل بالفعل في قائمة انتظار "${restockNotifyModalPart.name}" ولن يتكرر العد!`, 'info');
      return;
    }

    const cleanName = String(restockVisitorName || currentClient?.name || 'عميل مميز').trim();
    const newEntry = {
      id: `wait_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      partId: restockNotifyModalPart.id,
      partName: restockNotifyModalPart.name,
      partSku: restockNotifyModalPart.sku || '',
      clientName: cleanName,
      phone: cleanPhone,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      notified: false
    };

    const nextWaitlist = [newEntry, ...existingList];
    const uniquePartWaitCount = nextWaitlist.filter(w => String(w.partId) === pid).length;

    setParts(prev =>
      prev.map(p => {
        if (String(p.id) !== pid) return p;
        const updatedP = { ...p, waitlistCount: uniquePartWaitCount };
        markLocalUpsert('parts', updatedP);
        sbUpsert('spare_parts', updatedP);
        return updatedP;
      })
    );

    const adminRestockNotif = {
      id: `ntf_wait_${Date.now()}`,
      target: 'admin',
      type: 'restock_waitlist',
      title: `🔔 طلب "نبهني عند التوفر": ${restockNotifyModalPart.name}`,
      msg: `العميل "${cleanName}" (${cleanPhone}) يطلب تنبيهه على واتساب فور توفر "${restockNotifyModalPart.name}".`,
      time: 'الآن',
      read: false,
      partId: restockNotifyModalPart.id
    };
    setNotifications(prev => [adminRestockNotif, ...prev]);

    saveSiteSettingsImmediate(prev => {
      const curW = Array.isArray(prev.restockWaitlist) ? prev.restockWaitlist : [];
      const deduped = [newEntry, ...curW.filter(w => !(String(w.partId) === pid && normalizeDigits(w.phone || '').trim() === cleanPhone))];
      return {
        ...prev,
        restockWaitlist: deduped
      };
    });

    // Also persist to Supabase site_settings & restock_waitlist table directly even from customer tab
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (isValid) {
        fetch(`${sbUrl}/rest/v1/restock_waitlist`, {
          method: 'POST',
          headers: sbHeaders(sbKey, { Prefer: 'return=minimal' }),
          body: JSON.stringify([{
            id: newEntry.id,
            part_id: String(newEntry.partId),
            part_name: newEntry.partName,
            client_name: newEntry.clientName,
            phone: newEntry.phone,
            notified: false
          }])
        }).catch(() => {});
      }
    } catch (err) {}

    setRestockNotifyModalPart(null);
    playAppNotificationSound('status');
    showToast(`✅ تم تسجيل طلبك (${cleanPhone}) بنجاح! سنرسل لك رسالة واتساب فور توفر "${restockNotifyModalPart.name}".`, 'success');
  };
const sendAdminRestockWhatsappToEntry = (entryObj) => {
    if (!entryObj) return false;
    // Never tell a customer the product is back when its stock is still 0.
    const partObj = parts.find(p => String(p.id) === String(entryObj.partId));
    if (partObj && (Number(partObj.stock) || 0) <= 0) {
      showToast(`⚠️ "${entryObj.partName}" لسه مخزونه صفر — زوّد المخزون الأول قبل ما تبعت للعملاء إنه اتوفر.`, 'error');
      return false;
    }
    const cleanP = String(entryObj.phone || '').replace(/[^0-9]/g, '');
    const waPhone = cleanP.startsWith('0') ? `2${cleanP}` : cleanP;
    const storeUrl = window.location.origin;
    const msg = `مرحباً ${entryObj.clientName} 👋، خبر سار من ${siteSettings.storeName || 'ELZOGHBI'}! المنتج الذي طلبت تنبيهك عند توفره (${entryObj.partName}) عاد للمخزن الآن بكمية محدودة . اطلبه الآن قبل نفاد الكمية: ${storeUrl}`;
    const win = window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    if (!win) {
      // Browser blocked the popup — do NOT mark the entry as sent.
      showToast('⚠️ المتصفح منع فتح نافذة الواتساب — العميل ده لسه متعلّمش كمُرسل. اسمح بالنوافذ المنبثقة أو ابعتله لوحده.', 'error');
      return false;
    }
    saveSiteSettingsImmediate(prev => ({
      ...prev,
      restockWaitlist: (Array.isArray(prev.restockWaitlist) ? prev.restockWaitlist : []).map(w =>
        w.id === entryObj.id ? { ...w, notified: true } : w
      )
    }));
    return true;
  };
const [familyModalOpen, setFamilyModalOpen] = useState(false);
const [newFamilyOwnerLabel, setNewFamilyOwnerLabel] = useState('اختياراتي الشخصية');
const [newFamilyModelId, setNewFamilyModelId] = useState('');
const [adminFamilyTargetClientId, setAdminFamilyTargetClientId] = useState('');
const [adminFamilyOwnerLabel, setAdminFamilyOwnerLabel] = useState('اختياراتي الشخصية');
const [adminFamilyModelId, setAdminFamilyModelId] = useState('');
const [guestFamilyDevices, setGuestFamilyDevices] = useState(() => {
    try {
      const raw = window.localStorage.getItem('elzoghbi_guest_family_devices');
      if (raw) return JSON.parse(raw) || [];
    } catch (e) {}
    return [];
  });
const activeFamilyDevices = useMemo(() => {
    if (currentClient && Array.isArray(currentClient.savedFamilyDevices)) {
      return currentClient.savedFamilyDevices;
    }
    return guestFamilyDevices;
  }, [currentClient, guestFamilyDevices]);
const handleAddFamilyDevice = (e) => {
    if (e) e.preventDefault();
    const targetMdl = models.find(m => String(m.id) === String(newFamilyModelId)) || models[0];
    if (!targetMdl) return;
    const newDev = {
      id: `fam_${Date.now()}`,
      ownerLabel: newFamilyOwnerLabel || 'اختياراتي الشخصية',
      modelId: targetMdl.id,
      modelName: targetMdl.name,
      addedAt: new Date().toISOString().slice(0, 10)
    };
    if (currentClient) {
      setClients(prev =>
        prev.map(c => {
          if (c.id !== currentClient.id) return c;
          const existingDevs = Array.isArray(c.savedFamilyDevices) ? c.savedFamilyDevices : [];
          if (existingDevs.some(d => String(d.modelId) === String(newDev.modelId) && d.ownerLabel === newDev.ownerLabel)) {
            return c;
          }
          const updated = {
            ...c,
            savedFamilyDevices: [newDev, ...existingDevs]
          };
          markLocalUpsert('clients', updated);
          sbUpsert('clients', updated);
          return updated;
        })
      );
    } else {
      const nextGuest = [newDev, ...guestFamilyDevices];
      setGuestFamilyDevices(nextGuest);
      try { window.localStorage.setItem('elzoghbi_guest_family_devices', JSON.stringify(nextGuest)); } catch (err) {}
    }
    showToast(`👨‍👩‍👧‍👦 تم حفظ "${newDev.ownerLabel} (${newDev.modelName})"! سننبهك فور نزول أي منتج جديد له.`, 'success');
  };
const handleAdminAddClientFamilyDevice = (clientId, ownerLbl, mdlId) => {
    const targetClient = clients.find(c => String(c.id) === String(clientId)) || clients[0];
    const targetMdl = models.find(m => String(m.id) === String(mdlId)) || models[0];
    if (!targetClient || !targetMdl) return;
    const newDev = {
      id: `fam_${Date.now()}`,
      ownerLabel: ownerLbl || 'اختياراتي الشخصية',
      modelId: targetMdl.id,
      modelName: targetMdl.name,
      addedAt: new Date().toISOString().slice(0, 10)
    };
    setClients(prev =>
      prev.map(c => {
        if (String(c.id) !== String(targetClient.id)) return c;
        const updated = {
          ...c,
          savedFamilyDevices: [newDev, ...(Array.isArray(c.savedFamilyDevices) ? c.savedFamilyDevices : [])]
        };
        markLocalUpsert('clients', updated);
        sbUpsert('clients', updated);
        return updated;
      })
    );
    showToast(`👨‍👩‍👧‍👦 تمت إضافة "${newDev.ownerLabel} (${newDev.modelName})" لحساب "${targetClient.name}" بنجاح!`, 'success');
  };
const handleRemoveFamilyDevice = (devId, targetClientId = null) => {
    const cid = targetClientId || currentClient?.id;
    if (cid) {
      setClients(prev =>
        prev.map(c => {
          if (String(c.id) !== String(cid)) return c;
          const updated = {
            ...c,
            savedFamilyDevices: (c.savedFamilyDevices || []).filter(d => d.id !== devId)
          };
          markLocalUpsert('clients', updated);
          sbUpsert('clients', updated);
          return updated;
        })
      );
    } else {
      const nextGuest = guestFamilyDevices.filter(d => d.id !== devId);
      setGuestFamilyDevices(nextGuest);
      try { window.localStorage.setItem('elzoghbi_guest_family_devices', JSON.stringify(nextGuest)); } catch (err) {}
    }
  };
const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
const [warrantyPhoneQuery, setWarrantyPhoneQuery] = useState('');
const [warrantyClaimNotes, setWarrantyClaimNotes] = useState({});
const handleRequestWarrantyReplacement = async (orderObj, itemObj) => {
    if (!orderObj || !itemObj || submittingCustomerActionRef.current) return;
    submittingCustomerActionRef.current = true;
    try {
    const key = `${orderObj.id}_${itemObj.partId}`;
    const noteText = String(warrantyClaimNotes[key] || '').trim() || 'طلب استبدال ضمن فترة الضمان السارية بالرقم';
    const newRet = {
      id: `RET-WAR-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      orderId: orderObj.id,
      clientId: orderObj.clientId || 'guest',
      clientName: orderObj.clientName || 'عميل ضمان بالرقم',
      partId: itemObj.partId,
      partName: itemObj.name,
      qty: 1,
      refundAmountBase: Number(itemObj.unitPriceBase) || 0,
      reason: `[ضمان بالرقم] ${noteText}`,
      warrantyConfirmed: true,
      replies: [],
      closed: false,
      photos: [],
      status: 'قيد المراجعة',
      resolutionType: '',
      adminResponse: '',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    const savedOk = await sbUpsert('returns_list', newRet);
    if (!savedOk) {
      showToast('معلش، طلب الاستبدال ماوصلش للسيرفر. اتأكد من النت وجرّب تاني.', 'error');
      return;
    }
    setReturnsList(prev => [newRet, ...prev]);
    markLocalUpsert('returnsList', newRet);
    setNotifications(prev => [
      {
        id: `ntf_war_${Date.now()}`,
        target: 'admin',
        type: 'return',
        title: `🛡️ طلب استبدال بالضمان (${newRet.id})`,
        msg: `العميل "${orderObj.clientName}" طلب استبدال "${itemObj.name}" من فاتورة ${orderObj.id} ضمن فترة الضمان.`,
        time: 'الآن',
        read: false
      },
      ...prev
    ]);
    showToast(`🛡️ تم إرسال طلب الاستبدال بالضمان (${newRet.id}) للإدارة بنجاح! سنتواصل معك فوراً.`, 'success');
    } finally {
      submittingCustomerActionRef.current = false;
    }
  };
const [referralCodeInput, setReferralCodeInput] = useState(() => {
    try {
      return window.sessionStorage.getItem('elzoghbi_referral_code') || '';
    } catch (e) {
      return '';
    }
  });
const [appliedReferralClient, setAppliedReferralClient] = useState(null);
const hasClientAlreadyUsedReferral = useMemo(() => {
    if (!currentClient) {
      try {
        return window.localStorage.getItem('elzoghbi_ref_used_guest') === '1';
      } catch (e) {
        return false;
      }
    }
    if (currentClient.hasUsedReferralCode) return true;
    try {
      if (window.localStorage.getItem(`elzoghbi_ref_used_${currentClient.id}`) === '1') return true;
    } catch (e) {}
    const previousNonCancelledOrders = orders.filter(
      o => String(o.clientId) === String(currentClient.id) && o.status !== 'ملغي'
    );
    if (previousNonCancelledOrders.length > 0) return true;
    return false;
  }, [currentClient, orders]);
const handleApplyReferralCode = (rawCode) => {
    if (hasClientAlreadyUsedReferral) {
      showToast('كود دعوة الصديق مخصص لأول طلب فقط وقد تم استخدامه مسبقاً.', 'warning');
      return;
    }
    const clean = String(rawCode ?? referralCodeInput).trim().toUpperCase();
    if (!clean) return;
    const refOwner = clients.find(c => {
      const cCode = String(c.referralCode || `REF-${String(c.phone || '').slice(-5)}`).toUpperCase();
      return cCode === clean || String(c.phone || '') === clean;
    });
    if (!refOwner) {
      showToast('كود الدعوة غير صحيح، تأكد من كود صديقك وجرّب مرة أخرى.', 'warning');
      return;
    }
    if (currentClient && String(refOwner.id) === String(currentClient.id)) {
      showToast('لا يمكنك استخدام كود الدعوة الخاص بك لنفسك 😊، شاركه مع أصدقائك!', 'warning');
      return;
    }
    setAppliedReferralClient(refOwner);
    showToast(`🤝 تم ربط كود دعوة صديقك (${refOwner.name}) لأول طلب لك! عند استلام الطلب ستكسبان معاً رصيداً في المحفظة 🎁`, 'success');
  };
const activeBirthdayOrSeasonalBanner = useMemo(() => {
    if (siteSettings.enableBirthdayAndSeasonal === false) return null;
    const today = new Date();
    const tMonth = today.getMonth() + 1;
    const tDay = today.getDate();
    const windowDays = Math.max(1, Number(siteSettings.birthdayWindowDays) || 3);

    if (currentClient && currentClient.birthDate) {
      const partsDate = String(currentClient.birthDate).split('-');
      if (partsDate.length === 3) {
        const bMonth = Number(partsDate[1]);
        const bDay = Number(partsDate[2]);
        const bDateThisYear = new Date(today.getFullYear(), bMonth - 1, bDay);
        const diffDays = Math.round((bDateThisYear - new Date(today.getFullYear(), tMonth - 1, tDay)) / (1000 * 60 * 60 * 24));
        if (Math.abs(diffDays) <= windowDays) {
          return {
            type: 'birthday',
            title: `🎂 كل سنة وأنت طيب يا ${currentClient.name}! عيد ميلادك معانا غير 🎉`,
            subtitle: `هدية عيد ميلادك جاهزة: خصم ${siteSettings.birthdayDiscountPct || 15}% بكود (${siteSettings.birthdayCouponCode || 'BDAY15'})!`,
            code: siteSettings.birthdayCouponCode || 'BDAY15',
            pct: Number(siteSettings.birthdayDiscountPct) || 15
          };
        }
      }
    }

    if (siteSettings.seasonalCampaignActive) {
      return {
        type: 'seasonal',
        title: `${siteSettings.seasonalCampaignName || 'عروض الموسم الحصرية'}`,
        subtitle: `استفد الآن بخصم فوري ${siteSettings.seasonalDiscountPct || 10}% بكود (${siteSettings.seasonalCouponCode || 'SEASON10'}) لفترة محدودة!`,
        code: siteSettings.seasonalCouponCode || 'SEASON10',
        pct: Number(siteSettings.seasonalDiscountPct) || 10
      };
    }
    return null;
  }, [currentClient, siteSettings.enableBirthdayAndSeasonal, siteSettings.birthdayCouponCode, siteSettings.birthdayDiscountPct, siteSettings.birthdayWindowDays, siteSettings.seasonalCampaignActive, siteSettings.seasonalCampaignName, siteSettings.seasonalCouponCode, siteSettings.seasonalDiscountPct]);
const [openFeatureSections, setOpenFeatureSections] = useState({
    profit_shield: false,
    flags: true,
    cashback: false,
    exit_and_sales_cap: false,
    social_spin: false,
    cashier_tiers: false,
    birthday_seasonal: false,
    family_garage: false,
    referral_vip: false,
    repurchase_waitlist: false
  });
const [openCmsSections, setOpenCmsSections] = useState({
    ads: true,
    sourcing_banner: true,
    shortcuts: true,
    showcase_bars: true,
    newsletter: true,
    sections_cats: true
  });
const [adminSidebarMode, setAdminSidebarMode] = useState('expanded');
const [openSidebarGroups, setOpenSidebarGroups] = useState({ 0: true, 1: true, 2: true, 3: true, 4: true });
const [floatingBottomMenuOpen, setFloatingBottomMenuOpen] = useState(false);
const [recentlyViewedIds, setRecentlyViewedIds] = useState(() => {
    try {
      const r = JSON.parse(window.localStorage.getItem('elzoghbi_recent_parts_v1') || '[]');
      return Array.isArray(r) ? r.slice(0, 10) : [];
    } catch (e) {
      return [];
    }
  });
const [storePriceRangeFilter, setStorePriceRangeFilter] = useState('ALL');
const [bulkPriceToolOpen, setBulkPriceToolOpen] = useState(false);
const [bulkPriceMode, setBulkPriceMode] = useState('pct_up');
const [bulkPriceValue, setBulkPriceValue] = useState(5);
const [bulkPriceRound5, setBulkPriceRound5] = useState(true);
const [lastBulkPriceSnapshot, setLastBulkPriceSnapshot] = useState(null);
const recordRecentlyViewedPart = (partId) => {
    if (!partId) return;
    setRecentlyViewedIds(prev => {
      const next = [String(partId), ...prev.filter(id => String(id) !== String(partId))].slice(0, 8);
      try { window.localStorage.setItem('elzoghbi_recent_parts_v1', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
const sharePartViaWhatsApp = (partObj, e) => {
    if (e) e.stopPropagation();
    if (!partObj) return;
    const pInfo = calculatePartPrice(partObj, currentGroup);
    const shareLink = `${window.location.origin}${window.location.pathname}?part=${encodeURIComponent(partObj.id)}`;
    const txt = `شوف المنتج ده على متجر *${siteSettings.storeName || 'ELZOGHBI'}*:\n📦 *${partObj.name}*\n💰 السعر: *${pInfo.displayPrice.toLocaleString()} ${pInfo.currencySymbol}*\n🛡️ الضمان: ${partObj.warrantyText || 'ضمان معتمد'}\n🔗 رابط المنتج المباشر:\n${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank', 'noopener,noreferrer');
  };
const deepLinkOpenedRef = React.useRef(false);
useEffect(() => {
    if (deepLinkOpenedRef.current || !Array.isArray(parts) || parts.length === 0) return;
    try {
      const params = new URLSearchParams(window.location.search || '');
      const sharedPartId = params.get('part');
      if (sharedPartId) {
        const found = parts.find(p => String(p.id) === String(sharedPartId) || String(p.sku) === String(sharedPartId));
        if (found) {
          deepLinkOpenedRef.current = true;
          setSelectedDetailItem({ type: 'part', part: found });
        }
      }
    } catch (e) {}
  }, [parts]);
const toggleCmsSection = (key) => setOpenCmsSections(prev => ({ ...prev, [key]: !prev[key] }));
const [showScrollTopBtn, setShowScrollTopBtn] = useState(false);
useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      setShowScrollTopBtn(y > 320);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
const toggleFeatureSection = (secKey) => {
    setOpenFeatureSections(prev => ({ ...prev, [secKey]: !prev[secKey] }));
  };
const todayIsoDate = new Date().toISOString().slice(0, 10);
const [gmReportPreset, setGmReportPreset] = useState('all');
const [gmReportDateFrom, setGmReportDateFrom] = useState('2026-01-01');
const [gmReportDateTo, setGmReportDateTo] = useState(todayIsoDate);
const [gmReportOrderFilter, setGmReportOrderFilter] = useState('valid_all');
const [gmReportCustomNotes, setGmReportCustomNotes] = useState('');
const [gmReportPrintPreviewOpen, setGmReportPrintPreviewOpen] = useState(false);
const [gmReportSections, setGmReportSections] = useState({
    financialSummary: true,
    ordersStatus: true,
    paymentMethods: true,
    topProducts: true,
    categoriesAndBrands: true,
    clientsAndDebts: true,
    croAndMarketing: true,
    returnsAndWarranty: true,
    inventoryValuation: true,
    restockAndSourcing: true,
    detailedInvoices: true,
    gmRecommendations: true
  });
const handleSelectGmReportPreset = (presetKey) => {
    setGmReportPreset(presetKey);
    // Local (Egypt) calendar days — toISOString is UTC and shifts "today"
    // around midnight; "last 7 days" is today + the 6 before it (= 7 days).
    const toStr = localDayKey(0);
    if (presetKey === 'today') {
      setGmReportDateFrom(toStr);
      setGmReportDateTo(toStr);
    } else if (presetKey === 'yesterday') {
      const y = localDayKey(1);
      setGmReportDateFrom(y);
      setGmReportDateTo(y);
    } else if (presetKey === 'last7') {
      const d7 = localDayKey(6);
      setGmReportDateFrom(d7);
      setGmReportDateTo(toStr);
    } else if (presetKey === 'month') {
      const mStart = `${toStr.slice(0, 7)}-01`;
      setGmReportDateFrom(mStart);
      setGmReportDateTo(toStr);
    } else if (presetKey === 'all') {
      setGmReportDateFrom('2020-01-01');
      setGmReportDateTo('2030-12-31');
    }
  };
const currentCurrency = useMemo(() => {
    return currencies[currentGroup.currency] || currencies.EGP;
  }, [currentGroup, currencies]);
const vipMinOrders = Math.max(1, Number(siteSettings.vipMinOrdersRequired) || 3);
const clientCompletedOrderCount = useMemo(() => {
    if (!currentClient) return 0;
    const deliveredInOrders = orders.filter(
      o => String(o.clientId) === String(currentClient.id) && (o.status === 'تم التسليم' || o.status === 'Delivered')
    ).length;
    return Math.max(Number(currentClient.orderCount) || 0, deliveredInOrders);
  }, [currentClient, orders]);
const vipRequiredSpentEgp = Math.max(1000, Number(siteSettings.vipMinSpentEgp) || Number(siteSettings.loyaltyGoldMinSpentEgp) || 15000);
const isCurrentClientVip = useMemo(() => {
    if (!useFlag('vip_secret_route').enabled) return false;
    if (appPortal === 'admin' || adminAuthenticated || vipAdminPreviewUnlocked) return true;
    if (!currentClient) return false;
    if (currentClient.isVip || String(currentClient.groupId || '').includes('vip')) return true;
    const loyaltyInfo = getClientLoyaltyStatus(currentClient);
    return loyaltyInfo.netPaidSpentEgp >= vipRequiredSpentEgp || loyaltyInfo.currentTier.idx >= 2;
  }, [appPortal, adminAuthenticated, vipAdminPreviewUnlocked, currentClient, orders, returnsList, vipRequiredSpentEgp, siteSettings.enableVipSecretRoute]);
const calculatePartPrice = (part, groupObj = currentGroup, overrideTierId = null) => {
    let baseEgpPrice = Number(part.basePrice) || 0;
    const vipSpecial = Number(part.vipPrice || part.customGroupPrices?._vipPrice || siteSettings?.partExtraMeta?.[part.id]?.vipPrice || 0);
    const rawCustomPrice = (isCurrentClientVip && vipSpecial > 0 && (clientTab === 'vip' || isPartVipOnly(part)))
      ? vipSpecial
      : (part.customGroupPrices && groupObj ? part.customGroupPrices[groupObj.id] : undefined);
    const hasCustomOverride = rawCustomPrice !== undefined && rawCustomPrice !== null && rawCustomPrice !== '' && Number(rawCustomPrice) > 0;

    if (hasCustomOverride) {
      baseEgpPrice = Number(rawCustomPrice);
    } else if (!groupObj.isDefault && groupObj.modifierType !== 'none') {
      if (groupObj.modifierType === 'percentage') {
        baseEgpPrice = Math.round(part.basePrice * (1 + Number(groupObj.modifierValue) / 100));
      } else if (groupObj.modifierType === 'flat') {
        baseEgpPrice = Math.round(part.basePrice + Number(groupObj.modifierValue));
      }
    }

    // Margin Safety Guard: a group modifier must never push the price
    // below zero (e.g. a flat −250 modifier on a cheap product).
    if (baseEgpPrice < 0) baseEgpPrice = 0;
    const isBelowCost = baseEgpPrice < part.costPrice;
    const curr = currencies[groupObj.currency] || currencies.EGP;
    const displayPrice = Number((baseEgpPrice * curr.rateFromBase).toFixed(curr.code === 'EGP' ? 0 : 2));

    // Old Price (سعر قبل الخصم) calculation — only shown when > basePrice and > 0
    const rawOldBase = Number(
      part?.oldPrice ||
      part?.customGroupPrices?._oldPrice ||
      siteSettings?.partExtraMeta?.[part?.id]?.oldPrice ||
      0
    );
    const hasValidOldPrice = rawOldBase > 0 && rawOldBase > (Number(part?.basePrice) || 0) && rawOldBase > baseEgpPrice;
    const priceRatio = (Number(part?.basePrice) || 0) > 0 ? (baseEgpPrice / Number(part.basePrice)) : 1;
    const effectiveOldEgp = hasValidOldPrice ? Math.round(rawOldBase * Math.max(1, priceRatio)) : 0;
    const displayOldPrice = hasValidOldPrice
      ? Number((effectiveOldEgp * curr.rateFromBase).toFixed(curr.code === 'EGP' ? 0 : 2))
      : 0;
    const discountPercent = (hasValidOldPrice && displayOldPrice > displayPrice)
      ? Math.max(1, Math.min(95, Math.round(((displayOldPrice - displayPrice) / displayOldPrice) * 100)))
      : 0;

    return {
      baseEgpPrice,
      displayPrice,
      oldBaseEgpPrice: rawOldBase,
      displayOldPrice,
      discountPercent,
      hasDiscount: discountPercent > 0 && displayOldPrice > displayPrice,
      currencySymbol: curr.symbol,
      currencyCode: curr.code,
      isBelowCost,
      hasCustomOverride
    };
  };
const formatMoney = (baseEgpAmount, groupObj = currentGroup) => {
    const curr = currencies[groupObj?.currency || 'EGP'] || currencies.EGP;
    const val = Number((baseEgpAmount * curr.rateFromBase).toFixed(curr.code === 'EGP' ? 0 : 2));
    return `${val.toLocaleString()} ${curr.symbol}`;
  };
const handleSwitchRole = (newRole) => {
    const normalizedRole =
      newRole === 'client_1' ? 'cli_1' :
      newRole === 'client_2' ? 'cli_2' :
      newRole === 'client_3' ? 'cli_3' : newRole;

    if (normalizedRole === 'admin') {
      switchPortal('admin');
      return;
    }

    if (!String(normalizedRole).startsWith('cli_')) clientRpcPassRef.current = '';
    setActiveRole(normalizedRole);
    switchPortal('storefront');
    const targetClient = clients.find(c => c.id === normalizedRole);
    showToast(
      targetClient
        ? `أهلاً بيك "${targetClient.name}" في ${siteSettings.storeName || 'ELZOGHBI'} — الأسعار والسلة اتحدّثت على حسابك.`
        : 'إنت دلوقتي داخل المتجر كزائر (تقدر تسجّل دخول أو تطلب فتح حساب جديد).',
      'info'
    );
  };
const updateCartQty = (partId, delta) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    setCart(prev => {
      const existing = prev[partId]?.qty || 0;
      const nextQty = existing + delta;

      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[partId];
        return copy;
      }

      if (part.soldOut && delta > 0) {
        showToast('المنتج ده تم بيعه.', 'warning');
        return prev;
      }

      if (nextQty > part.stock) {
        showToast(`معلش، الكمية المتاحة في المخزن من "${part.name}" هي ${part.stock} قطع بس.`, 'warning');
        return prev;
      }

      const maxOrderQtyCap = Number(part.maxOrderQty) || 0;
      if (maxOrderQtyCap > 0 && nextQty > maxOrderQtyCap) {
        showToast(`معلش، الحد الأقصى لطلب "${part.name}" هو ${maxOrderQtyCap} قطع في الطلب الواحد.`, 'warning');
        return prev;
      }

      const chosenColor = selectedColors[partId] || prev[partId]?.color || part.colors[0] || 'قياسي';
      const chosenTier = selectedQualityTiers[partId] || prev[partId]?.qualityTier || 'original';
      return {
        ...prev,
        [partId]: { qty: nextQty, color: chosenColor, qualityTier: chosenTier }
      };
    });
  };
const setCartQtyDirect = (partId, rawValue) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;
    let qty = parseInt(normalizeDigits(rawValue).replace(/[^\d]/g, ''), 10);
    if (isNaN(qty) || qty < 0) qty = 0;
    const directMaxCap = Number(part.maxOrderQty) || 0;
    if (directMaxCap > 0 && qty > directMaxCap) {
      showToast(`معلش، الحد الأقصى لطلب "${part.name}" هو ${directMaxCap} قطع في الطلب الواحد.`, 'warning');
      qty = directMaxCap;
    }
    if (qty > part.stock) {
      showToast(`معلش، المتاح في المخزن من "${part.name}" هو ${part.stock} قطع بس.`, 'warning');
      qty = part.stock;
    }
    setCart(prev => {
      if (qty <= 0) {
        const copy = { ...prev };
        delete copy[partId];
        return copy;
      }
      const chosenColor = selectedColors[partId] || prev[partId]?.color || part.colors[0] || 'قياسي';
      const chosenTier = selectedQualityTiers[partId] || prev[partId]?.qualityTier || 'original';
      return { ...prev, [partId]: { qty, color: chosenColor, qualityTier: chosenTier } };
    });
  };
const handleWaitlistRequest = (partId) => {
    setParts(prev =>
      prev.map(p => (p.id === partId ? { ...p, waitlistCount: p.waitlistCount + 1 } : p))
    );
    showToast('سجّلنا طلبك في قايمة الانتظار! هنبعتلك إشعار أول ما الشحنة توصل المخزن.', 'success');
  };
const settingsNetTimerRef = useRef(null);
const settingsNetPayloadRef = useRef(null);
const flushSettingsNetworkPost = () => {
    const p = settingsNetPayloadRef.current;
    settingsNetPayloadRef.current = null;
    if (!p) return;
    fetch(`${p.sbUrl}/rest/v1/site_settings?on_conflict=id`, {
      method: 'POST',
      headers: sbHeaders(p.sbKey, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify([{
        id: 'main',
        settings: p.settings,
        currencies: p.currencies,
        notifications: p.notifications,
        updated_at: new Date().toISOString()
      }])
    }).then(r => {
      if (!r.ok) showToast('لم تُحفظ الإعدادات في السيرفر — هترجع زي ما كانت بعد التحديث. حاول تاني.', 'error');
    }).catch(() => {
      showToast('لم تُحفظ الإعدادات في السيرفر — تعذر الاتصال بالشبكة. حاول تاني.', 'error');
    });
    if (p.changedFlagRows && p.changedFlagRows.length > 0) {
      fetch(`${p.sbUrl}/rest/v1/feature_flags?on_conflict=key`, {
        method: 'POST',
        headers: sbHeaders(p.sbKey, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify(p.changedFlagRows)
      }).catch(() => {});
    }
  };
const saveSiteSettingsImmediate = (updater) => {
    setSiteSettings(prev => {
      const rawNext = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const nowTs = Date.now();
      const next = { ...rawNext, _updatedAt: nowTs };

      if (homeElRef && homeElRef.current) homeElRef.current = null;
      if (searchElRef && searchElRef.current) searchElRef.current = null;
      if (next.enableQualityTiers === false) {
        setSelectedQualityTiers({});
      }

      try {
        sessionStorage.removeItem('hm_local_settings_v8');
        invalidateSessionTableCache();
        window.localStorage.setItem('elzoghbi_v2_siteSettings', JSON.stringify(next));
        window.localStorage.setItem('elzoghbi_live_flags_ping', JSON.stringify({ settings: next, ts: nowTs }));
        window.localStorage.setItem('elzoghbi_cache_bust_ts', String(nowTs));

        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('elzoghbi_live_flags_channel');
          bc.postMessage({ type: 'SITE_SETTINGS_UPDATED', settings: next, senderTabId: myTabId, ts: nowTs });
          bc.close();
        }

        const { sbUrl, sbKey, isValid } = getSupabaseConfig();
        if (isValid) {
          // Coalesce rapid successive saves (per-keystroke text edits fire this
          // function on every character): only the LATEST settings snapshot is
          // posted to the server, 900ms after the burst settles. Previously each
          // keystroke posted the whole object and the concurrent upserts raced,
          // so an early/empty snapshot could land last and wipe the final text.
          const changedFlagRows = [];
          Object.entries(FLAG_KEY_TO_SETTING_KEY).forEach(([flagKey, sKey]) => {
            if (prev[sKey] !== next[sKey]) {
              changedFlagRows.push({
                key: flagKey,
                enabled: next[sKey] !== false,
                updated_at: new Date().toISOString()
              });
            }
          });
          settingsNetPayloadRef.current = { sbUrl, sbKey, settings: next, currencies, notifications, changedFlagRows };
          if (settingsNetTimerRef.current) clearTimeout(settingsNetTimerRef.current);
          settingsNetTimerRef.current = setTimeout(flushSettingsNetworkPost, 900);
        }
      } catch (e) {}
      return next;
    });
  };
const hiddenBrandsSet = useMemo(
    () => new Set((Array.isArray(siteSettings.hiddenBrands) ? siteSettings.hiddenBrands : []).map(b => String(b || '').trim().toLowerCase()).filter(Boolean)),
    [siteSettings.hiddenBrands]
  );
const hiddenModelIdsSet = useMemo(
    () => new Set((Array.isArray(siteSettings.hiddenModelIds) ? siteSettings.hiddenModelIds : []).map(id => String(id || '').trim()).filter(Boolean)),
    [siteSettings.hiddenModelIds]
  );
const hiddenPartIdsSet = useMemo(
    () => new Set((Array.isArray(siteSettings.hiddenPartIds) ? siteSettings.hiddenPartIds : []).map(id => String(id || '').trim()).filter(Boolean)),
    [siteSettings.hiddenPartIds]
  );
const hiddenCategoriesSet = useMemo(
    () => new Set((Array.isArray(siteSettings.hiddenCategories) ? siteSettings.hiddenCategories : []).map(c => String(c || '').trim().toLowerCase()).filter(Boolean)),
    [siteSettings.hiddenCategories]
  );
const isBrandHidden = (brandName) => {
    if (!brandName) return false;
    return hiddenBrandsSet.has(String(brandName).trim().toLowerCase());
  };
const isModelHidden = (modelObjOrId) => {
    if (!modelObjOrId) return false;
    if (typeof modelObjOrId === 'object') {
      if (modelObjOrId.hidden) return true;
      if (hiddenModelIdsSet.has(String(modelObjOrId.id || '').trim())) return true;
      if (modelObjOrId.brand && isBrandHidden(modelObjOrId.brand)) return true;
      return false;
    }
    const mid = String(modelObjOrId).trim();
    if (hiddenModelIdsSet.has(mid)) return true;
    const mObj = models.find(m => String(m.id).trim() === mid);
    if (mObj && (mObj.hidden || isBrandHidden(mObj.brand))) return true;
    return false;
  };
const isCategoryHidden = (catName) => {
    if (!catName) return false;
    return hiddenCategoriesSet.has(String(catName).trim().toLowerCase());
  };
const toggleHideBrand = (brandName, e) => {
    if (e) e.stopPropagation();
    const cleanB = String(brandName || '').trim();
    if (!cleanB) return;
    const currentlyHidden = isBrandHidden(cleanB);
    saveSiteSettingsImmediate(prev => {
      const list = Array.isArray(prev.hiddenBrands) ? [...prev.hiddenBrands] : [];
      const nextList = currentlyHidden
        ? list.filter(x => String(x || '').trim().toLowerCase() !== cleanB.toLowerCase())
        : Array.from(new Set([...list, cleanB]));
      return { ...prev, hiddenBrands: nextList };
    });
    if (!currentlyHidden && selectedBrand === cleanB) {
      setSelectedBrand('ALL');
      setSelectedModelId('ALL');
    }
    showToast(
      currentlyHidden
        ? `👁️ تم إظهار براند "${cleanB}" وجميع موديلاته ومنتجاته في واجهة العميل ✓`
        : `🚫 تم إخفاء براند "${cleanB}" وجميع موديلاته ومنتجاته بالكامل من واجهة العميل والـ Popup ✓`,
      'info'
    );
  };
const toggleHideModel = (modelObj, e) => {
    if (e) e.stopPropagation();
    if (!modelObj || !modelObj.id) return;
    const mid = String(modelObj.id).trim();
    const currentlyHidden = hiddenModelIdsSet.has(mid) || !!modelObj.hidden;
    setModels(prev => prev.map(m => (String(m.id) === mid ? { ...m, hidden: !currentlyHidden } : m)));
    saveSiteSettingsImmediate(prev => {
      const list = Array.isArray(prev.hiddenModelIds) ? [...prev.hiddenModelIds] : [];
      const nextList = currentlyHidden
        ? list.filter(x => String(x || '').trim() !== mid)
        : Array.from(new Set([...list, mid]));
      return { ...prev, hiddenModelIds: nextList };
    });
    if (!currentlyHidden && String(selectedModelId) === mid) {
      setSelectedModelId('ALL');
    }
    showToast(
      currentlyHidden
        ? `👁️ تم إظهار موديل "${modelObj.name}" ومنتجاته في واجهة العميل ✓`
        : `🚫 تم إخفاء موديل "${modelObj.name}" ومنتجاته بالكامل من واجهة العميل والـ Popup ✓`,
      'info'
    );
  };
const toggleHidePart = (partObj, e) => {
    if (e) e.stopPropagation();
    if (!partObj || !partObj.id) return;
    const pid = String(partObj.id).trim();
    const currentlyHidden = hiddenPartIdsSet.has(pid) || !!partObj.hidden || !!partObj.customGroupPrices?._hidden;
    const nextHidden = !currentlyHidden;
    setParts(prev =>
      prev.map(p =>
        String(p.id) === pid
          ? {
              ...p,
              hidden: nextHidden,
              customGroupPrices: { ...(p.customGroupPrices || {}), _hidden: nextHidden }
            }
          : p
      )
    );
    saveSiteSettingsImmediate(prev => {
      const list = Array.isArray(prev.hiddenPartIds) ? [...prev.hiddenPartIds] : [];
      const nextList = currentlyHidden
        ? list.filter(x => String(x || '').trim() !== pid)
        : Array.from(new Set([...list, pid]));
      return { ...prev, hiddenPartIds: nextList };
    });
    showToast(
      currentlyHidden
        ? `👁️ تم إظهار المنتج "${partObj.name}" في واجهة العميل ✓`
        : `🚫 تم إخفاء المنتج "${partObj.name}" من واجهة العميل ✓`,
      'info'
    );
  };
const toggleHideCategory = (catName, e) => {
    if (e) e.stopPropagation();
    const cleanCat = String(catName || '').trim();
    if (!cleanCat) return;
    const currentlyHidden = isCategoryHidden(cleanCat);
    saveSiteSettingsImmediate(prev => {
      const list = Array.isArray(prev.hiddenCategories) ? [...prev.hiddenCategories] : [];
      const nextList = currentlyHidden
        ? list.filter(x => String(x || '').trim().toLowerCase() !== cleanCat.toLowerCase())
        : Array.from(new Set([...list, cleanCat]));
      return { ...prev, hiddenCategories: nextList };
    });
    if (!currentlyHidden && selectedCategory === cleanCat) {
      setSelectedCategory('ALL');
    }
    showToast(
      currentlyHidden
        ? `👁️ تم إظهار تصنيف "${cleanCat}" في واجهة العميل والبحث ✓`
        : `🚫 تم إخفاء تصنيف "${cleanCat}" من واجهة العميل والبحث ✓`,
      'info'
    );
  };
const categoryEmoji = cat => {
    // Same classifier as the category icons, so the emoji always matches the icon.
    const EMOJI = { smartphone: '📱', laptop: '💻', tablet: '📲', headphones: '🎧', headset: '🎙️', watch: '⌚', cable: '🔌', charger: '🔌', battery: '🔋', screen: '🖥️', camera: '📷', speaker: '🔊', gaming: '🎮', protection: '🛡️', parts: '🔧', chip: '🧩', tv: '📺', keyboard: '⌨️', mouse: '🖱️', storage: '💾', power: '⚡', sparkles: '✨', grooming: '✂️', light: '💡', lens: '🔍', car: '🚗', glass: '🪟', package: '📦' };
    return EMOJI[resolveCategoryIconKey(cat, (siteSettings && siteSettings.categoryIcons) || {})] || '📦';
  };
const CATEGORY_GRADS = ['from-blue-500 to-slate-500', 'from-emerald-500 to-slate-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-slate-500', 'from-slate-500 to-slate-500', 'from-slate-500 to-slate-500', 'from-lime-500 to-green-600', 'from-slate-500 to-rose-500'];
const deferredSearchQuery = React.useDeferredValue(searchQuery);
const modelByIdMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      if (m && m.id !== undefined) {
        const cleanId = String(m.id).trim();
        map.set(cleanId, m);
        map.set(cleanId.toLowerCase(), m);
        if (m.name) {
          const cleanName = String(m.name).trim();
          if (!map.has(cleanName)) map.set(cleanName, m);
          if (!map.has(cleanName.toLowerCase())) map.set(cleanName.toLowerCase(), m);
          const subParts = cleanName.split(/[\/|]/).map(s => s.trim()).filter(s => s.length >= 3);
          subParts.forEach(sp => {
            if (!map.has(sp.toLowerCase())) map.set(sp.toLowerCase(), m);
          });
        }
      }
    }
    return map;
  }, [models]);
const resolvePartModelObj = (part) => {
    if (!part) return undefined;
    const rawMid = String(part.modelId || '').trim();
    return modelByIdMap.get(rawMid) || modelByIdMap.get(rawMid.toLowerCase());
  };
const isPartHidden = (part) => {
    if (!part) return true;
    if (part.hidden || part.customGroupPrices?._hidden) return true;
    if (hiddenPartIdsSet.has(String(part.id || '').trim())) return true;
    if (part.category && isCategoryHidden(part.category)) return true;
    if (siteSettings.keepOutOfStockVisible === false && siteSettings.hideOutOfStockInStore && (Number(part.stock) <= 0 || part.soldOut)) return true;
    const mObj = resolvePartModelObj(part);
    if (mObj) {
      if (mObj.hidden || hiddenModelIdsSet.has(String(mObj.id || '').trim())) return true;
      if (mObj.brand && isBrandHidden(mObj.brand)) return true;
    } else if (part.modelId && hiddenModelIdsSet.has(String(part.modelId).trim())) {
      return true;
    }
    if (part.brand && isBrandHidden(part.brand)) return true;
    return false;
  };
const publicBrands = useMemo(
    () => brands.filter(b => {
      if (isBrandHidden(b)) return false;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!p || isPartHidden(p)) continue;
        const bName = resolvePartModelObj(p)?.brand || p.brand;
        if (bName === b) return true;
      }
      return false;
    }),
    [brands, parts, modelByIdMap, hiddenBrandsSet, hiddenModelIdsSet, hiddenPartIdsSet, hiddenCategoriesSet, siteSettings.hideOutOfStockInStore, siteSettings.keepOutOfStockVisible]
  );
const publicModels = useMemo(
    () => models.filter(m => !isModelHidden(m)),
    [models, hiddenBrandsSet, hiddenModelIdsSet]
  );
const publicParts = useMemo(
    () => parts.filter(p => !isPartHidden(p)
      && (!isPartVipOnly(p) || isCurrentClientVip)
      // Never show items with no price (0 / empty) to customers, and never show leftovers of the bundled demo catalog unless the admin turned it on.
      && (Number(p.basePrice) > 0 || Number(p.vipPrice || p.customGroupPrices?._vipPrice) > 0)
      && !(p._isOrCatalog && siteSettings.disableBundledOrCatalog === true)),
    [parts, models, modelByIdMap, hiddenBrandsSet, hiddenModelIdsSet, hiddenPartIdsSet, hiddenCategoriesSet, siteSettings.hideOutOfStockInStore, siteSettings.keepOutOfStockVisible, isCurrentClientVip]
  );
const vipCatalogParts = useMemo(
    () => parts.filter(p => !isPartHidden(p) && (isPartVipOnly(p) || Number(p.vipPrice || p.customGroupPrices?._vipPrice) > 0)),
    [parts, hiddenBrandsSet, hiddenModelIdsSet, hiddenPartIdsSet, hiddenCategoriesSet, siteSettings.partExtraMeta]
  );
const { partCountByModelIdMap, partCountByBrandMap, publicPartCountByModelIdMap, publicPartCountByBrandMap } = useMemo(() => {
    const byModel = new Map();
    const byBrand = new Map();
    const pubByModel = new Map();
    const pubByBrand = new Map();
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!p) continue;
      const mObj = resolvePartModelObj(p);
      const canonicalMid = mObj ? String(mObj.id) : String(p.modelId || '').trim();
      byModel.set(canonicalMid, (byModel.get(canonicalMid) || 0) + 1);
      const bName = mObj?.brand || p.brand;
      if (bName) byBrand.set(bName, (byBrand.get(bName) || 0) + 1);
      if (!isPartHidden(p)) {
        pubByModel.set(canonicalMid, (pubByModel.get(canonicalMid) || 0) + 1);
        if (bName) pubByBrand.set(bName, (pubByBrand.get(bName) || 0) + 1);
      }
    }
    return {
      partCountByModelIdMap: byModel,
      partCountByBrandMap: byBrand,
      publicPartCountByModelIdMap: pubByModel,
      publicPartCountByBrandMap: pubByBrand
    };
  }, [parts, modelByIdMap, hiddenBrandsSet, hiddenModelIdsSet, hiddenPartIdsSet, hiddenCategoriesSet, siteSettings.hideOutOfStockInStore]);
const getTopCategories = (limit = 10) => {
    const sold = {};
    orders.forEach(o => (o.items || []).forEach(it => { sold[it.sku] = (sold[it.sku] || 0) + (it.qty || 0); }));
    const stats = {};
    const customCatList = Array.isArray(siteSettings.customCategories) ? siteSettings.customCategories : [];
    customCatList.forEach(cc => {
      const cleanC = String(cc || '').trim();
      if (cleanC && !isCategoryHidden(cleanC)) {
        stats[cleanC] = { cat: cleanC, count: 0, sold: 0, pinned: true };
      }
    });
    const pinnedSet = new Set((Array.isArray(siteSettings.pinnedCategories) ? siteSettings.pinnedCategories : []).map(c => String(c || '').trim()));
    publicParts.forEach(pt => {
      if (!pt.category) return;
      if (isCategoryHidden(pt.category)) return;
      const pr = calculatePartPrice(pt, currentGroup);
      if (pr.baseEgpPrice <= 0) return;
      const st = stats[pt.category] || (stats[pt.category] = { cat: pt.category, count: 0, sold: 0, pinned: pinnedSet.has(pt.category) });
      if (pinnedSet.has(pt.category)) st.pinned = true;
      st.count += 1;
      st.sold += sold[pt.sku] || 0;
    });
    return Object.values(stats)
      .filter(st => st.count > 0 || st.pinned)
      .sort((x, y) => (y.pinned ? 1 : 0) - (x.pinned ? 1 : 0) || y.sold - x.sold || y.count - x.count)
      .slice(0, limit);
  };
const parsedSearchWords = useMemo(() => {
    const q = normalizeArabicSearch(deferredSearchQuery);
    return q ? q.split(/\s+/).filter(Boolean) : [];
  }, [deferredSearchQuery]);
const selectedTargetModelName = useMemo(() => {
    if (selectedModelId === 'ALL') return '';
    return modelByIdMap.get(String(selectedModelId))?.name || '';
  }, [selectedModelId, modelByIdMap]);
const partPassesStoreFilters = (part, ignoreCategory = false) => {
    if (!part) return false;
    if (isPartHidden(part)) return false;
    if (isPartVipOnly(part) && !isCurrentClientVip) return false;

    const modelObj = resolvePartModelObj(part);
    const canonicalMid = modelObj ? String(modelObj.id) : String(part.modelId || '').trim();
    const partBrand = modelObj?.brand || part.brand || '';

    if (selectedBrand !== 'ALL' && String(partBrand || '').trim().toLowerCase() !== String(selectedBrand || '').trim().toLowerCase()) return false;
    if (selectedModelId !== 'ALL' && canonicalMid !== String(selectedModelId)) {
      if (!selectedTargetModelName || !(part.compatibleModels || []).some(cm => cm && cm.toLowerCase().includes(selectedTargetModelName.toLowerCase()))) {
        return false;
      }
    }
    if (!ignoreCategory && selectedCategory !== 'ALL' && normalizePartCategory(part.category, part.name) !== normalizePartCategory(selectedCategory)) return false;

    if (storeStockFilter === 'IN_STOCK' && part.stock <= 0) return false;
    if (storeStockFilter === 'LOW_STOCK' && (part.stock <= 0 || part.stock > part.lowStockThreshold)) return false;
    if (storeStockFilter === 'OUT_OF_STOCK' && part.stock > 0) return false;
    if (storeStockFilter === 'FAVORITES' && !favoritePartIds.includes(String(part.id))) return false;
    if (storeStockFilter === 'DISCOUNTS' && !calculatePartPrice(part, currentGroup).hasDiscount) return false;

    if (parsedSearchWords.length > 0) {
      let haystack = part._cachedNormHaystack;
      if (!haystack || part._cachedNameRef !== part.name) {
        haystack = normalizeArabicSearch([
          part.name,
          part.sku,
          part.category,
          part.qualityGrade,
          part.description,
          part.searchAliases,
          ...(part.compatibleModels || []),
          modelObj?.name || '',
          modelObj?.brand || '',
          modelObj?.aliases || ''
        ].join(' '));
        part._cachedNormHaystack = haystack;
        part._cachedNameRef = part.name;
      }
      for (let i = 0; i < parsedSearchWords.length; i++) {
        if (!haystack.includes(parsedSearchWords[i])) return false;
      }
    }
    return true;
  };
const filteredParts = useMemo(() => {
    return parts.filter(part => partPassesStoreFilters(part)).sort((a, b) => {
      if (storeStockFilter === 'BEST_SELLERS' || storeSortBy === 'best_selling') {
        const aSold = Number(a.soldCount || a.sales || 0) * 10 + (a._isCustomUploaded ? 50 : 0) + Number(a.stock || 0);
        const bSold = Number(b.soldCount || b.sales || 0) * 10 + (b._isCustomUploaded ? 50 : 0) + Number(b.stock || 0);
        if (bSold !== aSold) return bSold - aSold;
      }
      if (storeSortBy === 'name_asc') return a.name.localeCompare(b.name, 'ar');
      if (storeSortBy === 'name_desc') return b.name.localeCompare(a.name, 'ar');
      if (storeSortBy === 'stock_desc') return b.stock - a.stock;
      if (storeSortBy === 'stock_asc') return a.stock - b.stock;
      if (storeSortBy === 'price_asc') return a.basePrice - b.basePrice;
      if (storeSortBy === 'price_desc') return b.basePrice - a.basePrice;
      if (storeSortBy === 'date_asc') {
        const aCust = a._isCustomUploaded ? 1 : 0;
        const bCust = b._isCustomUploaded ? 1 : 0;
        if (aCust !== bCust) return bCust - aCust;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      const aCustom = a._isCustomUploaded ? 1 : 0;
      const bCustom = b._isCustomUploaded ? 1 : 0;
      if (aCustom !== bCustom) return bCustom - aCustom;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [parts, modelByIdMap, selectedBrand, selectedModelId, selectedTargetModelName, selectedCategory, parsedSearchWords, storeStockFilter, storeQualityFilter, storeSortBy, currentGroup, hiddenBrandsSet, hiddenModelIdsSet, hiddenPartIdsSet, hiddenCategoriesSet, siteSettings.hideOutOfStockInStore, favoritePartIds]);
const clientLoyaltyInfo = useMemo(
    () => getClientLoyaltyStatus(currentClient),
    [currentClient, orders, siteSettings.loyaltySilverMinOrders, siteSettings.loyaltyGoldMinOrders, siteSettings.loyaltyDiamondMinOrders, siteSettings.loyaltyInactivityDays]
  );
const cartSummary = useMemo(() => {
    const items = [];
    let subtotalBeforeItemDiscountsBase = 0;
    let subtotalBase = 0;
    let bundleDiscountTotalBase = 0;
    let qtyDiscountTotalBase = 0;
    let expectedCashbackBase = 0;
    let cashbackEligibleItemsCount = 0;

    const tier2Min = Math.max(2, Number(siteSettings.qtyTier2Min) || 2);
    const tier2Pct = Math.max(0, Number(siteSettings.qtyTier2DiscountPct) || 5);
    const tier3Min = Math.max(tier2Min + 1, Number(siteSettings.qtyTier3Min) || 3);
    const tier3Pct = Math.max(0, Number(siteSettings.qtyTier3DiscountPct) || 10);
    const qtyDiscType = siteSettings.qtyDiscountType || 'percentage'; // 'percentage' | 'fixed'
    const qtyDiscFixed2 = Math.max(0, Number(siteSettings.qtyTier2FixedEgp) || 25);
    const qtyDiscFixed3 = Math.max(0, Number(siteSettings.qtyTier3FixedEgp) || 50);
    const qtyDiscMinOrder = Math.max(0, Number(siteSettings.qtyDiscountMinOrder) || 0);
    const qtyDiscMaxCap = Math.max(0, Number(siteSettings.qtyDiscountMaxCap) || 0);

    const crossSellType = siteSettings.crossSellDiscountType || 'percentage'; // 'percentage' | 'fixed'
    const crossSellFixedVal = Math.max(0, Number(siteSettings.crossSellFixedEgp) || 30);
    const crossSellMinOrder = Math.max(0, Number(siteSettings.crossSellMinOrder) || 0);
    const crossSellMaxCap = Math.max(0, Number(siteSettings.crossSellMaxCap) || 0);

    const cashbackCalcType = siteSettings.cashbackCalcType || 'percentage'; // 'percentage' | 'fixed'
    const cashbackFixedPerItem = Math.max(0, Number(siteSettings.cashbackFixedEgp) || 15);
    const cashbackMinOrder = Math.max(0, Number(siteSettings.cashbackMinOrder) || 0);
    const cashbackMaxOrderCap = Math.max(0, Number(siteSettings.cashbackMaxOrderCap) || 0);

    const loyaltyBonusCbPct = (siteSettings.enableLoyaltyTiers !== false && clientLoyaltyInfo?.currentTier?.bonusCashbackPct)
      ? Number(clientLoyaltyInfo.currentTier.bonusCashbackPct)
      : 0;

    Object.entries(cart).forEach(([partId, itemData]) => {
      const part = parts.find(p => String(p.id) === String(partId));
      if (!part || itemData.qty <= 0) return;
      const validQty = Math.min(itemData.qty, part.soldOut ? 0 : part.stock);
      if (validQty <= 0) return;

      const basePriceInfo = calculatePartPrice(part, currentGroup);
      const chosenTierId = selectedQualityTiers[part.id] || itemData.qualityTier || 'original';
      const tiersList = getPartQualityTiers(part, basePriceInfo.baseEgpPrice);
      const chosenTierObj = (siteSettings.enableQualityTiers !== false && tiersList.find(t => t.id === chosenTierId)) || tiersList[0];

      const rawUnitBase = chosenTierObj ? chosenTierObj.priceEgp : basePriceInfo.baseEgpPrice;
      subtotalBeforeItemDiscountsBase += rawUnitBase * validQty;

      // 1. Smart Cross-Sell Bundle Discount (Supports % or Fixed EGP + Max Cap)
      const bundlePct = Number(bundleDiscountPartIds[String(part.id)]) || 0;
      let unitAfterBundleBase = rawUnitBase;
      if (bundlePct > 0) {
        if (crossSellType === 'fixed') {
          unitAfterBundleBase = Math.max(1, rawUnitBase - crossSellFixedVal);
        } else {
          unitAfterBundleBase = Math.max(1, Math.round(rawUnitBase * (1 - bundlePct / 100)));
        }
      }
      let itemBundleSavedBase = Math.max(0, (rawUnitBase - unitAfterBundleBase) * validQty);
      if (crossSellMaxCap > 0 && bundleDiscountTotalBase + itemBundleSavedBase > crossSellMaxCap) {
        itemBundleSavedBase = Math.max(0, crossSellMaxCap - bundleDiscountTotalBase);
        unitAfterBundleBase = Math.max(1, Math.round(rawUnitBase - itemBundleSavedBase / validQty));
      }
      bundleDiscountTotalBase += itemBundleSavedBase;

      // 2. Buy More, Save More (Supports % or Fixed EGP + Max Cap)
      let qtyDiscountPct = 0;
      let finalUnitBase = unitAfterBundleBase;
      if (siteSettings.enableBuyMoreSaveMore !== false) {
        if (validQty >= tier3Min) qtyDiscountPct = tier3Pct;
        else if (validQty >= tier2Min) qtyDiscountPct = tier2Pct;
      }
      if (qtyDiscountPct > 0) {
        if (qtyDiscType === 'fixed') {
          const fixedOff = validQty >= tier3Min ? qtyDiscFixed3 : qtyDiscFixed2;
          finalUnitBase = Math.max(1, unitAfterBundleBase - fixedOff);
        } else {
          finalUnitBase = Math.max(1, Math.round(unitAfterBundleBase * (1 - qtyDiscountPct / 100)));
        }
      }
      let itemQtySavedBase = Math.max(0, (unitAfterBundleBase - finalUnitBase) * validQty);
      if (qtyDiscMaxCap > 0 && qtyDiscountTotalBase + itemQtySavedBase > qtyDiscMaxCap) {
        itemQtySavedBase = Math.max(0, qtyDiscMaxCap - qtyDiscountTotalBase);
        finalUnitBase = Math.max(1, Math.round(unitAfterBundleBase - itemQtySavedBase / validQty));
      }
      qtyDiscountTotalBase += itemQtySavedBase;

      const lineTotalBase = finalUnitBase * validQty;
      subtotalBase += lineTotalBase;

      // 3. Per-Product Cashback + Loyalty Tier Bonus Cashback (Supports % or Fixed EGP + Max Order Cap)
      const cbEnabled = isPartCashbackEnabled(part);
      const baseCbPct = cbEnabled ? getPartCashbackPct(part) : 0;
      const effectiveCbPct = cbEnabled ? (baseCbPct + loyaltyBonusCbPct) : 0;
      let lineCashbackBase = 0;
      if (cbEnabled) {
        if (cashbackCalcType === 'fixed') {
          lineCashbackBase = cashbackFixedPerItem * validQty;
        } else {
          lineCashbackBase = Math.max(1, Math.round((lineTotalBase * effectiveCbPct) / 100));
        }
      }
      if (cbEnabled && lineCashbackBase > 0) {
        expectedCashbackBase += lineCashbackBase;
        cashbackEligibleItemsCount += validQty;
      }

      items.push({
        part,
        qty: validQty,
        color: itemData.color,
        qualityTierId: chosenTierObj.id,
        qualityTierLabel: chosenTierObj.label,
        priceInfo: { ...basePriceInfo, baseEgpPrice: finalUnitBase },
        originalUnitBase: rawUnitBase,
        bundlePct,
        itemBundleSavedBase,
        qtyDiscountPct,
        itemQtySavedBase,
        lineTotalBase,
        cashbackEnabled: cbEnabled,
        cashbackPct: effectiveCbPct,
        lineCashbackBase
      });
    });

    // Enforce Min Order Thresholds & Max Order Caps on Cross-Sell, Qty Discount & Cashback
    if (crossSellMinOrder > 0 && subtotalBeforeItemDiscountsBase < crossSellMinOrder) {
      subtotalBase += bundleDiscountTotalBase;
      bundleDiscountTotalBase = 0;
    }
    if (qtyDiscMinOrder > 0 && subtotalBeforeItemDiscountsBase < qtyDiscMinOrder) {
      subtotalBase += qtyDiscountTotalBase;
      qtyDiscountTotalBase = 0;
    }
    if (cashbackMinOrder > 0 && subtotalBase < cashbackMinOrder) {
      expectedCashbackBase = 0;
    }
    if (cashbackMaxOrderCap > 0 && expectedCashbackBase > cashbackMaxOrderCap) {
      expectedCashbackBase = cashbackMaxOrderCap;
    }

    const groupDeliveryBase =
      currentGroup?.deliveryFeeBase !== undefined ? Number(currentGroup.deliveryFeeBase) : deliveryFeeBase;

    const freeShipTargetBase = Math.max(100, Number(siteSettings.freeShippingTargetBase) || 2000);
    const freeShipMaxSubsidyCap = Math.max(0, Number(siteSettings.freeShippingMaxSubsidyCap) || 0);
    const freeShipEnabled = siteSettings.enableFreeShippingBar !== false;
    const isDiamondFreeShip = siteSettings.enableLoyaltyTiers !== false && Boolean(clientLoyaltyInfo?.currentTier?.freeShipping);
    const isFreeShippingUnlocked = (freeShipEnabled && items.length > 0 && subtotalBase >= freeShipTargetBase) || (items.length > 0 && isDiamondFreeShip);
    const remainingForFreeShippingBase = freeShipEnabled ? Math.max(0, freeShipTargetBase - subtotalBase) : 0;
    const freeShippingProgressPct = freeShipEnabled
      ? Math.min(100, Math.round((subtotalBase / freeShipTargetBase) * 100))
      : 0;

    // Loyalty Auto-Discount with Min Order & Max Cap
    const loyaltyMinOrder = Math.max(0, Number(siteSettings.loyaltyMinOrderAmount) || 0);
    const loyaltyMaxCap = Math.max(0, Number(siteSettings.loyaltyMaxDiscountCap) || 0);
    const loyaltyDiscountType = siteSettings.loyaltyDiscountType || 'percentage';
    const loyaltyFixedVal = Math.max(0, Number(siteSettings.loyaltyFixedDiscountEgp) || 50);
    const loyaltyAutoDiscountPct = (useFlag('loyalty_tiers').enabled && clientLoyaltyInfo?.currentTier?.autoDiscountPct)
      ? Number(clientLoyaltyInfo.currentTier.autoDiscountPct)
      : 0;
    let loyaltyAutoDiscountBase = 0;
    if (loyaltyAutoDiscountPct > 0 && items.length > 0 && subtotalBase >= loyaltyMinOrder) {
      loyaltyAutoDiscountBase = loyaltyDiscountType === 'fixed'
        ? loyaltyFixedVal
        : Math.round((subtotalBase * loyaltyAutoDiscountPct) / 100);
      if (loyaltyMaxCap > 0) loyaltyAutoDiscountBase = Math.min(loyaltyAutoDiscountBase, loyaltyMaxCap);
    }

    let discountBase = 0;
    let effectiveDeliveryFeeBase = items.length > 0
      ? (isFreeShippingUnlocked
          ? (freeShipMaxSubsidyCap > 0 ? Math.max(0, groupDeliveryBase - freeShipMaxSubsidyCap) : 0)
          : groupDeliveryBase)
      : 0;

    if (appliedPromo && items.length > 0) {
      const promoMinOrder = Math.max(0, Number(appliedPromo.minOrderAmount) || 0);
      if (subtotalBase >= promoMinOrder) {
        if (appliedPromo.type === 'percentage') {
          const rawDisc = Math.round(subtotalBase * (Number(appliedPromo.value) / 100));
          discountBase = Number(appliedPromo.maxDiscountCap) > 0
            ? Math.min(rawDisc, Number(appliedPromo.maxDiscountCap))
            : rawDisc;
        } else if (appliedPromo.type === 'fixed') {
          const rawDisc = Number(appliedPromo.value);
          discountBase = Number(appliedPromo.maxDiscountCap) > 0
            ? Math.min(rawDisc, Number(appliedPromo.maxDiscountCap), subtotalBase)
            : Math.min(rawDisc, subtotalBase);
        } else if (appliedPromo.type === 'free_delivery') {
          effectiveDeliveryFeeBase = 0;
        } else if (appliedPromo.type === 'delivery_discount') {
          const rawDelivDisc = Math.round(effectiveDeliveryFeeBase * (Number(appliedPromo.value) / 100));
          const cappedDelivDisc = Number(appliedPromo.maxDiscountCap) > 0
            ? Math.min(rawDelivDisc, Number(appliedPromo.maxDiscountCap))
            : rawDelivDisc;
          effectiveDeliveryFeeBase = Math.max(0, effectiveDeliveryFeeBase - cappedDelivDisc);
        }
      }
    }

    // Global Master Discount Cap per Invoice (Optional extra safety shield)
    const masterInvoiceDiscountCap = Math.max(0, Number(siteSettings.masterMaxDiscountPerOrderEgp) || 0);
    discountBase = Math.min(subtotalBase, loyaltyAutoDiscountBase + discountBase);
    if (masterInvoiceDiscountCap > 0) {
      discountBase = Math.min(discountBase, masterInvoiceDiscountCap);
    }

    const afterDiscountBase = Math.max(0, subtotalBase - discountBase);
    const totalWithDeliveryBase = items.length > 0 ? afterDiscountBase + effectiveDeliveryFeeBase : 0;

    const positiveWalletBase = currentClient && currentClient.walletBalance > 0 ? currentClient.walletBalance : 0;
    const walletDeductedBase =
      useWalletBalance && positiveWalletBase > 0
        ? Math.min(positiveWalletBase, totalWithDeliveryBase)
        : 0;

    const finalPayableBase = Math.max(0, totalWithDeliveryBase - walletDeductedBase);

    const currentDebtBase = currentClient && currentClient.walletBalance < 0 ? Math.abs(currentClient.walletBalance) : 0;
    const remainingCreditLimitBase = currentClient ? Math.max(0, currentClient.creditLimit - currentDebtBase) : 0;
    const canOrderOnCredit = currentClient ? (currentDebtBase + finalPayableBase <= currentClient.creditLimit) : false;

    return {
      items,
      totalQty: items.reduce((acc, i) => acc + i.qty, 0),
      subtotalBeforeItemDiscountsBase,
      subtotalBase,
      bundleDiscountTotalBase,
      qtyDiscountTotalBase,
      loyaltyAutoDiscountPct,
      loyaltyAutoDiscountBase,
      discountBase,
      originalDeliveryFeeBase: items.length > 0 ? groupDeliveryBase : 0,
      deliveryFeeBase: effectiveDeliveryFeeBase,
      isFreeShippingUnlocked,
      isDiamondFreeShip,
      freeShipTargetBase,
      remainingForFreeShippingBase,
      freeShippingProgressPct,
      expectedCashbackBase,
      cashbackEligibleItemsCount,
      walletDeductedBase,
      finalPayableBase,
      currentDebtBase,
      remainingCreditLimitBase,
      canOrderOnCredit
    };
  }, [cart, parts, currentGroup, appliedPromo, deliveryFeeBase, currentClient, useWalletBalance, bundleDiscountPartIds, selectedQualityTiers, clientLoyaltyInfo, siteSettings]);
const prevFreeShipUnlockedRef = useRef(false);
useEffect(() => {
    if (cartSummary.isFreeShippingUnlocked && !prevFreeShipUnlockedRef.current) {
      prevFreeShipUnlockedRef.current = true;
      try {
        if (!window.sessionStorage.getItem('elzoghbi_freeship_confetti_shown')) {
          window.sessionStorage.setItem('elzoghbi_freeship_confetti_shown', '1');
          triggerConfettiCelebration();
        }
      } catch (e) {
        triggerConfettiCelebration();
      }
    } else if (!cartSummary.isFreeShippingUnlocked) {
      prevFreeShipUnlockedRef.current = false;
    }
  }, [cartSummary.isFreeShippingUnlocked]);
const handlePlaceOrder = () => {
    if (placingOrder) return;
    setPlacingOrder(true);
    try {
      placeOrderInner();
    } catch (err) {
      console.error('place order failed', err);
      showToast('حصلت مشكلة وإحنا بنبعت الطلب، جرّب تاني. (' + (err && err.message ? err.message : '') + ')', 'error');
    } finally {
      setTimeout(() => setPlacingOrder(false), 700);
    }
  };
const currentPeriodTotalSalesEgp = useMemo(() => {
    const startStr = siteSettings.salesCapPeriodStart || '2026-01-01';
    const endStr = siteSettings.salesCapPeriodEnd || '2027-12-31';
    return orders
      .filter(o => {
        if (!o || o.status === 'ملغي') return false;
        const dStr = String(o.createdAt || '').slice(0, 10);
        if (dStr && (dStr < startStr || dStr > endStr)) return false;
        return true;
      })
      .reduce((sum, o) => {
        const itemsVal = (o.items || []).reduce((s, i) => s + (Number(i.qty) || 1) * (Number(i.unitPriceBase) || 0), 0);
        return sum + Math.max(0, itemsVal - (Number(o.discountBase) || 0));
      }, 0);
  }, [orders, siteSettings.salesCapPeriodStart, siteSettings.salesCapPeriodEnd]);
const placeOrderInner = async () => {
    if (submittingCustomerActionRef.current) return;
    if (!currentClient) {
      setLoginModalOpen(true);
      return;
    }
    if (cartSummary.items.length === 0) {
      showToast('السلة فاضية! ضيف منتجات الأول.', 'warning');
      return;
    }

    // 1. Server & Client Sales Cap Stop Guard (2,000,000 EGP limit)
    const salesCapFlag = useFlag('sales_cap_guard');
    const maxSalesCapEgp = Math.max(10000, Number(siteSettings.salesCapMaxLimitEgp) || 2000000);
    if (salesCapFlag.enabled && (currentPeriodTotalSalesEgp + cartSummary.subtotalBase) > maxSalesCapEgp) {
      showToast(
        siteSettings.salesCapStopMessage || `🛑 نعتذر، تم الوصول للحد الأقصى للمبيعات المقررة لهذه الفترة (${maxSalesCapEgp.toLocaleString()} ج.م) وتم إيقاف استقبال طلبات جديدة من السيرفر.`,
        'error'
      );
      return;
    }

    // 2. Re-verify Applied Coupon at Order Creation — against the FRESH coupon
    // record (not the snapshot taken when it was applied), with the same rules
    // used at apply time: active, expiry, total usage limit, assigned user,
    // and per-user uses up to maxUsesPerUser.
    if (appliedPromo) {
      const freshPromo = promoCodes.find(
        pc => String(pc.code || '').trim().toUpperCase() === String(appliedPromo.code || '').trim().toUpperCase()
      );
      if (!freshPromo || freshPromo.active === false) {
        setAppliedPromo(null);
        showToast(`تم رفض الكوبون (${appliedPromo.code}) عند إنشاء الطلب لأنه لم يعد مفعّلاً.`, 'error');
        return;
      }
      if (
        freshPromo.type !== appliedPromo.type ||
        Number(freshPromo.value) !== Number(appliedPromo.value) ||
        Number(freshPromo.maxDiscountCap || 0) !== Number(appliedPromo.maxDiscountCap || 0) ||
        Number(freshPromo.minOrderAmount || 0) !== Number(appliedPromo.minOrderAmount || 0)
      ) {
        setAppliedPromo(freshPromo);
        showToast('⚠️ الإدارة عدّلت شروط الكوبون من لحظة ما فعّلته — راجع الإجمالي الجديد وبعدين أكّد الطلب تاني.', 'warning');
        return;
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      if (freshPromo.expiryDate && freshPromo.expiryDate < todayStr) {
        setAppliedPromo(null);
        showToast(`تم رفض الكوبون (${freshPromo.code}) عند إنشاء الطلب لانتهاء صلاحيته.`, 'error');
        return;
      }
      if (Number(freshPromo.usedCount || 0) >= Number(freshPromo.usageLimit || 10000)) {
        setAppliedPromo(null);
        showToast(`تم رفض الكوبون (${freshPromo.code}) لأنه وصل للحد الأقصى من مرات الاستخدام الكلي.`, 'error');
        return;
      }
      if (freshPromo.assignedUserId && String(freshPromo.assignedUserId) !== String(currentClient.id) && String(freshPromo.assignedUserId) !== String(currentClient.phone)) {
        setAppliedPromo(null);
        showToast(`تم رفض الكوبون (${freshPromo.code}) لأنه مسجل باسم مستخدم آخر.`, 'error');
        return;
      }
      if (cartSummary.subtotalBase < Number(freshPromo.minOrderAmount || 0)) {
        setAppliedPromo(null);
        showToast(`تم رفض الكوبون (${freshPromo.code}) لأن إجمالي السلة أقل من الحد الأدنى (${freshPromo.minOrderAmount} ج.م).`, 'error');
        return;
      }
      const redemptionsList = Array.isArray(siteSettings.couponRedemptions) ? siteSettings.couponRedemptions : [];
      const userUsesCount = redemptionsList.filter(
        r => (r.couponId === freshPromo.id || r.couponCode === freshPromo.code) &&
             (String(r.userId) === String(currentClient.id) || String(r.userId) === String(currentClient.phone))
      ).length;
      const maxPerUser = Math.max(1, Number(freshPromo.maxUsesPerUser) || 1);
      if (userUsesCount >= maxPerUser) {
        setAppliedPromo(null);
        showToast(`تم رفض الكوبون (${freshPromo.code}) لأنك وصلت لحد استخدامه المسموح لحسابك (${maxPerUser}).`, 'error');
        return;
      }
    }

    // Fire-and-forget Server Validation RPC
    callServerCroRpc('rpc_validate_and_create_order', {
      p_user_id: String(currentClient.id),
      p_phone: String(currentClient.phone || ''),
      p_subtotal_egp: Number(cartSummary.subtotalBase) || 0,
      p_delivery_fee_egp: Number(cartSummary.deliveryFeeBase) || 0,
      p_coupon_code: appliedPromo ? appliedPromo.code : null,
      p_referral_code: appliedReferralClient ? (appliedReferralClient.referralCode || appliedReferralClient.phone) : null,
      p_device_fingerprint: myTabId
    });
    const enabledPayMethods = getPaymentMethods(siteSettings).filter(m => m.enabled);
    const chosenPay = enabledPayMethods.find(m => m.id === paymentMethod);
    if (!chosenPay) {
      showToast('اختار طريقة الدفع الأول.', 'warning');
      return;
    }
    const paymentLabel = chosenPay.id === CREDIT_PAYMENT_ID ? CREDIT_PAYMENT_ID : chosenPay.label || chosenPay.id;
    if (paymentMethod === 'آجل / على الحساب' && !cartSummary.canOrderOnCredit) {
      showToast('قيمة الطلب أكبر من الحد الائتماني المتاح لحسابك. اختار طريقة دفع تانية أو سدّد جزء من المديونية.', 'error');
      return;
    }

    const newOrderId = `INV-${String(Date.now()).slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const chosenAddr =
      checkoutAddressChoice === 'primary'
        ? currentClient.address
        : checkoutAddressChoice === 'secondary'
        ? currentClient.secondaryAddress
        : customAddressText || currentClient.address;

    if (!String(chosenAddr || '').trim()) {
      showToast('اكتب عنوان التوصيل الأول.', 'warning');
      return;
    }

    const newOrder = {
      id: newOrderId,
      clientId: currentClient.id,
      clientName: currentClient.name,
      clientPhone: currentClient.phone || '',
      groupId: currentGroup.id,
      currency: currentCurrency.code,
      exchangeRateUsed: currentCurrency.rateFromBase,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'تم الاستلام',
      statusUpdatedAt: Date.now(),
      paymentMethod: paymentLabel,
      address: chosenAddr,
      notes: orderNotes,
      deliveryFeeBase: cartSummary.deliveryFeeBase,
      discountBase: cartSummary.discountBase,
      walletUsedBase: cartSummary.walletDeductedBase,
      total: Math.max(0, (cartSummary.items || []).reduce((sum, i) => sum + (Number(i.priceInfo?.baseEgpPrice) || 0) * (Number(i.qty) || 0), 0) + (Number(cartSummary.deliveryFeeBase) || 0) - (Number(cartSummary.discountBase) || 0)),
      adminEdited: false,
      adminEditNote: '',
      cashbackAwarded: false,
      cashbackAmountBase: 0,
      expectedCashbackBase: cartSummary.expectedCashbackBase,
      referralCodeUsed: appliedReferralClient ? (appliedReferralClient.referralCode || appliedReferralClient.phone) : (currentClient.referredByCode || ''),
      referrerClientId: appliedReferralClient ? appliedReferralClient.id : (currentClient.referrerClientId || ''),
      items: cartSummary.items.map(i => ({
        partId: i.part.id,
        sku: i.part.sku,
        name: `${i.part.name}${i.qualityTierLabel ? ` (${i.qualityTierLabel})` : ''}`,
        qualityGrade: i.qualityTierLabel || i.part.qualityGrade,
        color: i.color,
        qty: i.qty,
        costPriceBase: i.part.costPrice,
        unitPriceBase: i.priceInfo.baseEgpPrice,
        cashbackEnabled: Boolean(i.cashbackEnabled),
        cashbackPct: Number(i.cashbackPct) || 0,
        lineCashbackBase: Number(i.lineCashbackBase) || 0
      }))
    };

    // Await server confirmation for the order before deducting stock or clearing the cart
    submittingCustomerActionRef.current = true;
    let orderSavedOk = false;
    try {
      orderSavedOk = await sbUpsert('orders', newOrder);
    } finally {
      submittingCustomerActionRef.current = false;
    }
    if (!orderSavedOk) {
      showToast('معلش، طلبك ماوصلش للسيرفر. اتأكد من النت وجرّب تأكد الطلب تاني.', 'error');
      return;
    }
    markLocalUpsert('orders', newOrder);

    // 1. Deduct Stock
    setParts(prevParts =>
      prevParts.map(p => {
        const cartItem = cartSummary.items.find(i => i.part.id === p.id);
        if (!cartItem) return p;
        return { ...p, stock: Math.max(0, p.stock - cartItem.qty) };
      })
    );

    // 2. Update Client Wallet / Credit Ledger
    if (cartSummary.walletDeductedBase > 0 || paymentMethod === 'آجل / على الحساب') {
      setClients(prevClients =>
        prevClients.map(c => {
          if (c.id !== currentClient.id) return c;
          let updatedBalance = c.walletBalance;
          const newLedgerEntries = [...c.ledger];

          if (cartSummary.walletDeductedBase > 0) {
            updatedBalance -= cartSummary.walletDeductedBase;
            newLedgerEntries.unshift({
              id: `ldg_${Date.now()}_w`,
              date: new Date().toISOString().slice(0, 16).replace('T', ' '),
              type: 'wallet_deduct',
              ref: newOrderId,
              desc: `خصم من رصيدك الدائن لسداد فاتورة ${newOrderId}`,
              amount: -cartSummary.walletDeductedBase,
              balanceAfter: updatedBalance
            });
          }

          if (paymentMethod === 'آجل / على الحساب' && cartSummary.finalPayableBase > 0) {
            updatedBalance -= cartSummary.finalPayableBase;
            newLedgerEntries.unshift({
              id: `ldg_${Date.now()}_c`,
              date: new Date().toISOString().slice(0, 16).replace('T', ' '),
              type: 'invoice',
              ref: newOrderId,
              desc: `فاتورة مشتريات آجل على الحساب (${newOrderId})`,
              amount: -cartSummary.finalPayableBase,
              balanceAfter: updatedBalance
            });
          }

          return { ...c, walletBalance: updatedBalance, ledger: newLedgerEntries };
        })
      );
    }

    // 3. Save Order, Increment Promo Usage, Push Live Notification & Clear Cart
    hasCompletedOrderInSessionRef.current = true;
    if (appliedPromo) {
      const redemptionEntry = {
        id: `red_${Date.now()}`,
        couponId: appliedPromo.id || `cpn_${appliedPromo.code}`,
        couponCode: appliedPromo.code,
        userId: currentClient.id,
        userPhone: currentClient.phone,
        orderId: newOrderId,
        discountApplied: cartSummary.discountBase,
        redeemedAt: new Date().toISOString()
      };
      setPromoCodes(prev =>
        prev.map(p => (p.id === appliedPromo.id || p.code === appliedPromo.code ? { ...p, usedCount: (Number(p.usedCount) || 0) + 1 } : p))
      );
      saveSiteSettingsImmediate(prev => ({
        ...prev,
        analyticsCouponsUsedCount: (Number(prev.analyticsCouponsUsedCount) || 0) + 1,
        couponRedemptions: [redemptionEntry, ...(Array.isArray(prev.couponRedemptions) ? prev.couponRedemptions : [])]
      }));
      try {
        const { sbUrl, sbKey, isValid } = getSupabaseConfig();
        if (isValid) {
          fetch(`${sbUrl}/rest/v1/coupon_redemptions`, {
            method: 'POST',
            headers: sbHeaders(sbKey, { Prefer: 'return=minimal' }),
            body: JSON.stringify([{
              coupon_id: redemptionEntry.couponId,
              coupon_code: redemptionEntry.couponCode,
              user_id: String(currentClient.id),
              order_id: newOrderId,
              discount_applied: Number(cartSummary.discountBase) || 0
            }])
          }).catch(() => {});
        }
      } catch (err) {}
    }
    enqueueLiveSocialProofOrder(newOrder);
    // Trigger Instant Background Mobile Push Notification (Works even when Admin browser & site are completely closed!)
    sendMobileOrderPushAlert({
      eventType: 'order',
      title: `🛒 أوردر جديد #${newOrderId} — ${formatMoney(cartSummary.finalPayableBase)}`,
      body: `العميل: ${currentClient.name} (${currentClient.phone || 'بدون رقم'})\nالقطع: ${cartSummary.totalQty} قطعة • الدفع: ${paymentLabel}\nالعنوان: ${chosenAddr}\nالأصناف: ${newOrder.items.slice(0, 4).map(it => `${it.name} ×${it.qty}`).join(' ، ')}`
    });
    const adminOrderNotif = {
      id: `ntf_${Date.now()}_adm`,
      target: 'admin',
      type: 'new_order',
      title: `طلبية جديدة #${newOrderId} (${currentClient.name})`,
      msg: `أرسل "${currentClient.name}" (${currentClient.phone}) طلبية جديدة (${cartSummary.totalQty} قطع) بقيمة ${formatMoney(cartSummary.finalPayableBase)}`,
      time: 'الآن',
      read: false,
      orderId: newOrderId
    };
    const clientOrderNotif = {
      id: `ntf_${Date.now()}_cli`,
      target: currentClient.id,
      title: `استلمنا طلبك #${newOrderId}`,
      msg: `فاتورتك اتسجّلت وبنجهّز القطع في المخزن (${cartSummary.totalQty} قطع).`,
      time: 'الآن',
      read: false,
      orderId: newOrderId
    };

    isCustomerMutatingCloudRef.current = true;
    setOrders(prev => [newOrder, ...prev]);
    setExpandedClientOrders(prev => ({ ...prev, [newOrderId]: true }));
    setNotifications(prev => [adminOrderNotif, clientOrderNotif, ...prev]);

    // Patch only notifications in site_settings so a customer tab never overwrites admin settings/currencies
    try {
      const nextNotifs = [adminOrderNotif, clientOrderNotif, ...notifications].slice(0, 100);
      sbUpdate('site_settings', 'main', {
        notifications: nextNotifs,
        updated_at: new Date().toISOString()
      });
    } catch (e) {}
    cartSummary.items.forEach(item => {
      const p = parts.find(x => x.id === item.part.id);
      if (p) {
        const updatedStock = Math.max(0, p.stock - item.qty);
        sbUpdate('spare_parts', p.id, { stock: updatedStock });
      }
    });
    // Mark client as having used their first-order referral opportunity so the box hides permanently
    try {
      window.localStorage.setItem(`elzoghbi_ref_used_${currentClient.id}`, '1');
      window.sessionStorage.removeItem('elzoghbi_referral_code');
    } catch (e) {}
    setClients(prev =>
      prev.map(c => {
        if (c.id !== currentClient.id) return c;
        const updatedC = {
          ...c,
          hasUsedReferralCode: true,
          referredByCode: c.referredByCode || (appliedReferralClient ? (appliedReferralClient.referralCode || appliedReferralClient.phone) : ''),
          referrerClientId: c.referrerClientId || (appliedReferralClient ? appliedReferralClient.id : '')
        };
        markLocalUpsert('clients', updatedC);
        sbUpsert('clients', updatedC);
        return updatedC;
      })
    );
    setAppliedReferralClient(null);
    setReferralCodeInput('');
    setCart({});
    setAppliedPromo(null);
    setPromoCodeInput('');
    setOrderNotes('');
    setClientTab('account');
    setAccountSubTab('orders');
    setPlacedOrderInfo({ id: newOrderId, total: cartSummary.finalPayableBase });
    showToast(`🔔 طلبك رقم ${newOrderId} اتأكّد وبعتنا إشعار للإدارة والمخزن!`, 'success');
  };
const handleQuickReorder = (order) => {
    const newCart = { ...cart };
    let addedCount = 0;
    let skippedCount = 0;

    order.items.forEach(item => {
      const part = parts.find(p => p.id === item.partId);
      if (part && part.stock > 0 && !part.soldOut) {
        const allowedQty = Math.min(item.qty, part.stock);
        newCart[part.id] = { qty: allowedQty, color: item.color };
        addedCount++;
      } else {
        skippedCount++;
      }
    });

    setCart(newCart);
    setClientTab('store');
    setCartDrawerOpen(true);
    showToast(
      skippedCount > 0
        ? `ضفنا ${addedCount} أصناف متاحة للسلة (وعدّينا ${skippedCount} صنف مش متوفر دلوقتي).`
        : `رجّعنا كل أصناف الفاتورة ${order.id} للسلة!`,
      'success'
    );
  };
const [groupDrafts, setGroupDrafts] = useState({});
const handleApplyGroupModifier = (groupId, newCurrency, modType, modValue, newDeliveryFeeBase, overwriteCustom = false) => {
    const numericMod = modType === 'none' ? 0 : Number(modValue);
    const numericDeliv = newDeliveryFeeBase !== undefined ? Math.max(0, Number(newDeliveryFeeBase)) : 50;

    // Margin Check across all parts
    const violatingParts = [];
    parts.forEach(part => {
      let testPrice = part.basePrice;
      const hasCustom = part.customGroupPrices && part.customGroupPrices[groupId] !== undefined;
      if (hasCustom && !overwriteCustom) {
        testPrice = part.customGroupPrices[groupId];
      } else if (modType !== 'none') {
        if (modType === 'percentage') {
          testPrice = Math.round(part.basePrice * (1 + numericMod / 100));
        } else if (modType === 'flat') {
          testPrice = Math.round(part.basePrice + numericMod);
        }
      }
      if (testPrice < part.costPrice) {
        violatingParts.push(`${part.name} (سعر البيع ${testPrice} ج.م أقل من التكلفة ${part.costPrice} ج.م)`);
      }
    });

    const doApplyGroupModifier = () => {
    if (overwriteCustom) {
      setParts(prev =>
        prev.map(p => {
          const copyCustom = { ...(p.customGroupPrices || {}) };
          delete copyCustom[groupId];
          return { ...p, customGroupPrices: copyCustom };
        })
      );
    }

    setGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? {
              ...g,
              currency: newCurrency,
              modifierType: modType,
              modifierValue: numericMod,
              deliveryFeeBase: numericDeliv
            }
          : g
      )
    );
    };

    // Profit shield: below-cost violations need an explicit confirmation —
    // a warning toast alone must not let the modifier apply silently.
    if (violatingParts.length > 0) {
      setConfirmDialog({
        title: '🛡️ حماية هامش الربح — بيع تحت التكلفة',
        message: `هذا التعديل هيخلي ${violatingParts.length} صنف يتباع بأقل من تكلفته، منها: ${violatingParts.slice(0, 3).join(' • ')}${violatingParts.length > 3 ? ' • …' : ''} — متأكد إنك عايز تطبّقه رغم الخسارة؟`,
        confirmText: 'أيوه، طبّق رغم الخسارة',
        onConfirm: () => {
          doApplyGroupModifier();
          showToast('تم تحديث تسعير المجموعة (مع وجود أصناف تحت التكلفة كما أكّدت).', 'warning');
          setConfirmDialog(null);
        }
      });
    } else {
      doApplyGroupModifier();
      showToast('تم تحديث تسعير وعملة ورسوم توصيل المجموعة بنجاح!', 'success');
    }
  };
const handleSaveLiveInvoiceEdit = (restockRemoved = true) => {
    if (!editingOrder) return;
    if (!Array.isArray(editingOrder.items) || editingOrder.items.length === 0) {
      showToast('⚠️ لا يمكن حفظ فاتورة فاضية — أضف صنفاً واحداً على الأقل، أو أغلق المحرر وألغِ الطلب.', 'error');
      return;
    }
    const originalOrder = orders.find(o => o.id === editingOrder.id);
    if (!originalOrder) return;

    const oldTotalBase =
      originalOrder.items.reduce((s, i) => s + i.qty * i.unitPriceBase, 0) +
      originalOrder.deliveryFeeBase -
      originalOrder.discountBase;

    const newTotalBase =
      editingOrder.items.reduce((s, i) => s + i.qty * i.unitPriceBase, 0) +
      editingOrder.deliveryFeeBase -
      editingOrder.discountBase;

    if (newTotalBase < 0) {
      showToast('⚠️ إجمالي الفاتورة سالب — راجع الخصم ورسوم التوصيل قبل الحفظ.', 'error');
      return;
    }

    const diffBase = newTotalBase - oldTotalBase;

    // 1. Adjust Warehouse Stock based on quantity deltas
    if (restockRemoved) {
      setParts(prevParts =>
        prevParts.map(part => {
          const oldQty = originalOrder.items
            .filter(i => i.partId === part.id)
            .reduce((a, i) => a + (Number(i.qty) || 0), 0);
          const newQty = editingOrder.items
            .filter(i => i.partId === part.id)
            .reduce((a, i) => a + (Number(i.qty) || 0), 0);
          const deltaQty = oldQty - newQty;
          if (deltaQty === 0) return part;
          return { ...part, stock: Math.max(0, part.stock + deltaQty) };
        })
      );
    }

    // 2. Adjust Client Financial Ledger ONLY IF Admin explicitly checked `manualRefundToWallet`
    // (Default is FALSE because orders are Cash on Delivery and client hasn't paid yet!)
    if (diffBase !== 0 && editingOrder.manualRefundToWallet) {
      setClients(prevClients =>
        prevClients.map(c => {
          if (c.id !== editingOrder.clientId) return c;
          const walletAdjustment = -diffBase;
          const updatedBalance = c.walletBalance + walletAdjustment;
          const newEntry = {
            id: `ldg_${Date.now()}`,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            type: 'adjustment',
            ref: editingOrder.id,
            desc:
              walletAdjustment > 0
                ? `إضافة رصيد دائن للمحفظة من الفاتورة ${editingOrder.id}`
                : `قيد مديونية من الفاتورة ${editingOrder.id}`,
            amount: walletAdjustment,
            balanceAfter: updatedBalance
          };
          return {
            ...c,
            walletBalance: updatedBalance,
            ledger: [newEntry, ...c.ledger]
          };
        })
      );
    }

    // 3. Save Order: Only show note to client if Admin explicitly checked `showClientBanner` OR wrote a custom note
    const hasCustomNote = Boolean(editingOrder.adminEditNote && editingOrder.adminEditNote.trim());
    const shouldShowToClient = Boolean(editingOrder.showClientBanner && hasCustomNote);

    const updatedOrder = {
      ...editingOrder,
      adminEdited: shouldShowToClient ? true : Boolean(originalOrder.adminEdited),
      adminEditNote: shouldShowToClient ? editingOrder.adminEditNote.trim() : originalOrder.adminEditNote || ''
    };

    setOrders(prev => prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o)));

    // 4. Send Notification to Client ONLY IF Admin explicitly checked `sendClientNotif`
    if (editingOrder.sendClientNotif) {
      const notifMsg = hasCustomNote
        ? editingOrder.adminEditNote.trim()
        : `تم مراجعة وتحديث أصناف طلبك رقم #${editingOrder.id}. الإجمالي المطلوب الآن هو ${formatMoney(newTotalBase)}.`;
      setNotifications(prev => [
        {
          id: `ntf_${Date.now()}`,
          target: editingOrder.clientId,
          title: `تحديث على طلبك #${editingOrder.id}`,
          msg: notifMsg,
          time: 'الآن',
          read: false,
          orderId: editingOrder.id
        },
        ...prev
      ]);
    }

    setEditingOrder(null);
    showToast(
      diffBase !== 0 && editingOrder.manualRefundToWallet
        ? 'تم حفظ تعديلات الفاتورة وتحديث المخزون، وتمت تسوية الفرق على محفظة العميل كما طلبت.'
        : 'تم حفظ تعديلات الفاتورة وتحديث المخزون بنجاح (بدون أي مساس بمحفظة العميل)!',
      'success'
    );
  };
const openOrderStatusWhatsApp = (ord, status) => {
    try {
      if (!ord) return;
      const cliObj = clients.find(c => String(c.id) === String(ord.clientId));
      const rawPhone = normalizeDigits(ord.clientPhone || cliObj?.phone || '').replace(/[^0-9]/g, '');
      if (!rawPhone) return;
      const intlPhone = rawPhone.startsWith('0') ? `2${rawPhone}` : rawPhone;
      const friendly = ({ 'تم الاستلام': 'استلمنا طلبك وجاري تأكيده', 'جاري التجهيز': 'طلبك بيتجهز دلوقتي', 'جاهز للتسليم': 'طلبك اتجهز وبقى جاهز للتسليم', 'في الطريق (دليفري)': 'طلبك خرج مع المندوب وفي الطريق ليك', 'تم التسليم': 'طلبك اتسلّم بنجاح', 'ملغي': 'طلبك اتلغى' })[status] || status;
      const msg = `مرحباً *${ord.clientName}* 👋\nتحديث طلبك رقم *#${ord.id}* من متجر *${siteSettings.storeName || 'ELZOGHBI'}*:\n📌 ${friendly}\nشكراً لثقتك بنا! 🌟`;
      window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    } catch (e) {}
  };
const handleUpdateOrderStatus = (orderId, newStatus, byClient = false) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    if (newStatus === 'ملغي' && targetOrder.status !== 'ملغي') {
      // 1. Automatically restore stock
      setParts(prevParts =>
        prevParts.map(p => {
          const item = targetOrder.items.find(i => i.partId === p.id);
          if (!item) return p;
          return { ...p, stock: p.stock + item.qty };
        })
      );

      // 2. Refund walletUsedBase or reverse deferred invoice debt on Client Ledger
      const orderNetTotal =
        targetOrder.items.reduce((s, i) => s + i.qty * i.unitPriceBase, 0) +
        targetOrder.deliveryFeeBase -
        targetOrder.discountBase;
      const refundToWallet = Number(targetOrder.walletUsedBase || 0);

      if (refundToWallet > 0) {
        setClients(prevClients =>
          prevClients.map(c => {
            if (c.id !== targetOrder.clientId) return c;
            const nextBal = c.walletBalance + refundToWallet;
            return {
              ...c,
              walletBalance: nextBal,
              ledger: [
                {
                  id: `ldg_${Date.now()}_cancel`,
                  date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                  type: 'cancel_refund',
                  ref: orderId,
                  desc: `رد المبلغ / إلغاء قيد الفاتورة الملغاة (${orderId})`,
                  amount: refundToWallet,
                  balanceAfter: nextBal
                },
                ...c.ledger
              ]
            };
          })
        );
      }

      showToast(
        byClient
          ? `تم إلغاء الطلب ${orderId} بنجاح وإعادة الرصيد لحسابكم.`
          : `تم إلغاء الطلب ${orderId} وإرجاع جميع الكميات إلى رصيد المخزن تلقائياً.`,
        'info'
      );
    } else if (newStatus === 'تم التسليم' && targetOrder.status !== 'تم التسليم' && !targetOrder.cashbackAwarded) {
      // 1. Calculate Per-Product Cashback (checks BOTH order item snapshot AND live catalog cashback setting!)
      const orderClientObj = clients.find(
        c => String(c.id) === String(targetOrder.clientId) ||
             (targetOrder.clientPhone && String(c.phone) === String(targetOrder.clientPhone)) ||
             String(c.name).trim() === String(targetOrder.clientName).trim()
      );
      const clientLoyalty = getClientLoyaltyStatus(orderClientObj);
      const loyaltyBonusPct = (siteSettings.enableLoyaltyTiers !== false && clientLoyalty?.currentTier?.bonusCashbackPct)
        ? Number(clientLoyalty.currentTier.bonusCashbackPct)
        : 0;

      let eligibleCashbackTotal = 0;
      const eligibleNames = [];
      (targetOrder.items || []).forEach(it => {
        const partObj = parts.find(
          p => String(p.id) === String(it.partId) ||
               (it.sku && String(p.sku) === String(it.sku)) ||
               String(p.name).trim() === String(it.name || '').replace(/\s*\(.*?\)\s*$/, '').trim()
        );
        const isEligible = Boolean(it.cashbackEnabled) || (partObj ? isPartCashbackEnabled(partObj) : false);
        const basePct = partObj ? getPartCashbackPct(partObj) : (Number(it.cashbackPct) || Number(siteSettings.defaultCashbackPct) || 2);
        const totalPct = isEligible ? (basePct + loyaltyBonusPct) : 0;

        if (isEligible && totalPct > 0 && siteSettings.enableWalletCashback !== false) {
          const lineVal = (Number(it.unitPriceBase) || 0) * (Number(it.qty) || 1);
          const itemCb = Math.max(1, Math.round((lineVal * totalPct) / 100));
          eligibleCashbackTotal += itemCb;
          eligibleNames.push(`${it.name} (${totalPct}%)`);
        }
      });

      // 2. Check Refer-a-Friend ("هات صاحبك") on First Delivered Order!
      let referralRewardAmount = 0;
      let referrerClientObj = null;
      const isFirstDeliveredForClient = orders.filter(
        o => String(o.clientId) === String(targetOrder.clientId) && o.status === 'تم التسليم' && o.id !== orderId
      ).length === 0;

      if (siteSettings.enableReferralProgram !== false && isFirstDeliveredForClient) {
        const refCodeOrId = targetOrder.referrerClientId || targetOrder.referralCodeUsed || orderClientObj?.referrerClientId || orderClientObj?.referredByCode;
        if (refCodeOrId) {
          referrerClientObj = clients.find(
            c => String(c.id) !== String(targetOrder.clientId) && (
              String(c.id) === String(refCodeOrId) ||
              String(c.referralCode || '').toUpperCase() === String(refCodeOrId).toUpperCase() ||
              String(c.phone || '') === String(refCodeOrId)
            )
          );
          if (referrerClientObj) {
            const ordSubtotal = (targetOrder.items || []).reduce((s, i) => s + (Number(i.unitPriceBase) || 0) * (Number(i.qty) || 1), 0);
            if (siteSettings.referralRewardType === 'percentage') {
              const rPct = Number(siteSettings.referralRewardPct) || 5;
              referralRewardAmount = Math.max(5, Math.round((ordSubtotal * rPct) / 100));
            } else {
              referralRewardAmount = Math.max(5, Number(siteSettings.referralRewardFixedAmount) || 50);
            }
          }
        }
      }

      const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const targetClientIdStr = orderClientObj ? String(orderClientObj.id) : String(targetOrder.clientId);

      setClients(prevClients =>
        prevClients.map(c => {
          // Credit the ordering customer (Cashback + Referral Friend Bonus + Order Count + Last Order Date)
          if (String(c.id) === targetClientIdStr) {
            const nextOrderCount = (Number(c.orderCount) || 0) + 1;
            const nextIsVip = nextOrderCount >= vipMinOrders || Boolean(c.isVip);
            const totalCreditAdded = eligibleCashbackTotal + referralRewardAmount;
            const nextBal = (Number(c.walletBalance) || 0) + totalCreditAdded;
            const newLedgerEntries = [...(c.ledger || [])];

            if (eligibleCashbackTotal > 0) {
              newLedgerEntries.unshift({
                id: `ldg_cb_${orderId}_${Date.now()}`,
                date: nowStamp,
                type: 'cashback',
                ref: orderId,
                desc: `💰 مكافأة كاش باك المحفظة عن الفاتورة (${orderId}): ${eligibleNames.join(' + ')}`,
                amount: eligibleCashbackTotal,
                balanceAfter: (Number(c.walletBalance) || 0) + eligibleCashbackTotal
              });
            }
            if (referralRewardAmount > 0 && referrerClientObj) {
              newLedgerEntries.unshift({
                id: `ldg_ref_friend_${orderId}_${Date.now()}`,
                date: nowStamp,
                type: 'referral_bonus',
                ref: orderId,
                desc: `🤝 هدية "هات صاحبك" لأول طلب مستلم بدعوة من (${referrerClientObj.name})`,
                amount: referralRewardAmount,
                balanceAfter: nextBal
              });
            }

            const updatedClient = {
              ...c,
              walletBalance: nextBal,
              cashbackEarned: (Number(c.cashbackEarned) || 0) + totalCreditAdded,
              orderCount: nextOrderCount,
              lastOrderAt: nowStamp,
              isVip: nextIsVip,
              ledger: newLedgerEntries
            };
            markLocalUpsert('clients', updatedClient);
            sbUpsert('clients', updatedClient);
            return updatedClient;
          }

          // Credit the Referrer Friend ("هات صاحبك")!
          if (referrerClientObj && String(c.id) === String(referrerClientObj.id) && referralRewardAmount > 0) {
            const nextRefBal = (Number(c.walletBalance) || 0) + referralRewardAmount;
            const updatedReferrer = {
              ...c,
              walletBalance: nextRefBal,
              cashbackEarned: (Number(c.cashbackEarned) || 0) + referralRewardAmount,
              ledger: [
                {
                  id: `ldg_ref_owner_${orderId}_${Date.now()}`,
                  date: nowStamp,
                  type: 'referral_bonus',
                  ref: orderId,
                  desc: `🤝 مكافأة "هات صاحبك" لاستلام صديقك (${targetOrder.clientName}) أول أوردر (${orderId})`,
                  amount: referralRewardAmount,
                  balanceAfter: nextRefBal
                },
                ...(c.ledger || [])
              ]
            };
            markLocalUpsert('clients', updatedReferrer);
            sbUpsert('clients', updatedReferrer);
            return updatedReferrer;
          }

          return c;
        })
      );

      // Generate 2 Personal Single-Use Referral Coupons (1 for Referrer + 1 for Referred Friend) in the same transaction!
      let generatedReferrerCouponCode = '';
      let generatedReferredCouponCode = '';
      if (referralRewardAmount > 0 && referrerClientObj) {
        generatedReferrerCouponCode = `REFWIN-${String(referrerClientObj.id).slice(-3).toUpperCase()}-${String(Date.now()).slice(-4)}`;
        generatedReferredCouponCode = `FRNDWIN-${String(targetClientIdStr).slice(-3).toUpperCase()}-${String(Date.now()).slice(-4)}`;
        const expDateStr = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

        const referrerCouponObj = {
          id: `prm_ref_owner_${orderId}`,
          code: generatedReferrerCouponCode,
          type: siteSettings.referralRewardType === 'percentage' ? 'percentage' : 'fixed',
          value: siteSettings.referralRewardType === 'percentage' ? (Number(siteSettings.referralRewardPct) || 5) : referralRewardAmount,
          maxDiscountCap: 500,
          minOrderAmount: 0,
          usageLimit: 1,
          maxUsesPerUser: 1,
          assignedUserId: referrerClientObj.id,
          sourceFeature: 'referral_program',
          usedCount: 0,
          expiryDate: expDateStr,
          description: `هدية دعوة صديقك (${targetOrder.clientName}) — خاصة بصاحب الكود (${referrerClientObj.name})`,
          active: true
        };

        const referredCouponObj = {
          id: `prm_ref_friend_${orderId}`,
          code: generatedReferredCouponCode,
          type: siteSettings.referralRewardType === 'percentage' ? 'percentage' : 'fixed',
          value: siteSettings.referralRewardType === 'percentage' ? (Number(siteSettings.referralRewardPct) || 5) : referralRewardAmount,
          maxDiscountCap: 500,
          minOrderAmount: 0,
          usageLimit: 1,
          maxUsesPerUser: 1,
          assignedUserId: targetClientIdStr,
          sourceFeature: 'referral_program',
          usedCount: 0,
          expiryDate: expDateStr,
          description: `هدية إتمام أول طلب بدعوة صديقك (${referrerClientObj.name}) — خاصة بالصديق المدعو`,
          active: true
        };

        setPromoCodes(prev => [referrerCouponObj, referredCouponObj, ...prev]);
        markLocalUpsert('promoCodes', referrerCouponObj);
        markLocalUpsert('promoCodes', referredCouponObj);
        sbUpsert('promo_codes', referrerCouponObj);
        sbUpsert('promo_codes', referredCouponObj);

        callServerCroRpc('rpc_complete_referral_on_delivery', {
          p_referred_user_id: String(targetClientIdStr),
          p_order_id: String(orderId)
        });

        setNotifications(prev => [
          {
            id: `ntf_ref_owner_${Date.now()}`,
            target: String(referrerClientObj.id),
            title: `🎁 مبروك! صديقك (${targetOrder.clientName}) استلم أول طلب وكسبت هدية الإحالة!`,
            msg: `تم إيداع +${referralRewardAmount} ج.م في محفظتك + إصدار كوبون هدية خاص بك (${generatedReferrerCouponCode}) لاستخدامه في طلبك القادم!`,
            time: 'الآن',
            read: false
          },
          {
            id: `ntf_ref_friend_${Date.now() + 1}`,
            target: String(targetClientIdStr),
            title: `🎁 مبروك! كسبت هدية دعوة الأصدقاء مع (${referrerClientObj.name})!`,
            msg: `تم إيداع +${referralRewardAmount} ج.م في محفظتك + إصدار كوبون هدية خاص بك (${generatedReferredCouponCode})!`,
            time: 'الآن',
            read: false
          },
          ...prev
        ]);
      }

      if (eligibleCashbackTotal > 0 || referralRewardAmount > 0) {
        triggerConfettiCelebration();
        showToast(
          `✅ تم تسليم الطلب ${orderId}! أُضيف كاش باك +${eligibleCashbackTotal} ج.م${referralRewardAmount > 0 ? ` + إصدار كوبوني هدية الإحالة للاثنين معاً (${generatedReferrerCouponCode} و ${generatedReferredCouponCode}) وإيداع +${referralRewardAmount} ج.م للصديقين` : ''}!`,
          'success'
        );
      } else {
        showToast(
          `تم تحديث حالة الطلب ${orderId} إلى "تم التسليم" (الأصناف في هذه الفاتورة غير مفعّل عليها كاش باك حالياً).`,
          'info'
        );
      }

      setOrders(prev =>
        prev.map(o => {
          if (o.id !== orderId) return o;
          const updatedOrd = {
            ...o,
            status: newStatus,
            statusUpdatedAt: Date.now(),
            cashbackAwarded: true,
            cashbackAmountBase: eligibleCashbackTotal,
            referralRewardAmountBase: referralRewardAmount
          };
          markLocalUpsert('orders', updatedOrd);
          sbUpsert('orders', updatedOrd);
          return updatedOrd;
        })
      );

      setNotifications(prev => [
        {
          id: `ntf_${Date.now()}`,
          target: targetClientIdStr,
          title: eligibleCashbackTotal > 0 ? `🎉 تم تسليم طلبك #${orderId} وإضافة +${eligibleCashbackTotal} ج.م كاش باك لمحفظتك!` : `تحديث حالة طلبك #${orderId}`,
          msg: eligibleCashbackTotal > 0
            ? `استلمت طلبك رقم ${orderId} بنجاح وتم إيداع ${eligibleCashbackTotal} ج.م كاش باك في محفظتك لاستخدامها في طلباتك القادمة!`
            : `تغيرت حالة فاتورتك رقم ${orderId} إلى: (${newStatus})`,
          time: 'الآن',
          read: false,
          orderId
        },
        ...prev
      ]);
      if (!byClient) openOrderStatusWhatsApp(targetOrder, newStatus);
      return;
    } else {
      showToast(`تم تحديث حالة الطلب ${orderId} إلى "${newStatus}" وإرسال إشعار للعميل.`, 'success');
      if (!byClient) openOrderStatusWhatsApp(targetOrder, newStatus);
    }

    setNotifications(prev => [
      {
        id: `ntf_${Date.now()}`,
        target: byClient ? 'admin' : targetOrder.clientId,
        title: byClient ? `إلغاء طلب #${orderId} من العميل` : `تحديث حالة طلبك #${orderId}`,
        msg: byClient
          ? `قام العميل "${targetOrder.clientName}" بإلغاء الطلب ${orderId} قبل التوصيل وتم استرجاع المخزون.`
          : `تغيرت حالة فاتورتك رقم ${orderId} إلى: (${newStatus})`,
        time: 'الآن',
        read: false,
        orderId
      },
      ...prev
    ]);

    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const updatedOrd = { ...o, status: newStatus, statusUpdatedAt: Date.now() };
        markLocalUpsert('orders', updatedOrd);
        sbUpsert('orders', updatedOrd);
        return updatedOrd;
      })
    );
  };
const handleResolveReturn = (retId, decision, restockHealthy, adminNote) => {
    const targetRet = returnsList.find(r => r.id === retId);
    if (!targetRet) return;

    const wasApproved = targetRet.status === 'مقبول';
    const wasRestocked = targetRet.resolutionType === 'مرتجع سليم للمخزن';

    // If previously approved and now changing to rejected or pending, reverse previous credit & stock
    if (wasApproved && decision !== 'مقبول') {
      if (wasRestocked) {
        setParts(prev =>
          prev.map(p => (String(p.id) === String(targetRet.partId) ? { ...p, stock: Math.max(0, p.stock - targetRet.qty) } : p))
        );
      }
      setClients(prev =>
        prev.map(c => {
          if (String(c.id) !== String(targetRet.clientId)) return c;
          const nextBal = c.walletBalance - targetRet.refundAmountBase;
          return {
            ...c,
            walletBalance: nextBal,
            ledger: [
              {
                id: `ldg_${Date.now()}_rev`,
                date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                type: 'adjustment',
                ref: targetRet.id,
                desc: `عكس قيد تعويض مرتجع (${targetRet.id}) بعد تغيير حالة القرار إلى ${decision}`,
                amount: -targetRet.refundAmountBase,
                balanceAfter: nextBal
              },
              ...c.ledger
            ]
          };
        })
      );
    }

    // If now approving (and wasn't already approved)
    if (decision === 'مقبول' && !wasApproved) {
      if (restockHealthy) {
        setParts(prev =>
          prev.map(p => (String(p.id) === String(targetRet.partId) ? { ...p, stock: p.stock + targetRet.qty } : p))
        );
      }
      setClients(prev =>
        prev.map(c => {
          if (String(c.id) !== String(targetRet.clientId)) return c;
          const nextBal = c.walletBalance + targetRet.refundAmountBase;
          return {
            ...c,
            walletBalance: nextBal,
            ledger: [
              {
                id: `ldg_${Date.now()}`,
                date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                type: 'return_credit',
                ref: targetRet.id,
                desc: `تعويض مرتجع مقبول (${targetRet.partName}) - فاتورة ${targetRet.orderId}`,
                amount: targetRet.refundAmountBase,
                balanceAfter: nextBal
              },
              ...c.ledger
            ]
          };
        })
      );
    } else if (decision === 'مقبول' && wasApproved && wasRestocked !== restockHealthy) {
      // Toggling between Healthy Restock and Defective while staying Approved
      setParts(prev =>
        prev.map(p =>
          String(p.id) === String(targetRet.partId)
            ? { ...p, stock: Math.max(0, p.stock + (restockHealthy ? targetRet.qty : -targetRet.qty)) }
            : p
        )
      );
    }

    const newReplyEntry = adminNote
      ? {
          id: `rrep_${Date.now()}`,
          sender: 'admin',
          text: adminNote,
          statusSet: decision,
          date: new Date().toISOString().slice(0, 16).replace('T', ' ')
        }
      : null;

    setReturnsList(prev =>
      prev.map(r =>
        r.id === retId
          ? {
              ...r,
              status: decision,
              resolutionType:
                decision === 'مقبول'
                  ? restockHealthy
                    ? 'مرتجع سليم للمخزن'
                    : 'هالك / تالف'
                  : decision === 'مرفوض'
                  ? 'مرفوض'
                  : 'قيد المراجعة',
              adminResponse:
                adminNote ||
                r.adminResponse ||
                (decision === 'مقبول'
                  ? 'تم فحص القطعة وقبول الاسترجاع وإضافة الرصيد لمحفظتكم.'
                  : decision === 'مرفوض'
                  ? 'تم رفض المرتجع لمخالفة شروط الضمان.'
                  : 'قيد الفحص الفني.'),
              replies: newReplyEntry ? [...(r.replies || []), newReplyEntry] : r.replies || []
            }
          : r
      )
    );

    showToast(`تم تحديث قرار المرتجع (${retId}) إلى "${decision}" ومزامنة الحساب والمخزن!`, 'success');
  };
const adminKpis = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'ملغي');
    let totalRevenueBase = 0;
    let totalCostBase = 0;

    validOrders.forEach(o => {
      o.items.forEach(i => {
        totalRevenueBase += (Number(i.qty) || 0) * (Number(i.unitPriceBase) || 0);
        totalCostBase += (Number(i.qty) || 0) * (Number(i.costPriceBase) || 0);
      });
      totalRevenueBase -= Number(o.discountBase) || 0;
    });

    const netProfitBase = totalRevenueBase - totalCostBase;
    const lowStockParts = parts.filter(p => p.stock > 0 && p.stock <= (Number(p.lowStockThreshold) || 5));
    const outOfStockParts = parts.filter(p => p.stock === 0);
    const totalWaitlist = parts.reduce((s, p) => s + (p.waitlistCount || 0), 0);
    const totalReceivablesBase = clients.reduce(
      (s, c) => (c.walletBalance < 0 ? s + Math.abs(c.walletBalance) : s),
      0
    );

    return {
      totalRevenueBase,
      netProfitBase,
      activeOrdersCount: orders.filter(o => o.status !== 'تم التسليم' && o.status !== 'ملغي').length,
      lowStockParts,
      outOfStockParts,
      totalWaitlist,
      totalReceivablesBase
    };
  }, [orders, parts, clients]);
const [profileForm, setProfileForm] = useState(null);
const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
useEffect(() => {
    if (currentClient) {
      setProfileForm({
        name: currentClient.name,
        owner: currentClient.owner,
        phone: currentClient.phone,
        email: currentClient.email || '',
        address: currentClient.address || '',
        secondaryAddress: currentClient.secondaryAddress || '',
        birthDate: currentClient.birthDate || '',
        avatar: currentClient.avatar || 'TF',
        avatarBg: currentClient.avatarBg || 'from-blue-600 to-slate-700',
        avatarImage: currentClient.avatarImage || ''
      });
    }
  }, [currentClient?.id]);
const handleClientAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadedUrl = await processAndUploadImage(file, 'avatars');
    if (!uploadedUrl) return;
    setProfileForm(prev => ({ ...prev, avatarImage: uploadedUrl }));
    setClients(prev =>
      prev.map(c => (c.id === currentClient.id ? { ...c, avatarImage: uploadedUrl } : c))
    );
    showToast('الصورة اتحفظت!', 'success');
  };
const handleSaveClientProfile = (e) => {
    e.preventDefault();
    if (!currentClient || !profileForm) return;
    setClients(prev =>
      prev.map(c =>
        c.id === currentClient.id
          ? {
              ...c,
              name: profileForm.name,
              owner: profileForm.owner,
              phone: profileForm.phone,
              email: profileForm.email,
              address: profileForm.address,
              secondaryAddress: profileForm.secondaryAddress,
              birthDate: profileForm.birthDate || '',
              avatar: profileForm.avatar,
              avatarBg: profileForm.avatarBg,
              avatarImage: profileForm.avatarImage
            }
          : c
      )
    );
    const isBdayAlreadyLocked = Boolean(currentClient.birthDateLocked && currentClient.birthDate);
    const finalBirthDate = isBdayAlreadyLocked ? currentClient.birthDate : (profileForm.birthDate || currentClient.birthDate || '');
    const nextBirthDateLocked = Boolean(finalBirthDate);

    const updatedCli = {
      ...currentClient,
      name: profileForm.name,
      owner: profileForm.owner,
      phone: profileForm.phone,
      email: profileForm.email,
      address: profileForm.address,
      secondaryAddress: profileForm.secondaryAddress,
      birthDate: finalBirthDate,
      birthDateLocked: nextBirthDateLocked,
      avatar: profileForm.avatar,
      avatarBg: profileForm.avatarBg,
      avatarImage: profileForm.avatarImage
    };
    markLocalUpsert('clients', updatedCli);
    sbUpsert('clients', updatedCli);
    showToast('بياناتك وتاريخ ميلادك وعناوينك اتحفظت بنجاح!', 'success');
  };
const handleChangeClientPassword = async (e) => {
    e.preventDefault();
    if (!currentClient) return;
    // Security fix #7 (Stage B): verify the current password on the server
    // via RPC instead of trusting a locally stored copy.
    let currentOk = null;
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (isValid) {
        const res = await fetch(`${sbUrl}/rest/v1/rpc/client_login`, {
          method: 'POST',
          headers: sbHeaders(sbKey, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ p_phone: String(currentClient.phone || ''), p_password: String(passwordForm.current || '') })
        });
        if (res.ok) {
          const rpcClient = await res.json();
          currentOk = !!(rpcClient && rpcClient.id === currentClient.id);
        }
      }
    } catch (err) {}
    if (currentOk === null) currentOk = passwordForm.current === currentClient.password;
    if (!currentOk) {
      showToast('كلمة المرور الحالية غلط!', 'error');
      return;
    }
    if (!passwordForm.next || passwordForm.next.length < 3) {
      showToast('اكتب كلمة مرور جديدة (3 حروف أو أرقام على الأقل).', 'warning');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      showToast('كلمة المرور الجديدة والتأكيد مش زي بعض!', 'warning');
      return;
    }
    setClients(prev =>
      prev.map(c => (c.id === currentClient.id ? { ...c, password: passwordForm.next } : c))
    );
    setPasswordForm({ current: '', next: '', confirm: '' });
    showToast('كلمة المرور اتغيّرت!', 'success');
  };
const [newComplaintSubject, setNewComplaintSubject] = useState('');
const [newComplaintMsg, setNewComplaintMsg] = useState('');
const [newComplaintType, setNewComplaintType] = useState('مقترح توفير صنف');
const [clientFollowupText, setClientFollowupText] = useState({});
const [adminSecurityModalOpen, setAdminSecurityModalOpen] = useState(false);
const [adminNewUsername, setAdminNewUsername] = useState('admin');
const [adminNewPassword, setAdminNewPassword] = useState('');
const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    const u = adminLoginUser.trim().toLowerCase();
    const p = adminLoginPass;

    // Real login (Supabase Auth, JWT verified server-side). Role comes from public.admin_profiles — never from a header.
    if (u.includes('@')) {
      const { sbUrl, sbKey } = getSupabaseConfig();
      const si = await adminSignIn(sbUrl, sbKey, u, p);
      if (!si.ok) { showToast(si.error, 'error'); return; }
      const prof = await fetchMyAdminProfile(sbUrl, sbKey);
      if (!prof) { adminSignOut(); showToast('الحساب ده مش مسجّل كمدير (admin_profiles) — كلّم المالك.', 'error'); return; }
      const defaults = { moderator: ['overview', 'marketplace'], editor: ['overview', 'catalog', 'storefront_cms', 'karambo', 'promos'], support: ['overview', 'orders', 'returns', 'sourcing', 'clients'] };
      const perms = prof.role === 'admin' ? ['*'] : [...new Set([...(defaults[prof.role] || []), ...(Array.isArray(prof.permissions) ? prof.permissions : [])])];
      setAdminCredentials({ username: '', password: '' });
      setAdminSession({ username: u, displayName: prof.display_name || u, roleLabel: prof.role, isOwner: prof.role === 'owner', permissions: prof.role === 'owner' ? null : perms, authMode: 'supabase' });
      setAdminAuthenticated(true);
      showToast('دخلت لوحة التحكم بحساب Supabase Auth ✓', 'success');
      return;
    }

    // Security fix #7 (Stage B): verify on the server via RPC so the app
    // never needs the admin credentials downloaded to the browser.
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (isValid) {
        const res = await fetch(`${sbUrl}/rest/v1/rpc/verify_admin_login`, {
          method: 'POST',
          headers: sbHeaders(sbKey, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ p_username: u, p_password: p })
        });
        if (res.ok) {
          const ok = await res.json();
          if (ok === true) {
            adminRpcCredsRef.current = { username: u, password: p };
            setAdminCredentials({ username: u, password: p });
            setAdminSession({ username: u, displayName: u, roleLabel: 'المالك', isOwner: true, permissions: null });
            setAdminAuthenticated(true);
            showToast('دخلت لوحة تحكم الإدارة!', 'success');
            return;
          }
          // Employee (RBAC) login — the owner credentials did not match.
          try {
            const r2 = await fetch(`${sbUrl}/rest/v1/rpc/admin_user_login`, {
              method: 'POST',
              headers: sbHeaders(sbKey, { 'Content-Type': 'application/json' }),
              body: JSON.stringify({ p_username: u, p_password: p })
            });
            if (r2.ok) {
              const data = await r2.json();
              if (data && data.ok) {
                adminRpcCredsRef.current = { username: u, password: p };
                setAdminSession({
                  username: data.username,
                  displayName: data.display_name || data.username,
                  roleLabel: data.role_label || '',
                  isOwner: false,
                  permissions: Array.isArray(data.permissions) ? data.permissions : []
                });
                // Employees never hold the owner's credentials on this device.
                setAdminCredentials({ username: '', password: '' });
                setAdminAuthenticated(true);
                showToast(`أهلًا ${data.display_name || data.username}! دخلت لوحة التحكم.`, 'success');
                return;
              }
              if (data && data.error === 'inactive') {
                showToast('الحساب ده موقوف مؤقتًا — كلم المدير عشان يفعّله.', 'error');
                return;
              }
            }
          } catch (err) {}
          showToast('اسم المستخدم أو كلمة المرور غلط!', 'error');
          return;
        }
      }
    } catch (err) {}

    // Transitional fallback (only while the RPC is unreachable AND a non-empty local password exists):
    const savedPass = String(adminCredentials.password || '');
    if (!savedPass) {
      showToast('تعذر الاتصال بسيرفر التحقق من بيانات الإدارة. اتأكد من النت وجرّب تاني.', 'error');
      return;
    }
    const isSyncedMatch =
      u === (adminCredentials.username || 'admin').trim().toLowerCase() &&
      p === savedPass;

    if (isSyncedMatch) {
      setAdminSession({ username: u, displayName: u, roleLabel: 'المالك', isOwner: true, permissions: null });
      setAdminAuthenticated(true);
      showToast('دخلت لوحة تحكم الإدارة!', 'success');
    } else {
      showToast('اسم المستخدم أو كلمة المرور غلط!', 'error');
    }
  };
// ===== Team (RBAC): employee dashboard accounts, managed by the owner only =====
const loadTeamUsers = async () => {
    const u = (adminCredentials.username || '').trim().toLowerCase();
    const p = adminCredentials.password || '';
    if (!u || !p) return;
    setTeamLoading(true);
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (isValid) {
        const res = await fetch(`${sbUrl}/rest/v1/rpc/admin_users_list`, {
          method: 'POST',
          headers: sbHeaders(sbKey, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ p_owner_username: u, p_owner_password: p })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok && Array.isArray(data.users)) setTeamUsers(data.users);
          else if (data && data.error === 'unauthorized') showToast('إدارة الفريق متاحة لحساب المالك بس.', 'error');
        }
      }
    } catch (err) {}
    setTeamLoading(false);
  };
const saveTeamUser = async () => {
    if (!teamForm) return;
    const u = (adminCredentials.username || '').trim().toLowerCase();
    const p = adminCredentials.password || '';
    if (!u || !p) { showToast('إدارة الفريق متاحة لحساب المالك بس.', 'error'); return; }
    if (!(teamForm.username || '').trim()) { showToast('اكتب اسم الدخول للموظف.', 'error'); return; }
    if (!teamForm.id && !(teamForm.newPassword || '')) { showToast('اكتب كلمة مرور للموظف الجديد.', 'error'); return; }
    if (!Array.isArray(teamForm.permissions) || teamForm.permissions.length === 0) { showToast('اختار صلاحية واحدة على الأقل.', 'error'); return; }
    setTeamLoading(true);
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (!isValid) throw new Error('cfg');
      const res = await fetch(`${sbUrl}/rest/v1/rpc/admin_user_save`, {
        method: 'POST',
        headers: sbHeaders(sbKey, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          p_owner_username: u,
          p_owner_password: p,
          p_id: teamForm.id || '',
          p_username: (teamForm.username || '').trim().toLowerCase(),
          p_display_name: teamForm.displayName || '',
          p_role_label: teamForm.roleLabel || '',
          p_permissions: teamForm.permissions || [],
          p_is_active: teamForm.isActive !== false,
          p_new_password: teamForm.newPassword || ''
        })
      });
      const data = res.ok ? await res.json() : null;
      if (data && data.ok) {
        showToast(teamForm.id ? 'اتحفظت تعديلات الموظف ✓' : 'اتعمل حساب الموظف ✓', 'success');
        setTeamForm(null);
        await loadTeamUsers();
      } else {
        const err = data && data.error;
        showToast(
          err === 'username_taken' ? 'اسم الدخول ده مستخدم قبل كده — اختار اسم تاني.' :
          err === 'username_is_owner' ? 'مينفعش تستخدم اسم دخول المالك لموظف.' :
          err === 'unauthorized' ? 'إدارة الفريق متاحة لحساب المالك بس.' :
          'محصلش حفظ — اتأكد إن خطوة SQL رقم 04 اتنفذت في Supabase وحاول تاني.', 'error');
      }
    } catch (err) {
      showToast('تعذر الاتصال بالسيرفر — حاول تاني.', 'error');
    }
    setTeamLoading(false);
  };
const deleteTeamUser = async (userId) => {
    const u = (adminCredentials.username || '').trim().toLowerCase();
    const p = adminCredentials.password || '';
    if (!u || !p) return;
    setTeamLoading(true);
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (isValid) {
        const res = await fetch(`${sbUrl}/rest/v1/rpc/admin_user_delete`, {
          method: 'POST',
          headers: sbHeaders(sbKey, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ p_owner_username: u, p_owner_password: p, p_id: userId })
        });
        const data = res.ok ? await res.json() : null;
        if (data && data.ok) { showToast('اتحذف حساب الموظف.', 'info'); setTeamDeleteId(''); await loadTeamUsers(); }
        else showToast('محصلش حذف — حاول تاني.', 'error');
      }
    } catch (err) { showToast('تعذر الاتصال بالسيرفر — حاول تاني.', 'error'); }
    setTeamLoading(false);
  };
const toggleTeamUserActive = async (user) => {
    const u = (adminCredentials.username || '').trim().toLowerCase();
    const p = adminCredentials.password || '';
    if (!u || !p) return;
    setTeamLoading(true);
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (isValid) {
        const res = await fetch(`${sbUrl}/rest/v1/rpc/admin_user_save`, {
          method: 'POST',
          headers: sbHeaders(sbKey, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            p_owner_username: u,
            p_owner_password: p,
            p_id: user.id,
            p_username: user.username,
            p_display_name: user.display_name || '',
            p_role_label: user.role_label || '',
            p_permissions: user.permissions || [],
            p_is_active: !user.is_active,
            p_new_password: ''
          })
        });
        const data = res.ok ? await res.json() : null;
        if (data && data.ok) {
          showToast(user.is_active ? 'اتوقف حساب الموظف — مش هيقدر يدخل لحد ما تفعّله.' : 'اتفعّل حساب الموظف.', 'success');
          await loadTeamUsers();
        } else showToast('محصلش تحديث — حاول تاني.', 'error');
      }
    } catch (err) { showToast('تعذر الاتصال بالسيرفر — حاول تاني.', 'error'); }
    setTeamLoading(false);
  };
useEffect(() => {
    if (adminTab === 'team' && adminAuthenticated && isAdminOwner) loadTeamUsers();
  }, [adminTab, adminAuthenticated]);
useEffect(() => {
    // Employees stay inside the sections they were granted.
    if (adminAuthenticated && adminSession && !adminSession.isOwner && adminTab !== 'team') {
      const perms = Array.isArray(adminSession.permissions) ? adminSession.permissions : [];
      if (!perms.includes(adminTab) && perms[0]) setAdminTab(perms[0]);
    }
  }, [adminAuthenticated, adminSession, adminTab]);
const [adminAddPartId, setAdminAddPartId] = useState(INITIAL_PARTS[0].id);
const [invoicePartSearchQuery, setInvoicePartSearchQuery] = useState('');
const filteredAdminOrders = useMemo(() => {
    return orders
      .filter(o => {
        if (adminOrderStatusFilter !== 'ALL' && o.status !== adminOrderStatusFilter) return false;
        if (adminOrderSearch.trim() !== '') {
          const q = adminOrderSearch.trim().toLowerCase();
          const hay = `${o.id} ${o.clientName} ${o.address} ${o.paymentMethod} ${o.createdAt}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const itemsA = Array.isArray(a.items) ? a.items : [];
        const itemsB = Array.isArray(b.items) ? b.items : [];
        const totalA = itemsA.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPriceBase) || 0), 0) + (Number(a.deliveryFeeBase) || 0) - (Number(a.discountBase) || 0);
        const totalB = itemsB.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPriceBase) || 0), 0) + (Number(b.deliveryFeeBase) || 0) - (Number(b.discountBase) || 0);
        const qtyA = itemsA.reduce((s, i) => s + (Number(i.qty) || 0), 0);
        const qtyB = itemsB.reduce((s, i) => s + (Number(i.qty) || 0), 0);
        const dateA = String(a.createdAt || '');
        const dateB = String(b.createdAt || '');

        if (adminOrderSort === 'date_asc') return dateA.localeCompare(dateB);
        if (adminOrderSort === 'total_desc') return totalB - totalA;
        if (adminOrderSort === 'total_asc') return totalA - totalB;
        if (adminOrderSort === 'qty_desc') return qtyB - qtyA;
        if (adminOrderSort === 'name_asc') return String(a.clientName || '').localeCompare(String(b.clientName || ''), 'ar');
        return dateB.localeCompare(dateA);
      });
  }, [orders, adminOrderStatusFilter, adminOrderSearch, adminOrderSort]);
const [newModelBrand, setNewModelBrand] = useState('Apple');
const [newModelName, setNewModelName] = useState('');
const [newModelAliases, setNewModelAliases] = useState('');
const [newModelImage, setNewModelImage] = useState(PART_IMAGES.screen);
const [autoGenerateParts, setAutoGenerateParts] = useState(true);
const [partGroupPricesModalPart, setPartGroupPricesModalPart] = useState(null);
const [groupModalSearchQuery, setGroupModalSearchQuery] = useState('');
const handleNewModelImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadedUrl = await processAndUploadImage(file, 'models');
    if (uploadedUrl) {
      setNewModelImage(uploadedUrl);
      showToast('تم ضغط وتجهيز صورة الموديل بنجاح!', 'info');
    }
  };
const generateTemplatePartsForModel = (modelObj) => {
    const cleanCode = modelObj.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() || 'MDL';
    const enabledTemplates = autoTemplates.filter(t => t.enabled);
    const nowStr = '2020-01-01 08:25';

    return enabledTemplates.map((tpl, idx) => {
      const generatedName = tpl.namePattern.replace('{model}', modelObj.name);
      return {
        id: `prt_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        createdAt: nowStr,
        sku: `${tpl.skuPrefix}-${cleanCode}-${idx + 1}`,
        modelId: modelObj.id,
        category: tpl.category,
        name: generatedName,
        qualityGrade: tpl.qualityGrade,
        colors: tpl.colors && tpl.colors.length > 0 ? [...tpl.colors] : ['أسود'],
        compatibleModels: [modelObj.name],
        searchAliases: `${generatedName} ${modelObj.name} ${modelObj.aliases || ''} ${tpl.category}`,
        description: `${generatedName} — متوافق مع ${modelObj.name} (${tpl.qualityGrade}).`,
        warrantyText: tpl.warrantyText || 'ضمان معاينة وتجربة المنتج بحالته الأصلية',
        image: PART_IMAGES[tpl.imageKey] || modelObj.image || PART_IMAGES.screen,
        stock: Number(tpl.defaultStock) || 10,
        lowStockThreshold: Number(tpl.lowStockThreshold) || 5,
        maxOrderQty: Number(tpl.maxOrderQty) || 10,
        costPrice: Number(tpl.costPrice) || 500,
        basePrice: Number(tpl.basePrice) || 750,
        customGroupPrices: {},
        waitlistCount: 0
      };
    });
  };
const handleCreateModelWithTemplate = (e) => {
    e.preventDefault();
    if (!newModelName.trim()) return;
    const newMdlId = `mdl_${Date.now()}`;
    const newMdl = {
      id: newMdlId,
      brand: newModelBrand,
      name: newModelName.trim(),
      aliases: newModelAliases.trim() || newModelName.trim(),
      image: newModelImage || PART_IMAGES.screen
    };
    setModels(prev => [newMdl, ...prev]);

    if (autoGenerateParts) {
      const generated = generateTemplatePartsForModel(newMdl);
      setParts(prev => [...generated, ...prev]);
      showToast(
        `تم إضافة القسم/الموديل "${newMdl.name}" بصورته وتوليد ${generated.length} منتجات من القالب تلقائياً!`,
        'success'
      );
    } else {
      showToast(`تم إضافة موديل "${newMdl.name}" بنجاح!`, 'success');
    }

    setNewModelName('');
    setNewModelAliases('');
  };
const handleInjectMissingTemplatesIntoModel = (modelObj) => {
    const existingCategoriesAndGrades = new Set(
      parts
        .filter(p => {
          const mObj = resolvePartModelObj(p);
          return mObj && String(mObj.id) === String(modelObj.id);
        })
        .map(p => `${p.category}__${p.qualityGrade}`)
    );
    const allGenerated = generateTemplatePartsForModel(modelObj);
    const missingParts = allGenerated.filter(
      gp => !existingCategoriesAndGrades.has(`${gp.category}__${gp.qualityGrade}`)
    );

    if (missingParts.length === 0) {
      showToast(`جميع قطع التمبلت المفعلة موجودة بالفعل داخل موديل "${modelObj.name}"!`, 'info');
      return;
    }
    setParts(prev => [...missingParts, ...prev]);
    showToast(
      `تم تنزيل وإضافة ${missingParts.length} منتجات من القالب إلى "${modelObj.name}"!`,
      'success'
    );
  };
const handleDeletePart = (partObj) => {
    askConfirmDelete(
      'حذف قطعة غيار نهائياً',
      `هل أنت متأكد من حذف القطعة "${partObj.name}" من المخزن والكتالوج نهائياً؟`,
      () => {
        setParts(prev => prev.filter(p => p.id !== partObj.id));
        setCart(prev => {
          const copy = { ...prev };
          delete copy[partObj.id];
          return copy;
        });
        showToast(`تم حذف قطعة الغيار "${partObj.name}" من الموديل والمخزن.`, 'info');
      }
    );
  };
const handleDeleteModel = (modelObj) => {
    const childCount = parts.filter(p => String(p.modelId) === String(modelObj.id)).length;
    askConfirmDelete(
      'حذف القسم/الموديل وجميع منتجاته',
      `هل أنت متأكد من حذف موديل "${modelObj.name}" وجميع قطع الغيار التابعة له (${childCount} قطعة) بشكل نهائي؟`,
      () => {
        setModels(prev => prev.filter(m => m.id !== modelObj.id));
        setParts(prev => prev.filter(p => String(p.modelId) !== String(modelObj.id)));
        showToast(`تم حذف موديل "${modelObj.name}" وجميع قطع الغيار التابعة له.`, 'info');
      }
    );
  };
const toggleModelCollapse = (modelId) => {
    setCollapsedAdminModels(prev => ({ ...prev, [modelId]: !prev[modelId] }));
  };
const handleCloudSyncOrCatalog = async () => {
    const { isValid } = getSupabaseConfig();
    if (!isValid) {
      showToast('تم حفظ كتالوج OR محلياً — يرجى التأكد من بيانات اتصال Supabase للحفظ السحابي', 'warning');
      return;
    }
    if (orCloudSyncState.busy) return;
    const orBrandsToSave = brands
      .filter(b => isOrPrefixedName(b))
      .map((br, idx) => ({ name: br, sort_order: 50 + idx, image_url: brandImages[br] || OR_BRAND_IMAGES[br] || '' }));
    const orModelsToSave = models.filter(m => String(m?.id || '').startsWith('or_mdl_') || isOrPrefixedName(m?.brand));
    const orPartsToSave = parts.filter(p => p?._isOrCatalog || String(p?.id || '').startsWith('or_prt_') || isOrPrefixedName(p?.name));

    setOrCloudSyncState({ busy: true, done: 0, total: orPartsToSave.length, msg: 'جاري تثبيت الماركات والموديلات...' });
    try {
      await sbUpsert('brands', orBrandsToSave);
      await sbUpsert('mobile_models', orModelsToSave);
      const CHUNK = 80;
      for (let i = 0; i < orPartsToSave.length; i += CHUNK) {
        const slice = orPartsToSave.slice(i, i + CHUNK);
        await sbUpsert('spare_parts', slice);
        setOrCloudSyncState({
          busy: true,
          done: Math.min(i + slice.length, orPartsToSave.length),
          total: orPartsToSave.length,
          msg: `جاري رفع المنتجات للسيرفر (${Math.min(i + slice.length, orPartsToSave.length)} / ${orPartsToSave.length})...`
        });
      }
      setOrCloudSyncState({
        busy: false,
        done: orPartsToSave.length,
        total: orPartsToSave.length,
        msg: `تم تثبيت ${orPartsToSave.length} منتج OR و ${orModelsToSave.length} موديل في قاعدة البيانات بنجاح ✓`
      });
      showToast(`تم تثبيت جميع منتجات OR (${orPartsToSave.length} منتج) في Supabase بنجاح وبصفر استهلاك Storage!`, 'success');
    } catch (err) {
      setOrCloudSyncState({ busy: false, done: 0, total: 0, msg: 'تعذر إتمام الرفع السحابي — حاول مرة أخرى' });
      showToast('حدث خطأ أثناء الاتصال بقاعدة البيانات', 'error');
    }
  };
const handleLiveFetchMoreOrProducts = async () => {
    if (orLiveFetchState.busy) return;
    setOrLiveFetchState({ busy: true, msg: 'جاري فحص المتاجر الخمسة واستخراج أي صفحات إضافية بدون تكرار...' });
    try {
      const existingKeys = new Set();
      parts.forEach(p => {
        const cleanName = String(p?.name || '').replace(/^OR\s*[-|:]?\s*/i, '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '');
        if (cleanName.length >= 5) existingKeys.add('t:' + cleanName);
        const imgBase = String(p?.image || '').split('?')[0].toLowerCase();
        if (imgBase.startsWith('http')) existingKeys.add('i:' + imgBase);
        const sUrl = String(p?.sourceUrl || p?.customGroupPrices?._sourceUrl || '').split('?')[0].toLowerCase();
        if (sUrl.includes('/products/')) existingKeys.add('u:' + sUrl.split('/products/').pop());
      });

      const stores = [
        { label: 'Majentik', base: 'https://majentik.com', path: '/products.json', maxPages: 3, defaultBrand: 'Majentik' },
        { label: 'Trust Egypt (Joyroom)', base: 'https://trust-egypt.com', path: '/collections/joyroom-products/products.json', maxPages: 2, defaultBrand: 'Joyroom' },
        { label: 'Three Egypt', base: 'https://three-egypt.com', path: '/products.json', maxPages: 9, defaultBrand: 'Three' },
        { label: 'Vontx', base: 'https://vontx.com', path: '/products.json', maxPages: 6, defaultBrand: 'Vontx' }
      ];

      const newBrands = [...brands];
      const newBrandImgs = { ...brandImages };
      const newModels = [...models];
      const newParts = [];
      let nextIdx = parts.filter(p => String(p?.id || '').startsWith('or_prt_')).length + 1;

      const findOrCreateOrModel = (orBrandName, orModelName, sampleImg) => {
        if (!newBrands.includes(orBrandName)) {
          newBrands.push(orBrandName);
          if (sampleImg) newBrandImgs[orBrandName] = sampleImg;
        }
        let found = newModels.find(m => m.brand === orBrandName && m.name === orModelName);
        if (!found) {
          found = {
            id: `or_mdl_${String(newModels.filter(x => String(x?.id || '').startsWith('or_mdl_')).length + 1).padStart(3, '0')}`,
            brand: orBrandName,
            name: orModelName,
            aliases: `OR ${orBrandName} ${orModelName}`,
            image: sampleImg || ''
          };
          newModels.push(found);
        }
        return found;
      };

      for (const st of stores) {
        for (let pg = 1; pg <= st.maxPages; pg++) {
          setOrLiveFetchState({ busy: true, msg: `جاري فحص ${st.label} (صفحة ${pg})... تم اكتشاف ${newParts.length} منتج جديد` });
          let data = null;
          try {
            const resp = await fetch(`${st.base}${st.path}?limit=250&page=${pg}`, { credentials: 'omit' });
            if (resp.ok) data = await resp.json();
          } catch (e) {
            break;
          }
          if (!data || !Array.isArray(data.products) || data.products.length === 0) break;

          for (const prod of data.products) {
            const rawTitle = String(prod.title || '').trim();
            const variant = (prod.variants || []).find(v => v.available) || (prod.variants || [])[0] || {};
            const price = Number(parseFloat(variant.price || '0').toFixed(2));
            let img = prod.images?.[0]?.src || prod.image?.src || '';
            if (img.startsWith('//')) img = 'https:' + img;
            if (img.startsWith('http://')) img = 'https://' + img.slice(7);
            if (!rawTitle || !(price > 0) || !img.startsWith('https://')) continue;

            const handle = String(prod.handle || '').toLowerCase();
            const normT = rawTitle.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '');
            const imgBase = img.split('?')[0].toLowerCase();
            if (existingKeys.has('t:' + normT) || existingKeys.has('i:' + imgBase) || (handle && existingKeys.has('u:' + handle))) {
              continue;
            }
            existingKeys.add('t:' + normT);
            existingKeys.add('i:' + imgBase);
            if (handle) existingKeys.add('u:' + handle);

            const vendorRaw = (prod.vendor && !/^(default brand|three(-egypt)?)$/i.test(prod.vendor.trim())) ? prod.vendor.trim() : st.defaultBrand;
            const tl = rawTitle.toLowerCase();
            let orCat = 'OR - مشتركات وأجهزة ذكية ومكتبية';
            if (/power ?bank|باور ?ب[ان]ك/.test(tl)) orCat = 'OR - باور بانك';
            else if (/case|جراب|cover/.test(tl)) orCat = 'OR - جرابات الموبايل';
            else if (/screen|lens|اسكرين|عدس/.test(tl)) orCat = 'OR - اسكرينات وحماية كاميرا';
            else if (/watch|band|strap|ساع|استراب|سوار/.test(tl)) orCat = 'OR - ساعات وأساور ذكية';
            else if (/speaker|سبيكر/.test(tl)) orCat = 'OR - سبيكر ومكبرات صوت';
            else if (/earbud|earphone|headphone|airpod|buds|سماع|ايربود|هيدفون|مايك|mic/.test(tl)) orCat = 'OR - سماعات ومايكات';
            else if (/mouse|keyboard|ماوس|كيبورد|gaming|cooler/.test(tl)) orCat = 'OR - ماوس وكيبورد وجيمنج';
            else if (/car |holder|stand|tripod|حامل|سيار/.test(tl)) orCat = 'OR - إكسسوارات سيارة وحوامل وتصوير';
            else if (/charger|شاحن/.test(tl)) orCat = 'OR - شواحن سريعة ولاسلكية';
            else if (/cable|hub|adapter|كابل|وصلة|محول/.test(tl)) orCat = 'OR - كابلات ومحولات';

            let orBrand = `OR - ${vendorRaw}`;
            let orModelName = `OR - ${orCat.replace('OR - ', '')} (${vendorRaw})`;
            if (orCat === 'OR - جرابات الموبايل' || orCat === 'OR - اسكرينات وحماية كاميرا') {
              const iphoneMatch = rawTitle.match(/iPhone\s*1[1-8](?:\s*\/\s*1[4578])?(?:\s+Pro(?:\s+Max)?|\s+Plus|\s+Air)?/i);
              const samMatch = rawTitle.match(/(?:Samsung\s+)?(?:Galaxy\s+)?S2[2-6](?:\s+Ultra|\s+Plus|\+)?/i);
              if (iphoneMatch) {
                orBrand = 'OR - جرابات وحماية iPhone';
                orModelName = `OR - ${iphoneMatch[0].replace(/\s+/g, ' ').trim()}`;
              } else if (samMatch) {
                orBrand = 'OR - جرابات وحماية Samsung';
                orModelName = `OR - Samsung ${samMatch[0].replace(/samsung/i, '').replace(/\s+/g, ' ').trim()}`;
              }
            }

            const mdlObj = findOrCreateOrModel(orBrand, orModelName, img);
            const pId = `or_prt_${String(nextIdx).padStart(4, '0')}`;
            const sku = `OR-${String(nextIdx).padStart(4, '0')}`;
            nextIdx++;
            const prodUrl = `${st.base}/products/${prod.handle}`;
            const estCost = Math.max(1, Math.round(price * 0.78));

            newParts.push({
              id: pId,
              createdAt: '2026-11-18 11:45',
              sku,
              modelId: mdlObj.id,
              category: orCat,
              name: rawTitle.toUpperCase().startsWith('OR') ? rawTitle : `OR - ${rawTitle}`,
              qualityGrade: `OR - أصلي (${vendorRaw})`,
              colors: ['قياسي'],
              compatibleModels: [orModelName],
              searchAliases: `OR ${rawTitle} ${vendorRaw} ${orCat}`,
              description: `منتج OR أصلي مصنف تحت (${orBrand} / ${orModelName}) — المصدر: ${prodUrl}`,
              warrantyText: 'ضمان استبدال ومعاينة معتمد من متجر الزغبي',
              image: img,
              imageUrl: img,
              images: [img],
              stock: 5,
              lowStockThreshold: 2,
              maxOrderQty: 5,
              costPrice: estCost,
              basePrice: price,
              cashbackEnabled: price <= 1500,
              cashbackPct: 2,
              _isOrCatalog: true,
              sourceUrl: prodUrl,
              sourceSite: st.base.replace('https://', ''),
              customGroupPrices: {
                _images: [img],
                _isOrCatalog: true,
                _sourceUrl: prodUrl,
                _tierOriginalPrice: price,
                _tierFirstClassPrice: price,
                _tierEconomyPrice: price
              },
              waitlistCount: 0
            });
          }
          if (data.products.length < 250) break;
        }
      }

      if (newParts.length > 0) {
        setBrandImages(newBrandImgs);
        setBrands(newBrands);
        setModels(newModels);
        setParts(prev => [...prev, ...newParts]);
        setOrLiveFetchState({
          busy: false,
          msg: `تم سحب وإضافة ${newParts.length} منتج إضافي جديد بنجاح بدون أي تكرار! اضغط «تثبيت وحفظ كتالوج OR في السيرفر» لحفظها سحابياً.`
        });
        showToast(`تم استخراج وإضافة ${newParts.length} منتج OR إضافي بروابط صورها المباشرة!`, 'success');
      } else {
        setOrLiveFetchState({
          busy: false,
          msg: 'جميع المنتجات المتاحة مفحوصة ومضافة بالكامل بدون أي نواقص أو تكرار ✓'
        });
        showToast('كتالوج OR مكتمل ومحدث بالكامل بدون أي تكرار ✓', 'success');
      }
    } catch (err) {
      setOrLiveFetchState({ busy: false, msg: 'تعذر الوصول لبعض المتاجر الخارجية من المتصفح حالياً — الكتالوج المدمج جاهز بالكامل.' });
    }
  };
const [quickStockSearch, setQuickStockSearch] = useState('');
const [quickStockBrand, setQuickStockBrand] = useState('ALL');
const [quickStockModel, setQuickStockModel] = useState('ALL');
const [quickStockCat, setQuickStockCat] = useState('ALL');
const [quickStockSort, setQuickStockSort] = useState('stock_asc');
useEffect(() => {
    setQuickStockPage(1);
    if (adminTab === 'quick_stock') {
      fetchSparePartsSliceOnDemand({
        brand: quickStockBrand,
        modelId: quickStockModel,
        category: quickStockCat,
        search: quickStockSearch,
        page: 1,
        limit: 100
      });
    }
  }, [adminTab, quickStockSearch, quickStockBrand, quickStockModel, quickStockCat, quickStockSort]);
const [newGroupName, setNewGroupName] = useState('');
const [newGroupCurrency, setNewGroupCurrency] = useState('EGP');
const [newGroupModType, setNewGroupModType] = useState('none');
const [newGroupModVal, setNewGroupModVal] = useState(0);
const [newGroupDeliveryFee, setNewGroupDeliveryFee] = useState(50);
const [adminGroupSearch, setAdminGroupSearch] = useState('');
const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGrp = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      currency: newGroupCurrency,
      modifierType: newGroupModType,
      modifierValue: newGroupModType === 'none' ? 0 : Number(newGroupModVal),
      deliveryFeeBase: Math.max(0, Number(newGroupDeliveryFee) || 0),
      isDefault: false,
      description: 'مجموعة تسعير مخصصة للتجار'
    };
    setGroups(prev => [...prev, newGrp]);
    setNewGroupName('');
    showToast(`تم إنشاء مجموعة "${newGrp.name}" مع رسوم التوصيل الخاصة بها بنجاح!`, 'success');
  };
const [newPromoForm, setNewPromoForm] = useState({
    code: '',
    type: 'percentage', // 'percentage' | 'fixed' | 'free_delivery' | 'delivery_discount'
    value: 10,
    maxDiscountCap: 500,
    minOrderAmount: 1000,
    usageLimit: 100,
    expiryDate: '2026-12-31',
    description: ''
  });
const handleCreatePromoCode = (e) => {
    e.preventDefault();
    const cleanCode = newPromoForm.code.trim().toUpperCase();
    if (!cleanCode) return;
    if (promoCodes.some(p => String(p.code || '').trim().toUpperCase() === cleanCode)) {
      showToast(`⚠️ الكود "${cleanCode}" موجود أصلاً في الكوبونات — اختر كوداً مختلفاً.`, 'error');
      return;
    }

    const autoDesc =
      newPromoForm.description.trim() ||
      (newPromoForm.type === 'percentage'
        ? `خصم ${newPromoForm.value}% بحد أقصى ${newPromoForm.maxDiscountCap} ج.م للطلبات فوق ${newPromoForm.minOrderAmount} ج.م`
        : newPromoForm.type === 'fixed'
        ? `خصم نقدي ثابت ${newPromoForm.value} ج.م للطلبات فوق ${newPromoForm.minOrderAmount} ج.م`
        : newPromoForm.type === 'free_delivery'
        ? `توصيل مجاني بالكامل للطلبات فوق ${newPromoForm.minOrderAmount} ج.م`
        : `خصم ${newPromoForm.value}% على رسوم التوصيل`);

    const created = {
      id: `prm_${Date.now()}`,
      code: cleanCode,
      type: newPromoForm.type,
      value: Number(newPromoForm.value) || 0,
      maxDiscountCap: Number(newPromoForm.maxDiscountCap) || 0,
      minOrderAmount: Number(newPromoForm.minOrderAmount) || 0,
      usageLimit: Number(newPromoForm.usageLimit) || 100,
      usedCount: 0,
      expiryDate: newPromoForm.expiryDate,
      active: true,
      description: autoDesc
    };

    setPromoCodes(prev => [created, ...prev]);
    setNewPromoForm({
      code: '',
      type: 'percentage',
      value: 10,
      maxDiscountCap: 500,
      minOrderAmount: 1000,
      usageLimit: 100,
      expiryDate: '2026-12-31',
      description: ''
    });
    showToast(`تم إنشاء كود الخصم (${cleanCode}) وتفعيله في المتجر فوراً!`, 'success');
  };
const [newAdForm, setNewAdForm] = useState({
    badge: 'عرض خاص للمحلات ',
    title: '',
    subtitle: '',
    linkedPartId: INITIAL_PARTS[0].id,
    buttonText: 'اعرض التفاصيل واطلب الآن',
    image: PART_IMAGES.screen
  });
const [newBarForm, setNewBarForm] = useState({
    title: '',
    subtitle: '',
    selectedPartIds: ['prt_1', 'prt_2', 'prt_3']
  });
const guessAdTheme = g => Object.keys(AD_THEMES).find(k => AD_THEMES[k].grad === g) || 'indigo';
const blankAdForm = () => ({
    id: null,
    badge: 'عرض خاص ',
    title: '',
    subtitle: '',
    linkedPartId: '',
    buttonText: 'تسوق الآن',
    image: '',
    placement: 'hero',
    theme: 'indigo',
    layout: 'editorial_split',
    imageFrameStyle: 'white_pedestal',
    imagePos: 'left',
    imageFit: 'contain',
    imageFocal: 'center',
    imageScale: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageWidthPct: 44,
    imageRadius: 'xl',
    bannerHeight: 'standard',
    showOverlayOnClean: false,
    iconPreset: 'flagship_iphones',
    mediaMode: 'image_only',
    align: 'start',
    overlay: 52,
    showBadge: true,
    showButton: true,
    active: true,
    startDate: '',
    endDate: ''
  });
const [adEditorOpen, setAdEditorOpen] = useState(false);
const [adForm, setAdForm] = useState(blankAdForm);
const openNewAd = () => { setAdForm(blankAdForm()); setAdEditorOpen(true); };
const openEditAd = ad => {
    setAdForm({ ...blankAdForm(), ...ad, theme: ad.theme || guessAdTheme(ad.gradient) });
    setAdEditorOpen(true);
  };
const saveAdForm = e => {
    e.preventDefault();
    if (!adForm.title.trim() && !(adForm.layout === 'full_clean' && adForm.image)) {
      showToast('اكتب عنوان الإعلان الأول (أو اختر قالب بانر جاهز كامل مع صورة).', 'warning');
      return;
    }
    if (adForm.startDate && adForm.endDate && String(adForm.startDate) > String(adForm.endDate)) {
      showToast('⚠️ تاريخ بداية الإعلان بعد تاريخ نهايته — الإعلان مش هيظهر أبداً. صلّح التواريخ الأول.', 'error');
      return;
    }
    const clean = {
      ...adForm,
      title: adForm.title.trim(),
      subtitle: (adForm.subtitle || '').trim(),
      gradient: (AD_THEMES[adForm.theme] || AD_THEMES.indigo).grad,
      id: adForm.id || `ad_${Date.now()}`
    };
    if (adForm.id) setStoreAds(prev => prev.map(a => (a.id === adForm.id ? clean : a)));
    else setStoreAds(prev => [clean, ...prev]);
    setAdEditorOpen(false);
    showToast(adForm.id ? 'اتحفظ تعديل الإعلان.' : 'اتضاف الإعلان للرئيسية.', 'success');
  };
const moveAd = (id, dir) =>
    setStoreAds(prev => {
      const i = prev.findIndex(a => a.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
const duplicateAd = ad =>
    setStoreAds(prev => {
      const i = prev.findIndex(a => a.id === ad.id);
      const copy = [...prev];
      copy.splice(i + 1, 0, { ...ad, id: `ad_${Date.now()}`, title: `${ad.title} (نسخة)`, active: false });
      return copy;
    });
const handleAdImageUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadedUrl = await processAndUploadImage(file, 'ads');
    if (uploadedUrl) {
      setAdForm(prev => ({ ...prev, image: uploadedUrl }));
      showToast('الصورة اترفعت.', 'info');
    }
    e.target.value = '';
  };
const handleNewAdImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadedUrl = await processAndUploadImage(file, 'ads');
    if (uploadedUrl) {
      setNewAdForm(prev => ({ ...prev, image: uploadedUrl }));
      showToast('تم ضغط ورفع صورة الإعلان بنجاح!', 'info');
    }
  };
const [repurchaseShowAllMode, setRepurchaseShowAllMode] = useState(true);
const computeGmReportData = () => {
    const fromStr = (gmReportDateFrom || '2020-01-01').slice(0, 10);
    const toStr = (gmReportDateTo || '2030-12-31').slice(0, 10);

    const inDateRange = (dateText) => {
      if (gmReportPreset === 'all') return true;
      const d = String(dateText || '').trim().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
      return d >= fromStr && d <= toStr;
    };

    const rawPeriodOrders = orders.filter(o => o && inDateRange(o.createdAt || o.date || o.created_at));
    const periodAllOrders = rawPeriodOrders;
    const periodValidOrders = periodAllOrders.filter(o => {
      if (gmReportOrderFilter === 'delivered_only') return o.status === 'تم التسليم';
      if (gmReportOrderFilter === 'valid_all') return o.status !== 'ملغي';
      return true;
    });

      // 1. Status Breakdown across all orders in period
    const statusList = ['تم الاستلام', 'جاري التجهيز', 'جاهز للتسليم', 'في الطريق (دليفري)', 'تم التسليم', 'ملغي'];
    const statusBreakdown = statusList.map(st => {
      const matching = periodAllOrders.filter(o => o.status === st);
      const val = matching.reduce((sum, o) => {
        const sub = (o.items || []).reduce((s, i) => s + (Number(i.qty) || 1) * (Number(i.unitPriceBase) || 0), 0);
        return sum + Math.max(0, sub + (Number(o.deliveryFeeBase) || 0) - (Number(o.discountBase) || 0));
      }, 0);
      return { status: st, count: matching.length, totalValueBase: val };
    });

    const deliveredOrdersCount = periodAllOrders.filter(o => o.status === 'تم التسليم').length;
    const cancelledOrdersCount = periodAllOrders.filter(o => o.status === 'ملغي').length;
    const deliverySuccessRatePct = periodAllOrders.length > 0 ? Math.round((deliveredOrdersCount / periodAllOrders.length) * 100) : 0;
    const cancellationRatePct = periodAllOrders.length > 0 ? Math.round((cancelledOrdersCount / periodAllOrders.length) * 100) : 0;

    // 2. Financial Summary on periodValidOrders
    let grossItemsRevenueBase = 0;
    let totalCogsCostBase = 0;
    let totalDiscountsGivenBase = 0;
    let totalDeliveryCollectedBase = 0;
    let totalWalletUsedInOrdersBase = 0;
    let totalCashbackAwardedInOrdersBase = 0;
    let totalUnitsSold = 0;

    const productStatsMap = new Map();
    const categoryStatsMap = new Map();
    const brandStatsMap = new Map();
    const paymentMethodStatsMap = new Map();
    const clientPeriodSpendMap = new Map();

    const detailedInvoices = periodValidOrders.map(ord => {
      let ordRevenue = 0;
      let ordCost = 0;
      let ordQty = 0;

      (ord.items || []).forEach(it => {
        const q = Number(it.qty) || Number(it.quantity) || 1;
        const partRef = parts.find(p => String(p.id) === String(it.partId || it.id));
        const sellP = Number(it.unitPriceBase) || Number(it.price) || Number(it.unitPrice) || Number(partRef?.basePrice) || 0;
        const costP = Number(it.costPriceBase) || Number(partRef?.costPrice) || Math.round(sellP * 0.72);
        const lineRev = q * sellP;
        const lineCost = q * costP;
        const lineProfit = lineRev - lineCost;

        ordRevenue += lineRev;
        ordCost += lineCost;
        ordQty += q;
        totalUnitsSold += q;

        // Aggregate by product
        const pKey = String(it.partId || it.sku || it.name);
        const curP = productStatsMap.get(pKey) || {
          id: pKey,
          name: it.name || partRef?.name || 'صنف',
          sku: it.sku || partRef?.sku || '',
          category: partRef?.category || 'عام',
          qtySold: 0,
          revenueBase: 0,
          costBase: 0,
          profitBase: 0
        };
        curP.qtySold += q;
        curP.revenueBase += lineRev;
        curP.costBase += lineCost;
        curP.profitBase += lineProfit;
        productStatsMap.set(pKey, curP);

        // Aggregate by category
        const catName = partRef?.category || 'منتجات متنوعة';
        const curCat = categoryStatsMap.get(catName) || { category: catName, qtySold: 0, revenueBase: 0, profitBase: 0 };
        curCat.qtySold += q;
        curCat.revenueBase += lineRev;
        curCat.profitBase += lineProfit;
        categoryStatsMap.set(catName, curCat);

        // Aggregate by brand
        const mdlObj = models.find(m => String(m.id) === String(partRef?.modelId));
        const brName = mdlObj?.brand || 'عام';
        const curBr = brandStatsMap.get(brName) || { brand: brName, qtySold: 0, revenueBase: 0, profitBase: 0 };
        curBr.qtySold += q;
        curBr.revenueBase += lineRev;
        curBr.profitBase += lineProfit;
        brandStatsMap.set(brName, curBr);
      });

      const disc = Number(ord.discountBase) || 0;
      const deliv = Number(ord.deliveryFeeBase) || 0;
      const walletUsed = Number(ord.walletUsedBase) || 0;
      const netInvoiceTotal = Math.max(0, ordRevenue - disc) + deliv;
      const netInvoiceProfit = Math.max(0, ordRevenue - disc) - ordCost;

      grossItemsRevenueBase += ordRevenue;
      totalCogsCostBase += ordCost;
      totalDiscountsGivenBase += disc;
      totalDeliveryCollectedBase += deliv;
      totalWalletUsedInOrdersBase += walletUsed;
      totalCashbackAwardedInOrdersBase += Number(ord.cashbackAmountBase || ord.expectedCashbackBase || 0);

      // Aggregate by payment method
      const payKey = ord.paymentMethod || 'كاش عند الاستلام';
      const curPay = paymentMethodStatsMap.get(payKey) || { method: payKey, ordersCount: 0, totalAmountBase: 0, cashToCollectBase: 0 };
      curPay.ordersCount += 1;
      curPay.totalAmountBase += netInvoiceTotal;
      curPay.cashToCollectBase += Math.max(0, netInvoiceTotal - walletUsed);
      paymentMethodStatsMap.set(payKey, curPay);

      // Aggregate by client
      const cKey = String(ord.clientId || ord.clientName || 'guest');
      const curCli = clientPeriodSpendMap.get(cKey) || {
        clientId: cKey,
        clientName: ord.clientName || 'عميل',
        phone: ord.clientPhone || '',
        ordersCount: 0,
        unitsCount: 0,
        totalSpentBase: 0,
        profitGeneratedBase: 0
      };
      curCli.ordersCount += 1;
      curCli.unitsCount += ordQty;
      curCli.totalSpentBase += netInvoiceTotal;
      curCli.profitGeneratedBase += netInvoiceProfit;
      clientPeriodSpendMap.set(cKey, curCli);

      return {
        id: ord.id,
        createdAt: ord.createdAt,
        clientName: ord.clientName,
        city: extractEgyptianCityFromAddress(ord.address),
        paymentMethod: payKey,
        status: ord.status,
        qty: ordQty,
        revenueBase: ordRevenue,
        discountBase: disc,
        deliveryBase: deliv,
        netTotalBase: netInvoiceTotal,
        costBase: ordCost,
        profitBase: netInvoiceProfit
      };
    });

    const netSalesAfterDiscountBase = Math.max(0, grossItemsRevenueBase - totalDiscountsGivenBase);
    const periodReturns = returnsList.filter(r => r && inDateRange(r.createdAt));
    const approvedReturnsLossBase = periodReturns
      .filter(r => r.status === 'مقبول')
      .reduce((s, r) => s + (Number(r.refundAmountBase) || 0), 0);

    const netOperatingProfitBase = netSalesAfterDiscountBase - totalCogsCostBase - approvedReturnsLossBase;
    const profitMarginPct = netSalesAfterDiscountBase > 0
      ? Math.round((netOperatingProfitBase / netSalesAfterDiscountBase) * 1000) / 10
      : 0;
    const averageOrderValueBase = periodValidOrders.length > 0
      ? Math.round(netSalesAfterDiscountBase / periodValidOrders.length)
      : 0;

    // 3. Top Products, Categories, Brands, Clients
    const topProductsByQty = Array.from(productStatsMap.values()).sort((a, b) => b.qtySold - a.qtySold).slice(0, 15);
    const topProductsByProfit = Array.from(productStatsMap.values()).sort((a, b) => b.profitBase - a.profitBase).slice(0, 15);
    const categoriesBreakdown = Array.from(categoryStatsMap.values()).sort((a, b) => b.revenueBase - a.revenueBase);
    const brandsBreakdown = Array.from(brandStatsMap.values()).sort((a, b) => b.revenueBase - a.revenueBase);
    const topClientsInPeriod = Array.from(clientPeriodSpendMap.values()).sort((a, b) => b.totalSpentBase - a.totalSpentBase).slice(0, 15);

    // 4. Receivables (مديونيات الآجل المستحقة للتحصيل) & Positive Wallet Balances
    const debtorClients = clients
      .filter(c => Number(c.walletBalance) < 0)
      .map(c => ({ ...c, debtAmount: Math.abs(Number(c.walletBalance)) }))
      .sort((a, b) => b.debtAmount - a.debtAmount);
    const totalReceivablesDebtBase = debtorClients.reduce((s, c) => s + c.debtAmount, 0);

    const creditWalletClients = clients
      .filter(c => Number(c.walletBalance) > 0)
      .sort((a, b) => Number(b.walletBalance) - Number(a.walletBalance));
    const totalPositiveWalletLiabilityBase = creditWalletClients.reduce((s, c) => s + (Number(c.walletBalance) || 0), 0);

    // 5. Inventory Valuation & Shortages
    const totalInventoryUnits = parts.reduce((s, p) => s + Math.max(0, Number(p.stock) || 0), 0);
    const totalInventoryCostValueBase = parts.reduce((s, p) => s + Math.max(0, Number(p.stock) || 0) * (Number(p.costPrice) || 0), 0);
    const totalInventoryRetailValueBase = parts.reduce((s, p) => s + Math.max(0, Number(p.stock) || 0) * (Number(p.basePrice) || 0), 0);
    const expectedInventoryProfitBase = totalInventoryRetailValueBase - totalInventoryCostValueBase;
    const outOfStockPartsList = parts.filter(p => (Number(p.stock) || 0) <= 0 || p.soldOut);
    const lowStockPartsList = parts.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= (Number(p.lowStockThreshold) || 5));

    // 6. Restock Waitlist & Sourcing Requests
    const waitlistEntries = Array.isArray(siteSettings.restockWaitlist) ? siteSettings.restockWaitlist : [];
    const activeSourcingList = sourcingRequests.filter(r => !r.closed);

    // 7. Automated General Manager Action Insights
    const gmInsights = [];
    if (cancellationRatePct >= 20) {
      gmInsights.push(`⚠️ تنبيه تشغيلي: نسبة إلغاء الطلبات في هذه الفترة بلغت ${cancellationRatePct}%؛ يُنصح بمراجعة سرعة تأكيد التوصيل وجودة التواصل الهاتفي.`);
    } else {
      gmInsights.push(`✅ كفاءة التسليم: نسبة الطلبات الملغاة منخفضة (${cancellationRatePct}%) ومعدل التسليم يسير بشكل صحي.`);
    }
    if (outOfStockPartsList.length > 0 || waitlistEntries.length > 0) {
      gmInsights.push(`🔔 فرص مبيعات جاهزة: يوجد (${outOfStockPartsList.length}) صنف رصيده صفر بالمخزن و(${waitlistEntries.length}) طلب عميل مسجل في قائمة "نبّهني عند التوفر" ينتظرون الشراء فوراً عند التوريد.`);
    }
    if (totalReceivablesDebtBase > 0) {
      gmInsights.push(`💳 تحصيل المديونيات: إجمالي المبالغ الآجلة المستحقة لدى العملاء يبلغ ${formatMoney(totalReceivablesDebtBase)} موزعة على (${debtorClients.length}) حساب تجاري.`);
    }
    if (topProductsByProfit[0]) {
      gmInsights.push(`🏆 الصنف الذهبي الأعلى ربحية: "${topProductsByProfit[0].name}" حقق وحده صافي ربح ${formatMoney(topProductsByProfit[0].profitBase)} من بيع (${topProductsByProfit[0].qtySold}) قطعة.`);
    }
    if (profitMarginPct > 0) {
      gmInsights.push(`📈 هامش الربح الصافي: متوسط هامش الربح الفعلي بعد خصم تكلفة البضاعة والكوبونات والمرتجعات هو ${profitMarginPct}%.`);
    }

    return {
      fromStr,
      toStr,
      periodAllOrders,
      periodValidOrders,
      statusBreakdown,
      deliveredOrdersCount,
      cancelledOrdersCount,
      deliverySuccessRatePct,
      cancellationRatePct,
      grossItemsRevenueBase,
      totalCogsCostBase,
      totalDiscountsGivenBase,
      netSalesAfterDiscountBase,
      totalDeliveryCollectedBase,
      totalWalletUsedInOrdersBase,
      totalCashbackAwardedInOrdersBase,
      totalUnitsSold,
      periodReturns,
      approvedReturnsLossBase,
      netOperatingProfitBase,
      profitMarginPct,
      averageOrderValueBase,
      paymentMethodsBreakdown: Array.from(paymentMethodStatsMap.values()),
      topProductsByQty,
      topProductsByProfit,
      categoriesBreakdown,
      brandsBreakdown,
      topClientsInPeriod,
      debtorClients,
      totalReceivablesDebtBase,
      creditWalletClients,
      totalPositiveWalletLiabilityBase,
      totalInventoryUnits,
      totalInventoryCostValueBase,
      totalInventoryRetailValueBase,
      expectedInventoryProfitBase,
      outOfStockPartsList,
      lowStockPartsList,
      waitlistEntries,
      activeSourcingList,
      detailedInvoices,
      gmInsights
    };
  };
const handleExportGmReportCsv = () => {
    const rep = computeGmReportData();
    const lines = [];
    lines.push(['تقرير الإدارة العامة التنفيذي', siteSettings.storeName || 'ELZOGHBI', `من: ${rep.fromStr}`, `إلى: ${rep.toStr}`].join(','));
    lines.push([]);
    lines.push(['البند المالي', 'القيمة (ج.م)'].join(','));
    lines.push(['إجمالي عدد الطلبات المشمولة', rep.periodValidOrders.length].join(','));
    lines.push(['إجمالي عدد القطع المباعة', rep.totalUnitsSold].join(','));
    lines.push(['إجمالي المبيعات قبل الخصم', rep.grossItemsRevenueBase].join(','));
    lines.push(['إجمالي الخصومات والكوبونات', rep.totalDiscountsGivenBase].join(','));
    lines.push(['صافي المبيعات بعد الخصم', rep.netSalesAfterDiscountBase].join(','));
    lines.push(['إجمالي تكلفة البضاعة المباعة (COGS)', rep.totalCogsCostBase].join(','));
    lines.push(['تعويضات المرتجعات المقبولة', rep.approvedReturnsLossBase].join(','));
    lines.push(['صافي الربح الفعلي للمدير العام', rep.netOperatingProfitBase].join(','));
    lines.push(['نسبة هامش الربح الصافي (%)', `${rep.profitMarginPct}%`].join(','));
    lines.push([]);
    lines.push(['رقم الفاتورة', 'التاريخ', 'العميل', 'المدينة', 'طريقة الدفع', 'الحالة', 'القطع', 'الإجمالي الصافي', 'التكلفة', 'صافي الربح'].join(','));
    rep.detailedInvoices.forEach(inv => {
      lines.push([
        inv.id,
        inv.createdAt,
        `"${String(inv.clientName || '').replace(/"/g, '""')}"`,
        `"${inv.city}"`,
        `"${inv.paymentMethod}"`,
        `"${inv.status}"`,
        inv.qty,
        inv.netTotalBase,
        inv.costBase,
        inv.profitBase
      ].join(','));
    });

    const csvContent = '﻿' + lines.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ELZOGHBI_GM_Report_${rep.fromStr}_to_${rep.toStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 تم تصدير وتحميل تقرير المدير العام بصيغة Excel (CSV) بنجاح!', 'success');
  };
const [manualPayAmount, setManualPayAmount] = useState('');
const [manualPayNote, setManualPayNote] = useState('');
const [adminClientSearch, setAdminClientSearch] = useState('');
const [adminCreateClientModalOpen, setAdminCreateClientModalOpen] = useState(false);
const [approvingRequestObj, setApprovingRequestObj] = useState(null);
const [adminEditClientForm, setAdminEditClientForm] = useState(null);
const selectedAdminClient = useMemo(() => {
    return clients.find(c => c.id === selectedAdminClientId) || clients[0];
  }, [clients, selectedAdminClientId]);
useEffect(() => {
    if (selectedAdminClient) {
      setAdminEditClientForm({
        id: selectedAdminClient.id,
        name: selectedAdminClient.name,
        owner: selectedAdminClient.owner,
        phone: selectedAdminClient.phone,
        email: selectedAdminClient.email || '',
        password: selectedAdminClient.password || '',
        address: selectedAdminClient.address || '',
        secondaryAddress: selectedAdminClient.secondaryAddress || '',
        birthDate: selectedAdminClient.birthDate || '',
        groupId: selectedAdminClient.groupId,
        creditLimit: selectedAdminClient.creditLimit,
        avatar: selectedAdminClient.avatar || 'TF',
        avatarBg: selectedAdminClient.avatarBg || 'from-blue-600 to-slate-700',
        avatarImage: selectedAdminClient.avatarImage || ''
      });
    }
  }, [selectedAdminClient?.id]);
const handleAdminUploadClientAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !adminEditClientForm) return;
    const uploadedUrl = await processAndUploadImage(file, 'avatars');
    if (!uploadedUrl) return;
    setAdminEditClientForm(prev => ({ ...prev, avatarImage: uploadedUrl }));
    showToast('تم ضغط ورفع الصورة بنجاح — اضغط "حفظ التعديلات" عشان تتطبق على حساب العميل.', 'success');
  };
const handleAdminSaveClientFullEdits = (e) => {
    e.preventDefault();
    if (!adminEditClientForm) return;
    const cleanEditPhone = normalizeDigits(adminEditClientForm.phone || '').trim().replace(/\s+/g, '');
    const dupClient = clients.find(c => c.id !== adminEditClientForm.id && String(c.phone || '').trim() === cleanEditPhone && cleanEditPhone);
    if (dupClient) {
      showToast(`⚠️ الرقم ${cleanEditPhone} مسجّل أصلاً على حساب "${dupClient.name}" — مش هينفع عميلين بنفس رقم الدخول.`, 'error');
      return;
    }
    setClients(prev =>
      prev.map(c =>
        c.id === adminEditClientForm.id
          ? {
              ...c,
              name: adminEditClientForm.name,
              owner: adminEditClientForm.owner,
              phone: adminEditClientForm.phone,
              email: adminEditClientForm.email,
              password: adminEditClientForm.password,
              address: adminEditClientForm.address,
              secondaryAddress: adminEditClientForm.secondaryAddress,
              birthDate: adminEditClientForm.birthDate || '',
              groupId: adminEditClientForm.groupId,
              creditLimit: Number(adminEditClientForm.creditLimit) || 0,
              avatar: adminEditClientForm.avatar,
              avatarBg: adminEditClientForm.avatarBg,
              avatarImage: adminEditClientForm.avatarImage
            }
          : c
      )
    );
    showToast(`تم حفظ جميع التعديلات على حساب "${adminEditClientForm.name}" (الفئة، كلمة المرور، الصورة، والبيانات) بنجاح!`, 'success');
  };
const [returnAdminNotes, setReturnAdminNotes] = useState({});
const [complaintReplies, setComplaintReplies] = useState({});
const getSmartCrossSellSuggestions = () => {
    if (siteSettings.enableSmartCrossSell === false || cartSummary.items.length === 0) return [];
    const inCartIds = new Set(cartSummary.items.map(i => String(i.part.id)));
    const cartModelIds = new Set(cartSummary.items.map(i => String(i.part.modelId || '')).filter(Boolean));
    const cartCategories = new Set(cartSummary.items.map(i => String(i.part.category || '')).filter(Boolean));
    const pinnedIds = new Set((Array.isArray(siteSettings.pinnedCrossSellPartIds) ? siteSettings.pinnedCrossSellPartIds : []).map(String));

    const availPool = publicParts.filter(p => p && !inCartIds.has(String(p.id)) && Number(p.stock) > 0 && !p.soldOut && Number(p.basePrice) > 0);
    if (availPool.length === 0) return [];

    return availPool
      .sort((a, b) => {
        const aPin = pinnedIds.has(String(a.id)) ? 1 : 0;
        const bPin = pinnedIds.has(String(b.id)) ? 1 : 0;
        if (aPin !== bPin) return bPin - aPin;
        const aDiffCat = !cartCategories.has(String(a.category || '')) ? 1 : 0;
        const bDiffCat = !cartCategories.has(String(b.category || '')) ? 1 : 0;
        const aAcc = /جراب|حماي|اسكرين|شاحن|كابل|سماع|عناي/.test(String(a.category || '') + ' ' + String(a.name || '')) ? 1 : 0;
        const bAcc = /جراب|حماي|اسكرين|شاحن|كابل|سماع|عناي/.test(String(b.category || '') + ' ' + String(b.name || '')) ? 1 : 0;
        if (aAcc !== bAcc) return bAcc - aAcc;
        const aSameMdl = cartModelIds.has(String(a.modelId)) ? 1 : 0;
        const bSameMdl = cartModelIds.has(String(b.modelId)) ? 1 : 0;
        if (aSameMdl !== bSameMdl) return bSameMdl - aSameMdl;
        if (aDiffCat !== bDiffCat) return bDiffCat - aDiffCat;
        return (Number(a.basePrice) || 0) - (Number(b.basePrice) || 0);
      })
      .slice(0, 2);
  };
const getCashierImpulseItems = () => {
    if (siteSettings.enableCashierImpulse === false) return [];
    const maxPrice = Math.max(50, Number(siteSettings.cashierMaxPrice) || 1000);
    const inCartIds = new Set(cartSummary.items.map(i => String(i.part.id)));
    const mode = siteSettings.cashierSelectionMode || 'manual_first';

    const pinnedAvailable = publicParts.filter(p => {
      if (!p || inCartIds.has(String(p.id)) || Number(p.stock) <= 0 || p.soldOut) return false;
      return isPartPinnedToCashier(p);
    });

    if (mode === 'manual_only') {
      return pinnedAvailable.slice(0, 8);
    }

    const pinnedIdsSet = new Set(pinnedAvailable.map(p => String(p.id)));
    const affordable = publicParts.filter(p => {
      if (!p || inCartIds.has(String(p.id)) || pinnedIdsSet.has(String(p.id)) || Number(p.stock) <= 0 || p.soldOut) return false;
      const tiers = getPartQualityTiers(p, p.basePrice);
      const lowestTierPrice = siteSettings.enableQualityTiers !== false
        ? Math.min(Number(p.basePrice) || 99999, tiers[2]?.priceEgp || 99999)
        : (Number(p.basePrice) || 99999);
      return lowestTierPrice > 0 && lowestTierPrice <= maxPrice;
    }).sort((a, b) => (Number(a.basePrice) || 0) - (Number(b.basePrice) || 0));

    return [...pinnedAvailable, ...affordable].slice(0, 8);
  };
const [authModalTab, setAuthModalTab] = useState('login');
const [clientLoginIdentifier, setClientLoginIdentifier] = useState('');
const [clientLoginPassword, setClientLoginPassword] = useState('');
const [forgotPhone, setForgotPhone] = useState('');
const [forgotIdentityVerify, setForgotIdentityVerify] = useState('');
const [forgotOtpCode, setForgotOtpCode] = useState('');
const [forgotNewPassword, setForgotNewPassword] = useState('');
const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
const [forgotStepStatus, setForgotStepStatus] = useState(null);
const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    const phoneClean = normalizeDigits(forgotPhone).trim();
    const verifyClean = String(forgotIdentityVerify || '').trim().toLowerCase();
    const otpClean = normalizeDigits(forgotOtpCode).trim();
    const newPassClean = String(forgotNewPassword || '').trim();
    const confirmClean = String(forgotConfirmPassword || '').trim();

    if (!phoneClean || phoneClean.length < 10) {
      showToast('اكتب رقم الموبايل المسجّل بالحساب بشكل صحيح.', 'error');
      return;
    }
    if (newPassClean.length < 4) {
      showToast('كلمة المرور الجديدة لازم تكون 4 حروف أو أرقام على الأقل.', 'error');
      return;
    }
    if (newPassClean !== confirmClean) {
      showToast('كلمة المرور الجديدة وتأكيدها مش متطابقين!', 'error');
      return;
    }

    // Fetch latest clients from Supabase to verify account and OTP
    let currentClientsList = clients;
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (isValid) {
        const res = await fetch(
          `${sbUrl}/rest/v1/clients?select=${TABLE_LIGHT_COLUMNS.clients}&limit=200`,
          { headers: sbHeaders(sbKey, { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }) }
        );
        if (res.ok) {
          const freshRows = await res.json();
          if (Array.isArray(freshRows) && freshRows.length > 0) {
            currentClientsList = freshRows.map(toCamelCaseRow);
            setClients(currentClientsList);
          }
        }
      }
    } catch (err) {}

    const matchedClient = currentClientsList.find(
      c => normalizeDigits(String(c.phone || '')).trim() === phoneClean
    );

    if (!matchedClient) {
      showToast('مفيش حساب مسجّل برقم الموبايل ده! اتأكد من الرقم أو اطلب فتح حساب جديد.', 'error');
      return;
    }

    // Path 1: Instant Reset via 6-digit OTP code from Admin
    if (otpClean.length >= 4) {
      const savedOtp = normalizeDigits(String(matchedClient.resetOtp || '')).trim();
      const otpExpires = Number(matchedClient.resetOtpExpires || 0);
      if (!savedOtp || savedOtp !== otpClean) {
        showToast('كود التحقق (OTP) غير صحيح! تأكد من الكود المرسل لك من الإدارة.', 'error');
        return;
      }
      if (otpExpires > 0 && Date.now() > otpExpires) {
        showToast('انتهت صلاحية كود التحقق! اطلب كود جديد من الإدارة.', 'error');
        return;
      }

      const updatedClient = {
        ...matchedClient,
        password: newPassClean,
        resetOtp: '',
        resetOtpExpires: 0,
        passwordResetRequest: false,
        requestedNewPassword: ''
      };
      setClients(prev => prev.map(c => (c.id === matchedClient.id ? updatedClient : c)));
      await sbUpsert('clients', updatedClient);
      invalidateSessionTableCache('clients');
      handleSwitchRole(matchedClient.id);
      setLoginModalOpen(false);
      setForgotOtpCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setForgotStepStatus(null);
      showToast(`تم التحقق من الكود وتغيير كلمة المرور بنجاح! أهلاً بك يا "${matchedClient.name}".`, 'success');
      return;
    }

    // Path 2: Identity Verification (Shop Name / Owner Name / Email) + Request Approval / OTP
    if (!verifyClean || verifyClean.length < 3) {
      showToast('اكتب اسم المحل أو اسم المسؤول المسجل في الحساب (أو كود التحقق OTP) لتأكيد هويتك بأمان.', 'warning');
      return;
    }

    const clientIdentityHaystack = `${matchedClient.name || ''} ${matchedClient.owner || ''} ${matchedClient.email || ''}`.toLowerCase();
    const verifyWords = verifyClean.split(/\s+/).filter(w => w.length >= 2);
    const identityMatches =
      clientIdentityHaystack.includes(verifyClean) ||
      (verifyWords.length > 0 && verifyWords.some(w => clientIdentityHaystack.includes(w)));

    if (!identityMatches) {
      showToast('الاسم المدخل غير مطابق لبيانات صاحب هذا الرقم! يرجى كتابة اسم المحل أو اسم المسؤول الصحيح أو التواصل مع الإدارة لاستلام كود OTP.', 'error');
      return;
    }

    const updatedClientReq = {
      ...matchedClient,
      passwordResetRequest: true,
      requestedNewPassword: newPassClean,
      passwordResetRequestedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setClients(prev => prev.map(c => (c.id === matchedClient.id ? updatedClientReq : c)));
    await sbUpsert('clients', updatedClientReq);
    invalidateSessionTableCache('clients');

    const resetNotif = {
      id: `ntf_pw_${matchedClient.id}_${Date.now()}`,
      target: 'admin',
      type: 'password_reset',
      title: `🔑 طلب استعادة كلمة المرور (${matchedClient.name})`,
      msg: `طلب العميل "${matchedClient.name}" (${matchedClient.phone}) تعيين كلمة مرور جديدة لحسابه.`,
      time: 'الآن',
      read: false,
      clientId: matchedClient.id
    };
    setNotifications(prev => [resetNotif, ...prev]);
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (isValid) {
        fetch(`${sbUrl}/rest/v1/site_settings?on_conflict=id`, {
          method: 'POST',
          headers: sbHeaders(sbKey, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
          body: JSON.stringify([{
            id: 'main',
            settings: siteSettings,
            currencies,
            notifications: [resetNotif, ...notifications].slice(0, 100),
            updated_at: new Date().toISOString()
          }])
        }).catch(() => {});
      }
    } catch (err) {}

    setForgotStepStatus({
      type: 'requested',
      phone: matchedClient.phone,
      clientName: matchedClient.name,
      clientId: matchedClient.id
    });
    showToast('تم إرسال طلب استعادة كلمة المرور للإدارة بنجاح! يمكنك تفعيله فوراً أو إدخال كود التحقق OTP.', 'success');
  };
const [regForm, setRegForm] = useState({ ...EMPTY_REG_FORM });
const [regErrors, setRegErrors] = useState({});
const handleClientLoginSubmit = async (e) => {
    e.preventDefault();
    const idClean = normalizeDigits(clientLoginIdentifier).trim().toLowerCase();
    const passClean = String(clientLoginPassword || '').trim();

    // Security fix #7 (Stage B): verify on the server via RPC — it returns
    // the client row WITHOUT its password, so the app no longer downloads
    // the whole clients table (with everyone's password) to sign in.
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (isValid) {
        const res = await fetch(`${sbUrl}/rest/v1/rpc/client_login`, {
          method: 'POST',
          headers: sbHeaders(sbKey, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }),
          body: JSON.stringify({ p_phone: idClean, p_password: passClean })
        });
        if (res.ok) {
          const rpcClient = await res.json();
          if (rpcClient && rpcClient.id) {
            const mapped = toCamelCaseRow(rpcClient);
            clientRpcPassRef.current = passClean;
            setClients(prev => {
              const exists = prev.some(c => c.id === mapped.id);
              const next = exists ? prev.map(c => (c.id === mapped.id ? { ...c, ...mapped } : c)) : [mapped, ...prev];
              try { window.localStorage.setItem('elzoghbi_v2_clients', JSON.stringify(next)); } catch (err) {}
              return next;
            });
            handleSwitchRole(mapped.id);
            setLoginModalOpen(false);
            setClientLoginIdentifier('');
            setClientLoginPassword('');
          } else {
            showToast('مفيش حساب مطابق للبيانات دي. اتأكد من الرقم أو الإيميل وكلمة المرور.', 'error');
          }
          return;
        }
      }
    } catch (err) {}

    // 1. (Transitional fallback, only while the RPC is unreachable) fetch the latest clients list directly from Supabase so newly updated passwords work in 0.1s!
    let currentClientsList = clients;
    try {
      const { sbUrl, sbKey, isValid } = getSupabaseConfig();
      if (isValid) {
        const res = await fetch(
          `${sbUrl}/rest/v1/clients?select=${TABLE_LIGHT_COLUMNS.clients}&limit=200`,
          { headers: sbHeaders(sbKey, { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }) }
        );
        if (res.ok) {
          const freshRows = await res.json();
          if (Array.isArray(freshRows) && freshRows.length > 0) {
            const mappedClients = freshRows.map(toCamelCaseRow);
            currentClientsList = mappedClients;
            incomingSyncUntilRef.current = Date.now() + 250;
            isIncomingSyncRef.current = true;
            setClients(mappedClients);
            try { window.localStorage.setItem('elzoghbi_v2_clients', JSON.stringify(mappedClients)); } catch (err) {}
          }
        }
      }
    } catch (err) {}

    const matchedClient = currentClientsList.find(
      c =>
        normalizeDigits(String(c.phone || '')).trim() === idClean ||
        (c.email && c.email.trim().toLowerCase() === idClean)
    );

    if (!matchedClient) {
      showToast('مفيش حساب مسجّل بالرقم أو الإيميل ده. تقدر تطلب فتح حساب جديد.', 'error');
      return;
    }

    if (String(matchedClient.password || '').trim() !== passClean && String(matchedClient.password || '') !== clientLoginPassword) {
      showToast('كلمة المرور غلط! اتأكد وجرّب تاني.', 'error');
      return;
    }

    clientRpcPassRef.current = passClean;
    handleSwitchRole(matchedClient.id);
    setLoginModalOpen(false);
    setClientLoginIdentifier('');
    setClientLoginPassword('');
  };
const validateRegistration = () => {
    const errs = {};
    const isIndiv = regForm.accountCategory === 'individual';

    // 1. Name validation (at least 2 words, >= 5 chars, valid arabic/english letters)
    const rawName = (isIndiv ? regForm.ownerName : regForm.ownerName || regForm.shopName).trim();
    const nameWords = rawName.split(/\s+/).filter(Boolean);
    if (!rawName || nameWords.length < 2 || rawName.length < 5) {
      errs.name = isIndiv
        ? 'اكتب اسمك بالكامل ثنائي أو ثلاثي (5 حروف على الأقل)'
        : 'اكتب اسم المالك أو المسؤول ثنائي على الأقل';
    }

    if (!isIndiv && (!regForm.shopName.trim() || regForm.shopName.trim().length < 3)) {
      errs.shopName = 'اكتب اسم النشاط أو الحساب التجاري بشكل صحيح (3 حروف على الأقل)';
    }

    // 2. Phone validation (Egyptian 11 digits starting with 010, 011, 012, 015 OR valid international +10 digits)
    const cleanPhone = normalizeDigits(regForm.phone).trim().replace(/\s+/g, '');
    const egPhoneRegex = /^(010|011|012|015)[0-9]{8}$/;
    const intlPhoneRegex = /^\+?[0-9]{10,14}$/;
    if (!cleanPhone || (!egPhoneRegex.test(cleanPhone) && !intlPhoneRegex.test(cleanPhone))) {
      errs.phone = 'رقم الموبايل لازم يبقى صح: 11 رقم ويبدأ بـ (010 أو 011 أو 012 أو 015)';
    } else if (clients.some(c => String(c.phone || '').trim() === cleanPhone)) {
      errs.phone = 'الرقم ده مسجّل على حساب تاني! تقدر تسجّل دخول بيه على طول.';
    }

    // 3. Address validation (detailed address, >= 8 chars)
    if (!regForm.address.trim() || regForm.address.trim().length < 8) {
      errs.address = 'اكتب العنوان بالتفصيل (المحافظة والمدينة والشارع) عشان الشحن يوصل صح';
    }

    // 4. Password validation (at least 6 chars)
    if (!regForm.password || regForm.password.length < 6) {
      errs.password = 'كلمة المرور لازم تبقى 6 حروف أو أرقام على الأقل';
    }

    // 5. Password Confirmation
    if (regForm.confirmPassword !== undefined && regForm.password !== regForm.confirmPassword) {
      errs.confirmPassword = 'كلمتين المرور مش زي بعض، اكتبهم تاني بالظبط';
    }

    if (!regForm.birthDate || !String(regForm.birthDate).trim()) {
      errs.birthDate = 'تاريخ الميلاد مطلوب (إجباري) عشان يوصلك كوبون هدية عيد ميلادك السنوي 🎂';
    }

    if (!regForm.acceptTerms) {
      errs.terms = 'لازم توافق على الشروط والأحكام عشان تكمّل';
    }

    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };
const handleSubmitRegistrationRequest = (e) => {
    e.preventDefault();
    if (!validateRegistration()) {
      showToast('صحّح الحقول الحمرا في الفورم.', 'warning');
      setTimeout(() => {
        try {
          document.getElementById('reg-form-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {}
      }, 80);
      return;
    }
    try {
      submitRegistrationRequestInner();
    } catch (err) {
      console.error('registration failed', err);
      showToast('حصلت مشكلة وإحنا بنبعت طلبك، جرّب تاني. (' + (err && err.message ? err.message : '') + ')', 'error');
    }
  };
const submitRegistrationRequestInner = async () => {
    if (submittingCustomerActionRef.current) return;

    const cleanPhone = normalizeDigits(regForm.phone).trim().replace(/\s+/g, '');
    const isIndiv = regForm.accountCategory === 'individual';
    const clientName = isIndiv ? regForm.ownerName.trim() : regForm.shopName.trim();
    const ownerName = regForm.ownerName.trim() || clientName;
    const nowFormatted = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newReq = {
      id: `req_${Date.now()}`,
      accountCategory: isIndiv ? 'individual' : 'shop',
      shopName: clientName,
      ownerName: ownerName,
      phone: cleanPhone,
      email: regForm.email.trim(),
      birthDate: regForm.birthDate || '1996-12-30',
      referredByCode: (regForm.referredByCode || referralCodeInput || '').trim().toUpperCase(),
      requestedPassword: regForm.password,
      address: regForm.address.trim(),
      shopType: isIndiv ? 'عميل فردي (شخص عادي)' : regForm.shopType,
      notes: regForm.notes.trim(),
      createdAt: nowFormatted,
      acceptedTermsAt: nowFormatted,
      status: 'pending'
    };

    // الحساب الشخصي بيتفتح تلقائي من غير موافقة الأدمن
    if (isIndiv) {
      const defaultGroup = groups.find(g => g.isDefault) || groups[0];
      const newClientId = `cli_${Date.now()}`;
      const newClientObj = {
        id: newClientId,
        name: clientName,
        owner: ownerName,
        phone: cleanPhone,
        email: regForm.email.trim(),
        birthDate: regForm.birthDate || '1996-12-30',
        referralCode: `REF-${cleanPhone.slice(-5)}`,
        referredByCode: (regForm.referredByCode || referralCodeInput || '').trim().toUpperCase(),
        savedFamilyDevices: [],
        password: regForm.password,
        address: regForm.address.trim(),
        secondaryAddress: '',
        groupId: defaultGroup.id,
        walletBalance: 0,
        creditLimit: 0,
        avatar: clientName.slice(0, 2),
        avatarBg: 'from-emerald-600 to-slate-700',
        avatarImage: '',
        status: 'active',
        accountType: 'individual',
        createdAt: nowFormatted.slice(0, 10),
        acceptedTermsAt: nowFormatted,
        ledger: [
          {
            id: `ldg_${Date.now()}`,
            date: nowFormatted,
            type: 'opening',
            ref: 'OPEN-ACC',
            desc: 'فتح حساب شخصي تلقائي من الموقع',
            amount: 0,
            balanceAfter: 0
          }
        ]
      };
      const approvedReq = { ...newReq, status: 'approved', autoApproved: true };
      const autoNotif = {
        id: `ntf_${Date.now()}_newcli`,
        target: 'admin',
        type: 'new_client',
        title: `عميل جديد سجّل بنفسه: ${clientName}`,
        msg: `"${clientName}" (حساب شخصي) برقم ${cleanPhone} فتح حسابه تلقائي ووافق على الشروط والأحكام.`,
        time: 'الآن',
        read: false
      };

      submittingCustomerActionRef.current = true;
      let regSavedOk = false;
      try {
        const [cliOk, reqOk] = await Promise.all([
          sbUpsert('clients', newClientObj),
          sbUpsert('account_requests', approvedReq)
        ]);
        regSavedOk = Boolean(cliOk && reqOk);
      } finally {
        submittingCustomerActionRef.current = false;
      }
      if (!regSavedOk) {
        showToast('معلش، مقدرناش نسجّل حسابك على السيرفر. اتأكد من النت وجرّب تاني.', 'error');
        return;
      }
      isCustomerMutatingCloudRef.current = true;
      markLocalUpsert('clients', newClientObj);
      markLocalUpsert('accountRequests', approvedReq);
      setClients(prev => [newClientObj, ...prev]);
      setAccountRequests(prev => [approvedReq, ...prev]);
      setNotifications(prev => [autoNotif, ...prev]);
      try {
        sbUpdate('site_settings', 'main', {
          notifications: [autoNotif, ...notifications].slice(0, 100),
          updated_at: new Date().toISOString()
        });
      } catch (e) {}

      setActiveRole(newClientId);
      setLoginModalOpen(false);
      setRegErrors({});
      setRegForm({ ...EMPTY_REG_FORM });
      showToast(`أهلاً بيك يا ${clientName}! حسابك اتفتح وإنت دخلت عليه.`, 'success');
      return;
    }

    const newAdminNotif = {
      id: `ntf_${Date.now()}_req`,
      target: 'admin',
      type: 'account_request',
      title: isIndiv ? `طلب حساب شخصي جديد: ${clientName}` : `طلب حساب محل/تاجر جديد: ${clientName}`,
      msg: `قدم "${clientName}" (${isIndiv ? 'شخص عادي' : regForm.shopType}) برقم هاتف (${cleanPhone}) طلباً لإنشاء حساب وبانتظار تأكيدك وإضافته.`,
      time: 'الآن',
      read: false,
      reqId: newReq.id
    };

    submittingCustomerActionRef.current = true;
    let reqSavedOk = false;
    try {
      reqSavedOk = await sbUpsert('account_requests', newReq);
    } finally {
      submittingCustomerActionRef.current = false;
    }
    if (!reqSavedOk) {
      showToast('معلش، طلب فتح الحساب ماوصلش للسيرفر. اتأكد من النت وجرّب تاني.', 'error');
      return;
    }
    isCustomerMutatingCloudRef.current = true;
    markLocalUpsert('accountRequests', newReq);
    setAccountRequests(prev => [newReq, ...prev]);
    setNotifications(prev => [newAdminNotif, ...prev]);
    try {
      sbUpdate('site_settings', 'main', {
        notifications: [newAdminNotif, ...notifications].slice(0, 100),
        updated_at: new Date().toISOString()
      });
    } catch (e) {}

    setLoginModalOpen(false);
    setRegErrors({});
    setRegForm({ ...EMPTY_REG_FORM });
    showToast(
      `طلب فتح حسابك (${clientName}) اتبعت للإدارة! هنأكّد ونفعّل حسابك في أقرب وقت.`,
      'success'
    );
  };
const [directClientForm, setDirectClientForm] = useState({
    name: '',
    owner: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    groupId: 'grp_wholesale_a',
    creditLimit: 20000,
    avatar: 'SH',
    avatarBg: 'from-blue-600 to-slate-700',
    avatarImage: ''
  });
const handleDirectClientAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadedUrl = await processAndUploadImage(file, 'avatars');
    if (uploadedUrl) {
      setDirectClientForm(prev => ({ ...prev, avatarImage: uploadedUrl }));
    }
  };
const [retPartId, setRetPartId] = useState('');
const [retReason, setRetReason] = useState('');
const [retPhotos, setRetPhotos] = useState([]);
const downloadImage = async (src, name) => {
    try {
      let href = src;
      let revoke = null;
      if (!String(src).startsWith('data:')) {
        const r = await fetch(src);
        const b = await r.blob();
        href = URL.createObjectURL(b);
        revoke = href;
      }
      const a = document.createElement('a');
      a.href = href;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (revoke) setTimeout(() => URL.revokeObjectURL(revoke), 4000);
    } catch (e) {
      window.open(src, '_blank');
    }
  };
const reqAllImages = req => [req.image, ...(req.messages || []).flatMap(m => m.images || [])].filter(Boolean);
const adminToggleSrcImages = req => {
    const next = !req.imagesAllowed;
    setSourcingRequests(prev => prev.map(r => (r.id === req.id ? { ...r, imagesAllowed: next, unreadClient: next ? true : r.unreadClient } : r)));
    if (next) setNotifications(prev => [clientNotify(req.clientId, `الإدارة طلبت صور (${req.name})`, 'تقدر دلوقتي ترفع صور من جوه المحادثة.'), ...prev]);
    showToast(next ? 'فتحت رفع الصور للعميل (مرة واحدة).' : 'قفلت رفع الصور للعميل.', 'info');
  };
const adminNotify = (title, msg, extra = {}) => {
    sendMobileOrderPushAlert({
      eventType: 'sourcing',
      title: `🌍 ${title}`,
      body: msg
    });
    return {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    target: 'admin',
    type: 'sourcing',
    title,
    msg,
    time: 'الآن',
    read: false,
    ...extra
  };
  };
const clientNotify = (clientId, title, msg) => ({
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    target: clientId,
    type: 'sourcing',
    title,
    msg,
    time: 'الآن',
    read: false
  });
const cloudSourcingUpdate = (mapper, extraNotif) => {
    isCustomerMutatingCloudRef.current = true;
    const updatedList = mapper(sourcingRequests);
    if (Array.isArray(updatedList)) {
      // Upsert the rows the mapper actually changed — not the first row
      // of the list (which used to overwrite an unrelated request).
      const prevById = new Map((sourcingRequests || []).map(r => [String(r.id), r]));
      updatedList.forEach(row => {
        if (row && row.id && prevById.get(String(row.id)) !== row) {
          sbUpsert('sourcing_requests', row);
        }
      });
    }
  };
const openSourcing = () => {
    if (!currentClient) {
      setAuthModalTab('login');
      setLoginModalOpen(true);
      setPendingSourcingOpen(true);
      showToast('سجّل دخولك الأول عشان تكمّل طلب المنتج.', 'info');
      return;
    }
    setSrcForm(blankSrcForm(currentClient));
    setSourcingFormOpen(true);
  };
const submitSourcingRequest = async e => {
    e.preventDefault();
    if (!currentClient || submittingCustomerActionRef.current) return;
    if (srcForm.name.trim().length < 2) { showToast('اكتب اسم المنتج.', 'warning'); return; }
    if (srcForm.desc.trim().length < 5) { showToast('اشرح المنتج والمواصفات اللي عايزها (المقاس، اللون، الموديل...).', 'warning'); return; }
    const phone = normalizeDigits(srcForm.phone).replace(/\s+/g, '');
    if (!/^01[0125][0-9]{8}$/.test(phone)) { showToast('اكتب رقم موبايل صحيح للتواصل (11 رقم).', 'warning'); return; }
    if (!srcForm.accept) { showToast('لازم توافق على شروط الخدمة عشان تكمّل.', 'warning'); return; }
    submittingCustomerActionRef.current = true;
    try {
      const stamp = nowStamp();
      const req = {
        id: `SRC-${Date.now().toString()}-${Math.random().toString(36).slice(2, 6)}`,
        clientId: currentClient.id,
        clientName: currentClient.name,
        phone,
        name: srcForm.name.trim(),
        desc: srcForm.desc.trim(),
        image: srcForm.image || '',
        status: 'جديد',
        price: null,
        deposit: null,
        depositStatus: 'none',
        createdAt: stamp,
        updatedAt: stamp,
        acceptedTermsAt: stamp,
        messages: [],
        unreadAdmin: true,
        unreadClient: false,
        closed: false
      };
      const savedOk = await sbUpsert('sourcing_requests', req);
      if (!savedOk) {
        showToast('معلش، طلب المنتج ماوصلش للسيرفر. اتأكد من النت وجرّب تاني.', 'error');
        return;
      }
      const notif = adminNotify(`طلب منتج من برّه: ${req.name}`, `${currentClient.name} (${phone}) بعت طلب جديد #${req.id}`, { srcId: req.id });
      isCustomerMutatingCloudRef.current = true;
      markLocalUpsert('sourcingRequests', req);
      setSourcingRequests(prev => [req, ...prev]);
      setNotifications(prev => [notif, ...prev]);
      try {
        sbUpdate('site_settings', 'main', {
          notifications: [notif, ...notifications].slice(0, 100),
          updated_at: new Date().toISOString()
        });
      } catch (e) {}
      setSourcingFormOpen(false);
      setClientTab('account');
      setAccountSubTab('orders');
      setOpenAdminCards(prev => ({ ...prev, [`src_${req.id}`]: true }));
      showToast('طلبك وصل! هنراجعه ونكلمك في المحادثة جوه الطلب.', 'success');
    } finally {
      submittingCustomerActionRef.current = false;
    }
  };
const handleSrcFormImage = async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = await processAndUploadImage(file, 'sourcing');
      if (data) setSrcForm(prev => ({ ...prev, image: data }));
    } catch (err) {
      showToast('معرفتش أقرا الصورة، جرّب صورة تانية.', 'warning');
    }
  };
const pickSrcImages = async (reqId, e) => {
    const files = Array.from((e.target.files || [])).slice(0, 3);
    e.target.value = '';
    const done = [];
    for (const f of files) {
      try {
        const u = await processAndUploadImage(f, 'chat');
        if (u) done.push(u);
      } catch (err) {}
    }
    setSrcDraftImgs(prev => ({ ...prev, [reqId]: [...(prev[reqId] || []), ...done].slice(0, 3) }));
  };
const pickSrcPdf = async (reqId, e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) { showToast('ملف الـ PDF كبير (الحد 2.5 ميجا).', 'warning'); return; }
    try {
      const { isValid } = getSupabaseConfig();
      let data;
      if (isValid) {
        data = await uploadBlobToStorage(file, 'files', 'pdf', 'application/pdf');
        if (!data) { showToast('فشل رفع الـ PDF على الـ Storage.', 'error'); return; }
      } else {
        data = await readFileAsDataUrl(file);
      }
      setSrcDraftPdf(prev => ({ ...prev, [reqId]: { name: file.name, data } }));
    } catch (err) {
      showToast('معرفتش أقرا الملف.', 'warning');
    }
  };
const sendSourcingMessage = (reqId, side) => {
    const req = sourcingRequests.find(r => r.id === reqId);
    if (!req) return;
    const text = (srcDrafts[reqId] || '').trim();
    const images = srcDraftImgs[reqId] || [];
    const pdf = side === 'admin' ? srcDraftPdf[reqId] || null : null;
    if (!text && images.length === 0 && !pdf) return;
    const stamp = nowStamp();
    const msg = { id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, from: side, text, images, pdf, at: stamp };
    const apply = list =>
      list.map(r =>
        r.id === reqId && !(r.messages || []).some(x => x.id === msg.id)
          ? {
              ...r,
              messages: [...(r.messages || []), msg],
              updatedAt: stamp,
              status: side === 'admin' && r.status === 'جديد' ? 'قيد المراجعة' : r.status,
              imagesAllowed: side === 'client' && images.length > 0 ? false : r.imagesAllowed,
              unreadClient: side === 'admin' ? true : r.unreadClient,
              unreadAdmin: side === 'client' ? true : r.unreadAdmin
            }
          : r
      );
    const preview = text || (images.length ? '📷 صورة' : '📄 ملف');
    const notif =
      side === 'client'
        ? adminNotify(`رسالة جديدة في طلب ${req.id}`, `${req.clientName}: ${preview}`, { srcId: req.id })
        : clientNotify(req.clientId, `رد جديد على طلبك (${req.name})`, preview);
    setSourcingRequests(prev => apply(prev));
    setNotifications(prev => [notif, ...prev]);
    if (side === 'client') cloudSourcingUpdate(apply, notif);
    setSrcDrafts(prev => ({ ...prev, [reqId]: '' }));
    setSrcDraftImgs(prev => ({ ...prev, [reqId]: [] }));
    setSrcDraftPdf(prev => ({ ...prev, [reqId]: null }));
  };
const markSrcRead = (reqId, side) => {
    setSourcingRequests(prev =>
      prev.map(r => (r.id === reqId ? { ...r, [side === 'admin' ? 'unreadAdmin' : 'unreadClient']: false } : r))
    );
  };
const cancelSourcingByClient = req => {
    const stamp = nowStamp();
    const hadDeposit = req.depositStatus === 'received';
    const apply = list =>
      list.map(r =>
        r.id === req.id
          ? { ...r, status: 'ملغي', closed: true, updatedAt: stamp, depositStatus: hadDeposit ? 'refund_due' : r.depositStatus === 'requested' ? 'none' : r.depositStatus, unreadAdmin: true }
          : r
      );
    const notif = adminNotify(`العميل لغى الطلب ${req.id}`, `${req.clientName} لغى طلب (${req.name})${hadDeposit ? ' — لازم ترد العربون.' : ''}`, { srcId: req.id });
    setSourcingRequests(prev => apply(prev));
    setNotifications(prev => [notif, ...prev]);
    cloudSourcingUpdate(apply, notif);
    showToast(hadDeposit ? 'الطلب اتلغى، والعربون هيتردلك.' : 'الطلب اتلغى.', 'success');
  };
const adminSaveSrcPrice = req => {
    const d = srcPriceDraft[req.id] || {};
    const price = Number(d.price);
    const deposit = Number(d.deposit);
    if (!(price > 0)) { showToast('اكتب السعر.', 'warning'); return; }
    if (deposit > price) { showToast('⚠️ العربون أكبر من سعر الطلب نفسه — راجع الأرقام قبل الحفظ.', 'error'); return; }
    const stamp = nowStamp();
    setSourcingRequests(prev =>
      prev.map(r =>
        r.id === req.id
          ? {
              ...r,
              price,
              deposit: deposit > 0 ? deposit : 0,
              depositStatus: r.depositStatus === 'received' ? 'received' : deposit > 0 ? 'requested' : 'none',
              status: ['جديد', 'قيد المراجعة'].includes(r.status) ? 'تم تحديد السعر' : r.status,
              updatedAt: stamp,
              unreadClient: true
            }
          : r
      )
    );
    setNotifications(prev => [clientNotify(req.clientId, `تم تحديد سعر طلبك (${req.name})`, `السعر ${price} ج.م${deposit > 0 ? ` والعربون ${deposit} ج.م` : ''}`), ...prev]);
    showToast('اتحفظ السعر وبلّغنا العميل.', 'success');
  };
const adminSetSrcStatus = (req, status) => {
    const apply = () => {
      const stamp = nowStamp();
      setSourcingRequests(prev =>
        prev.map(r => {
          if (r.id !== req.id) return r;
          const isFinal = status === 'ملغي' || status === 'تم التسليم';
          const wasFinal = r.status === 'ملغي' || r.status === 'تم التسليم';
          const next = { ...r, status, updatedAt: stamp, unreadClient: true, closed: isFinal ? true : wasFinal ? false : r.closed };
          if (status === 'ملغي') {
            // Mirror the client-cancel path: a received deposit becomes
            // refund-due so it is never forgotten; an unpaid request clears.
            if (r.depositStatus === 'received') next.depositStatus = 'refund_due';
            else if (r.depositStatus === 'requested') next.depositStatus = 'none';
          }
          return next;
        })
      );
      setNotifications(prev => [clientNotify(req.clientId, `حالة طلبك (${req.name}) اتغيّرت`, `الحالة الجديدة: ${status}`), ...prev]);
    };
    if (status === 'جاري التوصيل' && req.depositStatus === 'received') {
      setConfirmDialog({
        title: 'تحويل الطلب لجاري التوصيل',
        message: 'بعد جاري التوصيل العربون بيبقى غير مسترد حسب الشروط. متأكد؟',
        confirmText: 'أيوه، حوّل',
        onConfirm: () => { apply(); setConfirmDialog(null); }
      });
    } else if (status === 'ملغي' && req.status !== 'ملغي') {
      setConfirmDialog({
        title: 'إلغاء طلب الاستيراد',
        message: req.depositStatus === 'received'
          ? 'هيتم إلغاء الطلب وتحويل العربون المستلم لحالة «في انتظار الرد» عشان يترّد للعميل. متأكد؟'
          : 'هيتم إلغاء طلب الاستيراد ده نهائياً. متأكد؟',
        confirmText: 'أيوه، إلغاء الطلب',
        onConfirm: () => { apply(); setConfirmDialog(null); }
      });
    } else apply();
  };
const adminSetDeposit = (req, depositStatus) => {
    // Financial state guards: a deposit can only be marked received after
    // it was requested, and refunded only after it was received/refund-due.
    if (depositStatus === 'received' && req.depositStatus !== 'requested') {
      showToast('⚠️ مش هينفع تعليم العربون كمستلم قبل ما يكون مطلوباً من العميل.', 'error');
      return;
    }
    if (depositStatus === 'refunded' && !['received', 'refund_due'].includes(req.depositStatus)) {
      showToast('⚠️ مش هينفع تعليم العربون كمردود قبل استلامه أصلاً.', 'error');
      return;
    }
    setConfirmDialog({
      title: depositStatus === 'received' ? 'تأكيد استلام العربون' : 'تأكيد رد العربون',
      message: depositStatus === 'received'
        ? `متأكد إنك استلمت عربون طلب الاستيراد (${req.name}) من العميل؟`
        : `متأكد إنك ردّيت عربون طلب الاستيراد (${req.name}) للعميل؟`,
      confirmText: 'أيوه، متأكد',
      onConfirm: () => {
        const stamp = nowStamp();
        setSourcingRequests(prev =>
          prev.map(r =>
            r.id === req.id
              ? { ...r, depositStatus, status: depositStatus === 'received' && ['جديد', 'قيد المراجعة', 'تم تحديد السعر'].includes(r.status) ? 'تم استلام العربون' : r.status, updatedAt: stamp, unreadClient: true }
              : r
          )
        );
        setNotifications(prev => [clientNotify(req.clientId, `تحديث العربون (${req.name})`, SRC_DEPOSIT_LABEL[depositStatus]), ...prev]);
        setConfirmDialog(null);
      }
    });
  };
const buildInvoiceHtml = (order, mode, forPdf) => {
    const en = lang === 'en';
    const esc = v =>
      String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const cur = en ? 'EGP' : 'ج.م';
    const clientObj = clients.find(c => c.id === order.clientId);
    const itemsSubtotal = order.items.reduce((sum, i) => sum + i.qty * i.unitPriceBase, 0);
    const total = itemsSubtotal + (order.deliveryFeeBase || 0) - (order.discountBase || 0);
    const pieces = order.items.reduce((sum, i) => sum + i.qty, 0);
    const isInvoice = mode === 'invoice';
    const T = en
      ? {
          sub: 'Sales invoice & warranty',
          pick: 'Internal warehouse picking slip',
          inv: 'Invoice No.',
          date: 'Date',
          status: 'Status',
          client: 'Customer',
          addr: 'Address',
          pay: 'Payment method',
          pcs: 'Total pieces',
          sku: 'SKU',
          item: 'Item',
          color: 'Color',
          qty: 'Qty',
          unit: 'Unit price',
          line: 'Total',
          check: 'Warehouse check',
          ok: '[   ] OK & sealed',
          sumItems: 'Items subtotal',
          disc: 'Discount',
          ship: 'Delivery fee',
          net: 'Net total',
          terms: 'Warranty & return terms',
          bal: 'Account balance',
          credit: 'Credit',
          debt: 'Debt',
          s1: 'Warehouse signature',
          s2: 'Inspector signature',
          s3: 'Courier signature'
        }
      : {
          sub: 'فاتورة مبيعات وضمان معتمدة',
          pick: 'مستند داخلي للمخازن: إذن تحضير وفحص',
          inv: 'رقم الفاتورة',
          date: 'التاريخ',
          status: 'الحالة',
          client: 'العميل',
          addr: 'العنوان',
          pay: 'طريقة الدفع',
          pcs: 'إجمالي القطع',
          sku: 'الكود',
          item: 'الصنف',
          color: 'اللون',
          qty: 'الكمية',
          unit: 'سعر الوحدة',
          line: 'الإجمالي',
          check: 'فحص المخزن',
          ok: '[   ] سليم ومختوم',
          sumItems: 'إجمالي الأصناف',
          disc: 'الخصم',
          ship: 'مصاريف التوصيل',
          net: 'الصافي النهائي',
          terms: 'شروط الضمان والاسترجاع',
          bal: 'رصيد الحساب',
          credit: 'رصيد دائن',
          debt: 'مديونية',
          s1: 'توقيع المخزن',
          s2: 'توقيع الفحص',
          s3: 'توقيع المندوب'
        };
    const rows = order.items
      .map(
        (it, i) => `<tr>
          <td>${i + 1}</td>
          <td style="font-family:monospace">${esc(it.sku)}</td>
          <td><b>${esc(it.name)}</b>${it.qualityGrade ? ` <span class="tag">${esc(it.qualityGrade)}</span>` : ''}</td>
          <td>${esc(it.color)}</td>
          <td style="text-align:center"><b>${it.qty}</b></td>
          ${
            isInvoice
              ? `<td>${Number(it.unitPriceBase).toLocaleString()} ${cur}</td><td><b>${(it.qty * it.unitPriceBase).toLocaleString()} ${cur}</b></td>`
              : `<td>${T.ok}</td>`
          }
        </tr>`
      )
      .join('');
    const balance = clientObj?.walletBalance || 0;
    const footer = isInvoice
      ? `<table class="sum"><tr><td>${T.sumItems}</td><td>${itemsSubtotal.toLocaleString()} ${cur}</td></tr>
          ${order.discountBase > 0 ? `<tr><td>${T.disc}</td><td>-${Number(order.discountBase).toLocaleString()} ${cur}</td></tr>` : ''}
          <tr><td>${T.ship}</td><td>${Number(order.deliveryFeeBase || 0).toLocaleString()} ${cur}</td></tr>
          <tr class="net"><td>${T.net}</td><td>${total.toLocaleString()} ${cur}</td></tr></table>
         <div class="terms"><b>${T.terms}:</b><br/>${esc(siteSettings.returnPolicyText || '')}<br/>${T.bal}: <b>${balance >= 0 ? T.credit : T.debt} ${Math.abs(balance).toLocaleString()} ${cur}</b></div>`
      : `<div class="sig"><span>${T.s1}: ..................</span><span>${T.s2}: ..................</span><span>${T.s3}: ..................</span></div>`;
    const dirv = en ? 'ltr' : 'rtl';
    const al = en ? 'left' : 'right';
    const css = `
.hmi{${forPdf ? 'width:794px;padding:0 28px;' : 'width:100%;'}box-sizing:border-box;background:#ffffff;color:#0f172a;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:13px;line-height:1.55;direction:${dirv};text-align:${al}}
.hmi *{box-sizing:border-box}
.hmi .head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:3px solid #0f172a;padding-bottom:12px;margin-bottom:14px}
.hmi .brand{display:flex;align-items:center;gap:12px}
.hmi .brand img{width:64px;height:64px;border-radius:12px;object-fit:cover;display:block}
.hmi .brand h1{font-size:18px;margin:0}
.hmi .brand p{margin:2px 0 0;font-size:11px;color:#475569}
.hmi .meta{background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:8px 12px;font-size:12px}
.hmi .box{display:flex;justify-content:space-between;gap:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin-bottom:14px;font-size:12px}
.hmi table{width:100%;border-collapse:collapse}
.hmi th{background:#0f172a;color:#ffffff;padding:8px;font-size:12px;text-align:${al}}
.hmi td{padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:${al}}
.hmi tr{page-break-inside:avoid}
.hmi .tag{background:#f1f5f9;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700}
.hmi .sum{width:260px;margin:14px 0 0 ${en ? 'auto' : '0'};${en ? '' : 'margin-right:auto;margin-left:0;'}background:#f1f5f9;border-radius:10px}
.hmi .sum td{border:0;padding:6px 12px}
.hmi .sum td:last-child{text-align:${en ? 'right' : 'left'};font-weight:700}
.hmi .net td{border-top:2px solid #94a3b8;font-size:14px;font-weight:800}
.hmi .terms{margin-top:14px;font-size:11px;color:#475569;border-top:2px solid #0f172a;padding-top:10px}
.hmi .sig{display:flex;justify-content:space-between;gap:12px;margin-top:30px;border-top:2px solid #0f172a;padding-top:14px;font-size:12px}
`;
    const body = `<div class="hmi" dir="${dirv}">
<div class="head"><div class="brand"><img src="${ELZOGHBI_LOGO}" width="64" height="64" alt=""/><div><h1>${esc(siteSettings.storeName || 'ELZOGHBI')}</h1><p>${isInvoice ? T.sub : T.pick}${isInvoice && siteSettings.whatsappNumber ? ' — ' + esc(siteSettings.whatsappNumber) : ''}</p></div></div>
<div class="meta"><div><b>${T.inv}:</b> ${esc(order.id)}</div><div>${T.date}: ${esc(order.createdAt)}</div><div>${T.status}: ${esc(order.status)}</div></div></div>
<div class="box"><div><b>${T.client}:</b> ${esc(order.clientName)}<br/>${T.addr}: ${esc(order.address)}</div><div>${T.pay}: <b>${esc(order.paymentMethod)}</b><br/>${T.pcs}: <b>${pieces}</b></div></div>
<table><thead><tr><th>#</th><th>${T.sku}</th><th>${T.item}</th><th>${T.color}</th><th style="text-align:center">${T.qty}</th>${isInvoice ? `<th>${T.unit}</th><th>${T.line}</th>` : `<th>${T.check}</th>`}</tr></thead><tbody>${rows}</tbody></table>
${footer}
</div>`;
    return { css, body, en };
  };
const waitForInvoiceAssets = rootEl =>
    new Promise(resolve => {
      const imgs = Array.from(rootEl.querySelectorAll('img'));
      const pending = imgs.filter(im => !im.complete);
      let left = pending.length;
      const finish = () => {
        try {
          const f = (rootEl.ownerDocument.fonts || {}).ready;
          if (f) Promise.race([f, new Promise(r => setTimeout(r, 1200))]).then(resolve);
          else setTimeout(resolve, 250);
        } catch (e) { setTimeout(resolve, 250); }
      };
      if (left === 0) return finish();
      pending.forEach(im => {
        const done = () => { left -= 1; if (left <= 0) finish(); };
        im.addEventListener('load', done);
        im.addEventListener('error', done);
      });
      setTimeout(finish, 3000);
    });
const handlePrintInvoice = (order, effectiveMode) => {
    const { css, body, en } = buildInvoiceHtml(order, effectiveMode, false);
    const html = `<!DOCTYPE html><html lang="${en ? 'en' : 'ar'}" dir="${en ? 'ltr' : 'rtl'}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(siteSettings.storeName || 'Invoice')} - ${escapeHtml(order.id)}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet"/><style>@page{size:A4;margin:10mm}html,body{margin:0;padding:0;background:#fff}.noprint{position:sticky;top:0;z-index:5;background:#0f172a;color:#fff;padding:10px;display:flex;gap:8px;justify-content:center;font-family:sans-serif}.noprint button{background:#22d3ee;color:#0f172a;border:0;border-radius:10px;padding:10px 18px;font-weight:800;font-size:14px;cursor:pointer}@media print{.noprint{display:none}}${css}.hmi{margin:0 auto;max-width:794px;padding:12px}</style></head><body><div class="noprint"><button onclick="window.print()">${en ? 'Print / Save as PDF' : 'طباعة / حفظ PDF'}</button></div>${body}<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},900)});<\/script></body></html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      return;
    }
    // popup blocked: fallback to a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html.replace('<script>', '<script data-x="1">').replace(/window\.print\(\)\},900/, 'void 0},900'));
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        showToast('المتصفح منع الطباعة، اسمح بالنوافذ المنبثقة وجرّب تاني.', 'warning');
      }
      setTimeout(() => { try { document.body.removeChild(iframe); } catch (e) {} }, 60000);
    }, 900);
  };
const loadScriptOnce = src =>
    new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-src="${src}"]`)) return resolve();
      const sc = document.createElement('script');
      sc.src = src;
      sc.dataset.src = src;
      sc.onload = () => resolve();
      sc.onerror = () => reject(new Error('script load failed'));
      document.body.appendChild(sc);
    });
const handleDownloadInvoicePdf = async (order, effectiveMode) => {
    showToast(`جاري تجهيز ملف PDF للفاتورة (${order.id})...`, 'info');
    let wrap = null;
    try {
      if (!window.html2canvas) await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      if (!(window.jspdf && window.jspdf.jsPDF)) await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const { css, body } = buildInvoiceHtml(order, effectiveMode, true);
      wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;top:0;left:0;width:794px;background:#ffffff;z-index:-1;';
      wrap.innerHTML = `<style>${css}</style>${body}`;
      document.body.appendChild(wrap);
      await waitForInvoiceAssets(wrap);
      const canvas = await window.html2canvas(wrap, {
        scale: window.innerWidth < 768 ? 1.5 : 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        width: 794,
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
        logging: false
      });
      const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = 210;
      const pageH = 297;
      const margin = 10;
      const sliceHpx = Math.floor(((pageH - margin * 2) / pageW) * canvas.width);
      let y = 0;
      let first = true;
      while (y < canvas.height) {
        const h = Math.min(sliceHpx, canvas.height - y);
        const part = document.createElement('canvas');
        part.width = canvas.width;
        part.height = h;
        const ctx = part.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, part.width, part.height);
        ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (!first) pdf.addPage();
        pdf.addImage(part.toDataURL('image/jpeg', 0.92), 'JPEG', 0, margin, pageW, (h / canvas.width) * pageW);
        first = false;
        y += h;
      }
      pdf.save(`${siteSettings.storeName || 'Invoice'}-${order.id}.pdf`);
      showToast(`الفاتورة اتحمّلت (${order.id}.pdf)`, 'success');
    } catch (err) {
      console.error('pdf failed', err);
      showToast('تعذّر تجهيز الـ PDF، هنفتحلك صفحة الطباعة (اختار حفظ كـ PDF).', 'warning');
      handlePrintInvoice(order, effectiveMode);
    } finally {
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
const [newBrandInput, setNewBrandInput] = useState('');
const [editingBrandIdx, setEditingBrandIdx] = useState(null);
const [editingBrandText, setEditingBrandText] = useState('');
const [newTplCategory, setNewTplCategory] = useState('شاشات كاملة');
const [newTplNamePattern, setNewTplNamePattern] = useState('باغة شاشة خارجية {model} أصلية بالفيبر');
const [newTplQuality, setNewTplQuality] = useState('أصلي توكيل Service Pack');
const [newTplSkuPrefix, setNewTplSkuPrefix] = useState('GLS-ORG');
const [newTplStock, setNewTplStock] = useState(20);
const [newTplCost, setNewTplCost] = useState(150);
const [newTplBasePrice, setNewTplBasePrice] = useState(300);
const [newTplImageKey, setNewTplImageKey] = useState('screen');
const backCandidates = [
    [!!lightbox, () => setLightbox(null)],
    [sourcingFormOpen, () => setSourcingFormOpen(false)],
    [!!filterSheet, () => setFilterSheet(null)],
    [adminMenuOpen, () => setAdminMenuOpen(false)],
    [!!confirmDialog, () => setConfirmDialog(null)],
    [!!printModalOrder, () => setPrintModalOrder(null)],
    [!!returnModalOrder, () => { setReturnModalOrder(null); setRetPhotos([]); }],
    [!!selectedDetailItem, () => setSelectedDetailItem(null)],
    [loginModalOpen, () => setLoginModalOpen(false)],
    [cartDrawerOpen, () => setCartDrawerOpen(false)],
    [notifDropdownOpen, () => setNotifDropdownOpen(false)],
    [adminNotifPanelOpen, () => setAdminNotifPanelOpen(false)],
    [!!approvingRequestObj, () => setApprovingRequestObj(null)],
    [adminCreateClientModalOpen, () => setAdminCreateClientModalOpen(false)],
    [adminSecurityModalOpen, () => setAdminSecurityModalOpen(false)],
    [!!editingPartObj, () => setEditingPartObj(null)],
    [!!editingModelObj, () => setEditingModelObj(null)],
    [!!addingPartToModel, () => setAddingPartToModel(null)],
    [brandManagerOpen, () => setBrandManagerOpen(false)],
    [templateManagerOpen, () => setTemplateManagerOpen(false)],
    [!!partGroupPricesModalPart, () => setPartGroupPricesModalPart(null)],
    [newPartModalOpen, () => setNewPartModalOpen(false)],
    [newModelModalOpen, () => setNewModelModalOpen(false)],
    [appPortal === 'admin' && adminTab !== 'overview', () => setAdminTab('overview')],
    [appPortal !== 'admin' && clientTab !== 'home' && clientTab !== 'store', () => setClientTab('home')]
  ];
const backAction = (backCandidates.find(c => c[0]) || [])[1] || null;
const backActionRef = React.useRef(null);
backActionRef.current = backAction;
const hasBackSentinelRef = React.useRef(false);
const canGoBackInApp = !!backAction;
useEffect(() => {
    if (canGoBackInApp && !hasBackSentinelRef.current) {
      try {
        window.history.pushState({ hmSentinel: true }, '');
        hasBackSentinelRef.current = true;
      } catch (e) {}
    }
  }, [canGoBackInApp]);
useEffect(() => {
    const onPop = () => {
      if (!hasBackSentinelRef.current) return;
      hasBackSentinelRef.current = false;
      const action = backActionRef.current;
      if (action) {
        action();
        try {
          window.history.pushState({ hmSentinel: true }, '');
          hasBackSentinelRef.current = true;
        } catch (e) {}
      } else {
        window.history.back();
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
useEffect(() => {
    if (pendingSourcingOpen && currentClient) {
      setPendingSourcingOpen(false);
      setSrcForm(blankSrcForm(currentClient));
      setSourcingFormOpen(true);
    }
  }, [currentClient, pendingSourcingOpen]);
useEffect(() => {
    setSrcSheetExp(false);
    setSrcSheetDrag(0);
  }, [sourcingFormOpen]);
useEffect(() => {
    window.scrollTo(0, 0);
  }, [clientTab]);
useEffect(() => {
    setSheetExpanded(false);
    setSheetDrag(0);
    setSheetDragging(false);
  }, [selectedDetailItem]);
useEffect(() => {
    setGridLimit(24);
  }, [selectedBrand, selectedModelId, selectedCategory, searchQuery, storeSortBy, storeStockFilter]);
useEffect(() => {
    if (clientTab !== 'search' || typeof IntersectionObserver === 'undefined') return undefined;
    const el = document.getElementById('grid-more');
    if (!el) return undefined;
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) setGridLimit(l => l + 24); }, { rootMargin: '500px' });
    io.observe(el);
    return () => io.disconnect();
  }, [gridLimit, filteredParts.length, clientTab]);
const rootRef = React.useRef(null);
const i18nActive = lang === 'en' && appPortal !== 'admin';
useEffect(() => {
    try { document.documentElement.lang = i18nActive ? 'en' : 'ar'; } catch (e) {}
    const root = rootRef.current;
    if (!root || !i18nActive) return undefined;
    const opts = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS };
    i18nTranslateNode(root);
    const mo = new MutationObserver(muts => {
      mo.disconnect();
      muts.forEach(m => {
        if (m.type === 'characterData') i18nTranslateNode(m.target);
        else if (m.type === 'attributes') i18nTranslateNode(m.target);
        else m.addedNodes.forEach(i18nTranslateNode);
      });
      mo.observe(root, opts);
    });
    mo.observe(root, opts);
    return () => {
      mo.disconnect();
      i18nRestoreNode(root);
    };
  }, [i18nActive]);
const homeElRef = React.useRef(null);
const searchElRef = React.useRef(null);

// ===================== Karambo (كرومبو الشغلانة) =====================
const karamboCfg = mergeKaramboCfg(siteSettings && siteSettings.karambo);
const guidePhonesAll = guidePhones.length > 0 ? guidePhones : GUIDE_PHONES_SEED;
const guidePhonesView = guidePhonesAll.filter(p => p && p.enabled !== false);
const persistGuidePhones = (list) => { setGuidePhones(list); try { window.localStorage.setItem('elzoghbi_v2_guidePhones', JSON.stringify(list)); } catch (e) {} };
const saveKaramboCfg = (next) => { saveSiteSettingsImmediate({ karambo: next }); showToast('اتحفظت إعدادات كرومبو الشغلانة', 'success'); };
const importGuideSeed = async () => {
  persistGuidePhones(GUIDE_PHONES_SEED);
  let ok = 0;
  for (const p of GUIDE_PHONES_SEED) { try { if (await sbUpsert('guide_phones', p)) ok++; } catch (e) {} }
  showToast(`اتستورد ${GUIDE_PHONES_SEED.length} جهاز في الدليل (${ok} اتحفظ على السيرفر)`, ok > 0 || GUIDE_PHONES_SEED.length === 0 ? 'success' : 'info');
};
const toggleGuidePhone = async (id) => {
  const list = guidePhonesAll.map(p => p.id === id ? { ...p, enabled: p.enabled === false ? true : false } : p);
  persistGuidePhones(list);
  const ph = list.find(p => p.id === id);
  if (ph) { try { await sbUpsert('guide_phones', ph); } catch (e) {} }
};
const updateGuidePhone = async (id, patchObj) => {
  const list = guidePhonesAll.map(p => {
    if (p.id !== id) return p;
    const next = { ...p, ...patchObj };
    if (patchObj.price && patchObj.price !== p.price) next.priceHistory = [...(p.priceHistory || []), { date: todayIsoDate(), price: patchObj.price }];
    return next;
  });
  persistGuidePhones(list);
  const ph = list.find(p => p.id === id);
  if (ph) { try { await sbUpsert('guide_phones', ph); } catch (e) {} showToast('اتحفظ التعديل', 'success'); }
};
const deleteGuidePhone = async (id) => {
  persistGuidePhones(guidePhonesAll.filter(p => p.id !== id));
  try { await sbDelete('guide_phones', id); } catch (e) {}
};
const submitPriceAlert = async (phone, name, contact) => {
  if (!name || !name.trim() || !contact || !contact.trim()) { showToast('اكتب اسمك ورقمك الأول', 'warning'); return false; }
  const rec = { id: 'pa_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), phoneId: phone.id, phoneName: phone.name, name: name.trim(), contact: contact.trim(), priceAt: phone.price || 0, createdAt: new Date().toISOString() };
  let ok = false;
  try { ok = await sbUpsert('price_alerts', rec); } catch (e) {}
  if (ok) { showToast('تمام! هنبعت لك أول ما سعره ينزل', 'success'); return true; }
  showToast('التنبيه محتاج اتصال بالسيرفر — جرّب تاني', 'error');
  return false;
};
const loadPriceAlerts = async () => {
  try {
    const rows = await sbFetchTable('price_alerts', '*', null, true);
    if (Array.isArray(rows)) setPriceAlertsAdmin(rows.map(r => toCamelCaseRow(r)).filter(a => a && a.id));
  } catch (e) {}
};
const deletePriceAlert = async (id) => {
  setPriceAlertsAdmin(prev => prev.filter(a => a.id !== id));
  try { await sbDelete('price_alerts', id); } catch (e) {}
};
const updatePriceAlertStatus = async (id, status) => {
  let target = null;
  setPriceAlertsAdmin(prev => prev.map(a => {
    if (a.id !== id) return a;
    target = { ...a, status };
    return target;
  }));
  if (target) { try { await sbUpsert('price_alerts', target); } catch (e) {} }
};
const addGuidePhone = async (newPhone) => {
  if (!newPhone || !newPhone.id) return false;
  const exists = guidePhonesAll.some(p => p.slug === newPhone.slug || p.id === newPhone.id);
  const list = exists
    ? guidePhonesAll.map(p => (p.slug === newPhone.slug || p.id === newPhone.id) ? { ...p, ...newPhone } : p)
    : [newPhone, ...guidePhonesAll];
  persistGuidePhones(list);
  let ok = false;
  try { ok = await sbUpsert('guide_phones', newPhone); } catch (e) {}
  showToast(ok ? `تمت إضافة «${newPhone.name}» للدليل وحفظه على السيرفر` : `تمت إضافة «${newPhone.name}» محلياً في الدليل`, 'success');
  return true;
};
const trackKaramboEvent = (type, key) => {
  if (!key) return;
  setKaramboStats(prev => {
    const base = prev && typeof prev === 'object' ? prev : { visits: {}, topPhones: {} };
    const next = { visits: { ...(base.visits || {}) }, topPhones: { ...(base.topPhones || {}) } };
    if (type === 'visit') next.visits[key] = (Number(next.visits[key]) || 0) + 1;
    else if (type === 'phone_view' || type === 'compare_device') next.topPhones[key] = (Number(next.topPhones[key]) || 0) + 1;
    try { window.localStorage.setItem('elzoghbi_v2_karamboStats', JSON.stringify(next)); } catch (e) {}
    return next;
  });
};
const resetKaramboStats = () => {
  const empty = { visits: {}, topPhones: {} };
  setKaramboStats(empty);
  try { window.localStorage.setItem('elzoghbi_v2_karamboStats', JSON.stringify(empty)); } catch (e) {}
  showToast('تم تصفير عدادات تحليلات كرومبو', 'info');
};
const persistStoreEntities = (list) => { setStoreReviewEntities(list); try { window.localStorage.setItem('elzoghbi_v2_storeReviewEntities', JSON.stringify(list)); } catch (e) {} };
const persistStoreEntries = (list) => { setStoreReviewEntries(list); try { window.localStorage.setItem('elzoghbi_v2_storeReviewEntries', JSON.stringify(list)); } catch (e) {} };
const persistStoreQuestions = (list) => { setStoreReviewQuestions(list); try { window.localStorage.setItem('elzoghbi_v2_storeReviewQuestions', JSON.stringify(list)); } catch (e) {} };

const ensureStoreEntity = async (ent) => {
  if (!ent || !ent.id) return false;
  if (storeReviewEntities.some(e => e.id === ent.id)) return true;
  const cleanEnt = { ...ent, approved: true };
  const next = [cleanEnt, ...storeReviewEntities];
  persistStoreEntities(next);
  try { await sbUpsert('store_review_entities', cleanEnt); } catch (e) {}
  return true;
};
const submitStoreReview = async (rev) => {
  if (karamboCfg.reviewsCfg?.requireLoginToReview !== false && !currentClient) {
    setAuthModalTab('login');
    setLoginModalOpen(true);
    showToast('لازم تسجّل دخولك أو تعمل حساب الأول عشان تقدر تضيف تقييم', 'warning');
    return false;
  }
  const enriched = currentClient
    ? { ...rev, authorUserId: currentClient.id, authorName: rev.authorName || currentClient.name || currentClient.owner || 'عميل مسجل', authorPhone: currentClient.phone || rev.authorPhone || '' }
    : rev;
  const next = [enriched, ...storeReviewEntries];
  persistStoreEntries(next);
  try { await sbUpsert('store_review_entries', enriched); } catch (e) {}
  showToast(enriched.status === 'pending' ? 'شكراً لتجربتك! تم استلام التقييم وسيظهر بعد مراجعة الإدارة' : 'تم نشر تجربتك بنجاح — شكراً لمساعدة غيرك!', 'success');
  return true;
};
const voteReviewHelpful = async (revId) => {
  let target = null;
  const next = storeReviewEntries.map(r => {
    if (r.id !== revId) return r;
    target = { ...r, helpfulCount: (Number(r.helpfulCount) || 0) + 1 };
    return target;
  });
  persistStoreEntries(next);
  if (target) { try { await sbUpsert('store_review_entries', target); } catch (e) {} }
};
const moderateStoreReview = async (revId, patch) => {
  let target = null;
  const next = storeReviewEntries.map(r => {
    if (r.id !== revId) return r;
    target = { ...r, ...patch };
    return target;
  });
  persistStoreEntries(next);
  if (target) { try { await sbUpsert('store_review_entries', target); } catch (e) {} showToast('تم تحديث التقييم', 'success'); }
};
const deleteStoreReview = async (revId) => {
  persistStoreEntries(storeReviewEntries.filter(r => r.id !== revId));
  try { await sbDelete('store_review_entries', revId); } catch (e) {}
  showToast('تم حذف التقييم', 'info');
};
const submitStoreEntity = async (ent) => {
  const next = [ent, ...storeReviewEntities];
  persistStoreEntities(next);
  try { await sbUpsert('store_review_entities', ent); } catch (e) {}
  showToast(ent.approved ? `تمت إضافة «${ent.name}» بنجاح` : 'تم استلام اقتراح المحل وسيظهر بعد مراجعة الإدارة', 'success');
  return true;
};
const updateStoreEntity = async (entId, patch) => {
  let target = null;
  const next = storeReviewEntities.map(e => {
    if (e.id !== entId) return e;
    target = { ...e, ...patch };
    return target;
  });
  persistStoreEntities(next);
  if (target) { try { await sbUpsert('store_review_entities', target); } catch (e) {} showToast('تم حفظ تعديل المحل', 'success'); }
};
const deleteStoreEntity = async (entId) => {
  persistStoreEntities(storeReviewEntities.filter(e => e.id !== entId));
  try { await sbDelete('store_review_entities', entId); } catch (e) {}
  showToast('تم حذف المحل', 'info');
};
const submitStoreQuestion = async (qObj) => {
  if (karamboCfg.reviewsCfg?.requireLoginToReview !== false && !currentClient) {
    setAuthModalTab('login');
    setLoginModalOpen(true);
    showToast('لازم تسجّل دخولك الأول عشان تضيف سؤال', 'warning');
    return false;
  }
  const enriched = currentClient ? { ...qObj, authorUserId: currentClient.id, authorName: currentClient.name || currentClient.owner || qObj.authorName } : qObj;
  const next = [enriched, ...storeReviewQuestions];
  persistStoreQuestions(next);
  try { await sbUpsert('store_review_questions', enriched); } catch (e) {}
  showToast('تم نشر سؤالك بنجاح', 'success');
  return true;
};
const submitStoreAnswer = async (qId, ansObj) => {
  if (karamboCfg.reviewsCfg?.requireLoginToReview !== false && !currentClient) {
    setAuthModalTab('login');
    setLoginModalOpen(true);
    showToast('لازم تسجّل دخولك الأول عشان ترد على الأسئلة', 'warning');
    return false;
  }
  const enrichedAns = currentClient ? { ...ansObj, author: currentClient.name || currentClient.owner || ansObj.author } : ansObj;
  let target = null;
  const next = storeReviewQuestions.map(q => {
    if (q.id !== qId) return q;
    target = { ...q, answers: [...(q.answers || []), enrichedAns] };
    return target;
  });
  persistStoreQuestions(next);
  if (target) { try { await sbUpsert('store_review_questions', target); } catch (e) {} showToast('تمت إضافة ردك بنجاح', 'success'); }
  return true;
};
useEffect(() => {
  const parseSellHash = () => { if ((window.location.hash || '').toLowerCase().startsWith('#/sell')) setClientTab('sell'); };
  parseSellHash();
  window.addEventListener('hashchange', parseSellHash);
  return () => window.removeEventListener('hashchange', parseSellHash);
}, []);
useEffect(() => {
  const parseKaramboHash = () => {
    const h = window.location.hash || '';
    if (!h.toLowerCase().startsWith('#/karambo')) return;
    const qIdx = h.indexOf('?');
    const params = new URLSearchParams(qIdx >= 0 ? h.slice(qIdx + 1) : '');
    const pg = params.get('page') || 'guide';
    const slugsRaw = params.get('slugs') || '';
    const slugs = slugsRaw ? slugsRaw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3) : [];
    setKaramboUi(p => ({ ...p, page: pg, ...(slugs.length ? { compareSlugs: slugs } : {}) }));
    setClientTab('karambo');
  };
  parseKaramboHash();
  window.addEventListener('hashchange', parseKaramboHash);
  return () => window.removeEventListener('hashchange', parseKaramboHash);
}, []);
const syncGuideLive = async () => {
  setGuideSyncState({ status: 'running', msg: 'بيجيب قايمة الأجهزة...' });
  try {
    const fetchViaProxy = async (u) => {
      const r = await fetch(`/api/ai-sourcing?action=fetch-url&url=${encodeURIComponent(u)}`);
      const j = await r.json();
      if (!j || !j.ok) throw new Error('proxy');
      return j.html || '';
    };
    const sm = await fetchViaProxy('https://mobi3araby.com/phone-sitemap.xml');
    const urls = parseGuideSitemap(sm).slice(0, 40);
    if (!urls.length) throw new Error('empty');
    const bySlug = new Map(guidePhonesAll.map(p => [p.slug, p]));
    const cheapest = Math.min(...guidePhonesAll.map(p => p.price || Infinity).filter(x => isFinite(x)), Infinity);
    let added = 0, updated = 0; const priceChanges = [];
    for (let i = 0; i < urls.length; i++) {
      setGuideSyncState({ status: 'running', msg: `بيزامن ${i + 1} من ${urls.length}...` });
      try {
        const html = await fetchViaProxy(urls[i]);
        const parsed = parseGuidePhoneHtml(html, urls[i]);
        if (!parsed) continue;
        parsed.valueScore = computeValueScore(parsed, isFinite(cheapest) ? cheapest : (parsed.price || 1));
        const prev = bySlug.get(parsed.slug);
        if (!prev) { parsed.priceHistory = [{ date: todayIsoDate(), price: parsed.price }]; bySlug.set(parsed.slug, parsed); added++; }
        else {
          const merged = { ...prev, ...parsed, enabled: prev.enabled !== false, priceHistory: prev.priceHistory || [] };
          if (parsed.price && prev.price && parsed.price !== prev.price) {
            merged.priceHistory = [...(prev.priceHistory || []), { date: todayIsoDate(), price: parsed.price }];
            priceChanges.push({ name: parsed.name, from: prev.price, to: parsed.price });
          }
          bySlug.set(parsed.slug, merged); updated++;
        }
      } catch (e) {}
    }
    const list = [...bySlug.values()];
    persistGuidePhones(list);
    for (const p of list) { try { await sbUpsert('guide_phones', p); } catch (e) {} }
    const report = { found: urls.length, added, updated, priceChanges };
    saveSiteSettingsImmediate({ karambo: { ...karamboCfg, lastSync: { at: new Date().toLocaleString('ar-EG'), added, updated, priceChanges } } });
    setGuideSyncState({ status: 'done', report });
  } catch (e) {
    setGuideSyncState({ status: 'error', msg: 'المزامنة الحية محتاجة خادم الموقع (Vercel) — في التجربة المحلية بـ Vite بس استخدم «استيراد البيانات المرفقة».' });
  }
};
useEffect(() => {
  if (guideFetchedRef.current) return;
  if (clientTab !== 'karambo' && adminTab !== 'karambo') return;
  guideFetchedRef.current = true;
  (async () => {
    try {
      const rows = await sbFetchTable('guide_phones', '*', null, true);
      if (Array.isArray(rows) && rows.length) {
        const clean = rows.map(r => toCamelCaseRow(r)).filter(p => p && p.id && p.slug);
        if (clean.length) persistGuidePhones(clean);
      }
    } catch (e) {}
  })();
}, [clientTab, adminTab]);

const homeActiveNow = clientTab === 'home' || clientTab === 'store';
const searchActiveNow = clientTab === 'search';
  ctxBag = { loadAdminCostMap, storeReviewEntities, storeReviewEntries, storeReviewQuestions, ensureStoreEntity, submitStoreReview, voteReviewHelpful, moderateStoreReview, deleteStoreReview, submitStoreEntity, updateStoreEntity, deleteStoreEntity, submitStoreQuestion, submitStoreAnswer, APPEND_ONLY_SLICES, CAMEL_TO_SNAKE_MAP, CATEGORY_GRADS, FLAG_KEY_TO_SETTING_KEY, NUMERIC_CAMEL_FIELDS, SESSION_CACHE_PREFIX, SESSION_CACHE_TTL, SNAKE_TO_CAMEL_MAP, SPIN_STORAGE_KEY, STATIC_SESSION_TABLES, TABLE_ALLOWED_COLUMNS, TABLE_DEFAULT_QUERY, TABLE_LIGHT_COLUMNS, accountRequests, accountSubTab, activeBirthdayOrSeasonalBanner, activeCatalogPricingGroupId, activeFamilyDevices, activeRole, activeSpinPrizes, adEditorOpen, adForm, adPreviewDevice, addingPartToModel, adminAddPartId, adminAuthenticated, adminCatalogBrand, adminCatalogSearch, adminCatalogSort, adminClientDossierTab, adminClientSearch, adminClientsFilterType, adminClientsGroupFilter, adminCmsSubTab, adminCreateClientModalOpen, adminCredentials, adminEditClientForm, adminFamilyModelId, adminFamilyOwnerLabel, adminFamilyTargetClientId, adminFlagsSubTab, adminGroupSearch, adminKpis, adminLoginPass, adminLoginUser, adminMenuOpen, adminNewPassword, adminNewUsername, adminNotifPanelOpen, adminNotify, adminOrFilterMode, adminOrderSearch, adminOrderSort, adminOrderStatusFilter, adminPwMap, adminReqPwMap, adminRestockWhatsappPart, adminReturnsSubTab, adminSaveSrcPrice, adminSecurityModalOpen, adminSelectedModelId, adminSetDeposit, adminSetSrcStatus, adminSettingsSubTab, adminSidebarCollapsed, adminSidebarMode, adminSidebarSearch, adminSourcingSubTab, adminStockFilter, adminTab, adminToggleSrcImages, aiCommandOpen, announceBoxOpen, appPortal, appliedPromo, appliedReferralClient, applySpinPrizePromo, approvingRequestObj, askConfirmDelete, authModalTab, autoGenerateParts, autoTemplates, backAction, backActionRef, backCandidates, bannerClosedText, blankAdForm, blankSrcForm, brandDeleteProtectionModal, brandImages, brandManagerOpen, brands, browserNotifPermission, buildInvoiceHtml, bulkPriceMode, bulkPriceRound5, bulkPriceToolOpen, bulkPriceValue, bundleDiscountPartIds, calculatePartPrice, callServerCroRpc, canGoBackInApp, canTriggerExitIntentNow, cancelSourcingByClient, cardImageIdx, cart, cartDrawerOpen, cartSummary, categoryEmoji, changeCols, changeLang, checkoutAddressChoice, clientCompletedOrderCount, clientFollowupText, clientLoginIdentifier, clientLoginPassword, clientLoyaltyInfo, clientNotify, clientOrdersSearch, clientOrdersSort, clientOrdersStatusFilter, clientTab, clients, cloudSourcingUpdate, cloudSyncStatus, cmdPaletteOpen, collapsedAdminModels, commitCustomerCloudTransaction, complaintReplies, complaints, compressImageDataUrl, computeGmReportData, confettiActive, confirmDialog, currencies, currentClient, currentCurrency, currentGroup, currentPeriodTotalSalesEgp, customAddressText, dataUrlToBlob, deepLinkOpenedRef, deferredSearchQuery, deletedIdsMapRef, deliveryFeeBase, detailImageIdx, diffFlushTimerRef, directClientForm, downloadImage, duplicateAd, editingBrandIdx, editingBrandImageFor, editingBrandText, editingModelObj, editingOrder, editingPartObj, enqueueLiveSocialProofOrder, estimateDataUrlBytes, exitIntentContactInput, exitIntentModalOpen, expandedAdminBrands, expandedAdminModels, expandedClientOrders, externalizeBase64Deep, extractEgyptianCityFromAddress, familyModalOpen, favoritePartIds, fetchSinglePartFullDetailsOnDemand, fetchSingleSourcingDetailsOnDemand, fetchSparePartsSliceOnDemand, fetchVisiblePartImagesOnDemand, fetchedModelPartsSetRef, fetchedPartDetailsSetRef, fetchedPartImagesSetRef, fetchedStorePagesSetRef, filterFetchDebounceRef, filterSheet, filterSheetQuery, filteredAdminOrders, filteredParts, floatingBottomMenuOpen, flushPendingDiffsToSupabase, forgotConfirmPassword, forgotIdentityVerify, forgotNewPassword, forgotOtpCode, forgotPhone, forgotStepStatus, formatMoney, formatSyncHttpError, generateTemplatePartsForModel, getCashierImpulseItems, getCategoryFallbackImg, getClientLoyaltyStatus, getFirstLetterMaskedName, getFooterConfig, getHeaderConfig, getMobilePushConfig, getPartCashbackPct, getPartImagesList, getPartQualityTiers, getPartWaitlistEntries, getSmartCrossSellSuggestions, getSpinCooldownInfoForUser, getSupabaseConfig, getTopCategories, gmReportCustomNotes, gmReportDateFrom, gmReportDateTo, gmReportOrderFilter, gmReportPreset, gmReportPrintPreviewOpen, gmReportSections, gridLimit, groupDrafts, groupModalSearchQuery, groups, guessAdTheme, guestFamilyDevices, handleAdImageUpload, handleAddCrossSellBundleItem, handleAddFamilyDevice, handleAdminAddClientFamilyDevice, handleAdminLoginSubmit, handleAdminSaveClientFullEdits, handleAdminUploadClientAvatar, handleApplyExitIntentOffer, handleApplyGroupModifier, handleApplyReferralCode, handleBulkDisableExpensiveCashback, handleBulkEnableAffordableCashback, handleChangeClientPassword, handleClientAvatarFileUpload, handleClientLoginSubmit, handleCloudSyncOrCatalog, handleCreateGroup, handleCreateModelWithTemplate, handleCreatePromoCode, handleDeleteModel, handleDeletePart, handleDirectClientAvatarUpload, handleDownloadInvoicePdf, handleExportGmReportCsv, handleForgotPasswordSubmit, handleInjectMissingTemplatesIntoModel, handleLiveFetchMoreOrProducts, handleMigrateAllBase64ImagesToStorage, handleNewAdImageUpload, handleNewModelImageFileUpload, handleNewsletterSubscribe, handleOptimizeAllSiteImagesToWebP, handlePlaceOrder, handlePrintInvoice, handleQuickReorder, handleRemoveFamilyDevice, handleRequestWarrantyReplacement, handleResolveReturn, handleSaveClientProfile, handleSaveLiveInvoiceEdit, handleSelectGmReportPreset, handleShareProduct, handleSpinTheWheel, handleSrcFormImage, handleSubmitCustomerRestockNotify, handleSubmitRegistrationRequest, handleSwitchRole, handleToggleSoundAndRequestPermission, handleToggleTargetedAdModel, handleToggleTargetedAdPart, handleUpdateOrderStatus, handleWaitlistRequest, hasAdminTablesPulledRef, hasBackSentinelRef, hasClientAlreadyUsedReferral, hasCloudInitialPullCompletedRef, hasCompletedOrderInSessionRef, hasCustomerRegisteredRestock, hasInitialBootPullRanRef, hasInteractedWithCartRef, hasRestoredLegacyFallbackRef, headerCompact, headerCompactRef, headerFullH, headerInnerRef, heroAdIndex, hiddenBrandsSet, hiddenCategoriesSet, hiddenModelIdsSet, hiddenPartIdsSet, homeActiveNow, homeElRef, i18nActive, inFlightRequestsMapRef, incomingSyncUntilRef, invalidateSessionTableCache, invoicePartSearchQuery, isBrandHidden, isCategoryHidden, isCurrentClientVip, isCustomerMutatingCloudRef, isFirstFilterRenderRef, isIncomingSyncRef, isInitialCloudBooting, isModelHidden, isPartCashbackEnabled, isPartFavorited, isPartHidden, isPartPinnedToCashier, isPartVipOnly, isSavingRef, isSpinningWheel, lang, lastBulkPriceSnapshot, lastKnownRemoteTimestampMsRef, lastKnownRemoteUpdatedAtRef, lastKnownTableTimestampsRef, lastLocalMutationAtRef, lastSavedPayloadRef, lastSeenOrderCountRef, lastSeenReqCountRef, lastSocialToastTsRef, lightbox, liveSocialQueueRef, liveSocialToast, loadScriptOnce, loadSessionMap, loadVisitStats, localModifiedMapRef, loginModalOpen, manualPayAmount, manualPayNote, markExitIntentTriggered24h, markLocalDelete, markLocalUpsert, markSrcRead, mergeServerWithLocal, migratingImages, migrationProgress, mobileCols, mobileFiltersExpanded, modelByIdMap, models, moveAd, myTabId, newAdForm, newBarForm, newBrandInput, newComplaintMsg, newComplaintSubject, newComplaintType, newFamilyModelId, newFamilyOwnerLabel, newGroupCurrency, newGroupDeliveryFee, newGroupModType, newGroupModVal, newGroupName, newModelAliases, newModelBrand, newModelImage, newModelModalOpen, newModelName, newPartModalOpen, newPromoForm, newTplBasePrice, newTplCategory, newTplCost, newTplImageKey, newTplNamePattern, newTplQuality, newTplSkuPrefix, newTplStock, newsletterEmail, nlBody, nlPromoCode, nlSubject, normalizeArabicSearch, notifDropdownOpen, notifInitializedRef, notifications, notifiedPartIds, openAdminCards, openCmsSections, openCustomerRestockModal, openEditAd, openFeatureSections, openNewAd, openOrderStatusWhatsApp, openSidebarGroups, openSourcing, orCloudSyncState, orLiveFetchState, orderNotes, orders, ordersRef, pageLoadedAtRef, parsedSearchWords, partCountByBrandMap, partCountByModelIdMap, partGroupPricesModalPart, partPassesStoreFilters, parts, passwordForm, paymentBoxOpen, paymentMethod, pendingDiffDeletesRef, pendingDiffUpsertsRef, pendingReflushRef, pendingSaveBundleRef, pendingScrollToProductsRef, pendingSourcingOpen, persistMutationMaps, pickSrcImages, pickSrcPdf, placeOrderInner, placedOrderInfo, placingOrder, playAppNotificationSound, playNotificationSound, prevFreeShipUnlockedRef, prevSlicesRef, printModalOrder, processAndUploadImage, productsGridAnchorRef, profileForm, promoCodeInput, promoCodes, publicBrands, publicModels, publicPartCountByBrandMap, publicPartCountByModelIdMap, publicParts, pullFromSupabaseCloud, pushToSupabaseCloud, quickStockBrand, quickStockCat, quickStockModel, quickStockPage, quickStockSearch, quickStockSort, readSessionTableCache, realtimeConnected, recentlyViewedIds, recordRecentlyViewedPart, recordRecoveredCartEvent, referralCodeInput, refreshServerFeatureFlags, regErrors, regForm, renderAdSeg, renderAdToggle, renderAddPartToModelModal, renderAdminApproveRequestModal, renderAdminCatalog, renderAdminClients, renderAdminCreateClientModal, renderAdminDashboard, renderAdminDatabaseSchema, renderAdminExecutiveReportsView, renderAdminFeatureFlagsDashboard, renderAdminGroups, renderAdminOrders, renderAdminOverview, renderAdminPromoCodes, renderAdminQuickStock, renderAdminRestockAlertsView, renderAdminRestockWhatsappModal, renderAdminReturnsAndComplaints, renderAdminSecurityModal, renderAdminSiteSettings, renderAdminSourcing, renderAdminStorefrontCms, renderAdminSubTabBar, renderAnnouncements, renderBrandImageModal, renderBrandManagerModal, renderCartDrawer, renderCashierImpulseShelf, renderCheckoutFooter, renderCheckoutView, renderClientAccountPortal, renderClientAvatar, renderClientComplaintsView, renderClientFooter, renderClientHeader, renderClientLedgerView, renderClientOrdersView, renderClientProfileSettingsView, renderClientReturnsView, renderClientSourcingSection, renderCmsAccordionHeader, renderConfettiOverlay, renderConfirmDialogModal, renderCustomerRestockNotifyModal, renderEditModelModal, renderEditPartModal, renderExitIntentModal, renderFamilyDevicesModal, renderFilterSheet, renderFloatingSpinTrigger, renderFreeShippingProgressBar, renderGmReportDocumentContent, renderGmReportPrintModal, renderHomeView, renderLightbox, renderLiveSocialProofToast, renderLoginModal, renderPartGroupPricesModal, renderPrecisionImageControls, renderPrintModal, renderProductCard, renderProductOrAdDetailModal, renderProfitProtectionShieldCard, renderRecentlyViewedStrip, renderReturnRequestModal, renderRoleSwitcherBar, renderSmartCrossSellBundles, renderSocialIconsGroup, renderSourcingBanner, renderSourcingFormModal, renderSpinToWinModal, renderSrcChat, renderStickyCartBar, renderStorefront, renderTemplateManagerModal, renderVipRouteView, renderVisitorStats, renderVvipBrandEmblem, renderWarrantyLookupModal, repurchaseShowAllMode, reqAllImages, resolveActualTableName, resolvePartModelObj, restockNotifyModalPart, restockVisitorName, restockVisitorPhone, retPartId, retPhotos, retReason, returnAdminNotes, returnModalOrder, returnsList, rootRef, runSiteImagesAudit, saveAdForm, saveDebounceTimerRef, saveSiteSettingsImmediate, sbDelete, sbFetchTable, sbHeaders, sbUpdate, sbUpsert, searchActiveNow, searchElRef, searchQuery, seenNotifIdsRef, selectedAdminClient, selectedAdminClientId, selectedBrand, selectedCategory, selectedColors, selectedDetailItem, selectedModelId, selectedQualityTiers, selectedTargetModelName, sendAdminRestockWhatsappToEntry, sendMobileOrderPushAlert, sendSourcingMessage, serverFeatureFlags, setAccountRequests, setAccountSubTab, setActiveCatalogPricingGroupId, setActiveRole, setAdEditorOpen, setAdForm, setAdPreviewDevice, setAddingPartToModel, setAdminAddPartId, setAdminAuthenticated, setAdminCatalogBrand, setAdminCatalogSearch, setAdminCatalogSort, setAdminClientDossierTab, setAdminClientSearch, setAdminClientsFilterType, setAdminClientsGroupFilter, setAdminCmsSubTab, setAdminCreateClientModalOpen, setAdminCredentials, setAdminEditClientForm, setAdminFamilyModelId, setAdminFamilyOwnerLabel, setAdminFamilyTargetClientId, setAdminFlagsSubTab, setAdminGroupSearch, setAdminLoginPass, setAdminLoginUser, setAdminMenuOpen, setAdminNewPassword, setAdminNewUsername, setAdminNotifPanelOpen, setAdminOrFilterMode, setAdminOrderSearch, setAdminOrderSort, setAdminOrderStatusFilter, setAdminPwMap, setAdminReqPwMap, setAdminRestockWhatsappPart, setAdminReturnsSubTab, setAdminSecurityModalOpen, setAdminSelectedModelId, setAdminSettingsSubTab, setAdminSidebarCollapsed, setAdminSidebarMode, setAdminSidebarSearch, setAdminSourcingSubTab, setAdminStockFilter, setAdminTab, setAiCommandOpen, setAnnounceBoxOpen, setAppPortal, setAppliedPromo, setAppliedReferralClient, setApprovingRequestObj, setAuthModalTab, setAutoGenerateParts, setAutoTemplates, setBannerClosedText, setBrandDeleteProtectionModal, setBrandImages, setBrandManagerOpen, setBrands, setBrowserNotifPermission, setBulkPriceMode, setBulkPriceRound5, setBulkPriceToolOpen, setBulkPriceValue, setBundleDiscountPartIds, setCardImageIdx, setCart, setCartDrawerOpen, setCartQtyDirect, setCheckoutAddressChoice, setClientFollowupText, setClientLoginIdentifier, setClientLoginPassword, setClientOrdersSearch, setClientOrdersSort, setClientOrdersStatusFilter, setClientTab, setClients, setCloudSyncStatus, setCmdPaletteOpen, setCollapsedAdminModels, setComplaintReplies, setComplaints, setConfettiActive, setConfirmDialog, setCurrencies, setCustomAddressText, setDetailImageIdx, setDirectClientForm, setEditingBrandIdx, setEditingBrandImageFor, setEditingBrandText, setEditingModelObj, setEditingOrder, setEditingPartObj, setExitIntentContactInput, setExitIntentModalOpen, setExpandedAdminBrands, setExpandedAdminModels, setExpandedClientOrders, setFamilyModalOpen, setFavoritePartIds, setFilterSheet, setFilterSheetQuery, setFloatingBottomMenuOpen, setForgotConfirmPassword, setForgotIdentityVerify, setForgotNewPassword, setForgotOtpCode, setForgotPhone, setForgotStepStatus, setGmReportCustomNotes, setGmReportDateFrom, setGmReportDateTo, setGmReportOrderFilter, setGmReportPreset, setGmReportPrintPreviewOpen, setGmReportSections, setGridLimit, setGroupDrafts, setGroupModalSearchQuery, setGroups, setGuestFamilyDevices, setHeaderCompact, setHeaderFullH, setHeroAdIndex, setInvoicePartSearchQuery, setIsInitialCloudBooting, setIsSpinningWheel, setLang, setLastBulkPriceSnapshot, setLightbox, setLiveSocialToast, setLoginModalOpen, setManualPayAmount, setManualPayNote, setMigratingImages, setMigrationProgress, setMobileCols, setMobileFiltersExpanded, setModels, setNewAdForm, setNewBarForm, setNewBrandInput, setNewComplaintMsg, setNewComplaintSubject, setNewComplaintType, setNewFamilyModelId, setNewFamilyOwnerLabel, setNewGroupCurrency, setNewGroupDeliveryFee, setNewGroupModType, setNewGroupModVal, setNewGroupName, setNewModelAliases, setNewModelBrand, setNewModelImage, setNewModelModalOpen, setNewModelName, setNewPartModalOpen, setNewPromoForm, setNewTplBasePrice, setNewTplCategory, setNewTplCost, setNewTplImageKey, setNewTplNamePattern, setNewTplQuality, setNewTplSkuPrefix, setNewTplStock, setNewsletterEmail, setNlBody, setNlPromoCode, setNlSubject, setNotifDropdownOpen, setNotifications, setNotifiedPartIds, setOpenAdminCards, setOpenCmsSections, setOpenFeatureSections, setOpenSidebarGroups, setOrCloudSyncState, setOrLiveFetchState, setOrderNotes, setOrders, setPartGroupPricesModalPart, setParts, setPasswordForm, setPaymentBoxOpen, setPaymentMethod, setPendingSourcingOpen, setPlacedOrderInfo, setPlacingOrder, setPrintModalOrder, setProfileForm, setPromoCodeInput, setPromoCodes, setQuickStockBrand, setQuickStockCat, setQuickStockModel, setQuickStockPage, setQuickStockSearch, setQuickStockSort, setRealtimeConnected, setRecentlyViewedIds, setReferralCodeInput, setRegErrors, setRegForm, setRepurchaseShowAllMode, setRestockNotifyModalPart, setRestockVisitorName, setRestockVisitorPhone, setRetPartId, setRetPhotos, setRetReason, setReturnAdminNotes, setReturnModalOrder, setReturnsList, setSearchQuery, setSelectedAdminClientId, setSelectedBrand, setSelectedCategory, setSelectedColors, setSelectedDetailItem, setSelectedModelId, setSelectedQualityTiers, setServerFeatureFlags, setSheetDrag, setSheetDragging, setSheetExpanded, setShowClosedItems, setShowScrollTopBtn, setShowcaseBars, setSiteImageAuditStats, setSiteSettings, setSmartNotifsOpen, setSoundAlertsEnabled, setSourcingFormOpen, setSourcingRequests, setSpinContactInput, setSpinCooldownMessage, setSpinModalOpen, setSpinRotationDeg, setSpinWheelState, setSrcDraftImgs, setSrcDraftPdf, setSrcDrafts, setSrcFilter, setSrcForm, setSrcPriceDraft, setSrcSettingsOpen, setSrcSheetDrag, setSrcSheetDragging, setSrcSheetExp, setStoreAds, setStoreExtraEightShown, setStorePage, setStorePriceRangeFilter, setStoreQualityFilter, setStoreSortBy, setStoreStockFilter, setTemplateManagerOpen, setTermsBoxOpen, setToast, setUiTheme, setUseWalletBalance, setVipAdminPreviewUnlocked, setVipLinkUnlocked, setVisibilityBoxOpen, setVisitInfo, setVisitStats, setWalletActionNote, setWalletActionType, setWalletInputAmount, setWalletManageClient, setWarrantyClaimNotes, setWarrantyModalOpen, setWarrantyPhoneQuery, sharePartViaWhatsApp, sheetDrag, sheetDragging, sheetExpanded, sheetStartYRef, showClosedItems, showScrollTopBtn, showToast, showcaseBars, shownSocialOrderIdsRef, siteImageAuditStats, siteSettings, smartNotifsOpen, soundAlertsEnabled, sourcingFormOpen, sourcingRequests, spinContactInput, spinCooldownMessage, spinModalOpen, spinRotationDeg, spinWheelState, srcDraftImgs, srcDraftPdf, srcDrafts, srcFilter, srcForm, srcPriceDraft, srcSettingsOpen, srcSheetDrag, srcSheetDragging, srcSheetExp, srcSheetStartRef, storeAds, storeExtraEightShown, storeGridTopRef, storePage, storePriceRangeFilter, storeQualityFilter, storeSortBy, storeStockFilter, submitRegistrationRequestInner, submitSourcingRequest, submittingCustomerActionRef, swipeProps, swipeStartRef, swipeSuppressRef, switchPortal, templateManagerOpen, termsBoxOpen, toCamelCaseRow, toSnakeCaseRow, toast, todayIsoDate, toggleAdminCard, toggleCmsSection, toggleFavoritePart, toggleFeatureSection, toggleHideBrand, toggleHideCategory, toggleHideModel, toggleHidePart, toggleModelCollapse, togglePartCashback, togglePartCashierPin, togglePartSoldOut, togglePartVipOnly, toggleUiTheme, triggerBrowserAndSoundNotification, triggerConfettiCelebration, triggerLiveSocialToastImmediate, uiTheme, unsupportedColumnsRef, updateCartQty, updatePaymentMethods, uploadBlobToStorage, useFlag, useWalletBalance, validateRegistration, vipAdminPreviewUnlocked, vipCatalogParts, vipLinkUnlocked, vipMinOrders, vipRequiredSpentEgp, visibilityBoxOpen, visitInfo, visitSbHeaders, visitStats, waitForInvoiceAssets, walletActionNote, walletActionType, walletInputAmount, walletManageClient, warrantyClaimNotes, warrantyModalOpen, warrantyPhoneQuery, writeSessionTableCache, adminSession, setAdminSession, isAdminOwner, canAdmin, teamUsers, teamLoading, teamForm, setTeamForm, teamDeleteId, setTeamDeleteId, loadTeamUsers, saveTeamUser, deleteTeamUser, toggleTeamUserActive, renderAdminTeam, guidePhonesAll, guidePhonesView, guidePhonesAdmin: guidePhonesAll, karamboUi, setKaramboUi, karamboCfg, saveKaramboCfg, importGuideSeed, toggleGuidePhone, updateGuidePhone, deleteGuidePhone, submitPriceAlert, priceAlertsAdmin, loadPriceAlerts, deletePriceAlert, guideSyncState, syncGuideLive, addGuidePhone, updatePriceAlertStatus, karamboStats, trackKaramboEvent, resetKaramboStats, computeValueScore, renderKaramboStrip, renderKaramboPage, renderAdminKarambo };
return (
    <div ref={rootRef} dir={i18nActive ? 'ltr' : 'rtl'} className="min-h-[100svh] w-full max-w-full flex flex-col bg-bg text-fg font-sans relative">
      <style>{`
        html, body {
          max-width: 100% !important;
          width: 100% !important;
          overflow-x: clip !important;
          -webkit-text-size-adjust: 100%;
        }
        #root {
          max-width: 100% !important;
          width: 100% !important;
          overflow-x: clip !important;
        }
        #elz-admin-sidebar,
        #elz-admin-sidebar *,
        #elz-admin-sidebar-mobile,
        #elz-admin-sidebar-mobile *,
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        #elz-admin-sidebar::-webkit-scrollbar,
        #elz-admin-sidebar *::-webkit-scrollbar,
        #elz-admin-sidebar-mobile::-webkit-scrollbar,
        #elz-admin-sidebar-mobile *::-webkit-scrollbar,
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
          background: transparent !important;
        }
        :root {
          --bg: 255 255 255;
          --surface: 245 245 247;
          --surface2: 232 232 237;
          --fg: 29 29 31;
          --muted: 110 110 115;
          --line: 217 217 222;
          --accent: 0 113 227;
          --accent-ink: 255 255 255;
          --accent-text: 0 102 204;
          --go: 0 113 227;
          --go-ink: 255 255 255;
        }
        .dark {
          --bg: 0 0 0;
          --surface: 29 29 31;
          --surface2: 44 44 46;
          --fg: 245 245 247;
          --muted: 161 161 166;
          --line: 56 56 58;
          --accent: 0 113 227;
          --accent-ink: 255 255 255;
          --accent-text: 41 151 255;
          --go: 0 113 227;
          --go-ink: 255 255 255;
        }
        .bg-bg { background-color: rgb(var(--bg)); }
        .bg-surface { background-color: rgb(var(--surface)); }
        .bg-surface2 { background-color: rgb(var(--surface2)); }
        .text-fg { color: rgb(var(--fg)); }
        .text-muted { color: rgb(var(--muted)); }
        .border-line { border-color: rgb(var(--line)); }
        .divide-line > :not([hidden]) ~ :not([hidden]) { border-color: rgb(var(--line)); }
        .ring-line { --tw-ring-color: rgb(var(--line)); }
        .bg-accent { background-color: rgb(var(--accent)); }
        .bg-accent\/15 { background-color: rgb(var(--accent) / 0.15); }
        .bg-accent\/20 { background-color: rgb(var(--accent) / 0.20); }
        .border-accent { border-color: rgb(var(--accent)); }
        .border-accent\/30 { border-color: rgb(var(--accent) / 0.30); }
        .text-accent-ink { color: rgb(var(--accent-ink)); }
        .text-accent-text { color: rgb(var(--accent-text)); }
        .bg-go { background-color: rgb(var(--go)); }
        .text-go-ink { color: rgb(var(--go-ink)); }
        .border-go { border-color: rgb(var(--go)); }
        .bg-nav { background-color: #161617; }
        .bg-nav2 { background-color: #1d1d1f; }
        .dark .bg-nav2 { background-color: #3a3a3c; }
        .from-nav { --tw-gradient-from: #161617 var(--tw-gradient-from-position); --tw-gradient-to: rgb(22 22 23 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
        .via-nav2 { --tw-gradient-to: rgb(29 29 31 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), #1d1d1f var(--tw-gradient-via-position), var(--tw-gradient-to); }
        .to-nav { --tw-gradient-to: #161617 var(--tw-gradient-to-position); }
        .border-navline { border-color: #424245; }
        input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="color"]),
        select,
        textarea {
          background-color: rgb(var(--bg)) !important;
          color: rgb(var(--fg)) !important;
          border-color: rgb(var(--line)) !important;
          caret-color: rgb(var(--accent)) !important;
        }
        input::placeholder,
        textarea::placeholder {
          color: rgb(var(--muted)) !important;
          opacity: 0.85 !important;
        }
        select option {
          background-color: rgb(var(--surface)) !important;
          color: rgb(var(--fg)) !important;
        }
        .text-nav-fg { color: #f5f5f7; }
        .bg-nav-cyan { background-color: #0071e3; }
        .text-nav-cyan { color: #2997ff; }
        .border-nav-cyan { border-color: #0071e3; }
        .text-nav-cyan-ink { color: #FFFFFF; }
        .bg-nav-cart { background-color: #0071e3; }
        .text-nav-cart-ink { color: #FFFFFF; }
        .bg-announce-bg { background-color: #f5f5f7; }
        .dark .bg-announce-bg { background-color: #1d1d1f; }
        .text-announce-ink { color: #1d1d1f; }
        .dark .text-announce-ink { color: #f5f5f7; }
        .border-announce-bg { border-color: #d2d2d7; }
        .bg-maint-bg { background-color: #d70015; }
        .border-maint-bg { border-color: #d70015; }
        @media (max-width: 1024px) {
          input, select, textarea { font-size: 16px !important; }
        }
        html { -webkit-text-size-adjust: 100%; }
        [dir='ltr'] .text-right { text-align: left; }
        @keyframes hm-confetti-fall {
          0% { transform: translate3d(0, -10px, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(25px, 100vh, 0) rotate(720deg); opacity: 0; }
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type='range'].hm-range { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 9999px; background: rgba(0,113,227,0.22); outline: none; }
        input[type='range'].hm-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 9999px; background: #0071e3; border: 2px solid #ffffff; cursor: pointer; }

        .hm-card { content-visibility: auto; contain-intrinsic-size: auto 330px; }
        @media (max-width: 639px) {
          .hm-grid2 .hm-card { contain-intrinsic-size: auto 240px; }
          .hm-grid2 .hm-card-img { height: 8rem; }
          .hm-grid2 .hm-card-body { padding: 0.5rem; }
          .hm-grid2 .hm-card-body h3 { font-size: 12px; line-height: 1.35; }
          .hm-grid2 .hm-card-desc, .hm-grid2 .hm-card-compat, .hm-grid2 .hm-card-meta, .hm-grid2 .hm-card-color, .hm-grid2 .hm-card-warranty { display: none; }
          .hm-grid2 .hm-card-stock span { font-size: 9px; padding: 2px 6px; }
          .hm-grid2 .hm-card-foot { flex-direction: column; align-items: stretch; padding: 0.5rem; gap: 0.4rem; }
          .hm-grid2 .hm-card-foot > div:last-child { justify-content: space-between; }
          .hm-grid2 .hm-card-foot input { width: 2.4rem; font-size: 14px; }
        }
      `}</style>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4">
          <div
            className={`p-3.5 rounded-2xl shadow-2xl border text-xs font-extrabold flex items-center justify-between gap-2 ${
              toast.type === 'error'
                ? 'bg-maint-bg text-white border-maint-bg'
                : toast.type === 'warning'
                ? 'bg-announce-bg text-announce-ink border-announce-bg'
                : 'bg-nav text-nav-cyan border-navline'
            }`}
          >
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Portal Switch: Standalone Admin Dashboard vs Standalone Customer Storefront */}
      {appPortal === 'admin' ? (
        <main className="flex-1 flex flex-col"><AdminThemeGuard />{renderAdminDashboard()}</main>
      ) : (
        <div className="flex flex-col flex-1 min-h-[100svh] w-full max-w-[100vw] overflow-x-hidden justify-between">
          <main className="flex-1 w-full max-w-[100vw] min-w-0 overflow-x-hidden">
            {renderAnnouncements()}
            {renderClientHeader()}
            {/* Automatic Birthday / Seasonal Offer Banner */}
            {activeBirthdayOrSeasonalBanner && (
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 px-4 py-2.5 text-xs font-black shadow-md">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span>{activeBirthdayOrSeasonalBanner.title} — </span>
                    <span>{activeBirthdayOrSeasonalBanner.subtitle}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const bPromo = {
                        id: `prm_${activeBirthdayOrSeasonalBanner.code}`,
                        code: activeBirthdayOrSeasonalBanner.code,
                        type: 'percentage',
                        value: activeBirthdayOrSeasonalBanner.pct,
                        maxDiscountCap: 500,
                        minOrderAmount: 0,
                        usageLimit: 10000,
                        usedCount: 0,
                        expiryDate: '2027-12-31',
                        description: activeBirthdayOrSeasonalBanner.title,
                        active: true
                      };
                      setPromoCodeInput(bPromo.code);
                      setAppliedPromo(bPromo);
                      showToast(`🎁 تم تفعيل الكوبون (${bPromo.code}) بخصم ${bPromo.value}%!`, 'success');
                    }}
                    className="px-3 py-1 rounded-xl bg-slate-950 text-amber-300 font-black text-[11px]"
                  >
                    تفعيل الكوبون ({activeBirthdayOrSeasonalBanner.code}) الآن ⚡
                  </button>
                </div>
              </div>
            )}
            {homeActiveNow && renderHomeView()}
            {searchActiveNow && renderStorefront()}
            {clientTab === 'vip' && renderVipRouteView()}
            {clientTab === 'checkout' && renderCheckoutView()}
            {clientTab === 'account' && renderClientAccountPortal()}
            {clientTab === 'karambo' && renderKaramboPage()}
            {clientTab === 'sell' && (() => { const sc = getSupabaseConfig(); return <MarketplacePage sbUrl={sc.sbUrl} sbKey={sc.sbKey} currentClient={currentClient} openLogin={() => setLoginModalOpen(true)} showToast={showToast} />; })()}
            {clientTab === 'cms_page' && (() => {
              const allPages = Array.isArray(siteSettings?.cmsPages) && siteSettings.cmsPages.length > 0 ? siteSettings.cmsPages : DEFAULT_CMS_PAGES;
              const pg = allPages.find((p) => p.slug === activeCmsPageSlug && p.status === 'published');
              if (!pg) return (
                <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
                  <h2 className="text-xl font-black text-fg">الصفحة غير موجودة</h2>
                  <button type="button" onClick={() => setClientTab('home')} className="px-5 py-2.5 rounded-full bg-[#0071E3] text-white text-xs font-bold">العودة للرئيسية</button>
                </div>
              );
              return (
                <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-8">
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-fg">{pg.titleAr}</h1>
                    <button type="button" onClick={() => setClientTab('home')} className="px-4 py-2 rounded-full bg-surface border border-line text-xs font-bold text-fg">← الرئيسية</button>
                  </div>
                  {(pg.sections || []).filter((s) => s.visible !== false).map((sec) => (
                    <section key={sec.id} className="rounded-[24px] p-6 sm:p-8 border border-line bg-surface space-y-3">
                      {sec.content?.eyebrow && <div className="text-xs font-bold text-[#0071E3]">{sec.content.eyebrow}</div>}
                      {sec.content?.title && <h2 className="text-xl font-black text-fg">{sec.content.title}</h2>}
                      {sec.content?.subtitle && <p className="text-sm text-muted leading-relaxed">{sec.content.subtitle}</p>}
                      {sec.type === 'custom_features' && Array.isArray(sec.content?.items) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                          {sec.content.items.map((it, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-bg border border-line space-y-1">
                              <div className="text-xl">{it.icon}</div>
                              <div className="font-black text-sm text-fg">{it.title}</div>
                              <div className="text-xs text-muted">{it.desc}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {sec.type === 'custom_faq' && Array.isArray(sec.content?.items) && (
                        <div className="space-y-2 pt-2">
                          {sec.content.items.map((it, idx) => (
                            <details key={idx} className="p-4 rounded-2xl bg-bg border border-line">
                              <summary className="font-black text-sm text-fg cursor-pointer">{it.q}</summary>
                              <p className="text-xs text-muted mt-2 leading-relaxed">{it.a}</p>
                            </details>
                          ))}
                        </div>
                      )}
                      {sec.content?.ctaText && (
                        <button type="button" onClick={() => setClientTab(sec.content.ctaAction || 'search')} className="px-5 py-2.5 rounded-full bg-[#0071E3] text-white text-xs font-bold">
                          {sec.content.ctaText}
                        </button>
                      )}
                    </section>
                  ))}
                </div>
              );
            })()}
          </main>
          {clientTab === 'checkout' ? renderCheckoutFooter() : renderClientFooter()}
        </div>
      )}

      {/* Modals */}
      {renderCartDrawer()}
      {renderLoginModal()}
      <MarketplaceHost currentClient={currentClient} openLogin={() => setLoginModalOpen(true)} showToast={showToast} />
      {renderReturnRequestModal()}
      {renderPrintModal()}
      {renderGmReportPrintModal()}
      {renderBrandManagerModal()}
      {renderBrandImageModal()}
      {renderTemplateManagerModal()}
      {renderAddPartToModelModal()}
      {renderEditPartModal()}
      {renderEditModelModal()}
      {renderAdminApproveRequestModal()}
      {renderAdminCreateClientModal()}
      {renderAdminSecurityModal()}
      {renderProductOrAdDetailModal()}
      {renderPartGroupPricesModal()}
      {renderConfirmDialogModal()}

      {/* Big order-success overlay (owner request): a small toast was easy
          to miss — the customer now gets a full-screen confirmation. */}
      {placedOrderInfo && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-[28px] border border-emerald-500/40 shadow-2xl max-w-md w-full p-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <Check className="w-11 h-11 text-white" strokeWidth={3} />
            </div>
            <div className="text-2xl font-black text-fg">تم إرسال طلبك بنجاح! 🎉</div>
            <p className="text-muted font-bold leading-relaxed">
              طلبك رقم <span className="font-mono font-black text-fg">{placedOrderInfo.id}</span> وصل للإدارة والمخزن،
              وهنواصل معاك بخصوص التأكيد والتوصيل.
            </p>
            {Number(placedOrderInfo.total) > 0 && (
              <div className="inline-block px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-black">
                إجمالي الطلب: {formatMoney(placedOrderInfo.total)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPlacedOrderInfo(null)}
                className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition"
              >
                متابعة طلباتي
              </button>
              <button
                type="button"
                onClick={() => { setPlacedOrderInfo(null); setClientTab('home'); }}
                className="py-3 rounded-2xl bg-surface2 hover:bg-surface text-fg border border-line font-black transition"
              >
                أكمّل تسوق
              </button>
            </div>
          </div>
        </div>
      )}
      {renderFilterSheet()}
      {renderSourcingFormModal()}
      {renderLightbox()}
      {useFlag('spin_to_win').enabled && renderSpinToWinModal()}
      {useFlag('spin_to_win').enabled && renderFloatingSpinTrigger()}
      {appPortal !== 'admin' && getFooterConfig(siteSettings).showFloatingWhatsapp && siteSettings.whatsappUrl && cartSummary.totalQty === 0 && clientTab !== 'checkout' && (
        <a
          href={siteSettings.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 left-5 z-40 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-[0_10px_28px_rgba(16,185,129,0.42)] border border-emerald-400/50 flex items-center gap-2 transition transform hover:scale-105"
          title="تحدث معنا مباشرة على واتساب"
        >
          <Phone className="w-4 h-4" />
          <span className="hidden sm:inline">اسألنا على واتساب</span>
        </a>
      )}
      {appPortal !== 'admin' && getFooterConfig(siteSettings).showScrollTopButton && showScrollTopBtn && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-5 z-40 px-4 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-black text-xs shadow-[0_8px_25px_rgba(37,99,235,0.5)] border border-[#2997FF]/60 flex items-center gap-1.5 transition transform hover:scale-105"
          title="الرجوع لأول الصفحة"
        >
          <span>↑</span>
          <span>أول الصفحة</span>
        </button>
      )}
      {useFlag('live_social_proof').enabled && renderLiveSocialProofToast()}
      {useFlag('exit_intent_popup').enabled && renderExitIntentModal()}
      {useFlag('out_of_stock_notify').enabled && renderCustomerRestockNotifyModal()}
      {renderAdminRestockWhatsappModal()}
      {useFlag('warranty_lookup').enabled && renderWarrantyLookupModal()}
      {useFlag('family_saved_devices').enabled && renderFamilyDevicesModal()}
      {renderConfettiOverlay()}
    </div>
  );
}
