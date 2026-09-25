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

export default function TotenPage() {
  const [senseiState, setSenseiState] = useState<SenseiState>('idle');

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
  }, []);

  // When the person leaves and timeout expires
  const handlePersonLeave = useCallback(() => {
    setSenseiState('idle');
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
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-4 py-4 w-full max-w-5xl mx-auto">
        {/* Upper Area: Sensei Mascot */}
        <div className="w-full flex flex-col items-center justify-center flex-1">
          <div className="mb-2 sm:mb-4">
            <SenseiAvatar state={senseiState} isSpeaking={isSpeaking} />
          </div>

          {senseiState === 'idle' && (
            <div className="w-full flex justify-center mb-2">
              <IdleScreensaver />
            </div>
          )}
        </div>

        {/* Dynamic Lower Area: Idle (Lower Half Camera) vs Active (Kaizen Interaction) */}
        {senseiState === 'idle' ? (
          /* Bottom Half: Live Camera Scanner Feed */
          <div className="w-full max-w-2xl px-2 pb-2">
            <div className="relative aspect-video sm:aspect-[21/9] max-h-[35vh] w-full rounded-2xl overflow-hidden border-2 border-cyan-500/40 bg-slate-950/80 shadow-[0_0_30px_rgba(6,182,212,0.25)] flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
              />

              {/* Cyber Scanline Laser Effect */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-scan" />

              {/* Top Banner Tag */}
              <div className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider shadow-lg">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Scanner de Presença IA • Varredura
              </div>

              {/* Bottom Subtitle / Tip */}
              <div className="absolute bottom-2.5 inset-x-0 mx-auto text-center px-4">
                <span className="inline-block px-3 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-white/10 text-xs text-slate-300 shadow-lg">
                  👀 Aproxime-se do toten para interagir com o Sensei
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Active Interactive Kaizen Mode */
          <div className="w-full flex justify-center flex-1 items-center">
            <KaizenInteraction
              onSpeak={speak}
              onStateChange={setSenseiState}
              onReturnToIdle={() => setSenseiState('idle')}
            />
          </div>
        )}
      </div>

      {/* Footer Branding & Industrial Kiosk Status Bar */}
      <footer className="relative z-20 w-full px-6 py-3 border-t border-white/5 bg-slate-950/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Toten Kiosk v1.2 • Gemini IA
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

      {/* Camera Diagnostic Controls Floating Widget */}
      <CameraFeed
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
