/**
 * Filter Builder - Constructor de Filtros Avanzados
 * Similar a Power BI / Looker Studio
 */

class FilterBuilder {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      fields: options.fields || [],
      onUpdate: options.onUpdate || (() => {}),
      initialFilters: options.initialFilters || { operator: 'AND', conditions: [], nestedFilters: [] }
    };

    this.filters = this.options.initialFilters;
    this.conditionCount = 0;

    this.render();
  }

  /**
   * Renderiza el constructor de filtros
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="filter-builder bg-white border border-gray-300 rounded-lg p-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-700 flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            Filtros Avanzados
          </h3>

          <!-- Operador Lógico Global -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-600">Operador:</span>
            <select id="globalOperator" class="text-xs border border-gray-300 rounded px-2 py-1" onchange="filterBuilder.updateGlobalOperator(this.value)">
              <option value="AND" ${this.filters.operator === 'AND' ? 'selected' : ''}>AND (Todas)</option>
              <option value="OR" ${this.filters.operator === 'OR' ? 'selected' : ''}>OR (Cualquiera)</option>
            </select>
          </div>
        </div>

        <!-- Lista de Condiciones -->
        <div id="filterConditions" class="space-y-2 mb-3">
          ${this.filters.conditions.map((condition, index) => this.renderCondition(condition, index)).join('')}
        </div>

        <!-- Botón Agregar Condición -->
        <button onclick="filterBuilder.addCondition()"
                class="w-full px-3 py-2 text-sm bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-all flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Agregar Condición
        </button>

        <!-- Resumen de Filtros -->
        <div id="filterSummary" class="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          ${this.getFilterSummary()}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Renderiza una condición individual
   */
  renderCondition(condition, index) {
    const fieldOptions = this.options.fields.map(f =>
      `<option value="${f.name}" data-type="${f.type}" ${condition.field === f.name ? 'selected' : ''}>${f.label} (${f.type})</option>`
    ).join('');

    const selectedField = this.options.fields.find(f => f.name === condition.field);
    const dataType = condition.dataType || selectedField?.type || 'string';
    const operators = FILTER_OPERATORS[dataType] || FILTER_OPERATORS.string;

    const operatorOptions = operators.map(op =>
      `<option value="${op.value}" ${condition.operator === op.value ? 'selected' : ''}>${op.label}</option>`
    ).join('');

    return `
      <div class="filter-condition bg-gray-50 border border-gray-200 rounded-lg p-3" data-index="${index}">
        <div class="flex gap-2 items-start">
          <!-- Campo -->
          <div class="flex-1">
            <label class="block text-xs text-gray-600 mb-1">Campo</label>
            <select class="condition-field w-full text-xs border border-gray-300 rounded px-2 py-1"
                    onchange="filterBuilder.updateConditionField(${index}, this)">
              <option value="">Seleccionar campo</option>
              ${fieldOptions}
            </select>
          </div>

          <!-- Operador -->
          <div class="flex-1">
            <label class="block text-xs text-gray-600 mb-1">Operador</label>
            <select class="condition-operator w-full text-xs border border-gray-300 rounded px-2 py-1"
                    onchange="filterBuilder.updateConditionOperator(${index}, this.value)">
              ${operatorOptions}
            </select>
          </div>

          <!-- Valor -->
          <div class="flex-1">
            <label class="block text-xs text-gray-600 mb-1">Valor</label>
            ${this.renderValueInput(condition, index, dataType)}
          </div>

          <!-- Botón Eliminar -->
          <div class="pt-6">
            <button onclick="filterBuilder.removeCondition(${index})"
                    class="p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                    title="Eliminar condición">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza el input de valor según el tipo de dato y operador
   */
  renderValueInput(condition, index, dataType) {
    const operator = condition.operator;
    const value = condition.value || '';

    // Para operador "between"
    if (operator === 'between') {
      const [min, max] = Array.isArray(value) ? value : ['', ''];
      return `
        <div class="flex gap-1">
          <input type="${dataType === 'date' ? 'date' : 'text'}"
                 class="condition-value w-1/2 text-xs border border-gray-300 rounded px-2 py-1"
                 value="${min}"
                 onchange="filterBuilder.updateConditionValue(${index}, [this.value, this.nextElementSibling.value])"
                 placeholder="Min">
          <input type="${dataType === 'date' ? 'date' : 'text'}"
                 class="condition-value w-1/2 text-xs border border-gray-300 rounded px-2 py-1"
                 value="${max}"
                 onchange="filterBuilder.updateConditionValue(${index}, [this.previousElementSibling.value, this.value])"
                 placeholder="Max">
        </div>
      `;
    }

    // Para operadores "in" o "nin"
    if (operator === 'in' || operator === 'nin') {
      const values = Array.isArray(value) ? value.join(', ') : value;
      return `
        <input type="text"
               class="condition-value w-full text-xs border border-gray-300 rounded px-2 py-1"
               value="${values}"
               onchange="filterBuilder.updateConditionValue(${index}, this.value.split(',').map(v => v.trim()))"
               placeholder="Separar con comas">
      `;
    }

    // Para tipo booleano
    if (dataType === 'boolean') {
      return `
        <select class="condition-value w-full text-xs border border-gray-300 rounded px-2 py-1"
                onchange="filterBuilder.updateConditionValue(${index}, this.value === 'true')">
          <option value="true" ${value === true ? 'selected' : ''}>Verdadero</option>
          <option value="false" ${value === false ? 'selected' : ''}>Falso</option>
        </select>
      `;
    }

    // Input por defecto
    const inputType = dataType === 'date' ? 'date' : dataType === 'number' ? 'number' : 'text';
    return `
      <input type="${inputType}"
             class="condition-value w-full text-xs border border-gray-300 rounded px-2 py-1"
             value="${value}"
             onchange="filterBuilder.updateConditionValue(${index}, this.value)"
             placeholder="Ingrese valor">
    `;
  }

  /**
   * Agrega una nueva condición
   */
  addCondition() {
    this.filters.conditions.push({
      field: '',
      operator: 'eq',
      value: '',
      dataType: 'string'
    });
    this.render();
    this.notifyUpdate();
  }

  /**
   * Elimina una condición
   */
  removeCondition(index) {
    this.filters.conditions.splice(index, 1);
    this.render();
    this.notifyUpdate();
  }

  /**
   * Actualiza el campo de una condición
   */
  updateConditionField(index, selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const fieldName = selectedOption.value;
    const dataType = selectedOption.getAttribute('data-type');

    this.filters.conditions[index].field = fieldName;
    this.filters.conditions[index].dataType = dataType;

    // Re-renderizar para actualizar operadores disponibles
    this.render();
    this.notifyUpdate();
  }

  /**
   * Actualiza el operador de una condición
   */
  updateConditionOperator(index, operator) {
    this.filters.conditions[index].operator = operator;
    this.render();
    this.notifyUpdate();
  }

  /**
   * Actualiza el valor de una condición
   */
  updateConditionValue(index, value) {
    this.filters.conditions[index].value = value;
    this.notifyUpdate();
  }

  /**
   * Actualiza el operador lógico global
   */
  updateGlobalOperator(operator) {
    this.filters.operator = operator;
    this.notifyUpdate();
  }

  /**
   * Obtiene resumen legible de filtros
   */
  getFilterSummary() {
    if (this.filters.conditions.length === 0) {
      return '📋 <strong>Sin filtros</strong> - Se mostrarán todos los datos';
    }

    const operator = this.filters.operator === 'AND' ? 'Y' : 'O';
    const summaries = this.filters.conditions
      .filter(c => c.field && c.operator)
      .map(c => {
        const field = this.options.fields.find(f => f.name === c.field);
        const fieldLabel = field?.label || c.field;
        const op = FILTER_OPERATORS[c.dataType]?.find(o => o.value === c.operator);
        const opLabel = op?.label || c.operator;
        const value = Array.isArray(c.value) ? c.value.join(', ') : c.value;
        return `<strong>${fieldLabel}</strong> ${opLabel} <em>${value}</em>`;
      });

    return summaries.length > 0
      ? `📊 Mostrando datos donde: ${summaries.join(` <strong>${operator}</strong> `)}`
      : '⚠️ Configuración de filtros incompleta';
  }

  /**
   * Obtiene los filtros actuales
   */
  getFilters() {
    return this.filters;
  }

  /**
   * Establece los filtros
   */
  setFilters(filters) {
    this.filters = filters;
    this.render();
  }

  /**
   * Valida los filtros
   */
  validate() {
    return this.filters.conditions.every(c => c.field && c.operator && c.value !== '');
  }

  /**
   * Notifica cambios
   */
  notifyUpdate() {
    this.options.onUpdate(this.filters);

    // Actualizar resumen
    const summaryElement = document.getElementById('filterSummary');
    if (summaryElement) {
      summaryElement.innerHTML = this.getFilterSummary();
    }
  }

  /**
   * Adjunta event listeners
   */
  attachEventListeners() {
    // Los event listeners ya están inline en el HTML
  }
}

// Variable global para el instance
let filterBuilder = null;
