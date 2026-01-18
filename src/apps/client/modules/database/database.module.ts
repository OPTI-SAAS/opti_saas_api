import { BoDatabaseModule } from '@lib/shared/modules/database/database.bo.module';
import { Module } from '@nestjs/common';

import { DatabaseService } from './database.service';

@Module({
  imports: [BoDatabaseModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
