import { EnvSchema } from './env.schema';

export type AppConfig = {
  nodeEnv: EnvSchema['NODE_ENV'];
  port: number;
  database: { url: string };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  providers: {
    bsp: EnvSchema['BSP_PROVIDER'];
    number: EnvSchema['NUMBER_PROVIDER'];
  };
  ycloud: {
    apiKey: string;
    solutionId: string;
    webhookSecret: string;
  };
};

export default function configuration(): AppConfig {
  const env = process.env as Record<string, string | undefined>;

  return {
    nodeEnv: (env.NODE_ENV ?? 'development') as AppConfig['nodeEnv'],
    port: Number(env.PORT ?? 3001),
    database: {
      url: env.DATABASE_URL ?? '',
    },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET ?? '',
      refreshSecret: env.JWT_REFRESH_SECRET ?? '',
      accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },
    providers: {
      bsp: (env.BSP_PROVIDER ?? 'ycloud') as AppConfig['providers']['bsp'],
      number: (env.NUMBER_PROVIDER ??
        'twilio') as AppConfig['providers']['number'],
    },
    ycloud: {
      apiKey: env.YCLOUD_API_KEY ?? '',
      solutionId: env.YCLOUD_SOLUTION_ID ?? '',
      webhookSecret: env.YCLOUD_WEBHOOK_SECRET ?? '',
    },
  };
}

