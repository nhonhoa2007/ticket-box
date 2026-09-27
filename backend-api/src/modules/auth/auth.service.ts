import {Injectable, ConflictException} from '@nestjs/common';
import * as argon2 from 'argon2';
import {PrismaService} from '@/core/prisma/prisma.service';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
@Injectable()
export class AuthService {

  constructor(private readonly prisma: PrismaService) {}

  async register(registerDto: RegisterDto){
    //1.check mail exist?not exist
    const existingUser = await this.prisma.user.findUnique({where:{email:registerDto.email}})
    if(existingUser){
      throw new ConflictException('Email đã được đăng ký trong hệ thống');
    }
    //2.hash pw by algo argon2
    const hashedPassword = await argon2.hash(registerDto.password);
    //3. create otp (6 numbers) with time = 10 mins
    const otp = Math.floor(10000+Math.random()+900000).toString();
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
}