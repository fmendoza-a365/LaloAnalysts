# Carpeta de datos

Usa estas carpetas para colocar los archivos de ejemplo y/o reales.

Estructura sugerida:

- data/finanzas/tarifas: coloca aquí los Excel de tarifas PxQ.
- data/finanzas/volumenes: coloca aquí los Excel de volúmenes diarios.
- data/templates: plantillas y ejemplos de formato.

Convenciones:
- Nombres sugeridos: tarifas_YYYYMM.xlsx, volumenes_YYYYMM.xlsx
- Formatos esperados (sujeto a tu confirmación):
  - Tarifas: campaña, cola, vigencia_desde, vigencia_hasta(opc), costo_unitario, moneda, notas(opc)
  - Volúmenes: fecha, campaña, cola, llamadas_recibidas, llamadas_atendidas, llamadas_facturables, notas(opc)

Nota: Esta carpeta no debe contener datos sensibles si el repo es público.
