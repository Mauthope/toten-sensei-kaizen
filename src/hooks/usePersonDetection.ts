"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DetectionResult } from '../types';

interface UsePersonDetectionOptions {
  onPersonEnter?: () => void;
  onPersonLeave?: () => void;
  inactivityTimeoutMs?: number;
}

export function usePersonDetection({
  onPersonEnter,
  onPersonLeave,
  inactivityTimeoutMs = 3500
}: UsePersonDetectionOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [detection, setDetection] = useState<DetectionResult>({
    hasPerson: false,
    score: 0,
    personCount: 0
  });

  const lastSeenRef = useRef<number>(0);
  const isPersonCurrentlyPresentRef = useRef<boolean>(false);
  const requestAnimationIdRef = useRef<number | null>(null);
  const isDetectingRef = useRef<boolean>(false);

  // Initialize Camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError(err.message || "Não foi possível acessar a câmera. Verifique as permissões.");
      setCameraActive(false);
    }
  }, []);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Load TensorFlow & COCO-SSD Model
  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        setIsLoadingModel(true);
        // Dynamic import to avoid SSR issues
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        const loadedModel = await cocoSsd.load({
          base: 'lite_mobilenet_v2' // Very fast and lightweight for Kiosks
        });

        if (isMounted) {
          modelRef.current = loadedModel;
          setIsLoadingModel(false);
          startCamera();
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
  }, [startCamera, stopCamera]);

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

      if (video && model && video.readyState === 4) {
        if (time - lastInferenceTime >= INFERENCE_INTERVAL_MS && !isDetectingRef.current) {
          isDetectingRef.current = true;
          lastInferenceTime = time;

          try {
            const predictions = await model.detect(video);
            
            // Filter strictly for persons
            const personDetections = predictions.filter(
              (p: any) => p.class === 'person' && p.score >= 0.50
            );

            const hasPerson = personDetections.length > 0;
            const bestDetection = personDetections[0];
            const now = Date.now();

            // Draw bounding boxes on canvas if available (for preview/diagnostic)
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
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
    triggerSimulation,
    restartCamera: startCamera
  };
}
