import {createParamDecorator,ExecutionContext} from '@nestjs/common';

export interface IUserPayload {
  id: string;
  email: string;
  role: string;
}
export const CurrentUser= createParamDecorator(
  (data: keyof IUserPayload | undefined, ctx:ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IUserPayload;

    //if passing parameters @CurrentUser('email') =>just get email, else get all(object)
    return data?user?.[data]:user;
  }

)