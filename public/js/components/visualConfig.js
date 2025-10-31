/**
 * Visual Config Builder - Configuración Visual Avanzada
 * Sistema de personalización de gráficos similar a Power BI
 */

class VisualConfigBuilder {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      chartType: options.chartType || 'bar',
      onUpdate: options.onUpdate || (() => {}),
      initialConfig: options.initialConfig || this.getDefaultConfig()
    };

    this.config = this.options.initialConfig;
    this.render();
  }

  /**
   * Obtiene configuración por defecto
   */
  getDefaultConfig() {
    return {
      colorScheme: {
        type: 'preset',
        preset: 'default',
        customColors: [],
        gradients: []
      },
      display: {
        showLegend: true,
        legendPosition: 'top',
        showLabels: true,
        showValues: false,
        showGrid: true,
        showTooltips: true,
        showTitle: true,
        showAxes: true,
        xAxis: { label: '', min: null, max: null, format: '' },
        yAxis: { label: '', min: null, max: null, format: '' }
      },
      interactions: {
        responsive: true,
        maintainAspectRatio: true,
        animation: true,
        hover: true
      },
      theme: 'light'
    };
  }

  /**
   * Renderiza el panel de configuración visual
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="visual-config bg-white border border-gray-300 rounded-lg">
        <!-- Tabs de Configuración -->
        <div class="flex border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <button class="config-tab px-4 py-2 text-sm font-medium border-b-2 border-purple-500 text-purple-600"
                  data-tab="colors"
                  onclick="visualConfigBuilder.switchTab('colors')">
            🎨 Colores
          </button>
          <button class="config-tab px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-800"
                  data-tab="display"
                  onclick="visualConfigBuilder.switchTab('display')">
            👁️ Visualización
          </button>
          <button class="config-tab px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-800"
                  data-tab="axes"
                  onclick="visualConfigBuilder.switchTab('axes')">
            📏 Ejes
          </button>
          <button class="config-tab px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-800"
                  data-tab="interactions"
                  onclick="visualConfigBuilder.switchTab('interactions')">
            ⚙️ Interacciones
          </button>
        </div>

        <!-- Contenido de Tabs -->
        <div class="p-4">
          <div id="tab-colors" class="tab-content">${this.renderColorsTab()}</div>
          <div id="tab-display" class="tab-content hidden">${this.renderDisplayTab()}</div>
          <div id="tab-axes" class="tab-content hidden">${this.renderAxesTab()}</div>
          <div id="tab-interactions" class="tab-content hidden">${this.renderInteractionsTab()}</div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza tab de colores
   */
  renderColorsTab() {
    return `
      <div class="space-y-4">
        <!-- Tipo de Esquema de Color -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Esquema de Color</label>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="visualConfigBuilder.setColorType('preset')"
                    class="px-3 py-2 text-xs border rounded-lg ${this.config.colorScheme.type === 'preset' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white border-gray-300 text-gray-700'}">
              🎨 Paleta
            </button>
            <button onclick="visualConfigBuilder.setColorType('custom')"
                    class="px-3 py-2 text-xs border rounded-lg ${this.config.colorScheme.type === 'custom' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white border-gray-300 text-gray-700'}">
              ✏️ Personalizado
            </button>
            <button onclick="visualConfigBuilder.setColorType('gradient')"
                    class="px-3 py-2 text-xs border rounded-lg ${this.config.colorScheme.type === 'gradient' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white border-gray-300 text-gray-700'}">
              🌈 Gradiente
            </button>
          </div>
        </div>

        <!-- Paletas Predefinidas -->
        ${this.config.colorScheme.type === 'preset' ? `
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Seleccionar Paleta</label>
            <div class="grid grid-cols-2 gap-2">
              ${Object.keys(COLOR_PALETTES).map(paletteName => `
                <button onclick="visualConfigBuilder.selectPalette('${paletteName}')"
                        class="p-3 border rounded-lg hover:border-purple-500 transition-all ${this.config.colorScheme.preset === paletteName ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-medium capitalize">${paletteName}</span>
                  </div>
                  <div class="flex gap-1">
                    ${COLOR_PALETTES[paletteName].slice(0, 5).map(color => `
                      <div class="w-6 h-6 rounded" style="background-color: ${color}"></div>
                    `).join('')}
                  </div>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Colores Personalizados -->
        ${this.config.colorScheme.type === 'custom' ? `
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Colores Personalizados</label>
            <div id="customColorsList" class="space-y-2 mb-2">
              ${(this.config.colorScheme.customColors || []).map((color, index) => `
                <div class="flex gap-2 items-center">
                  <input type="color" value="${color}"
                         onchange="visualConfigBuilder.updateCustomColor(${index}, this.value)"
                         class="w-12 h-8 border border-gray-300 rounded cursor-pointer">
                  <input type="text" value="${color}"
                         onchange="visualConfigBuilder.updateCustomColor(${index}, this.value)"
                         class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded">
                  <button onclick="visualConfigBuilder.removeCustomColor(${index})"
                          class="p-1 text-red-500 hover:bg-red-50 rounded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              `).join('')}
            </div>
            <button onclick="visualConfigBuilder.addCustomColor()"
                    class="w-full px-3 py-2 text-sm bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100">
              + Agregar Color
            </button>
          </div>
        ` : ''}

        <!-- Gradientes -->
        ${this.config.colorScheme.type === 'gradient' ? `
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Configurar Gradiente</label>
            <div class="space-y-2">
              <div class="flex gap-2 items-center">
                <label class="text-xs text-gray-600 w-20">Color Inicio:</label>
                <input type="color" value="${this.config.colorScheme.gradients[0]?.start || '#667eea'}"
                       onchange="visualConfigBuilder.updateGradient('start', this.value)"
                       class="w-12 h-8 border border-gray-300 rounded cursor-pointer">
                <input type="text" value="${this.config.colorScheme.gradients[0]?.start || '#667eea'}"
                       onchange="visualConfigBuilder.updateGradient('start', this.value)"
                       class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded">
              </div>
              <div class="flex gap-2 items-center">
                <label class="text-xs text-gray-600 w-20">Color Fin:</label>
                <input type="color" value="${this.config.colorScheme.gradients[0]?.end || '#764ba2'}"
                       onchange="visualConfigBuilder.updateGradient('end', this.value)"
                       class="w-12 h-8 border border-gray-300 rounded cursor-pointer">
                <input type="text" value="${this.config.colorScheme.gradients[0]?.end || '#764ba2'}"
                       onchange="visualConfigBuilder.updateGradient('end', this.value)"
                       class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded">
              </div>
              <!-- Preview del Gradiente -->
              <div class="h-12 rounded-lg" style="background: linear-gradient(135deg, ${this.config.colorScheme.gradients[0]?.start || '#667eea'}, ${this.config.colorScheme.gradients[0]?.end || '#764ba2'})"></div>
            </div>
          </div>
        ` : ''}

        <!-- Tema -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Tema Visual</label>
          <select class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  onchange="visualConfigBuilder.setTheme(this.value)">
            <option value="light" ${this.config.theme === 'light' ? 'selected' : ''}>☀️ Claro</option>
            <option value="dark" ${this.config.theme === 'dark' ? 'selected' : ''}>🌙 Oscuro</option>
            <option value="auto" ${this.config.theme === 'auto' ? 'selected' : ''}>🔄 Automático</option>
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza tab de visualización
   */
  renderDisplayTab() {
    return `
      <div class="space-y-4">
        <!-- Leyenda -->
        <div class="flex items-center justify-between">
          <label class="text-sm font-semibold text-gray-700">Mostrar Leyenda</label>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" ${this.config.display.showLegend ? 'checked' : ''}
                   onchange="visualConfigBuilder.toggleDisplay('showLegend', this.checked)"
                   class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        ${this.config.display.showLegend ? `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Posición de Leyenda</label>
            <div class="grid grid-cols-4 gap-2">
              ${['top', 'bottom', 'left', 'right'].map(pos => `
                <button onclick="visualConfigBuilder.setLegendPosition('${pos}')"
                        class="px-3 py-2 text-xs border rounded-lg ${this.config.display.legendPosition === pos ? 'bg-purple-100 border-purple-500' : 'border-gray-300'}">
                  ${pos === 'top' ? '⬆️ Arriba' : pos === 'bottom' ? '⬇️ Abajo' : pos === 'left' ? '⬅️ Izq' : '➡️ Der'}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Otras Opciones de Visualización -->
        <div class="space-y-2">
          ${this.renderToggle('showLabels', 'Mostrar Etiquetas')}
          ${this.renderToggle('showValues', 'Mostrar Valores')}
          ${this.renderToggle('showGrid', 'Mostrar Cuadrícula')}
          ${this.renderToggle('showTooltips', 'Mostrar Tooltips')}
          ${this.renderToggle('showTitle', 'Mostrar Título')}
          ${this.renderToggle('showAxes', 'Mostrar Ejes')}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza tab de ejes
   */
  renderAxesTab() {
    return `
      <div class="space-y-4">
        <!-- Eje X -->
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 class="text-sm font-semibold text-gray-700 mb-3">📊 Eje X (Horizontal)</h4>
          <div class="space-y-2">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Etiqueta del Eje</label>
              <input type="text" value="${this.config.display.xAxis.label || ''}"
                     onchange="visualConfigBuilder.setAxisLabel('x', this.value)"
                     placeholder="Ej: Fecha, Categoría..."
                     class="w-full px-2 py-1 text-sm border border-gray-300 rounded">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Valor Mínimo</label>
                <input type="number" value="${this.config.display.xAxis.min || ''}"
                       onchange="visualConfigBuilder.setAxisMin('x', this.value)"
                       placeholder="Auto"
                       class="w-full px-2 py-1 text-sm border border-gray-300 rounded">
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Valor Máximo</label>
                <input type="number" value="${this.config.display.xAxis.max || ''}"
                       onchange="visualConfigBuilder.setAxisMax('x', this.value)"
                       placeholder="Auto"
                       class="w-full px-2 py-1 text-sm border border-gray-300 rounded">
              </div>
            </div>
          </div>
        </div>

        <!-- Eje Y -->
        <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 class="text-sm font-semibold text-gray-700 mb-3">📈 Eje Y (Vertical)</h4>
          <div class="space-y-2">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Etiqueta del Eje</label>
              <input type="text" value="${this.config.display.yAxis.label || ''}"
                     onchange="visualConfigBuilder.setAxisLabel('y', this.value)"
                     placeholder="Ej: Cantidad, Valor..."
                     class="w-full px-2 py-1 text-sm border border-gray-300 rounded">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Valor Mínimo</label>
                <input type="number" value="${this.config.display.yAxis.min || ''}"
                       onchange="visualConfigBuilder.setAxisMin('y', this.value)"
                       placeholder="Auto"
                       class="w-full px-2 py-1 text-sm border border-gray-300 rounded">
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Valor Máximo</label>
                <input type="number" value="${this.config.display.yAxis.max || ''}"
                       onchange="visualConfigBuilder.setAxisMax('y', this.value)"
                       placeholder="Auto"
                       class="w-full px-2 py-1 text-sm border border-gray-300 rounded">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza tab de interacciones
   */
  renderInteractionsTab() {
    return `
      <div class="space-y-3">
        ${this.renderToggle('responsive', 'Responsive (Adaptar a pantalla)', 'interactions')}
        ${this.renderToggle('maintainAspectRatio', 'Mantener proporción de aspecto', 'interactions')}
        ${this.renderToggle('animation', 'Animaciones', 'interactions')}
        ${this.renderToggle('hover', 'Efectos hover', 'interactions')}
      </div>
    `;
  }

  /**
   * Renderiza un toggle switch
   */
  renderToggle(key, label, section = 'display') {
    const value = section === 'interactions' ? this.config.interactions[key] : this.config.display[key];
    return `
      <div class="flex items-center justify-between py-2 border-b border-gray-100">
        <label class="text-sm text-gray-700">${label}</label>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" ${value ? 'checked' : ''}
                 onchange="visualConfigBuilder.toggle${section === 'interactions' ? 'Interaction' : 'Display'}('${key}', this.checked)"
                 class="sr-only peer">
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>
    `;
  }

  // ============================================
  // MÉTODOS DE ACTUALIZACIÓN
  // ============================================

  switchTab(tabName) {
    // Actualizar botones de tabs
    document.querySelectorAll('.config-tab').forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('border-purple-500', 'text-purple-600');
        tab.classList.remove('border-transparent', 'text-gray-600');
      } else {
        tab.classList.remove('border-purple-500', 'text-purple-600');
        tab.classList.add('border-transparent', 'text-gray-600');
      }
    });

    // Mostrar contenido del tab
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    document.getElementById(`tab-${tabName}`)?.classList.remove('hidden');
  }

  setColorType(type) {
    this.config.colorScheme.type = type;
    if (type === 'gradient' && (!this.config.colorScheme.gradients || this.config.colorScheme.gradients.length === 0)) {
      this.config.colorScheme.gradients = [{ start: '#667eea', end: '#764ba2' }];
    }
    this.render();
    this.notifyUpdate();
  }

  selectPalette(paletteName) {
    this.config.colorScheme.preset = paletteName;
    this.notifyUpdate();
    this.render();
  }

  addCustomColor() {
    if (!this.config.colorScheme.customColors) this.config.colorScheme.customColors = [];
    this.config.colorScheme.customColors.push('#667eea');
    this.render();
  }

  updateCustomColor(index, color) {
    this.config.colorScheme.customColors[index] = color;
    this.notifyUpdate();
  }

  removeCustomColor(index) {
    this.config.colorScheme.customColors.splice(index, 1);
    this.render();
    this.notifyUpdate();
  }

  updateGradient(position, color) {
    if (!this.config.colorScheme.gradients) this.config.colorScheme.gradients = [{}];
    this.config.colorScheme.gradients[0][position] = color;
    this.render();
    this.notifyUpdate();
  }

  setTheme(theme) {
    this.config.theme = theme;
    this.notifyUpdate();
  }

  toggleDisplay(key, value) {
    this.config.display[key] = value;
    this.render();
    this.notifyUpdate();
  }

  toggleInteraction(key, value) {
    this.config.interactions[key] = value;
    this.notifyUpdate();
  }

  setLegendPosition(position) {
    this.config.display.legendPosition = position;
    this.render();
    this.notifyUpdate();
  }

  setAxisLabel(axis, label) {
    this.config.display[`${axis}Axis`].label = label;
    this.notifyUpdate();
  }

  setAxisMin(axis, value) {
    this.config.display[`${axis}Axis`].min = value ? parseFloat(value) : null;
    this.notifyUpdate();
  }

  setAxisMax(axis, value) {
    this.config.display[`${axis}Axis`].max = value ? parseFloat(value) : null;
    this.notifyUpdate();
  }

  // ============================================
  // UTILIDADES
  // ============================================

  getConfig() {
    return this.config;
  }

  setConfig(config) {
    this.config = config;
    this.render();
  }

  notifyUpdate() {
    this.options.onUpdate(this.config);
  }
}

// Variable global para el instance
let visualConfigBuilder = null;
