import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, TextInput } from 'react-native';
import { Modal, TouchableOpacity } from 'react-native';
import {
  useAudioRecorder, useAudioRecorderState,
  AudioModule, RecordingPresets, setAudioModeAsync
} from 'expo-audio';
import Constants from 'expo-constants';
import { useAuth } from '@/contexts/AuthContext';
import transactionService from '@/services/transaction.service';
import huggingfaceService from '@/services/huggingface.service';
import categoryService, { categoryServiceWritable } from '@/services/category.service';
import { on } from '@/utils/events';
import { DEFAULT_NEW_CATEGORY_COLOR } from '@/constants/categoryColors';
import { extractAmount } from '@/utils/amount';
import { mapTextToBucketByKeywords } from '@/utils/category';
import { emit } from '@/utils/events';

const ASSEMBLYAI_API_KEY: string | undefined = Constants.expoConfig?.extra?.ASSEMBLYAI_API_KEY;

export default function VoiceRecorder() {
  type CategoryChip = { id: string; label: string; serverId?: string };
  const capitalize = (s: string) => String(s || '').replace(/\b\w/g, (m) => m.toUpperCase()).trim();
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [transcriptRaw, setTranscriptRaw] = useState<any | null>(null);
  const [assemblyUploadUrl, setAssemblyUploadUrl] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [parsedPaymentType, setParsedPaymentType] = useState<string | null>(null);
  const [parsedDateISO, setParsedDateISO] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('uncategorized');
  const [categoryBuckets, setCategoryBuckets] = useState<CategoryChip[]>(() => [
    { id: 'misc', label: 'Misc' },
  ]);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryChip | null>(null);
  const [editedLabel, setEditedLabel] = useState('');
  const { profile } = useAuth();


  const PREFERRED_LABEL_MAP: Record<string, string[]> = {
    // prefer an explicit 'Food' category over 'Groceries' for things like coffee
    food: ['Food', 'Dining', 'Restaurants'],
    groceries: ['Groceries'],
    rent: ['Rent'],
    utilities: ['Utilities'],
    transportation: ['Transportation'],
    entertainment: ['Entertainment'],
    travel: ['Travel'],
    gift: ['Gifts', 'Gift'],
    misc: ['Misc'],
  };

  const selectCategoryByKey = (key: string | undefined | null) => {
    const raw = String(key || '').trim();
    if (!raw) {
      setCategoryId('misc');
      return;
    }
    // If the key is a canonical bucket like 'food', try preferred labels first
    const lower = raw.toLowerCase();
    const tryPreferred = PREFERRED_LABEL_MAP[lower];
    if (tryPreferred && tryPreferred.length && categoryBuckets && categoryBuckets.length) {
      for (const pref of tryPreferred) {
        const foundPref = categoryBuckets.find((c: any) => String((c.label || '')).toLowerCase() === String(pref).toLowerCase());
        if (foundPref) {
          setCategoryId(foundPref.label);
          return;
        }
      }
    }
    // try to find a matching category in the current buckets
    const found = categoryBuckets.find((c: any) => String(c.id) === raw || String(c.serverId || '') === raw || String((c.label || '').toLowerCase()) === raw.toLowerCase() || String((c.label || '').toLowerCase()).replace(/\s+/g, '_') === raw.toLowerCase());
    if (found) {
      // set the visible input to the human label so the chip highlights
      setCategoryId(found.label);
    } else {
      // fall back to raw key (will be resolved on save/create)
      setCategoryId(raw);
    }
  };

  // Load server categories when profile changes
  useEffect(() => {
    if (!profile?.id) return;
    let mounted = true;
    (async () => {
      try {
        // Try to dedupe server categories first (merge case-insensitive duplicates)
        try { await categoryServiceWritable.dedupeCategories(profile.id); } catch (e) { /* ignore errors */ }

        const res = await categoryService.getCategories(profile.id);
        if (!mounted) return;
        const cats = Array.isArray(res.data) ? res.data : [];
        // Map server categories to chips; include serverId for persistence
  const capitalize = (s: string) => String(s || '').replace(/\b\w/g, (m) => m.toUpperCase()).trim();
  const mapped = cats.map((c: any) => ({ id: c.id || c._id, label: capitalize(c.name || ''), serverId: c.id || c._id }));
        // ensure Misc present
        const withMisc = [{ id: 'misc', label: 'Misc' }, ...mapped];
        // remove duplicate labels (case-insensitive) on the client side just in case
        const seen = new Map<string, any>();
        const deduped = withMisc.filter(c => {
          const key = String(c.label || '').toLowerCase();
          if (seen.has(key)) return false;
          seen.set(key, true);
          return true;
        });
        setCategoryBuckets(deduped);
      } catch (err) {
        console.warn('Failed to load categories', err);
      }
    })();
    return () => { mounted = false; };
  }, [profile?.id]);

  // Refresh local category buckets when other parts of the app emit a categories change
  useEffect(() => {
    if (!profile?.id) return;
    let mounted = true;
    const handler = async () => {
      try {
        const res = await categoryService.getCategories(profile.id);
        if (!mounted) return;
        const cats = Array.isArray(res.data) ? res.data : [];
        const capitalize = (s: string) => String(s || '').replace(/\b\w/g, (m) => m.toUpperCase()).trim();
        const mapped = cats.map((c: any) => ({ id: c.id || c._id, label: capitalize(c.name || ''), serverId: c.id || c._id }));
        const withMisc = [{ id: 'misc', label: 'Misc' }, ...mapped];
        const seen = new Map<string, any>();
        const deduped = withMisc.filter(c => {
          const key = String(c.label || '').toLowerCase();
          if (seen.has(key)) return false;
          seen.set(key, true);
          return true;
        });
        setCategoryBuckets(deduped);
      } catch (err) {
        console.warn('Failed to refresh categories on event', err);
      }
    };

    const unsubscribe = on('categories:changed', handler);
    return () => { mounted = false; unsubscribe(); };
  }, [profile?.id]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);

  useEffect(() => {
    (async () => {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) Alert.alert('Permission to access microphone was denied');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    })();
  }, []);

  const record = async () => {
    try {
      // Clear previous transaction data that was not saved
      setTranscription(null);
      setTranscriptRaw(null);
      setAssemblyUploadUrl(null);
      setVendorName('');
      setAmount('');
      setCategoryId('uncategorized');
      setAudioUri(null);

      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) { console.error('Failed to start recording', e); }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      setAudioUri(uri);
      if (uri) {
        const res = await sendToAssemblyAI(uri);
        if (res) {
          setTranscription(res.text);
          setTranscriptRaw(res.transcript || null);
          setAssemblyUploadUrl(res.upload_url || null);
        } else {
        }
      }
    } catch (e) { console.error('Failed to stop recording', e); }
  };

  useEffect(() => {
    if (!transcription) return;

    (async () => {
      try {
        const cleaned = transcription.replace(/\$\s*[0-9]+(?:\.[0-9]{1,2})?(?:\s*(?:and|,)\s*[0-9]+(?:\.[0-9]{1,2})?\s*cents?)?/gi, '')
                                   .replace(/[0-9]+(?:\.[0-9]{1,2})?\s*(?:dollars|bucks|usd|cents?)/gi, '')
                                   .replace(/\b(?:\d+\s*cents?)\b/gi, '')
                                   .trim();

        let mapped = 'misc';
        try {
          const out = await huggingfaceService.categorizeTransaction(cleaned || transcription);
          mapped = out?.mapped || 'misc';
        } catch (err) {
          // If HF request fails (network/auth), fall back to keyword mapping below
          console.log('HF categorize request failed, will try keyword fallback', err);
          mapped = 'misc';
        }

        // If the model returns misc or the request failed, try keyword fallback
        if (mapped === 'misc') {
          const keyword = mapTextToBucketByKeywords(transcription);
          if (keyword) {
            selectCategoryByKey(keyword);
            return;
          }
        }

        selectCategoryByKey(mapped);
      } catch (err) {
        console.log('HF categorize failed:', err);
      }
    })();
  }, [transcription]);

  // Normalize selection: when category buckets load/refresh, if the current categoryId
  // matches a server id we prefer to display the human label so chips highlight.
  useEffect(() => {
    if (!categoryId || !categoryBuckets || !categoryBuckets.length) return;
    const raw = String(categoryId).trim();
    const found = categoryBuckets.find((c: any) => String(c.id) === raw || String(c.serverId || '') === raw);
    if (found && categoryId !== found.label) {
      setCategoryId(found.label);
    }
  }, [categoryBuckets]);

  // Auto-extract amount from transcription when available
  useEffect(() => {
    if (!transcription) return;
    const amt = extractAmount(transcription);
    if (amt !== null) {
      setAmount(String(Number(amt).toFixed(2)));
    }
  }, [transcription]);

  useEffect(() => {
    if (!transcription) return;
    // capture vendor but avoid grabbing trailing time phrases like "this morning" or filler like "for some food"
    // stop before common delimiters: this/today/yesterday/tomorrow/on/in/at/for or punctuation
    const atMatch = transcription.match(/(?:at|from)\s+([\w&\.\'\- ]+?)(?=(?:\s+(?:this|today|yesterday|tomorrow|on|in|at|for)\b|[.,]|$))/i);
    if (atMatch) {
      let vendor = atMatch[1].trim().replace(/[\.,]$/, '');
  // strip common trailing tokens that slipped through (times and 'for some food' style phrases)
  vendor = vendor.replace(/\b(this|today|yesterday|tomorrow|this morning|this evening|this afternoon)\b/gi, '').trim();
  // remove trailing 'for ...' phrases that describe the purchase rather than the vendor
  vendor = vendor.replace(/\bfor\s+(?:some\s+)?(?:food|coffee|lunch|dinner|breakfast|snack|a meal|takeout|some)\b/gi, '').trim();
  // strip common payment phrase tails like 'using my credit card', 'via credit card', 'using my debit card', 'with my card'
  vendor = vendor.replace(/\b(?:using|via|with|on)\s+(?:my\s+)?(?:credit card|debit card|visa|mastercard|amex|american express|apple pay|google pay|gpay|card|card)\b/gi, '').trim();
  // remove any remaining trailing 'using/via/with ...' fragments (generic)
  vendor = vendor.replace(/\b(?:using|via|with|on)\b.*$/i, '').trim();
  // as a last resort, if ' for ' remains with generic tail, strip it
  vendor = vendor.replace(/\bfor\b.*$/i, '').trim();
      if (!vendorName && vendor) setVendorName(vendor);
    }
  }, [transcription]);

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const extractShortDescription = (text: string, vendor: string | null) => {
    if (!text) return '';
    let s = String(text);
    // remove vendor phrase if present
    if (vendor) {
      try {
        const v = escapeRegex(vendor);
        s = s.replace(new RegExp('(?:at|from)\\s+' + v, 'i'), '');
      } catch (e) {
        // ignore regex errors
      }
    }
    // remove amount expressions
    s = s.replace(/\$\s*[0-9]+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?\s*(?:dollars|bucks|usd)\b/gi, '');
    // remove payment type words
    s = s.replace(/\b(visa|mastercard|master card|amex|american express|credit card|debit card|debit|cash|apple pay|google pay|gpay)\b/gi, '');
    // remove filler verbs
    s = s.replace(/\b(i\s+(spent|bought|paid|purchased)|spent|bought|paid|purchased|for|cost|on|at)\b/gi, '');
    // capture time word like 'this morning'
    const timeMatch = s.match(/\b(this\s+(morning|afternoon|evening|night)|this morning|today|yesterday|tomorrow)\b/i);
    let timeWord = null as string | null;
    if (timeMatch) {
      const w = (timeMatch[2] || timeMatch[1] || '').toString();
      timeWord = w.replace(/this\s+/i, '').trim().toLowerCase();
      s = s.replace(timeMatch[0], '');
    }
    // clean up
    s = s.replace(/\b(a|an|the|my|the)\b/gi, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    // pick a short noun: last word (prefer 'coffee' from 'cup of coffee')
    const parts = s.split(' ').filter(Boolean);
    let noun = parts.length ? parts[parts.length - 1] : '';
    if (/^cup$/i.test(noun) && parts.length >= 2) noun = parts[parts.length - 2];
    let desc = '';
    if (timeWord) desc = `${timeWord} ${noun}`.trim();
    else desc = noun || s.slice(0, 30);
    desc = capitalize(desc || '').trim();
    if (!desc) desc = capitalize(text.slice(0, Math.min(30, text.length))).trim();
    return desc;
  };

  // Parse payment type and date from transcription
  const parsePaymentType = (text: string): string | null => {
    if (!text) return null;
    const t = text.toLowerCase();
    if (/\b(visa)\b/.test(t)) return 'Visa';
    if (/\b(mastercard|master card|master-card)\b/.test(t)) return 'Mastercard';
    if (/\b(amex|american express)\b/.test(t)) return 'Amex';
    if (/\b(credit card|credit)\b/.test(t)) return 'Credit Card';
    if (/\b(debit card|debit)\b/.test(t)) return 'Debit Card';
    if (/\b(cash)\b/.test(t)) return 'Cash';
    if (/\b(apple pay|applepay)\b/.test(t)) return 'Apple Pay';
    if (/\b(google pay|googlepay|gpay)\b/.test(t)) return 'Google Pay';
    return null;
  };

  const parseDateFromText = (text: string): string | null => {
    if (!text) return null;
    const t = text.toLowerCase();
    const now = new Date();
    // simple relative words
    if (/\byesterday\b/.test(t)) {
      return new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    }
    if (/\btoday\b/.test(t)) return now.toISOString();
    if (/\btomorrow\b/.test(t)) return new Date(now.getTime() + 24 * 3600 * 1000).toISOString();

    // ISO date like 2025-10-06
    const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (iso) {
      const d = new Date(iso[1]);
      if (!isNaN(d.getTime())) return d.toISOString();
    }

    // common mm/dd/yyyy or m/d/yy
    const md = text.match(/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/);
    if (md) {
      const parsed = new Date(md[1]);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }

    // 'on Oct 6' or 'on October 6, 2025'
    const monthPattern = /\b(?:on\s*)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s.,]*(\d{1,2})(?:st|nd|rd|th)?(?:[\s,]*(\d{4}))?/i;
    const m = text.match(monthPattern);
    if (m) {
      const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 } as Record<string, number>;
      const monKey = m[1].slice(0,3).toLowerCase();
      const monthIdx = months[monKey];
      const day = parseInt(m[2], 10);
      const year = m[3] ? parseInt(m[3], 10) : now.getFullYear();
      const d = new Date(year, monthIdx, day);
      if (!isNaN(d.getTime())) return d.toISOString();
    }

    return null;
  };

  useEffect(() => {
    if (!transcription) {
      setParsedPaymentType(null);
      setParsedDateISO(null);
      return;
    }
    try {
      const pt = parsePaymentType(transcription || '');
      const dt = parseDateFromText(transcription || '');
      setParsedPaymentType(pt);
      setParsedDateISO(dt);
    } catch (err) {
      console.warn('Failed parsing payment/date from transcription', err);
      setParsedPaymentType(null);
      setParsedDateISO(null);
    }
  }, [transcription]);

  const saveTransaction = async () => {
    if (!transcription) {
      Alert.alert('No transcription', 'There is no transcription to save.');
      return;
    }

    if (!profile?.id) {
      Alert.alert('Not signed in', 'Cannot save transaction without a signed-in profile.');
      return;
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a positive amount.');
      return;
    }

    // Resolve category: if categoryId matches an existing server category by label or id, use that server id.
    // Otherwise create a new category on the server (if signed in) and use its id. Fallback to 'misc'.
    const resolveCategoryForPayload = async () => {
      if (!categoryId) return 'misc';
      const raw = String(categoryId).trim();
      if (!raw) return 'misc';

      let found = categoryBuckets.find((c: any) => String(c.id) === raw || String(c.serverId || '') === raw);
      if (found) return found.serverId || found.id || raw;

      found = categoryBuckets.find((c: any) => String(c.label || '').toLowerCase() === raw.toLowerCase());
      if (found) return found.serverId || found.id;

      if (profile?.id) {
        try {
          try {
            const res = await categoryService.getCategories(profile.id);
            const cats = Array.isArray(res.data) ? res.data : [];
            const match = cats.find((c: any) => String(c.name || '').toLowerCase() === raw.toLowerCase() || String(c.name || '').toLowerCase().replace(/\s+/g, '_') === raw.toLowerCase().replace(/\s+/g, '_'));
            if (match) return match.id || match._id || raw;
          } catch (e) {
            // ignore and continue to create
          }

          const createRes = await categoryServiceWritable.createCategory(profile.id, { name: capitalize(raw), type: 'expense', userId: profile.id, color: DEFAULT_NEW_CATEGORY_COLOR });
          const created = createRes.data;
          try { emit('categories:changed'); } catch (e) { /* ignore */ }
          return created.id || created._id || raw;
        } catch (err: any) {
          if (err?.response?.status === 409) {
            try {
              const res = await categoryService.getCategories(profile.id);
              const cats = Array.isArray(res.data) ? res.data : [];
              const match = cats.find((c: any) => String(c.name || '').toLowerCase() === raw.toLowerCase());
              if (match) return match.id || match._id || raw;
            } catch (e) {
              // fallthrough
            }
          }
          console.warn('Failed to create/find category', err);
        }
      }

      // Last resort: return 'misc' so it groups with uncategorized
      return 'misc';
    };

    const resolvedCategoryId = await resolveCategoryForPayload();

    const payload = {
      userId: profile.id,
      vendorName: vendorName || 'Unknown',
      // use the full transcription as the description
      description: transcription,
      // prefer parsed date from transcription when available
      dateTime: parsedDateISO || new Date().toISOString(),
      amount: parsedAmount,
      // prefer parsed payment type when available; default to Credit Card when not present
      paymentType: parsedPaymentType || 'Credit Card',
      categoryId: resolvedCategoryId || 'misc',
      // Attach assembly AI info so backend can store the original audio and transcript
      assembly: {
        uploadUrl: assemblyUploadUrl,
        transcript: transcriptRaw,
      },
    };

    try {
      const res = await transactionService.createTransaction(profile.id, payload);
      if (res.status === 201) {
        Alert.alert('Saved', 'Transaction saved successfully');
        setVendorName('');
        setAmount('');
        setCategoryId('uncategorized');
        setTranscription(null);
        setAudioUri(null);
        try { emit('transactions:changed'); } catch (e) { console.warn('emit failed', e); }
      } else {
        Alert.alert('Unexpected response', `Status ${res.status}`);
      }
    } catch (err: any) {
      console.error('Failed to save transaction', err);
      Alert.alert('Save failed', err?.response?.data?.error || err.message || String(err));
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={state.isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={state.isRecording ? stopRecording : record}
      />
      {audioUri && <Text style={styles.uri}>Recorded Audio: {audioUri}</Text>}
      {state.isRecording && <Text>Recording… {Math.round(state.durationMillis / 1000)}s</Text>}
      {transcription && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>You said:</Text>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>{transcription}</Text>

          {/* Small confirmation form: vendor, amount, category */}
          <Text style={{ fontWeight: '600', marginTop: 6 }}>Vendor name</Text>
          <TextInput
            value={vendorName}
            onChangeText={setVendorName}
            placeholder="Vendor (e.g. Starbucks)"
            style={styles.input}
          />

          <Text style={{ fontWeight: '600', marginTop: 6 }}>Amount</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount (e.g. 5.99)"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={{ fontWeight: '600', marginTop: 6 }}>Category</Text>
          <View style={styles.chipsRow}>
            {categoryBuckets.map(cat => (
              <TouchableOpacity
                key={cat.id}
                // set the visible input to the category label so users see the name,
                // resolveCategoryForPayload will match the label back to a serverId when saving
                onPress={() => setCategoryId(cat.label)}
                onLongPress={() => { setActiveCategory(cat); setEditedLabel(cat.label); setCategoryModalVisible(true); }}
                style={[]}
              >
                <Text
                  style={[
                    styles.chip,
                    // consider selected if the current input equals the chip id, serverId, or label
                    (categoryId === cat.id || categoryId === cat.serverId || categoryId === cat.label) ? styles.chipSelected : null,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Modal to edit/delete a category (long-press a chip) */}
          <Modal visible={categoryModalVisible} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
              <View style={{ backgroundColor: '#051218', borderRadius: 12, padding: 16 }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Edit Category</Text>
                <TextInput value={editedLabel} onChangeText={setEditedLabel} style={{ backgroundColor: '#0b1220', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity onPress={() => { setCategoryModalVisible(false); setActiveCategory(null); }} style={{ padding: 10 }}>
                    <Text style={{ color: '#9CA3AF' }}>Cancel</Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={async () => {
                      if (!activeCategory) return;
                      try {
                        if (activeCategory.serverId && profile?.id) {
                          // delete on server
                          await categoryServiceWritable.deleteCategory(profile.id, activeCategory.serverId);
                          // notify other components
                          try { emit('categories:changed'); } catch (e) { /* ignore */ }
                        }
                        // remove locally
                        setCategoryBuckets((prev) => prev.filter(c => c.id !== activeCategory.id));
                        // if the current selected/input matches the deleted category, clear it to misc
                        if (categoryId === activeCategory.id || categoryId === activeCategory.serverId || categoryId === activeCategory.label) setCategoryId('misc');
                      } catch (err) {
                        console.error('Failed to delete category', err);
                        Alert.alert('Delete failed', 'Could not delete category.');
                      } finally {
                        setCategoryModalVisible(false);
                        setActiveCategory(null);
                      }
                    }} style={{ padding: 10, marginRight: 8 }}>
                      <Text style={{ color: '#EF4444' }}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => {
                      if (!activeCategory) return;
                      try {
                        if (activeCategory.serverId && profile?.id) {
                          await categoryServiceWritable.updateCategory(profile.id, activeCategory.serverId, { name: editedLabel || activeCategory.label });
                          try { emit('categories:changed'); } catch (e) { /* ignore */ }
                        }
                        // update locally
                        setCategoryBuckets((prev) => prev.map(c => c.id === activeCategory.id ? { ...c, label: editedLabel || c.label } : c));
                      } catch (err) {
                        console.error('Failed to update category', err);
                        Alert.alert('Save failed', 'Could not update category.');
                      } finally {
                        setCategoryModalVisible(false);
                        setActiveCategory(null);
                      }
                    }} style={{ padding: 10, backgroundColor: '#0ea5a7', borderRadius: 8 }}>
                      <Text style={{ color: '#fff' }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>

          <Text style={{ fontWeight: '600', marginTop: 8 }}>Or custom category</Text>
          <TextInput
            value={categoryId}
            onChangeText={setCategoryId}
            placeholder="e.g. Groceries"
            style={styles.input}
          />

          <View style={{ marginTop: 10 }}>
            <Button title="Save Transaction" onPress={saveTransaction} />
          </View>
        </View>
      )}
    </View>
  );
}

const sendToAssemblyAI = async (uri: string) => {
  try {
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('Missing ASSEMBLYAI_API_KEY in app.json -> expo.extra.* (restart Metro after editing).');
    }

    const safeJson = async (res: Response) => {
      const ct = res.headers.get('content-type') || '';
      const body = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}\n${body.slice(0,300)}`);
      if (!ct.includes('application/json')) throw new Error(`Expected JSON, got "${ct}". Body: ${body.slice(0,300)}`);
      return JSON.parse(body);
    };

    const file = await fetch(uri);
    const blob = await file.blob();

    // Upload
    const upRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { Authorization: ASSEMBLYAI_API_KEY },
      body: blob,
    });
    const up = await safeJson(upRes);
    const audioUrl = up.upload_url;
    if (!audioUrl) throw new Error(`No upload_url in response: ${JSON.stringify(up)}`);

    // Create transcript
    const trRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: { Authorization: ASSEMBLYAI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_url: audioUrl }),
    });
    const tr = await safeJson(trRes);
    const id = tr.id;
    if (!id) throw new Error(`No transcript id: ${JSON.stringify(tr)}`);

    // Poll
    for (;;) {
      await new Promise(r => setTimeout(r, 3000));
      const stRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: { Authorization: ASSEMBLYAI_API_KEY },
      });
      const st = await safeJson(stRes);
      if (st.status === 'completed') {
        return { text: st.text, upload_url: audioUrl, transcript: st };
      }
      if (st.status === 'failed') throw new Error(`Transcription failed: ${JSON.stringify(st)}`);
    }
  } catch (err) {
    console.error('Error sending to AssemblyAI:', err);
    Alert.alert('AssemblyAI Error', String(err));
    return undefined;
  }
};

const styles = StyleSheet.create({
  container: { gap: 6, marginTop: 6 },
  uri: { color: '#666', fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#222',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    color: '#072f15',
  },
});
