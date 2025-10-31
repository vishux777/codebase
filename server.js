const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PathSafe 3D Demo Server running on port ${PORT}`);
  console.log(`Visit: http://0.0.0.0:${PORT}`);
});
