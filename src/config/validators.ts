import { UserType } from "../types/appScopeTypes";

export const validateUserData = ({
  email,
  userType,
}: {
  email: string;
  userType: UserType;
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

  // OTP validation
//   if (!otp || otp.trim() === '') {
//     errors.push('OTP is required.');
//   } else if (!/^\d{4,6}$/.test(otp)) {
//     errors.push('OTP must be a 4 to 6 digit number.');
//   }

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