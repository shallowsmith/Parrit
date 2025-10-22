import React, { useState, useEffect } from 'react';
import { Button, View, Text, Alert, StyleSheet } from 'react-native';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState } from 'expo-audio';
import { ASSEMBLYAI_API_KEY } from '@env';

export default function VoiceRecorder() {
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Prompts Microphone permission
  useEffect(() => {
    (async () => {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission to access microphone was denied');
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    })();
  }, []);

  // Recording Audio for API to take
  const record = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error("Failed to start recording", error);
    }
  };

  // Stops the recording
  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setAudioUri(uri);
      if (uri) await sendToAssemblyAI(uri);
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  // Upload audio and get transcription from AssemblyAI
  const sendToAssemblyAI = async (uri: string) => {
    try {
      // Fetch file as blob
      const file = await fetch(uri);
      const fileBlob = await file.blob();

      // Upload to AssemblyAI
      const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: { authorization: ASSEMBLYAI_API_KEY },
        body: fileBlob,
      });
      const uploadData = await uploadRes.json();
      const audioUrl = uploadData.upload_url;

      // Request transcription
      const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: { authorization: ASSEMBLYAI_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ audio_url: audioUrl }),
      });
      const transcriptData = await transcriptRes.json();
      const transcriptId = transcriptData.id;

      // Poll for transcription result
      let completed = false;
      while (!completed) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: { authorization: ASSEMBLYAI_API_KEY },
        });
        const statusData = await statusRes.json();
        if (statusData.status === 'completed') {
          setTranscription(statusData.text);
          completed = true;
        } else if (statusData.status === 'failed') {
          console.error('Transcription failed');
          completed = true;
        }
      }
    } catch (err) {
      console.error('Error sending to AssemblyAI:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={recorderState.isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={recorderState.isRecording ? stopRecording : record}
      />
      {/* DELETE LINE BELOW --> Only used for testing/maybe for later purposes */}
      {audioUri && <Text>Recorded Audio: {audioUri}</Text>}
      {recorderState.isRecording && <Text>Recording... {Math.round(recorderState.durationMillis / 1000)}s</Text>}
      {transcription && (
        <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 'bold' }}>You said:</Text>
            <Text style={{ fontSize: 16 }}>{transcription}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#ecf0f1', padding: 10 },
});
