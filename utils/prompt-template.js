import { ChatPromptTemplate } from '@langchain/core/prompts';

export function createPromptTemplate(config) {
  let instructions = '';

  switch (config.type) {
    case 'qcm':
      instructions = '...'; // même texte que dans ton code original
      break;
    case 'vrai/faux':
      instructions = '...';
      break;
    case 'ouverte':
      instructions = '...';
      break;
    case 'association':
      instructions = '...';
      break;
    case 'complétez':
      instructions = '...';
      break;
  }

  const template = `
    Tu es un expert en création de contenu pédagogique. 
    Génère {nombre} questions de type "{type}" de niveau de difficulté "{difficulte}" 
    dans la catégorie "{categorie}" basées sur le contenu fourni.
    
    ${instructions}
    
    Format de réponse: Retourne UNIQUEMENT un tableau JSON avec chaque question ayant:
    - "question": l'énoncé de la question
    - "options": les choix possibles (uniquement pour QCM et association)
    - "réponse": la réponse correcte
    - "explication": brève explication de la réponse
    
    Contexte du document:
    {context}
    
    Réponds UNIQUEMENT avec le tableau JSON sans texte supplémentaire.
  `;

  return ChatPromptTemplate.fromTemplate(template);
}
