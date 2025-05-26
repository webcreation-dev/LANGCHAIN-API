import express from 'express';
import multer from 'multer';
import {
  startBatchGeneration,
  getBatchStatusHandler,
  getDocumentBatchesHandler,
  getBatchQuestionsHandler,
  getAllQuestionsForDocumentHandler,
} from '../controllers/batch.controller.js';

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

export default router;
