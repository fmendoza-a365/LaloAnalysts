/**
 * Advanced Charts Components - Power BI Style
 * Componentes de gráficos avanzados inspirados en Power BI
 *
 * Tipos de gráficos:
 * - Gauge (Medidor circular con rangos de colores)
 * - Waterfall (Cascada para mostrar cambios acumulativos)
 * - Funnel (Embudo para procesos de conversión)
 * - Treemap (Mapa de árbol para jerarquías)
 */

/**
 * Renderizar gráfico tipo Gauge (Medidor)
 * Similar al "Gauge" de Power BI
 */
function renderGaugeChart(canvas, data, config) {
  const ctx = canvas.getContext('2d');
  const { min, max, target, ranges, unit, showValue, showRanges } = config;

  // Valor actual (tomar el primer valor del dataset)
  const value = data.datasets && data.datasets[0] && data.datasets[0].data && data.datasets[0].data[0]
    ? data.datasets[0].data[0]
    : 0;

  // Calcular porcentaje
  const percentage = ((value - min) / (max - min)) * 100;

  // Dimensiones del canvas
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height * 0.7; // Más abajo para dejar espacio al texto
  const radius = Math.min(width, height) * 0.35;

  // Limpiar canvas
  ctx.clearRect(0, 0, width, height);

  // Configuración del gauge
  const startAngle = Math.PI; // 180 grados
  const endAngle = 2 * Math.PI; // 360 grados (semicírculo)
  const lineWidth = radius * 0.3;

  // Dibujar rangos de fondo
  if (showRanges && ranges && ranges.length > 0) {
    ranges.forEach(range => {
      const rangeStartAngle = startAngle + ((range.from - min) / (max - min)) * Math.PI;
      const rangeEndAngle = startAngle + ((range.to - min) / (max - min)) * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, rangeStartAngle, rangeEndAngle);
      ctx.strokeStyle = range.color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
  } else {
    // Fondo por defecto (gris claro)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Dibujar aguja/indicador
  const needleAngle = startAngle + (percentage / 100) * Math.PI;
  const needleLength = radius - lineWidth / 2;

  // Sombra de la aguja
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Dibujar triángulo de aguja
  ctx.beginPath();
  const needleEndX = centerX + Math.cos(needleAngle) * needleLength;
  const needleEndY = centerY + Math.sin(needleAngle) * needleLength;

  const needleWidth = 8;
  const angle1 = needleAngle - Math.PI / 2;
  const angle2 = needleAngle + Math.PI / 2;

  ctx.moveTo(centerX + Math.cos(angle1) * needleWidth, centerY + Math.sin(angle1) * needleWidth);
  ctx.lineTo(needleEndX, needleEndY);
  ctx.lineTo(centerX + Math.cos(angle2) * needleWidth, centerY + Math.sin(angle2) * needleWidth);
  ctx.closePath();

  ctx.fillStyle = '#374151';
  ctx.fill();

  ctx.restore();

  // Dibujar círculo central
  ctx.beginPath();
  ctx.arc(centerX, centerY, needleWidth * 2, 0, 2 * Math.PI);
  ctx.fillStyle = '#6b7280';
  ctx.fill();

  // Mostrar valor actual
  if (showValue) {
    ctx.font = `bold ${radius * 0.4}px Arial`;
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const displayValue = unit ? `${value}${unit}` : value;
    ctx.fillText(displayValue, centerX, centerY + radius * 0.3);
  }

  // Mostrar etiquetas min/max
  ctx.font = `${radius * 0.15}px Arial`;
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'left';
  ctx.fillText(min + (unit || ''), centerX - radius - 20, centerY + 10);
  ctx.textAlign = 'right';
  ctx.fillText(max + (unit || ''), centerX + radius + 20, centerY + 10);

  // Mostrar línea de objetivo si existe
  if (target !== null && target !== undefined && !isNaN(target)) {
    const targetPercentage = ((target - min) / (max - min)) * 100;
    const targetAngle = startAngle + (targetPercentage / 100) * Math.PI;

    ctx.beginPath();
    const targetX = centerX + Math.cos(targetAngle) * (radius + lineWidth / 2 + 10);
    const targetY = centerY + Math.sin(targetAngle) * (radius + lineWidth / 2 + 10);
    ctx.moveTo(centerX + Math.cos(targetAngle) * (radius - lineWidth / 2 - 10),
               centerY + Math.sin(targetAngle) * (radius - lineWidth / 2 - 10));
    ctx.lineTo(targetX, targetY);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Etiqueta de objetivo
    ctx.font = `bold ${radius * 0.12}px Arial`;
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.fillText('Meta: ' + target + (unit || ''), centerX, height - 20);
  }

  // Mostrar etiquetas de rangos si están definidos
  if (showRanges && ranges && ranges.length > 0) {
    const legendY = height - 15;
    let legendX = 20;

    ctx.font = `${radius * 0.12}px Arial`;
    ranges.forEach(range => {
      // Cuadrado de color
      ctx.fillStyle = range.color;
      ctx.fillRect(legendX, legendY - 8, 12, 12);

      // Texto
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'left';
      ctx.fillText(range.label, legendX + 18, legendY);

      legendX += ctx.measureText(range.label).width + 40;
    });
  }
}

/**
 * Renderizar gráfico tipo Waterfall (Cascada)
 * Similar al "Waterfall Chart" de Power BI
 */
function renderWaterfallChart(canvas, data, config) {
  // Usar Chart.js con configuración especial para waterfall
  const ctx = canvas.getContext('2d');

  // Calcular valores acumulativos
  const labels = data.labels || [];
  const values = data.datasets[0]?.data || [];

  let cumulative = 0;
  const waterfallData = values.map((value, index) => {
    const start = cumulative;
    cumulative += value;
    return {
      x: labels[index],
      y: [start, cumulative],
      value: value,
      isPositive: value >= 0
    };
  });

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Incremento',
          data: waterfallData.filter(d => d.isPositive).map(d => ({ x: d.x, y: d.y })),
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1
        },
        {
          label: 'Decremento',
          data: waterfallData.filter(d => !d.isPositive).map(d => ({ x: d.x, y: d.y })),
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'x',
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const dataPoint = waterfallData[context.dataIndex];
              return `Cambio: ${dataPoint.value > 0 ? '+' : ''}${dataPoint.value}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

/**
 * Renderizar gráfico tipo Funnel (Embudo)
 * Similar al "Funnel Chart" de Power BI
 */
function renderFunnelChart(canvas, data, config) {
  const ctx = canvas.getContext('2d');
  const labels = data.labels || [];
  const values = data.datasets[0]?.data || [];

  const width = canvas.width;
  const height = canvas.height;
  const padding = 40;
  const maxValue = Math.max(...values);

  // Limpiar canvas
  ctx.clearRect(0, 0, width, height);

  // Calcular dimensiones de cada sección del embudo
  const sectionHeight = (height - padding * 2) / values.length;
  const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  values.forEach((value, index) => {
    const topWidth = (value / maxValue) * (width - padding * 2);
    const nextValue = values[index + 1] || 0;
    const bottomWidth = (nextValue / maxValue) * (width - padding * 2);

    const y1 = padding + index * sectionHeight;
    const y2 = padding + (index + 1) * sectionHeight;

    const x1Left = (width - topWidth) / 2;
    const x1Right = (width + topWidth) / 2;
    const x2Left = (width - bottomWidth) / 2;
    const x2Right = (width + bottomWidth) / 2;

    // Dibujar trapecio
    ctx.beginPath();
    ctx.moveTo(x1Left, y1);
    ctx.lineTo(x1Right, y1);
    ctx.lineTo(x2Right, y2);
    ctx.lineTo(x2Left, y2);
    ctx.closePath();

    const color = colors[index % colors.length];
    ctx.fillStyle = color;
    ctx.fill();

    // Borde
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texto - Etiqueta
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[index], width / 2, y1 + sectionHeight / 3);

    // Texto - Valor
    ctx.font = 'bold 18px Arial';
    ctx.fillText(value.toLocaleString(), width / 2, y1 + sectionHeight * 2 / 3);

    // Porcentaje de conversión (respecto al anterior)
    if (index > 0) {
      const conversionRate = ((value / values[index - 1]) * 100).toFixed(1);
      ctx.font = '12px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.fillText(`${conversionRate}%`, width / 2 + topWidth / 2 + 30, y1 + 5);
    }
  });
}

/**
 * Renderizar gráfico tipo Treemap (Mapa de Árbol)
 * Similar al "Treemap" de Power BI
 */
function renderTreemapChart(canvas, data, config) {
  const ctx = canvas.getContext('2d');
  const labels = data.labels || [];
  const values = data.datasets[0]?.data || [];

  const width = canvas.width;
  const height = canvas.height;

  // Limpiar canvas
  ctx.clearRect(0, 0, width, height);

  // Calcular áreas proporcionales
  const total = values.reduce((sum, val) => sum + val, 0);
  const items = labels.map((label, index) => ({
    label,
    value: values[index],
    area: (values[index] / total) * width * height
  }));

  // Ordenar por tamaño descendente
  items.sort((a, b) => b.value - a.value);

  // Algoritmo de squarified treemap simplificado
  const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  let currentX = 0;
  let currentY = 0;
  let rowHeight = 0;
  let remainingWidth = width;

  items.forEach((item, index) => {
    const rect = calculateTreemapRect(item.area, remainingWidth, height, currentX, currentY);

    // Dibujar rectángulo
    const color = colors[index % colors.length];
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // Borde
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    // Texto
    if (rect.width > 60 && rect.height > 40) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Etiqueta
      ctx.fillText(item.label, rect.x + rect.width / 2, rect.y + rect.height / 2 - 10);

      // Valor
      ctx.font = 'bold 16px Arial';
      ctx.fillText(item.value.toLocaleString(), rect.x + rect.width / 2, rect.y + rect.height / 2 + 10);

      // Porcentaje
      ctx.font = '11px Arial';
      const percentage = ((item.value / total) * 100).toFixed(1);
      ctx.fillText(`${percentage}%`, rect.x + rect.width / 2, rect.y + rect.height / 2 + 25);
    }

    // Actualizar posición para siguiente elemento
    currentY += rect.height;
    if (currentY >= height - 10) {
      currentX += rect.width;
      currentY = 0;
      remainingWidth -= rect.width;
    }
  });
}

// Función auxiliar para calcular rectángulo del treemap
function calculateTreemapRect(area, availableWidth, availableHeight, x, y) {
  const aspectRatio = availableWidth / availableHeight;
  let width, height;

  if (aspectRatio > 1) {
    // Horizontal
    width = Math.sqrt(area * aspectRatio);
    height = area / width;
  } else {
    // Vertical
    height = Math.sqrt(area / aspectRatio);
    width = area / height;
  }

  return {
    x: x,
    y: y,
    width: Math.min(width, availableWidth),
    height: Math.min(height, availableHeight)
  };
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
  window.renderGaugeChart = renderGaugeChart;
  window.renderWaterfallChart = renderWaterfallChart;
  window.renderFunnelChart = renderFunnelChart;
  window.renderTreemapChart = renderTreemapChart;
}
