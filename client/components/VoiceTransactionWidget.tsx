import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import {
  useAudioRecorder, useAudioRecorderState,
  AudioModule, RecordingPresets, setAudioModeAsync
} from 'expo-audio';
import Constants from 'expo-constants';

const ASSEMBLYAI_API_KEY: string | undefined = Constants.expoConfig?.extra?.ASSEMBLYAI_API_KEY;

export default function VoiceRecorder() {
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
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
    try { await recorder.prepareToRecordAsync(); recorder.record(); }
    catch (e) { console.error('Failed to start recording', e); }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      setAudioUri(uri);
      if (uri) await sendToAssemblyAI(uri, setTranscription);
    } catch (e) { console.error('Failed to stop recording', e); }
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
          <Text style={{ fontSize: 16 }}>{transcription}</Text>
        </View>
      )}
    </View>
  );
}

const sendToAssemblyAI = async (
  uri: string,
  onTranscribed: (text: string) => void
) => {
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
      headers: { Authorization: ASSEMBLYAI_API_KEY },  // uses Constants-based key
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
      if (st.status === 'completed') { onTranscribed(st.text); break; }
      if (st.status === 'failed') throw new Error(`Transcription failed: ${JSON.stringify(st)}`);
    }
  } catch (err) {
    console.error('Error sending to AssemblyAI:', err);
    Alert.alert('AssemblyAI Error', String(err));
  }
};

const styles = StyleSheet.create({
  container: { gap: 6, marginTop: 6 },
  uri: { color: '#666', fontSize: 12 },
});
