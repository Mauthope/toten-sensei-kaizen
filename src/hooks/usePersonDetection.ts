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
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const modelRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inferCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
  const pauseDetectionUntilRef = useRef<number>(0);
  const prevDetectionRef = useRef<{ hasPerson: boolean; personCount: number }>({ hasPerson: false, personCount: 0 });

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

  // Initialize and load TensorFlow.js COCO-SSD with WebGL GPU acceleration
  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        setIsLoadingModel(true);
        // Load TensorFlow dependencies dynamically
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();

        // Ensure WebGL hardware acceleration is enabled
        if (tf.getBackend() !== 'webgl') {
          try {
            await tf.setBackend('webgl');
          } catch (e) {
            console.warn("WebGL not available, defaulting to:", tf.getBackend());
          }
        }

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

    // Prepare offscreen downscaled inference canvas (320x240) for 4x faster detection
    if (typeof document !== 'undefined' && !inferCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 240;
      inferCanvasRef.current = c;
    }

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

      // Strategy 3: Generic video fallback
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
        
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => resolve();
          setTimeout(resolve, 800);
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
    setSelectedDeviceId('');
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

  // Listen for device connects/disconnects
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.ondevicechange = () => {
        refreshDevices();
      };
    }
  }, [refreshDevices]);

  const lastDetectionsRef = useRef<any[]>([]);

  // Continuous Camera Rendering Loop & Optimized Throttled Detection
  useEffect(() => {
    if (!cameraActive || !videoRef.current) {
      return;
    }

    let isRunning = true;
    let lastInferenceTime = 0;
    // 350ms interval (~2.8 fps) is imperceptible to humans approaching a kiosk,
    // while freeing 70% of CPU/GPU for silky-smooth 60fps animations!
    const INFERENCE_INTERVAL_MS = 350;

    const runDetection = async (time: number) => {
      if (!isRunning) return;

      const video = videoRef.current;
      const model = modelRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2) {
        if (video.paused) {
          video.play().catch(() => {});
        }

        // 1. ALWAYS Draw live camera frame and HUD overlay to canvas (only when canvas is in DOM)
        if (canvas) {
          if (!canvasCtxRef.current || canvasCtxRef.current.canvas !== canvas) {
            canvasCtxRef.current = canvas.getContext('2d', { alpha: false });
          }
          const ctx = canvasCtxRef.current;

          if (ctx) {
            // Cap canvas resolution to 640x360 for high-performance GPU blitting
            const targetW = 640;
            const targetH = 360;
            if (canvas.width !== targetW || canvas.height !== targetH) {
              canvas.width = targetW;
              canvas.height = targetH;
            }
            
            // Draw real live video frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Tech center reticle
            const cw = canvas.width;
            const ch = canvas.height;
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cw / 2, ch / 2, 40, 0, Math.PI * 2);
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
              ctx.font = 'bold 15px Outfit, sans-serif';
              ctx.fillText(`Pessoa Detectada: ${(p.score * 100).toFixed(0)}%`, x, y > 20 ? y - 8 : 20);
            });
          }
        }

        // 2. Run AI detection on throttled interval ONLY if NOT simulated
        if (model && !isSimulatedRef.current && time - lastInferenceTime >= INFERENCE_INTERVAL_MS && !isDetectingRef.current) {
          isDetectingRef.current = true;
          lastInferenceTime = time;

          const now = Date.now();
          // Check if detection is in temporary cooldown (e.g. after manual reset or 'Vazio')
          if (now < pauseDetectionUntilRef.current) {
            isDetectingRef.current = false;
            requestAnimationIdRef.current = requestAnimationFrame(runDetection);
            return;
          }

          try {
            // High-Performance Optimization: Downscale frame to 320x240 for 4x faster TensorFlow inference!
            let personDetections: any[] = [];
            const inferCanvas = inferCanvasRef.current;

            if (inferCanvas) {
              const inferCtx = inferCanvas.getContext('2d', { willReadFrequently: true });
              if (inferCtx) {
                inferCtx.drawImage(video, 0, 0, 320, 240);
                const predictions = await model.detect(inferCanvas);
                
                const scaleX = (canvas?.width || 640) / 320;
                const scaleY = (canvas?.height || 360) / 240;

                personDetections = predictions
                  .filter((p: any) => p.class === 'person' && p.score >= 0.45)
                  .map((p: any) => ({
                    ...p,
                    bbox: [
                      p.bbox[0] * scaleX,
                      p.bbox[1] * scaleY,
                      p.bbox[2] * scaleX,
                      p.bbox[3] * scaleY
                    ]
                  }));
              }
            } else {
              const predictions = await model.detect(video);
              personDetections = predictions.filter(
                (p: any) => p.class === 'person' && p.score >= 0.45
              );
            }

            lastDetectionsRef.current = personDetections;
            const hasPerson = personDetections.length > 0;
            const bestDetection = personDetections[0];

            if (hasPerson) {
              lastSeenRef.current = now;
              if (!isPersonCurrentlyPresentRef.current) {
                isPersonCurrentlyPresentRef.current = true;
                onPersonEnter?.();
              }

              // PERFORMANCE CRITICAL: Only trigger React re-render if presence state changed!
              if (!prevDetectionRef.current.hasPerson || prevDetectionRef.current.personCount !== personDetections.length) {
                prevDetectionRef.current = { hasPerson: true, personCount: personDetections.length };
                setDetection({
                  hasPerson: true,
                  score: bestDetection.score,
                  bbox: bestDetection.bbox,
                  personCount: personDetections.length
                });
              }
            } else {
              // Check if inactivity debounce timeout has expired
              if (isPersonCurrentlyPresentRef.current && now - lastSeenRef.current > inactivityTimeoutMs) {
                isPersonCurrentlyPresentRef.current = false;
                onPersonLeave?.();
                prevDetectionRef.current = { hasPerson: false, personCount: 0 };
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
    pauseDetectionUntilRef.current = 0;
    prevDetectionRef.current = { hasPerson: false, personCount: 0 };
    setDetection({
      hasPerson: false,
      score: 0,
      personCount: 0
    });
  }, []);

  // Reset presence with cooldown
  const resetPresence = useCallback((cooldownMs: number = 3000) => {
    setIsSimulated(false);
    isSimulatedRef.current = false;
    isPersonCurrentlyPresentRef.current = false;
    lastDetectionsRef.current = [];
    pauseDetectionUntilRef.current = Date.now() + cooldownMs;
    prevDetectionRef.current = { hasPerson: false, personCount: 0 };
    setDetection({
      hasPerson: false,
      score: 0,
      personCount: 0
    });
    onPersonLeave?.();
  }, [onPersonLeave]);

  // Simulation controls for testing
  const triggerSimulation = useCallback((hasPerson: boolean) => {
    if (hasPerson) {
      setIsSimulated(true);
      isSimulatedRef.current = true;
      isPersonCurrentlyPresentRef.current = true;
      lastDetectionsRef.current = [{
        bbox: [120, 80, 240, 320],
        score: 0.96,
        class: 'person'
      }];
      prevDetectionRef.current = { hasPerson: true, personCount: 1 };
      setDetection({
        hasPerson: true,
        score: 0.96,
        personCount: 1,
        bbox: [120, 80, 240, 320]
      });
      onPersonEnter?.();
    } else {
      setIsSimulated(false);
      isSimulatedRef.current = false;
      isPersonCurrentlyPresentRef.current = false;
      lastDetectionsRef.current = [];
      pauseDetectionUntilRef.current = Date.now() + 3500;
      prevDetectionRef.current = { hasPerson: false, personCount: 0 };
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
    resetPresence,
    restartCamera: startCamera
  };
}
