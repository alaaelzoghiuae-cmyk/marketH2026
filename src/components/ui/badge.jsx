import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-ui-primary text-ui-primary-fg',
        secondary: 'border-transparent bg-ui-muted text-ui-fg',
        outline: 'border-ui-line text-ui-fg',
        success: 'border-transparent bg-ui-success/15 text-ui-success',
        warning: 'border-transparent bg-ui-warning/15 text-ui-warning',
        destructive: 'border-transparent bg-ui-destructive/15 text-ui-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
export default Badge;
