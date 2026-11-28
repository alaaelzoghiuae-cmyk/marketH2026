import * as React from 'react';
import { Toaster as SonnerToaster, toast } from 'sonner';

/**
 * sonner toaster bound to the site's theme + RTL direction.
 * Usage: mount <Toaster /> once, then call toast.success(...) / toast.error(...).
 */
function Toaster({ ...props }) {
  const [theme, setTheme] = React.useState('light');
  const [dir, setDir] = React.useState('rtl');

  React.useEffect(() => {
    const sync = () => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      setDir(document.documentElement.dir || 'rtl');
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'dir'] });
    return () => mo.disconnect();
  }, []);

  return (
    <SonnerToaster
      dir={dir}
      theme={theme}
      position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-ui-lg border border-ui-line bg-ui-card text-ui-fg shadow-[0_3px_30px_rgba(0,0,0,0.22)]',
          description: 'text-ui-muted-fg',
          actionButton: 'bg-ui-primary text-ui-primary-fg',
          cancelButton: 'bg-ui-muted text-ui-fg',
        },
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
export default Toaster;
