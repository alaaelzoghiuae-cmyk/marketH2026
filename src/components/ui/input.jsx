import * as React from 'react';
import { cn } from '@/lib/cn';

const Input = React.forwardRef(function Input({ className, type, ...props }, ref) {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-ui border border-ui-line bg-ui-card px-3.5 py-2 text-sm text-ui-fg placeholder:text-ui-muted-fg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-ring focus-visible:border-ui-primary disabled:cursor-not-allowed disabled:opacity-40',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
export default Input;
