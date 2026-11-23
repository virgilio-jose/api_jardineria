const contentArea = document.getElementById("content-area");
const alertBox = document.getElementById("alert-box");
const tabs = document.querySelectorAll(".tab-btn");

let currentTab = "clientes";
let editingItemId = null;
let cachedItems = [];
let filterReferences = { clientes: [], empleados: [], servicios: [] };
let activeFilters = {
  clientes: {},
  empleados: {},
  servicios: {},
  ordenes: {},
};

const TITLES = {
  clientes: "Clientes",
  empleados: "Empleados",
  servicios: "Servicios",
  ordenes: "Órdenes",
};

const COLUMN_LABELS = {
  id: "ID",
  nombre: "Nombre",
  telefono: "Teléfono",
  direccion: "Dirección",
  email: "Correo",
  activo: "Estado",
  cargo: "Cargo",
  estado: "Estado",
  descripcion: "Descripción",
  precio_base: "Precio base",
  cliente_id: "Cliente",
  empleado_id: "Empleado",
  servicio_id: "Servicio",
  fecha_programada: "Fecha programada",
  total: "Total",
  notas: "Notas",
  creada_en: "Creada",
};

const FILTER_FIELDS = {
  clientes: [
    { key: "nombre", label: "Cliente" },
    { key: "telefono", label: "Teléfono" },
    { key: "email", label: "Correo" },
    { key: "activo", label: "Estado", valueType: "boolean" },
  ],
  empleados: [
    { key: "nombre", label: "Empleado" },
    { key: "cargo", label: "Cargo" },
    { key: "estado", label: "Estado" },
  ],
  servicios: [
    { key: "nombre", label: "Servicio" },
    { key: "precio_base", label: "Precio base" },
    { key: "activo", label: "Estado", valueType: "boolean" },
  ],
  ordenes: [
    { key: "cliente_id", label: "Cliente", optionsFor: "clientes" },
    { key: "servicio_id", label: "Servicio", optionsFor: "servicios" },
    { key: "empleado_id", label: "Empleado", optionsFor: "empleados" },
    { key: "estado", label: "Estado" },
  ],
};

const FORM_FIELDS = {
  clientes: [
    { name: "nombre", label: "Nombre", type: "text", required: true },
    { name: "telefono", label: "Teléfono", type: "tel" },
    { name: "direccion", label: "Dirección", type: "text" },
    { name: "email", label: "Correo electrónico", type: "email" },
    {
      name: "activo",
      label: "Estado",
      type: "select",
      valueType: "boolean",
      defaultValue: true,
      options: [
        { value: true, label: "Activo" },
        { value: false, label: "Inactivo" },
      ],
    },
  ],
  empleados: [
    { name: "nombre", label: "Nombre", type: "text", required: true },
    { name: "cargo", label: "Cargo", type: "text", required: true },
    { name: "telefono", label: "Teléfono", type: "tel" },
    {
      name: "estado",
      label: "Estado",
      type: "select",
      defaultValue: "Disponible",
      options: [
        { value: "Disponible", label: "Disponible" },
        { value: "Asignado", label: "Asignado" },
        { value: "Inactivo", label: "Inactivo" },
      ],
    },
  ],
  servicios: [
    { name: "nombre", label: "Nombre", type: "text", required: true },
    { name: "descripcion", label: "Descripción", type: "textarea" },
    {
      name: "precio_base",
      label: "Precio base",
      type: "number",
      required: true,
      min: "0",
      step: "0.01",
    },
    {
      name: "activo",
      label: "Estado",
      type: "select",
      valueType: "boolean",
      defaultValue: true,
      options: [
        { value: true, label: "Activo" },
        { value: false, label: "Inactivo" },
      ],
    },
  ],
  ordenes: [
    {
      name: "cliente_id",
      label: "Cliente",
      type: "select",
      valueType: "id",
      required: true,
      optionsFor: "clientes",
    },
    {
      name: "empleado_id",
      label: "Empleado (opcional)",
      type: "select",
      valueType: "id",
      optionsFor: "empleados",
    },
    {
      name: "servicio_id",
      label: "Servicio",
      type: "select",
      valueType: "id",
      required: true,
      optionsFor: "servicios",
    },
    {
      name: "fecha_programada",
      label: "Fecha y hora programada",
      type: "datetime-local",
      required: true,
      defaultValue: "tomorrow",
    },
    {
      name: "estado",
      label: "Estado",
      type: "select",
      defaultValue: "Pendiente",
      options: [
        { value: "Pendiente", label: "Pendiente" },
        { value: "En progreso", label: "En progreso" },
        { value: "Completada", label: "Completada" },
        { value: "Cancelada", label: "Cancelada" },
      ],
    },
    {
      name: "total",
      label: "Total (opcional; se calcula con el precio del servicio)",
      type: "number",
      min: "0",
      step: "0.01",
    },
    { name: "notas", label: "Notas", type: "textarea" },
  ],
};

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function getBaseUrl() {
  return window.location.origin;
}

function getCollectionPath(tab) {
  return `/api/${tab}/${tab}`;
}

function getItemPath(tab, id) {
  return `${getCollectionPath(tab)}/${encodeURIComponent(id)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

function getTomorrowAtTen() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T10:00`;
}

function showAlert(message, isError = false) {
  alertBox.textContent = message;
  alertBox.className = `mb-4 p-3 rounded-lg text-sm font-medium ${
    isError
      ? "bg-red-100 text-red-800 border border-red-300"
      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
  }`;
  alertBox.classList.remove("hidden");
  setTimeout(() => alertBox.classList.add("hidden"), 4500);
}

async function apiRequest(path, options = {}) {
  const url = `${getBaseUrl()}${path}`;
  const { headers = {}, ...fetchOptions } = options;
  const response = await fetch(url, {
    ...fetchOptions,
    headers: { "Content-Type": "application/json", ...headers },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data?.detail
        ? JSON.stringify(data.detail)
        : `Error HTTP ${response.status}`
    );
  }
  return data;
}

async function loadOrderOptions() {
  const [clientes, empleados, servicios] = await Promise.all([
    apiRequest(getCollectionPath("clientes")),
    apiRequest(getCollectionPath("empleados")),
    apiRequest(getCollectionPath("servicios")),
  ]);
  return { clientes, empleados, servicios };
}

function getRelationOptions(field, references) {
  if (field.optionsFor === "clientes") {
    return references.clientes.map((cliente) => ({
      value: cliente.id,
      label: `${cliente.nombre} · ${cliente.email || cliente.telefono || "Cliente"} (#${cliente.id})`,
    }));
  }
  if (field.optionsFor === "empleados") {
    return references.empleados.map((empleado) => ({
      value: empleado.id,
      label: `${empleado.nombre} · ${empleado.cargo} (#${empleado.id})`,
    }));
  }
  if (field.optionsFor === "servicios") {
    return references.servicios.map((servicio) => ({
      value: servicio.id,
      label: `${servicio.nombre} · precio ${Number(servicio.precio_base).toFixed(2)} (#${servicio.id})`,
    }));
  }
  return field.options || [];
}

function getOptionLabel(reference, id, type) {
  if (id === null || id === undefined) {
    return type === "empleados" ? "Sin asignar" : "—";
  }
  const collection = type === "clientes"
    ? reference.clientes
    : type === "empleados"
      ? reference.empleados
      : reference.servicios;
  const item = collection.find((entry) => String(entry.id) === String(id));
  if (!item) {
    return `No disponible (#${id})`;
  }
  if (type === "clientes") {
    return `${item.nombre} · ${item.email || item.telefono || `#${item.id}`}`;
  }
  if (type === "empleados") {
    return `${item.nombre} · ${item.cargo}`;
  }
  return `${item.nombre} · ${Number(item.precio_base).toFixed(2)}`;
}

function getCellValue(tab, field, value, references) {
  if (tab === "ordenes" && ["cliente_id", "empleado_id", "servicio_id"].includes(field)) {
    const type = {
      cliente_id: "clientes",
      empleado_id: "empleados",
      servicio_id: "servicios",
    }[field];
    return getOptionLabel(references, value, type);
  }
  if (typeof value === "boolean") {
    return value ? "Activo" : "Inactivo";
  }
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (field === "fecha_programada" || field === "creada_en") {
    return String(value).replace("T", " ");
  }
  if (field === "precio_base" || field === "total") {
    return Number(value).toFixed(2);
  }
  return typeof value === "object" ? JSON.stringify(value) : value;
}

function getFilterOptions(tab, field, items, references) {
  if (field.optionsFor) {
    const options = getRelationOptions(field, references);
    if (field.optionsFor === "empleados") {
      return [{ value: "none", label: "Sin empleado asignado" }, ...options];
    }
    return options;
  }
  if (field.valueType === "boolean") {
    return [
      { value: "true", label: "Activo" },
      { value: "false", label: "Inactivo" },
    ];
  }
  return [...new Set(
    items
      .map((item) => item[field.key])
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map(String)
  )]
    .sort((left, right) => left.localeCompare(right, "es"))
    .map((value) => ({ value, label: value }));
}

function getFilterValue(item, field) {
  const value = item[field.key];
  if (field.optionsFor === "empleados" && (value === null || value === undefined)) {
    return "none";
  }
  return value === null || value === undefined ? "" : String(value);
}

function filterItems(tab, items, references) {
  const filters = activeFilters[tab];
  return items.filter((item) =>
    FILTER_FIELDS[tab].every((field) => {
      const selectedValue = filters[field.key];
      return !selectedValue || getFilterValue(item, field) === selectedValue;
    })
  );
}

function renderFilterSelect(tab, field, items, references) {
  const options = getFilterOptions(tab, field, items, references);
  const selectedValue = activeFilters[tab][field.key] || "";
  if (
    selectedValue &&
    !options.some((option) => String(option.value) === selectedValue)
  ) {
    activeFilters[tab][field.key] = "";
  }
  const choices = [
    { value: "", label: `Todos: ${field.label.toLowerCase()}` },
    ...options,
  ];
  return `
    <label class="block text-sm font-medium text-slate-700">
      <span class="block mb-1">${escapeHtml(field.label)}</span>
      <select data-filter-key="${field.key}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        ${choices.map((option) => {
          const value = String(option.value);
          const selected = value === activeFilters[tab][field.key] ? " selected" : "";
          return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(option.label)}</option>`;
        }).join("")}
      </select>
    </label>
  `;
}

function renderFilters(tab, items, references) {
  const fields = FILTER_FIELDS[tab];
  const filters = fields
    .map((field) => renderFilterSelect(tab, field, items, references))
    .join("");
  return `
    <section class="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-slate-800">Filtrar ${TITLES[tab].toLowerCase()}</h3>
        <button data-action="clear-filters" class="text-sm text-blue-700 hover:underline">
          Limpiar filtros
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">${filters}</div>
      <p data-filter-summary class="mt-3 text-sm text-slate-600"></p>
      <div data-filtered-table class="mt-3"></div>
    </section>
  `;
}

function updateFilteredResults() {
  const summary = contentArea.querySelector("[data-filter-summary]");
  const table = contentArea.querySelector("[data-filtered-table]");
  if (!summary || !table) {
    return;
  }
  const filteredItems = filterItems(currentTab, cachedItems, filterReferences);
  summary.textContent = `Mostrando ${filteredItems.length} de ${cachedItems.length} ${TITLES[currentTab].toLowerCase()}`;
  table.innerHTML = filteredItems.length
    ? renderTable(currentTab, filteredItems, filterReferences)
    : `<p class="text-slate-500 text-sm">${cachedItems.length ? "No hay registros que coincidan con los filtros." : "No hay registros para mostrar."}</p>`;
}

function renderTable(tab, items, references) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p class="text-slate-500 text-sm">No hay registros para mostrar.</p>`;
  }

  const fields = Object.keys(items[0]);
  const rows = items
    .map((item) => {
      const cells = fields
        .map((field) => {
          const value = getCellValue(tab, field, item[field], references);
          return `<td class="py-2 px-3">${escapeHtml(value)}</td>`;
        })
        .join("");
      return `
        <tr class="border-b hover:bg-slate-50">
          ${cells}
          <td class="py-2 px-3 whitespace-nowrap">
            <button data-action="edit" data-id="${escapeHtml(item.id)}" class="mr-2 inline-flex items-center rounded-md bg-cyan-700 px-3 py-1.5 font-medium text-white transition-colors hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1">
              Editar
            </button>
            <button data-action="delete" data-id="${escapeHtml(item.id)}" class="inline-flex items-center rounded-md bg-red-700 px-3 py-1.5 font-medium text-white transition-colors hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="border-b bg-slate-50 text-slate-600">
            ${fields.map((field) => `<th class="py-2 px-3 font-semibold">${escapeHtml(COLUMN_LABELS[field] || field)}</th>`).join("")}
            <th class="py-2 px-3 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderSelect(field, value, references, inputId) {
  const options = field.optionsFor
    ? getRelationOptions(field, references)
    : field.options;
  const emptyLabel = field.optionsFor === "empleados"
    ? "Sin asignar"
    : "Selecciona una opción";
  const selectedValue = value === null || value === undefined ? "" : String(value);
  const entries = [
    `<option value="">${emptyLabel}</option>`,
    ...options.map((option) => {
      const optionValue = String(option.value);
      const selected = optionValue === selectedValue ? " selected" : "";
      return `<option value="${escapeHtml(optionValue)}"${selected}>${escapeHtml(option.label)}</option>`;
    }),
  ];
  return `<select id="${inputId}" name="${field.name}" class="w-full border border-slate-300 rounded-lg px-3 py-2" ${field.required ? "required" : ""}>${entries.join("")}</select>`;
}

function renderField(tab, field, item, references, formKind) {
  const inputId = `${formKind}-${field.name}`;
  let value = item && Object.prototype.hasOwnProperty.call(item, field.name)
    ? item[field.name]
    : field.defaultValue;
  if (field.defaultValue === "tomorrow" && value === "tomorrow") {
    value = getTomorrowAtTen();
  }

  let control;
  if (field.type === "select") {
    control = renderSelect(field, value, references, inputId);
  } else if (field.type === "textarea") {
    control = `<textarea id="${inputId}" name="${field.name}" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2">${escapeHtml(value ?? "")}</textarea>`;
  } else {
    const attributes = [
      `id="${inputId}"`,
      `name="${field.name}"`,
      `type="${field.type}"`,
      `class="w-full border border-slate-300 rounded-lg px-3 py-2"`,
      field.required ? "required" : "",
      field.min ? `min="${field.min}"` : "",
      field.step ? `step="${field.step}"` : "",
      field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : "",
      value !== null && value !== undefined ? `value="${escapeHtml(value)}"` : "",
    ].filter(Boolean);
    control = `<input ${attributes.join(" ")} />`;
  }

  return `
    <label for="${inputId}" class="block text-sm font-medium text-slate-700">
      <span class="block mb-1">${escapeHtml(field.label)}</span>
      ${control}
    </label>
  `;
}

function renderForm(tab, formKind, item, references) {
  const isEditing = formKind === "edit";
  const fields = FORM_FIELDS[tab].filter(
    (field) => !(isEditing && tab === "ordenes" && field.name === "cliente_id")
  );
  const controls = fields
    .map((field) => renderField(tab, field, item, references, formKind))
    .join("");
  const clientMessage = isEditing && tab === "ordenes"
    ? `<p class="mb-4 text-sm text-slate-600">Cliente asociado: ${escapeHtml(getOptionLabel(references, item.cliente_id, "clientes"))}. El servicio de órdenes no permite cambiar el cliente.</p>`
    : "";
  const orderHint = !isEditing && tab === "ordenes" &&
    (!references.clientes.length || !references.servicios.length)
    ? `<p class="mb-4 text-sm text-amber-700">Crea primero al menos un cliente y un servicio para poder registrar una orden.</p>`
    : "";
  const title = isEditing
    ? `Editar ${TITLES[tab].toLowerCase()} #${item.id}`
    : `Crear ${TITLES[tab].toLowerCase()}`;

  return `
    <section class="mt-6 pt-5 border-t border-slate-200">
      <h3 class="text-base font-semibold text-slate-800 mb-4">${escapeHtml(title)}</h3>
      ${clientMessage}
      ${orderHint}
      <form data-form-kind="${formKind}" ${isEditing ? `data-item-id="${escapeHtml(item.id)}"` : ""}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${controls}</div>
        <div class="mt-4 flex justify-end gap-2">
          ${
            isEditing
              ? `<button type="button" data-action="cancel-edit" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm">Cancelar</button>`
              : ""
          }
          <button type="submit" class="${isEditing ? "bg-blue-700 hover:bg-blue-800" : "bg-emerald-700 hover:bg-emerald-800"} text-white px-4 py-2 rounded-lg text-sm font-medium">
            ${isEditing ? "Guardar cambios" : "Crear registro"}
          </button>
        </div>
      </form>
    </section>
  `;
}

function formToPayload(form, tab) {
  const data = new FormData(form);
  return Object.fromEntries(
    FORM_FIELDS[tab]
      .filter((field) => data.has(field.name))
      .map((field) => {
        const rawValue = data.get(field.name);
        if (field.valueType === "boolean") {
          return [field.name, rawValue === "true"];
        }
        if (field.valueType === "id" || field.type === "number") {
          return [field.name, rawValue === "" ? null : Number(rawValue)];
        }
        return [field.name, rawValue === "" ? null : rawValue];
      })
  );
}

async function loadTab(tab) {
  currentTab = tab;
  tabs.forEach((button) => {
    const active = button.dataset.tab === tab;
    button.className = `tab-btn px-4 py-2 rounded-lg font-medium text-sm ${
      active
        ? "bg-emerald-700 text-white"
        : "bg-white text-slate-700 hover:bg-slate-200"
    }`;
  });

  contentArea.innerHTML = `<p class="text-slate-500 text-sm">Cargando ${escapeHtml(TITLES[tab])}...</p>`;

  try {
    const items = await apiRequest(getCollectionPath(tab));
    const references = tab === "ordenes"
      ? await loadOrderOptions()
      : { clientes: [], empleados: [], servicios: [] };
    cachedItems = items;
    filterReferences = references;
    const itemBeingEdited = Array.isArray(items)
      ? items.find((item) => String(item.id) === String(editingItemId))
      : null;

    contentArea.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">${escapeHtml(TITLES[tab])}</h2>
        <button data-action="refresh" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm">
          Actualizar
        </button>
      </div>
      ${renderFilters(tab, items, references)}
      ${itemBeingEdited ? renderForm(tab, "edit", itemBeingEdited, references) : ""}
      ${renderForm(tab, "create", null, references)}
    `;
    updateFilteredResults();
  } catch (error) {
    contentArea.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">${escapeHtml(TITLES[tab])}</h2>
        <button data-action="refresh" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm">
          Reintentar
        </button>
      </div>
      <p class="text-red-600 text-sm">No se pudo cargar ${escapeHtml(TITLES[tab])}: ${escapeHtml(error.message)}</p>
    `;
    showAlert(error.message, true);
  }
}

contentArea.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-form-kind]");
  if (!form) {
    return;
  }
  event.preventDefault();

  try {
    const payload = formToPayload(form, currentTab);
    if (form.dataset.formKind === "edit") {
      await apiRequest(getItemPath(currentTab, form.dataset.itemId), {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      editingItemId = null;
      showAlert("Cambios guardados");
    } else {
      await apiRequest(getCollectionPath(currentTab), {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showAlert("Registro creado");
    }
    await loadTab(currentTab);
  } catch (error) {
    showAlert(`No se pudo guardar: ${error.message}`, true);
  }
});

contentArea.addEventListener("change", (event) => {
  const filterKey = event.target.dataset.filterKey;
  if (filterKey) {
    activeFilters[currentTab][filterKey] = event.target.value;
    updateFilteredResults();
  }
});

contentArea.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const { action, id } = button.dataset;
  try {
    if (action === "clear-filters") {
      activeFilters[currentTab] = {};
      contentArea.querySelectorAll("[data-filter-key]").forEach((control) => {
        control.value = "";
      });
      updateFilteredResults();
    } else if (action === "refresh") {
      await loadTab(currentTab);
    } else if (action === "edit") {
      editingItemId = id;
      await loadTab(currentTab);
    } else if (action === "cancel-edit") {
      editingItemId = null;
      await loadTab(currentTab);
    } else if (action === "delete") {
      if (!window.confirm(`¿Eliminar el registro ${id}?`)) {
        return;
      }
      await apiRequest(getItemPath(currentTab, id), { method: "DELETE" });
      if (String(editingItemId) === String(id)) {
        editingItemId = null;
      }
      showAlert("Registro eliminado");
      await loadTab(currentTab);
    }
  } catch (error) {
    showAlert(`Error en ${TITLES[currentTab]}: ${error.message}`, true);
  }
});

tabs.forEach((button) => {
  button.addEventListener("click", () => {
    editingItemId = null;
    loadTab(button.dataset.tab);
  });
});

loadTab(currentTab);
