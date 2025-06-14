export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { ip, port } = req.body;
      const url = `https://apihealtcheck.vercel.app/api/v1?ip=${ip}&port=${port}`;
      const response = await fetch(url);
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: true, message: error.message });
    }
  }

  // return halaman HTML untuk GET request
  return res.status(200).send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Proxy Checker</title>
  <style>
    body { background: #121212; color: #eee; font-family: sans-serif; padding: 20px; }
    textarea, input[type="file"] { width: 100%; margin-top: 10px; background: #222; color: #fff; padding: 10px; border-radius: 4px; border: none; }
    button { margin-top: 10px; padding: 10px; background: #00acc1; color: white; border: none; border-radius: 4px; cursor: pointer; }
    table { width: 100%; margin-top: 20px; border-collapse: collapse; }
    th, td { padding: 10px; border-bottom: 1px solid #333; }
    .green { color: #69f0ae; font-weight: bold; }
    .red { color: #ff5252; font-weight: bold; }
  </style>
</head>
<body>
  <h2>🔥 Proxy Checker</h2>
  <textarea id="input" rows="6" placeholder="IP:PORT\\n..."></textarea>
  <input type="file" id="fileInput" multiple accept=".txt" /><br/>
  <button onclick="startCheck()">Mulai Cek</button>
  <table><thead><tr><th>IP</th><th>Port</th><th>Status</th></tr></thead><tbody id="result"></tbody></table>
  <script>
    async function startCheck() {
      const lines = document.getElementById('input').value.trim().split('\\n');
      const result = document.getElementById('result');
      result.innerHTML = '';
      for (const line of lines) {
        const [ip, port] = line.split(':');
        const row = result.insertRow();
        row.insertCell().textContent = ip;
        row.insertCell().textContent = port;
        const statusCell = row.insertCell();
        statusCell.textContent = '...';

        try {
          const res = await fetch('/api/server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip, port })
          });
          const data = await res.json();
          if (data.proxyip) {
            statusCell.textContent = 'Active';
            statusCell.className = 'green';
          } else {
            statusCell.textContent = 'Inactive';
            statusCell.className = 'red';
          }
        } catch {
          statusCell.textContent = 'Error';
          statusCell.className = 'red';
        }
      }
    }
  </script>
</body>
</html>`);
}
