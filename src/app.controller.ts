import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { CreateUserDTO } from './dto/createUser.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDTO } from './dto/loginUser.dto';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';

type LoginResponse = {
  message: string;
};
type UserDetails = {
  id: number;
  email: string;
  name: string;
}
type LogoutResponse = {
  message: string;
}
@Controller('api')
export class AppController {
  constructor(
    private readonly userService: AppService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() userDetails: CreateUserDTO): Promise<UserDetails> {
    const existingUser = await this.userService.findUserByEmail(userDetails.email);
    if(existingUser) throw new BadRequestException("User with this email already exists");
    const hashedPassword = await bcrypt.hash(userDetails.password, 10);
    const user = this.userService.createUser({
      name: userDetails.name,
      email: userDetails.email,
      password: hashedPassword,
    });
    delete (await user).password;
    return user;
  }

  @Post('login')
  async login(
    @Body() loginDetails: LoginUserDTO,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const user = await this.userService.findUserByEmail(loginDetails.email);
    if (!user) throw new UnauthorizedException();
    const isMatch = await bcrypt.compare(loginDetails.password, user.password);
    if (!isMatch) throw new UnauthorizedException();
    const payload = { id: user.id };
    const jwt = await this.jwtService.signAsync(payload);
    response.cookie('jwt', jwt, { httpOnly: true });
    return {
      message: 'Login successful',
    };
  }

  @Get('user')
  async user(@Req() request: Request): Promise<UserDetails>{
    try {
      const cookie = request.cookies.jwt;
      const data = await this.jwtService.verifyAsync(cookie);
      const user = await this.userService.findUserById(data.id);
      const {password, ...result} = user;
      return result;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  @Get("logout")
  async logout(@Res({passthrough: true}) response: Response): Promise<LogoutResponse>{
    response.clearCookie("jwt");
    return {
      message: "Logout successful"
    }
  }
}
