import {Injectable, ConflictException,BadRequestException,UnauthorizedException} from '@nestjs/common';
import * as argon2 from 'argon2';
import {PrismaService} from '@/core/prisma/prisma.service';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import {VerifyCodeDto} from '@/modules/auth/dto/verify-code.dto';
import {ResendCodeDto} from '@/modules/auth/dto/resend-code.dto';
import {JwtService} from '@nestjs/jwt';
import {LoginDto} from '@/modules/auth/dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {

  constructor(private readonly prisma: PrismaService,private readonly jwtService: JwtService) {}

  async register(registerDto: RegisterDto){
    //1.check mail exist?not exist
    const existingUser = await this.prisma.user.findUnique({where:{email:registerDto.email}})
    if(existingUser){
      throw new ConflictException('Email đã được đăng ký trong hệ thống');
    }
    //2.hash pw by algo argon2
    const hashedPassword = await argon2.hash(registerDto.password);
    //3. create otp (6 numbers) with time = 10 mins
    const otp = Math.floor(10000+Math.random()*900000).toString();
    const otpExpired = new Date(Date.now() + 10*60*1000);
    //save new user
    const newUser = await this.prisma.user.create({
      data:{
        email:registerDto.email,
        password:hashedPassword,
        name:registerDto.name,
        isActive:false,// not is active account
        codeId:otp,
        codeExpired:otpExpired,
      },
      select:{
        id:true,
        email:true,
        name:true,
        role:true,
        isActive:true,
        createdAt:true
    }
    })
    //dev:test otp
    console.log(`otp ${otp}`);
    return{
      message:'Đăng kí tài khoản thành công! Vui lòng kiểm tra OTP để kích hoạt',
      data:newUser,
    }
  }
  async verifyCode(verifyCodeDto: VerifyCodeDto){
    const {id,code} = verifyCodeDto;
    //1.check user is existing?
    const user = await this.prisma.user.findUnique({where:{id:id}})
    if(!user){
      throw new BadRequestException('Tài khoản ko tồn tại trên hệ thống')
    }
    //2.check user is active
    if(user.isActive){
      throw new BadRequestException('Tài khoản đã được kích hoạt')
    }
    //3.check otp is correct
    if(user.codeId!==code){
      throw new BadRequestException('OTP ko chính xác')
    }
    //4.check otp is expired
    if(!user.codeExpired|| new Date()>user.codeExpired){
      throw new BadRequestException('OTP đã hết hạn')
    }
    //5. update user's state and delete otp
    await this.prisma.user.update({
      where:{id},
      data:{
        isActive:true,
        codeId:null,
        codeExpired:null,
      }
    })

    return {
      message:'Kích hoạt tài khoản thành công!'
    }
  }
  async resendCode(resendCodeDto:ResendCodeDto){
    const {email} = resendCodeDto;

    //1. check email is exist
    const user = await this.prisma.user.findUnique({where:{email:email}})
    if(!user){
      throw new BadRequestException('Email không tồn tại')
    }
    //2. check user is active or not
    if(user.isActive){
      throw new BadRequestException('Tài khoản đã được kích hoạt')
    }
    //3. create new otp and otp expired
    const newOTP = Math.floor(100000+Math.random()*900000).toString();
    const newOTPExpired = new Date(Date.now() + 10*60*1000);
    //4. update this to db
    await this.prisma.user.update({
      where:{email},
      data:{
        codeId:newOTP,
        codeExpired:newOTPExpired,
      }
    })
    //dev test
    console.log(newOTP);
    return{
      message:'Gửi lại mã kích hoạt thành công'
    }
  }
  async login(loginDto: LoginDto){
    const { email, password } = loginDto;
    //1.find user by email
    const user = await this.prisma.user.findUnique({where:{email:email}})
    if(!user){
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác')
    }
    //2. check password is correct by argon2
    const isPasswordValid = await argon2.verify(user.password, password);
    if(!isPasswordValid){
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }
    //3. check user is active
    if(!user.isActive){
      throw new BadRequestException('Tài khoản chưa được kích hoạt')
    }
    //4. create payload for jwt (just include safe information)
    const payload = {
      sub:user.id,//"sub"(Subject) là chuẩn jwt quy định định danh của user
      email:user.email,
      role:user.role,
    }
    //5. sign to create access token
    const accessToken = await this.jwtService.signAsync(payload);

    return{
      access_token:accessToken,
      user:{
        id:user.id,
        email:user.email,
        name:user.name,
        role:user.role,
      }
    }
  }
}