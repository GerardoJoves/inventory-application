#! /usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
const Client = pg.Client;
dotenv.config();

const client = new Client({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  database: process.env.PG_DATABASE,
});

interface Game {
  title: string;
  description: string;
  release_date: string;
  price: number;
  genres: string[];
  developers: string[];
}

interface GamesByGenre {
  [key: string]: number[];
}

interface GamesByDeveloper {
  [key: string]: number[];
}

const games = [
  {
    title: 'The Last of Us Part I',
    description:
      'Set in the post-apocalyptic United States, the game tells the story of survivors Joel and Ellie as they work together to survive their westward journey across what remains of the country to find a possible cure for the modern fungal plague that has nearly decimated the entire human race.',
    release_date: '2022-09-01',
    price: 69.99,
    genres: ['Adventure', 'Shooter'],
    developers: ['Naughty Dog LLC', 'Iron Galaxy Studios'],
  },
  {
    title: 'Life is Strange',
    description:
      'Life is Strange is a five part episodic game that sets out to revolutionize story based choice and consequence games by allowing the player to rewind time and affect the past, present and future.',
    release_date: '2015-01-29',
    price: 15.99,
    genres: ['Adventure', 'RPG'],
    developers: ["DON'T NOD", 'Square Enix'],
  },
  {
    title: "Uncharted 3: Drake's Deception",
    description:
      'A search for the fabled "Atlantis of the Sands" propels fortune hunter Nathan Drake on a trek into the heart of the Arabian Desert. When the terrible secrets of this lost city are unearthed, Drake\'s quest descends into a desperate bid for survival that strains the limits of his endurance and forces him to confront his deepest fears.',
    release_date: '2011-11-01',
    price: 8.99,
    genres: ['Adventure', 'Platform', 'Shooter'],
    developers: ['Naughty Dog', 'Sony Computer Entertainment'],
  },
  {
    title: 'Outlast',
    description:
      "Hell is an experiment you can't survive in Outlast, a first-person survival horror game developed by veterans of some of the biggest game franchises in history. As investigative journalist Miles Upshur, explore Mount Massive Asylum and try to survive long enough to discover its terrible secret... if you dare.",
    release_date: '2013-09-04',
    price: 10.49,
    genres: ['Adventure', 'Indie', 'Survival Horror'],
    developers: ['Red Barrels'],
  },
];

const gamesByGenre: GamesByGenre = {};
const gamesByDeveloper: GamesByDeveloper = {};

async function insertGame(game: Game) {
  const SQL =
    'INSERT INTO games (title, description, release_date, price) VALUES ($1, $2, $3, $4) RETURNING id;';
  const values = [game.title, game.description, game.release_date, game.price];
  const { rows } = await client.query<{ id: number }>(SQL, values);
  const gameId = rows[0].id;
  game.genres.forEach((genre) => {
    if (gamesByGenre[genre]) {
      gamesByGenre[genre].push(gameId);
    } else {
      gamesByGenre[genre] = [gameId];
    }
  });
  game.developers.forEach((dev) => {
    if (gamesByDeveloper[dev]) {
      gamesByDeveloper[dev].push(gameId);
    } else {
      gamesByDeveloper[dev] = [gameId];
    }
  });
}

async function insertGenre(genre: string, gameIds: number[]) {
  const insertGenreSQL = 'INSERT INTO genres (name) VALUES ($1) RETURNING id;';
  const { rows } = await client.query<{ id: number }>(insertGenreSQL, [genre]);
  const genreId = rows[0].id;
  for (const gameId of gameIds) {
    const junctionSQL =
      'INSERT INTO game_genre (game_id, genre_id) VALUES ($1, $2);';
    await client.query(junctionSQL, [gameId, genreId]);
  }
}

async function insertDeveloper(dev: string, gameIds: number[]) {
  const insertDevSQL =
    'INSERT INTO developers (name) VALUES ($1) RETURNING id;';
  const { rows } = await client.query<{ id: number }>(insertDevSQL, [dev]);
  const devId = rows[0].id;
  for (const gameId of gameIds) {
    const junctionSQL =
      'INSERT INTO game_developer (game_id, developer_id) VALUES ($1, $2);';
    await client.query(junctionSQL, [gameId, devId]);
  }
}

const createTablesSQL = `
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(1000) NOT NULL CHECK (LENGTH(name) >= 10),
  release_date DATE,
);

CREATE TABLE IF NOT EXISTS genres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS developers (
  id SERIAL PRIMARY KEY, 
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS game_genre (
  game_id INT, genre_id INT,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE NO ACTION,
  PRIMARY KEY (game_id, genre_id)
);

CREATE TABLE IF NOT EXISTS game_developer (
  game_id INT, developer_id INT,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE NO ACTION,
  PRIMARY KEY (game_id, developer_id)
);
`;

async function main() {
  console.log('seeding...');
  await client.connect();

  try {
    await client.query(createTablesSQL);
    for (const game of games) {
      await insertGame(game);
    }
    for (const [genre, gameIds] of Object.entries(gamesByGenre)) {
      await insertGenre(genre, gameIds);
    }
    for (const [dev, gamesIds] of Object.entries(gamesByDeveloper)) {
      await insertDeveloper(dev, gamesIds);
    }
  } finally {
    await client.end();
  }

  console.log('done');
}

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
