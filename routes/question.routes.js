import express from 'express';
import multer from 'multer';
import { 
  generateQuestions, 
  getQuestions, 
  searchQuestionsHandler 
} from '../controllers/question.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Routes compatibles avec l'existant
router.post('/generate', upload.single('pdf'), generateQuestions);

// Nouvelles routes
router.get('/document/:documentId', getQuestions);
router.get('/search', searchQuestionsHandler);

export default router;