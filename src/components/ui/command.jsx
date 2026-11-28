import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * Lightweight command palette (no extra dependency) in the shadcn/ui shape.
 * Pure presentation — filtering is done here from the items you pass in.
 */
const CommandCtx = React.createContext({ query: '', setQuery: () => {} });

function Command({ className, value, onValueChange, children, ...props }) {
  const [internal, setInternal] = React.useState('');
  const query = value !== undefined ? value : internal;
  const setQuery = (v) => {
    setInternal(v);
    if (onValueChange) onValueChange(v);
  };
  return (
    <CommandCtx.Provider value={{ query, setQuery }}>
      <div
        role="searchbox"
        className={cn('flex h-full w-full flex-col overflow-hidden rounded-ui-lg bg-ui-card text-ui-fg', className)}
        {...props}
      >
        {children}
      </div>
    </CommandCtx.Provider>
  );
}

function CommandInput({ className, placeholder = 'اكتب أمرًا للبحث…', ...props }) {
  const { query, setQuery } = React.useContext(CommandCtx);
  return (
    <div className="flex items-center gap-2 border-b border-ui-line px-3.5">
      <span aria-hidden className="text-ui-muted-fg">⌕</span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn('h-12 w-full bg-transparent text-sm text-ui-fg placeholder:text-ui-muted-fg focus-visible:outline-none', className)}
        {...props}
      />
      <kbd className="rounded border border-ui-line px-1.5 py-0.5 text-[10px] text-ui-muted-fg">esc</kbd>
    </div>
  );
}

function CommandList({ className, children }) {
  return (
    <div className={cn('max-h-72 overflow-y-auto overflow-x-hidden p-1.5', className)} role="listbox">
      {children}
    </div>
  );
}

function CommandEmpty({ children = 'لا توجد نتائج' }) {
  const { query } = React.useContext(CommandCtx);
  const empty = React.useMemo(() => {
    // children of groups are filtered upstream; empty state only needs the query length heuristic
    return query.trim().length > 0;
  }, [query]);
  if (!empty) return null;
  return <div className="py-8 text-center text-sm text-ui-muted-fg">{children}</div>;
}

function CommandGroup({ heading, children, className }) {
  const { query } = React.useContext(CommandCtx);
  const q = query.trim().toLowerCase();
  const items = React.Children.toArray(children).filter((child) => {
    if (!q || !React.isValidElement(child)) return true;
    const label = String(child.props['data-label'] || child.props.children || '').toLowerCase();
    return label.includes(q);
  });
  if (!items.length) return null;
  return (
    <div className={cn('mb-1.5', className)} role="group">
      {heading ? <div className="px-2.5 py-1.5 text-xs font-semibold text-ui-muted-fg">{heading}</div> : null}
      {items}
    </div>
  );
}

function CommandItem({ className, onSelect, children, 'data-label': dataLabel, ...props }) {
  const { setQuery } = React.useContext(CommandCtx);
  return (
    <button
      type="button"
      role="option"
      data-label={dataLabel}
      onClick={(e) => {
        if (onSelect) onSelect(e);
        setQuery('');
      }}
      className={cn(
        'flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-start text-sm text-ui-fg transition-colors duration-150 hover:bg-ui-muted focus-visible:bg-ui-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-ring [&_svg]:size-4 [&_svg]:shrink-0',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function CommandShortcut({ className, children }) {
  return <span className={cn('ms-auto text-xs text-ui-muted-fg', className)}>{children}</span>;
}

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut };
