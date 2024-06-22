import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/User';
import { CreateUserDTO } from './dto/createUser.dto';

@Injectable()
export class AppService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>){}

  async createUser(userDetails: CreateUserDTO): Promise<User>{
    return this.userRepository.save(userDetails);
  }

  async findUserByEmail(email: string): Promise<User>{
    return this.userRepository.findOneBy({email});
  }

  async findUserById(id: number): Promise<User>{
    return this.userRepository.findOneBy({id});
  }
}
