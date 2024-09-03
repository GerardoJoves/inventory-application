import pool from './db/pool.js';

async function main() {
  const { rows } = await pool.query<{ id: number }>(
    'UPDATE developers SET name = $1 WHERE id = 1000 RETURNING id',
    ['foobar'],
  );
  if (!rows[0]) return console.log('bar');
  console.log(rows[0].id);
}

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
