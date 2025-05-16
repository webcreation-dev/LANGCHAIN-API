import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Utiliser directement l'URI depuis l'env sans la modifier
    const MONGO_URI = process.env.MONGO_URI;
    
    console.log('Tentative de connexion à MongoDB...');
    console.log('URI utilisée:', MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Log sécurisé
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: 'admin', // Spécifier explicitement authSource
    });
    
    console.log('MongoDB connectée avec succès');
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error.message);
    console.error('Détails de l\'erreur:', error);
    process.exit(1);
  }
};

export default connectDB;