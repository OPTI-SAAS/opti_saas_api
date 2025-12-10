import { Module } from '@nestjs/common';

import { AuthModule } from './features/auth/auth.module';

@Module({
  imports: [AuthModule],
})
export class ClientModule {}
