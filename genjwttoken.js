require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { username: 'backend-dev', scope: 'send-message' },
  process.env.JWT_SECRET,
  { expiresIn: '2h' }
);

console.log('Your static JWT token:\n', token);
