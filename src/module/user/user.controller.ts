import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { Request } from 'express'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role, RoleGuard } from '@/guard/role.guard'
import { UserService } from '@module/user/user.service'
import { User } from '@module/user/user.entity'
import { JwtAuthGuard } from '@/guard/jwt-auth.guard'
import { QueryParams } from '@/interface/pagination.interface'

@ApiTags('用户')
@ApiBearerAuth()
@UseGuards(RoleGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '获取当前登录用户信息' })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Get('current')
  async findOne(@Req() req: Request) {
    return req.user
  }

  @ApiOperation({ summary: '获取用户列表' })
  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  async findAll(@Query() query: QueryParams) {
    return await this.userService.findAll(query)
  }

  @ApiOperation({ summary: '添加用户' })
  @UseGuards(JwtAuthGuard)
  @Role('admin')
  @UseInterceptors(ClassSerializerInterceptor)
  @Post()
  async register(@Body() body: Partial<User>) {
    return await this.userService.createUser(body)
  }

  @ApiOperation({ summary: '更新用户信息' })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Role('admin')
  @Put(':id')
  async update(
    @Req() req: Request,
    @Param() id: string,
    @Body() body: Partial<User>
  ) {
    return await this.userService.update(req.user, id, body)
  }

  @ApiOperation({ summary: '更新用户密码' })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Role('admin')
  @Patch(':id')
  async updatePassword(@Param() id: string, @Body() body: Partial<User>) {
    return await this.userService.updatePassword(id, body)
  }
}