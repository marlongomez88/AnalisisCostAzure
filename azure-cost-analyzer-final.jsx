import React, { useState, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Upload, FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, AlertCircle, Download, RefreshCw, Info, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

const AzureCostAnalyzerFinal = () => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [period1, setPeriod1] = useState('Mes 1');
  const [period2, setPeriod2] = useState('Mes 2');
  const [exportingPDF, setExportingPDF] = useState(false);
  const fileInput1 = useRef(null);
  const fileInput2 = useRef(null);
  const reportRef = useRef(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D', '#A78BFA', '#34D399'];

  const processFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const validateData = (data) => {
    if (!data || data.length === 0) throw new Error('El archivo está vacío');
    const requiredColumns = ['End User Price', 'Meter Category', 'Resource Group'];
    const columns = Object.keys(data[0]);
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    if (missingColumns.length > 0) throw new Error(`Columnas faltantes: ${missingColumns.join(', ')}`);
    return true;
  };

  const extractPeriod = (data) => {
    if (data.length > 0 && data[0]['Usage Date']) {
      const usageDate = data[0]['Usage Date'];
      const match = usageDate.match(/(\d+)\/\d+\/(\d+)/);
      if (match) {
        const month = parseInt(match[1]);
        const year = match[2];
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${monthNames[month - 1]} ${year}`;
      }
    }
    return null;
  };

  const analyzeData = (data1, data2, period1Name, period2Name) => {
    const categoriesMonth1 = {}, categoriesMonth2 = {};
    const resourcesMonth1 = {}, resourcesMonth2 = {};
    const serviceFamilyMonth1 = {}, serviceFamilyMonth2 = {};
    const serviceNameMonth1 = {}, serviceNameMonth2 = {};
    const locationMonth1 = {}, locationMonth2 = {};
    let totalMonth1 = 0, totalMonth2 = 0;

    data1.forEach(row => {
      const price = parseFloat(row['End User Price']) || 0;
      const category = row['Meter Category'] || 'Sin categoría';
      const resource = row['Resource Group'] || 'Sin grupo';
      const serviceFamily = row['Service Family'] || 'Sin familia';
      const serviceName = row['Service Name'] || 'Sin nombre';
      const location = row['Resource Location'] || 'Sin ubicación';
      
      categoriesMonth1[category] = (categoriesMonth1[category] || 0) + price;
      resourcesMonth1[resource] = (resourcesMonth1[resource] || 0) + price;
      serviceFamilyMonth1[serviceFamily] = (serviceFamilyMonth1[serviceFamily] || 0) + price;
      serviceNameMonth1[serviceName] = (serviceNameMonth1[serviceName] || 0) + price;
      locationMonth1[location] = (locationMonth1[location] || 0) + price;
      totalMonth1 += price;
    });

    data2.forEach(row => {
      const price = parseFloat(row['End User Price']) || 0;
      const category = row['Meter Category'] || 'Sin categoría';
      const resource = row['Resource Group'] || 'Sin grupo';
      const serviceFamily = row['Service Family'] || 'Sin familia';
      const serviceName = row['Service Name'] || 'Sin nombre';
      const location = row['Resource Location'] || 'Sin ubicación';
      
      categoriesMonth2[category] = (categoriesMonth2[category] || 0) + price;
      resourcesMonth2[resource] = (resourcesMonth2[resource] || 0) + price;
      serviceFamilyMonth2[serviceFamily] = (serviceFamilyMonth2[serviceFamily] || 0) + price;
      serviceNameMonth2[serviceName] = (serviceNameMonth2[serviceName] || 0) + price;
      locationMonth2[location] = (locationMonth2[location] || 0) + price;
      totalMonth2 += price;
    });

    const delta = totalMonth2 - totalMonth1;
    const deltaPercent = totalMonth1 > 0 ? ((delta / totalMonth1) * 100) : 0;

    const top5Month1 = Object.entries(serviceNameMonth1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ 
        name: name.length > 30 ? name.substring(0, 27) + '...' : name, 
        value, 
        percent: (value / totalMonth1 * 100).toFixed(1) 
      }));

    const top5Month2 = Object.entries(serviceNameMonth2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ 
        name: name.length > 30 ? name.substring(0, 27) + '...' : name, 
        value, 
        percent: (value / totalMonth2 * 100).toFixed(1) 
      }));

    const serviceFamilyAnalysis = Object.entries(serviceFamilyMonth2)
      .map(([name, value]) => ({
        name,
        value,
        percent: ((value / totalMonth2) * 100).toFixed(1),
        change: value - (serviceFamilyMonth1[name] || 0)
      }))
      .sort((a, b) => b.value - a.value);

    const categoryChanges = {};
    const allCategories = new Set([...Object.keys(categoriesMonth1), ...Object.keys(categoriesMonth2)]);
    
    allCategories.forEach(category => {
      const val1 = categoriesMonth1[category] || 0;
      const val2 = categoriesMonth2[category] || 0;
      const change = val2 - val1;
      if (Math.abs(change) > 0.01) {
        categoryChanges[category] = {
          month1: val1,
          month2: val2,
          change: change,
          changePercent: val1 > 0 ? ((change / val1) * 100) : 100
        };
      }
    });

    const topDrivers = Object.entries(categoryChanges)
      .sort((a, b) => Math.abs(b[1].change) - Math.abs(a[1].change))
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        change: data.change,
        changePercent: data.changePercent,
        type: data.change > 0 ? 'increase' : 'decrease'
      }));

    const locationAnalysis = Object.entries(locationMonth2)
      .map(([name, value]) => ({
        name,
        value,
        percent: ((value / totalMonth2) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const paretoData = Object.entries(resourcesMonth2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, value]) => ({
        name: name.length > 25 ? name.substring(0, 22) + '...' : name,
        value,
        percent: (value / totalMonth2 * 100).toFixed(1)
      }));

    let accumulatedPercent = 0;
    paretoData.forEach(item => {
      accumulatedPercent += parseFloat(item.percent);
      item.accumulated = accumulatedPercent;
    });

    const categoryMix = Object.entries(categoriesMonth2)
      .map(([name, value]) => ({
        name: name.length > 25 ? name.substring(0, 22) + '...' : name,
        value,
        percent: ((value / totalMonth2) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value);

    const monthlyComparison = [
      { month: period1Name, value: totalMonth1 },
      { month: period2Name, value: totalMonth2 }
    ];

    return {
      totalMonth1, totalMonth2, delta, deltaPercent,
      top5Month1, top5Month2, categoryChanges, topDrivers,
      paretoData, categoryMix, monthlyComparison,
      serviceFamilyAnalysis, locationAnalysis,
      totalRecordsMonth1: data1.length,
      totalRecordsMonth2: data2.length
    };
  };

  const generateRecommendations = async (analysisData, period1Name, period2Name) => {
    try {
      const prompt = `Analiza estos datos de Azure y genera 6 recomendaciones de ahorro:

DATOS:
- ${period1Name}: $${analysisData.totalMonth1.toFixed(2)}
- ${period2Name}: $${analysisData.totalMonth2.toFixed(2)}
- Cambio: ${analysisData.deltaPercent.toFixed(1)}%

TOP 5:
${analysisData.top5Month2.map(s => `- ${s.name}: $${s.value.toFixed(2)}`).join('\n')}

Responde SOLO con JSON (sin markdown):
{
  "recommendations": [
    {
      "title": "Título",
      "description": "Descripción",
      "impact": "Alto/Medio/Bajo",
      "estimatedSavings": 1000,
      "category": "Categoría"
    }
  ]
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2500,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      let responseText = data.content[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(responseText);
      return parsed.recommendations || [];
    } catch (error) {
      return [{
        title: "Optimizar recursos principales",
        description: "Revisar servicios de mayor costo para oportunidades",
        impact: "Alto",
        estimatedSavings: analysisData.totalMonth2 * 0.15,
        category: "General"
      }];
    }
  };

  const handleFileUpload = async (fileNumber) => {
    try {
      setLoading(true);
      setError(null);
      const file = fileNumber === 1 ? file1 : file2;
      if (!file) throw new Error('Seleccione un archivo');
      const processedData = await processFile(file);
      validateData(processedData);
      const period = extractPeriod(processedData);
      if (fileNumber === 1) {
        setData1(processedData);
        if (period) setPeriod1(period);
      } else {
        setData2(processedData);
        if (period) setPeriod2(period);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!data1 || !data2) {
      setError('Debe cargar ambos archivos');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const analysisResult = analyzeData(data1, data2, period1, period2);
      setAnalysis(analysisResult);
      const recs = await generateRecommendations(analysisResult, period1, period2);
      setRecommendations(recs);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Función mejorada de exportación a PDF usando window.print()
  const exportToPDF = async () => {
    try {
      setExportingPDF(true);
      
      // Crear una ventana temporal con el contenido
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Por favor, permite ventanas emergentes para exportar el PDF.\n\nLuego intenta de nuevo.');
        setExportingPDF(false);
        return;
      }

      // Obtener el contenido HTML
      const reportContent = reportRef.current.innerHTML;
      
      // Crear el documento HTML completo con estilos
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Análisis Azure - ${period1} vs ${period2}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              line-height: 1.5;
              color: #1f2937;
              background: white;
            }
            .page-container { 
              max-width: 1200px; 
              margin: 0 auto; 
              padding: 20px;
            }
            h1 { 
              font-size: 32px; 
              font-weight: bold; 
              margin-bottom: 8px;
              color: #1e40af;
            }
            h2 { 
              font-size: 24px; 
              font-weight: bold; 
              margin: 24px 0 16px;
              color: #1f2937;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 8px;
            }
            h3 { 
              font-size: 20px; 
              font-weight: 600; 
              margin: 16px 0 12px;
              color: #374151;
            }
            .header-banner {
              background: linear-gradient(to right, #2563eb, #1e40af);
              color: white;
              padding: 32px;
              border-radius: 8px;
              margin-bottom: 24px;
            }
            .header-subtitle { 
              color: #bfdbfe; 
              font-size: 14px;
              margin-top: 8px;
            }
            .kpi-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 16px; 
              margin-bottom: 24px;
            }
            .kpi-card { 
              background: white; 
              padding: 20px; 
              border-radius: 8px; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border: 1px solid #e5e7eb;
            }
            .kpi-title { 
              font-size: 12px; 
              color: #6b7280; 
              margin-bottom: 8px;
            }
            .kpi-value { 
              font-size: 28px; 
              font-weight: bold;
              color: #1f2937;
            }
            .kpi-change { 
              font-size: 14px; 
              margin-top: 8px;
              font-weight: 600;
            }
            .kpi-change.positive { color: #dc2626; }
            .kpi-change.negative { color: #16a34a; }
            .chart-container { 
              background: white; 
              padding: 24px; 
              border-radius: 8px; 
              margin-bottom: 24px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border: 1px solid #e5e7eb;
              page-break-inside: avoid;
            }
            .grid-2 { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 16px;
              margin-bottom: 24px;
            }
            .driver-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 16px;
              background: #f9fafb;
              border-radius: 6px;
              margin-bottom: 12px;
              border-left: 4px solid #3b82f6;
            }
            .driver-number {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              margin-right: 16px;
              font-size: 14px;
            }
            .driver-increase { background: #fee2e2; color: #dc2626; }
            .driver-decrease { background: #dcfce7; color: #16a34a; }
            .driver-info { flex: 1; }
            .driver-name { font-weight: 600; margin-bottom: 4px; }
            .driver-type { font-size: 14px; color: #6b7280; }
            .driver-value { text-align: right; }
            .driver-amount { font-size: 18px; font-weight: bold; }
            .driver-percent { font-size: 14px; color: #6b7280; }
            .recommendation {
              border-left: 4px solid #3b82f6;
              background: #eff6ff;
              padding: 16px;
              border-radius: 4px;
              margin-bottom: 16px;
              page-break-inside: avoid;
            }
            .rec-header {
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 12px;
            }
            .rec-number {
              background: #3b82f6;
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              margin-right: 12px;
            }
            .rec-title {
              font-weight: bold;
              font-size: 16px;
              flex: 1;
            }
            .impact-badge {
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              white-space: nowrap;
            }
            .impact-alto { background: #fee2e2; color: #dc2626; }
            .impact-medio { background: #fef3c7; color: #d97706; }
            .impact-bajo { background: #dcfce7; color: #16a34a; }
            .rec-description {
              font-size: 14px;
              color: #374151;
              margin-bottom: 12px;
              line-height: 1.6;
            }
            .rec-footer {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
            }
            .rec-category { color: #6b7280; }
            .rec-savings { color: #16a34a; font-weight: bold; font-size: 16px; }
            .summary-footer {
              background: linear-gradient(to right, #1f2937, #111827);
              color: white;
              padding: 24px;
              border-radius: 8px;
              margin-top: 24px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 24px;
              margin-top: 16px;
            }
            .summary-item-title {
              color: #d1d5db;
              font-size: 14px;
              margin-bottom: 4px;
            }
            .summary-item-value {
              font-weight: 600;
              font-size: 16px;
            }
            .date-generated {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 24px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            }
            th {
              background: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              border-bottom: 2px solid #e5e7eb;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .chart-container, .recommendation { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="header-banner">
              <h1>Azure Cost Analyzer - Reporte Profesional</h1>
              <div class="header-subtitle">Análisis comparativo: ${period1} vs ${period2}</div>
              <div class="header-subtitle">Generado: ${new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}</div>
            </div>
            ${reportContent}
            <div class="date-generated">
              Documento generado automáticamente por Azure Cost Analyzer<br>
              © ${new Date().getFullYear()} - Análisis de Costos Azure Cloud
            </div>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // Esperar a que se cargue el contenido
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
          setExportingPDF(false);
        }, 500);
      }, 500);

    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
      setExportingPDF(false);
    }
  };

  const exportToExcel = () => {
    if (!analysis) return;
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['ANÁLISIS DE CONSUMO AZURE'],
      ['Fecha: ' + new Date().toLocaleDateString()],
      [''],
      ['Métrica', period1, period2, 'Cambio'],
      ['Gasto Total', '$' + analysis.totalMonth1.toFixed(2), '$' + analysis.totalMonth2.toFixed(2), '$' + analysis.delta.toFixed(2)],
      [''],
      ['TOP 5 SERVICIOS'],
      ['Servicio', 'Costo', '% Total'],
      ...analysis.top5Month2.map(s => [s.name, '$' + s.value.toFixed(2), s.percent + '%'])
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Resumen');

    const recData = [
      ['RECOMENDACIONES'],
      ['Título', 'Descripción', 'Impacto', 'Ahorro'],
      ...recommendations.map(r => [r.title, r.description, r.impact, '$' + r.estimatedSavings.toFixed(2)])
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(recData), 'Recomendaciones');
    XLSX.writeFile(wb, `Azure_Analysis_${period1}_vs_${period2}.xlsx`);
  };

  const FileUploadCard = ({ fileNumber, file, setFile, onUpload, period }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all">
      <div className="flex flex-col items-center">
        <FileSpreadsheet className="w-12 h-12 text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Archivo {fileNumber}</h3>
        <p className="text-sm text-gray-600 mb-4">{period || `Período ${fileNumber}`}</p>
        <input
          ref={fileNumber === 1 ? fileInput1 : fileInput2}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files[0])}
          className="hidden"
        />
        <button
          onClick={() => (fileNumber === 1 ? fileInput1 : fileInput2).current.click()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mb-2"
        >
          <Upload className="inline w-4 h-4 mr-2" />
          Seleccionar Excel
        </button>
        {file && (
          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-green-600 mb-2">✓ {file.name}</p>
            <button
              onClick={() => onUpload(fileNumber)}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm disabled:opacity-50"
            >
              Procesar
            </button>
          </div>
        )}
        {(fileNumber === 1 ? data1 : data2) && (
          <p className="mt-2 text-sm text-green-600 font-semibold">
            ✓ {(fileNumber === 1 ? data1 : data2).length} registros
          </p>
        )}
      </div>
    </div>
  );

  const KPICard = ({ title, value, change, icon: Icon }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold">${typeof value === 'number' ? value.toFixed(2) : value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-2 flex items-center ${change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </p>
          )}
        </div>
        <Icon className="w-12 h-12 text-blue-500 opacity-50" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Azure Cost Analyzer Pro</h1>
          <p className="text-blue-100">Análisis profesional con exportación PDF mejorada</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {!analysis && (
          <div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-blue-700 font-semibold">Formato: Azure Cost Management (.xlsx)</p>
                  <p className="text-blue-600 text-sm mt-1">Columnas requeridas: End User Price, Meter Category, Resource Group</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Carga de Archivos</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <FileUploadCard fileNumber={1} file={file1} setFile={setFile1} onUpload={handleFileUpload} period={period1} />
              <FileUploadCard fileNumber={2} file={file2} setFile={setFile2} onUpload={handleFileUpload} period={period2} />
            </div>

            {data1 && data2 && (
              <div className="text-center">
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 text-lg font-semibold shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <><RefreshCw className="inline w-5 h-5 mr-2 animate-spin" /> Analizando...</>
                  ) : (
                    <>🚀 Analizar Datos</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {analysis && (
          <div>
            {/* Action Buttons */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <p className="text-gray-600">{period1} vs {period2}</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={exportToPDF}
                  disabled={exportingPDF}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
                >
                  {exportingPDF ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generando...</>
                  ) : (
                    <><FileText className="w-4 h-4 mr-2" /> Exportar PDF</>
                  )}
                </button>
                <button
                  onClick={exportToExcel}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </button>
                <button
                  onClick={() => {
                    setAnalysis(null);
                    setData1(null);
                    setData2(null);
                    setFile1(null);
                    setFile2(null);
                    setRecommendations([]);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Nuevo Análisis
                </button>
              </div>
            </div>

            {/* Contenido del reporte (oculto para referencia) */}
            <div ref={reportRef} style={{ display: 'none' }}>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-title">Gasto {period1}</div>
                  <div className="kpi-value">${analysis.totalMonth1.toFixed(2)}</div>
                  <div className="kpi-change">{analysis.totalRecordsMonth1} registros</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-title">Gasto {period2}</div>
                  <div className="kpi-value">${analysis.totalMonth2.toFixed(2)}</div>
                  <div className={`kpi-change ${analysis.deltaPercent >= 0 ? 'positive' : 'negative'}`}>
                    {analysis.deltaPercent >= 0 ? '↑' : '↓'} {Math.abs(analysis.deltaPercent).toFixed(1)}%
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-title">Variación</div>
                  <div className="kpi-value">${Math.abs(analysis.delta).toFixed(2)}</div>
                  <div className={`kpi-change ${analysis.delta >= 0 ? 'positive' : 'negative'}`}>
                    {analysis.delta >= 0 ? 'Incremento' : 'Ahorro'}
                  </div>
                </div>
                <div className="kpi-card" style={{ background: 'linear-gradient(to bottom right, #8b5cf6, #6d28d9)', color: 'white' }}>
                  <div className="kpi-title" style={{ color: 'rgba(255,255,255,0.9)' }}>Ahorro Potencial</div>
                  <div className="kpi-value">${recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0).toFixed(2)}</div>
                  <div className="kpi-change" style={{ color: 'rgba(255,255,255,0.9)' }}>{recommendations.length} oportunidades</div>
                </div>
              </div>

              <h2>Comparación Mensual</h2>
              <div className="chart-container">
                <table>
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th style={{ textAlign: 'right' }}>Gasto (USD)</th>
                      <th style={{ textAlign: 'right' }}>Cambio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>{period1}</strong></td>
                      <td style={{ textAlign: 'right' }}>${analysis.totalMonth1.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>-</td>
                    </tr>
                    <tr>
                      <td><strong>{period2}</strong></td>
                      <td style={{ textAlign: 'right' }}>${analysis.totalMonth2.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: analysis.delta >= 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                        {analysis.delta >= 0 ? '+' : ''}${analysis.delta.toFixed(2)} ({analysis.deltaPercent.toFixed(1)}%)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>Top 5 Servicios - {period2}</h2>
              <div className="chart-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Servicio</th>
                      <th style={{ textAlign: 'right' }}>Costo (USD)</th>
                      <th style={{ textAlign: 'right' }}>% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.top5Month2.map((service, index) => (
                      <tr key={index}>
                        <td><strong>{index + 1}</strong></td>
                        <td>{service.name}</td>
                        <td style={{ textAlign: 'right' }}>${service.value.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>{service.percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2>Análisis por Familia de Servicio</h2>
              <div className="chart-container">
                <table>
                  <thead>
                    <tr>
                      <th>Familia</th>
                      <th style={{ textAlign: 'right' }}>Costo (USD)</th>
                      <th style={{ textAlign: 'right' }}>% del Total</th>
                      <th style={{ textAlign: 'right' }}>Cambio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.serviceFamilyAnalysis.slice(0, 6).map((family, index) => (
                      <tr key={index}>
                        <td><strong>{family.name}</strong></td>
                        <td style={{ textAlign: 'right' }}>${family.value.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>{family.percent}%</td>
                        <td style={{ textAlign: 'right', color: family.change >= 0 ? '#dc2626' : '#16a34a' }}>
                          {family.change >= 0 ? '+' : ''}${family.change.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2>Principales Impulsores de Cambio</h2>
              <div className="chart-container">
                {analysis.topDrivers.map((driver, index) => (
                  <div key={index} className="driver-item">
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div className={`driver-number ${driver.type === 'increase' ? 'driver-increase' : 'driver-decrease'}`}>
                        {index + 1}
                      </div>
                      <div className="driver-info">
                        <div className="driver-name">{driver.name}</div>
                        <div className="driver-type">{driver.type === 'increase' ? '📈 Incremento' : '📉 Decremento'}</div>
                      </div>
                    </div>
                    <div className="driver-value">
                      <div className="driver-amount" style={{ color: driver.type === 'increase' ? '#dc2626' : '#16a34a' }}>
                        {driver.change >= 0 ? '+' : ''}${driver.change.toFixed(2)}
                      </div>
                      <div className="driver-percent">
                        {driver.changePercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h2>Recomendaciones de Ahorro</h2>
              <div className="chart-container">
                {recommendations.map((rec, index) => (
                  <div key={index} className="recommendation">
                    <div className="rec-header">
                      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <span className="rec-number">{index + 1}</span>
                        <span className="rec-title">{rec.title}</span>
                      </div>
                      <span className={`impact-badge impact-${rec.impact.toLowerCase()}`}>{rec.impact}</span>
                    </div>
                    <div className="rec-description">{rec.description}</div>
                    <div className="rec-footer">
                      <span className="rec-category">📦 {rec.category}</span>
                      <span className="rec-savings">💵 ${rec.estimatedSavings.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '20px', padding: '16px', background: '#dcfce7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#166534', marginBottom: '4px' }}>
                    <strong>TOTAL AHORRO POTENCIAL ESTIMADO</strong>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>
                    ${recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="summary-footer">
                <h3 style={{ color: 'white', marginBottom: '16px' }}>📊 Resumen Ejecutivo</h3>
                <div className="summary-grid">
                  <div>
                    <div className="summary-item-title">Período Analizado</div>
                    <div className="summary-item-value">{period1} vs {period2}</div>
                  </div>
                  <div>
                    <div className="summary-item-title">Cambio Total</div>
                    <div className="summary-item-value" style={{ color: analysis.delta >= 0 ? '#fca5a5' : '#86efac' }}>
                      {analysis.delta >= 0 ? '+' : ''}${analysis.delta.toFixed(2)} ({analysis.deltaPercent.toFixed(1)}%)
                    </div>
                  </div>
                  <div>
                    <div className="summary-item-title">Ahorro Potencial</div>
                    <div className="summary-item-value" style={{ color: '#86efac' }}>
                      ${recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vista normal del dashboard */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <KPICard title={`Gasto ${period1}`} value={analysis.totalMonth1} icon={DollarSign} />
              <KPICard title={`Gasto ${period2}`} value={analysis.totalMonth2} change={analysis.deltaPercent} icon={DollarSign} />
              <KPICard title="Variación" value={Math.abs(analysis.delta)} icon={analysis.delta >= 0 ? TrendingUp : TrendingDown} />
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-md p-6 text-white">
                <p className="text-sm mb-1">Ahorro Potencial</p>
                <p className="text-2xl font-bold">${recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0).toFixed(2)}</p>
                <p className="text-xs mt-2">{recommendations.length} oportunidades</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">Comparación Mensual</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysis.monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">Top 5 - {period1}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analysis.top5Month1} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={130} />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="value" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">Top 5 - {period2}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analysis.top5Month2} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={130} />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">Principales Impulsores</h3>
              <div className="space-y-3">
                {analysis.topDrivers.map((driver, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        driver.type === 'increase' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{driver.name}</p>
                        <p className="text-sm text-gray-600">
                          {driver.type === 'increase' ? '📈 Incremento' : '📉 Decremento'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${driver.type === 'increase' ? 'text-red-600' : 'text-green-600'}`}>
                        {driver.change >= 0 ? '+' : ''}${driver.change.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">{driver.changePercent.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Recomendaciones de Ahorro</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-green-600">
                    ${recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold flex items-center">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                          {index + 1}
                        </span>
                        {rec.title}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        rec.impact === 'Alto' ? 'bg-red-100 text-red-700' :
                        rec.impact === 'Medio' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rec.impact}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{rec.category}</span>
                      <span className="font-bold text-green-600">${rec.estimatedSavings.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Resumen</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-300 text-sm">Período</p>
                  <p className="font-semibold">{period1} vs {period2}</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Cambio</p>
                  <p className={`font-semibold ${analysis.delta >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {analysis.delta >= 0 ? '+' : ''}${analysis.delta.toFixed(2)} ({analysis.deltaPercent.toFixed(1)}%)
                  </p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Ahorro Potencial</p>
                  <p className="font-semibold text-green-400">
                    ${recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AzureCostAnalyzerFinal;