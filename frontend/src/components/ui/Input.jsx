// Input.jsx
import React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef(({
  className,
  error,
  disabled,
  ...props
}, ref) => (
  <div className="relative">
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border bg-white px-3 py-2',
        'text-sm transition-colors file:border-0 file:bg-transparent',
        'file:text-sm file:font-medium placeholder:text-gray-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-red-500 focus-visible:ring-red-500',
        className
      )}
      disabled={disabled}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-red-500">{error}</p>
    )}
  </div>
));

Input.displayName = 'Input';