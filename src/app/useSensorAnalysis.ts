'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

// ===== EXPRESSION TO SIGNAL MAPPING =====
// face-api.js expressions: neutral, happy, sad, angry, fearful, disgusted, surprised
// Our face signals: relaxed, tense, sad, blank, worried, engaged

const expressionToFaceSignal: Record<string, string> = {
  neutral: 'relaxed',
  happy: 'engaged',
  sad: 'sad',
  angry: 'tense',
  fearful: 'worried',
  disgusted: 'tense',
  surprised: 'worried',
};

// Voice analysis categories
type VoiceTone = 'calm' | 'strained' | 'flat' | 'tired' | 'tense' | 'energetic';

interface SensorState {
  faceSignal: string;
  voiceTone: VoiceTone;
  cameraActive: boolean;
  micActive: boolean;
  cameraError: string | null;
  micError: string | null;
  faceConfidence: number;
  voiceEnergy: number;
  dominantExpression: string;
}

interface UseSensorAnalysisReturn extends SensorState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  startMic: () => Promise<void>;
  stopMic: () => void;
}

export function useSensorAnalysis(): UseSensorAnalysisReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const faceApiLoaded = useRef(false);
  const faceApiLoading = useRef(false);
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<SensorState>({
    faceSignal: 'relaxed',
    voiceTone: 'calm',
    cameraActive: false,
    micActive: false,
    cameraError: null,
    micError: null,
    faceConfidence: 0,
    voiceEnergy: 0,
    dominantExpression: 'neutral',
  });

  // ===== LOAD FACE-API.JS DYNAMICALLY =====
  const loadFaceApi = useCallback(async () => {
    if (faceApiLoaded.current || faceApiLoading.current) return faceApiLoaded.current;
    faceApiLoading.current = true;

    try {
      const faceapi = await import('face-api.js');

      if (!faceApiLoaded.current) {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        faceApiLoaded.current = true;
        console.log('[MindMirror] face-api.js models loaded successfully');
      }
      return true;
    } catch (err) {
      console.error('[MindMirror] Failed to load face-api.js:', err);
      return false;
    } finally {
      faceApiLoading.current = false;
    }
  }, []);

  // ===== RUN FACE DETECTION =====
  const runFaceDetection = useCallback(async () => {
    if (!faceApiLoaded.current || !videoRef.current || !canvasRef.current) return;

    const faceapi = await import('face-api.js');
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < 2) return; // Not enough data yet

    // Size canvas to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceExpressions();

      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        const sorted = Object.entries(expressions).sort(([, a], [, b]) => (b as number) - (a as number));
        const [dominantExpr, confidence] = sorted[0] as [string, number];
        const faceSignal = expressionToFaceSignal[dominantExpr] || 'relaxed';

        // Draw detection overlay on canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const box = detections[0].detection.box;
          ctx.strokeStyle = '#7c3aed';
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Draw expression label
          ctx.fillStyle = '#7c3aed';
          ctx.font = '12px Inter, sans-serif';
          ctx.fillText(`${dominantExpr} (${Math.round(confidence * 100)}%)`, box.x, box.y - 6);
        }

        setState(prev => ({
          ...prev,
          faceSignal,
          dominantExpression: dominantExpr,
          faceConfidence: Math.round(confidence * 100),
        }));
      }
    } catch (err) {
      // Silently ignore detection errors during continuous operation
      console.warn('[MindMirror] Face detection frame error:', err);
    }
  }, []);

  // ===== START CAMERA =====
  const startCamera = useCallback(async () => {
    try {
      // Load face-api.js models first
      const loaded = await loadFaceApi();
      if (!loaded) {
        setState(prev => ({ ...prev, cameraError: 'Face detection models failed to load. Camera will still work without expression analysis.' }));
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState(prev => ({ ...prev, cameraActive: true, cameraError: null }));

      // Create hidden canvas for face detection
      if (!canvasRef.current) {
        const canvas = document.createElement('canvas');
        canvasRef.current = canvas;
      }

      // Start face detection loop (every 800ms for performance)
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = setInterval(() => {
        runFaceDetection();
      }, 800);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Camera access denied';
      setState(prev => ({ ...prev, cameraError: message }));
      console.error('[MindMirror] Camera error:', err);
    }
  }, [loadFaceApi, runFaceDetection]);

  // ===== STOP CAMERA =====
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setState(prev => ({
      ...prev,
      cameraActive: false,
      faceSignal: 'relaxed',
      faceConfidence: 0,
      dominantExpression: 'neutral',
    }));
  }, []);

  // ===== ANALYZE VOICE DATA =====
  const analyzeVoice = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);
    analyser.getByteFrequencyData(frequencyData);

    // Calculate RMS energy (volume)
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    const energy = Math.min(100, Math.round(rms * 500)); // Scale to 0-100

    // Calculate spectral centroid (brightness/pitch indicator)
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < bufferLength; i++) {
      weightedSum += i * frequencyData[i];
      magnitudeSum += frequencyData[i];
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // Calculate zero crossing rate (noisiness/roughness)
    let zeroCrossings = 0;
    for (let i = 1; i < bufferLength; i++) {
      if ((dataArray[i] >= 128 && dataArray[i - 1] < 128) ||
          (dataArray[i] < 128 && dataArray[i - 1] >= 128)) {
        zeroCrossings++;
      }
    }
    const zcr = zeroCrossings / bufferLength;

    // Determine voice tone based on metrics
    let voiceTone: VoiceTone = 'calm';

    if (energy < 5) {
      // Silence or very quiet
      voiceTone = 'flat';
    } else if (energy > 50) {
      // Loud voice
      voiceTone = zcr > 0.15 ? 'tense' : 'energetic';
    } else if (energy > 25) {
      // Moderate voice
      voiceTone = spectralCentroid > 30 ? 'strained' : 'calm';
    } else {
      // Quiet voice
      voiceTone = zcr > 0.1 ? 'tired' : 'calm';
    }

    setState(prev => ({
      ...prev,
      voiceTone,
      voiceEnergy: energy,
    }));
  }, []);

  // ===== START MICROPHONE =====
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      micStreamRef.current = stream;

      // Create audio context and analyser
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setState(prev => ({ ...prev, micActive: true, micError: null }));

      // Start voice analysis loop (every 200ms for responsiveness)
      if (voiceIntervalRef.current) clearInterval(voiceIntervalRef.current);
      voiceIntervalRef.current = setInterval(analyzeVoice, 200);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      setState(prev => ({ ...prev, micError: message }));
      console.error('[MindMirror] Microphone error:', err);
    }
  }, [analyzeVoice]);

  // ===== STOP MICROPHONE =====
  const stopMic = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    if (voiceIntervalRef.current) {
      clearInterval(voiceIntervalRef.current);
      voiceIntervalRef.current = null;
    }
    setState(prev => ({
      ...prev,
      micActive: false,
      voiceTone: 'calm',
      voiceEnergy: 0,
    }));
  }, []);

  // ===== CLEANUP ON UNMOUNT =====
  useEffect(() => {
    return () => {
      stopCamera();
      stopMic();
    };
  }, [stopCamera, stopMic]);

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    startMic,
    stopMic,
  };
}
