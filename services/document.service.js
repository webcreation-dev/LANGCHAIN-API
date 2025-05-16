import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import Document from '../models/document.model.js';

export async function processDocument(filePath, fileName, chunkSize = 500, chunkOverlap = 100) {
  try {
    // Charger le document
    const pdfLoader = new PDFLoader(filePath);
    const pdfDocs = await pdfLoader.load();
    
    // Créer un nouveau document dans la base de données
    const document = new Document({
      filename: fileName,
      path: filePath,
      metadata: {
        pageCount: pdfDocs.length,
      },
    });
    
    // Découper le document en chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });
    
    const splittedDocs = await splitter.splitDocuments(pdfDocs);
    
    // Stocker les chunks dans le document
    document.chunks = splittedDocs.map((doc, index) => ({
      content: doc.pageContent,
      index,
    }));
    
    document.metadata.wordCount = splittedDocs.reduce((acc, doc) => 
      acc + doc.pageContent.split(/\s+/).length, 0);
    
    await document.save();
    return document;
  } catch (error) {
    console.error('Erreur de traitement du document:', error);
    throw error;
  }
}

export async function getDocumentById(documentId) {
  return Document.findById(documentId);
}

export async function getDocumentChunks(documentId, startIndex, endIndex) {
  const document = await Document.findById(documentId);
  if (!document) {
    throw new Error('Document non trouvé');
  }
  
  return document.chunks.filter(chunk => 
    chunk.index >= startIndex && chunk.index <= endIndex);
}