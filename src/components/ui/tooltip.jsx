import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/cn';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef(function TooltipContent({ className, sideOffset = 6, dir, ...props }, ref) {
  const resolvedDir = dir || (typeof document !== 'undefined' ? document.documentElement.dir : 'rtl');
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        dir={resolvedDir}
        sideOffset={sideOffset}
        className={cn(
          'z-menus overflow-hidden rounded-md bg-nav2 px-3 py-1.5 text-xs text-nav-fg shadow-[0_3px_30px_rgba(0,0,0,0.22)] data-[state=delayed-open]:elz-fade-in',
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
