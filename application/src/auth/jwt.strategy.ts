import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';

dotenv.config();

const { AUTH0_AUDIENCE: auth0Audience, AUTH0_ISSUER_URL: auth0Issuer } =
  process.env;

/**
 * PassportStrategy(Strategy) returns an abstract class
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Options for the passport-jwt strategy
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${auth0Issuer}.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: auth0Audience,
      issuer: auth0Issuer,
      algorithms: ['RS256'],
    });
  }

  /*
    By the time the application calls validate, Auth0 has already identified the user
    and it passes data about the user in the payload
  */
  validate(payload: unknown): unknown {
    return payload;
  }
}
