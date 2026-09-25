"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DetectionResult } from '../types';

interface UsePersonDetectionOptions {
  onPersonEnter?: () => void;
  onPersonLeave?: () => void;
  inactivityTimeoutMs?: number;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export function usePersonDetection({
  onPersonEnter,
  onPersonLeave,
  inactivityTimeoutMs = 3800
}: UsePersonDetectionOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  // Camera selection state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [availableDevices, setAvailableDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const [detection, setDetection] = useState<DetectionResult>({
    hasPerson: false,
    score: 0,
    personCount: 0
  });

  const lastSeenRef = useRef<number>(0);
  const isPersonCurrentlyPresentRef = useRef<boolean>(false);
  const requestAnimationIdRef = useRef<number | null>(null);
  const isDetectingRef = useRef<boolean>(false);

  // Enumerate cameras
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devices
        .filter(d => d.kind === 'videoinput')
        .map((d, idx) => ({
          deviceId: d.deviceId,
          label: d.label || `Câmera ${idx + 1}`
        }));
      setAvailableDevices(videoDevs);
    } catch (err) {
      console.warn("Error enumerating devices:", err);
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Initialize Camera with resilient fallback logic
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Seu navegador não suporta acesso à câmera (getUserMedia).");
      }

      let stream: MediaStream | null = null;

      // Strategy 1: If specific device selected
      if (selectedDeviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });
        } catch (devErr) {
          console.warn("Failed with specific deviceId, falling back...", devErr);
        }
      }

      // Strategy 2: Ideal facingMode
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });
        } catch (facingErr) {
          console.warn("Failed with facingMode constraint, trying generic video...", facingErr);
        }
      }

      // Strategy 3: Generic video fallback (works on any webcam/driver)
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;

      // Update available devices once permission is granted
      refreshDevices();

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata to be loaded
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => {
            resolve();
          };
          // Timeout fallback in case event doesn't fire
          setTimeout(resolve, 1000);
        });

        await videoRef.current.play().catch(playErr => {
          console.warn("Auto-play blocked, retrying muted...", playErr);
          if (videoRef.current) {
            videoRef.current.muted = true;
            return videoRef.current.play();
          }
        });

        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      let msg = "Não foi possível acessar a câmera.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Permissão da câmera foi negada. Permita o acesso nas configurações do navegador.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = "Nenhuma câmera foi encontrada conectada ao dispositivo.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = "A câmera já está sendo usada por outro aplicativo ou navegador.";
      } else if (err.message) {
        msg = err.message;
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  }, [facingMode, selectedDeviceId, stopCamera, refreshDevices]);

  // Toggle between Frontal and Traseira
  const toggleFacingMode = useCallback(() => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    setSelectedDeviceId(''); // clear exact device id so facingMode takes precedence
  }, []);

  // Select specific device ID
  const selectDevice = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
  }, []);

  // Load TensorFlow & COCO-SSD Model on Mount
  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        setIsLoadingModel(true);
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        const loadedModel = await cocoSsd.load({
          base: 'lite_mobilenet_v2' // Very fast and lightweight for Kiosks
        });

        if (isMounted) {
          modelRef.current = loadedModel;
          setIsLoadingModel(false);
        }
      } catch (err: any) {
        console.error("Error loading TensorFlow / COCO-SSD model:", err);
        if (isMounted) {
          setIsLoadingModel(false);
          setCameraError("Falha ao inicializar o motor de inteligência artificial.");
        }
      }
    }

    loadModel();

    return () => {
      isMounted = false;
      stopCamera();
      if (requestAnimationIdRef.current) {
        cancelAnimationFrame(requestAnimationIdRef.current);
      }
    };
  }, [stopCamera]);

  // Restart camera when facingMode or selectedDeviceId changes
  useEffect(() => {
    if (!isLoadingModel) {
      startCamera();
    }
  }, [facingMode, selectedDeviceId, isLoadingModel, startCamera]);

  // Listen to device connect/disconnect
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.ondevicechange = () => {
        refreshDevices();
      };
    }
  }, [refreshDevices]);

  // Detection Loop with Throttling
  useEffect(() => {
    if (!cameraActive || !modelRef.current || !videoRef.current || isSimulated) {
      return;
    }

    let isRunning = true;
    let lastInferenceTime = 0;
    const INFERENCE_INTERVAL_MS = 180; // ~5.5 fps inference is super smooth and saves 85% CPU

    const runDetection = async (time: number) => {
      if (!isRunning) return;

      const video = videoRef.current;
      const model = modelRef.current;
      const canvas = canvasRef.current;

      if (video && model && video.readyState >= 2 && !video.paused) {
        if (time - lastInferenceTime >= INFERENCE_INTERVAL_MS && !isDetectingRef.current) {
          isDetectingRef.current = true;
          lastInferenceTime = time;

          try {
            const predictions = await model.detect(video);
            
            // Filter strictly for persons
            const personDetections = predictions.filter(
              (p: any) => p.class === 'person' && p.score >= 0.45
            );

            const hasPerson = personDetections.length > 0;
            const bestDetection = personDetections[0];
            const now = Date.now();

            // Draw bounding boxes on canvas if visible
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                personDetections.forEach((p: any) => {
                  const [x, y, w, h] = p.bbox;
                  ctx.strokeStyle = '#06b6d4';
                  ctx.lineWidth = 3;
                  ctx.strokeRect(x, y, w, h);
                  ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
                  ctx.fillRect(x, y, w, h);

                  ctx.fillStyle = '#06b6d4';
                  ctx.font = 'bold 16px Outfit, sans-serif';
                  ctx.fillText(`Pessoa: ${(p.score * 100).toFixed(0)}%`, x, y > 20 ? y - 8 : 20);
                });
              }
            }

            if (hasPerson) {
              lastSeenRef.current = now;
              if (!isPersonCurrentlyPresentRef.current) {
                isPersonCurrentlyPresentRef.current = true;
                onPersonEnter?.();
              }

              setDetection({
                hasPerson: true,
                score: bestDetection.score,
                bbox: bestDetection.bbox,
                personCount: personDetections.length
              });
            } else {
              // Check if debounce timeout has expired
              if (isPersonCurrentlyPresentRef.current && now - lastSeenRef.current > inactivityTimeoutMs) {
                isPersonCurrentlyPresentRef.current = false;
                onPersonLeave?.();
                setDetection({
                  hasPerson: false,
                  score: 0,
                  personCount: 0
                });
              }
            }
          } catch (err) {
            console.warn("Detection error in loop:", err);
          } finally {
            isDetectingRef.current = false;
          }
        }
      }

      requestAnimationIdRef.current = requestAnimationFrame(runDetection);
    };

    requestAnimationIdRef.current = requestAnimationFrame(runDetection);

    return () => {
      isRunning = false;
      if (requestAnimationIdRef.current) {
        cancelAnimationFrame(requestAnimationIdRef.current);
      }
    };
  }, [cameraActive, isSimulated, inactivityTimeoutMs, onPersonEnter, onPersonLeave]);

  // Simulation controls for testing without camera
  const triggerSimulation = useCallback((hasPerson: boolean) => {
    setIsSimulated(true);
    if (hasPerson) {
      isPersonCurrentlyPresentRef.current = true;
      setDetection({
        hasPerson: true,
        score: 0.95,
        personCount: 1,
        bbox: [100, 100, 200, 300]
      });
      onPersonEnter?.();
    } else {
      isPersonCurrentlyPresentRef.current = false;
      setDetection({
        hasPerson: false,
        score: 0,
        personCount: 0
      });
      onPersonLeave?.();
    }
  }, [onPersonEnter, onPersonLeave]);

  return {
    videoRef,
    canvasRef,
    isLoadingModel,
    cameraActive,
    cameraError,
    detection,
    isSimulated,
    facingMode,
    availableDevices,
    selectedDeviceId,
    toggleFacingMode,
    selectDevice,
    triggerSimulation,
    restartCamera: startCamera
  };
}
