import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import {AuthService} from '@/modules/auth/auth.service';
import {RegisterDto} from '@/modules/auth/dto/register.dto';
@Controller('auth') //original url : /api/v1/auth
export class AuthController {
  constructor(private readonly authService: AuthService){}
  
  //API register : POST /api/v1/auth/register
  @Post('register')
  @HttpCode(HttpStatus.CREATED)// return HTTP 201 Created (RESTful)
  async register(@Body() registerDto: RegisterDto){
    return this.authService.register(registerDto);
  }
}