import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
//define common for all api response
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T,ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ):Observable<ApiResponse<T>>{
    //get Response object from http context
    const response=context.switchToHttp().getResponse();
    //use RxJS 'map' to change data before send it to client
    return next.handle().pipe(
      map((data)=>{
        //if at Service, return {message:'....',data'....'}
        if(
          data && typeof data==='object' && 'data' in data
          && 'message' in data
        ){
          return {
            statusCode:response.statusCode,
            message:data.message,
            data: data.data
          }
        }
        //in common, default message is 'Success'
        return {
          statusCode:response.statusCode,
          message:'Success',
          data:data??null
        }
      })
    )
  }
}
