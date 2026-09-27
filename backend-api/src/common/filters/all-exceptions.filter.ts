import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {Request,Response} from 'express';
//Catch() if not have parameters => catch all exceptions in app
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  //create Logger to print red color from Nest js to debug more ez
  private readonly logger= new Logger(AllExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    //default is server error 500
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message : string|string[] = 'Internal Server Error';
    let errorName = 'Internal Server Error';
    //case 1: error have  purpose from code (ex: httpexception :400,401,403,404...)
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const errorResponse = exception.getResponse()
      //analyze error to check error return a simple string or an object with many error notifications (like class-validator)
      if(typeof errorResponse ==='object'&& errorResponse!== null){
        const resObj = errorResponse as Record<string, any>
        message = resObj.message?? exception.message;
        errorName = resObj.error?? exception.name;
      }
      else{
        message = errorResponse as string;
        errorName = exception.name;
      }
    }
    //case 2: surprise crash ( code has bug, disconnect database , TypeError ...)
    else if (exception instanceof Error){
      // print detail of stack trace in terminal for dev know bug from where?
      this.logger.error(
        `Unhandled exception : ${exception.name}`,
        exception.stack
      );
    }
    // encapsule error to JSON and send it to Client (note : don't print stack trace in screen)
    response.status(status).json({
      statusCode : status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorName,
      message,
    })
  }
}