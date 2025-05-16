import { ChatGroq } from '@langchain/groq';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import Question from '../models/question.model.js';
import { createPromptTemplate } from '../utils/prompt-template.js';
import dotenv from 'dotenv';

dotenv.config();

// Mécanisme de retry et rate limiting
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 secondes

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function genererQuestionsParChunk(config) {
  const { 
    batchId, 
    documentId, 
    chunk, 
    chunkIndex, 
    category,
    difficulty,
    type,
    nombre,
  } = config;
  
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const llm = new ChatGroq({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.7,
        apiKey: process.env.GROQ_API_KEY,
      });
      
      const promptTemplate = createPromptTemplate({
        catégorie: category,
        difficulté: difficulty,
        type,
        nombre,
      });
      
      // Créer un document unique avec le contenu du chunk
      const document = {
        pageContent: chunk,
        metadata: { source: `chunk-${chunkIndex}` },
      };
      
      const chain = await createStuffDocumentsChain({
        llm,
        prompt: promptTemplate,
        documentVariableName: 'context',
      });
      
      const response = await chain.invoke({
        context: [document],
        categorie: category,
        difficulte: difficulty,
        nombre,
        type,
      });
      
      let responseText = typeof response === 'string' ? response : response.content;
      
      // Nettoyer la réponse JSON
      if (responseText.startsWith('```json')) {
        responseText = responseText.replace(/```json\s*([\s\S]*?)\s*```/, '$1').trim();
      }
      
      // Analyser les questions
      const questions = JSON.parse(responseText);
      
      // Sauvegarder les questions en base de données
      const savedQuestions = await Promise.all(
        questions.map(async (q) => {
          const question = new Question({
            ...q,
            documentId,
            batchId,
            metadata: {
              category,
              difficulty,
              type,
              sourceChunkIndex: chunkIndex,
            },
          });
          return question.save();
        })
      );
      
      return savedQuestions;
    } catch (error) {
      retries++;
      console.error(`Erreur de génération (tentative ${retries}/${MAX_RETRIES}):`, error);
      
      if (retries >= MAX_RETRIES) {
        throw new Error(`Échec de génération après ${MAX_RETRIES} tentatives: ${error.message}`);
      }
      
      // Attendre avant de réessayer
      await wait(RETRY_DELAY * retries);
    }
  }
}

export async function getQuestionsByDocument(documentId, filters = {}, page = 1, limit = 100) {
  const query = { documentId, ...filters };
  return Question.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });
}

export async function getQuestionsBatch(batchId) {
  return Question.find({ batchId }).sort({ createdAt: -1 });
}

export async function countQuestionsByDocument(documentId, filters = {}) {
  const query = { documentId, ...filters };
  return Question.countDocuments(query);
}

export async function searchQuestions(searchTerm, filters = {}, page = 1, limit = 100) {
  const query = {
    $text: { $search: searchTerm },
    ...filters,
  };
  
  return Question.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ score: { $meta: 'textScore' } });
}