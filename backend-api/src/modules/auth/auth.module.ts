import {Module} from '@nestjs/common';
import {AuthService} from './auth.service';
import {AuthController} from './auth.controller';
import {UsersModule} from '@/modules/users/users.module';
import {JwtModule} from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {PassportModule} from '@nestjs/passport';
import {JwtStrategy} from '@/modules/auth/passport/jwt.strategy';

@Module({
  imports: [UsersModule,PassportModule,JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      secret: configService.get<string>('JWT_SECRET'),
      signOptions: {
        expiresIn: (configService.get<string>('JWT_EXPIRES_IN')||'1d') as any,
      }
    })
  })],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}