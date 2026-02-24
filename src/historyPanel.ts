import { ExportHistoryItem } from './historyService';

export function renderHistoryPanel(
    container: HTMLElement,
    history: ExportHistoryItem[],
    onClose: () => void,
    onReplay: (item: ExportHistoryItem) => void
): void {
    container.innerHTML = '';

    const overlay = document.createElement('div');
    overlay.className = 'history-overlay';

    const panel = document.createElement('div');
    panel.className = 'history-panel';

    panel.innerHTML = `
    <div class="history-header">
      <h2>Export History</h2>
      <button class="close-history-btn icon-btn" aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="history-content">
      ${history.length === 0 ? '<p class="empty-history">No history found</p>' : ''}
      <ul class="history-list">
        ${history.map(item => `
          <li class="history-item">
            <div class="item-info">
              <span class="item-date">${new Date(item.created_at).toLocaleString()}</span>
              <span class="item-lang">${item.export_language.toUpperCase()}</span>
            </div>
            <div class="item-actions">
              <button class="view-item-btn secondary-btn" data-id="${item.id}">View Details</button>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

    overlay.appendChild(panel);
    container.appendChild(overlay);

    panel.querySelector('.close-history-btn')?.addEventListener('click', onClose);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) onClose();
    });

    panel.querySelectorAll('.view-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = (btn as HTMLElement).dataset.id;
            const item = history.find(h => h.id === id);
            if (item) onReplay(item);
        });
    });
}
