"use client";

import React, { useState } from 'react';
import { Camera, SwitchCamera, AlertCircle, PlayCircle, StopCircle, RefreshCw, SlidersHorizontal, Eye } from 'lucide-react';
import { DetectionResult } from '../types';
import { CameraDevice } from '../hooks/usePersonDetection';

interface CameraFeedProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  cameraActive: boolean;
  cameraError: string | null;
  detection: DetectionResult;
  isLoadingModel: boolean;
  isSimulated: boolean;
  facingMode: 'user' | 'environment';
  availableDevices: CameraDevice[];
  selectedDeviceId: string;
  onToggleFacingMode: () => void;
  onSelectDevice: (deviceId: string) => void;
  onToggleSimulation: (hasPerson: boolean) => void;
  onDisableSimulation?: () => void;
  onRestartCamera: () => void;
}

export function CameraFeed({
  canvasRef,
  cameraActive,
  cameraError,
  detection,
  isLoadingModel,
  isSimulated,
  facingMode,
  availableDevices,
  selectedDeviceId,
  onToggleFacingMode,
  onSelectDevice,
  onToggleSimulation,
  onDisableSimulation,
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
                Diagnóstico & Câmera
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Fechar ✕
            </button>
          </div>

          {/* Canvas Diagnostic Overlay Preview if provided */}
          {canvasRef && (
            <div className="relative w-full aspect-video bg-black/90 rounded-xl overflow-hidden border border-white/10 mb-3 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
              />

              {!cameraActive && !isLoadingModel && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-slate-950/80">
                  <span className="text-xs text-slate-300 mb-2">Câmera em espera</span>
                  <button
                    onClick={() => {
                      onDisableSimulation?.();
                      onRestartCamera();
                    }}
                    className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs hover:bg-cyan-500/30 transition cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Iniciar Câmera
                  </button>
                </div>
              )}

              {isLoadingModel && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                  <span className="text-xs text-slate-300">Carregando Modelo TensorFlow COCO-SSD...</span>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-red-950/90 p-3 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                  <span className="text-xs text-red-200 mb-2">{cameraError}</span>
                  <button
                    onClick={() => {
                      onDisableSimulation?.();
                      onRestartCamera();
                    }}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Camera Controls: Frontal vs Traseira & Selection */}
          <div className="space-y-2 mb-3 bg-slate-950/50 p-2.5 rounded-xl border border-white/5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                Modo:
              </span>
              <button
                onClick={onToggleFacingMode}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                {facingMode === 'user' ? 'Câmera Frontal (Selfie)' : 'Câmera Traseira (Ambiente)'}
              </button>
            </div>

            {/* Dropdown for multiple devices */}
            {availableDevices.length > 1 && (
              <div>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => onSelectDevice(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-1.5 text-slate-200 text-[11px] focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Automático ({facingMode === 'user' ? 'Frontal' : 'Traseira'})</option>
                  {availableDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Status Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="bg-slate-800/80 p-2 rounded-lg border border-white/5">
              <span className="text-slate-400 block text-[10px] uppercase">Presença</span>
              <span className={`font-bold ${detection.hasPerson ? 'text-emerald-400' : 'text-slate-300'}`}>
                {detection.hasPerson ? `Detectado (${detection.personCount})` : 'Ninguém na Câmera'}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2 rounded-lg border border-white/5">
              <span className="text-slate-400 block text-[10px] uppercase">Modo Atual</span>
              <span className={`font-bold ${isSimulated ? 'text-amber-400' : 'text-cyan-400'}`}>
                {isSimulated ? 'Modo Simulado' : 'Câmera Real IA'}
              </span>
            </div>
          </div>

          {/* Simulation Toggle Controls: Real, Pessoa, Vazio */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span>Controle de Detecção:</span>
              {isSimulated && (
                <span className="text-amber-400 text-[10px] font-semibold animate-pulse">
                  Simulação Ativa
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {/* Option 1: Real Camera with AI */}
              <button
                type="button"
                onClick={() => onDisableSimulation?.()}
                className={`px-2 py-1.5 text-[11px] rounded-lg font-medium transition cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                  !isSimulated
                    ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-300 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5'
                }`}
                title="Usar Câmera Real com detecção automática por IA"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Câmera Real</span>
              </button>

              {/* Option 2: Simulate Person */}
              <button
                type="button"
                onClick={() => onToggleSimulation(true)}
                className={`px-2 py-1.5 text-[11px] rounded-lg font-medium transition cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                  isSimulated && detection.hasPerson
                    ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-300 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5'
                }`}
                title="Simular que há uma pessoa em frente à câmera"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Simular Pessoa</span>
              </button>

              {/* Option 3: Simulate Empty (Camera stream remains active!) */}
              <button
                type="button"
                onClick={() => onToggleSimulation(false)}
                className={`px-2 py-1.5 text-[11px] rounded-lg font-medium transition cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                  isSimulated && !detection.hasPerson
                    ? 'bg-amber-500/25 border border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5'
                }`}
                title="Simular ambiente vazio sem desligar o vídeo da câmera"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Simular Vazio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Quick Camera Flip Button */}
        <button
          onClick={onToggleFacingMode}
          className="p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-white/15 backdrop-blur-md shadow-lg transition cursor-pointer"
          title={`Trocar Câmera (Atual: ${facingMode === 'user' ? 'Frontal' : 'Traseira'})`}
        >
          <SwitchCamera className="w-4 h-4" />
        </button>

        {/* Floating Monitor Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/15 backdrop-blur-md shadow-lg transition-all duration-200 text-xs font-medium cursor-pointer"
        >
          <Camera className="w-4 h-4 text-cyan-400" />
          <span>{isOpen ? 'Ocultar Monitor' : 'Monitor IA'}</span>
          {detection.hasPerson ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </div>
    </div>
  );
}
