'use client';

import { Box, Check, Cog, MapPin, Truck } from 'lucide-react';

import { cn } from '@/lib/utils';

interface TimelineProps {
  status: string;
}

const STEPS = [
  {
    id: 'VALIDATION',
    label: 'Validation',
    icon: Box,
    statuses: ['PENDING_CONFIRMATION', 'PENDING', 'CONFIRMED'],
  },
  { id: 'PREPARATION', label: 'Préparation', icon: Cog, statuses: ['PAID', 'PROCESSING'] },
  { id: 'LIVRAISON', label: 'En route', icon: Truck, statuses: ['SHIPPED'] },
  { id: 'TERMINE', label: 'Livrée', icon: MapPin, statuses: ['DELIVERED'] },
];

export function OrderTimeline({ status }: TimelineProps) {
  // Trouver l'index de l'étape en fonction du statut réel
  const activeIndex = STEPS.findIndex((step) => step.statuses.includes(status));
  const finalIndex = activeIndex === -1 ? (status === 'DELIVERED' ? 3 : 0) : activeIndex;

  return (
    <div className="py-12 px-4">
      <div className="relative flex justify-between">
        {/* Background Line */}
        <div className="absolute top-5 left-0 h-0.5 w-full bg-brand-ink/5" />

        {/* Progress Line */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-brand-gold transition-all duration-1000 ease-in-out"
          style={{ width: `${(finalIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < finalIndex;
          const isActive = index === finalIndex;
          const isFuture = index > finalIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500',
                  isCompleted && 'bg-brand-gold border-brand-gold text-white',
                  isActive && 'bg-white border-brand-gold text-brand-gold scale-125 shadow-lg',
                  isFuture && 'bg-white border-brand-ink/10 text-brand-ink/20',
                )}
              >
                {isCompleted ? (
                  <Check size={18} />
                ) : (
                  <Icon size={18} className={cn(isActive && 'animate-pulse')} />
                )}
              </div>

              <div className="mt-4 flex flex-col items-center">
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-widest transition-colors duration-500',
                    isActive || isCompleted ? 'text-brand-ink' : 'text-brand-ink/20',
                  )}
                >
                  {step.label}
                </span>
                {isActive && (
                  <span className="mt-1 text-[9px] font-medium text-brand-gold animate-bounce">
                    Étape actuelle
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
