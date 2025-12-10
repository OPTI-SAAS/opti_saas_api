import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.client.secret'),
        signOptions: {
          expiresIn: configService.get<number>('jwt.client.expires_in'),
        },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class SharedJwtModule {}
