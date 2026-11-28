import { cn } from '@/lib/cn';

function Skeleton({ className, ...props }) {
  return <div className={cn('animate-pulse rounded-ui bg-ui-muted', className)} {...props} />;
}

export { Skeleton };
export default Skeleton;
