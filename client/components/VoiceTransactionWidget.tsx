import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, TextInput } from 'react-native';
import {
  useAudioRecorder, useAudioRecorderState,
  AudioModule, RecordingPresets, setAudioModeAsync
} from 'expo-audio';
import Constants from 'expo-constants';
import { useAuth } from '@/contexts/AuthContext';
import transactionService from '@/services/transaction.service';
import huggingfaceService from '@/services/huggingface.service';
import { extractAmount } from '@/utils/amount';
import { mapTextToBucketByKeywords } from '@/utils/category';
import { emit } from '@/utils/events';

const ASSEMBLYAI_API_KEY: string | undefined = Constants.expoConfig?.extra?.ASSEMBLYAI_API_KEY;

export default function VoiceRecorder() {
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [transcriptRaw, setTranscriptRaw] = useState<any | null>(null);
  const [assemblyUploadUrl, setAssemblyUploadUrl] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('uncategorized');
  const CATEGORY_BUCKETS = [
    { id: 'food', label: 'Food' },
    { id: 'rent', label: 'Rent' },
    { id: 'utilities', label: 'Utilities' },
    { id: 'transportation', label: 'Transportation' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'travel', label: 'Travel' },
    { id: 'gift', label: 'Gift' },
    { id: 'misc', label: 'Misc' },
  ];
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const { profile } = useAuth();

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

        const { mapped } = await huggingfaceService.categorizeTransaction(cleaned || transcription);

        // If the model returns misc try to use a fallback 
        if (mapped === 'misc') {
          const keyword = mapTextToBucketByKeywords(transcription);
          if (keyword) {
            setCategoryId(keyword);
            return;
          }
        }

        setCategoryId(mapped);
      } catch (err) {
        console.log('HF categorize failed:', err);
      }
    })();
  }, [transcription]);

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
    const atMatch = transcription.match(/(?:at|from)\s+([A-Za-z0-9&\.\'\-\s]{2,40})/i);
    if (atMatch) {
      const vendor = atMatch[1].trim().replace(/[\.,]$/, '');
      if (!vendorName) setVendorName(vendor);
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

    const payload = {
      userId: profile.id,
      vendorName: vendorName || 'Unknown',
      description: transcription,
      dateTime: new Date().toISOString(),
      amount: parsedAmount,
      paymentType: 'Unknown',
      categoryId: categoryId || 'misc',
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
            {CATEGORY_BUCKETS.map(cat => (
              <Text
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={[
                  styles.chip,
                  categoryId === cat.id ? styles.chipSelected : null,
                ]}
              >
                {cat.label}
              </Text>
            ))}
          </View>

          <Text style={{ fontWeight: '600', marginTop: 8 }}>Or custom category</Text>
          <TextInput
            value={categoryId}
            onChangeText={setCategoryId}
            placeholder="Custom category id"
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
