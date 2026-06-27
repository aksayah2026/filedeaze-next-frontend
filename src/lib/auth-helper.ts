export function getPortalPrefix(pathname?: string, hostname?: string): 'sa' | 'tenant' {
  // If running in browser:
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  const host = hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  
  if (path.startsWith('/super-admin')) {
    return 'sa';
  }
  if (path.startsWith('/admin') || path.startsWith('/manager')) {
    return 'tenant';
  }
  
  // For shared /login page or other root paths:
  // Check if we are on a super admin host
  const isSuperAdminHost = (h: string) => {
    if (h === 'localhost' || h === '127.0.0.1') return true;
    return (
      h === 'admin.localhost' ||
      h === 'admin.fieldeaze.com' ||
      h === 'fieldeaze.ngstellar.com' ||
      h.startsWith('admin.')
    );
  };
  const isVercelMain = host.includes('vercel.app') && !host.startsWith('tenant-');
  
  if (isSuperAdminHost(host) || isVercelMain) {
    return 'sa';
  }
  
  return 'tenant';
}

export function setCookie(name: string, value: string, days?: number) {
  if (typeof document === 'undefined') return;
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function eraseCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
}
