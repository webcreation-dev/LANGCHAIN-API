/******************* FISRT VERSION ************************/

// import { ChatGroq } from '@langchain/groq';
// import { ChatPromptTemplate } from '@langchain/core/prompts';
// import { Document } from '@langchain/core/documents';
// import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
// import { OllamaEmbeddings } from '@langchain/ollama';
// import { MemoryVectorStore } from 'langchain/vectorstores/memory';
// import { createRetrievalChain } from 'langchain/chains/retrieval';
// import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

// async function main() {
//   const llm = new ChatGroq({
//     model: 'llama-3.3-70b-versatile',
//     temperature: 0.5,
//     apiKey: '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'
//   });

//   const prompt = ChatPromptTemplate.fromTemplate(`
//     Réponds à la question de l'utilisateur.
//     Contexte : {context}
//     Question : {input}
//   `);

//   // 🔁 Charger le PDF d'abord
//   const pdfLoader = new PDFLoader('test.pdf');
//   const pdfDocs = await pdfLoader.load();

//   // 🔁 Puis splitter les documents PDF
//   const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 250,
//     chunkOverlap: 50,
//   });
//   const splittedDocs = await splitter.splitDocuments(pdfDocs);

//   // (Optionnel : un document manuel)
//   const infosAnthony = new Document({
//     pageContent: 'Anthony aime la salade de fruits',
//   });

//   const chain = await createStuffDocumentsChain({
//     prompt,
//     llm,
//     documents: splittedDocs, // 👈 Utilise les documents splittés ici
//   });

//   const response = await chain.invoke({
//     input: "Il a combien d'année d'expérience ?",
//     context: splittedDocs,
//   });

//   console.log("Réponse de l'IA :", response);
// }

// main();

/******************* SECOND VERSION ************************/

// import { ChatGroq } from '@langchain/groq';
// import { ChatPromptTemplate } from '@langchain/core/prompts';
// import { Document } from '@langchain/core/documents';
// import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
// import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
// import fs from 'fs';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// /**
//  * Catégories possibles pour les questions
//  * @typedef {'connaissance' | 'compréhension' | 'application' | 'analyse' | 'synthèse' | 'évaluation'} Catégorie
//  */

// /**
//  * Niveaux de difficulté possibles
//  * @typedef {'facile' | 'moyen' | 'difficile' | 'expert'} NiveauDifficulté
//  */

// /**
//  * Types de questions possibles
//  * @typedef {'qcm' | 'vrai/faux' | 'ouverte' | 'association' | 'complétez'} TypeQuestion
//  */

// /**
//  * Configuration pour la génération de questions
//  * @typedef {Object} ConfigurationQuestions
//  * @property {string} pdfPath - Chemin vers le fichier PDF
//  * @property {Catégorie} catégorie - Catégorie des questions à générer
//  * @property {NiveauDifficulté} difficulté - Niveau de difficulté des questions
//  * @property {number} nombre - Nombre de questions à générer
//  * @property {TypeQuestion} type - Type de questions à générer
//  * @property {number} chunkSize - Taille des morceaux de texte en caractères
//  * @property {number} chunkOverlap - Chevauchement entre les morceaux
//  */

// /**
//  * Génère des questions basées sur le contenu d'un PDF selon les paramètres spécifiés
//  * @param {ConfigurationQuestions} config - Configuration pour la génération
//  * @returns {Promise<Array<Object>>} Liste des questions générées
//  */
// async function genererQuestions(config) {
//   // Configuration de l'API LLM
//   const llm = new ChatGroq({
//     model: 'llama-3.3-70b-versatile',
//     temperature: 0.7, // Température légèrement plus élevée pour favoriser la créativité
//     apiKey:
//       process.env.GROQ_API_KEY ||
//       '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',
//   });

//   // Charger le PDF
//   console.log(`Chargement du PDF: ${config.pdfPath}`);
//   const pdfLoader = new PDFLoader(config.pdfPath);
//   const pdfDocs = await pdfLoader.load();

//   // Découper le document en morceaux
//   const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: config.chunkSize || 500,
//     chunkOverlap: config.chunkOverlap || 50,
//   });
//   const splittedDocs = await splitter.splitDocuments(pdfDocs);
//   console.log(`PDF découpé en ${splittedDocs.length} morceaux`);

//   // Création du prompt pour la génération de questions
//   const promptTemplate = createPromptTemplate(config);

//   // Création de la chaîne de traitement
//   const chain = await createStuffDocumentsChain({
//     llm,
//     prompt: promptTemplate,
//     documentVariableName: 'context', // Cette ligne est cruciale - elle définit la variable pour les documents
//   });

//   // Génération des questions
//   console.log(
//     `Génération de ${config.nombre} questions de type ${config.type} (difficulté: ${config.difficulté})`
//   );
//   const response = await chain.invoke({
//     context: splittedDocs, // On passe les documents comme "context" maintenant
//     categorie: config.catégorie,
//     difficulte: config.difficulté,
//     nombre: config.nombre,
//     type: config.type,
//   });

//   // Transformation de la réponse en format JSON
//   try {
//     let responseText =
//       typeof response === 'string' ? response : response.content;

//     if (responseText.startsWith('```json')) {
//       responseText = responseText
//         .replace(/```json\s*([\s\S]*?)\s*```/, '$1')
//         .trim();
//     }

//     console.log('Réponse nettoyée:', responseText);

//     const questions = JSON.parse(responseText);
//     return questions;
//   } catch (error) {
//     console.error('Erreur lors du parsing des questions:', error.message);
//     console.log('Réponse brute complète:', response);

//     return [
//       {
//         error: true,
//         message: 'Format de réponse incorrect',
//         rawResponse: response,
//       },
//     ];
//   }
// }

// /**
//  * Crée un template de prompt adapté aux paramètres de génération de questions
//  * @param {ConfigurationQuestions} config - Configuration pour la génération
//  * @returns {ChatPromptTemplate} Template de prompt configuré
//  */
// function createPromptTemplate(config) {
//   let instructions = '';

//   // Instructions spécifiques selon le type de question
//   switch (config.type) {
//     case 'qcm':
//       instructions = `
//         Pour chaque question, génère 4 choix de réponses dont une seule est correcte.
//         Chaque question doit avoir un énoncé clair suivi des options A, B, C et D.
//         Indique la réponse correcte dans le champ "réponse".
//       `;
//       break;
//     case 'vrai/faux':
//       instructions = `
//         Génère des affirmations basées sur le contenu, que l'utilisateur devra qualifier de vraies ou fausses.
//         Chaque question doit être une affirmation simple et directe.
//         Indique si l'affirmation est vraie ou fausse dans le champ "réponse".
//       `;
//       break;
//     case 'ouverte':
//       instructions = `
//         Génère des questions ouvertes qui nécessitent une réflexion approfondie.
//         Chaque question doit encourager une réponse développée.
//         Fournis une réponse modèle dans le champ "réponse".
//       `;
//       break;
//     case 'association':
//       instructions = `
//         Crée des exercices d'association où l'utilisateur doit relier des concepts entre eux.
//         Chaque question doit contenir deux listes d'éléments à associer.
//         Fournis les associations correctes dans le champ "réponse".
//       `;
//       break;
//     case 'complétez':
//       instructions = `
//         Génère des phrases à trous basées sur le contenu.
//         Chaque question doit être une phrase avec un ou plusieurs mots manquants, indiqués par des soulignés (_____).
//         Fournis les mots manquants dans le champ "réponse".
//       `;
//       break;
//   }

//   // Template de prompt complet - NOTEZ le changement de {documents} à {context}
//   const template = `
//     Tu es un expert en création de contenu pédagogique.
//     Génère {nombre} questions de type "{type}" de niveau de difficulté "{difficulte}"
//     dans la catégorie "{categorie}" basées sur le contenu fourni.

//     ${instructions}

//     Format de réponse: Retourne UNIQUEMENT un tableau JSON avec chaque question ayant:
//     - "question": l'énoncé de la question
//     - "options": les choix possibles (uniquement pour QCM et association)
//     - "réponse": la réponse correcte
//     - "explication": brève explication de la réponse

//     Contexte du document:
//     {context}

//     Réponds UNIQUEMENT avec le tableau JSON sans texte supplémentaire.
//   `;

//   return ChatPromptTemplate.fromTemplate(template);
// }

// /**
//  * Sauvegarde les questions générées dans un fichier JSON
//  * @param {Array<Object>} questions - Liste des questions générées
//  * @param {string} outputPath - Chemin du fichier de sortie
//  */
// function sauvegarderQuestions(questions, outputPath) {
//   const jsonString = JSON.stringify(questions, null, 2);
//   fs.writeFileSync(outputPath, jsonString);
//   console.log(`Questions sauvegardées dans ${outputPath}`);
// }

// // Exemple d'utilisation
// async function main() {
//   const config = {
//     pdfPath: 'test.pdf',
//     catégorie: 'compréhension',
//     difficulté: 'moyen',
//     nombre: 5,
//     type: 'qcm',
//     chunkSize: 500,
//     chunkOverlap: 100,
//   };

//   try {
//     const questions = await genererQuestions(config);
//     console.log(`${questions.length} questions générées avec succès!`);

//     // Afficher un exemple de question
//     if (questions.length > 0 && !questions[0].error) {
//       console.log('Exemple de question générée:');
//       console.log(questions[0]);
//     }

//     // Option: sauvegarder les questions dans un fichier
//     sauvegarderQuestions(questions, 'questions-generees.json');
//   } catch (error) {
//     console.error('Erreur lors de la génération des questions:', error);
//   }
// }

// main();

// export { genererQuestions, sauvegarderQuestions };

import express from 'express';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import questionRoutes from './routes/question.routes.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/questions', questionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
