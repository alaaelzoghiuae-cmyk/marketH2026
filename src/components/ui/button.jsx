import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ui text-sm font-medium transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ui-bg disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none',
  {
    variants: {
      variant: {
        default: 'bg-ui-primary text-ui-primary-fg hover:bg-ui-primary/90 active:bg-ui-primary/80',
        secondary: 'bg-ui-muted text-ui-fg hover:bg-ui-muted/70 border border-ui-line',
        outline: 'border border-ui-line bg-transparent text-ui-fg hover:bg-ui-muted',
        ghost: 'text-ui-fg hover:bg-ui-muted',
        destructive: 'bg-ui-destructive text-white hover:bg-ui-destructive/90',
        link: 'text-ui-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2 sm:h-10',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 rounded-full px-8 text-base',
        icon: 'h-11 w-11 sm:h-10 sm:w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const Button = React.forwardRef(function Button({ className, variant, size, ...props }, ref) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
