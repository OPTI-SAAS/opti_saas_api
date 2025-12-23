import { BACKOFFICE_CONNECTION, BoUser } from '@lib/shared';
import { bycryptHashPassword, comparePassword } from '@lib/shared/helpers';
import { JwtPayload } from '@lib/shared/types';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { DataSource, Repository } from 'typeorm';

import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private userRepository: Repository<BoUser>;

  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.userRepository = this.boConnection.getRepository(BoUser);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT tokens
    const payload = { sub: user.id, email: user.email, isOwner: user.isOwner };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.generateRefreshToken(payload),
    ]);

    // Store hashed refresh token in database
    user.refreshToken = await bycryptHashPassword(refreshToken);
    await this.userRepository.save(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('jwt.client.refresh_secret')!,
        },
      );

      // Find user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Validate refresh token against stored hash
      const isRefreshTokenValid = await comparePassword(
        refreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const newPayload = {
        sub: user.id,
        email: user.email,
        isOwner: user.isOwner,
      };
      const [accessToken, newRefreshToken] = await Promise.all([
        this.jwtService.signAsync(newPayload),
        this.generateRefreshToken(newPayload),
      ]);

      // Update stored refresh token
      user.refreshToken = await bycryptHashPassword(newRefreshToken);
      await this.userRepository.save(user);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      user.refreshToken = undefined;
      await this.userRepository.save(user);
    }

    return { message: 'Logged out successfully' };
  }

  private async generateRefreshToken(payload: {
    sub: string;
    email: string;
    isOwner: boolean;
  }): Promise<string> {
    const refreshSecret = this.configService.get<string>(
      'jwt.client.refresh_secret',
    )!;
    const expiresIn = this.configService.get<StringValue>(
      'jwt.client.refresh_expires_in',
    )!;

    return this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: expiresIn,
    });
  }

  async validateUser(userId: string): Promise<BoUser | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tenants = user.tenantMemberships.map((membership) => ({
      id: membership.tenant.id,
      name: membership.tenant.name,
      dbSchema: membership.tenant.dbSchema,
    }));

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isOwner: user.isOwner,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tenants,
    };
  }
}
