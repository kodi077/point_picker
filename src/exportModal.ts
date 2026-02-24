import { ExportLanguage, AnchorPoint } from './types';
import { formatPoints, downloadFile } from './exportEngine';

// Module-level selected language
let currentLanguage: ExportLanguage = 'json';

export type ExportCallback = (language: ExportLanguage, content: string) => void;

const LANGUAGE_LABELS: Record<ExportLanguage, string> = {
  json: 'JSON',
  dart: 'Dart',
  swift: 'Swift',
  java: 'Java',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  kotlin: 'Kotlin',
  python: 'Python',
  csharp: 'C#',
};

export function renderExportControls(
  controlsEl: HTMLElement,
  getPoints: () => ReadonlyArray<AnchorPoint>,
  onExport?: ExportCallback
): void {
  controlsEl.innerHTML = '';

  // Language select
  const select = document.createElement('select');
  select.id = 'export-language-select';
  select.setAttribute('aria-label', 'Export language');

  const languages: ExportLanguage[] = [
    'json', 'dart', 'swift', 'java', 'javascript',
    'typescript', 'kotlin', 'python', 'csharp',
  ];

  languages.forEach((lang) => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = LANGUAGE_LABELS[lang];
    if (lang === currentLanguage) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener('change', (e) => {
    currentLanguage = (e.target as HTMLSelectElement).value as ExportLanguage;
  });

  controlsEl.appendChild(select);

  // Export button
  const exportBtn = document.createElement('button');
  exportBtn.id = 'export-btn';
  exportBtn.className = 'primary-btn';
  exportBtn.textContent = 'Export Data';
  exportBtn.addEventListener('click', () => {
    const points = getPoints();
    openExportModal(points, currentLanguage);
    if (onExport) {
      const formattedCode = formatPoints(points, currentLanguage);
      onExport(currentLanguage, formattedCode);
    }
  });

  controlsEl.appendChild(exportBtn);
}

export function openExportModal(
  points: ReadonlyArray<AnchorPoint>,
  language: ExportLanguage
): void {
  const formattedCode = formatPoints(points, language);
  const label = LANGUAGE_LABELS[language];

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'export-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Export data');

  overlay.innerHTML = `
    <div class="modal-box">
      <h2>Export — ${label}</h2>
      <pre class="code-preview"><code></code></pre>
      <div class="modal-actions">
        <button id="copy-btn">Copy to Clipboard</button>
        <button id="download-btn">Download</button>
        <button id="close-modal-btn">Close</button>
      </div>
    </div>
  `;

  // Set code content safely
  const codeEl = overlay.querySelector('code')!;
  codeEl.textContent = formattedCode;

  document.body.appendChild(overlay);

  function closeModal(): void {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    document.removeEventListener('keydown', escHandler);
  }

  // Copy button
  const copyBtn = overlay.querySelector<HTMLButtonElement>('#copy-btn')!;
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(formattedCode).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy to Clipboard';
      }, 2000);
    });
  });

  // Download button
  overlay.querySelector<HTMLButtonElement>('#download-btn')!.addEventListener('click', () => {
    downloadFile(formattedCode, language);
  });

  // Close button
  overlay.querySelector<HTMLButtonElement>('#close-modal-btn')!.addEventListener('click', closeModal);

  // Click outside modal box
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Escape key
  function escHandler(e: KeyboardEvent): void {
    if (e.key === 'Escape' && overlay.parentNode) {
      closeModal();
    }
  }
  document.addEventListener('keydown', escHandler);
}
