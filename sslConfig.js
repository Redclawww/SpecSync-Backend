const https = require('https');

// Define your custom SSL/TLS options
const sslOptions = {
  // You can customize these options based on your needs
  rejectUnauthorized: false, // Disable certificate verification (not recommended for production)
  // Or provide a custom certificate authority (CA) bundle
  // ca: fs.readFileSync('/path/to/your/ca/bundle.pem')
};

// Create a custom HTTPS agent with the SSL/TLS options
const customAgent = new https.Agent(sslOptions);

module.exports = customAgent;