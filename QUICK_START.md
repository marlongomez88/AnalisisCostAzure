# 🚀 Guía de Inicio Rápido

## Pasos para Desplegar en GitHub Pages (5 minutos)

### Método 1: Desde la Web de GitHub (Más Fácil)

1. **Ve a GitHub.com** y haz login

2. **Crea un nuevo repositorio:**
   - Click en el botón "+" → "New repository"
   - Nombre: `azure-cost-analysis` (o el que prefieras)
   - Público o privado (ambos funcionan con Pages)
   - ✅ Marca "Add a README file"
   - Click "Create repository"

3. **Sube los archivos:**
   - Click en "Add file" → "Upload files"
   - Arrastra los 5 archivos:
     * index.html
     * styles.css
     * app.js
     * README.md
     * IMPLEMENTATION_NOTES.md
   - Escribe mensaje: "Initial commit"
   - Click "Commit changes"

4. **Activa GitHub Pages:**
   - Ve a "Settings" (en el repositorio)
   - Click en "Pages" (menú izquierdo)
   - En "Source", selecciona "main"
   - Carpeta: "/" (root)
   - Click "Save"
   - ¡Listo! En 1-2 minutos estará disponible en:
     `https://TU_USUARIO.github.io/azure-cost-analysis/`

### Método 2: Desde la Línea de Comandos

```bash
# 1. Descomprime el ZIP
unzip azure-cost-analysis.zip -d azure-cost-analysis

# 2. Navega a la carpeta
cd azure-cost-analysis

# 3. Inicializa Git
git init
git add .
git commit -m "Initial commit: Azure Cost Analysis App"

# 4. Conecta con GitHub (crea el repo primero en GitHub.com)
git remote add origin https://github.com/TU_USUARIO/azure-cost-analysis.git
git branch -M main
git push -u origin main

# 5. Activa GitHub Pages desde la web (Settings → Pages)
```

### Método 3: Con GitHub Desktop (Interfaz Gráfica)

1. Abre GitHub Desktop
2. File → New Repository
3. Name: `azure-cost-analysis`
4. Local Path: Elige ubicación
5. Click "Create Repository"
6. Copia los 5 archivos a la carpeta del repositorio
7. En GitHub Desktop:
   - Verás los archivos en "Changes"
   - Escribe commit message
   - Click "Commit to main"
   - Click "Publish repository"
8. Ve a GitHub.com → tu repo → Settings → Pages
9. Activa Pages (source: main, folder: root)

## 🎯 Primer Uso

1. **Abre la URL de tu app**
   - `https://TU_USUARIO.github.io/azure-cost-analysis/`

2. **Prepara tus archivos de Azure:**
   - Ve al Portal de Azure
   - Cost Management → Export
   - Descarga 2 meses consecutivos en formato Excel

3. **Carga los archivos:**
   - Arrastra el archivo del primer mes a la primera caja
   - Arrastra el archivo del segundo mes a la segunda caja
   - Click "Procesar Análisis"

4. **Explora el dashboard:**
   - Revisa los KPIs en la parte superior
   - Explora cada gráfico
   - Lee las tablas de análisis
   - Revisa las oportunidades de ahorro

5. **Exporta tu reporte:**
   - Click "Exportar PDF" para un reporte ejecutivo
   - Click "Exportar Excel" para análisis detallado

## ✅ Verificación de Funcionamiento

### Checklist después del despliegue:

- [ ] La URL de GitHub Pages carga correctamente
- [ ] Se ve el header "Azure Cost Analysis"
- [ ] Las 2 cajas de carga están visibles
- [ ] Puedes hacer click en "Seleccionar Archivo"
- [ ] El botón "Procesar Análisis" está deshabilitado (normal)

### Checklist después de cargar archivos:

- [ ] Los nombres de archivo aparecen en verde
- [ ] Las cajas tienen borde verde
- [ ] El botón "Procesar Análisis" se habilita
- [ ] Al hacer click, aparece "Procesando archivos..."
- [ ] Después de 1-2 segundos, aparece el dashboard
- [ ] Los KPIs muestran valores correctos
- [ ] Los gráficos se renderizan
- [ ] Las tablas tienen datos

## 🔧 Solución Rápida de Problemas

### "La página no carga"
- Espera 2-3 minutos después de activar Pages
- Verifica que la URL sea correcta
- Fuerza recarga: Ctrl+F5 (Windows) o Cmd+Shift+R (Mac)

### "No reconoce mi archivo"
- Verifica que sea formato .xlsx o .xls
- Asegúrate de que tenga la columna "End User Price"
- Abre el archivo en Excel para verificar que no esté corrupto

### "Los gráficos no aparecen"
- Verifica conexión a internet (CDNs)
- Abre la consola del navegador (F12)
- Busca errores en rojo

### "El PDF no descarga"
- Verifica que el navegador permita descargas
- Prueba con otro navegador
- Desactiva bloqueadores de popups

## 📱 Uso en Móvil

La app es completamente responsive:
- ✅ Funciona en iPhone/iPad
- ✅ Funciona en Android
- ✅ Gráficos táctiles
- ✅ Exportación funcional

## 🎨 Personalización Rápida

### Cambiar colores:
Edita `styles.css`, líneas 12-17:
```css
--primary-color: #0078d4;    /* Color principal */
--success-color: #10b981;     /* Color éxito */
--danger-color: #ef4444;      /* Color alerta */
```

### Cambiar título:
Edita `index.html`, línea 13:
```html
<h1>📊 Azure Cost Analysis</h1>
```

### Modificar umbrales:
Edita `app.js`, función `identifyOpportunities()`:
```javascript
if (data.changePercent > 50)  // Cambiar 50 por otro valor
if (cost > 100)               // Cambiar 100 por otro valor
```

## 📞 Soporte

### Recursos:
- 📖 **README.md**: Documentación completa
- 🔧 **IMPLEMENTATION_NOTES.md**: Detalles técnicos
- 💡 **GitHub Issues**: Reportar problemas
- 🌐 **GitHub Discussions**: Hacer preguntas

### Comunidad:
- Stack Overflow: Tag `azure-cost-management`
- GitHub Discussions en tu repo
- Documentación oficial de Azure

## 🎉 ¡Listo!

Tu app ya está funcionando y lista para analizar tus costos de Azure.

**Próximos pasos sugeridos:**
1. Analiza tus primeros 2 meses
2. Comparte el dashboard con tu equipo
3. Revisa las oportunidades de ahorro
4. Implementa las recomendaciones
5. Repite mensualmente

---

**¿Necesitas ayuda?** Abre un Issue en tu repositorio de GitHub.

**¿Te gustó la app?** ⭐ Dale una estrella al repositorio!
