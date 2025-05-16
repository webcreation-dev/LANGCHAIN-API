import { genererQuestionsParChunk, getQuestionsByDocument, searchQuestions, countQuestionsByDocument } from '../services/question.service.js';
import { processDocument } from '../services/document.service.js';

export async function generateQuestions(req, res) {
  try {
    const {
      catégorie,
      difficulté,
      nombre,
      type,
      chunkSize = 500,
      chunkOverlap = 100,
    } = req.body;
    
    const pdfPath = req.file?.path;
    if (!pdfPath) {
      return res.status(400).json({ error: 'Fichier PDF manquant.' });
    }
    
    // Traiter le document et l'enregistrer
    const document = await processDocument(
      pdfPath, 
      req.file.originalname, 
      parseInt(chunkSize), 
      parseInt(chunkOverlap)
    );
    
    // Générer des questions pour un seul chunk (pour compatibilité)
    const firstChunk = document.chunks[0];
    if (!firstChunk) {
      return res.status(400).json({ error: 'Aucun contenu trouvé dans le document.' });
    }
    
    const questions = await genererQuestionsParChunk({
      batchId: null, // Pas de batch pour cette route legacy
      documentId: document._id,
      chunk: firstChunk.content,
      chunkIndex: 0,
      category: catégorie,
      difficulty: difficulté,
      type,
      nombre: parseInt(nombre),
    });
    
    res.json(questions);
  } catch (error) {
    console.error('Erreur dans generateQuestions:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

export async function getQuestions(req, res) {
  try {
    const { documentId } = req.params;
    const { category, difficulty, type, page = 1, limit = 100 } = req.query;
    
    const filters = {};
    if (category) filters['metadata.category'] = category;
    if (difficulty) filters['metadata.difficulty'] = difficulty;
    if (type) filters['metadata.type'] = type;
    
    const questions = await getQuestionsByDocument(
      documentId, 
      filters, 
      parseInt(page), 
      parseInt(limit)
    );
    
    const total = await countQuestionsByDocument(documentId, filters);
    
    res.json({
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      }
    });
  } catch (error) {
    console.error('Erreur dans getQuestions:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

export async function searchQuestionsHandler(req, res) {
  try {
    const { q, documentId, category, difficulty, type, page = 1, limit = 100 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Terme de recherche manquant.' });
    }
    
    const filters = {};
    if (documentId) filters.documentId = documentId;
    if (category) filters['metadata.category'] = category;
    if (difficulty) filters['metadata.difficulty'] = difficulty;
    if (type) filters['metadata.type'] = type;
    
    const questions = await searchQuestions(
      q, 
      filters, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.json(questions);
  } catch (error) {
    console.error('Erreur dans searchQuestions:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}