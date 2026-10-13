const fs = require('fs');
const path = require('path');

function listenPersistent(server, userData) {
  const file = path.join(userData, 'local-origin.json');
  let port = 0;
  try {
    port = JSON.parse(fs.readFileSync(file, 'utf8')).port;
    if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid saved local port');
  } catch (error) {
    if (error.code !== 'ENOENT') return Promise.reject(error);
  }
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      try {
        if (!port) fs.writeFileSync(file, JSON.stringify({ port: server.address().port }), { flag: 'wx' });
        resolve(server);
      } catch (error) {
        server.close(() => reject(error));
      }
    });
  });
}
module.exports = { listenPersistent };
