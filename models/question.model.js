import mongoose from 'mongoose';

const MetadataSchema = new mongoose.Schema({
  category: String,
  difficulty: String,
  type: String,
  questionsPerChunk: Number,
  totalQuestionsGenerated: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    default: undefined,
  },
  réponse: {
    type: String,
    required: true,
  },
  explication: {
    type: String,
    required: false,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
  },
  metadata: MetadataSchema,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index pour recherche efficace
QuestionSchema.index({ 
    question: 'text', 
    metadata: 1, 
    documentId: 1, 
    batchId: 1 
  });
  
  export default mongoose.model('Question', QuestionSchema);
  