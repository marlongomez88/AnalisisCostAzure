// Global variables
let file1Data = null;
let file2Data = null;
let processedData = null;
let charts = {};

// Configure Chart.js DataLabels plugin
Chart.register(ChartDataLabels);
// Disable plugin by default, enable per chart
Chart.defaults.set('plugins.datalabels', {
    display: false
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupFileUpload();
});

// Setup file upload handlers
function setupFileUpload() {
    const file1Input = document.getElementById('file1');
    const file2Input = document.getElementById('file2');
    const uploadBox1 = document.getElementById('uploadBox1');
    const uploadBox2 = document.getElementById('uploadBox2');
    const processBtn = document.getElementById('processBtn');

    // File 1
    file1Input.addEventListener('change', (e) => handleFileUpload(e, 1));
    setupDragDrop(uploadBox1, file1Input);

    // File 2
    file2Input.addEventListener('change', (e) => handleFileUpload(e, 2));
    setupDragDrop(uploadBox2, file2Input);

    // Process button
    processBtn.addEventListener('click', processFiles);
}

// Drag and drop setup
function setupDragDrop(box, input) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        box.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        box.addEventListener(eventName, () => {
            box.style.borderColor = 'var(--primary-color)';
            box.style.background = 'rgba(0, 120, 212, 0.1)';
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        box.addEventListener(eventName, () => {
            box.style.borderColor = '';
            box.style.background = '';
        });
    });

    box.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            input.files = files;
            handleFileUpload({ target: input }, input.id === 'file1' ? 1 : 2);
        }
    });
}

// Handle file upload
async function handleFileUpload(e, fileNum) {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = document.getElementById(`fileName${fileNum}`);
    const uploadBox = document.getElementById(`uploadBox${fileNum}`);
    
    fileName.textContent = `✓ ${file.name}`;
    uploadBox.classList.add('file-loaded');

    try {
        const data = await readExcelFile(file);
        
        if (fileNum === 1) {
            file1Data = data;
        } else {
            file2Data = data;
        }

        // Enable process button if both files loaded
        if (file1Data && file2Data) {
            document.getElementById('processBtn').disabled = false;
        }
    } catch (error) {
        alert(`Error al leer el archivo: ${error.message}`);
        fileName.textContent = '';
        uploadBox.classList.remove('file-loaded');
    }
}

// Read Excel file
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                // Validate required columns
                if (jsonData.length === 0) {
                    reject(new Error('El archivo está vacío'));
                    return;
                }

                const requiredColumns = ['End User Price'];
                const columns = Object.keys(jsonData[0]);
                const missingColumns = requiredColumns.filter(col => !columns.includes(col));
                
                if (missingColumns.length > 0) {
                    reject(new Error(`Columnas faltantes: ${missingColumns.join(', ')}`));
                    return;
                }

                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsArrayBuffer(file);
    });
}

// Process files
async function processFiles() {
    const loadingMsg = document.getElementById('loadingMsg');
    const processBtn = document.getElementById('processBtn');
    
    processBtn.disabled = true;
    loadingMsg.style.display = 'block';

    try {
        // Process and analyze data
        processedData = analyzeData(file1Data, file2Data);
        
        // Hide upload section and show dashboard
        setTimeout(() => {
            document.getElementById('uploadSection').style.display = 'none';
            document.getElementById('dashboardSection').style.display = 'block';
            
            // Render all visualizations
            renderDashboard(processedData);
            
            loadingMsg.style.display = 'none';
        }, 1000);
    } catch (error) {
        alert(`Error al procesar los archivos: ${error.message}`);
        loadingMsg.style.display = 'none';
        processBtn.disabled = false;
    }
}

// Main data analysis function
function analyzeData(data1, data2) {
    const analysis = {
        month1: extractMonthInfo(data1),
        month2: extractMonthInfo(data2),
        comparison: {},
        categories: {},
        topServices: {},
        waterfall: {},
        pareto: {},
        opportunities: []
    };

    // Calculate totals
    analysis.month1.total = calculateTotal(data1);
    analysis.month2.total = calculateTotal(data2);
    
    // Calculate variation
    analysis.comparison.absolute = analysis.month2.total - analysis.month1.total;
    analysis.comparison.percentage = ((analysis.comparison.absolute / analysis.month1.total) * 100).toFixed(2);
    
    // Category analysis
    analysis.categories = analyzeByCategoryComparison(data1, data2);
    
    // Top services
    analysis.topServices = getTopServices(data1, data2);
    
    // Waterfall analysis
    analysis.waterfall = calculateWaterfall(analysis.categories);
    
    // Pareto analysis
    analysis.pareto = calculatePareto(data1, data2);
    
    // Opportunities
    analysis.opportunities = identifyOpportunities(data1, data2, analysis.categories);
    
    return analysis;
}

// Extract month info
function extractMonthInfo(data) {
    if (data.length === 0) return { name: 'N/A', date: null };
    
    const usageDate = data[0]['Usage Date'] || data[0]['usage date'] || '';
    const dateMatch = usageDate.match(/(\d+)\/(\d+)\/(\d+)/);
    
    if (dateMatch) {
        const month = parseInt(dateMatch[1]);
        const year = dateMatch[3];
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                          'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return {
            name: `${monthNames[month - 1]} ${year}`,
            date: new Date(year, month - 1, 1)
        };
    }
    
    return { name: 'Período', date: null };
}

// Calculate total
function calculateTotal(data) {
    return data.reduce((sum, row) => sum + (parseFloat(row['End User Price']) || 0), 0);
}

// Analyze by category
function analyzeByCategoryComparison(data1, data2) {
    const categories1 = groupByCategory(data1);
    const categories2 = groupByCategory(data2);
    
    const allCategories = new Set([...Object.keys(categories1), ...Object.keys(categories2)]);
    const comparison = {};
    
    allCategories.forEach(cat => {
        const cost1 = categories1[cat] || 0;
        const cost2 = categories2[cat] || 0;
        const change = cost2 - cost1;
        const changePercent = cost1 > 0 ? ((change / cost1) * 100) : (cost2 > 0 ? 100 : 0);
        
        comparison[cat] = {
            month1: cost1,
            month2: cost2,
            change: change,
            changePercent: changePercent
        };
    });
    
    return comparison;
}

// Group by category
function groupByCategory(data) {
    const categories = {};
    
    data.forEach(row => {
        const category = row['Meter Category'] || row['Service Family'] || 'Otros';
        const cost = parseFloat(row['End User Price']) || 0;
        categories[category] = (categories[category] || 0) + cost;
    });
    
    return categories;
}

// Get top services
function getTopServices(data1, data2) {
    const services1 = groupByService(data1);
    const services2 = groupByService(data2);
    
    const allServices = new Set([...Object.keys(services1), ...Object.keys(services2)]);
    const serviceList = [];
    
    allServices.forEach(service => {
        const cost1 = services1[service] || 0;
        const cost2 = services2[service] || 0;
        serviceList.push({
            name: service,
            month1: cost1,
            month2: cost2,
            change: cost2 - cost1
        });
    });
    
    // Top by month 2
    const topByMonth2 = [...serviceList]
        .sort((a, b) => b.month2 - a.month2)
        .slice(0, 10);
    
    // Top changes
    const topIncreases = [...serviceList]
        .filter(s => s.change > 0)
        .sort((a, b) => b.change - a.change)
        .slice(0, 5);
    
    const topDecreases = [...serviceList]
        .filter(s => s.change < 0)
        .sort((a, b) => a.change - b.change)
        .slice(0, 5);
    
    return {
        topByMonth2,
        topIncreases,
        topDecreases
    };
}

// Group by service
function groupByService(data) {
    const services = {};
    
    data.forEach(row => {
        const service = row['Service Name'] || row['Meter'] || 'Otros';
        const cost = parseFloat(row['End User Price']) || 0;
        services[service] = (services[service] || 0) + cost;
    });
    
    return services;
}

// Calculate waterfall
function calculateWaterfall(categories) {
    const items = Object.entries(categories)
        .map(([name, data]) => ({
            name,
            value: data.change
        }))
        .filter(item => Math.abs(item.value) > 0.01)
        .sort((a, b) => b.value - a.value);
    
    return items;
}

// Calculate Pareto
function calculatePareto(data1, data2) {
    const clients1 = groupByClient(data1);
    const clients2 = groupByClient(data2);
    
    const allClients = new Set([...Object.keys(clients1), ...Object.keys(clients2)]);
    const clientList = [];
    
    allClients.forEach(client => {
        const cost1 = clients1[client] || 0;
        const cost2 = clients2[client] || 0;
        clientList.push({
            name: client,
            total: cost2
        });
    });
    
    // Sort by total
    clientList.sort((a, b) => b.total - a.total);
    
    // Calculate cumulative percentage
    const totalCost = clientList.reduce((sum, c) => sum + c.total, 0);
    let cumulative = 0;
    
    clientList.forEach(client => {
        cumulative += client.total;
        client.cumulativePercent = (cumulative / totalCost) * 100;
    });
    
    return clientList.slice(0, 15);
}

// Group by client
function groupByClient(data) {
    const clients = {};
    
    data.forEach(row => {
        const client = row['Customer Name'] || row['Resource Group'] || 'Sin clasificar';
        const cost = parseFloat(row['End User Price']) || 0;
        clients[client] = (clients[client] || 0) + cost;
    });
    
    return clients;
}

// Identify savings opportunities
function identifyOpportunities(data1, data2, categories) {
    const opportunities = [];
    
    // 1. Unusual increases
    Object.entries(categories).forEach(([category, data]) => {
        if (data.changePercent > 50 && data.change > 10) {
            opportunities.push({
                type: 'Incremento Anómalo',
                description: `${category} aumentó ${data.changePercent.toFixed(1)}%`,
                impact: data.change,
                priority: data.change > 100 ? 'Alta' : 'Media'
            });
        }
    });
    
    // 2. High cost services
    const services2 = groupByService(data2);
    Object.entries(services2).forEach(([service, cost]) => {
        if (cost > 100) {
            opportunities.push({
                type: 'Alto Costo',
                description: `${service} representa $${cost.toFixed(2)}`,
                impact: cost * 0.2, // Potential 20% savings
                priority: cost > 300 ? 'Alta' : 'Media'
            });
        }
    });
    
    // 3. Zero cost services (potential waste)
    const services1 = groupByService(data1);
    Object.entries(services1).forEach(([service, cost]) => {
        if (cost > 5 && (!services2[service] || services2[service] < 1)) {
            opportunities.push({
                type: 'Recurso Desaprovechado',
                description: `${service} ya no está en uso`,
                impact: cost,
                priority: 'Baja'
            });
        }
    });
    
    // Sort by impact
    return opportunities
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 10);
}

// Render dashboard
function renderDashboard(data) {
    renderKPIs(data);
    renderMonthlyComparison(data);
    renderCategoryPie(data);
    renderTopServices(data);
    renderWaterfall(data);
    renderPareto(data);
    renderTables(data);
}

// Render KPIs
function renderKPIs(data) {
    document.getElementById('kpiMonth1').textContent = `$${data.month1.total.toFixed(2)}`;
    document.getElementById('month1Name').textContent = data.month1.name;
    
    document.getElementById('kpiMonth2').textContent = `$${data.month2.total.toFixed(2)}`;
    document.getElementById('month2Name').textContent = data.month2.name;
    
    const variationPercent = parseFloat(data.comparison.percentage);
    const variationAbs = data.comparison.absolute;
    
    document.getElementById('kpiVariation').textContent = `${variationPercent > 0 ? '+' : ''}${variationPercent}%`;
    document.getElementById('kpiVariationAbs').textContent = `${variationAbs > 0 ? '+' : ''}$${variationAbs.toFixed(2)}`;
    
    const trendIcon = document.getElementById('trendIcon');
    if (variationPercent > 5) {
        trendIcon.textContent = '📈';
        trendIcon.style.color = 'var(--danger-color)';
    } else if (variationPercent < -5) {
        trendIcon.textContent = '📉';
        trendIcon.style.color = 'var(--success-color)';
    } else {
        trendIcon.textContent = '➡️';
        trendIcon.style.color = 'var(--text-secondary)';
    }
    
    document.getElementById('kpiOpportunities').textContent = data.opportunities.length;
}

// Render monthly comparison chart
function renderMonthlyComparison(data) {
    const ctx = document.getElementById('monthlyComparisonChart');
    
    if (charts.monthlyComparison) {
        charts.monthlyComparison.destroy();
    }
    
    charts.monthlyComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [data.month1.name, data.month2.name],
            datasets: [{
                label: 'Gasto Total (USD)',
                data: [data.month1.total, data.month2.total],
                backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)'],
                borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 2,
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#1f2937',
                    formatter: (value) => `$${value.toFixed(2)}`
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `$${context.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 12 },
                        callback: (value) => `$${value.toLocaleString()}`
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: { size: 12, weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Render category pie chart
function renderCategoryPie(data) {
    const ctx = document.getElementById('categoryPieChart');
    
    if (charts.categoryPie) {
        charts.categoryPie.destroy();
    }
    
    const categories = Object.entries(data.categories)
        .map(([name, values]) => ({
            name,
            value: values.month2
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    
    const colors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)',
        'rgba(83, 102, 255, 0.8)'
    ];
    
    const total = categories.reduce((sum, c) => sum + c.value, 0);
    
    charts.categoryPie = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => c.name),
            datasets: [{
                data: categories.map(c => c.value),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff',
                datalabels: {
                    display: true,
                    color: '#fff',
                    font: {
                        size: 13,
                        weight: 'bold'
                    },
                    formatter: (value, context) => {
                        const percentage = ((value / total) * 100).toFixed(1);
                        return percentage > 5 ? `${percentage}%` : '';
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { size: 11 },
                        padding: 10,
                        generateLabels: (chart) => {
                            const data = chart.data;
                            return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i];
                                const percentage = ((value / total) * 100).toFixed(1);
                                return {
                                    text: `${label}: ${percentage}%`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return [
                                `${label}`,
                                `Valor: $${value.toFixed(2)}`,
                                `Porcentaje: ${percentage}%`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Render top services chart
function renderTopServices(data) {
    const ctx = document.getElementById('topServicesChart');
    
    if (charts.topServices) {
        charts.topServices.destroy();
    }
    
    const services = data.topServices.topByMonth2;
    
    charts.topServices = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: services.map(s => s.name.length > 30 ? s.name.substring(0, 30) + '...' : s.name),
            datasets: [
                {
                    label: data.month1.name,
                    data: services.map(s => s.month1),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'end',
                        font: {
                            size: 10,
                            weight: 'bold'
                        },
                        color: '#1f2937',
                        formatter: (value) => value > 1 ? `$${value.toFixed(0)}` : ''
                    }
                },
                {
                    label: data.month2.name,
                    data: services.map(s => s.month2),
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'end',
                        font: {
                            size: 10,
                            weight: 'bold'
                        },
                        color: '#1f2937',
                        formatter: (value) => value > 1 ? `$${value.toFixed(0)}` : ''
                    }
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        label: (context) => `${context.dataset.label}: $${context.parsed.x.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 11 },
                        callback: (value) => `$${value.toLocaleString()}`
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    ticks: {
                        font: { size: 10 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Render waterfall chart
function renderWaterfall(data) {
    const ctx = document.getElementById('waterfallChart');
    
    if (charts.waterfall) {
        charts.waterfall.destroy();
    }
    
    const items = data.waterfall;
    let cumulative = data.month1.total;
    const chartData = [];
    
    // Start point
    chartData.push({
        label: `Inicio (${data.month1.name})`,
        value: data.month1.total,
        color: 'rgba(100, 100, 100, 0.8)'
    });
    
    // Changes
    items.forEach(item => {
        cumulative += item.value;
        chartData.push({
            label: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
            value: item.value,
            color: item.value > 0 ? 'rgba(255, 99, 132, 0.8)' : 'rgba(75, 192, 192, 0.8)'
        });
    });
    
    // End point
    chartData.push({
        label: `Final (${data.month2.name})`,
        value: data.month2.total,
        color: 'rgba(100, 100, 100, 0.8)'
    });
    
    charts.waterfall = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.label),
            datasets: [{
                label: 'Cambio (USD)',
                data: chartData.map(d => d.value),
                backgroundColor: chartData.map(d => d.color),
                borderWidth: 1,
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: (context) => {
                        return context.dataset.data[context.dataIndex] >= 0 ? 'top' : 'bottom';
                    },
                    font: {
                        size: 10,
                        weight: 'bold'
                    },
                    color: '#1f2937',
                    formatter: (value) => {
                        const absValue = Math.abs(value);
                        if (absValue < 1) return '';
                        return `${value > 0 ? '+' : ''}$${value.toFixed(0)}`;
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        label: (context) => `${context.parsed.y > 0 ? '+' : ''}$${context.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        font: { size: 11 },
                        callback: (value) => `$${value.toLocaleString()}`
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: { size: 9 },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Render Pareto chart
function renderPareto(data) {
    const ctx = document.getElementById('paretoChart');
    
    if (charts.pareto) {
        charts.pareto.destroy();
    }
    
    const clients = data.pareto;
    
    charts.pareto = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: clients.map(c => c.name.length > 25 ? c.name.substring(0, 25) + '...' : c.name),
            datasets: [
                {
                    type: 'bar',
                    label: 'Gasto (USD)',
                    data: clients.map(c => c.total),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y',
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        font: {
                            size: 10,
                            weight: 'bold'
                        },
                        color: '#1f2937',
                        formatter: (value) => value > 5 ? `$${value.toFixed(0)}` : ''
                    }
                },
                {
                    type: 'line',
                    label: '% Acumulado',
                    data: clients.map(c => c.cumulativePercent),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 3,
                    yAxisID: 'y1',
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    datalabels: {
                        display: true,
                        align: 'top',
                        font: {
                            size: 10,
                            weight: 'bold'
                        },
                        color: '#dc2626',
                        formatter: (value) => `${value.toFixed(0)}%`
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        label: (context) => {
                            if (context.dataset.label === 'Gasto (USD)') {
                                return `Gasto: $${context.parsed.y.toFixed(2)}`;
                            } else {
                                return `Acumulado: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Gasto (USD)',
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: {
                        font: { size: 11 },
                        callback: (value) => `$${value.toLocaleString()}`
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: '% Acumulado',
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: {
                        font: { size: 11 },
                        callback: (value) => `${value}%`
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    ticks: {
                        font: { size: 9 },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Render tables
function renderTables(data) {
    renderCategoryTable(data);
    renderDriversTable(data);
    renderSavingsTable(data);
}

// Render category table
function renderCategoryTable(data) {
    const container = document.getElementById('categoryTable');
    
    const categories = Object.entries(data.categories)
        .map(([name, values]) => ({ name, ...values }))
        .sort((a, b) => b.month2 - a.month2);
    
    const total1 = data.month1.total;
    const total2 = data.month2.total;
    
    let html = '<table><thead><tr>';
    html += '<th>Categoría</th>';
    html += `<th>${data.month1.name}</th>`;
    html += `<th>${data.month2.name}</th>`;
    html += '<th>Cambio</th>';
    html += '<th>% Cambio</th>';
    html += '<th>% del Total</th>';
    html += '</tr></thead><tbody>';
    
    categories.forEach(cat => {
        const changeClass = cat.change > 0 ? 'negative' : (cat.change < 0 ? 'positive' : 'neutral');
        html += '<tr>';
        html += `<td><strong>${cat.name}</strong></td>`;
        html += `<td>$${cat.month1.toFixed(2)}</td>`;
        html += `<td>$${cat.month2.toFixed(2)}</td>`;
        html += `<td class="${changeClass}">${cat.change > 0 ? '+' : ''}$${cat.change.toFixed(2)}</td>`;
        html += `<td class="${changeClass}">${cat.changePercent > 0 ? '+' : ''}${cat.changePercent.toFixed(1)}%</td>`;
        html += `<td>${((cat.month2 / total2) * 100).toFixed(1)}%</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Render drivers table
function renderDriversTable(data) {
    const container = document.getElementById('driversTable');
    
    const increases = data.topServices.topIncreases;
    
    let html = '<table><thead><tr>';
    html += '<th>Servicio</th>';
    html += `<th>${data.month1.name}</th>`;
    html += `<th>${data.month2.name}</th>`;
    html += '<th>Incremento</th>';
    html += '</tr></thead><tbody>';
    
    increases.forEach(service => {
        html += '<tr>';
        html += `<td><strong>${service.name}</strong></td>`;
        html += `<td>$${service.month1.toFixed(2)}</td>`;
        html += `<td>$${service.month2.toFixed(2)}</td>`;
        html += `<td class="negative">+$${service.change.toFixed(2)}</td>`;
        html += '</tr>';
    });
    
    if (increases.length === 0) {
        html += '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No se detectaron incrementos significativos</td></tr>';
    }
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Render savings table
function renderSavingsTable(data) {
    const container = document.getElementById('savingsTable');
    
    const opportunities = data.opportunities;
    
    let html = '<table><thead><tr>';
    html += '<th>Tipo</th>';
    html += '<th>Descripción</th>';
    html += '<th>Impacto Estimado</th>';
    html += '<th>Prioridad</th>';
    html += '</tr></thead><tbody>';
    
    opportunities.forEach(opp => {
        const priorityClass = opp.priority === 'Alta' ? 'negative' : (opp.priority === 'Baja' ? 'neutral' : 'warning');
        html += '<tr>';
        html += `<td><strong>${opp.type}</strong></td>`;
        html += `<td>${opp.description}</td>`;
        html += `<td>$${opp.impact.toFixed(2)}</td>`;
        html += `<td class="${priorityClass}">${opp.priority}</td>`;
        html += '</tr>';
    });
    
    if (opportunities.length === 0) {
        html += '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No se detectaron oportunidades de ahorro</td></tr>';
    }
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Export to PDF
async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Show loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 9999; text-align: center;';
    loadingDiv.innerHTML = '<div class="spinner" style="margin: 0 auto 15px;"></div><p style="font-size: 1.1rem; color: #0078d4; font-weight: 600;">Generando PDF con gráficos...</p><p style="color: #6b7280; font-size: 0.9rem;">Esto puede tomar unos segundos</p>';
    document.body.appendChild(loadingDiv);
    
    try {
        // Page 1: Title and KPIs
        pdf.setFontSize(24);
        pdf.setTextColor(0, 120, 212);
        pdf.text('📊 Análisis de Consumos Azure', 105, 25, { align: 'center' });
        
        pdf.setFontSize(14);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${processedData.month1.name} vs ${processedData.month2.name}`, 105, 35, { align: 'center' });
        
        // KPIs Box
        pdf.setFillColor(245, 247, 250);
        pdf.roundedRect(15, 45, 180, 45, 3, 3, 'F');
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        pdf.text('Resumen Ejecutivo', 20, 55);
        
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(10);
        let y = 65;
        pdf.text(`Gasto ${processedData.month1.name}:`, 20, y);
        pdf.setFont(undefined, 'bold');
        pdf.text(`$${processedData.month1.total.toFixed(2)}`, 80, y);
        
        pdf.setFont(undefined, 'normal');
        y += 7;
        pdf.text(`Gasto ${processedData.month2.name}:`, 20, y);
        pdf.setFont(undefined, 'bold');
        pdf.text(`$${processedData.month2.total.toFixed(2)}`, 80, y);
        
        pdf.setFont(undefined, 'normal');
        y += 7;
        pdf.text(`Variación:`, 20, y);
        pdf.setFont(undefined, 'bold');
        const varColor = processedData.comparison.percentage > 0 ? [239, 68, 68] : [16, 185, 129];
        pdf.setTextColor(...varColor);
        pdf.text(`${processedData.comparison.percentage > 0 ? '+' : ''}${processedData.comparison.percentage}% ($${processedData.comparison.absolute.toFixed(2)})`, 80, y);
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'normal');
        y += 7;
        pdf.text(`Oportunidades identificadas:`, 20, y);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${processedData.opportunities.length}`, 80, y);
        
        // Capture charts
        y = 100;
        
        // Chart 1: Monthly Comparison
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(0, 120, 212);
        pdf.text('📊 Consumo Mensual Comparativo', 20, y);
        y += 5;
        
        const chart1 = document.getElementById('monthlyComparisonChart');
        const canvas1 = await html2canvas(chart1.parentElement, { 
            scale: 2, 
            backgroundColor: '#ffffff',
            logging: false 
        });
        const imgData1 = canvas1.toDataURL('image/png');
        pdf.addImage(imgData1, 'PNG', 15, y, 180, 80);
        
        // Page 2: Category Pie and Top Services
        pdf.addPage();
        y = 20;
        
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(0, 120, 212);
        pdf.text('🎯 Distribución por Categoría', 20, y);
        y += 5;
        
        const chart2 = document.getElementById('categoryPieChart');
        const canvas2 = await html2canvas(chart2.parentElement, { 
            scale: 2, 
            backgroundColor: '#ffffff',
            logging: false 
        });
        const imgData2 = canvas2.toDataURL('image/png');
        pdf.addImage(imgData2, 'PNG', 15, y, 180, 80);
        
        y += 85;
        pdf.text('🏆 Top 10 Servicios por Costo', 20, y);
        y += 5;
        
        const chart3 = document.getElementById('topServicesChart');
        const canvas3 = await html2canvas(chart3.parentElement, { 
            scale: 2, 
            backgroundColor: '#ffffff',
            logging: false 
        });
        const imgData3 = canvas3.toDataURL('image/png');
        pdf.addImage(imgData3, 'PNG', 15, y, 180, 80);
        
        // Page 3: Waterfall
        pdf.addPage();
        y = 20;
        
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(0, 120, 212);
        pdf.text('💧 Análisis Waterfall - Cambios por Categoría', 20, y);
        y += 5;
        
        const chart4 = document.getElementById('waterfallChart');
        const canvas4 = await html2canvas(chart4.parentElement, { 
            scale: 2, 
            backgroundColor: '#ffffff',
            logging: false 
        });
        const imgData4 = canvas4.toDataURL('image/png');
        pdf.addImage(imgData4, 'PNG', 15, y, 180, 100);
        
        y += 110;
        pdf.text('📈 Análisis Pareto - Distribución por Cliente/Área', 20, y);
        y += 5;
        
        const chart5 = document.getElementById('paretoChart');
        const canvas5 = await html2canvas(chart5.parentElement, { 
            scale: 2, 
            backgroundColor: '#ffffff',
            logging: false 
        });
        const imgData5 = canvas5.toDataURL('image/png');
        pdf.addImage(imgData5, 'PNG', 15, y, 180, 100);
        
        // Page 4: Opportunities Table
        if (processedData.opportunities.length > 0) {
            pdf.addPage();
            y = 20;
            
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(14);
            pdf.setTextColor(0, 120, 212);
            pdf.text('💡 Oportunidades de Ahorro', 20, y);
            
            y += 10;
            pdf.setFontSize(9);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(0, 0, 0);
            
            processedData.opportunities.forEach((opp, index) => {
                if (y > 270) {
                    pdf.addPage();
                    y = 20;
                }
                
                // Draw box for each opportunity
                pdf.setFillColor(248, 250, 252);
                pdf.roundedRect(15, y - 5, 180, 18, 2, 2, 'F');
                
                pdf.setFont(undefined, 'bold');
                pdf.text(`${index + 1}. ${opp.type}`, 20, y);
                
                pdf.setFont(undefined, 'normal');
                pdf.text(opp.description.substring(0, 80), 20, y + 5);
                
                pdf.setFont(undefined, 'bold');
                pdf.text(`Impacto: $${opp.impact.toFixed(2)}`, 20, y + 10);
                
                const priorityColor = opp.priority === 'Alta' ? [239, 68, 68] : opp.priority === 'Media' ? [245, 158, 11] : [107, 114, 128];
                pdf.setTextColor(...priorityColor);
                pdf.text(`Prioridad: ${opp.priority}`, 80, y + 10);
                pdf.setTextColor(0, 0, 0);
                
                y += 22;
            });
        }
        
        // Footer on all pages
        const pageCount = pdf.internal.getNumberOfPages();
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
            pdf.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 105, 295, { align: 'center' });
        }
        
        // Save PDF
        pdf.save(`Azure_Cost_Analysis_${processedData.month1.name}_vs_${processedData.month2.name}.pdf`);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error al generar el PDF. Por favor intenta nuevamente.');
    } finally {
        // Remove loading message
        document.body.removeChild(loadingDiv);
    }
}

// Export to Excel
function exportExcel() {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
        ['Análisis de Consumos Azure'],
        [''],
        ['Resumen Ejecutivo'],
        ['Métrica', processedData.month1.name, processedData.month2.name, 'Variación'],
        ['Gasto Total', processedData.month1.total, processedData.month2.total, processedData.comparison.absolute],
        ['% Cambio', '', '', `${processedData.comparison.percentage}%`],
        [''],
        ['Categorías'],
        ['Categoría', processedData.month1.name, processedData.month2.name, 'Cambio', '% Cambio']
    ];
    
    Object.entries(processedData.categories).forEach(([name, values]) => {
        summaryData.push([name, values.month1, values.month2, values.change, `${values.changePercent.toFixed(1)}%`]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
    
    // Top Services sheet
    const servicesData = [
        ['Top Servicios por Costo'],
        [''],
        ['Servicio', processedData.month1.name, processedData.month2.name, 'Cambio']
    ];
    
    processedData.topServices.topByMonth2.forEach(service => {
        servicesData.push([service.name, service.month1, service.month2, service.change]);
    });
    
    const ws2 = XLSX.utils.aoa_to_sheet(servicesData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Top Servicios');
    
    // Opportunities sheet
    const oppData = [
        ['Oportunidades de Ahorro'],
        [''],
        ['Tipo', 'Descripción', 'Impacto', 'Prioridad']
    ];
    
    processedData.opportunities.forEach(opp => {
        oppData.push([opp.type, opp.description, opp.impact, opp.priority]);
    });
    
    const ws3 = XLSX.utils.aoa_to_sheet(oppData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Oportunidades');
    
    XLSX.writeFile(wb, `Azure_Cost_Analysis_${Date.now()}.xlsx`);
}

// Reset app
function resetApp() {
    if (confirm('¿Estás seguro de que deseas iniciar un nuevo análisis? Se perderán los datos actuales.')) {
        // Clear data
        file1Data = null;
        file2Data = null;
        processedData = null;
        
        // Clear file inputs
        document.getElementById('file1').value = '';
        document.getElementById('file2').value = '';
        document.getElementById('fileName1').textContent = '';
        document.getElementById('fileName2').textContent = '';
        
        // Reset upload boxes
        document.getElementById('uploadBox1').classList.remove('file-loaded');
        document.getElementById('uploadBox2').classList.remove('file-loaded');
        
        // Disable process button
        document.getElementById('processBtn').disabled = true;
        
        // Destroy charts
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        charts = {};
        
        // Show upload section
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'block';
    }
}
