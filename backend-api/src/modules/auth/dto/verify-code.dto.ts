import {IsNotEmpty,IsString,Length} from 'class-validator';
export class VerifyCodeDto {
  @IsNotEmpty({message:'ID người dùng không được để trống'})
  @IsString({message:'ID người dùng phải là chuỗi kí tự'})
  id: string;

  @IsNotEmpty({message:'Mã kích hoạt không được để trống'})
  @IsString({message:'Mã kích hoạt phải là chuỗi kí tự'})
  @Length(6,6,{message:'Mã kích hoạt phải có đúng 6 ký tự'})
  code: string;
}