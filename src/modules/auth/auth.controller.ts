import {

  Body,

  Controller,

  Get,

  HttpCode,

  HttpStatus,

  Patch,

  Post,

  Req,

  Res,

  UnauthorizedException,

} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {

  ApiBearerAuth,

  ApiOperation,

  ApiTags,

  ApiUnauthorizedResponse,

} from '@nestjs/swagger';

import { ZodResponse } from 'nestjs-zod';

import type { Request, Response } from 'express';

import { AppConfig } from '../../config/configuration';

import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { Public } from '../../common/decorators/public.decorator';

import {

  AUTH_COOKIE,

  clearAuthCookies,

  expiryToMaxAgeSeconds,

  setAuthCookies,

} from './auth-cookie.util';

import { AuthService } from './auth.service';

import {

  AuthSessionResponseDto,

  AuthUserResponseDto,

} from './dto/auth-tokens-response.dto';

import { LoginDto } from './dto/login.dto';

import { LogoutDto } from './dto/logout.dto';

import type { AuthenticatedUser } from './types/authenticated-user.type';

import { UpdateProfileDto } from './dto/update-profile.dto';



@ApiTags('auth')

@Controller('auth')

export class AuthController {

  constructor(

    private readonly authService: AuthService,

    private readonly configService: ConfigService<AppConfig, true>,

  ) {}



  @Public()

  @Post('login')

  @HttpCode(HttpStatus.OK)

  @ApiOperation({

    summary: 'Authenticate with email and password',

    description:

      'Sets HttpOnly `access_token` and `refresh_token` cookies (SameSite=Strict). ' +

      'Response body contains only the user profile — tokens are not returned in JSON.',

  })

  @ZodResponse({ status: 200, type: AuthSessionResponseDto })

  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })

  async login(

    @Body() dto: LoginDto,

    @Req() req: Request,

    @Res({ passthrough: true }) res: Response,

  ) {

    const result = await this.authService.login(dto, req.ip);

    this.applyAuthCookies(res, result);

    return { user: result.user };

  }



  @Public()

  @Post('refresh')

  @HttpCode(HttpStatus.OK)

  @ApiOperation({

    summary: 'Rotate refresh token and issue a new token pair',

    description:

      'Reads `refresh_token` from the HttpOnly cookie, rotates it, and sets new cookies.',

  })

  @ZodResponse({ status: 200, type: AuthSessionResponseDto })

  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })

  async refresh(

    @Req() req: Request,

    @Res({ passthrough: true }) res: Response,

  ) {

    const refreshToken = req.cookies?.[AUTH_COOKIE.refresh] as

      | string

      | undefined;

    if (!refreshToken) {

      throw new UnauthorizedException('Refresh token cookie is missing');

    }



    const result = await this.authService.refresh(refreshToken, req.ip);

    this.applyAuthCookies(res, result);

    return { user: result.user };

  }



  @ApiBearerAuth()

  @Post('logout')

  @HttpCode(HttpStatus.OK)

  @ApiOperation({

    summary: 'Revoke refresh token(s) and clear auth cookies',

    description:

      'Clears `access_token` and `refresh_token` cookies. Optionally revokes a specific refresh token from the body; otherwise revokes all sessions for the user.',

  })

  async logout(

    @CurrentUser() user: AuthenticatedUser,

    @Body() body: LogoutDto,

    @Req() req: Request,

    @Res({ passthrough: true }) res: Response,

  ) {

    const refreshToken =

      body?.refreshToken ??

      (req.cookies?.[AUTH_COOKIE.refresh] as string | undefined);



    await this.authService.logout(user, refreshToken, req.ip);

    this.clearCookies(res);

    return { success: true };

  }



  @ApiBearerAuth()

  @Get('me')

  @ApiOperation({ summary: 'Get current authenticated user profile' })

  @ZodResponse({ status: 200, type: AuthUserResponseDto })

  me(@CurrentUser() user: AuthenticatedUser) {

    return this.authService.getMe(user.id);

  }



  @ApiBearerAuth()

  @Patch('profile')

  @ApiOperation({ summary: 'Update current authenticated user profile' })

  @ZodResponse({ status: 200, type: AuthUserResponseDto })

  updateProfile(

    @CurrentUser() user: AuthenticatedUser,

    @Body() dto: UpdateProfileDto,

  ) {

    return this.authService.updateProfile(user.id, dto);

  }



  private applyAuthCookies(

    res: Response,

    tokens: { accessToken: string; refreshToken: string },

  ): void {

    const jwt = this.configService.get('jwt', { infer: true });

    const secure = this.configService.get('nodeEnv', { infer: true }) === 'production';



    setAuthCookies(res, tokens, {

      accessMaxAgeSeconds: expiryToMaxAgeSeconds(jwt.accessExpiresIn),

      refreshMaxAgeSeconds: expiryToMaxAgeSeconds(jwt.refreshExpiresIn),

      secure,

    });

  }



  private clearCookies(res: Response): void {

    const secure = this.configService.get('nodeEnv', { infer: true }) === 'production';

    clearAuthCookies(res, secure);

  }

}


