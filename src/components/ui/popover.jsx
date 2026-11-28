import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/cn';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef(function PopoverContent({ className, align = 'center', sideOffset = 6, dir, ...props }, ref) {
  const resolvedDir = dir || (typeof document !== 'undefined' ? document.documentElement.dir : 'rtl');
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        dir={resolvedDir}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-menus w-72 rounded-ui-lg border border-ui-line bg-ui-card p-4 text-ui-fg shadow-[0_3px_30px_rgba(0,0,0,0.22)] outline-none data-[state=open]:elz-fade-in',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
