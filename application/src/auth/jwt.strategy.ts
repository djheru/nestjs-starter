import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { authConfigs } from 'config/auth.config';

/**
 * PassportStrategy(Strategy) returns an abstract class
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super(configService.get(authConfigs.AUTH0));
  }

  /*
    By the time the application calls validate, Auth0 has already identified the user
    and it passes data about the user in the payload
  */
  validate(payload: unknown): unknown {
    return payload;
  }
}
