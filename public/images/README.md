# Imágenes de Campañas

Este directorio contiene las imágenes que se muestran en las tarjetas de cada campaña en la vista de selección.

## Cómo agregar una imagen a una campaña

1. **Guarda tu imagen** en este directorio (`public/images/`)
   - Formatos recomendados: JPG, PNG
   - Tamaño recomendado: 800x600px o similar (aspect ratio 4:3 o 16:9)
   - Nombre descriptivo: `campaign-nombre.jpg`

2. **Al crear o editar una campaña**, ingresa la ruta de la imagen:
   ```
   /images/nombre-de-tu-imagen.jpg
   ```

3. La imagen se mostrará en la parte superior de la tarjeta de campaña con:
   - Altura: 200px
   - Ajuste: cover (se recorta para cubrir el área)
   - Fondo gradiente azul-índigo si no se carga la imagen

## Ejemplos de nombres de archivo

- `/images/campaign-telecom.jpg` - Para campaña de telecomunicaciones
- `/images/campaign-banking.jpg` - Para campaña de banca
- `/images/campaign-ecommerce.jpg` - Para campaña de e-commerce
- `/images/campaign-seguros.jpg` - Para campaña de seguros
- `/images/default-campaign.jpg` - Imagen por defecto

## Imagen por defecto

Si no especificas una imagen al crear una campaña, se usará automáticamente:
```
/images/default-campaign.jpg
```

Puedes crear tu propia imagen por defecto con este nombre o el sistema mostrará un gradiente azul-índigo.

## Notas

- Las imágenes deben ser representativas de cada campaña/cliente
- Mantén tamaños de archivo razonables (< 500KB recomendado)
- Usa nombres descriptivos sin espacios (usa guiones: `-`)
