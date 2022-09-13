import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { UserController } from '@module/user/user.controller'
import { UserEntity } from '@module/user/user.entity'
import { UserService } from '@module/user/user.service'
import { AuthModule } from '@module/auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    ConfigModule,
    forwardRef(() => AuthModule)
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController]
})
export class UserModule {}
