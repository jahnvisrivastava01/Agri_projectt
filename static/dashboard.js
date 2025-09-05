const apiBase = "http://127.0.0.1:5000/api";

function showNotification(id, message, isSuccess) {
    const el = document.getElementById(id);
    el.innerText = message;
    el.className = `notification ${isSuccess ? 'success' : 'error'}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// Attach event listeners
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loadDashboardBtn').addEventListener('click', loadDashboard);
    document.getElementById('exportCSVBtn').addEventListener('click', exportCSV);

    document.getElementById('addFarmerBtn').addEventListener('click', addFarmer);
    document.getElementById('addPlotBtn').addEventListener('click', addPlot);
    document.getElementById('addMeasurementBtn').addEventListener('click', addMeasurement);
    document.getElementById('calculateCarbonBtn').addEventListener('click', calculateCarbon);
});

function loadDashboard() {
    fetch(`${apiBase}/dashboard`)
    .then(res => res.json())
    .then(data => {
        console.log("Dashboard data:", data); // Debug
        const container = document.getElementById('dashboardResult');
        if(data.error) {
            container.innerHTML = `<p style="color:red;">${data.error}</p>`;
            return;
        }

        let html = '<table><tr><th>Farmer ID</th><th>Farmer Name</th><th>Plot ID</th><th>Area (ha)</th><th>Total Carbon (kg)</th></tr>';
        data.forEach(f => {
            f.plots.forEach(p => {
                html += `<tr>
                    <td>${f.id}</td>
                    <td>${f.name}</td>
                    <td>${p.id}</td>
                    <td>${p.area_ha}</td>
                    <td>${p.total_carbon || 0}</td>
                </tr>`;
            });
        });
        html += '</table>';
        container.innerHTML = html;
    })
    .catch(err => {
        document.getElementById('dashboardResult').innerHTML = '<p style="color:red;">Failed to load dashboard</p>';
    });
}

function exportCSV() {
    fetch(`${apiBase}/dashboard`)
    .then(res => res.json())
    .then(data => {
        let csv = 'Farmer ID,Farmer Name,Plot ID,Area (ha),Total Carbon (kg)\n';
        data.forEach(f => {
            f.plots.forEach(p => {
                csv += `${f.id},${f.name},${p.id},${p.area_ha},${p.total_carbon || 0}\n`;
            });
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dashboard.csv';
        a.click();
        URL.revokeObjectURL(url);
    })
    .catch(err => alert('Failed to export CSV'));
}






