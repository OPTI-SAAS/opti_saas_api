import { compare, genSalt, hash } from 'bcrypt';

import { BYCRYPT_HASH_REGEX } from '../constants';

export function isBcryptHash(value: string): boolean {
  return value.length === 60 && BYCRYPT_HASH_REGEX.test(value);
}

export async function bycryptHashPassword(password: string): Promise<string> {
  if (isBcryptHash(password)) return password;
  const salt = await genSalt();
  return await hash(password, salt);
}

export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return await compare(plainPassword, hashedPassword);
}
