import { genererQuestions } from '../services/question.service.js';

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

    const questions = await genererQuestions({
      pdfPath,
      catégorie,
      difficulté,
      nombre: parseInt(nombre),
      type,
      chunkSize: parseInt(chunkSize),
      chunkOverlap: parseInt(chunkOverlap),
    });

    res.json(questions);
  } catch (error) {
    console.error('Erreur dans generateQuestions:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}
