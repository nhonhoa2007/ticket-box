import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import {TransformInterceptor} from '@/common/interceptors/transform.interceptor';
import {AllExceptionFilter} from '@/common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //allow Next.js call (not blocked error CORS)
  app.enableCors();
  //setup prefix api (ex:"api/v1/..)
  app.setGlobalPrefix('api/v1');
  //active global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  //active standard Response for app
  app.useGlobalInterceptors(new TransformInterceptor());
  //active catch for app
  app.useGlobalFilters(new AllExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
