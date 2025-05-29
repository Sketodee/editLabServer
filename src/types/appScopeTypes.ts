export enum UserType {
    ADMIN = 0,
    USER = 1,
  }

  export type ApiResponse = {
  success: boolean;
  message: string;
  error?: string | null;
  data?: any;
};
