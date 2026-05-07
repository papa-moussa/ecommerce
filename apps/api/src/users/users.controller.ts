import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { type User } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

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

  @Public()
  @Post('unsubscribe')
  async unsubscribe(@Body('email') email: string) {
    // For simplicity, we just look up the user and set marketingOptIn to false.
    // In production, you would use a signed token here.
    return this.usersService.unsubscribe(email);
  }
}
