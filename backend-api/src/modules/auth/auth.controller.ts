import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';
import {VerifyCodeDto} from '@/modules/auth/dto/verify-code.dto';
import {AuthService} from '@/modules/auth/auth.service';
import {RegisterDto} from '@/modules/auth/dto/register.dto';
import {ResendCodeDto} from '@/modules/auth/dto/resend-code.dto';
import {LoginDto} from '@/modules/auth/dto/login.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  IUserPayload,
} from '@/common/decorators/current-user.decorator';

@Controller('auth') //original url : /api/v1/auth
export class AuthController {
  constructor(private readonly authService: AuthService){}
  
  //API register : POST(/api/v1/auth/register)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)// return HTTP 201 Created (RESTful)
  async register(@Body() registerDto: RegisterDto){
    return this.authService.register(registerDto);
  }

  //API verify-code : POST (/api/v1/auth/verify-code)
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto){
    return this.authService.verifyCode(verifyCodeDto);
  }

  //API resend-code : POST (/api/v1/auth/resend-code)
  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  async resendCode(@Body() resendCodeDto: ResendCodeDto){
    return this.authService.resendCode(resendCodeDto);
  }

  //API login : POST /api/v1/auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto){
    return this.authService.login(loginDto);
  }
  //API : GET /api/v1/auth/profile (API is secure)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user:IUserPayload){
    return user
  }
}