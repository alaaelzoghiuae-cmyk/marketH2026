import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef(function SelectTrigger({ className, children, dir, ...props }, ref) {
  const resolvedDir = dir || (typeof document !== 'undefined' ? document.documentElement.dir : 'rtl');
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      dir={resolvedDir}
      className={cn(
        'flex h-11 w-full items-center justify-between gap-2 rounded-ui border border-ui-line bg-ui-card px-3.5 py-2 text-sm text-ui-fg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ui-ring disabled:cursor-not-allowed disabled:opacity-40 [&>span]:line-clamp-1',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 shrink-0 text-ui-muted-fg rtl:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = React.forwardRef(function SelectContent({ className, children, position = 'popper', dir, ...props }, ref) {
  const resolvedDir = dir || (typeof document !== 'undefined' ? document.documentElement.dir : 'rtl');
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        dir={resolvedDir}
        position={position}
        className={cn(
          'z-menus max-h-72 overflow-auto rounded-ui-lg border border-ui-line bg-ui-card text-ui-fg shadow-[0_3px_30px_rgba(0,0,0,0.22)]',
          position === 'popper' && 'translate-y-1',
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = 'SelectContent';

const SelectLabel = React.forwardRef(function SelectLabel({ className, ...props }, ref) {
  return <SelectPrimitive.Label ref={ref} className={cn('px-2.5 py-1.5 text-xs font-semibold text-ui-muted-fg', className)} {...props} />;
});
SelectLabel.displayName = 'SelectLabel';

const SelectItem = React.forwardRef(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex min-h-9 w-full cursor-pointer select-none items-center rounded-md py-1.5 pe-8 ps-2.5 text-sm outline-none transition-colors duration-150 focus:bg-ui-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute end-2 flex h-4 w-4 items-center justify-center text-ui-primary">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = 'SelectItem';

const SelectSeparator = React.forwardRef(function SelectSeparator({ className, ...props }, ref) {
  return <SelectPrimitive.Separator ref={ref} className={cn('-mx-1.5 my-1.5 h-px bg-ui-line', className)} {...props} />;
});
SelectSeparator.displayName = 'SelectSeparator';

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator };
