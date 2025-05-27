import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  sourceType: {
    type: String,
    enum: ['pdf', 'text', 'url'],
    required: true,
  },
  processed: {
    type: Boolean,
    default: false,
  },
  chunks: [{
    content: String,
    index: Number,
  }],
  metadata: {
    pageCount: Number,
    wordCount: Number,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
});

export default mongoose.model('Document', DocumentSchema);