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

export const validatePluginData = ({
  name,
  description,
  iconUrl,
  imageUrl,
  subDescriptions,
  windowsFile,
  macOsFile,
}: {
  name: string;
  description: string;
  iconUrl: string; 
  imageUrl: string;
  subDescriptions: Array<{ title: string; description: string }>;
  windowsFile: string;
  macOsFile: string;
}): string[] => {
  const errors: string[] = [];

  // Name validation
  if (!name || name.trim() === '') {
    errors.push('Name is required.');
  }

  // Description validation
  if (!description || description.trim() === '') {
    errors.push('Description is required.');
  }

  // Image URL validation
  const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i;
  if (!imageUrl || imageUrl.trim() === '') {
    errors.push('Image URL is required.');
  } else if (!urlRegex.test(imageUrl)) {
    errors.push('Invalid image URL format.');
  }

    if (!iconUrl || iconUrl.trim() === '') {
    errors.push('Image URL is required.');
  } else if (!urlRegex.test(iconUrl)) {
    errors.push('Invalid image URL format.');
  }

  // subDescriptions validation
  if (!Array.isArray(subDescriptions) || subDescriptions.length === 0) {
    errors.push('At least one subDescription is required.');
  } else {
    subDescriptions.forEach((sub, index) => {
      if (!sub.title || sub.title.trim() === '') {
        errors.push(`SubDescription #${index + 1} title is required.`);
      }
      if (!sub.description || sub.description.trim() === '') {
        errors.push(`SubDescription #${index + 1} description is required.`);
      }
    });
  }

  // Windows file validation
  if (!windowsFile || windowsFile.trim() === '') {
    errors.push('Windows file is required.');
  }

  // macOS file validation
  if (!macOsFile || macOsFile.trim() === '') {
    errors.push('macOS file is required.');
  }

  return errors;
};
