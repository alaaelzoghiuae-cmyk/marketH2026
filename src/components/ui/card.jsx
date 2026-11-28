import * as React from 'react';
import { cn } from '@/lib/cn';

const Card = React.forwardRef(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('rounded-ui-lg border border-ui-line bg-ui-card text-ui-fg transition-shadow duration-200', className)}
      {...props}
    />
  );
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef(function CardHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />;
});
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(function CardTitle({ className, ...props }, ref) {
  return <h3 ref={ref} className={cn('text-lg font-semibold leading-tight tracking-normal', className)} {...props} />;
});
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn('text-sm text-ui-muted-fg leading-relaxed', className)} {...props} />;
});
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />;
});
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(function CardFooter({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex items-center gap-2 p-5 pt-0', className)} {...props} />;
});
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
