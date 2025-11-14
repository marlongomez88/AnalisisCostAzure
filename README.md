# 📊 Azure Cost Analysis - Web App

Aplicación web para análisis comparativo de consumos de Azure. Funciona 100% en el navegador sin necesidad de backend.

## 🌟 Características

### Análisis de Datos
- ✅ Carga de 2 archivos Excel/CSV de Azure Cost Management
- ✅ Validación automática de estructura de archivos
- ✅ Detección automática de períodos (meses)
- ✅ Procesamiento y análisis completo en el navegador

### Métricas y Análisis
- 💰 Gasto mensual total comparativo
- 📈 Tendencia y % de cambio entre meses
- 🎯 Distribución por categoría de servicios
- 🏆 Top 10 servicios más costosos
- 💧 Análisis Waterfall (desglose de cambios)
- 📊 Análisis Pareto (regla 80/20 por cliente/área)
- 💡 Identificación automática de oportunidades de ahorro

### Visualizaciones
- 📊 Gráficos interactivos con Chart.js
- 🎨 Dashboard responsive y profesional
- 📱 Diseño adaptable a móviles y tablets
- 🖨️ Optimizado para exportación

### Exportación
- 📄 Exportación a PDF con gráficos
- 📊 Exportación a Excel con datos procesados
- 💾 Descarga directa desde el navegador

## 🚀 Despliegue en GitHub Pages

### Opción 1: Repositorio Nuevo

1. **Crear repositorio en GitHub:**
   ```bash
   # Inicializar repositorio local
   git init
   git add index.html styles.css app.js README.md
   git commit -m "Initial commit: Azure Cost Analysis App"
   
   # Conectar con GitHub (reemplaza con tu usuario y repo)
   git remote add origin https://github.com/TU_USUARIO/azure-cost-analysis.git
   git branch -M main
   git push -u origin main
   ```

2. **Activar GitHub Pages:**
   - Ve a Settings → Pages
   - En "Source", selecciona "main" branch
   - Carpeta: "/" (root)
   - Click en "Save"
   - Tu app estará en: `https://TU_USUARIO.github.io/azure-cost-analysis/`

### Opción 2: Repositorio Existente

1. **Agregar archivos a tu repo:**
   ```bash
   # Clonar tu repositorio
   git clone https://github.com/TU_USUARIO/TU_REPO.git
   cd TU_REPO
   
   # Copiar los archivos
   # (copia index.html, styles.css, app.js)
   
   # Commit y push
   git add .
   git commit -m "Add Azure Cost Analysis App"
   git push
   ```

2. **Activar GitHub Pages** (si no está activo):
   - Settings → Pages → Activar

### Opción 3: GitHub Desktop (Interfaz Gráfica)

1. Abre GitHub Desktop
2. File → New Repository
3. Copia los archivos en la carpeta del repositorio
4. Commit y Publish
5. Activa GitHub Pages desde la web de GitHub

## 📁 Estructura de Archivos

```
azure-cost-analysis/
│
├── index.html          # Página principal
├── styles.css          # Estilos
├── app.js             # Lógica de la aplicación
└── README.md          # Documentación
```

## 🎯 Uso de la Aplicación

### 1. Preparar Archivos
Exporta tus datos de Azure Cost Management:
- Portal Azure → Cost Management → Export
- Formato: Excel (.xlsx) o CSV
- Asegúrate de que incluyan la columna "End User Price"

### 2. Cargar Archivos
1. Arrastra o selecciona el archivo del primer mes
2. Arrastra o selecciona el archivo del segundo mes
3. Click en "Procesar Análisis"

### 3. Explorar Dashboard
- **KPIs**: Vista rápida de gastos y variaciones
- **Gráficos**: Análisis visual de categorías y servicios
- **Waterfall**: Desglose detallado de cambios
- **Pareto**: Concentración de gastos por cliente/área
- **Tablas**: Datos detallados con métricas

### 4. Exportar Resultados
- **PDF**: Reporte ejecutivo con gráficos
- **Excel**: Datos completos para análisis adicional

## 📋 Requisitos de los Archivos

### Columnas Requeridas
- `End User Price` (obligatoria)
- `Usage Date` (para detectar período)
- `Meter Category` o `Service Family` (para categorización)
- `Service Name` o `Meter` (para servicios)
- `Customer Name` o `Resource Group` (para Pareto)

### Formato Soportado
- Excel: .xlsx, .xls
- CSV: con delimitador estándar

## 🔍 Análisis Realizados

### 1. Métricas Principales
- Gasto total por mes
- Variación absoluta y porcentual
- Tendencia (incremento/decremento)

### 2. Análisis por Categoría
- Distribución porcentual
- Cambios mes a mes
- Identificación de categorías en crecimiento

### 3. Top Servicios
- 10 servicios más costosos
- 5 mayores incrementos
- 5 mayores decrementos

### 4. Análisis Waterfall
- Visualización de cambios acumulativos
- Contribución de cada categoría al cambio total

### 5. Análisis Pareto
- Distribución 80/20
- Concentración de gastos por cliente/área
- Identificación de clientes principales

### 6. Oportunidades de Ahorro
- Recursos con incrementos anómalos (>50%)
- Servicios de alto costo (>$100)
- Recursos desaprovechados o sin uso

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura
- **CSS3**: Estilos y responsive design
- **JavaScript (Vanilla)**: Lógica de negocio
- **Chart.js**: Visualizaciones interactivas
- **SheetJS (xlsx)**: Procesamiento de Excel
- **jsPDF**: Generación de PDFs
- **html2canvas**: Captura de gráficos

## ⚙️ Configuración Avanzada

### Personalizar Umbrales
Edita en `app.js`:

```javascript
// Identificar oportunidades
function identifyOpportunities(data1, data2, categories) {
    // Cambiar 50% a otro valor
    if (data.changePercent > 50 && data.change > 10) {
        // ...
    }
    
    // Cambiar $100 a otro valor
    if (cost > 100) {
        // ...
    }
}
```

### Personalizar Categorías
Las categorías se extraen automáticamente de:
1. `Meter Category` (preferido)
2. `Service Family` (alternativo)
3. "Otros" (por defecto)

### Modificar Colores
Edita en `styles.css`:

```css
:root {
    --primary-color: #0078d4;    /* Azul principal */
    --secondary-color: #106ebe;   /* Azul secundario */
    --success-color: #10b981;     /* Verde éxito */
    --warning-color: #f59e0b;     /* Amarillo advertencia */
    --danger-color: #ef4444;      /* Rojo peligro */
}
```

## 🔒 Privacidad y Seguridad

✅ **100% Cliente-Side**: Todo el procesamiento ocurre en tu navegador
✅ **Sin Servidor**: No se envían datos a ningún servidor externo
✅ **Sin Almacenamiento**: Los datos no se guardan después de cerrar
✅ **HTTPS**: GitHub Pages usa HTTPS por defecto

## 🐛 Solución de Problemas

### Error: "Columnas faltantes"
- Verifica que el archivo tenga la columna "End User Price"
- Revisa el formato del archivo exportado de Azure

### Los gráficos no se muestran
- Actualiza la página (F5)
- Verifica la consola del navegador (F12)
- Asegúrate de tener conexión a internet (para CDN)

### El archivo no se carga
- Verifica el tamaño del archivo (<10MB recomendado)
- Confirma que sea formato .xlsx o .csv válido
- Revisa que no esté corrupto

### Exportación PDF incompleta
- Los gráficos complejos pueden tardar en renderizar
- Espera unos segundos antes de exportar
- Reduce el tamaño del navegador para mejor captura

## 📈 Próximas Mejoras

- [ ] Comparación de más de 2 meses
- [ ] Histórico de análisis
- [ ] Alertas personalizables
- [ ] Predicciones con tendencias
- [ ] Integración con Azure API
- [ ] Temas oscuro/claro
- [ ] Modo offline con PWA

## 📄 Licencia

MIT License - Libre para uso personal y comercial

## 👥 Contribuciones

¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/mejora`)
3. Commit tus cambios (`git commit -m 'Agrega nueva función'`)
4. Push a la rama (`git push origin feature/mejora`)
5. Abre un Pull Request

## 📞 Soporte

Si encuentras problemas o tienes sugerencias:
- Abre un Issue en GitHub
- Revisa la documentación
- Consulta los ejemplos de uso

## 🙏 Agradecimientos

Desarrollado para optimizar el análisis de costos de Azure y facilitar la toma de decisiones en gestión de recursos cloud.

---

**Nota**: Esta aplicación es una herramienta de análisis y no reemplaza el Azure Cost Management oficial. Se recomienda validar los resultados con los reportes oficiales de Azure.
