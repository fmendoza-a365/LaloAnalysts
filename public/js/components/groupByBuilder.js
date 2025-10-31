/**
 * GroupBy Builder - Constructor de Agrupaciones Múltiples
 * Permite jerarquías de agrupación como en Power BI
 */

class GroupByBuilder {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      fields: options.fields || [],
      onUpdate: options.onUpdate || (() => {}),
      initialGroupBy: options.initialGroupBy || []
    };

    this.groupBy = this.options.initialGroupBy;
    this.render();
  }

  /**
   * Renderiza el constructor de agrupaciones
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="groupby-builder bg-white border border-gray-300 rounded-lg p-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-700 flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
            Agrupación de Datos
          </h3>
          <span class="text-xs text-gray-500">${this.groupBy.length} nivel(es)</span>
        </div>

        <!-- Ayuda -->
        <div class="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <strong>💡 Tip:</strong> El orden de las agrupaciones determina la jerarquía. Arrastra para reordenar.
        </div>

        <!-- Lista de Agrupaciones -->
        <div id="groupByList" class="space-y-2 mb-3">
          ${this.groupBy.length === 0 ? this.renderEmptyState() : ''}
          ${this.groupBy.map((group, index) => this.renderGroupBy(group, index)).join('')}
        </div>

        <!-- Botón Agregar Agrupación -->
        <button onclick="groupByBuilder.addGroupBy()"
                class="w-full px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-all flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Agregar Nivel de Agrupación
        </button>

        <!-- Resumen -->
        <div id="groupBySummary" class="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          ${this.getGroupBySummary()}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza estado vacío
   */
  renderEmptyState() {
    return `
      <div class="text-center py-6 text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/>
        </svg>
        <p class="text-sm">Sin agrupaciones</p>
        <p class="text-xs">Los datos se mostrarán sin agrupar</p>
      </div>
    `;
  }

  /**
   * Renderiza una agrupación individual
   */
  renderGroupBy(group, index) {
    const fieldOptions = this.options.fields.map(f =>
      `<option value="${f.name}" data-type="${f.type}" ${group.field === f.name ? 'selected' : ''}>${f.label}</option>`
    ).join('');

    const selectedField = this.options.fields.find(f => f.name === group.field);
    const isDateField = selectedField?.type === 'date';

    const granularityOptions = TIME_GRANULARITIES.map(g =>
      `<option value="${g.value}" ${group.granularity === g.value ? 'selected' : ''}>${g.icon} ${g.label}</option>`
    ).join('');

    return `
      <div class="groupby-item bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 cursor-move"
           data-index="${index}"
           draggable="true"
           ondragstart="groupByBuilder.handleDragStart(event, ${index})"
           ondragover="groupByBuilder.handleDragOver(event)"
           ondrop="groupByBuilder.handleDrop(event, ${index})">

        <div class="flex items-center gap-2 mb-2">
          <!-- Orden -->
          <div class="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-xs font-bold">
            ${index + 1}
          </div>

          <!-- Título -->
          <span class="text-xs font-semibold text-gray-700">
            Nivel ${index + 1}
            ${index === 0 ? '(Principal)' : index === this.groupBy.length - 1 ? '(Detalle)' : ''}
          </span>

          <!-- Botones de Orden -->
          <div class="flex gap-1 ml-auto">
            ${index > 0 ? `
              <button onclick="groupByBuilder.moveUp(${index})"
                      class="p-1 text-gray-600 hover:bg-white rounded transition-all"
                      title="Subir">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                </svg>
              </button>
            ` : ''}

            ${index < this.groupBy.length - 1 ? `
              <button onclick="groupByBuilder.moveDown(${index})"
                      class="p-1 text-gray-600 hover:bg-white rounded transition-all"
                      title="Bajar">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
            ` : ''}

            <button onclick="groupByBuilder.removeGroupBy(${index})"
                    class="p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                    title="Eliminar">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <!-- Campo -->
          <div>
            <label class="block text-xs text-gray-600 mb-1">Campo</label>
            <select class="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    onchange="groupByBuilder.updateField(${index}, this)">
              <option value="">Seleccionar campo</option>
              ${fieldOptions}
            </select>
          </div>

          <!-- Granularidad (solo para fechas) -->
          ${isDateField ? `
            <div>
              <label class="block text-xs text-gray-600 mb-1">Granularidad Temporal</label>
              <select class="w-full text-xs border border-gray-300 rounded px-2 py-1"
                      onchange="groupByBuilder.updateGranularity(${index}, this.value)">
                ${granularityOptions}
              </select>
            </div>
          ` : `
            <div class="flex items-center justify-center text-xs text-gray-400 pt-4">
              Sin opciones de granularidad
            </div>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Agrega nueva agrupación
   */
  addGroupBy() {
    this.groupBy.push({
      field: '',
      order: this.groupBy.length,
      granularity: 'day'
    });
    this.render();
    this.notifyUpdate();
  }

  /**
   * Elimina agrupación
   */
  removeGroupBy(index) {
    this.groupBy.splice(index, 1);
    // Reordenar
    this.groupBy.forEach((g, i) => g.order = i);
    this.render();
    this.notifyUpdate();
  }

  /**
   * Actualiza campo
   */
  updateField(index, selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    this.groupBy[index].field = selectedOption.value;

    // Re-renderizar para mostrar opciones de granularidad si es fecha
    this.render();
    this.notifyUpdate();
  }

  /**
   * Actualiza granularidad
   */
  updateGranularity(index, granularity) {
    this.groupBy[index].granularity = granularity;
    this.notifyUpdate();
  }

  /**
   * Mueve agrupación hacia arriba
   */
  moveUp(index) {
    if (index > 0) {
      [this.groupBy[index], this.groupBy[index - 1]] = [this.groupBy[index - 1], this.groupBy[index]];
      this.groupBy.forEach((g, i) => g.order = i);
      this.render();
      this.notifyUpdate();
    }
  }

  /**
   * Mueve agrupación hacia abajo
   */
  moveDown(index) {
    if (index < this.groupBy.length - 1) {
      [this.groupBy[index], this.groupBy[index + 1]] = [this.groupBy[index + 1], this.groupBy[index]];
      this.groupBy.forEach((g, i) => g.order = i);
      this.render();
      this.notifyUpdate();
    }
  }

  /**
   * Maneja inicio de arrastre
   */
  handleDragStart(event, index) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', index.toString());
    event.currentTarget.style.opacity = '0.4';
  }

  /**
   * Maneja arrastre sobre elemento
   */
  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    return false;
  }

  /**
   * Maneja soltar elemento
   */
  handleDrop(event, targetIndex) {
    event.stopPropagation();
    event.preventDefault();

    const sourceIndex = parseInt(event.dataTransfer.getData('text/html'));

    if (sourceIndex !== targetIndex) {
      const item = this.groupBy.splice(sourceIndex, 1)[0];
      this.groupBy.splice(targetIndex, 0, item);
      this.groupBy.forEach((g, i) => g.order = i);
      this.render();
      this.notifyUpdate();
    }

    return false;
  }

  /**
   * Obtiene resumen de agrupaciones
   */
  getGroupBySummary() {
    if (this.groupBy.length === 0) {
      return '📋 <strong>Sin agrupaciones</strong> - Los datos se mostrarán en detalle';
    }

    const summaries = this.groupBy
      .filter(g => g.field)
      .map((g, index) => {
        const field = this.options.fields.find(f => f.name === g.field);
        const fieldLabel = field?.label || g.field;
        const isDate = field?.type === 'date';
        const granularity = isDate ? TIME_GRANULARITIES.find(gr => gr.value === g.granularity) : null;

        return isDate && granularity
          ? `<strong>Nivel ${index + 1}:</strong> ${fieldLabel} (${granularity.label})`
          : `<strong>Nivel ${index + 1}:</strong> ${fieldLabel}`;
      });

    return summaries.length > 0
      ? `📊 Jerarquía: ${summaries.join(' → ')}`
      : '⚠️ Configuración de agrupaciones incompleta';
  }

  /**
   * Obtiene las agrupaciones actuales
   */
  getGroupBy() {
    return this.groupBy;
  }

  /**
   * Establece las agrupaciones
   */
  setGroupBy(groupBy) {
    this.groupBy = groupBy;
    this.render();
  }

  /**
   * Valida las agrupaciones
   */
  validate() {
    return this.groupBy.every(g => g.field);
  }

  /**
   * Notifica cambios
   */
  notifyUpdate() {
    this.options.onUpdate(this.groupBy);

    // Actualizar resumen
    const summaryElement = document.getElementById('groupBySummary');
    if (summaryElement) {
      summaryElement.innerHTML = this.getGroupBySummary();
    }
  }
}

// Variable global para el instance
let groupByBuilder = null;
