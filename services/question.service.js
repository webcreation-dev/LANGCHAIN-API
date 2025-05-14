import { ChatGroq } from '@langchain/groq';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import fs from 'fs';
import { createPromptTemplate } from '../utils/prompt-template.js';

export async function genererQuestions(config) {
  const llm = new ChatGroq({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    apiKey: process.env.GROQ_API_KEY,
  });

  const pdfLoader = new PDFLoader(config.pdfPath);
  const pdfDocs = await pdfLoader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
  });

  const splittedDocs = await splitter.splitDocuments(pdfDocs);

  const promptTemplate = createPromptTemplate(config);

  const chain = await createStuffDocumentsChain({
    llm,
    prompt: promptTemplate,
    documentVariableName: 'context',
  });

  const response = await chain.invoke({
    context: splittedDocs,
    categorie: config.catégorie,
    difficulte: config.difficulté,
    nombre: config.nombre,
    type: config.type,
  });

  try {
    let responseText =
      typeof response === 'string' ? response : response.content;

    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\s*([\s\S]*?)\s*```/, '$1').trim();
    }

    return JSON.parse(responseText);
  } catch (error) {
    return [{ error: true, message: 'Erreur de parsing', rawResponse: response }];
  }
}

export function sauvegarderQuestions(questions, outputPath) {
  const jsonString = JSON.stringify(questions, null, 2);
  fs.writeFileSync(outputPath, jsonString);
}
