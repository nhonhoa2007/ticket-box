import {Controller, Get, Param, NotFoundException,UseGuards} from '@nestjs/common';
import {JwtAuthGuard} from '@/modules/auth/guards/jwt-auth.guard';
import {RolesGuard} from '@/modules/auth/guards/roles.guard';
import {Roles} from '@/common/decorators/role.decorator';
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
  //API : GET /api/v1/users (admin require)
  @Get()
  @UseGuards(JwtAuthGuard,RolesGuard)// authentication->authorization
  @Roles('ADMIN')//admin require
  async getAllUser(){
    return this.usersService.findAll();
  }
}