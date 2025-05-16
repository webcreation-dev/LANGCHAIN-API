// import Batch from '../models/batch.model.js';
// import { getDocumentChunks } from './document.service.js';
// import { genererQuestionsParChunk } from './question.service.js';
// import Queue from 'bull';
// import dotenv from 'dotenv';
// import Document from '../models/document.model.js';

// dotenv.config();

// // Création d'une file d'attente Redis pour les jobs de génération
// const questionQueue = new Queue('question-generation', {
//   redis: {
//     host: process.env.REDIS_HOST || 'localhost',
//     port: process.env.REDIS_PORT || 6379,
//   }
// });

// export async function createBatches(documentId, config) {
//   try {
//     const { 
//       categories, 
//       difficulties, 
//       types, 
//       chunkSize, 
//       questionsPerChunk = 5, 
//       maxBatchSize = 20, // nombre de chunks par batch
//     } = config;
    
//     const document = await Document.findById(documentId);
//     if (!document) {
//       throw new Error('Document non trouvé');
//     }
    
//     const totalChunks = document.chunks.length;
//     const totalBatches = Math.ceil(totalChunks / maxBatchSize);
//     const createdBatches = [];
    
//     for (let batchNumber = 0; batchNumber < totalBatches; batchNumber++) {
//       const chunkIndexStart = batchNumber * maxBatchSize;
//       const chunkIndexEnd = Math.min((batchNumber + 1) * maxBatchSize - 1, totalChunks - 1);
      
//       // Choix aléatoire de catégorie, difficulté et type pour ce batch
//       const category = Array.isArray(categories) ? 
//         categories[Math.floor(Math.random() * categories.length)] : 
//         categories;
        
//       const difficulty = Array.isArray(difficulties) ? 
//         difficulties[Math.floor(Math.random() * difficulties.length)] : 
//         difficulties;
        
//       const type = Array.isArray(types) ? 
//         types[Math.floor(Math.random() * types.length)] : 
//         types;
      
//       const batch = new Batch({
//         documentId,
//         batchNumber,
//         chunkIndexStart,
//         chunkIndexEnd,
//         status: 'pending',
//         metadata: {
//           category,
//           difficulty,
//           type,
//           questionsPerChunk,
//         },
//       });
      
//       await batch.save();
//       createdBatches.push(batch);
      
//       // Ajouter ce batch à la file d'attente pour traitement
//       await questionQueue.add({
//         batchId: batch._id,
//         documentId,
//         chunkIndexStart,
//         chunkIndexEnd,
//         category,
//         difficulty,
//         type,
//         questionsPerChunk,
//       }, {
//         attempts: 3,
//         backoff: {
//           type: 'exponential',
//           delay: 10000,
//         },
//       });
//     }
    
//     return createdBatches;
//   } catch (error) {
//     console.error('Erreur de création des batches:', error);
//     throw error;
//   }
// }

// // Configuration des workers pour traiter la file d'attente
// export function setupQueueWorkers(concurrency = 5) {
//   questionQueue.process(concurrency, async (job) => {
//     const { 
//       batchId, 
//       documentId, 
//       chunkIndexStart, 
//       chunkIndexEnd,
//       category,
//       difficulty,
//       type,
//       questionsPerChunk,
//     } = job.data;
    
//     try {
//       // Marquer le batch comme en cours de traitement
//       await updateBatchStatus(batchId, 'processing');
      
//       // Récupérer les chunks du document
//       const chunks = await getDocumentChunks(documentId, chunkIndexStart, chunkIndexEnd);
//       let totalQuestionsGenerated = 0;
      
//       // Traiter chaque chunk
//       for (const chunk of chunks) {
//         const questions = await genererQuestionsParChunk({
//           batchId,
//           documentId,
//           chunk: chunk.content,
//           chunkIndex: chunk.index,
//           category,
//           difficulty,
//           type,
//           nombre: questionsPerChunk,
//         });
        
//         totalQuestionsGenerated += questions.length;
//       }
      
//       // Mettre à jour le statut du batch
//       await updateBatchStatus(batchId, 'completed', totalQuestionsGenerated);
//       console.log(`Batch ${batchId} traité avec succès: ${totalQuestionsGenerated} questions générées`);
      
//       return { batchId, totalQuestionsGenerated };
//     } catch (error) {
//       // En cas d'erreur, marquer le batch comme échoué
//       await Batch.findByIdAndUpdate(batchId, { 
//         status: 'failed', 
//         error: error.message,
//         updatedAt: Date.now(),
//       });
      
//       console.error(`Erreur de traitement du batch ${batchId}:`, error);
//       throw error;
//     }
//   });
  
//   // Gestion des événements de la file d'attente
//   questionQueue.on('completed', (job, result) => {
//     console.log(`Job ${job.id} complété avec succès:`, result);
//   });
  
//   questionQueue.on('failed', (job, err) => {
//     console.error(`Job ${job.id} échoué:`, err);
//   });
  
//   return questionQueue;
// }



import Batch from '../models/batch.model.js';
import Question from '../models/question.model.js';
import { getDocumentChunks } from './document.service.js';
import { genererQuestionsParChunk } from './question.service.js';
import Queue from 'bull';
import dotenv from 'dotenv';
import Document from '../models/document.model.js';

dotenv.config();

// Création d'une file d'attente Redis pour les jobs de génération
const questionQueue = new Queue('question-generation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  }
});

// Ajouter des listeners pour debug
questionQueue.on('error', (error) => {
  console.error('Erreur Queue:', error);
});

questionQueue.on('waiting', (jobId) => {
  console.log(`Job ${jobId} ajouté à la queue`);
});

questionQueue.on('active', (job) => {
  console.log(`Job ${job.id} actif - Batch ${job.data.batchId}`);
});

questionQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} complété - ${result.totalQuestionsGenerated} questions`);
});

questionQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} échoué:`, err.message);
});

export async function createBatches(documentId, config) {
  try {
    console.log('Création des batches pour document:', documentId);
    
    const { 
      categories, 
      difficulties, 
      types, 
      chunkSize, 
      questionsPerChunk = 5, 
      maxBatchSize = 20,
    } = config;
    
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document non trouvé');
    }
    
    const totalChunks = document.chunks.length;
    const totalBatches = Math.ceil(totalChunks / maxBatchSize);
    const createdBatches = [];
    
    console.log(`Document avec ${totalChunks} chunks, création de ${totalBatches} batches`);
    
    for (let batchNumber = 0; batchNumber < totalBatches; batchNumber++) {
      const chunkIndexStart = batchNumber * maxBatchSize;
      const chunkIndexEnd = Math.min((batchNumber + 1) * maxBatchSize - 1, totalChunks - 1);
      
      const category = Array.isArray(categories) ? 
        categories[Math.floor(Math.random() * categories.length)] : 
        categories;
        
      const difficulty = Array.isArray(difficulties) ? 
        difficulties[Math.floor(Math.random() * difficulties.length)] : 
        difficulties;
        
      const type = Array.isArray(types) ? 
        types[Math.floor(Math.random() * types.length)] : 
        types;
      
      const batch = new Batch({
        documentId,
        batchNumber,
        chunkIndexStart,
        chunkIndexEnd,
        status: 'pending',
        metadata: {
          category,
          difficulty,
          type,
          questionsPerChunk,
          totalQuestionsGenerated: 0
        },
      });
      
      await batch.save();
      createdBatches.push(batch);
      
      // Ajouter ce batch à la file d'attente pour traitement
      const job = await questionQueue.add({
        batchId: batch._id.toString(),
        documentId: documentId.toString(),
        chunkIndexStart,
        chunkIndexEnd,
        category,
        difficulty,
        type,
        questionsPerChunk,
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      });
      
      console.log(`Batch ${batchNumber} créé et job ${job.id} ajouté à la queue`);
    }
    
    return createdBatches;
  } catch (error) {
    console.error('Erreur de création des batches:', error);
    throw error;
  }
}

export async function getBatchStatus(batchId) {
  return Batch.findById(batchId);
}

export async function getBatchesByDocument(documentId) {
  return Batch.find({ documentId }).sort({ batchNumber: 1 });
}

export async function updateBatchStatus(batchId, status, totalQuestionsGenerated = null) {
  const update = { 
    status, 
    updatedAt: Date.now() 
  };
  
  if (totalQuestionsGenerated !== null) {
    update['metadata.totalQuestionsGenerated'] = totalQuestionsGenerated;
  }
  
  return Batch.findByIdAndUpdate(batchId, update, { new: true });
}

// Configuration des workers pour traiter la file d'attente
export function setupQueueWorkers(concurrency = 5) {
  console.log(`Configuration de ${concurrency} workers`);
  
  questionQueue.process(concurrency, async (job) => {
    const { 
      batchId, 
      documentId, 
      chunkIndexStart, 
      chunkIndexEnd,
      category,
      difficulty,
      type,
      questionsPerChunk,
    } = job.data;
    
    console.log(`Traitement du batch ${batchId}`);
    
    try {
      // Marquer le batch comme en cours de traitement
      await updateBatchStatus(batchId, 'processing');
      
      // Récupérer les chunks du document
      const chunks = await getDocumentChunks(documentId, chunkIndexStart, chunkIndexEnd);
      console.log(`Récupération de ${chunks.length} chunks`);
      
      let totalQuestionsGenerated = 0;
      const allQuestions = [];
      
      // Traiter chaque chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Génération questions pour chunk ${i + 1}/${chunks.length}`);
        
        const questions = await genererQuestionsParChunk({
          batchId,
          documentId,
          chunk: chunk.content,
          chunkIndex: chunk.index,
          category,
          difficulty,
          type,
          nombre: questionsPerChunk,
        });
        
        // Sauvegarder les questions dans la base de données
        for (const q of questions) {
          const question = new Question({
            ...q,
            batchId,
            documentId,
            metadata: {
              chunkIndex: chunk.index,
              category,
              difficulty,
              type
            }
          });
          
          await question.save();
          allQuestions.push(question);
        }
        
        totalQuestionsGenerated += questions.length;
        
        // Mettre à jour la progression
        await job.progress(Math.round((i + 1) / chunks.length * 100));
      }
      
      // Mettre à jour le statut du batch
      await updateBatchStatus(batchId, 'completed', totalQuestionsGenerated);
      console.log(`✅ Batch ${batchId} complété: ${totalQuestionsGenerated} questions`);
      
      return { batchId, totalQuestionsGenerated };
    } catch (error) {
      // En cas d'erreur, marquer le batch comme échoué
      await Batch.findByIdAndUpdate(batchId, { 
        status: 'failed', 
        error: error.message,
        updatedAt: Date.now(),
      });
      
      console.error(`❌ Erreur batch ${batchId}:`, error);
      throw error;
    }
  });
  
  return questionQueue;
}