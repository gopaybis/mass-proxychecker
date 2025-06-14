export default {
  async fetch(request) {
    if (request.method === "POST") {
      try {
        const { ip, port } = await request.json();
        const url = `https://apihealtcheck.vercel.app/api/v1?ip=${ip}&port=${port}`;
        const res = await fetch(url);
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: true, message: err.message }), {
          headers: { "Content-Type": "application/json" },
          status: 500
        });
      }
    }

    return new Response(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Proxy Checker</title>
  <style>
    body {
      background-color: #121212;
      color: #e0e0e0;
      font-family: 'Courier New', monospace;
      padding: 20px;
    }
    h2 {
      color: #00e676;
    }
    textarea, input[type="file"] {
      background-color: #1e1e1e;
      color: #fff;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 10px;
      width: 100%;
      margin-top: 10px;
      font-size: 16px;
    }
    button {
      background-color: #00acc1;
      border: none;
      color: white;
      padding: 10px 20px;
      margin: 10px 10px 0 0;
      font-size: 16px;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    button:hover {
      background-color: #00838f;
    }
    table {
      width: 100%;
      margin-top: 20px;
      border-collapse: collapse;
      background-color: #1e1e1e;
      border-radius: 6px;
      overflow: hidden;
    }
    th {
      background-color: #263238;
      color: #ffffff;
      padding: 10px;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #333;
      color: #e0e0e0;
    }
    .green {
      color: #69f0ae;
      font-weight: bold;
    }
    .red {
      color: #ff5252;
      font-weight: bold;
    }
    ::file-selector-button {
      background: #444;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h2>🔥 Proxy Checker</h2>
  <textarea id="input" rows="6" placeholder="Masukkan proxy manual, contoh: IP:PORT\\n..."></textarea>
  <input type="file" id="fileInput" multiple accept=".txt" /><br/>
  <button onclick="loadFromFiles()">Gabungkan Dari File</button>
  <button onclick="startCheck()">Mulai Cek</button>
  <button onclick="copyToClipboard()">Salin Proxy Aktif</button>
  <button onclick="copyIpPort()">Salin IP:Port Aktif</button>
  <button onclick="downloadTxt()">Unduh .txt</button>

  <div id="stats" style="margin-top: 20px; font-size: 16px;">
    <b>Total:</b> <span id="total">0</span> |
    <b>Active:</b> <span id="active">0</span> |
    <b>Inactive:</b> <span id="inactive">0</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>IP</th>
        <th>Port</th>
        <th>Status</th>
        <th>Country</th>
        <th>Org</th>
        <th>Protocol</th>
        <th>Delay</th>
      </tr>
    </thead>
    <tbody id="result"></tbody>
  </table>

  <script>
    window.onload = function () {
      const saved = localStorage.getItem('proxy_results');
      if (saved) document.getElementById('result').innerHTML = saved;

      const stats = JSON.parse(localStorage.getItem('proxy_stats') || '{}');
      document.getElementById('total').textContent = stats.total || 0;
      document.getElementById('active').textContent = stats.active || 0;
      document.getElementById('inactive').textContent = stats.inactive || 0;
    }

    function saveResultsToLocalStorage() {
      localStorage.setItem('proxy_results', document.getElementById('result').innerHTML);
      localStorage.setItem('proxy_stats', JSON.stringify({
        total: document.getElementById('total').textContent,
        active: document.getElementById('active').textContent,
        inactive: document.getElementById('inactive').textContent
      }));
    }

    async function loadFromFiles() {
      const files = document.getElementById('fileInput').files;
      if (!files.length) return alert("Pilih minimal 1 file .txt");
      let allText = document.getElementById('input').value.trim();

      for (const file of files) {
        const text = await file.text();
        allText += '\\n' + text.trim();
      }

      document.getElementById('input').value = allText.trim();
      alert('Semua isi file berhasil digabung ke dalam textarea!');
    }

    async function startCheck() {
      const inputEl = document.getElementById('input');
      const result = document.getElementById('result');
      const stats = { total: 0, active: 0, inactive: 0 };

      const lines = Array.from(new Set(
        inputEl.value.trim().split('\\n').map(x => x.trim()).filter(Boolean)
      ));

      inputEl.value = lines.join('\\n');
      result.innerHTML = '';
      document.getElementById('total').textContent = lines.length;
      document.getElementById('active').textContent = '0';
      document.getElementById('inactive').textContent = '0';

      for (let i = 0; i < lines.length; i++) {
        const [ip, port] = lines[i].split(':');
        if (!ip || !port) continue;

        const row = result.insertRow();
        row.insertCell().textContent = i + 1;
        row.insertCell().textContent = ip;
        row.insertCell().textContent = port;

        const statusCell = row.insertCell();
        const countryCell = row.insertCell();
        const orgCell = row.insertCell();
        const protoCell = row.insertCell();
        const delayCell = row.insertCell();

        statusCell.textContent = '...';

        setTimeout(async () => {
          try {
            const res = await fetch(location.href, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ip, port })
            });
            const data = await res.json();

            if (data.proxyip) {
              statusCell.textContent = 'Active';
              statusCell.className = 'green';
              stats.active++;
            } else {
              statusCell.textContent = 'Inactive';
              statusCell.className = 'red';
              stats.inactive++;
            }

            countryCell.textContent = (data.countryCode || '-') + ' ' + (data.countryFlag || '');
            orgCell.textContent = data.asOrganization || '-';
            protoCell.textContent = data.httpProtocol || '-';
            delayCell.textContent = data.delay || '-';

          } catch (err) {
            statusCell.textContent = 'Error';
            statusCell.className = 'red';
            stats.inactive++;
          }

          document.getElementById('active').textContent = stats.active;
          document.getElementById('inactive').textContent = stats.inactive;

          saveResultsToLocalStorage();
          row.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 200 * i);
      }
    }

    function getActiveProxies() {
      const rows = Array.from(document.querySelectorAll('#result tr'));
      return rows
        .filter(r => r.querySelector('.green'))
        .map(r => {
          const cells = r.querySelectorAll('td');
          const country = (cells[4].textContent || '').split(' ')[0];
          return [
            cells[1].textContent,
            cells[2].textContent,
            country || '-',
            cells[5].textContent || '-'
          ].join(',');
        }).sort((a, b) => {
          const aCode = a.split(',')[2] || '';
          const bCode = b.split(',')[2] || '';
          return aCode.localeCompare(bCode);
        });
    }

    function copyToClipboard() {
      const proxies = getActiveProxies().join('\\n');
      navigator.clipboard.writeText(proxies).then(() => alert('Disalin ke clipboard!'));
    }

    function copyIpPort() {
      const rows = Array.from(document.querySelectorAll('#result tr'));
      const activeProxies = rows
        .filter(r => r.querySelector('.green'))
        .map(r => {
          const cells = r.querySelectorAll('td');
          return \`\${cells[1].textContent}:\${cells[2].textContent}\`;
        });

      const text = activeProxies.join('\\n');
      navigator.clipboard.writeText(text).then(() => alert('IP:Port aktif berhasil disalin!'));
    }

    function downloadTxt() {
      const proxies = getActiveProxies().join('\\n');
      const blob = new Blob([proxies], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'active_proxies.txt';
      a.click();
    }
  </script>
</body>
</html>`, {
      headers: { "Content-Type": "text/html" }
    });
  }
}
