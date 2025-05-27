import express from 'express';
import multer from 'multer';
import {
  startBatchGeneration,
  getBatchStatusHandler,
  getDocumentBatchesHandler,
  getBatchQuestionsHandler,
  getAllQuestionsForDocumentHandler,
} from '../controllers/batch.controller.js';
import { processDocument } from '../services/document.service.js';
import { genererQuestionsParChunk } from '../services/question.service.js';
import batchModel from '../models/batch.model.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/start', upload.single('pdf'), startBatchGeneration);
router.get('/:batchId', getBatchStatusHandler);
router.get('/document/:documentId', getDocumentBatchesHandler);
router.get('/:batchId/questions', getBatchQuestionsHandler);

router.get(
  '/document/:documentId/all-questions',
  getAllQuestionsForDocumentHandler
);

router.post('/generate-from-text', upload.single('text'), async (req, res) => {
  const { chunkSize, chunkOverlap, catégorie, difficulté, nombre, type } =
    req.body;
  const textPath = req.file?.path;

  if (!textPath) {
    return res.status(400).json({ error: 'Fichier texte manquant.' });
  }

  try {
    const document = await processDocument(
      textPath,
      req.file.originalname,
      chunkSize,
      chunkOverlap,
      'text'
    );
    const questions = await genererQuestionsParChunk({
      documentId: document._id,
      chunk: document.chunks[0].content,
      chunkIndex: 0,
      category: catégorie,
      difficulty: difficulté,
      type,
      nombre,
    });

    res.json(questions);
  } catch (error) {
    console.error('Erreur dans generate-from-text:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// router.post('/generate-from-url', async (req, res) => {
//   const { url, chunkSize, chunkOverlap, catégorie, difficulté, nombre, type } =
//     req.body;

//   if (!url) {
//     return res.status(400).json({ error: 'URL manquante.' });
//   }

//   try {
//     // Étape 1 : Traiter le document depuis l'URL
//     const document = await processDocument(
//       url,
//       url,
//       chunkSize,
//       chunkOverlap,
//       'url'
//     );

//     // Étape 2 : Créer un batch temporaire
//     const batch = new batchModel({
//       documentId: document._id,
//       batchNumber: 0, // Batch fictif
//       status: 'processing',
//       metadata: {
//         category: catégorie,
//         difficulty: difficulté,
//         type,
//         questionsPerChunk: nombre,
//         totalQuestionsGenerated: 0,
//       },
//     });
//     await batch.save();

//     // Étape 3 : Générer les questions en associant le batchId
//     const questions = await genererQuestionsParChunk({
//       documentId: document._id,
//       batchId: batch._id, // Associer le batch temporaire
//       chunk: document.chunks[0].content,
//       chunkIndex: 0,
//       category: catégorie,
//       difficulty: difficulté,
//       type,
//       nombre,
//     });

//     // Étape 4 : Mettre à jour le batch comme "complété"
//     batch.status = 'completed';
//     batch.metadata.totalQuestionsGenerated = questions.length;
//     await batch.save();

//     res.json(questions);
//   } catch (error) {
//     console.error('Erreur dans generate-from-url:', error);
//     res.status(500).json({ error: 'Erreur interne du serveur' });
//   }
// });

router.post('/generate-from-url', async (req, res) => {
  const { url, chunkSize, chunkOverlap, catégorie, difficulté, nombre, type } =
    req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante.' });
  }

  try {
    // Étape 1 : Traiter le document depuis l'URL
    const document = await processDocument(
      url,
      url,
      chunkSize,
      chunkOverlap,
      'url'
    );

    // Étape 2 : Créer un batch temporaire
    const batch = new batchModel({
      documentId: document._id,
      batchNumber: 0, // Batch fictif
      status: 'processing',
      metadata: {
        category: catégorie,
        difficulty: difficulté,
        type,
        questionsPerChunk: nombre,
        totalQuestionsGenerated: 0,
      },
    });
    await batch.save();

    // Étape 3 : Générer les questions pour tous les chunks
    const allQuestions = [];
    for (const chunk of document.chunks) {
      const questions = await genererQuestionsParChunk({
        documentId: document._id,
        batchId: batch._id, // Associer le batch temporaire
        chunk: chunk.content,
        chunkIndex: chunk.index,
        category: catégorie,
        difficulty: difficulté,
        type,
        nombre,
      });
      allQuestions.push(...questions);
    }

    // Étape 4 : Mettre à jour le batch comme "complété"
    batch.status = 'completed';
    batch.metadata.totalQuestionsGenerated = allQuestions.length;
    await batch.save();

    res.json(allQuestions);
  } catch (error) {
    console.error('Erreur dans generate-from-url:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
