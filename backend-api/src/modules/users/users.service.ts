import { Injectable } from '@nestjs/common';
import {PrismaService} from '@/core/prisma/prisma.service';

@Injectable()
export class UsersService {
  //build PrismaService through Dependency Injection(DI)
  constructor(private readonly prisma: PrismaService) {}

  //1. search user by email(use in local for Authentication later)
  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }
  //2. search user by ID and return to Client
  async findById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id } ,
      select:{
        id:true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        //note : dont select password, codeID, codeExpired
      }
    });
  }
  //get all users (admin require)
  async findAll(){
    return await this.prisma.user.findMany({
      select:{
        id:true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy:{
        createdAt:'desc'
      }
    });
  }
}