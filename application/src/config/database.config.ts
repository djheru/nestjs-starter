import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databases = {
  NOTE_TAKER: 'note_taker',
};

const configFactory = (): TypeOrmModuleOptions => {
  const {
    PGDATABASE: database,
    PGHOST: host,
    PGPASSWORD: password,
    PGPORT: dbPort,
    PGUSER: username,
  } = process.env;

  const autoLoadEntities = true;
  const logging = false;
  const port = +dbPort;
  const schema = 'public';
  const synchronize = false;
  const type = 'postgres';

  return {
    autoLoadEntities,
    database,
    host,
    logging,
    password,
    port,
    schema,
    synchronize,
    type,
    username,
  };
};

export default {
  recipeBlog: registerAs(databases.NOTE_TAKER, configFactory),
};
