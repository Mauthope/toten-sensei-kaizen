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
  inactivityTimeoutMs = 15000
}: UsePersonDetectionOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  const isSimulatedRef = useRef(false);
  isSimulatedRef.current = isSimulated;

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
      console.warn("Could not enumerate video devices:", err);
    }
  }, []);

  // Stop current active stream tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Initialize and load TensorFlow.js COCO-SSD
  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        setIsLoadingModel(true);
        // Load TensorFlow dependencies dynamically
        await import('@tensorflow/tfjs');
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        const loadedModel = await cocoSsd.load({
          base: 'lite_mobilenet_v2' // Fast lightweight model for kiosk responsiveness
        });

        if (isMounted) {
          modelRef.current = loadedModel;
          setIsLoadingModel(false);
        }
      } catch (err) {
        console.warn("Failed loading COCO-SSD model:", err);
        if (isMounted) {
          setIsLoadingModel(false);
        }
      }
    }

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  // Request Camera Stream
  const startCamera = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Navegador não suporta acesso à câmera (getUserMedia).");
      return;
    }

    stopCamera();
    setCameraError(null);

    try {
      let stream: MediaStream | null = null;

      // Strategy 1: Specific deviceId if chosen
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

  // Select exact physical device
  const selectDevice = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
  }, []);

  // Start camera on mount & change
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Listen for device connects/disconnects (e.g. plugging in USB webcam)
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.ondevicechange = () => {
        refreshDevices();
      };
    }
  }, [refreshDevices]);

  const lastDetectionsRef = useRef<any[]>([]);

  // Continuous Camera Rendering Loop & Throttled Detection
  // CRITICAL: NEVER terminates when in simulation mode! Live video frame drawing to canvas always continues!
  useEffect(() => {
    if (!cameraActive || !videoRef.current) {
      return;
    }

    let isRunning = true;
    let lastInferenceTime = 0;
    const INFERENCE_INTERVAL_MS = 180; // ~5.5 fps inference saves 85% CPU while staying responsive

    const runDetection = async (time: number) => {
      if (!isRunning) return;

      const video = videoRef.current;
      const model = modelRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2) {
        // Ensure video is not paused
        if (video.paused) {
          video.play().catch(() => {});
        }

        // 1. ALWAYS Draw live camera frame and HUD overlay to canvas
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const vWidth = video.videoWidth || 640;
            const vHeight = video.videoHeight || 480;
            if (canvas.width !== vWidth || canvas.height !== vHeight) {
              canvas.width = vWidth;
              canvas.height = vHeight;
            }
            
            // Draw real live video frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Tech center reticle
            const cw = canvas.width;
            const ch = canvas.height;
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cw / 2, ch / 2, 45, 0, Math.PI * 2);
            ctx.stroke();

            // Draw bounding boxes for persons
            lastDetectionsRef.current.forEach((p: any) => {
              const [x, y, w, h] = p.bbox;
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, w, h);
              ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
              ctx.fillRect(x, y, w, h);

              // Cyber Corner brackets
              const cLen = 14;
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(x, y + cLen);
              ctx.lineTo(x, y);
              ctx.lineTo(x + cLen, y);
              ctx.moveTo(x + w - cLen, y);
              ctx.lineTo(x + w, y);
              ctx.lineTo(x + w, y + cLen);
              ctx.stroke();

              ctx.fillStyle = '#06b6d4';
              ctx.font = 'bold 16px Outfit, sans-serif';
              ctx.fillText(`Pessoa Detectada: ${(p.score * 100).toFixed(0)}%`, x, y > 20 ? y - 8 : 20);
            });
          }
        }

        // 2. Run AI detection on throttled interval ONLY if NOT simulated
        if (model && !isSimulatedRef.current && time - lastInferenceTime >= INFERENCE_INTERVAL_MS && !isDetectingRef.current) {
          isDetectingRef.current = true;
          lastInferenceTime = time;

          try {
            const predictions = await model.detect(video);
            
            // Filter strictly for persons
            const personDetections = predictions.filter(
              (p: any) => p.class === 'person' && p.score >= 0.45
            );

            lastDetectionsRef.current = personDetections;
            const hasPerson = personDetections.length > 0;
            const bestDetection = personDetections[0];
            const now = Date.now();

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
              // Check if inactivity debounce timeout has expired
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
  }, [cameraActive, inactivityTimeoutMs, onPersonEnter, onPersonLeave]);

  // Turn off simulation and return to real AI camera vision
  const disableSimulation = useCallback(() => {
    setIsSimulated(false);
    isSimulatedRef.current = false;
    isPersonCurrentlyPresentRef.current = false;
    lastDetectionsRef.current = [];
    setDetection({
      hasPerson: false,
      score: 0,
      personCount: 0
    });
  }, []);

  // Simulation controls for testing without person (NEVER stops the camera feed!)
  const triggerSimulation = useCallback((hasPerson: boolean) => {
    setIsSimulated(true);
    isSimulatedRef.current = true;

    if (hasPerson) {
      isPersonCurrentlyPresentRef.current = true;
      lastDetectionsRef.current = [{
        bbox: [120, 80, 240, 320],
        score: 0.96,
        class: 'person'
      }];
      setDetection({
        hasPerson: true,
        score: 0.96,
        personCount: 1,
        bbox: [120, 80, 240, 320]
      });
      onPersonEnter?.();
    } else {
      isPersonCurrentlyPresentRef.current = false;
      lastDetectionsRef.current = [];
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
    disableSimulation,
    restartCamera: startCamera
  };
}
