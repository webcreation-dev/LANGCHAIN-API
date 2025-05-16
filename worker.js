import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { setupQueueWorkers } from './services/batch.service.js';

dotenv.config();

async function startWorker() {
  try {
    // Connexion MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connecté');
    
    // Démarrer les workers (5 en parallèle)
    const queue = setupQueueWorkers(5);
    console.log('🚀 Workers démarrés et en attente de jobs...');
    
    // Afficher le nombre de jobs en attente
    setInterval(async () => {
      const waiting = await queue.getWaitingCount();
      const active = await queue.getActiveCount();
      const completed = await queue.getCompletedCount();
      const failed = await queue.getFailedCount();
      
      console.log(`📊 État de la queue - En attente: ${waiting}, Actifs: ${active}, Complétés: ${completed}, Échoués: ${failed}`);
    }, 10000); // Toutes les 10 secondes
    
    // Garder le processus actif
    process.stdin.resume();
    
  } catch (error) {
    console.error('Erreur démarrage worker:', error);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt
process.on('SIGTERM', async () => {
  console.log('Arrêt des workers...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Arrêt des workers...');
  process.exit(0);
});

startWorker();