import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let jwtAuthGuard;

  const user = {
    id: 'some user id',
  };

  const err = new Error('This is an error');

  beforeEach(() => {
    jwtAuthGuard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(jwtAuthGuard).toBeDefined();
    expect(jwtAuthGuard.handleRequest).toBeDefined();
  });

  it('should return the user if present', () => {
    const result = jwtAuthGuard.handleRequest(null, user);
    expect(result).toStrictEqual(user);
  });

  it('should throw an UnauthorizedException if the user is not present', () => {
    expect(() => jwtAuthGuard.handleRequest(null, null)).toThrowError(UnauthorizedException);
  });

  it('should throw the error if present', () => {
    expect(() => jwtAuthGuard.handleRequest(err, null)).toThrowError(err);
  });

  describe('when the guard is disabled by environment variables', () => {
    const env = { ...process.env };

    it('should bypass auth if the environment variable is set', () => {
      process.env.ENABLE_AUTHENTICATION = 'false';

      jwtAuthGuard.handleRequest(null, null);
      expect(() => jwtAuthGuard.handleRequest(null, null)).not.toThrowError(UnauthorizedException);
      expect(() => jwtAuthGuard.handleRequest(err, null)).not.toThrowError(UnauthorizedException);
    });

    it('should not bypass auth if NODE_ENV is "prod"', () => {
      process.env.ENABLE_AUTHENTICATION = 'false';
      process.env.NODE_ENV = 'prod';

      expect(() => jwtAuthGuard.handleRequest(null, null)).toThrowError(UnauthorizedException);
      expect(() => jwtAuthGuard.handleRequest(err, null)).toThrowError(err);
    });

    afterAll(() => {
      process.env = { ...env };
    });
  });
});
