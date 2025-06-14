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
      } catch {
        return new Response(JSON.stringify({ error: true }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Proxy Checker</title>
  <style>
    body { background: #121212; color: #e0e0e0; font-family: monospace; padding: 20px; }
    h2 { color: #00e676; }
    textarea, input[type="file"] {
      background: #1e1e1e; color: #fff; border: 1px solid #444;
      border-radius: 6px; padding: 10px; width: 100%; margin-top: 10px; font-size: 16px;
    }
    button {
      background: #00acc1; border: none; color: white; padding: 10px 20px;
      margin: 10px 10px 0 0; font-size: 16px; border-radius: 5px; cursor: pointer;
    }
    button:hover { background: #00838f; }
    table {
      width: 100%; margin-top: 20px; border-collapse: collapse; background: #1e1e1e;
      border-radius: 6px; overflow: hidden;
    }
    th { background: #263238; color: #fff; padding: 10px; }
    td { padding: 10px; border-bottom: 1px solid #333; }
    .green { color: #69f0ae; font-weight: bold; }
    .red { color: #ff5252; font-weight: bold; }
  </style>
</head>
<body>
  <h2>🔥 Proxy Checker</h2>
  <textarea id="input" rows="6" placeholder="Masukkan proxy manual: IP:PORT\\n..."></textarea>
  <input type="file" id="fileInput" multiple accept=".txt" /><br/>
  <button onclick="loadFromFiles()">Gabungkan Dari File</button>
  <button onclick="startCheck()">Mulai Cek</button>
  <button onclick="copyToClipboard()">Salin Proxy Aktif</button>
  <button onclick="copyIpPort()">Salin IP:Port Aktif</button>
  <button onclick="downloadTxt()">Unduh .txt</button>

  <div id="stats" style="margin-top: 20px;">
    <b>Total:</b> <span id="total">0</span> |
    <b>Active:</b> <span id="active">0</span> |
    <b>Inactive:</b> <span id="inactive">0</span>
  </div>

  <table><thead><tr>
    <th>No</th><th>IP</th><th>Port</th><th>Status</th>
    <th>Country</th><th>Org</th><th>Protocol</th><th>Delay</th>
  </tr></thead><tbody id="result"></tbody></table>

<script>
window.onload = () => {
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
  if (!files.length) return alert("Pilih file .txt");
  let allText = document.getElementById('input').value.trim();
  for (const file of files) {
    const text = await file.text();
    allText += '\\n' + text.trim();
  }
  document.getElementById('input').value = allText.trim();
  alert('File berhasil digabung!');
}

async function startCheck() {
  const input = document.getElementById('input');
  const result = document.getElementById('result');
  const stats = { total: 0, active: 0, inactive: 0 };
  const lines = Array.from(new Set(
    input.value.trim().split('\\n').map(x => x.trim()).filter(Boolean)
  ));
  input.value = lines.join('\\n');
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

      } catch {
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
  return Array.from(document.querySelectorAll('#result tr'))
    .filter(r => r.querySelector('.green'))
    .map(r => {
      const c = r.querySelectorAll('td');
      const country = (c[4].textContent || '').split(' ')[0];
      return [c[1].textContent, c[2].textContent, country || '-', c[5].textContent || '-'].join(',');
    }).sort();
}

function copyToClipboard() {
  const proxies = getActiveProxies().join('\\n');
  navigator.clipboard.writeText(proxies).then(() => alert('Disalin ke clipboard!'));
}

function copyIpPort() {
  const rows = Array.from(document.querySelectorAll('#result tr'));
  const active = rows.filter(r => r.querySelector('.green'))
    .map(r => {
      const c = r.querySelectorAll('td');
      return \`\${c[1].textContent}:\${c[2].textContent}\`;
    });
  navigator.clipboard.writeText(active.join('\\n')).then(() => alert('IP:Port disalin!'));
}

function downloadTxt() {
  const blob = new Blob([getActiveProxies().join('\\n')], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'active_proxies.txt';
  a.click();
}
</script>
</body></html>`, {
      headers: { "Content-Type": "text/html" }
    });
  }
};
