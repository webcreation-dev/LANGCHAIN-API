import { 
    createBatches, 
    getBatchStatus, 
    getBatchesByDocument, 
    setupQueueWorkers 
  } from '../services/batch.service.js';
  import { getQuestionsBatch } from '../services/question.service.js';
  import { processDocument } from '../services/document.service.js';
  
  // Initialiser les workers de traitement
  setupQueueWorkers(process.env.CONCURRENCY || 5);
  
  export async function startBatchGeneration(req, res) {
    try {
      const {
        categories,
        difficulties,
        types,
        questionsPerChunk = 10,
        chunkSize = 500,
        chunkOverlap = 100,
        maxBatchSize = 20,
      } = req.body;
      
      const pdfPath = req.file?.path;
      if (!pdfPath) {
        return res.status(400).json({ error: 'Fichier PDF manquant.' });
      }
      
      // Traiter le document
      const document = await processDocument(
        pdfPath, 
        req.file.originalname, 
        parseInt(chunkSize), 
        parseInt(chunkOverlap)
      );
      
      // Créer les batches
      const batches = await createBatches(document._id, {
        categories,
        difficulties,
        types,
        questionsPerChunk: parseInt(questionsPerChunk),
        maxBatchSize: parseInt(maxBatchSize),
      });
      
      res.json({
        documentId: document._id,
        totalBatches: batches.length,
        estimatedQuestions: batches.length * parseInt(maxBatchSize) * parseInt(questionsPerChunk),
        batches: batches.map(b => ({
          batchId: b._id,
          batchNumber: b.batchNumber,
          status: b.status,
        })),
      });
    } catch (error) {
      console.error('Erreur dans startBatchGeneration:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }
  
  export async function getBatchStatusHandler(req, res) {
    try {
      const { batchId } = req.params;
      const batch = await getBatchStatus(batchId);
      
      if (!batch) {
        return res.status(404).json({ error: 'Batch non trouvé.' });
      }
      
      res.json(batch);
    } catch (error) {
      console.error('Erreur dans getBatchStatus:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }
  
  export async function getDocumentBatchesHandler(req, res) {
    try {
      const { documentId } = req.params;
      const batches = await getBatchesByDocument(documentId);
      
      res.json(batches);
    } catch (error) {
      console.error('Erreur dans getDocumentBatches:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }
  
  export async function getBatchQuestionsHandler(req, res) {
    try {
      const { batchId } = req.params;
      const questions = await getQuestionsBatch(batchId);
      
      res.json(questions);
    } catch (error) {
      console.error('Erreur dans getBatchQuestions:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }