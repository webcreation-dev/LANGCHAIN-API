import express from 'express';
import dotenv from 'dotenv';
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
   