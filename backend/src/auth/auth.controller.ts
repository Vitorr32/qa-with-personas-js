import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RegisterUserDto } from '../user/user.dto';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user);
  }

  @Roles(UserRole.SUPERUSER)
  @Get('pending')
  pending() {
    return this.auth.listPending();
  }

  @Roles(UserRole.SUPERUSER)
  @Patch('approve/:id')
  approve(@Param('id') id: string) {
    return this.auth.approve(id);
  }

  @Roles(UserRole.SUPERUSER)
  @Patch('reject/:id')
  reject(@Param('id') id: string) {
    return this.auth.reject(id);
  }
}
