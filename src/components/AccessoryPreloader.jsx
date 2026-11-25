import { useEffect, useRef } from 'react';
import { modelsForPhone } from '../lib/accessoryMatch.js';

// Loads (server-side filtered) parts that belong to the phone's model so the accessories list is real,
// instead of depending on whichever 60 parts happened to be in memory.
export default function AccessoryPreloader({ phone, models, fetchSlice }) {
  const done = useRef(new Set());
  useEffect(() => {
    if (!phone || !fetchSlice) return;
    modelsForPhone(models, phone).slice(0, 3).forEach((m) => {
      const k = String(m.id);
      if (done.current.has(k)) return;
      done.current.add(k);
      Promise.resolve(fetchSlice({ modelId: k, limit: 60 })).catch(() => {});
    });
  }, [phone && (phone.id || phone.name), models && models.length]);
  return null;
}
