import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { QueryParams } from '@interface/app.interface'
import { CategoryService } from '@module/category/category.service'
import { Category } from '@module/category/category.entity'
import { JwtAuthGuard } from '@guard/jwt-auth.guard'
import { Role, RoleGuard } from '@guard/role.guard'

@ApiTags('分类')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(RoleGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: '创建分类' })
  @Post()
  @UseGuards(JwtAuthGuard)
  @Role('admin')
  create(@Body() body: Partial<Category>) {
    return this.categoryService.create(body)
  }

  @ApiOperation({ summary: '获取分类列表' })
  @Get()
  findAll(@Query() query: QueryParams) {
    return this.categoryService.findAll(query)
  }

  @ApiOperation({ summary: '获取指定分类' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id)
  }

  @ApiOperation({ summary: '更新分类' })
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Role('admin')
  update(@Param('id') id: string, @Body() body: Partial<Category>) {
    return this.categoryService.update(id, body)
  }

  @ApiOperation({ summary: '删除分类' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Role('admin')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id)
  }

  @ApiOperation({ summary: '批量删除分类' })
  @UseGuards(JwtAuthGuard)
  @Role('admin')
  @Delete()
  removeMany(@Body('ids') ids: string[]) {
    return this.categoryService.removeMany(ids)
  }
}
