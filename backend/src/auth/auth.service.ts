import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../user/user.entity';
import { LoginDto, RegisterUserDto } from '../user/user.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterUserDto) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const count = await this.users.count();

    const user = this.users.create({
      email: dto.email.toLowerCase(),
      name: dto.name.trim(),
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: count === 0 ? UserRole.SUPERUSER : UserRole.USER,
      status: count === 0 ? UserStatus.APPROVED : UserStatus.PENDING,
    });
    await this.users.save(user);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      message:
        count === 0
          ? 'Superuser created. You can now log in.'
          : 'Registration submitted. A superuser must approve your account before you can log in.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (user.status !== UserStatus.APPROVED) {
      throw new UnauthorizedException('Account not approved');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    // Use JwtModule defaults (secret and expiresIn configured in AuthModule)
    const accessToken = await this.jwt.signAsync(payload);

    return { accessToken, user: payload };
  }

  async me(userPayload: any) {
    const user = await this.users.findOne({ where: { id: userPayload.sub } });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async listPending() {
    return this.users.find({ where: { status: UserStatus.PENDING } });
  }

  async approve(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    user.status = UserStatus.APPROVED;
    await this.users.save(user);
    return { id: user.id, status: user.status };
  }

  async reject(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    user.status = UserStatus.REJECTED;
    await this.users.save(user);
    return { id: user.id, status: user.status };
  }

  async grantSuperuser(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    user.role = UserRole.SUPERUSER;
    await this.users.save(user);
    return { id: user.id, role: user.role };
  }
}
