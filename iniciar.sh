#!/bin/bash

echo "========================================"
echo "Azure Cost Analyzer - AYURA MOTOR S.A"
echo "========================================"
echo ""
echo "Iniciando aplicación..."
echo ""

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "[ADVERTENCIA] Dependencias no instaladas"
    echo ""
    echo "Ejecuta primero: ./instalar.sh"
    echo ""
    exit 1
fi

echo "Abriendo en http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

npm start
