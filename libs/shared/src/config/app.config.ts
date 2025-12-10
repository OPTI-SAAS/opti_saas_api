import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: process.env.PORT ?? 3000,
}));

type TJwtConfig = {
  bo: Record<'secret' | 'expires_in', string>;
  client: Record<
    'secret' | 'expires_in' | 'refresh_secret' | 'refresh_expires_in',
    string
  >;
};
export const jwtConfig = registerAs<TJwtConfig>('jwt', () => ({
  client: {
    secret: process.env.JWT_AUTH_SECRET!,
    expires_in: process.env.ACCESS_TOKEN_EXPIRES_IN!,
    refresh_secret: process.env.JWT_REFRESH_SECRET!,
    refresh_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN!,
  },
  bo: {
    secret: process.env.BO_JWT_AUTH_SECRET!,
    expires_in: process.env.BO_ACCESS_TOKEN_EXPIRES_IN!,
  },
}));
