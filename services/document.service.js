import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import fs from 'fs/promises';
import axios from 'axios';
import Document from '../models/document.model.js';

export async function processDocument(
  source,
  fileName,
  chunkSize = 500,
  chunkOverlap = 100,
  sourceType = 'pdf'
) {
  try {
    let content = '';

    if (sourceType === 'pdf') {
      // Charger le document PDF
      const pdfLoader = new PDFLoader(source);
      const pdfDocs = await pdfLoader.load();
      content = pdfDocs.map(doc => doc.pageContent).join('\n');
    } else if (sourceType === 'text') {
      // Charger un fichier texte
      content = await fs.readFile(source, 'utf-8');
    } else if (sourceType === 'url') {
      // Charger le contenu d'une URL
      const response = await axios.get(source);
      content = response.data;
    } else {
      throw new Error('Type de source non supporté');
    }

    // Créer un nouveau document dans la base de données
    const document = new Document({
      filename: fileName,
      path: source,
      sourceType,
      metadata: {
        sourceType,
      },
    });

    // Découper le contenu en chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    const splittedDocs = await splitter.splitText(content);

    // Stocker les chunks dans le document
    document.chunks = splittedDocs.map((chunk, index) => ({
      content: chunk,
      index,
    }));

    document.metadata.wordCount = splittedDocs.reduce(
      (acc, chunk) => acc + chunk.split(/\s+/).length,
      0
    );

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

  return document.chunks.filter(
    chunk => chunk.index >= startIndex && chunk.index <= endIndex
  );
}
