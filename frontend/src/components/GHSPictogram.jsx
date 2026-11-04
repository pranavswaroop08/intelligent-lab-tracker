import React from 'react';
import { Flame, AlertTriangle, Skull, Droplets, ShieldAlert, Sparkles } from 'lucide-react';

const PICTOGRAM_MAP = {
  flame: { label: 'Flammable', color: 'text-red-500', border: 'border-red-500', icon: Flame },
  corrosive: { label: 'Corrosive', color: 'text-orange-500', border: 'border-orange-500', icon: Droplets },
  skull_crossbones: { label: 'Acute Toxicity', color: 'text-purple-400', border: 'border-purple-400', icon: Skull },
  flame_over_circle: { label: 'Oxidizer', color: 'text-yellow-400', border: 'border-yellow-400', icon: Sparkles },
  exclamation: { label: 'Harmful / Irritant', color: 'text-amber-400', border: 'border-amber-400', icon: AlertTriangle },
  environment: { label: 'Aquatic Toxicity', color: 'text-emerald-400', border: 'border-emerald-400', icon: ShieldAlert }
};

export default function GHSPictogram({ type, size = 'sm' }) {
  const normKey = (type || '').toLowerCase().trim();
  const meta = PICTOGRAM_MAP[normKey] || { label: type, color: 'text-slate-400', border: 'border-slate-500', icon: AlertTriangle };
  const IconComponent = meta.icon;

  const sizeClasses = size === 'lg' ? 'w-10 h-10 p-1.5' : 'w-7 h-7 p-1';

  return (
    <div
      className={`relative inline-flex items-center justify-center transform rotate-45 border-2 ${meta.border} bg-slate-900 shadow-sm ${sizeClasses}`}
      title={`GHS Hazard: ${meta.label}`}
    >
      <div className="transform -rotate-45">
        <IconComponent className={`${meta.color} w-4 h-4`} />
      </div>
    </div>
  );
}
