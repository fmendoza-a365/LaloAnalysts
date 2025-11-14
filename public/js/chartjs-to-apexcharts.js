/**
 * Chart.js to ApexCharts Adapter
 * Proporciona una API compatible con Chart.js pero usando ApexCharts por debajo
 * Esto permite migrar gradualmente sin romper código existente
 */

class Chart {
  constructor(ctx, config) {
    // Obtener el elemento canvas o ID
    let element;
    if (typeof ctx === 'string') {
      element = document.getElementById(ctx);
    } else if (ctx.canvas) {
      element = ctx.canvas;
    } else {
      element = ctx;
    }

    // Crear un div contenedor para ApexCharts
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';

    // Reemplazar el canvas con el div
    element.parentNode.replaceChild(container, element);

    // Convertir configuración de Chart.js a ApexCharts
    const apexConfig = this.convertConfig(config);

    // Crear el gráfico ApexCharts
    this.chart = new ApexCharts(container, apexConfig);
    this.chart.render();

    // Guardar referencias
    this.ctx = ctx;
    this.config = config;
  }

  convertConfig(chartJsConfig) {
    const type = chartJsConfig.type;
    const data = chartJsConfig.data;
    const options = chartJsConfig.options || {};

    // Determinar tipo de ApexCharts
    let apexType = this.getApexType(type);

    // Convertir datasets a series
    const series = this.convertSeries(data, type);

    // Convertir opciones
    const apexOptions = {
      chart: {
        type: apexType,
        height: options.height || '100%',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        animations: {
          enabled: true,
          speed: 800
        }
      },
      series: series,
      labels: data.labels || [],
      xaxis: {
        categories: data.labels || [],
        title: {
          text: options.scales?.x?.title?.text || ''
        },
        labels: {
          rotate: options.scales?.x?.ticks?.maxRotation || -45,
          rotateAlways: false,
          trim: true
        }
      },
      yaxis: {
        title: {
          text: options.scales?.y?.title?.text || ''
        },
        min: options.scales?.y?.min,
        max: options.scales?.y?.max
      },
      legend: {
        show: options.plugins?.legend?.display !== false,
        position: options.plugins?.legend?.position || 'top',
        horizontalAlign: 'center'
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        shared: type !== 'pie' && type !== 'doughnut',
        intersect: false
      },
      colors: this.extractColors(data),
      theme: {
        mode: 'light',
        palette: 'palette1'
      }
    };

    // Configuración específica por tipo
    if (type === 'pie' || type === 'doughnut') {
      apexOptions.labels = data.labels;
      delete apexOptions.xaxis;

      if (type === 'doughnut') {
        apexOptions.plotOptions = {
          pie: {
            donut: {
              size: '65%'
            }
          }
        };
      }
    }

    if (type === 'bar' && options.indexAxis === 'y') {
      apexOptions.plotOptions = {
        bar: {
          horizontal: true
        }
      };
    }

    if (type === 'line') {
      apexOptions.stroke = {
        curve: 'smooth',
        width: 2
      };
      apexOptions.markers = {
        size: 4
      };
    }

    // Responsive
    if (options.responsive !== false) {
      apexOptions.chart.width = '100%';
    }

    if (options.maintainAspectRatio === false) {
      apexOptions.chart.height = '100%';
    }

    return apexOptions;
  }

  getApexType(chartJsType) {
    const typeMap = {
      'bar': 'bar',
      'line': 'line',
      'pie': 'pie',
      'doughnut': 'donut',
      'radar': 'radar',
      'polarArea': 'polarArea',
      'bubble': 'bubble',
      'scatter': 'scatter'
    };
    return typeMap[chartJsType] || 'line';
  }

  convertSeries(data, type) {
    if (!data.datasets) return [];

    // Para pie/doughnut, usar estructura diferente
    if (type === 'pie' || type === 'doughnut') {
      // Si hay un solo dataset, usar sus valores
      if (data.datasets.length === 1) {
        return data.datasets[0].data || [];
      }
      // Si hay múltiples datasets, tomar el primero
      return data.datasets[0]?.data || [];
    }

    // Para otros tipos de gráficos
    return data.datasets.map(dataset => ({
      name: dataset.label || 'Series',
      data: dataset.data || []
    }));
  }

  extractColors(data) {
    if (!data.datasets) return undefined;

    const colors = [];
    data.datasets.forEach(dataset => {
      if (dataset.backgroundColor) {
        if (Array.isArray(dataset.backgroundColor)) {
          colors.push(...dataset.backgroundColor);
        } else {
          colors.push(dataset.backgroundColor);
        }
      } else if (dataset.borderColor) {
        if (Array.isArray(dataset.borderColor)) {
          colors.push(...dataset.borderColor);
        } else {
          colors.push(dataset.borderColor);
        }
      }
    });

    // Convertir colores rgba a hex/rgb si es necesario
    return colors.length > 0 ? colors.map(color => this.normalizeColor(color)) : undefined;
  }

  normalizeColor(color) {
    if (typeof color !== 'string') return color;

    // Si ya es hex, retornar
    if (color.startsWith('#')) return color;

    // Si es rgba, convertir a rgb (ApexCharts maneja transparencia diferente)
    if (color.startsWith('rgba')) {
      return color.replace('rgba', 'rgb').replace(/,\s*[\d.]+\)/, ')');
    }

    return color;
  }

  // Métodos de API de Chart.js para compatibilidad
  update() {
    if (this.chart) {
      this.chart.updateOptions(this.convertConfig(this.config));
    }
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  reset() {
    if (this.chart) {
      this.chart.resetSeries();
    }
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.Chart = Chart;
}
