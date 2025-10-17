import React, { useState, useEffect } from 'react';
import { Button, View, Text, Alert, StyleSheet } from 'react-native';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState } from 'expo-audio';

export default function VoiceRecorder() {
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    (async () => {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission to access microphone was denied');
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    })();
  }, []);

  const record = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error("Failed to start recording", error);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setAudioUri(uri);
      console.log('Recording saved to:', uri);
      uploadAudio(uri);
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  const uploadAudio = async (uri: string) => {
    const formData = new FormData();
    formData.append('audio', {
      uri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    });

    try {
      // Replace 'http://backend-url/api/voice/transcribe' with actual backend URL
      const response = await fetch('http://backend-url/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log('Transcription result:', data);
    } catch (err) {
      console.error('Failed to upload audio', err);
    }
  };

  return (
    <View style={styles.container}>
      <Button 
        title={recorderState.isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={recorderState.isRecording ? stopRecording : record}
      />
      {audioUri && <Text>Recorded Audio: {audioUri}</Text>}
      {recorderState.isRecording && <Text>Recording... {Math.round(recorderState.durationMillis / 1000)}s</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});
