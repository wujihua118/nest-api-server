import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards
} from '@nestjs/common'
import { Request } from 'express'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CommentService } from '@module/comment/comment.service'
import { Comment } from '@module/comment/comment.entity'
import { QueryParams } from '@interface/app.interface'
import { Role, RoleGuard } from '@guard/role.guard'
import { JwtAuthGuard } from '@/guard/jwt-auth.guard'

@ApiTags('评论')
@ApiBearerAuth()
@UseGuards(RoleGuard)
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @ApiOperation({ summary: '新增评论' })
  @Post()
  async create(@Req() req: Request, @Body() body: Partial<Comment>) {
    const userAgent = req.headers['user-agent']
    return this.commentService.create(userAgent, body)
  }

  @ApiOperation({ summary: '获取评论列表' })
  @Get()
  async findAll(@Query() query: QueryParams) {
    return this.commentService.findAll(query)
  }

  @ApiOperation({ summary: '获取指定评论' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.commentService.findOne(id)
  }

  @ApiOperation({ summary: '更新评论' })
  @UseGuards(JwtAuthGuard)
  @Role('admin')
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Comment>) {
    console.log(id, body)
    return this.commentService.update(id, body)
  }

  @ApiOperation({ summary: '删除评论' })
  @UseGuards(JwtAuthGuard)
  @Role('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentService.remove(id)
  }

  @ApiOperation({ summary: '批量删除评论' })
  @UseGuards(JwtAuthGuard)
  @Role('admin')
  @Delete()
  removeMany(@Body('ids') ids: string[]) {
    return this.commentService.removeMany(ids)
  }
}