export type NameUnitCallback = (newNameUnit: string) => void;

export function renderNameUnitControl(
  containerEl: HTMLElement,
  currentNameUnit: string,
  onChange: NameUnitCallback
): void {
  // Skip re-rendering if the input already exists and has focus
  const existingInput = containerEl.querySelector<HTMLInputElement>('#name-unit-input');
  if (existingInput && document.activeElement === existingInput) {
    return;
  }

  containerEl.innerHTML = '';

  const label = document.createElement('label');
  label.htmlFor = 'name-unit-input';
  label.className = 'name-unit-label';
  label.textContent = 'Point name:';
  containerEl.appendChild(label);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'name-unit-input';
  input.className = 'name-unit-input';
  input.value = currentNameUnit;
  input.maxLength = 32;
  input.setAttribute('aria-label', 'Name unit for auto-generated point names');
  input.placeholder = 'e.g. Point';
  containerEl.appendChild(input);

  // 'change' event — trim and commit
  input.addEventListener('change', () => {
    const trimmedValue = input.value.trim();
    onChange(trimmedValue);
  });

  // 'input' event — live update without trimming
  input.addEventListener('input', () => {
    onChange(input.value);
  });
}
