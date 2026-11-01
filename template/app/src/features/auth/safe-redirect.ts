// Where to go after signing in: the ?redirect= path when it stays on this site, otherwise the dashboard.
// Only same-site paths are allowed, so a crafted link can't send people to another site.
export function safeRedirect(path: string | undefined) {
  return path?.startsWith('/') && !path.startsWith('//') ? path : '/dashboard'
}
