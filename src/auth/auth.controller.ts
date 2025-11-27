import { Body, Controller, Post } from '@nestjs/common';
import { AuthCredentialsDto } from 'src/tasks/dto/auth-credentials.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() authCredDto: AuthCredentialsDto): Promise<void> {
    return this.authService.signUp(authCredDto);
  }

  @Post('/signin')
  signIn(
    @Body() authCredDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredDto);
  }
}
