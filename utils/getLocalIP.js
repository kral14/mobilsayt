const os = require('os');

// Local IP ünvanını tap
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4 və internal olmayan (loopback deyil) ünvanı tap
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

module.exports = { getLocalIP };

