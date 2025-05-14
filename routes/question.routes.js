import express from 'express';
import multer from 'multer';
import { generateQuestions } from '../controllers/question.controller.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' }); // Dossier temporaire

router.post('/generate', upload.single('pdf'), generateQuestions);

export default router;
