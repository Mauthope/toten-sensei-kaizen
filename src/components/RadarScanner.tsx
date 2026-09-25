"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface RadarScannerProps {
  isScanning: boolean;
}

export function RadarScanner({ isScanning }: RadarScannerProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
      {/* Background radial gradient glow matching big-bag-calculator */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Radar Circles */}
      <div className="relative w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] md:w-[600px] md:h-[600px] flex items-center justify-center">
        {/* Concentric rings */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
        <div className="absolute w-3/4 h-3/4 rounded-full border border-cyan-500/15 border-dashed" />
        <div className="absolute w-1/2 h-1/2 rounded-full border border-cyan-500/20" />
        <div className="absolute w-1/4 h-1/4 rounded-full border border-cyan-500/25" />

        {/* Crosshair Axis lines */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />

        {/* Sweeping Radar beam (active when scanning/idle) */}
        {isScanning && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(6, 182, 212, 0.15) 360deg)'
            }}
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "linear"
            }}
          />
        )}

        {/* Sonar Pulse Ping */}
        {isScanning && (
          <motion.div
            className="absolute w-full h-full rounded-full border border-cyan-400/40"
            animate={{
              scale: [0.3, 1],
              opacity: [0.8, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "easeOut",
            }}
          />
        )}
      </div>
    </div>
  );
}
