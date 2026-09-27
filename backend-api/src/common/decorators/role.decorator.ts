import {SetMetadata} from '@nestjs/common';
//key used to store and extract data from roles
export const ROLES_KEY = 'role';

//decorator receive a list of Role which can access
//example: @Roles('ADMIN') or @Roles('ADMIN','USER')
export const Roles=(...roles:string[])=>SetMetadata(ROLES_KEY, roles);
