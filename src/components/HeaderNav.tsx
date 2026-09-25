"use client";

import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Volume2, VolumeX, ShieldCheck, SwitchCamera, Sparkles } from 'lucide-react';

interface HeaderNavProps {
  isMuted: boolean;
  onToggleMute: () => void;
  personDetected: boolean;
  facingMode?: 'user' | 'environment';
  onToggleFacingMode?: () => void;
}

export function HeaderNav({
  isMuted,
  onToggleMute,
  personDetected,
  facingMode = 'user',
  onToggleFacingMode
}: HeaderNavProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn("Exit fullscreen error:", err);
        });
        setIsFullscreen(false);
      }
    }
  };

  return (
    <>
      <header className="relative z-30 w-full px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/40 backdrop-blur-md">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <span className="text-xl">🥋</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                SENSEI KAIZEN
              </h1>
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${personDetected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-cyan-400 animate-ping'}`} />
            </div>
            {/* Neon Destaque: Feito por Mauricio Grigol */}
            <div className="inline-flex items-center gap-1.5 my-0.5">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)] bg-cyan-950/60 border border-cyan-500/50 px-2 py-0.5 rounded shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                ⚡ Feito por Mauricio Grigol
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Toten Corporativo • Inteligência Artificial Gemini & 5S
            </p>
          </div>
        </div>

        {/* Right: Controls & Clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Time Badge */}
          {currentTime && (
            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-xs font-mono text-cyan-300">
              {currentTime}
            </div>
          )}

          {/* Camera Flip Quick Button */}
          {onToggleFacingMode && (
            <button
              onClick={onToggleFacingMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs text-cyan-300 hover:text-white transition cursor-pointer"
              title={`Trocar Câmera (Atual: ${facingMode === 'user' ? 'Frontal' : 'Traseira'})`}
            >
              <SwitchCamera className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">
                {facingMode === 'user' ? 'Frontal' : 'Traseira'}
              </span>
            </button>
          )}

          {/* LGPD Compliance Tooltip Button */}
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs text-slate-300 hover:text-white transition cursor-pointer"
            title="Conformidade LGPD"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">LGPD On-Device</span>
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isMuted
                ? 'bg-slate-800/80 border-white/10 text-slate-400 hover:text-white'
                : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/25'
            }`}
            title={isMuted ? "Ativar Voz" : "Silenciar Voz"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title={isFullscreen ? "Sair da Tela Cheia" : "Modo Toten (Tela Cheia)"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* LGPD Transparency Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center gap-2 text-emerald-400 mb-3">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Privacidade e LGPD</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Este toten utiliza inteligência artificial com <strong>processamento 100% local (Client-Side)</strong>:
            </p>
            <ul className="text-xs text-slate-400 space-y-2 mb-6 list-disc list-inside">
              <li>Nenhuma imagem, foto ou vídeo é gravado em disco.</li>
              <li>A inteligência de visão computacional roda na memória RAM do navegador.</li>
              <li>Não realiza reconhecimento facial biométrico nem identifica colaboradores individualmente.</li>
              <li>A câmera opera estritamente como sensor de proximidade e presença óptica interativa.</li>
            </ul>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
