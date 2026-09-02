(() => {
  "use strict";

  const STORAGE_KEY = "volare-journey-workshop-v1";
  const DB_NAME = "volare-journey-workshop-files";
  const DB_VERSION = 1;
  const FILE_STORE = "attachments";

  const BASE_ROWS = [
    {
      id: "action",
      label: "Acción del huésped",
      prompt: "Los momentos están marcados por la acción del cliente.",
      placeholder: "¿Qué hace concretamente el huésped en este momento?",
    },
    {
      id: "touchpoint",
      label: "Punto de contacto",
      prompt: "Canal, persona, espacio u objeto con el que interactúa.",
      placeholder: "¿Con qué o con quién interactúa?",
    },
    {
      id: "expectation",
      label: "Expectativa emocional",
      prompt: "Lo que espera resolver y cómo espera sentirse.",
      placeholder: "¿Qué espera lograr, evitar o sentir?",
    },
    {
      id: "reality",
      label: "Realidad / hipótesis",
      prompt: "La experiencia que podría recibir hoy o al momento de abrir.",
      placeholder: "¿Qué podría vivir realmente? ¿Qué fricción imaginamos?",
    },
    {
      id: "emotion",
      label: "Curva emocional",
      prompt: "¿Cómo se siente en este momento? Seleccioná cada punto.",
      type: "emotion",
    },
    {
      id: "process",
      label: "Proceso",
      prompt: "Lo que debe ocurrir detrás de escena para sostener el momento.",
      placeholder: "¿Qué proceso debería hacer posible esta experiencia?",
    },
    {
      id: "place",
      label: "Lugar / detalles",
      prompt: "Espacio, ambientación, señalización y detalles físicos.",
      placeholder: "¿Qué debe aportar el lugar? ¿Qué detalles importan?",
    },
    {
      id: "people",
      label: "Personas / roles",
      prompt: "Actores que influyen directa o indirectamente.",
      placeholder: "¿Quién interviene y qué responsabilidad tiene?",
    },
    {
      id: "culture",
      label: "Cultura / comportamiento",
      prompt: "Cómo deberían pensar, decidir y actuar las personas.",
      placeholder: "¿Qué comportamiento debería poder observarse?",
    },
    {
      id: "indicators",
      label: "Indicadores / señales",
      prompt: "Evidencias que permiten saber si el momento funciona.",
      placeholder: "¿Qué dato, señal o conducta mostraría que funciona?",
    },
    {
      id: "opportunities",
      label: "Oportunidades / proyectos",
      prompt: "Mejoras, pruebas o decisiones que surgen del análisis.",
      placeholder: "¿Qué debemos crear, corregir o probar? ¿Con qué prioridad?",
    },
    {
      id: "attachments",
      label: "Adjuntos",
      prompt: "Fotos, planos, notas u otras evidencias del momento.",
      type: "attachments",
    },
  ];

  const EMOTIONS = {
    3: { label: "WOW", color: "#3b82f6", y: 55 },
    2: { label: "Satisfecho", color: "#3fa66b", y: 115 },
    1: { label: "Neutro", color: "#e6b84b", y: 175 },
    0: { label: "Insatisfecho", color: "#cf5248", y: 235 },
  };

  const board = document.getElementById("journeyBoard");
  const saveStatus = document.getElementById("saveStatus");
  const toast = document.getElementById("toast");
  const emotionMenu = document.getElementById("emotionMenu");
  const customRowDialog = document.getElementById("customRowDialog");
  const customRowForm = document.getElementById("customRowForm");
  let activeEmotionMomentId = null;
  let saveTimer = null;
  let toastTimer = null;

  function uid(prefix = "id") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function createBlankState() {
    const moments = Array.from({ length: 6 }, (_, index) => ({
      id: uid("moment"),
      title: `Momento ${index + 1}`,
    }));
    const rows = BASE_ROWS.map((row) => ({ ...row }));
    const cells = {};
    rows.forEach((row) => {
      if (!row.type) {
        cells[row.id] = Object.fromEntries(moments.map((moment) => [moment.id, ""]));
      }
    });
    return {
      version: 1,
      metadata: { sessionName: "", participants: "", sessionDate: "" },
      moments,
      rows,
      cells,
      emotions: Object.fromEntries(moments.map((moment) => [moment.id, null])),
      attachments: Object.fromEntries(moments.map((moment) => [moment.id, []])),
      updatedAt: new Date().toISOString(),
    };
  }

  function normalizeState(candidate) {
    if (!candidate || !Array.isArray(candidate.moments) || !candidate.moments.length) {
      return createBlankState();
    }
    const normalized = {
      version: 1,
      metadata: {
        sessionName: candidate.metadata?.sessionName || "",
        participants: candidate.metadata?.participants || "",
        sessionDate: candidate.metadata?.sessionDate || "",
      },
      moments: candidate.moments.map((moment, index) => ({
        id: moment.id || uid("moment"),
        title: typeof moment.title === "string" ? moment.title : `Momento ${index + 1}`,
      })),
      rows: Array.isArray(candidate.rows) && candidate.rows.length
        ? candidate.rows.map((row) => ({ ...row }))
        : BASE_ROWS.map((row) => ({ ...row })),
      cells: candidate.cells && typeof candidate.cells === "object" ? candidate.cells : {},
      emotions: candidate.emotions && typeof candidate.emotions === "object" ? candidate.emotions : {},
      attachments: candidate.attachments && typeof candidate.attachments === "object" ? candidate.attachments : {},
      updatedAt: candidate.updatedAt || new Date().toISOString(),
    };

    normalized.rows.forEach((row) => {
      if (!row.type) {
        normalized.cells[row.id] ||= {};
        normalized.moments.forEach((moment) => {
          if (typeof normalized.cells[row.id][moment.id] !== "string") {
            normalized.cells[row.id][moment.id] = "";
          }
        });
      }
    });
    normalized.moments.forEach((moment) => {
      if (!(moment.id in normalized.emotions)) normalized.emotions[moment.id] = null;
      if (!Array.isArray(normalized.attachments[moment.id])) normalized.attachments[moment.id] = [];
    });
    return normalized;
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? normalizeState(JSON.parse(stored)) : createBlankState();
    } catch (error) {
      console.error("No se pudo abrir el guardado local", error);
      return createBlankState();
    }
  }

  let state = loadState();

  function markSaving() {
    saveStatus.classList.add("saving");
    saveStatus.lastChild.textContent = " Guardando…";
  }

  function persistNow() {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveStatus.classList.remove("saving");
    const time = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    saveStatus.lastChild.textContent = ` Guardado ${time}`;
  }

  function scheduleSave() {
    markSaving();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistNow, 320);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    board.style.setProperty("--moment-count", state.moments.length);
    board.innerHTML = "";
    board.appendChild(renderMomentsRow());
    state.rows.forEach((row, index) => {
      board.appendChild(row.type === "emotion" ? renderEmotionRow(row, index) : renderDataRow(row, index));
    });
    updateMetadataInputs();
  }

  function renderMomentsRow() {
    const row = document.createElement("div");
    row.className = "board-row moments-row";
    row.innerHTML = `
      <div class="row-label">
        <strong>Momentos del journey</strong>
        <span>Nombrarlos desde la acción del huésped. Ej.: “Busca dónde estacionar”.</span>
      </div>
    `;

    state.moments.forEach((moment, index) => {
      const cell = document.createElement("div");
      cell.className = "board-cell moment-header";
      cell.innerHTML = `
        <span class="moment-number">MOMENTO ${String(index + 1).padStart(2, "0")}</span>
        <input
          class="moment-title"
          type="text"
          value="${escapeHtml(moment.title)}"
          placeholder="Nombrar momento"
          aria-label="Nombre del momento ${index + 1}"
        />
        <div class="moment-controls" aria-label="Ordenar momento">
          <button type="button" data-action="left" title="Mover a la izquierda" ${index === 0 ? "disabled" : ""}>←</button>
          <button type="button" data-action="right" title="Mover a la derecha" ${index === state.moments.length - 1 ? "disabled" : ""}>→</button>
          <button type="button" data-action="duplicate" title="Duplicar momento">Duplicar</button>
          <button type="button" data-action="delete" title="Eliminar momento">×</button>
        </div>
      `;
      cell.querySelector("input").addEventListener("input", (event) => {
        moment.title = event.target.value;
        scheduleSave();
      });
      cell.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => handleMomentAction(button.dataset.action, index));
      });
      row.appendChild(cell);
    });
    return row;
  }

  function renderRowLabel(rowData, index) {
    const label = document.createElement("div");
    label.className = "row-label";
    const customActions = rowData.custom
      ? `<div class="custom-row-actions">
          <button type="button" data-row-action="up" title="Subir fila">↑</button>
          <button type="button" data-row-action="down" title="Bajar fila">↓</button>
          <button type="button" data-row-action="delete" title="Eliminar fila">Eliminar</button>
        </div>`
      : "";
    label.innerHTML = `
      <i class="row-index">${String(index + 1).padStart(2, "0")}</i>
      <strong>${escapeHtml(rowData.label)}</strong>
      <span>${escapeHtml(rowData.prompt || "")}</span>
      ${customActions}
    `;
    if (rowData.custom) {
      label.querySelectorAll("[data-row-action]").forEach((button) => {
        button.addEventListener("click", () => handleRowAction(button.dataset.rowAction, rowData.id));
      });
    }
    return label;
  }

  function renderDataRow(rowData, index) {
    const row = document.createElement("div");
    row.className = `board-row ${rowData.type === "attachments" ? "attachments-row" : ""}`;
    row.appendChild(renderRowLabel(rowData, index));

    state.moments.forEach((moment) => {
      const cell = document.createElement("div");
      cell.className = "board-cell";
      if (rowData.type === "attachments") {
        renderAttachmentCell(cell, moment.id);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = state.cells[rowData.id]?.[moment.id] || "";
        textarea.placeholder = rowData.placeholder || "Escribir aquí…";
        textarea.setAttribute("aria-label", `${rowData.label}, ${moment.title}`);
        textarea.addEventListener("input", (event) => {
          state.cells[rowData.id][moment.id] = event.target.value;
          scheduleSave();
        });
        cell.appendChild(textarea);
      }
      row.appendChild(cell);
    });
    return row;
  }

  function renderEmotionRow(rowData, index) {
    const row = document.createElement("div");
    row.className = "board-row emotion-row";
    const label = renderRowLabel(rowData, index);
    const scale = document.createElement("div");
    scale.className = "emotion-scale";
    scale.innerHTML = `
      <span><i class="emotion-wow"></i>WOW</span>
      <span><i class="emotion-satisfied"></i>Satisfecho</span>
      <span><i class="emotion-neutral"></i>Neutro</span>
      <span><i class="emotion-unsatisfied"></i>Insatisfecho</span>
    `;
    label.appendChild(scale);
    row.appendChild(label);

    state.moments.forEach((moment) => {
      const value = state.emotions[moment.id];
      const emotion = value === null || value === undefined ? null : EMOTIONS[value];
      const cell = document.createElement("div");
      cell.className = "board-cell emotion-cell";
      const point = document.createElement("button");
      point.type = "button";
      point.className = `emotion-point ${emotion ? "" : "is-empty"}`;
      point.style.top = `${emotion ? emotion.y : 145}px`;
      if (emotion) point.style.background = emotion.color;
      point.title = emotion ? emotion.label : "Seleccionar emoción";
      point.setAttribute("aria-label", `${moment.title}: ${emotion ? emotion.label : "sin emoción seleccionada"}`);
      point.addEventListener("click", (event) => openEmotionMenu(event.currentTarget, moment.id));
      cell.appendChild(point);
      row.appendChild(cell);
    });

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("emotion-svg");
    svg.setAttribute("viewBox", `0 0 ${state.moments.length * 300} 280`);
    svg.setAttribute("preserveAspectRatio", "none");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("emotion-line");
    path.setAttribute("d", emotionPath());
    svg.appendChild(path);
    row.appendChild(svg);
    return row;
  }

  function emotionPath() {
    let d = "";
    let activeSegment = false;
    state.moments.forEach((moment, index) => {
      const value = state.emotions[moment.id];
      if (value === null || value === undefined || !EMOTIONS[value]) {
        activeSegment = false;
        return;
      }
      const x = index * 300 + 150;
      const y = EMOTIONS[value].y;
      d += `${activeSegment ? " L" : " M"} ${x} ${y}`;
      activeSegment = true;
    });
    return d;
  }

  function handleMomentAction(action, index) {
    const moment = state.moments[index];
    if (!moment) return;
    if (action === "left" && index > 0) {
      [state.moments[index - 1], state.moments[index]] = [state.moments[index], state.moments[index - 1]];
    }
    if (action === "right" && index < state.moments.length - 1) {
      [state.moments[index + 1], state.moments[index]] = [state.moments[index], state.moments[index + 1]];
    }
    if (action === "duplicate") {
      const duplicated = { id: uid("moment"), title: `${moment.title || "Momento"} (copia)` };
      state.moments.splice(index + 1, 0, duplicated);
      state.rows.forEach((row) => {
        if (!row.type) {
          state.cells[row.id][duplicated.id] = state.cells[row.id][moment.id] || "";
        }
      });
      state.emotions[duplicated.id] = state.emotions[moment.id] ?? null;
      state.attachments[duplicated.id] = [];
    }
    if (action === "delete") {
      if (state.moments.length === 1) {
        showToast("El tablero necesita al menos un momento.");
        return;
      }
      if (!confirm(`¿Eliminar “${moment.title || "este momento"}” y todo su contenido?`)) return;
      state.moments.splice(index, 1);
      state.rows.forEach((row) => {
        if (!row.type) delete state.cells[row.id][moment.id];
      });
      delete state.emotions[moment.id];
      (state.attachments[moment.id] || []).forEach((file) => deleteFileFromDb(file.id));
      delete state.attachments[moment.id];
    }
    scheduleSave();
    render();
  }

  function addMoment() {
    const moment = { id: uid("moment"), title: `Momento ${state.moments.length + 1}` };
    state.moments.push(moment);
    state.rows.forEach((row) => {
      if (!row.type) state.cells[row.id][moment.id] = "";
    });
    state.emotions[moment.id] = null;
    state.attachments[moment.id] = [];
    scheduleSave();
    render();
    requestAnimationFrame(() => {
      document.getElementById("boardScroll").scrollTo({ left: 99999, behavior: "smooth" });
    });
  }

  function handleRowAction(action, rowId) {
    const index = state.rows.findIndex((row) => row.id === rowId);
    if (index < 0) return;
    if (action === "up" && index > 0) {
      [state.rows[index - 1], state.rows[index]] = [state.rows[index], state.rows[index - 1]];
    }
    if (action === "down" && index < state.rows.length - 1) {
      [state.rows[index + 1], state.rows[index]] = [state.rows[index], state.rows[index + 1]];
    }
    if (action === "delete") {
      if (!confirm(`¿Eliminar la fila “${state.rows[index].label}”?`)) return;
      delete state.cells[rowId];
      state.rows.splice(index, 1);
    }
    scheduleSave();
    render();
  }

  function openEmotionMenu(anchor, momentId) {
    activeEmotionMomentId = momentId;
    const rect = anchor.getBoundingClientRect();
    emotionMenu.hidden = false;
    const menuWidth = 180;
    const left = Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.left + rect.width / 2 - menuWidth / 2));
    const estimatedHeight = 190;
    const top = rect.bottom + estimatedHeight > window.innerHeight ? rect.top - estimatedHeight - 6 : rect.bottom + 6;
    emotionMenu.style.left = `${left}px`;
    emotionMenu.style.top = `${Math.max(12, top)}px`;
  }

  emotionMenu.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-emotion]");
    if (!button || !activeEmotionMomentId) return;
    state.emotions[activeEmotionMomentId] = button.dataset.emotion === "clear" ? null : Number(button.dataset.emotion);
    emotionMenu.hidden = true;
    activeEmotionMomentId = null;
    scheduleSave();
    render();
  });

  document.addEventListener("click", (event) => {
    if (!emotionMenu.hidden && !emotionMenu.contains(event.target) && !event.target.closest(".emotion-point")) {
      emotionMenu.hidden = true;
      activeEmotionMomentId = null;
    }
  });

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(FILE_STORE)) db.createObjectStore(FILE_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function putFileInDb(record) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(FILE_STORE, "readwrite");
      transaction.objectStore(FILE_STORE).put(record);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }

  async function getFileFromDb(id) {
    const db = await openDb();
    const result = await new Promise((resolve, reject) => {
      const request = db.transaction(FILE_STORE, "readonly").objectStore(FILE_STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  }

  async function deleteFileFromDb(id) {
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(FILE_STORE, "readwrite");
        transaction.objectStore(FILE_STORE).delete(id);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    } catch (error) {
      console.error("No se pudo eliminar el adjunto", error);
    }
  }

  function renderAttachmentCell(cell, momentId) {
    const list = document.createElement("div");
    list.className = "attachments-list";
    (state.attachments[momentId] || []).forEach((file) => {
      const chip = document.createElement("div");
      chip.className = "attachment-chip";
      chip.innerHTML = `<a href="#" title="Abrir ${escapeHtml(file.name)}">${escapeHtml(file.name)}</a><button type="button" title="Eliminar adjunto">×</button>`;
      chip.querySelector("a").addEventListener("click", async (event) => {
        event.preventDefault();
        const record = await getFileFromDb(file.id);
        if (!record?.blob) {
          showToast("Este adjunto no está disponible en este navegador.");
          return;
        }
        const url = URL.createObjectURL(record.blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      });
      chip.querySelector("button").addEventListener("click", async () => {
        await deleteFileFromDb(file.id);
        state.attachments[momentId] = state.attachments[momentId].filter((item) => item.id !== file.id);
        scheduleSave();
        render();
      });
      list.appendChild(chip);
    });
    cell.appendChild(list);

    const label = document.createElement("label");
    label.className = "attachment-add";
    label.innerHTML = `+ Adjuntar archivo<input type="file" multiple />`;
    label.querySelector("input").addEventListener("change", async (event) => {
      const files = [...event.target.files];
      if (!files.length) return;
      for (const file of files) {
        const id = uid("file");
        await putFileInDb({ id, blob: file });
        state.attachments[momentId].push({ id, name: file.name, type: file.type, size: file.size });
      }
      scheduleSave();
      render();
      showToast(`${files.length} archivo${files.length === 1 ? " adjuntado" : "s adjuntados"}.`);
    });
    cell.appendChild(label);
  }

  function updateMetadataInputs() {
    document.getElementById("sessionName").value = state.metadata.sessionName;
    document.getElementById("participants").value = state.metadata.participants;
    document.getElementById("sessionDate").value = state.metadata.sessionDate;
  }

  ["sessionName", "participants", "sessionDate"].forEach((id) => {
    document.getElementById(id).addEventListener("input", (event) => {
      state.metadata[id] = event.target.value;
      scheduleSave();
    });
  });

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function slugify(value) {
    return (value || "volare-journey-workshop")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "volare-journey-workshop";
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function exportBackup() {
    persistNow();
    const files = [];
    for (const moment of state.moments) {
      for (const meta of state.attachments[moment.id] || []) {
        const record = await getFileFromDb(meta.id);
        if (record?.blob) files.push({ id: meta.id, dataUrl: await blobToDataUrl(record.blob) });
      }
    }
    const payload = { format: "volare-journey-workshop", exportedAt: new Date().toISOString(), state, files };
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
      `${slugify(state.metadata.sessionName)}.json`,
    );
    showToast("Respaldo descargado con el contenido y los adjuntos.");
  }

  async function dataUrlToBlob(dataUrl) {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  async function importBackup(file) {
    try {
      const payload = JSON.parse(await file.text());
      const importedState = payload.state || payload;
      state = normalizeState(importedState);
      if (Array.isArray(payload.files)) {
        for (const record of payload.files) {
          if (record.id && record.dataUrl) await putFileInDb({ id: record.id, blob: await dataUrlToBlob(record.dataUrl) });
        }
      }
      persistNow();
      render();
      showToast("Respaldo abierto correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo abrir el respaldo. Verificá que sea un archivo JSON exportado desde este tablero.");
    }
  }

  function exportCsv() {
    const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const lines = [];
    lines.push(["Dimensión", ...state.moments.map((moment) => moment.title)].map(quote).join(","));
    state.rows.forEach((row) => {
      if (row.type === "emotion") {
        lines.push([row.label, ...state.moments.map((moment) => {
          const value = state.emotions[moment.id];
          return value === null || value === undefined ? "" : EMOTIONS[value]?.label || "";
        })].map(quote).join(","));
      } else if (row.type === "attachments") {
        lines.push([row.label, ...state.moments.map((moment) => (state.attachments[moment.id] || []).map((file) => file.name).join(" | "))].map(quote).join(","));
      } else {
        lines.push([row.label, ...state.moments.map((moment) => state.cells[row.id]?.[moment.id] || "")].map(quote).join(","));
      }
    });
    downloadBlob(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" }), `${slugify(state.metadata.sessionName)}.csv`);
    showToast("CSV exportado.");
  }

  document.getElementById("addMomentBtn").addEventListener("click", addMoment);
  document.getElementById("addRowBtn").addEventListener("click", () => {
    customRowForm.reset();
    customRowDialog.showModal();
    document.getElementById("customRowName").focus();
  });
  document.getElementById("cancelRowBtn").addEventListener("click", () => customRowDialog.close());
  customRowForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("customRowName").value.trim();
    if (!name) return;
    const id = uid("row");
    const prompt = document.getElementById("customRowPrompt").value.trim();
    state.rows.splice(Math.max(0, state.rows.length - 1), 0, {
      id,
      label: name,
      prompt,
      placeholder: prompt || "Escribir aquí…",
      custom: true,
    });
    state.cells[id] = Object.fromEntries(state.moments.map((moment) => [moment.id, ""]));
    customRowDialog.close();
    scheduleSave();
    render();
  });
  document.getElementById("expandBtn").addEventListener("click", (event) => {
    document.body.classList.toggle("expanded");
    event.currentTarget.textContent = document.body.classList.contains("expanded") ? "Vista compacta" : "Expandir todo";
  });
  document.getElementById("presentationBtn").addEventListener("click", () => {
    document.body.classList.add("presentation");
    showToast("Modo presentación. Presioná Esc para salir.");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.body.classList.remove("presentation");
      emotionMenu.hidden = true;
      activeEmotionMomentId = null;
    }
  });
  document.getElementById("exportJsonBtn").addEventListener("click", exportBackup);
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", (event) => {
    if (event.target.files[0]) importBackup(event.target.files[0]);
    event.target.value = "";
  });
  document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);
  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("¿Vaciar todo el tablero y volver a la plantilla inicial? Antes podés descargar un respaldo.")) return;
    Object.values(state.attachments).flat().forEach((file) => deleteFileFromDb(file.id));
    state = createBlankState();
    persistNow();
    render();
    showToast("Tablero vacío y listo para un nuevo workshop.");
  });

  window.addEventListener("beforeunload", () => {
    if (saveTimer) persistNow();
  });

  render();
  persistNow();
})();
