const apiBase = "http://127.0.0.1:5000/api";

document.addEventListener('DOMContentLoaded', () => {

    // Add Farmer
    document.getElementById('addFarmerBtn').addEventListener('click', () => {
        const name = document.getElementById('farmerName').value;
        const phone = document.getElementById('farmerPhone').value;

        fetch(`${apiBase}/farmers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone })
        })
        .then(res => res.json())
        .then(data => {
            const div = document.getElementById('farmerResult');
            div.style.display = 'block';
            if(data.error) {
                div.textContent = data.error;
                div.className = 'notification error';
            } else {
                div.textContent = `Farmer added: ${data.message || ''} (ID: ${data.id})`;
                div.className = 'notification success';
            }
        })
        .catch(err => alert('Request failed'));
    });

    // Add Plot
    document.getElementById('addPlotBtn').addEventListener('click', () => {
        const farmer_id = parseInt(document.getElementById('plotFarmerId').value);
        const area_ha = parseFloat(document.getElementById('plotArea').value);

        fetch(`${apiBase}/plots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ farmer_id, area_ha })
        })
        .then(res => res.json())
        .then(data => {
            const div = document.getElementById('plotResult');
            div.style.display = 'block';
            if(data.error) {
                div.textContent = data.error;
                div.className = 'notification error';
            } else {
                div.textContent = `Plot added: ${data.message || ''} (ID: ${data.id})`;
                div.className = 'notification success';
            }
        })
        .catch(err => alert('Request failed'));
    });

    // Add Measurement
    document.getElementById('addMeasurementBtn').addEventListener('click', () => {
        const plot_id = parseInt(document.getElementById('measurePlotId').value);
        const species = document.getElementById('species').value;
        const dbh_cm = parseFloat(document.getElementById('dbh').value);
        const height_m = parseFloat(document.getElementById('height').value);
        const sample_point = document.getElementById('samplePoint').value;

        fetch(`${apiBase}/measurements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plot_id, species, dbh_cm, height_m, sample_point })
        })
        .then(res => res.json())
        .then(data => {
            const div = document.getElementById('measurementResult');
            div.style.display = 'block';
            if(data.error) {
                div.textContent = data.error;
                div.className = 'notification error';
            } else {
                div.textContent = `Measurement added: ID ${data.id}, Carbon ${data.carbon_kg} kg`;
                div.className = 'notification success';
            }
        })
        .catch(err => alert('Request failed'));
    });

    // Calculate Carbon
    document.getElementById('calculateCarbonBtn').addEventListener('click', () => {
        const plot_id = parseInt(document.getElementById('carbonPlotId').value);

        fetch(`${apiBase}/calculate_carbon/${plot_id}`)
        .then(res => res.json())
        .then(data => {
            const div = document.getElementById('carbonResult');
            div.style.display = 'block';
            if(data.error) {
                div.textContent = data.error;
                div.className = 'notification error';
            } else {
                div.textContent = `Total Carbon: ${data.total_carbon_kg} kg`;
                div.className = 'notification success';
            }
        })
        .catch(err => alert('Request failed'));
    });

    // Load Dashboard
    document.getElementById('loadDashboardBtn').addEventListener('click', () => {
        fetch(`${apiBase}/dashboard`)
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('dashboardResult');
            let html = '<table><tr><th>Farmer ID</th><th>Farmer Name</th><th>Plot ID</th><th>Area (ha)</th><th>Total Carbon (kg)</th></tr>';
            data.forEach(f => {
                f.plots.forEach(p => {
                    html += `<tr>
                        <td>${f.id}</td>
                        <td>${f.name}</td>
                        <td>${p.id}</td>
                        <td>${p.area_ha}</td>
                        <td>${p.total_carbon}</td>
                    </tr>`;
                });
            });
            html += '</table>';
            container.innerHTML = html;
        })
        .catch(err => {
            document.getElementById('dashboardResult').innerHTML = '<p style="color:red;">Failed to load dashboard</p>';
        });
    });

    // Export CSV
    document.getElementById('exportCSVBtn').addEventListener('click', () => {
        fetch(`${apiBase}/dashboard`)
        .then(res => res.json())
        .then(data => {
            let csv = 'Farmer ID,Farmer Name,Plot ID,Area (ha),Total Carbon (kg)\n';
            data.forEach(f => {
                f.plots.forEach(p => {
                    csv += `${f.id},${f.name},${p.id},${p.area_ha},${p.total_carbon}\n`;
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
    });

});



