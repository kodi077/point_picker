"use strict";
(() => {
  // src/state.ts
  function createInitialState() {
    return {
      imageNaturalWidth: 0,
      imageNaturalHeight: 0,
      imageObjectUrl: "",
      points: [],
      nameUnit: "Point",
      selectedPointId: null
    };
  }
  function setImage(state, info) {
    return {
      ...state,
      imageNaturalWidth: info.naturalWidth,
      imageNaturalHeight: info.naturalHeight,
      imageObjectUrl: info.objectUrl
    };
  }
  function isNameDuplicate(state, name, excludeId) {
    return state.points.some(
      (p) => p.pointName === name && p.id !== excludeId
    );
  }
  function isAutoNamed(point, index, nameUnit) {
    if (nameUnit.trim() === "") {
      return point.pointName === (index + 1).toString();
    }
    return point.pointName === (index + 1).toString() + nameUnit;
  }
  function addPoint(state, xAnchor, yAnchor) {
    const nameUnit = state.nameUnit;
    const autoName = nameUnit.trim() === "" ? (state.points.length + 1).toString() : (state.points.length + 1).toString() + nameUnit;
    const newPoint = {
      id: crypto.randomUUID(),
      pointName: autoName,
      xAnchor,
      yAnchor
    };
    return {
      ...state,
      points: [...state.points, newPoint]
    };
  }
  function renamePoint(state, id, newName) {
    const points = state.points.map(
      (p) => p.id === id ? { ...p, pointName: newName } : p
    );
    return { ...state, points };
  }
  function deletePoint(state, id) {
    const originalPoints = state.points;
    const filtered = originalPoints.filter((p) => p.id !== id);
    const recalculated = filtered.map((p, newIndex) => {
      const originalIndex = originalPoints.findIndex((op) => op.id === p.id);
      if (isAutoNamed(p, originalIndex, state.nameUnit)) {
        const newName = state.nameUnit.trim() === "" ? (newIndex + 1).toString() : (newIndex + 1).toString() + state.nameUnit;
        return { ...p, pointName: newName };
      }
      return p;
    });
    return {
      ...state,
      points: recalculated,
      selectedPointId: state.selectedPointId === id ? null : state.selectedPointId
    };
  }
  function reorderPoints(state, fromIndex, toIndex) {
    const points = [...state.points];
    const [moved] = points.splice(fromIndex, 1);
    points.splice(toIndex, 0, moved);
    const originalPoints = state.points;
    const recalculated = points.map((p, newIndex) => {
      const originalIndex = originalPoints.findIndex((op) => op.id === p.id);
      if (isAutoNamed(p, originalIndex, state.nameUnit)) {
        const newName = state.nameUnit.trim() === "" ? (newIndex + 1).toString() : (newIndex + 1).toString() + state.nameUnit;
        return { ...p, pointName: newName };
      }
      return p;
    });
    return { ...state, points: recalculated };
  }
  function setNameUnit(state, nameUnit) {
    return { ...state, nameUnit };
  }
  function selectPoint(state, id) {
    return { ...state, selectedPointId: id };
  }
  function resetState() {
    return createInitialState();
  }

  // src/coordinateEngine.ts
  function calculateAnchor(clickX, clickY, naturalWidth, naturalHeight) {
    if (naturalWidth <= 0 || naturalHeight <= 0) {
      throw new RangeError("Image dimensions must be greater than zero");
    }
    const rawX = clickX / naturalWidth;
    const rawY = clickY / naturalHeight;
    const roundedX = Math.round(rawX * 1e3) / 1e3;
    const roundedY = Math.round(rawY * 1e3) / 1e3;
    const xAnchor = Math.min(1, Math.max(0, roundedX));
    const yAnchor = Math.min(1, Math.max(0, roundedY));
    return { xAnchor, yAnchor };
  }

  // src/imageUpload.ts
  var prevUrl = "";
  function processFile(file, onSuccess, onError) {
    if (!file.type.startsWith("image/")) {
      onError("Please upload an image file.");
      return;
    }
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    prevUrl = objectUrl;
    const img = new Image();
    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;
      if (naturalWidth === 0 || naturalHeight === 0) {
        onError("Image could not be read.");
        return;
      }
      onSuccess({ naturalWidth, naturalHeight, objectUrl });
    };
    img.onerror = () => {
      onError("Image failed to load.");
    };
    img.src = objectUrl;
  }
  function bindImageUpload(fileInputEl, dropZoneEl, onSuccess, onError) {
    fileInputEl.addEventListener("change", () => {
      const file = fileInputEl.files?.[0];
      if (file) {
        processFile(file, onSuccess, onError);
      }
    });
    dropZoneEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZoneEl.classList.add("drag-over");
    });
    dropZoneEl.addEventListener("dragleave", () => {
      dropZoneEl.classList.remove("drag-over");
    });
    dropZoneEl.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZoneEl.classList.remove("drag-over");
      const file = e.dataTransfer?.files[0];
      if (file) {
        processFile(file, onSuccess, onError);
      }
    });
  }

  // src/canvasRenderer.ts
  var DOT_RADIUS = 6;
  var DOT_COLOR = "#3B82F6";
  var DOT_SELECTED = "#EF4444";
  var DOT_HOVER = "#F59E0B";
  var LABEL_FONT = "12px Arial";
  var LABEL_COLOR = "#1E3A5F";
  var hoveredPointId = null;
  function initCanvas(containerEl) {
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    containerEl.appendChild(canvas);
    return canvas;
  }
  function renderImage(containerEl, canvas, state) {
    if (!state.imageObjectUrl) {
      containerEl.style.backgroundImage = "";
      containerEl.style.width = "";
      containerEl.style.height = "";
      return;
    }
    const MAX = 800;
    const { imageNaturalWidth: w, imageNaturalHeight: h } = state;
    let displayW = w;
    let displayH = h;
    if (w > MAX || h > MAX) {
      const ratio = Math.min(MAX / w, MAX / h);
      displayW = Math.round(w * ratio);
      displayH = Math.round(h * ratio);
    }
    containerEl.style.position = "relative";
    containerEl.style.display = "inline-block";
    containerEl.style.backgroundImage = `url(${state.imageObjectUrl})`;
    containerEl.style.backgroundSize = "contain";
    containerEl.style.backgroundRepeat = "no-repeat";
    containerEl.style.backgroundPosition = "top left";
    containerEl.style.width = displayW + "px";
    containerEl.style.height = displayH + "px";
    canvas.width = containerEl.offsetWidth;
    canvas.height = containerEl.offsetHeight;
    renderDots(canvas, state);
  }
  function renderDots(canvas, state) {
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const point of state.points) {
      const px = point.xAnchor * canvas.width;
      const py = point.yAnchor * canvas.height;
      let fillColor;
      if (point.id === state.selectedPointId) {
        fillColor = DOT_SELECTED;
      } else if (point.id === hoveredPointId) {
        fillColor = DOT_HOVER;
      } else {
        fillColor = DOT_COLOR;
      }
      ctx.beginPath();
      ctx.arc(px, py, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.font = LABEL_FONT;
      ctx.shadowColor = "white";
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = LABEL_COLOR;
      ctx.fillText(point.pointName, px + 10, py + 4);
      ctx.shadowColor = "transparent";
    }
  }
  function setHoveredPoint(id) {
    hoveredPointId = id;
  }
  function getClickCoordinates(event, canvas, state) {
    if (state.imageNaturalWidth === 0)
      return null;
    const rect = canvas.getBoundingClientRect();
    const clickXRendered = event.clientX - rect.left;
    const clickYRendered = event.clientY - rect.top;
    const clickX = clickXRendered / canvas.width * state.imageNaturalWidth;
    const clickY = clickYRendered / canvas.height * state.imageNaturalHeight;
    return { clickX, clickY };
  }
  function updateTooltip(tooltipEl, state, event, canvas) {
    if (state.imageNaturalWidth === 0) {
      tooltipEl.style.display = "none";
      return;
    }
    const coords = getClickCoordinates(event, canvas, state);
    if (!coords) {
      tooltipEl.style.display = "none";
      return;
    }
    const { xAnchor, yAnchor } = calculateAnchor(
      coords.clickX,
      coords.clickY,
      state.imageNaturalWidth,
      state.imageNaturalHeight
    );
    tooltipEl.textContent = `x: ${xAnchor.toFixed(3)}  y: ${yAnchor.toFixed(3)}`;
    tooltipEl.style.left = event.clientX + 12 + "px";
    tooltipEl.style.top = event.clientY + 12 + "px";
    tooltipEl.style.display = "block";
  }

  // src/pointsPanel.ts
  function renderPointsPanel(panelEl, state, onDelete, onSelect, onHover, clearAll) {
    panelEl.innerHTML = "";
    const header = document.createElement("div");
    header.className = "panel-header";
    const dimsSpan = document.createElement("span");
    dimsSpan.className = "image-dimensions";
    if (state.imageNaturalWidth > 0) {
      dimsSpan.textContent = `W: ${state.imageNaturalWidth} px | H: ${state.imageNaturalHeight} px`;
    } else {
      dimsSpan.textContent = "No image loaded";
    }
    header.appendChild(dimsSpan);
    panelEl.appendChild(header);
    if (state.points.length === 0) {
      const emptyP = document.createElement("p");
      emptyP.className = "empty-state";
      emptyP.textContent = "No points yet. Click anywhere on the image to add one.";
      panelEl.appendChild(emptyP);
      return;
    }
    const ul = document.createElement("ul");
    ul.className = "points-list";
    const renderedPoints = [...state.points].reverse();
    renderedPoints.forEach((point) => {
      const originalIndex = state.points.findIndex((p) => p.id === point.id) + 1;
      const li = document.createElement("li");
      li.className = "point-row" + (point.id === state.selectedPointId ? " selected" : "");
      li.dataset.pointId = point.id;
      const dragHandle = document.createElement("span");
      dragHandle.className = "drag-handle";
      dragHandle.setAttribute("aria-label", "Drag to reorder");
      dragHandle.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>
      </svg>
    `;
      li.appendChild(dragHandle);
      const indexSpan = document.createElement("span");
      indexSpan.className = "point-index";
      indexSpan.textContent = String(originalIndex);
      li.appendChild(indexSpan);
      const nameSpan = document.createElement("span");
      nameSpan.className = "point-name";
      nameSpan.dataset.id = point.id;
      nameSpan.textContent = point.pointName;
      li.appendChild(nameSpan);
      const coordsSpan = document.createElement("span");
      coordsSpan.className = "point-coords";
      coordsSpan.textContent = `${point.xAnchor.toFixed(3)} , ${point.yAnchor.toFixed(3)}`;
      li.appendChild(coordsSpan);
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.setAttribute("aria-label", `Delete point ${point.pointName}`);
      deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    `;
      li.appendChild(deleteBtn);
      ul.appendChild(li);
    });
    panelEl.appendChild(ul);
    const clearAllBtn = document.createElement("button");
    clearAllBtn.className = "clear-all-btn";
    clearAllBtn.textContent = "Clear All Points";
    panelEl.appendChild(clearAllBtn);
    ul.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const li = btn.closest("li");
        const id = li?.dataset.pointId;
        if (id)
          onDelete(id);
      });
    });
    ul.querySelectorAll(".point-row").forEach((li) => {
      li.addEventListener("click", (e) => {
        const target = e.target;
        if (target.classList.contains("point-name")) {
          return;
        }
        const id = li.dataset.pointId;
        if (id)
          onSelect(id);
      });
      li.addEventListener("mouseenter", () => {
        const id = li.dataset.pointId;
        if (id)
          onHover(id);
      });
      li.addEventListener("mouseleave", () => {
        onHover(null);
      });
    });
    clearAllBtn.addEventListener("click", () => {
      clearAll();
    });
  }

  // src/inlineRename.ts
  function bindInlineRename(panelEl, getState, onCommit) {
    panelEl.addEventListener("click", (e) => {
      const target = e.target;
      if (!target.classList.contains("point-name"))
        return;
      const span = target;
      const id = span.dataset.id;
      if (!id)
        return;
      const currentName = span.textContent ?? "";
      const input = document.createElement("input");
      input.type = "text";
      input.className = "rename-input";
      input.value = currentName;
      input.style.width = span.offsetWidth + "px";
      let committed = false;
      function restoreSpan() {
        if (input.parentNode) {
          const restored = document.createElement("span");
          restored.className = "point-name";
          restored.dataset.id = id;
          restored.textContent = currentName;
          input.parentNode.replaceChild(restored, input);
        }
      }
      function showError(message) {
        const errorSpan = document.createElement("span");
        errorSpan.className = "rename-error";
        errorSpan.textContent = message;
        if (input.parentNode) {
          input.parentNode.replaceChild(errorSpan, input);
        }
        setTimeout(() => {
          if (errorSpan.parentNode) {
            const restored = document.createElement("span");
            restored.className = "point-name";
            restored.dataset.id = id;
            restored.textContent = currentName;
            errorSpan.parentNode.replaceChild(restored, errorSpan);
          }
        }, 1500);
      }
      function tryCommit() {
        if (committed)
          return;
        const trimmedName = input.value.trim();
        if (trimmedName === "") {
          committed = true;
          showError("Name cannot be empty");
          return;
        }
        const state = getState();
        if (isNameDuplicate(state, trimmedName, id)) {
          committed = true;
          showError("Name already in use");
          return;
        }
        committed = true;
        onCommit(id, trimmedName);
      }
      function cancelEdit() {
        if (committed)
          return;
        committed = true;
        restoreSpan();
      }
      input.addEventListener("keydown", (ke) => {
        if (ke.key === "Enter") {
          ke.preventDefault();
          tryCommit();
        } else if (ke.key === "Escape") {
          ke.preventDefault();
          cancelEdit();
        }
      });
      input.addEventListener("blur", () => {
        tryCommit();
      });
      span.parentNode?.replaceChild(input, span);
      input.focus();
      input.select();
    });
  }

  // src/dragReorder.ts
  var dragFromIndex = -1;
  var insertionLineEl = null;
  function bindDragReorder(listEl, onReorder) {
    const items = Array.from(listEl.querySelectorAll("li"));
    items.forEach((li, index) => {
      li.addEventListener("mousedown", (e) => {
        const target = e.target;
        if (target.classList.contains("drag-handle")) {
          li.draggable = true;
        } else {
          li.draggable = false;
        }
      });
      li.addEventListener("mouseup", () => {
        li.draggable = false;
      });
      li.addEventListener("dragstart", (e) => {
        dragFromIndex = index;
        li.classList.add("dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
        }
      });
      li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
        if (insertionLineEl && insertionLineEl.parentNode) {
          insertionLineEl.parentNode.removeChild(insertionLineEl);
        }
        insertionLineEl = null;
        dragFromIndex = -1;
        li.draggable = false;
      });
    });
    listEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const targetLi = target?.closest("li");
      if (!targetLi || !listEl.contains(targetLi))
        return;
      const rect = targetLi.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const isTopHalf = e.clientY < midY;
      if (!insertionLineEl) {
        insertionLineEl = document.createElement("div");
        insertionLineEl.className = "insertion-line";
      }
      if (isTopHalf) {
        listEl.insertBefore(insertionLineEl, targetLi);
      } else {
        listEl.insertBefore(insertionLineEl, targetLi.nextSibling);
      }
    });
    listEl.addEventListener("dragleave", (e) => {
      const related = e.relatedTarget;
      if (!related || !listEl.contains(related)) {
        if (insertionLineEl && insertionLineEl.parentNode) {
          insertionLineEl.parentNode.removeChild(insertionLineEl);
          insertionLineEl = null;
        }
      }
    });
    listEl.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!insertionLineEl)
        return;
      const allChildren = Array.from(listEl.children);
      const insertionIdx = allChildren.indexOf(insertionLineEl);
      let toIndex = 0;
      for (let i = 0; i < insertionIdx; i++) {
        if (allChildren[i].tagName === "LI") {
          toIndex++;
        }
      }
      if (insertionLineEl.parentNode) {
        insertionLineEl.parentNode.removeChild(insertionLineEl);
      }
      insertionLineEl = null;
      if (dragFromIndex !== -1 && dragFromIndex !== toIndex) {
        onReorder(dragFromIndex, toIndex);
      }
    });
  }

  // src/nameUnitControl.ts
  function renderNameUnitControl(containerEl, currentNameUnit, onChange) {
    const existingInput = containerEl.querySelector("#name-unit-input");
    if (existingInput && document.activeElement === existingInput) {
      return;
    }
    containerEl.innerHTML = "";
    const label = document.createElement("label");
    label.htmlFor = "name-unit-input";
    label.className = "name-unit-label";
    label.textContent = "Name unit:";
    containerEl.appendChild(label);
    const input = document.createElement("input");
    input.type = "text";
    input.id = "name-unit-input";
    input.className = "name-unit-input";
    input.value = currentNameUnit;
    input.maxLength = 32;
    input.setAttribute("aria-label", "Name unit for auto-generated point names");
    input.placeholder = "Point";
    containerEl.appendChild(input);
    input.addEventListener("change", () => {
      const trimmedValue = input.value.trim();
      onChange(trimmedValue);
    });
    input.addEventListener("input", () => {
      onChange(input.value);
    });
  }

  // src/exportEngine.ts
  function formatPoints(points, language) {
    switch (language) {
      case "json": {
        const items = points.map(
          (p) => `    { "pointName": "${p.pointName}", "xAnchor": ${p.xAnchor.toFixed(3)}, "yAnchor": ${p.yAnchor.toFixed(3)} }`
        );
        return `{
  "points": [
${items.join(",\n")}
  ]
}`;
      }
      case "dart": {
        const items = points.map(
          (p) => `  Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)}),`
        );
        return `final List<Points> points = [
${items.join("\n")}
];

class Points {
  final String pointName;
  final double xAnchor;
  final double yAnchor;
  const Points(this.pointName, this.xAnchor, this.yAnchor);
}`;
      }
      case "swift": {
        const items = points.map(
          (p) => `  Points(pointName: "${p.pointName}", xAnchor: ${p.xAnchor.toFixed(3)}, yAnchor: ${p.yAnchor.toFixed(3)}),`
        );
        return `let points: [Points] = [
${items.join("\n")}
]

struct Points {
  let pointName: String
  let xAnchor: Double
  let yAnchor: Double
}`;
      }
      case "java": {
        const items = points.map(
          (p) => `  new Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)})`
        );
        return `List<Points> points = Arrays.asList(
${items.join(",\n")}
);

public class Points {
  public String pointName;
  public double xAnchor;
  public double yAnchor;
  public Points(String pointName, double xAnchor, double yAnchor) {
    this.pointName = pointName;
    this.xAnchor = xAnchor;
    this.yAnchor = yAnchor;
  }
}`;
      }
      case "javascript": {
        const items = points.map(
          (p) => `  new Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)}),`
        );
        return `const points = [
${items.join("\n")}
];

class Points {
  constructor(pointName, xAnchor, yAnchor) {
    this.pointName = pointName;
    this.xAnchor = xAnchor;
    this.yAnchor = yAnchor;
  }
}`;
      }
      case "typescript": {
        const items = points.map(
          (p) => `  { pointName: "${p.pointName}", xAnchor: ${p.xAnchor.toFixed(3)}, yAnchor: ${p.yAnchor.toFixed(3)} },`
        );
        return `interface IPoints { pointName: string; xAnchor: number; yAnchor: number; }

const points: IPoints[] = [
${items.join("\n")}
];`;
      }
      case "kotlin": {
        const items = points.map(
          (p) => `  Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)}),`
        );
        return `val points = listOf(
${items.join("\n")}
)

data class Points(val pointName: String, val xAnchor: Double, val yAnchor: Double)`;
      }
      case "python": {
        const items = points.map(
          (p) => `  Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)}),`
        );
        return `from dataclasses import dataclass
from typing import List

@dataclass
class Points:
  point_name: str
  x_anchor: float
  y_anchor: float

points: List[Points] = [
${items.join("\n")}
]`;
      }
      case "csharp": {
        const items = points.map(
          (p) => `  new Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)}),`
        );
        return `var points = new List<Points> {
${items.join("\n")}
};

public record Points(string PointName, double XAnchor, double YAnchor);`;
      }
    }
  }
  function getFileExtension(language) {
    const map = {
      json: ".json",
      dart: ".dart",
      swift: ".swift",
      java: ".java",
      javascript: ".js",
      typescript: ".ts",
      kotlin: ".kt",
      python: ".py",
      csharp: ".cs"
    };
    return map[language];
  }
  function downloadFile(content, language) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "points" + getFileExtension(language);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // src/exportModal.ts
  var currentLanguage = "json";
  var LANGUAGE_LABELS = {
    json: "JSON",
    dart: "Dart",
    swift: "Swift",
    java: "Java",
    javascript: "JavaScript",
    typescript: "TypeScript",
    kotlin: "Kotlin",
    python: "Python",
    csharp: "C#"
  };
  function renderExportControls(controlsEl, getPoints) {
    controlsEl.innerHTML = "";
    const select = document.createElement("select");
    select.id = "export-language-select";
    select.setAttribute("aria-label", "Export language");
    const languages = [
      "json",
      "dart",
      "swift",
      "java",
      "javascript",
      "typescript",
      "kotlin",
      "python",
      "csharp"
    ];
    languages.forEach((lang) => {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = LANGUAGE_LABELS[lang];
      if (lang === currentLanguage)
        option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener("change", (e) => {
      currentLanguage = e.target.value;
    });
    controlsEl.appendChild(select);
    const exportBtn = document.createElement("button");
    exportBtn.id = "export-btn";
    exportBtn.textContent = "Export Data";
    exportBtn.addEventListener("click", () => {
      openExportModal(getPoints(), currentLanguage);
    });
    controlsEl.appendChild(exportBtn);
  }
  function openExportModal(points, language) {
    const formattedCode = formatPoints(points, language);
    const label = LANGUAGE_LABELS[language];
    const overlay = document.createElement("div");
    overlay.id = "export-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Export data");
    overlay.innerHTML = `
    <div class="modal-box">
      <h2>Export \u2014 ${label}</h2>
      <pre class="code-preview"><code></code></pre>
      <div class="modal-actions">
        <button id="copy-btn">Copy to Clipboard</button>
        <button id="download-btn">Download</button>
        <button id="close-modal-btn">Close</button>
      </div>
    </div>
  `;
    const codeEl = overlay.querySelector("code");
    codeEl.textContent = formattedCode;
    document.body.appendChild(overlay);
    function closeModal() {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      document.removeEventListener("keydown", escHandler);
    }
    const copyBtn = overlay.querySelector("#copy-btn");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(formattedCode).then(() => {
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = "Copy to Clipboard";
        }, 2e3);
      });
    });
    overlay.querySelector("#download-btn").addEventListener("click", () => {
      downloadFile(formattedCode, language);
    });
    overlay.querySelector("#close-modal-btn").addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
    function escHandler(e) {
      if (e.key === "Escape" && overlay.parentNode) {
        closeModal();
      }
    }
    document.addEventListener("keydown", escHandler);
  }

  // src/navigationGuard.ts
  var boundHandler = null;
  function bindNavigationGuard(getState) {
    boundHandler = (e) => {
      const state = getState();
      if (state.points.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", boundHandler);
  }

  // src/toast.ts
  function showToast(message, duration = 3e3) {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.textContent = message;
    toast.setAttribute("role", "alert");
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add("visible");
    });
    setTimeout(() => {
      toast.classList.remove("visible");
      toast.addEventListener("transitionend", () => {
        toast.remove();
      }, { once: true });
    }, duration);
  }

  // src/main.ts
  function runAccuracyCheck() {
    console.log("ACCURACY CHECK");
    const cases = [
      { x: 600, y: 600, w: 1200, h: 1200, ex: 0.5, ey: 0.5 },
      { x: 0, y: 0, w: 1200, h: 1200, ex: 0, ey: 0 },
      { x: 123, y: 456, w: 1e3, h: 1e3, ex: 0.123, ey: 0.456 },
      { x: 1, y: 1, w: 3, h: 3, ex: 0.333, ey: 0.333 }
    ];
    cases.forEach((c, i) => {
      const result = calculateAnchor(c.x, c.y, c.w, c.h);
      const pass = result.xAnchor === c.ex && result.yAnchor === c.ey;
      console.log(`Case ${i + 1}: ${pass ? "PASS" : "FAIL"} (got x=${result.xAnchor}, y=${result.yAnchor}; expected x=${c.ex}, y=${c.ey})`);
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    if (window.location.search.includes("test=1")) {
      runAccuracyCheck();
    }
    const fileInputEl = document.getElementById("file-input");
    const dropZoneEl = document.getElementById("upload-zone");
    const containerEl = document.getElementById("image-container");
    const panelEl = document.getElementById("points-panel");
    const exportControlsEl = document.getElementById("export-controls");
    const tooltipEl = document.getElementById("coordinate-tooltip");
    const imageContainerEl = document.getElementById("image-container");
    const resetBtnEl = document.getElementById("reset-image-btn");
    const canvas = initCanvas(containerEl);
    let state = createInitialState();
    function setState(newState) {
      state = newState;
      render();
    }
    function render() {
      renderImage(containerEl, canvas, state);
      renderDots(canvas, state);
      renderPointsPanel(panelEl, state, handleDelete, handleSelect, handleHover, handleClearAll);
      if (state.imageNaturalWidth > 0) {
        dropZoneEl.style.display = "none";
        imageContainerEl.style.display = "flex";
        resetBtnEl.style.display = "flex";
      } else {
        dropZoneEl.style.display = "flex";
        imageContainerEl.style.display = "none";
        resetBtnEl.style.display = "none";
      }
      const nameUnitContainer = document.getElementById("name-unit-container");
      if (nameUnitContainer) {
        renderNameUnitControl(nameUnitContainer, state.nameUnit, handleNameUnitChange);
      }
      const listEl = panelEl.querySelector(".points-list");
      if (listEl)
        bindDragReorder(listEl, handleReorder);
    }
    function handleDelete(id) {
      setState(deletePoint(state, id));
    }
    function handleSelect(id) {
      setState(selectPoint(state, id));
    }
    function handleHover(id) {
      setHoveredPoint(id);
      renderDots(canvas, state);
    }
    function handleRename(id, name) {
      setState(renamePoint(state, id, name));
    }
    function handleReorder(from, to) {
      setState(reorderPoints(state, from, to));
    }
    function handleNameUnitChange(unit) {
      setState(setNameUnit(state, unit));
    }
    function handleClearAll() {
      if (confirm("Delete all points?")) {
        setState({ ...state, points: [], selectedPointId: null });
      }
    }
    function handleReset() {
      if (confirm("Deselect image and remove all points?")) {
        setState(resetState());
      }
    }
    resetBtnEl.addEventListener("click", handleReset);
    canvas.addEventListener("click", (e) => {
      const coords = getClickCoordinates(e, canvas, state);
      if (!coords)
        return;
      const { xAnchor, yAnchor } = calculateAnchor(
        coords.clickX,
        coords.clickY,
        state.imageNaturalWidth,
        state.imageNaturalHeight
      );
      const duplicate = state.points.find((p) => p.xAnchor === xAnchor && p.yAnchor === yAnchor);
      if (duplicate) {
        showToast("Identical point already exists");
        handleSelect(duplicate.id);
        return;
      }
      setState(addPoint(state, xAnchor, yAnchor));
    });
    containerEl.style.cursor = "crosshair";
    canvas.style.pointerEvents = "auto";
    canvas.style.cursor = "crosshair";
    canvas.addEventListener("mousemove", (e) => {
      updateTooltip(tooltipEl, state, e, canvas);
    });
    canvas.addEventListener("mouseleave", () => {
      tooltipEl.style.display = "none";
    });
    imageContainerEl.addEventListener("keydown", (e) => {
      if (state.imageNaturalWidth === 0)
        return;
      if (e.key === "Enter" || e.key === " ") {
        imageContainerEl.setAttribute(
          "aria-description",
          "Use mouse click to place anchor points precisely on the image."
        );
      }
    });
    bindImageUpload(
      fileInputEl,
      dropZoneEl,
      (info) => setState(setImage(state, info)),
      (msg) => alert(msg)
    );
    renderExportControls(exportControlsEl, () => state.points);
    bindInlineRename(panelEl, () => state, handleRename);
    bindNavigationGuard(() => state);
    panelEl.addEventListener("click", (e) => {
      const target = e.target;
      if (target.classList.contains("clear-all-btn")) {
        handleClearAll();
      }
    });
    render();
  });
})();
//# sourceMappingURL=bundle.js.map
