/* =====================================================================
   Ads display system — typed configuration + resolvers.
   Everything the storefront / dashboard needs to know about HOW ads are
   presented lives here, so the two display systems keep fully independent
   settings:
     siteSettings.adsDisplayMode  : 'apple_cards' (default) | 'classic_hero'
     siteSettings.adsCarousel     : Apple Cards Carousel settings
     siteSettings.adsClassic      : Classic Hero Banner settings
     siteSettings.adsHistory      : last published snapshots (version history)
   Per-ad card fields (stored in the ad's `data` JSON, never touching the
   classic banner fields): cardTemplate, cardCategory, cardImagePos,
   cardImageFit, cardSize, cardButtonStyle, cardLinkUrl, cardImageMobile,
   cardImageBlend, cardBg, cardBgDark, cardTextColor, cardBtnColor.
   ===================================================================== */

export const ADS_MODE_APPLE = 'apple_cards';
export const ADS_MODE_CLASSIC = 'classic_hero';

export const DEFAULT_ADS_CAROUSEL = {
  desktop: 3, // container >= 1200px
  laptop: 3, // 900 – 1199px
  tablet: 2, // 600 – 899px
  mobile: 1, // < 600px
  gap: 16, // px
  speedMs: 550, // slide transition duration
  autoplay: false,
  intervalSec: 6,
  arrows: true,
  dots: true,
  peek: true, // show a part of the next card
};

export const DEFAULT_ADS_CLASSIC = {
  height: 'standard', // compact | standard | tall
  autoplay: false,
  intervalSec: 6,
  controls: true,
  mosaic: true, // the "promo_split" tiles under the hero
};

const num = (v, min, max, fb) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fb;
  return Math.min(max, Math.max(min, n));
};

export const resolveAdsMode = (settings) =>
  settings && settings.adsDisplayMode === ADS_MODE_CLASSIC ? ADS_MODE_CLASSIC : ADS_MODE_APPLE;

export const resolveCarouselCfg = (settings) => {
  const s = (settings && settings.adsCarousel) || {};
  const d = DEFAULT_ADS_CAROUSEL;
  return {
    desktop: Math.round(num(s.desktop, 1, 6, d.desktop)),
    laptop: Math.round(num(s.laptop, 1, 6, d.laptop)),
    tablet: Math.round(num(s.tablet, 1, 4, d.tablet)),
    mobile: Math.round(num(s.mobile, 1, 2, d.mobile)),
    gap: Math.round(num(s.gap, 4, 40, d.gap)),
    speedMs: Math.round(num(s.speedMs, 150, 1500, d.speedMs)),
    autoplay: s.autoplay === true,
    intervalSec: num(s.intervalSec, 2, 30, d.intervalSec),
    arrows: s.arrows !== false,
    dots: s.dots !== false,
    peek: s.peek !== false,
  };
};

export const resolveClassicCfg = (settings) => {
  const s = (settings && settings.adsClassic) || {};
  const d = DEFAULT_ADS_CLASSIC;
  return {
    height: ['compact', 'standard', 'tall'].includes(s.height) ? s.height : d.height,
    autoplay: s.autoplay === true,
    intervalSec: num(s.intervalSec, 2, 30, d.intervalSec),
    controls: s.controls !== false,
    mosaic: s.mosaic !== false,
  };
};

/** Only allow http(s), site-relative and hash-route links coming from the dashboard. */
export const safeAdLink = (url) => {
  const u = String(url || '').trim();
  if (!u) return '';
  if (/^https?:\/\/[^\s]+$/i.test(u)) return u;
  if (/^\/(?!\/)[^\s]*$/.test(u)) return u;
  if (/^#\/[^\s]*$/.test(u)) return u;
  return '';
};

const CARD_TEMPLATES = ['auto', 'light', 'dark', 'theme', 'custom'];
const CARD_IMAGE_POS = ['bottom', 'top', 'side', 'full'];
const CARD_SIZES = ['sm', 'md', 'lg'];
const CARD_BTN = ['plus', 'pill', 'link', 'none'];

const isFullBleed = (ad) => {
  const ly = ad.layout || '';
  return (ly === 'full_clean' || ly === 'full') && !!ad.image && ad.imageFit !== 'contain';
};

/** Resolve every per-ad card option with safe defaults so old ads convert automatically. */
export const resolveCardOptions = (ad) => {
  const a = ad || {};
  const pos = CARD_IMAGE_POS.includes(a.cardImagePos) ? a.cardImagePos : (isFullBleed(a) ? 'full' : 'bottom');
  return {
    template: CARD_TEMPLATES.includes(a.cardTemplate) ? a.cardTemplate : 'auto',
    category: String(a.cardCategory || '').trim() || String(a.badge || '').trim(),
    imagePos: pos,
    imageFit: ['contain', 'cover'].includes(a.cardImageFit) ? a.cardImageFit : (pos === 'full' ? 'cover' : 'contain'),
    size: CARD_SIZES.includes(a.cardSize) ? a.cardSize : 'md',
    buttonStyle: a.showButton === false ? 'none' : (CARD_BTN.includes(a.cardButtonStyle) ? a.cardButtonStyle : 'plus'),
    link: safeAdLink(a.cardLinkUrl),
    imageMobile: String(a.cardImageMobile || '').trim(),
    blend: a.cardImageBlend !== false,
  };
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
export const cleanHex = (v) => (HEX.test(String(v || '').trim()) ? String(v).trim() : '');

/** Readable ink (dark / light) for any hex background. */
export const inkFor = (hex) => {
  let h = cleanHex(hex).replace('#', '');
  if (!h) return '#ffffff';
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#1d1d1f' : '#ffffff';
};

export const countdownDays = (ad) => {
  if (!ad || !ad.endDate) return null;
  const end = new Date(`${ad.endDate}T23:59:59`);
  const d = Math.ceil((end.getTime() - Date.now()) / 86400000);
  return Number.isFinite(d) && d >= 0 && d <= 30 ? d : null;
};

/** Snapshot used by the version history of the ads display settings. */
export const snapshotAdsSettings = (settings) => ({
  ts: Date.now(),
  mode: resolveAdsMode(settings),
  carousel: resolveCarouselCfg(settings),
  classic: resolveClassicCfg(settings),
});
