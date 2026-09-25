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
import { SwitchCamera, Eye } from 'lucide-react';

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

    // Register Service Worker for PWA with auto-update
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        registration.update();
      }).catch((err) => {
        console.warn("SW registration failed:", err);
      });
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  const handleReturnToIdle = useCallback(() => {
    setSenseiState('idle');
  }, []);

  const handleStateChange = useCallback((st: SenseiState) => {
    setSenseiState(st);
  }, []);

  // When a person enters camera vision
  const handlePersonEnter = useCallback(() => {
    setSenseiState((prev) => {
      if (prev === 'idle') return 'celebrating';
      return prev;
    });
  }, []);

  // When the person leaves and timeout expires (e.g. 15s absence)
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
    inactivityTimeoutMs: 15000 // 15s grace buffer without any person before returning to binocular idle
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
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-3 sm:px-6 py-3 sm:py-5 w-full max-w-5xl mx-auto">
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

        {/* Dynamic Lower Area: Idle (Larger Lower Half Camera) vs Active (Kaizen Interaction) */}
        {senseiState === 'idle' ? (
          /* Bottom Half: Prominent & High-Tech Camera Scanner Feed */
          <div className="w-full max-w-4xl px-2 sm:px-4 pb-2 sm:pb-4">
            <div className="relative aspect-video sm:aspect-[16/9] min-h-[300px] sm:min-h-[420px] max-h-[50vh] w-full rounded-3xl overflow-hidden border-2 border-cyan-500/50 bg-slate-950/90 shadow-[0_0_40px_rgba(6,182,212,0.3)] flex items-center justify-center">
              
              <canvas
                ref={canvasRef}
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
              />

              {/* Cyber Scanline Laser Effect */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-scan" />

              {/* Corner Sci-Fi Brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

              {/* Top Banner Tag */}
              <div className="absolute top-3 left-3 ml-7 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 text-[11px] font-bold text-cyan-300 flex items-center gap-2 uppercase tracking-wider shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Scanner IA de Presença • Campo Aberto</span>
              </div>

              {/* Quick Flip Camera Button in Feed */}
              <button
                onClick={toggleFacingMode}
                className="absolute top-3 right-3 mr-7 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/10 hover:border-cyan-400 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer shadow-lg"
                title="Trocar Câmera Frontal / Traseira"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{facingMode === 'user' ? 'Frontal' : 'Traseira'}</span>
              </button>

              {/* Bottom Guidance Box */}
              <div className="absolute bottom-4 inset-x-0 mx-auto text-center px-4 pointer-events-none">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 text-xs sm:text-sm font-medium text-cyan-200 shadow-xl">
                  <Eye className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                  <span>Aproxime-se do toten para iniciar a interação com o Sensei</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Interactive Kaizen Mode */
          <div className="w-full flex justify-center flex-1 items-center py-2">
            <KaizenInteraction
              personDetected={detection.hasPerson}
              onSpeak={speak}
              onStateChange={handleStateChange}
              onReturnToIdle={handleReturnToIdle}
            />
          </div>
        )}
      </div>

      {/* Footer Branding & Industrial Kiosk Status Bar */}
      <footer className="relative z-20 w-full px-6 py-3 border-t border-white/5 bg-slate-950/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Toten Kiosk v1.3 • Canal Kaizen & Gemini IA
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
