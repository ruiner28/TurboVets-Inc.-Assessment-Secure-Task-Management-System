import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../data';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || '4kLpGL1ZDd/OW/E5wIVI1Q==',
    });
  }

  async validate(payload: JwtPayload) {
    return { userId: payload.userId, organizationId: payload.organizationId, role: payload.role };
  }
}
