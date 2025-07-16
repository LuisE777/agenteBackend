require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const geminiRoutes = require('./routes/gemini.routes');
const croqRoutes = require('./routes/croq.routes');
const openaiRoutes = require('./routes/openai.routes');
const huggingFaceRoutes = require('./routes/huggingFace.routes');
const novitaRoutes = require('./routes/novita.routes');
const cors = require('cors');
app.use(cors());
app.use(express.json());
app.use('/api/gemini', geminiRoutes);
app.use('/api/croq', croqRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/hugging_face', huggingFaceRoutes);
app.use('/api/novitaRoutes', novitaRoutes);
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo 🔥🐲 en http://localhost:${PORT}`);
});

//res.send('🔥🐉 Servidor corriendo correctamente');