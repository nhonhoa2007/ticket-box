import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {ROLES_KEY} from '@/common/decorators/role.decorator';
import {IUserPayload} from '@/common/decorators/current-user.decorator';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  //Reflector is Nest js tool help read data which assign with decorator
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    //1. read list of roles require which assigned in route handler or class controller
    const requirdRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),context.getClass()
    ]);
    // if route not have @Roles() => allow anyone login is same
    if(!requirdRoles||requirdRoles.length===0) return true;
    //2. get user's information which be JwtAuthGuard extract before
    const request = context.switchToHttp().getRequest();
    const user = request.user as IUserPayload;

    if(!user||!user.role){
      throw new ForbiddenException('Bạn không có quyền thực hiện thành động này(Admins role')
    }
    const hasRole = requirdRoles.includes(user.role);
    if(!hasRole){
      throw new ForbiddenException('Bạn ko có quyền thực hiện hành động này')
    }
    return true;
  }
}