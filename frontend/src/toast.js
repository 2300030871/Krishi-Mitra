export const emitToast = (message, type = 'info') => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('agrimandi-toast', {
      detail: { message, type },
    })
  );
};
