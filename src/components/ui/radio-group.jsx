import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/cn';

const RadioGroup = React.forwardRef(function RadioGroup({ className, ...props }, ref) {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2.5', className)} {...props} ref={ref} />;
});
RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef(function RadioGroupItem({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-5 w-5 shrink-0 rounded-full border border-ui-line bg-ui-card transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ui-card disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:border-ui-primary',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex h-full w-full items-center justify-center after:block after:h-2.5 after:w-2.5 after:rounded-full after:bg-ui-primary after:content-['']" />
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
