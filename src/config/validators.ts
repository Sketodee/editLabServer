import { AllowedProviders, UserType } from "../types/appScopeTypes";

export const validateUserData = ({
  email,
  userType,
  provider
}: {
  email: string;
  userType: UserType;
  provider: AllowedProviders;
}): string[] => {
  const errors: string[] = [];

  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email) {
    errors.push('Email is required.');
  } else if (!emailRegex.test(email)) {
    errors.push('Invalid email format.');
  }

  // UserType validation
  const userTypeValues = Object.values(UserType).filter(val => typeof val === 'number');
  if (!userTypeValues.includes(userType)) {
    errors.push('Invalid user type.');
  }

  // Provider validation
  const allowedProviders = Object.values(AllowedProviders);
  if (!provider) {
    errors.push('Provider is required.');
  } else if (!allowedProviders.includes(provider)) {
    errors.push(`Invalid provider. Allowed values: ${allowedProviders.join(', ')}.`);
  }

  return errors;
};

export const validateLoginData = ({
  email,
  otp,
}: {
  email: string;
  otp: string;
}): string[] => {
  const errors: string[] = [];

  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email) {
    errors.push('Email is required.');
  } else if (!emailRegex.test(email)) {
    errors.push('Invalid email format.');
  }


  // OTP validation
  if (!otp || otp.trim() === '') {
    errors.push('OTP is required.');
  } else if (!/^\d{4,6}$/.test(otp)) {
    errors.push('OTP must be a 4 to 6 digit number.');
  }

  return errors;
};