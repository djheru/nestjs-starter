module.exports = {
  name: 'note_taker',
  type: 'postgres',
  schema: 'public',
  host: process.env.PGHOST,
  port: +process.env.PGPORT,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  cli: {
    migrationsDir: 'src/migrations',
  },
  synchronize: false,
};
