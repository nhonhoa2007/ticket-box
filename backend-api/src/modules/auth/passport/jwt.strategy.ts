import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt,Strategy} from 'passport-jwt';
import {ConfigService} from '@nestjs/config';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
  constructor(configService: ConfigService){
    super({
      //get token from header Authorization : Bearer <Token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      //not skip expired(if expired=>block)
      ignoreExpiration:false,
      //get secret key from .env
      secretOrKey: configService.get<string>('JWT_SECRET')||'secret'
    })
  }
  //validate's func will auto run when token is decode success
  async validate(payload:{sub: string;email: string, role: string}){
    //return data in here , Nest js will use this data and assign this to 'req.user'
    return{
      id:payload.sub,
      email:payload.email,
      role:payload.role,
    }
  }
}