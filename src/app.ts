import express from 'express';
import path from 'node:path';

const app = express();
const PORT = process.env.PORT || 3000;

// Settings
app.set('views', './views');
app.set('view engine', 'pug');

// Middleware
app.use(express.static(path.join(import.meta.dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.listen(PORT, () => console.log(`App running on port ${PORT}`));
