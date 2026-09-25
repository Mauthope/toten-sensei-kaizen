"use client";

import React, { useState } from 'react';
import { Camera, Eye, EyeOff, Sparkles, RefreshCw, AlertCircle, PlayCircle, StopCircle } from 'lucide-react';
import { DetectionResult } from '../types';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraActive: boolean;
  cameraError: string | null;
  detection: DetectionResult;
  isLoadingModel: boolean;
  isSimulated: boolean;
  onToggleSimulation: (hasPerson: boolean) => void;
  onRestartCamera: () => void;
}

export function CameraFeed({
  videoRef,
  canvasRef,
  cameraActive,
  cameraError,
  detection,
  isLoadingModel,
  isSimulated,
  onToggleSimulation,
  onRestartCamera
}: CameraFeedProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Mini Diagnostic Drawer / Modal */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Diagnóstico de Visão IA
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Fechar ✕
            </button>
          </div>

          {/* Video & Canvas Overlay */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10 mb-3 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none"
            />

            {!cameraActive && !isLoadingModel && !cameraError && (
              <div className="text-center p-3 text-xs text-slate-400">
                Câmera em espera
              </div>
            )}

            {isLoadingModel && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 p-3 text-center">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-300">Carregando Modelo TensorFlow COCO-SSD...</span>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-red-950/80 p-3 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                <span className="text-xs text-red-200">{cameraError}</span>
              </div>
            )}
          </div>

          {/* Status Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="bg-slate-800/80 p-2 rounded-lg border border-white/5">
              <span className="text-slate-400 block text-[10px] uppercase">Presença</span>
              <span className={`font-bold ${detection.hasPerson ? 'text-emerald-400' : 'text-slate-300'}`}>
                {detection.hasPerson ? 'Humano Detectado' : 'Ninguém na Câmera'}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2 rounded-lg border border-white/5">
              <span className="text-slate-400 block text-[10px] uppercase">Confiança IA</span>
              <span className="font-bold text-cyan-400">
                {(detection.score * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Simulation Toggle Buttons for Testing */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">Simulador de Teste:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => onToggleSimulation(true)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                  isSimulated && detection.hasPerson
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" /> Pessoa
              </button>
              <button
                onClick={() => onToggleSimulation(false)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                  isSimulated && !detection.hasPerson
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <StopCircle className="w-3.5 h-3.5" /> Vazio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/15 backdrop-blur-md shadow-lg transition-all duration-200 text-xs font-medium cursor-pointer"
      >
        <Camera className="w-4 h-4 text-cyan-400" />
        <span>{isOpen ? 'Ocultar Câmera' : 'Monitor IA'}</span>
        {detection.hasPerson ? (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-amber-400" />
        )}
      </button>
    </div>
  );
}
