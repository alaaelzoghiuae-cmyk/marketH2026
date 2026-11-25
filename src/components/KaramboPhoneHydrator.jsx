import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchGsmarenaDevice } from '../services/gsmarenaClient.js';
import { fetchLiveEgyptPrice } from '../services/karamboLiveClient.js';

/**
 * Non-blocking async hydrator for Phone Detail page (v23):
 * - Opens Phone Detail IMMEDIATELY (<50ms)
 * - NEVER overwrites working grid images with empty/broken arrays!
 * - Streams full specs + live Egypt price in parallel in ~1-2 seconds.
 */
export default function KaramboPhoneHydrator({ phone, onHydrated, genEditorial }) {
  useEffect(() => {
    if (!phone || (!phone.loadingSpecs && !phone.loadingPrice)) return;
    let alive = true;

    (async () => {
      const [specRes, priceRes] = await Promise.all([
        phone.loadingSpecs ? fetchGsmarenaDevice(phone.slug || phone.gsmId) : Promise.resolve(null),
        phone.loadingPrice ? fetchLiveEgyptPrice(phone.name) : Promise.resolve(null)
      ]);
      if (!alive) return;

      const prevImages = Array.isArray(phone.images) ? phone.images.filter(Boolean) : [];
      const fetchedImages = (specRes && specRes.ok && specRes.device && Array.isArray(specRes.device.images))
        ? specRes.device.images.filter(Boolean)
        : [];
      // Preserve working grid image FIRST so the photo NEVER disappears on click!
      const mergedImages = [...new Set([...prevImages, ...fetchedImages])];

      const base = (specRes && specRes.ok && specRes.device)
        ? { ...phone, ...specRes.device, images: mergedImages }
        : { ...phone, images: mergedImages };

      const egPrice = (priceRes && priceRes.found && priceRes.price > 0) ? priceRes.price : (base.price || 0);
      base.price = egPrice;
      base.notInEgypt = !egPrice;
      base.loadingSpecs = false;
      base.loadingPrice = false;
      if (genEditorial && (!base.pros || !base.pros.length)) {
        const ed = genEditorial(base);
        base.pros = ed.pros;
        base.cons = ed.cons;
        base.verdict = ed.verdict;
      }
      onHydrated && onHydrated(base);
    })();

    return () => { alive = false; };
  }, [phone && phone.id, phone && phone.loadingSpecs, phone && phone.loadingPrice]);

  if (!phone || (!phone.loadingSpecs && !phone.loadingPrice)) return null;
  return (
    <div className="rounded-2xl bg-[#1E4E8C]/10 border border-[#1E4E8C]/30 px-4 py-2.5 flex items-center gap-2 text-xs font-black text-[#1E4E8C] dark:text-[#7FB0E8]">
      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
      <span>جاري تحميل المواصفات الكاملة وفحص السعر الحالي في مصر...</span>
    </div>
  );
}
