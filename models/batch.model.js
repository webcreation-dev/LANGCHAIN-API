// import mongoose from 'mongoose';

// const BatchSchema = new mongoose.Schema({
//   documentId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Document',
//     required: true,
//   },
//   batchNumber: {
//     type: Number,
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'processing', 'completed', 'failed'],
//     default: 'pending',
//   },
//   chunkIndexStart: Number,
//   chunkIndexEnd: Number,
//   metadata: {
//     category: String,
//     difficulty: String,
//     type: String,
//     questionsPerChunk: Number,
//     totalQuestionsGenerated: {
//       type: Number,
//       default: 0,
//     },
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
//   error: String,
// });

// export default mongoose.model('Batch', BatchSchema);


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
}, { _id: false }); // <- pour ne pas ajouter un champ _id inutile

const BatchSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  batchNumber: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  chunkIndexStart: Number,
  chunkIndexEnd: Number,
  metadata: MetadataSchema,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  error: String,
});

export default mongoose.model('Batch', BatchSchema);
