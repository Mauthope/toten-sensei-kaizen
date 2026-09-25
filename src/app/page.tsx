"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePersonDetection } from '../hooks/usePersonDetection';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { SenseiAvatar } from '../components/SenseiAvatar';
import { RadarScanner } from '../components/RadarScanner';
import { IdleScreensaver } from '../components/IdleScreensaver';
import { KaizenInteraction } from '../components/KaizenInteraction';
import { CameraFeed } from '../components/CameraFeed';
import { HeaderNav } from '../components/HeaderNav';
import { SenseiState } from '../types';
import { GREETING_PHRASES } from '../lib/kaizenData';

export default function TotenPage() {
  const [senseiState, setSenseiState] = useState<SenseiState>('idle');
  const greetingSpokenRef = useRef(false);

  const { speak, isMuted, toggleMute, isSpeaking } = useSpeechSynthesis();

  // Screen Wake Lock API for Toten/Kiosks
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn("Wake Lock error:", err);
      }
    };

    requestWakeLock();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn("SW registration failed:", err);
      });
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // When a person enters camera vision
  const handlePersonEnter = useCallback(() => {
    setSenseiState('detected');

    // Only speak greeting once per detection session
    if (!greetingSpokenRef.current) {
      greetingSpokenRef.current = true;
      const randomGreeting = GREETING_PHRASES[Math.floor(Math.random() * GREETING_PHRASES.length)];
      speak(randomGreeting);
    }
  }, [speak]);

  // When the person leaves and timeout expires
  const handlePersonLeave = useCallback(() => {
    setSenseiState('idle');
    greetingSpokenRef.current = false;
  }, []);

  const {
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
    restartCamera
  } = usePersonDetection({
    onPersonEnter: handlePersonEnter,
    onPersonLeave: handlePersonLeave,
    inactivityTimeoutMs: 3800 // 3.8s inactivity buffer before returning to binocular idle mode
  });

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950">
      {/* 
        CRITICAL: Video element MUST be persistently rendered in DOM so stream attaches immediately 
        even when the diagnostic preview drawer is closed!
      */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className="hidden"
      />

      {/* Background Radar Scanner Grid */}
      <RadarScanner isScanning={senseiState === 'idle'} />

      {/* Top Header / Kiosk Navigation */}
      <HeaderNav
        isMuted={isMuted}
        onToggleMute={toggleMute}
        personDetected={detection.hasPerson}
        facingMode={facingMode}
        onToggleFacingMode={toggleFacingMode}
      />

      {/* Central Interactive Arena */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 w-full max-w-5xl mx-auto">
        {/* Animated Sensei Character */}
        <div className="mb-4 sm:mb-6">
          <SenseiAvatar state={senseiState} isSpeaking={isSpeaking} />
        </div>

        {/* Dynamic State Component: Idle vs Active Kaizen Interaction */}
        <div className="w-full flex justify-center">
          {senseiState === 'idle' ? (
            <IdleScreensaver />
          ) : (
            <KaizenInteraction
              onSpeak={speak}
              onStateChange={setSenseiState}
            />
          )}
        </div>
      </div>

      {/* Footer Branding & Industrial Kiosk Status Bar */}
      <footer className="relative z-20 w-full px-6 py-3 border-t border-white/5 bg-slate-950/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Toten Kiosk v1.1 • Gemini IA
          </span>
          <span>•</span>
          <span className="text-slate-400">Desenvolvido para Chão de Fábrica & Melhoria Contínua</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-400">
            {cameraActive 
              ? `Câmera: Ativa (${facingMode === 'user' ? 'Frontal' : 'Traseira'})` 
              : isSimulated 
              ? "Modo: Simulação" 
              : isLoadingModel 
              ? "Carregando IA..." 
              : "Câmera: Em espera"}
          </span>
          <span>•</span>
          <span className="text-cyan-400 font-mono">
            {detection.hasPerson ? `Pessoas: ${detection.personCount}` : 'Standby'}
          </span>
        </div>
      </footer>

      {/* Camera Diagnostic Preview & Simulator Floating Widget */}
      <CameraFeed
        canvasRef={canvasRef}
        cameraActive={cameraActive}
        cameraError={cameraError}
        detection={detection}
        isLoadingModel={isLoadingModel}
        isSimulated={isSimulated}
        facingMode={facingMode}
        availableDevices={availableDevices}
        selectedDeviceId={selectedDeviceId}
        onToggleFacingMode={toggleFacingMode}
        onSelectDevice={selectDevice}
        onToggleSimulation={triggerSimulation}
        onRestartCamera={restartCamera}
      />
    </main>
  );
}
