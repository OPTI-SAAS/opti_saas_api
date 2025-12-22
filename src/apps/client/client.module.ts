import { Module } from '@nestjs/common';

import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
})
export class ClientModule {}
