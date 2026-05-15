import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { type User } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { type AppConfig } from '../../config/configuration';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  // SEC-002: temp tokens carry twofa:true and are signed with JWT_TEMP_SECRET.
  // They will fail HMAC verification here because JwtStrategy uses JWT_ACCESS_SECRET.
  // This field is declared only as a type guard — presence means the token is
  // not a valid access token even if somehow a signature collision occurred.
  twofa?: never;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly usersService: UsersService,
  ) {
    // SEC-022: verify with RSA public key — the private key never crosses this boundary.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_PUBLIC_KEY', { infer: true }),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // SEC-002: Defense-in-depth guard. Temp tokens signed with JWT_TEMP_SECRET
    // will already fail HMAC verification before reaching this method. This
    // explicit check is a second safety net in case the two secrets happen to
    // be identical (misconfiguration) or the extraction path changes.
    if ((payload as { twofa?: unknown }).twofa === true) {
      throw new UnauthorizedException('Temp tokens are not valid access tokens.');
    }
    const user = await this.usersService.findByEmail(payload.email);
    if (!user) throw new UnauthorizedException();
    if (user.blocked) throw new UnauthorizedException('Compte bloqué.');
    return user;
  }
}
