#!/bin/bash

echo "========================================"
echo "Azure Cost Analyzer - Instalación"
echo "AYURA MOTOR S.A"
echo "========================================"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no está instalado"
    echo ""
    echo "Descarga Node.js desde: https://nodejs.org/"
    echo "Después de instalar, ejecuta este script nuevamente."
    echo ""
    exit 1
fi

echo "[OK] Node.js encontrado"
node --version
echo ""

echo "[1/3] Instalando dependencias..."
echo "(Esto puede tomar 2-3 minutos)"
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Falló al instalar dependencias"
    exit 1
fi

echo ""
echo "[2/3] Verificando instalación..."
if [ ! -d "node_modules" ]; then
    echo "[ERROR] node_modules no fue creado"
    exit 1
fi

echo ""
echo "[3/3] Preparando aplicación..."
echo ""

echo "========================================"
echo "¡INSTALACIÓN COMPLETADA CON ÉXITO!"
echo "========================================"
echo ""
echo "Para iniciar la aplicación:"
echo ""
echo "  1. En esta carpeta ejecuta: npm start"
echo "  2. La aplicación se abrirá en http://localhost:3000"
echo ""
echo "O simplemente ejecuta: ./iniciar.sh"
echo ""
echo "Para compilar para producción:"
echo "  npm run build"
echo ""
