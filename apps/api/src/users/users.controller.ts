import { Body, Controller, Get, Patch } from '@nestjs/common';
import { type User } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { UpdateUserDto } from './dto/update-user.dto';
import { type PublicUser, UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User): Promise<PublicUser | null> {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto): Promise<PublicUser> {
    return this.usersService.updateMe(user.id, dto);
  }
}
