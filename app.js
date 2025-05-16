// import express from 'express';
// import dotenv from 'dotenv';
// import connectDB from './config/db.config.js';
// import questionRoutes from './routes/question.routes.js';
// import batchRoutes from './routes/batch.routes.js';

// dotenv.config();

// // Connexion à la base de données
// connectDB();

// const app = express();


// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use('/api/questions', questionRoutes);
// app.use('/api/batches', batchRoutes);

// // Endpoint de base
// app.get('/', (req, res) => {
//   res.json({ message: 'API de génération de questions - version 2.0' });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Serveur démarré sur http://localhost:${PORT}`);
// });




import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import batchRoutes from './routes/batch.routes.js';
import Queue from 'bull';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/batches', batchRoutes);

// Endpoint de test Redis
app.get('/api/health/redis', async (req, res) => {
  try {
    const testQueue = new Queue('test-queue', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      }
    });
    
    await testQueue.client.ping();
    
    res.json({
      status: 'ok',
      redis: 'connected',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      redis: 'disconnected',
      error: error.message
    });
  }
});

// Endpoint pour voir l'état de la queue
app.get('/api/health/queue', async (req, res) => {
  try {
    const questionQueue = new Queue('question-generation', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      }
    });
    
    const [waiting, active, completed, failed] = await Promise.all([
      questionQueue.getWaitingCount(),
      questionQueue.getActiveCount(),
      questionQueue.getCompletedCount(),
      questionQueue.getFailedCount()
    ]);
    
    res.json({
      queue: 'question-generation',
      stats: {
        waiting,
        active,
        completed,
        failed
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connecté'))
.catch(err => console.error('Erreur MongoDB:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});