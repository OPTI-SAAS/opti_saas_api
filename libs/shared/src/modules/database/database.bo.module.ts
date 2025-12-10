import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { getBoConnection } from './connection.bo';
import { BACKOFFICE_CONNECTION } from './database.constant';

const boConnectionFactory = {
  provide: BACKOFFICE_CONNECTION,
  useFactory: async (): Promise<DataSource> => {
    return getBoConnection();
  },
};

@Module({
  imports: [],
  providers: [boConnectionFactory],
  exports: [boConnectionFactory, BACKOFFICE_CONNECTION],
})
export class BoDatabaseModule {}
