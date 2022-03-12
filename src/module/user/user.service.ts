import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '@module/user/user.entity'
import { ConfigService } from '@nestjs/config'
import { PaginateResult, QueryParams } from '@/interface/pagination.interface'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService
  ) {
    const name = this.configService.get('ADMIN_USER', 'admin')
    const password = this.configService.get('ADMIN_PASSWORD', 'admin')
    this.createUser({ name, password, role: 'admin' })
      .then(() => {
        console.log(
          `管理员账户创建成功，用户名：${name}，密码：${password}，请及时登录系统修改默认密码`
        )
      })
      .catch(() => {
        console.log(
          `管理员账户已创建，用户名：${name}，密码：${password}，请及时登录系统修改默认密码`
        )
      })
  }

  async createUser(user: Partial<User>): Promise<User> {
    const exist = await this.userRepository.findOne({
      where: { name: user.name },
    })
    if (exist) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST)
    }

    const model = this.userRepository.create(user)
    await this.userRepository.save(model)
    return model
  }

  async findAll(query: QueryParams): Promise<PaginateResult<User>> {
    const [page, pageSize] = [query.page || 1, query.pageSize || 12].map((v) =>
      Number(v)
    )

    const [data, total] = await this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'ASC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getManyAndCount()

    const totalPage = Math.ceil(total / pageSize) || 1

    return { data, total, page, pageSize, totalPage }
  }

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne(id)
  }

  async login(user: Partial<User>): Promise<User> {
    const { name, password } = user
    const exist = await this.userRepository.findOne({ where: { name } })

    if (!exist || !(await User.comparePassword(password, exist.password))) {
      throw new HttpException('用户名或密码错误', HttpStatus.BAD_REQUEST)
    }

    return exist
  }

  async update(
    admin: Partial<User>,
    id: string,
    body: Partial<User>
  ): Promise<User> {
    if (!admin || admin.role !== 'admin') {
      throw new HttpException('非管理员暂无权限操作', HttpStatus.FORBIDDEN)
    }

    const exist = await this.userRepository.findOne(id)
    if (!exist) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
    }
    delete body.password

    if (body.name && body.name !== exist.name) {
      const existUser = await this.userRepository.findOne({
        where: { name: body.name },
      })

      if (existUser) {
        throw new HttpException('用户名已被注册', HttpStatus.BAD_REQUEST)
      }
    }

    const model = this.userRepository.merge(exist, body)
    return this.userRepository.save(model)
  }

  async updatePassword(id: string, body: Partial<User>): Promise<User> {
    const exist = await this.userRepository.findOne(id)
    const { password, newPassword, relNewPassword } = body

    if (!exist) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
    }

    if (!(await User.comparePassword(password, exist.password))) {
      throw new HttpException('原密码错误', HttpStatus.BAD_REQUEST)
    }

    if (newPassword !== relNewPassword) {
      throw new HttpException('两次密码不一致', HttpStatus.BAD_REQUEST)
    }

    const hash = User.encryptPassword(relNewPassword)

    const newUser = this.userRepository.merge(exist, { password: hash })
    return await this.userRepository.save(newUser)
  }
}
