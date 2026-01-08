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
    let current = data.month1.total;
    const chartLabels = [];
    const chartData = [];
    const chartColors = [];

    // Start bar
    chartLabels.push(`Inicio (${data.month1.name})`);
    chartData.push([0, data.month1.total]);
    chartColors.push('rgba(100, 100, 100, 0.8)');

    // Help wrap text into multiple lines
    const wrapLabel = (text, max = 15) => {
        if (text.length <= max) return text;
        const words = text.split(' ');
        const lines = [];
        let current = '';
        words.forEach(w => {
            if ((current + w).length > max && current !== '') {
                lines.push(current.trim());
                current = w + ' ';
            } else {
                current += w + ' ';
            }
        });
        lines.push(current.trim());
        return lines;
    };

    // Changes
    items.forEach(item => {
        const start = current;
        current += item.value;
        const end = current;

        chartLabels.push(wrapLabel(item.name, 18));
        chartData.push([start, end]);
        chartColors.push(item.value > 0 ? 'rgba(255, 99, 132, 0.8)' : 'rgba(75, 192, 192, 0.8)');
    });

    // End bar
    chartLabels.push(`Final (${data.month2.name})`);
    chartData.push([0, data.month2.total]);
    chartColors.push('rgba(54, 162, 235, 0.8)');

    charts.waterfall = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Variacion',
                data: chartData,
                backgroundColor: chartColors,
                borderWidth: 1,
                datalabels: {
                    display: true,
                    anchor: (context) => {
                        const val = context.dataset.data[context.dataIndex];
                        if (Array.isArray(val)) {
                            return val[1] >= val[0] ? 'end' : 'start';
                        }
                        return 'end';
                    },
                    align: (context) => {
                        const val = context.dataset.data[context.dataIndex];
                        if (Array.isArray(val)) {
                            return val[1] >= val[0] ? 'top' : 'bottom';
                        }
                        return 'top';
                    },
                    font: { size: 9, weight: 'bold' },
                    color: '#1f2937',
                    formatter: (value, context) => {
                        // For the Start/End bars, show total. For changes, show delta.
                        if (context.dataIndex === 0 || context.dataIndex === chartLabels.length - 1) {
                            return `$${value[1].toFixed(0)}`;
                        }
                        const delta = value[1] - value[0];
                        if (Math.abs(delta) < 1) return '';
                        return `${delta > 0 ? '+' : ''}$${delta.toFixed(0)}`;
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const val = context.raw;
                            if (context.dataIndex === 0 || context.dataIndex === chartLabels.length - 1) {
                                return `Total: $${val[1].toFixed(2)}`;
                            }
                            return `Variacion: ${val[1] - val[0] > 0 ? '+' : ''}$${(val[1] - val[0]).toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grace: '20%',
                    ticks: {
                        callback: (v) => `$${v.toLocaleString()}`,
                        font: { size: 11 }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: { size: 10 }
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

    // Help wrap text into multiple lines
    const wrapLabel = (text, max = 15) => {
        if (text.length <= max) return text;
        const words = text.split(' ');
        const lines = [];
        let current = '';
        words.forEach(w => {
            if ((current + w).length > max && current !== '') {
                lines.push(current.trim());
                current = w + ' ';
            } else {
                current += w + ' ';
            }
        });
        lines.push(current.trim());
        return lines;
    };

    charts.pareto = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: clients.map(c => wrapLabel(c.name, 15)),
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
            layout: {
                padding: {
                    top: 20,
                    bottom: 40
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: { size: 12, weight: 'bold' },
                        padding: 20
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
                    grace: '20%',
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
                        font: { size: 10 },
                        maxRotation: 90,
                        minRotation: 90,
                        autoSkip: false
                    },
                    grid: { display: false }
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

// Helper to add footer to PDF
function addPDFFooter(pdf, currentPage, totalPages) {
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont(undefined, 'normal');

    // Page number
    pdf.text(`Pagina ${currentPage} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Date and branding
    pdf.text('Azure Cost Analysis - Informe Ejecutivo', 15, pageHeight - 10);
    pdf.text(new Date().toLocaleDateString('es-ES'), pageWidth - 15, pageHeight - 10, { align: 'right' });

    // Thin line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);
}

// Helper to add header to PDF
function addPDFHeader(pdf, title) {
    const pageWidth = pdf.internal.pageSize.width;

    pdf.setFillColor(0, 50, 100);
    pdf.rect(0, 0, pageWidth, 15, 'F');

    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(undefined, 'bold');
    pdf.text(title, 15, 10);
}

// Helper to add image maintaining aspect ratio
async function addPDFImage(pdf, element, x, y, widthTarget) {
    // Hide tooltips before capture
    element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    // Small delay to allow tooltips to fade out
    await new Promise(resolve => setTimeout(resolve, 200));

    return html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
            // Force fully visible status for all elements in the capture
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach(el => {
                el.style.opacity = '1';
                el.style.animation = 'none';
                el.style.transition = 'none';
                el.style.transform = 'none';
                // Remove blur filters that html2canvas doesn't support
                if (el.style.backdropFilter) el.style.backdropFilter = 'none';
            });
        }
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = widthTarget;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', x, y, pdfWidth, pdfHeight);
        return pdfHeight;
    });
}

// Export to PDF (High-Impact Presentation Mode)
async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 9999; text-align: center; font-family: sans-serif; min-width: 380px;';
    loadingDiv.innerHTML = '<div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #0078d4; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div><p style="font-size: 1.1rem; color: #0078d4; font-weight: 600; margin: 0;">Generando Presentacion de Alto Impacto...</p><p style="color: #6b7280; font-size: 0.9rem; margin: 5px 0 0;">Una grafica por pagina para maxima claridad gerencial</p><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';
    document.body.appendChild(loadingDiv);

    try {
        // --- SLIDE 1: PORTADA ---
        pdf.setFillColor(0, 32, 77);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        pdf.setFillColor(0, 120, 212, 0.1);
        pdf.circle(pageWidth, 0, 140, 'F');

        pdf.setFontSize(52);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(undefined, 'bold');
        pdf.text('REPORTE EJECUTIVO CLOUD', 25, 85);
        pdf.text('COSTOS AZURE', 25, 108);

        pdf.setDrawColor(0, 120, 212);
        pdf.setLineWidth(3.5);
        pdf.line(25, 118, 180, 118);

        pdf.setFontSize(26);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(173, 216, 230);
        pdf.text(`Periodo: ${processedData.month1.name} vs ${processedData.month2.name}`, 25, 135);

        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Analisis Proyectado para Toma de Decisiones Financieras Estrategicas', 25, 190);

        // --- SLIDE 2: KPI SUMMARY ---
        pdf.addPage();
        addPDFHeader(pdf, 'Resumen de Metricas y Variacion Consolidada');

        pdf.setTextColor(0, 32, 77);
        pdf.setFontSize(20);
        pdf.setFont(undefined, 'bold');
        pdf.text('Resultados Financieros del Periodo', 20, 38);

        const cardWidth = 120;
        pdf.setFillColor(245, 247, 250);
        pdf.roundedRect(20, 50, cardWidth, 85, 4, 4, 'F');

        pdf.setFontSize(14);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Total ${processedData.month1.name}:`, 35, 68);
        pdf.text(`Total ${processedData.month2.name}:`, 35, 83);
        pdf.text('Variacion Absoluta:', 35, 98);
        pdf.text('Variacion Porcentual:', 35, 113);

        pdf.setTextColor(0, 32, 77);
        pdf.setFont(undefined, 'bold');
        pdf.text(`$${processedData.month1.total.toLocaleString()}`, 125, 68, { align: 'right' });
        pdf.text(`$${processedData.month2.total.toLocaleString()}`, 125, 83, { align: 'right' });

        const isUp = processedData.comparison.percentage > 0;
        pdf.setTextColor(isUp ? 200 : 0, isUp ? 0 : 130, 0);
        pdf.text(`${isUp ? '+' : ''}$${processedData.comparison.absolute.toFixed(2)}`, 125, 98, { align: 'right' });
        pdf.text(`${isUp ? '+' : ''}${processedData.comparison.percentage}%`, 125, 113, { align: 'right' });

        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'normal');
        const summaryMsg = `Se observa un ${isUp ? 'incremento' : 'descenso'} en el gasto operativo de Azure del ${processedData.comparison.percentage}%. Este cambio representa una variacion de $${Math.abs(processedData.comparison.absolute).toFixed(2)} respecto al mes anterior.`;
        pdf.text(pdf.splitTextToSize(summaryMsg, cardWidth), 20, 150);

        const chart1 = document.getElementById('monthlyComparisonChart');
        await addPDFImage(pdf, chart1.parentElement, 155, 45, 125);

        // --- SLIDES: ONE CHART PER PAGE ---
        const pageCharts = [
            { id: 'categoryPieChart', title: 'Distribucion de Gasto por Categoria de Servicio' },
            { id: 'topServicesChart', title: 'Ranking de Servicios (Top 10 por Facturacion)' },
            { id: 'waterfallChart', title: 'Analisis Waterfall - Dinamica de Cambios Mensuales' },
            { id: 'paretoChart', title: 'Regla de Pareto (80/20) - Concentracion de Gasto' }
        ];

        for (const item of pageCharts) {
            pdf.addPage();
            addPDFHeader(pdf, item.title);
            const element = document.getElementById(item.id);
            // Full slide width for maximum clarity
            await addPDFImage(pdf, element.parentElement, 25, 30, 245);
        }

        // --- SLIDE DETALLE TABLA ---
        pdf.addPage();
        addPDFHeader(pdf, 'Desglose Detallado de Variaciones por Categoria');

        const cats = Object.entries(processedData.categories)
            .map(([n, v]) => [
                n,
                `$${v.month1.toLocaleString()}`,
                `$${v.month2.toLocaleString()}`,
                { content: `$${v.change.toFixed(2)}`, styles: { textColor: v.change > 0 ? [180, 0, 0] : [0, 120, 0] } },
                { content: `${v.changePercent > 0 ? '+' : ''}${v.changePercent.toFixed(1)}%`, styles: { fontStyle: 'bold' } }
            ]);

        pdf.autoTable({
            startY: 25,
            head: [['Categoria de Servicio', processedData.month1.name, processedData.month2.name, 'Variacion (USD)', '% Variacion']],
            body: cats,
            theme: 'striped',
            headStyles: { fillColor: [0, 50, 100], fontSize: 11, halign: 'center' },
            columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' } },
            margin: { left: 20, right: 20 }
        });

        // --- SLIDE RECOMENDACIONES ---
        pdf.addPage();
        addPDFHeader(pdf, 'Plan de Optimizacion y Recomendaciones Strategicas');

        const opps = processedData.opportunities.map(o => [
            o.type,
            o.description,
            `$${o.impact.toFixed(2)}`,
            {
                content: o.priority,
                styles: {
                    fillColor: o.priority === 'Alta' ? [255, 235, 235] : [240, 240, 240],
                    textColor: o.priority === 'Alta' ? [200, 0, 0] : [80, 80, 80],
                    fontStyle: 'bold'
                }
            }
        ]);

        pdf.autoTable({
            startY: 35,
            head: [['Area de Mejora', 'Recomendacion Estrategica', 'Ahorro Potencial', 'Prioridad']],
            body: opps,
            theme: 'grid',
            headStyles: { fillColor: [39, 174, 96], halign: 'center' },
            columnStyles: { 1: { cellWidth: 140 }, 2: { halign: 'right' }, 3: { halign: 'center' } },
            margin: { left: 20, right: 20 }
        });

        const totalPagesCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPagesCount; i++) {
            pdf.setPage(i);
            if (i > 1) addPDFFooter(pdf, i, totalPagesCount);
            if (i === 1) {
                pdf.setFontSize(10);
                pdf.setTextColor(150, 150, 150);
                pdf.text('Informe Confidencial - Uso Exclusivo Gerencial', pageWidth / 2, pageHeight - 15, { align: 'center' });
            }
        }

        const fileName = `Reporte_Azure_Impacto_${processedData.month1.name}_vs_${processedData.month2.name}.pdf`.replace(/ /g, '_');
        pdf.save(fileName);

    } catch (e) {
        console.error('PDF Generation Error:', e);
        alert('Error critico al generar la presentacion: ' + e.message);
    } finally {
        if (loadingDiv.parentElement) document.body.removeChild(loadingDiv);
    }
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
