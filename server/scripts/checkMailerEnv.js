
const mask = (s) => (s ? s.slice(0, 2) + '...' : '<unset>');

console.log('Checking SMTP environment variables...');
console.log('SMTP_HOST:', process.env.SMTP_HOST ? process.env.SMTP_HOST : '<unset>');
console.log('SMTP_PORT:', process.env.SMTP_PORT ? process.env.SMTP_PORT : '<unset>');
console.log('SMTP_USER:', process.env.SMTP_USER ? mask(process.env.SMTP_USER) : '<unset>');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : '<unset>');
console.log('FROM_EMAIL:', process.env.FROM_EMAIL ? process.env.FROM_EMAIL : '<unset>');
console.log('NODE_ENV:', process.env.NODE_ENV || '<unset>');

try {
  const mailer = require('../config/mailer');
  console.log('Mailer module loaded. sendMail available:', typeof mailer === 'function');
} catch (err) {
  console.error('Error loading mailer module:', err.message);
}
