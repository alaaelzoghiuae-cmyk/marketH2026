import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-modal bg-black/45 backdrop-blur-sm data-[state=open]:elz-fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200',
        className
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef(function DialogContent({ className, children, dir, ...props }, ref) {
  const resolvedDir = dir || (typeof document !== 'undefined' ? document.documentElement.dir : 'rtl');
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        dir={resolvedDir}
        className={cn(
          'fixed left-1/2 top-1/2 z-modal w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-ui-lg border border-ui-line bg-ui-card p-5 shadow-[0_3px_30px_rgba(0,0,0,0.22)] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-ring data-[state=open]:elz-slide-up max-h-[85vh] overflow-auto',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute end-3 top-3 rounded-full p-2 text-ui-muted-fg opacity-80 transition hover:bg-ui-muted hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-ring"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = 'DialogContent';

function DialogHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1.5 pe-6 text-start', className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
  return <div className={cn('mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />;
}

const DialogTitle = React.forwardRef(function DialogTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold leading-tight', className)} {...props} />;
});
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef(function DialogDescription({ className, ...props }, ref) {
  return <DialogPrimitive.Description ref={ref} className={cn('text-sm text-ui-muted-fg leading-relaxed', className)} {...props} />;
});
DialogDescription.displayName = 'DialogDescription';

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
