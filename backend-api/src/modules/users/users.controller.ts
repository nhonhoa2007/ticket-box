import {Controller, Get, Param, NotFoundException} from '@nestjs/common';
import {UsersService} from './users.service';
@Controller('users')//define root url : /api/v1/users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  //GET /api/v1/users/:id
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    //If not founded, return 404 error
    if (!user) {
      throw new NotFoundException('User does not exist');
    }
    return user;
  }
}