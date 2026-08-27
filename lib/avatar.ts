export function getInitialAvatar(name: string): string {
  const initial = (name.trim()[0] || 'U').toUpperCase();
  const colors = [
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#009688', // Teal
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#FF5722', // Deep Orange
    '#00BCD4', // Cyan
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="50" fill="${color}"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="system-ui,-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif" font-size="52" font-weight="700">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
