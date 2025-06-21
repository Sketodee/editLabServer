export enum UserType {
    ADMIN = 0,
    USER = 1,
  }

  export enum PluginType {
    PREMIEREPRO = 'premierepro',
    AFTEREFFECTS = 'aftereffects',
  }

  // Platform enum
export enum Platform {
  WINDOWS = 'windows',
  MAC = 'mac'
}

  export type ApiResponse = {
  success: boolean;
  message: string;
  error?: string | null;
  data?: any;
};

export enum AllowedProviders {
  GOOGLE = 'google',
  APPLE = 'apple',
  CUSTOM = 'custom', // For custom providers
}
