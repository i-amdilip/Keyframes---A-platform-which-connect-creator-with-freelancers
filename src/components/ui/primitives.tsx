import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { cn, isSafeHttpUrl } from '@/src/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      'bg-[#E8F553] text-[#131316] font-semibold hover:bg-[#DCF035] focus-visible:ring-2 focus-visible:ring-[#E8F553] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131316] disabled:opacity-50',
    secondary:
      'bg-[#1C1C21] text-white border border-[#32323B] hover:bg-[#26262E] hover:border-[#454552] focus-visible:ring-2 focus-visible:ring-[#E8F553] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131316] disabled:opacity-50',
    ghost:
      'bg-transparent text-zinc-300 hover:bg-[#24242C] hover:text-white focus-visible:ring-2 focus-visible:ring-[#E8F553] disabled:opacity-50',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#131316] disabled:opacity-50',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-sm',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3.5 py-2.5 text-sm bg-[#16161B] border border-[#2C2C35] rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#E8F553] focus:ring-2 focus:ring-[#E8F553]/20 transition-colors',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full px-3.5 py-2.5 text-sm bg-[#16161B] border border-[#2C2C35] rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#E8F553] focus:ring-2 focus:ring-[#E8F553]/20 transition-colors',
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full px-3.5 py-2.5 text-sm bg-[#16161B] border border-[#2C2C35] rounded-lg text-white focus:outline-none focus:border-[#E8F553] focus:ring-2 focus:ring-[#E8F553]/20 transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-lg',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={cn(
          'w-full bg-[#1C1C21] border border-[#2E2E38] rounded-2xl p-6 my-8 shadow-2xl text-white',
          maxWidth
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="modal-title" className="font-display text-lg font-semibold text-white">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 text-zinc-400 hover:text-white hover:bg-[#2A2A32] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SafeImage({
  src,
  alt,
  className,
  fallbackTitle,
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}) {
  const [failed, setFailed] = useState(false);
  const validSrc = src && isSafeHttpUrl(src) ? src : '';

  if (!validSrc || failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C22] via-[#23232B] to-[#17171C] text-zinc-400 p-4 text-center',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <ImageIcon className="w-5 h-5 text-[#E8F553]/70 mb-1.5" />
        {fallbackTitle && (
          <span className="text-xs font-medium text-zinc-300 line-clamp-1">{fallbackTitle}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={validSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function StatusText({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalized = status.toLowerCase();
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  let colorClass = 'text-zinc-400';
  if (['completed', 'active', 'released', 'paid', 'accepted', 'resolved'].includes(normalized)) {
    colorClass = 'text-emerald-400';
  } else if (['open', 'in_progress', 'delivered', 'ordered', 'held'].includes(normalized)) {
    colorClass = 'text-[#E8F553]';
  } else if (['revision_requested', 'pending', 'requested'].includes(normalized)) {
    colorClass = 'text-amber-400';
  } else if (['suspended', 'rejected', 'cancelled', 'dismissed'].includes(normalized)) {
    colorClass = 'text-red-400';
  }

  return (
    <span className={cn('text-xs font-semibold tracking-tight whitespace-nowrap', colorClass, className)}>
      {label}
    </span>
  );
}
