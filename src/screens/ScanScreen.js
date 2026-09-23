import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { recognizeCardFromPhoto } from '../services/cardRecognition';

export default function ScanScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const cameraRef = useRef(null);

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera access is needed to scan cards.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;
    setError(null);
    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      const { guessedName, matches } = await recognizeCardFromPhoto(photo.base64);

      if (!matches || matches.length === 0) {
        setError(`Couldn't find a match for "${guessedName}". Try again with better lighting.`);
        return;
      }

      // If there's one clear match, go straight to confirm. If several
      // similarly-named cards came back, let the user pick on the next screen too.
      navigation.replace('ConfirmMatch', { candidates: matches });
    } catch (e) {
      setError('Something went wrong scanning that card. Try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.frameOverlay}>
          <View style={styles.frame} />
          <Text style={styles.hint}>Line up the card inside the frame</Text>
        </View>
      </CameraView>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.captureButton, { marginBottom: 16 + insets.bottom }]}
        onPress={handleCapture}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.captureButtonText}>Capture</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  frameOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 220,
    height: 310,
    borderWidth: 2,
    borderColor: '#fff',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  hint: { color: '#fff', marginTop: 12, fontSize: 13 },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
  },
  captureButton: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  captureButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionText: { textAlign: 'center', marginBottom: 16 },
  permissionButton: { backgroundColor: '#1a1a1a', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  permissionButtonText: { color: '#fff', fontWeight: '600' },
});
