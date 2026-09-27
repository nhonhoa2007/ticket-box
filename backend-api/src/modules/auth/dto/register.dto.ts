import {IsEmail, IsNotEmpty,IsOptional, IsString, MinLength} from 'class-validator';
export class RegisterDto {
  @IsEmail({},{message:'Email không đúng định dạng'})
  @IsNotEmpty({message:'Email không được để trống'})
  email: string;

  @IsString({message:'Mật khẩu phải là chuỗi ký tự'})
  @IsNotEmpty({message:'Mật khẩu không được để trống'})
  @MinLength(6,{message:'Mật khẩu phải có tối thiểu 6 ký tự'})
  password: string;

  @IsOptional()
  @IsString({message:'Tên phải là chuỗi ký tự'})
  name?: string;
}