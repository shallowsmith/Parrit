import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CATEGORY_COLORS, FALLBACK_COLORS, normalizeCategoryKey } from '@/constants/categoryColors';

export default function TransactionsList({ transactions, onSelectTransaction, categories = [] }: { transactions: any[]; onSelectTransaction?: (tx: any) => void; categories?: any[] }) {
  const [showPreviousDays, setShowPreviousDays] = useState(false);
  const capitalize = (s: string) => String(s || '').replace(/\b\w/g, (m) => m.toUpperCase()).trim();

  const sorted = useMemo(() => transactions.slice().sort((a, b) => {
    const da = new Date(a.dateTime || a.createdAt || 0).getTime();
    const db = new Date(b.dateTime || b.createdAt || 0).getTime();
    return db - da;
  }), [transactions]);

  const groups: Record<string, any[]> = {};
  sorted.forEach((tx) => {
    const dt = new Date(tx.dateTime || tx.createdAt || Date.now());
    const key = dt.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    groups[key] = groups[key] || [];
    groups[key].push(tx);
  });

  // Build an ordered list of keys (newest first)
  const dateKeys = Object.keys(groups).sort((a, b) => {
    const ta = new Date(groups[a][0].dateTime || groups[a][0].createdAt || 0).getTime();
    const tb = new Date(groups[b][0].dateTime || groups[b][0].createdAt || 0).getTime();
    return tb - ta;
  });

  const todayKey = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hasToday = !!groups[todayKey];
  const visibleKeys = useMemo(() => {
    if (showPreviousDays) return dateKeys;
    if (hasToday) return [todayKey];
    // fallback: show the most recent day if today has no transactions
    return dateKeys.length ? [dateKeys[0]] : [];
  }, [showPreviousDays, dateKeys, hasToday, todayKey]);

  const otherDaysCount = Math.max(0, dateKeys.length - visibleKeys.length);

  return (
    <View style={{ width: '100%', marginTop: 8 }}>
      {dateKeys.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
          <TouchableOpacity onPress={() => setShowPreviousDays((s) => !s)} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
            <Text style={{ color: '#60A5FA', fontSize: 13 }}>{showPreviousDays ? 'Hide previous days' : `Show previous days (${otherDaysCount})`}</Text>
          </TouchableOpacity>
        </View>
      )}
      {visibleKeys.map((dateKey) => (
        <View key={dateKey} style={{ width: '100%', marginTop: 12 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8 }}>{dateKey}</Text>
          {groups[dateKey].map((tx: any) => {
            // Derive color from category mapping: prefer server-provided category color, then name-based mapping, then fallback
            // Resolve a consistent color for this transaction's category
            let color: string | undefined;
            const keyFromTx = normalizeCategoryKey(String(tx.categoryId || ''));
            if (keyFromTx && CATEGORY_COLORS[keyFromTx]) color = CATEGORY_COLORS[keyFromTx];
            if (!color && categories && categories.length) {
              const found = categories.find((c: any) => String(c.id) === String(tx.categoryId) || String(c._id) === String(tx.categoryId) || normalizeCategoryKey(c.name) === keyFromTx);
              if (found && found.color) color = found.color;
              if (!color && found) {
                const norm = normalizeCategoryKey(found.name);
                color = CATEGORY_COLORS[norm];
              }
            }
            if (!color) {
              // fallback by normalized tx vendor/id to pick a stable color from the palette
              const idx = Math.abs(String(tx.id || tx._id || tx.vendorName || '').length) % FALLBACK_COLORS.length;
              color = FALLBACK_COLORS[idx];
            }
            // If vendor is missing, show the category name as the vendor (more meaningful than 'Unknown')
            const foundCatForVendor = categories.find((c: any) => String(c.id) === String(tx.categoryId) || String(c._id) === String(tx.categoryId));
            const vendor = tx.vendorName || (foundCatForVendor ? capitalize(foundCatForVendor.name || '') : (tx.description || 'Unknown'));
            const amount = Number(tx.amount || 0).toFixed(2);
            // Prefer a human-readable, capitalized category name for subtitle when available
            let subtitle = tx.description || '';
            if (!subtitle || subtitle === '') {
              const foundCat = categories.find((c: any) => String(c.id) === String(tx.categoryId) || String(c._id) === String(tx.categoryId));
              if (foundCat) subtitle = capitalize(foundCat.name || '');
              else subtitle = String(tx.categoryId || '');
            }
            const time = new Date(tx.dateTime || tx.createdAt || 0).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            return (
              <TouchableOpacity key={tx.id || tx._id || Math.random()} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0b1220', borderRadius: 12, padding: 12, marginBottom: 8 }} onPress={() => onSelectTransaction?.(tx)}>
                <View style={{ width: 6, height: '100%', borderRadius: 8, marginRight: 12, backgroundColor: color }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{vendor}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>{subtitle}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>${amount}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>{time}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
