import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RegisterUserDto } from '../user/user.dto';
import { Roles } from './decorators/roles.decorator';
import { UserRole, UserStatus } from '../user/user.entity';

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

  @Roles(UserRole.SUPERUSER)
  @Patch('grant-superuser/:id')
  grantSuperuser(@Param('id') id: string) {
    return this.auth.grantSuperuser(id);
  }

  @Roles(UserRole.SUPERUSER)
  @Get('users/all')
  listAll() {
    return this.auth.listAll();
  }

  @Roles(UserRole.SUPERUSER)
  @Get('users/search')
  search(@Query('q') query: string) {
    return this.auth.searchByName(query);
  }

  @Roles(UserRole.SUPERUSER)
  @Patch('users/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: UserStatus }) {
    return this.auth.updateStatus(id, body.status);
  }

  @Roles(UserRole.SUPERUSER)
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.auth.deleteUser(id);
  }

  @Roles(UserRole.SUPERUSER)
  @Post('users/reject/delete-all')
  deleteAllRejected(@Body() body: { ids?: string[] }) {
    return this.auth.deleteRejected(body?.ids);
  }
}
