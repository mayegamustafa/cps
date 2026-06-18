import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Role } from '@cps/database';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    });
  }

  validate(payload: JwtPayload) {
    // Returned value is attached to request.user
    return { id: payload.sub, email: payload.email, roles: payload.roles };
  }
}
