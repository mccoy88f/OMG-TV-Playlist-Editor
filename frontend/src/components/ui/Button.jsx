// Button.jsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const variants = {
 primary: 'bg-blue-600 text-white hover:bg-blue-700',
 secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
 destructive: 'bg-red-600 text-white hover:bg-red-700',
 ghost: 'hover:bg-gray-100',
 outline: 'border-gray-200 hover:bg-gray-100',
 link: 'text-blue-600 hover:underline'
};

const sizes = {
 sm: 'h-8 px-3 text-sm',
 md: 'h-10 px-4',
 lg: 'h-12 px-6 text-lg'
};

export const Button = React.forwardRef(({
 className,
 variant = 'primary',
 size = 'md',
 loading = false,
 disabled = false,
 children,
 ...props
}, ref) => (
 <button
   ref={ref}
   disabled={disabled || loading}
   className={cn(
     'inline-flex items-center justify-center rounded-md font-medium',
     'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
     'transition-colors disabled:pointer-events-none disabled:opacity-50',
     variants[variant],
     sizes[size],
     className
   )}
   {...props}
 >
   {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
   {children}
 </button>
));

Button.displayName = 'Button';