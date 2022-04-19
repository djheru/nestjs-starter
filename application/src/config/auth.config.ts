import { registerAs } from '@nestjs/config';
import { ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

const {
  AUTH0_AUDIENCE: auth0Audience,
  AUTH0_ISSUER_URL: auth0Issuer,
} = process.env;

export const authConfigs = {
  AUTH0: 'auth0',
};

const config = (): Record<string, any> => ({
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

export default {
  auth0: registerAs(authConfigs.AUTH0, config),
};
