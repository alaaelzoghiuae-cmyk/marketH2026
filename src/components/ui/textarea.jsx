import * as React from 'react';
import { cn } from '@/lib/cn';

const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-24 w-full rounded-ui border border-ui-line bg-ui-card px-3.5 py-2.5 text-sm text-ui-fg placeholder:text-ui-muted-fg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-ring focus-visible:border-ui-primary disabled:cursor-not-allowed disabled:opacity-40',
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
export default Textarea;
