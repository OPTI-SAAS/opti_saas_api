import { BACKOFFICE_CONNECTION, BoUser } from '@lib/shared';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';

import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private userRepository: Repository<BoUser>;

  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
    private readonly jwtService: JwtService,
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

    // Generate JWT token
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      tokens: { accessToken },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async validateUser(userId: string): Promise<BoUser | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
