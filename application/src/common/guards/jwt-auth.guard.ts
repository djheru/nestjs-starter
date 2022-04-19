import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err) {
      throw err;
    }

    const { ENABLE_AUTHENTICATION, NODE_ENV } = process.env;
    const disableAuthentication = ENABLE_AUTHENTICATION === 'false' && NODE_ENV !== 'prod';

    if (disableAuthentication) {
      return user || {};
    }

    if (user) {
      return user;
    }
    throw new UnauthorizedException();
  }
}
