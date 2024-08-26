import express from 'express';
import path from 'node:path';
import indexRouter from './routes/index.js';
import catalogRouter from './routes/catalog.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Settings
app.set('views', path.join(import.meta.dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(express.static(path.join(import.meta.dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/', indexRouter);
app.use('/catalog', catalogRouter);

app.listen(PORT, () => console.log(`App running on port ${PORT}`));
