const dibujos = {
  frutas:
    '<path d="M12 7c-4-4-9-1-8 5s4 10 8 8c4 2 7-2 8-8s-4-9-8-5Z"/><path d="M12 7c0-3 2-5 5-5 0 3-2 5-5 5Z"/>',
  verduras:
    '<path d="m8 8 9 3L5 21 8 8Z"/><path d="m12 9 1-6m1 6 5-5m-3 7 6-2M8 13l3 1m-5 3 2 1"/>',
  carbohidratos:
    '<path d="M12 22V3M12 9C5 9 5 5 5 4c5 0 7 2 7 5Zm0 5c-7 0-7-4-7-5 5 0 7 2 7 5Zm0 5c-7 0-7-4-7-5 5 0 7 2 7 5Zm0-10c7 0 7-4 7-5-5 0-7 2-7 5Zm0 5c7 0 7-4 7-5-5 0-7 2-7 5Zm0 5c7 0 7-4 7-5-5 0-7 2-7 5Z"/>',
  proteinas:
    '<path d="M20 14c0 5-3.5 8-8 8s-8-3-8-8S9 2 12 2s8 7 8 12Z"/><path d="M8 16c0 2 1 3 3 3"/>',
  bebidas:
    '<path d="M5 8h12v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8Zm12 1h2a3 3 0 0 1 0 6h-2M8 5V2m4 3V2"/>',
  otros: '<path d="M3 11h18c-1 7-4 10-9 10S4 18 3 11Zm3-4h12M9 3h6"/>',
};
export const iconoCategoria = (id) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${dibujos[id] || dibujos.otros}</svg>`;
export const iconoArrastrar =
  '<svg viewBox="0 0 20 24" width="16" height="20" fill="currentColor" aria-hidden="true"><circle cx="6" cy="6" r="1.5"/><circle cx="14" cy="6" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="14" cy="12" r="1.5"/><circle cx="6" cy="18" r="1.5"/><circle cx="14" cy="18" r="1.5"/></svg>';
