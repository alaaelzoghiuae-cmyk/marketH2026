import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef(function SheetOverlay({ className, ...props }, ref) {
  return (
    <SheetPrimitive.Overlay
      ref={ref}
      className={cn('fixed inset-0 z-sheet bg-black/45 backdrop-blur-sm data-[state=open]:elz-fade-in duration-200', className)}
      {...props}
    />
  );
});
SheetOverlay.displayName = 'SheetOverlay';

const sheetVariants = cva(
  'fixed z-sheet flex flex-col bg-ui-card shadow-[0_3px_30px_rgba(0,0,0,0.22)] duration-300 ease-out data-[state=closed]:duration-200',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 max-h-[85vh] rounded-b-ui-lg border-b border-ui-line',
        bottom: 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-ui-lg border-t border-ui-line',
        start: 'inset-y-0 start-0 h-full w-[85vw] max-w-sm border-e border-ui-line',
        end: 'inset-y-0 end-0 h-full w-[85vw] max-w-sm border-s border-ui-line',
      },
    },
    defaultVariants: { side: 'end' },
  }
);

const SheetContent = React.forwardRef(function SheetContent({ side = 'end', className, children, dir, ...props }, ref) {
  const resolvedDir = dir || (typeof document !== 'undefined' ? document.documentElement.dir : 'rtl');
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content ref={ref} dir={resolvedDir} className={cn(sheetVariants({ side }), className)} {...props}>
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-ui-line sm:hidden" />
        {children}
        <SheetPrimitive.Close
          className="absolute end-3 top-3 rounded-full p-2 text-ui-muted-fg transition hover:bg-ui-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-ring"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = 'SheetContent';

function SheetHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1.5 border-b border-ui-line p-4 pe-10', className)} {...props} />;
}

function SheetFooter({ className, ...props }) {
  return <div className={cn('mt-auto flex flex-col gap-2 border-t border-ui-line p-4', className)} {...props} />;
}

const SheetTitle = React.forwardRef(function SheetTitle({ className, ...props }, ref) {
  return <SheetPrimitive.Title ref={ref} className={cn('text-base font-semibold text-ui-fg', className)} {...props} />;
});
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.forwardRef(function SheetDescription({ className, ...props }, ref) {
  return <SheetPrimitive.Description ref={ref} className={cn('text-sm text-ui-muted-fg', className)} {...props} />;
});
SheetDescription.displayName = 'SheetDescription';

export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
