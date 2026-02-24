/**
 * Shows a temporary toast message to the user.
 */
export function showToast(message: string, duration: number = 3000): void {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.setAttribute('role', 'alert');

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('visible');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        }, { once: true });
    }, duration);
}
