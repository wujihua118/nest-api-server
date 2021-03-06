import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '@module/user/user.entity'
import { UserService } from '@module/user/user.service'
import { Token } from '@interface/app.interface'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  generateToken(user: Partial<User>): string {
    const assessToken = this.jwtService.sign(user)
    return assessToken
  }

  async validateUser(payload: User): Promise<User> {
    const user = await this.userService.findOne(String(payload.id))
    return user
  }

  async login(user: Pick<User, 'name' | 'password'>): Promise<Token> {
    const data = await this.userService.login(user)
    const token = this.generateToken({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role
    })
    return { token }
  }
}
