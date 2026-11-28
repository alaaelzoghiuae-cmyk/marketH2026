import * as React from 'react';
import { cn } from '@/lib/cn';

const Table = React.forwardRef(function Table({ className, ...props }, ref) {
  return (
    <div className="relative w-full overflow-auto rounded-ui-lg border border-ui-line bg-ui-card">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
});
Table.displayName = 'Table';

const TableHeader = React.forwardRef(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn('[&_tr]:border-b [&_tr]:border-ui-line bg-ui-muted/60 sticky top-0 z-10', className)} {...props} />;
});
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
});
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef(function TableFooter({ className, ...props }, ref) {
  return <tfoot ref={ref} className={cn('border-t border-ui-line bg-ui-muted/60 font-medium', className)} {...props} />;
});
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef(function TableRow({ className, ...props }, ref) {
  return (
    <tr
      ref={ref}
      className={cn('border-b border-ui-line transition-colors duration-150 hover:bg-ui-muted/50 data-[state=selected]:bg-ui-muted', className)}
      {...props}
    />
  );
});
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef(function TableHead({ className, ...props }, ref) {
  return (
    <th
      ref={ref}
      className={cn('h-11 px-3 text-start align-middle text-xs font-semibold text-ui-muted-fg whitespace-nowrap', className)}
      {...props}
    />
  );
});
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef(function TableCell({ className, ...props }, ref) {
  return <td ref={ref} className={cn('p-3 align-middle', className)} {...props} />;
});
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef(function TableCaption({ className, ...props }, ref) {
  return <caption ref={ref} className={cn('mt-3 text-sm text-ui-muted-fg', className)} {...props} />;
});
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
