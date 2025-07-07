import { AffiliateStatus, PaymentMethod } from "../model/Affiliate";
import { AllowedProviders, Platform, PluginType, UserType } from "../types/appScopeTypes";

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
  windowsVersion,
  macOsVersion,
  pluginType
}: {
  name: string;
  description: string;
  iconUrl: string;
  imageUrl: string;
  subDescriptions: Array<{ title: string; description: string }>;
  windowsFile: string;
  macOsFile: string;
  windowsVersion: string;
  macOsVersion: string;
  pluginType: PluginType;
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

  if (!windowsVersion || windowsVersion.trim() === '') {
    errors.push('Windows version is required.');
  }

  // macOS file validation
  if (!macOsFile || macOsFile.trim() === '') {
    errors.push('macOS file is required.');
  }

  if (!macOsVersion || macOsVersion.trim() === '') {
    errors.push('macOS version is required.');
  }

  const pluginTypeValues = Object.values(PluginType); // ['premierepro', 'aftereffects']

  if (!pluginTypeValues.includes(pluginType)) {
    errors.push('Invalid plugin type.');
  }

  return errors;
};


export const validatePluginWithVersionsData = ({
  name,
  description,
  iconUrl,
  imageUrl,
  subDescriptions,
  windowsVersion,
  macOsVersion,
  currentWindowsVersion,
  currentMacOsVersion,
  pluginType,
  versions
}: any): string[] => {
  const errors: string[] = [];

  // ===== PLUGIN FIELDS VALIDATION =====
  
  // Name validation
  if (!name || name.trim() === '') {
    errors.push('Name is required.');
  } else if (name.length > 255) {
    errors.push('Name must be less than 255 characters.');
  }

  // Description validation
  if (!description || description.trim() === '') {
    errors.push('Description is required.');
  } else if (description.length > 5000) {
    errors.push('Description must be less than 5000 characters.');
  }

  // Image URL validation
  const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i;
  if (!imageUrl || imageUrl.trim() === '') {
    errors.push('Image URL is required.');
  } else if (!urlRegex.test(imageUrl)) {
    errors.push('Invalid image URL format.');
  }

  if (!iconUrl || iconUrl.trim() === '') {
    errors.push('Icon URL is required.');
  } else if (!urlRegex.test(iconUrl)) {
    errors.push('Invalid icon URL format.');
  }

  // subDescriptions validation
  if (!Array.isArray(subDescriptions) || subDescriptions.length === 0) {
    errors.push('At least one subDescription is required.');
  } else {
    subDescriptions.forEach((sub, index) => {
      if (!sub.title || sub.title.trim() === '') {
        errors.push(`SubDescription #${index + 1} title is required.`);
      } else if (sub.title.length > 100) {
        errors.push(`SubDescription #${index + 1} title must be less than 100 characters.`);
      }
      
      if (!sub.description || sub.description.trim() === '') {
        errors.push(`SubDescription #${index + 1} description is required.`);
      } else if (sub.description.length > 500) {
        errors.push(`SubDescription #${index + 1} description must be less than 500 characters.`);
      }
    });
  }

  // Current versions validation
  if (!currentWindowsVersion || currentWindowsVersion.trim() === '') {
    errors.push('Current Windows version is required.');
  } else if (!isValidVersionFormat(currentWindowsVersion)) {
    errors.push('Invalid current Windows version format. Use semantic versioning (e.g., 1.0.0).');
  }

  if (!currentMacOsVersion || currentMacOsVersion.trim() === '') {
    errors.push('Current macOS version is required.');
  } else if (!isValidVersionFormat(currentMacOsVersion)) {
    errors.push('Invalid current macOS version format. Use semantic versioning (e.g., 1.0.0).');
  }

  // Plugin type validation
  const pluginTypeValues = Object.values(PluginType);
  if (!pluginTypeValues.includes(pluginType)) {
    errors.push('Invalid plugin type.');
  }

  // ===== VERSIONS ARRAY VALIDATION =====
  
  // Check if versions array exists and is not empty
  if (!Array.isArray(versions)) {
    errors.push('Versions must be an array.');
    return errors; // Return early since we can't validate individual versions
  }

  if (versions.length === 0) {
    errors.push('At least one version is required.');
    return errors;
  }

  if (versions.length > 50) {
    errors.push('Maximum 50 versions allowed per plugin.');
  }

  // Validate each version
  const downloadUrlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
  versions.forEach((version, index) => {
    const versionPrefix = `Version #${index + 1}`;

    // Platform validation
    if (!version.platform) {
      errors.push(`${versionPrefix}: Platform is required.`);
    } else if (!Object.values(Platform).includes(version.platform)) {
      errors.push(`${versionPrefix}: Invalid platform. Must be either 'windows' or 'mac'.`);
    }

    // URL validation
    if (!version.url || version.url.trim() === '') {
      errors.push(`${versionPrefix}: Download URL is required.`);
    } else if (!downloadUrlRegex.test(version.url)) {
      errors.push(`${versionPrefix}: Invalid URL format.`);
    } else if (version.url.length > 2048) {
      errors.push(`${versionPrefix}: URL must be less than 2048 characters.`);
    }

    // Size validation
    if (version.size === undefined || version.size === null) {
      errors.push(`${versionPrefix}: File size is required.`);
    } else if (!Number.isInteger(version.size) || version.size <= 0) {
      errors.push(`${versionPrefix}: File size must be a positive integer (bytes).`);
    } else if (version.size > 10 * 1024 * 1024 * 1024) { // 10GB limit
      errors.push(`${versionPrefix}: File size cannot exceed 10GB.`);
    }

    // Version format validation
    if (!version.version || version.version.trim() === '') {
      errors.push(`${versionPrefix}: Version number is required.`);
    } else if (!isValidVersionFormat(version.version)) {
      errors.push(`${versionPrefix}: Invalid version format. Use semantic versioning (e.g., 1.0.0).`);
    }

    // Release date validation
    if (!version.releaseDate || version.releaseDate.trim() === '') {
      errors.push(`${versionPrefix}: Release date is required.`);
    } else {
      const releaseDate = new Date(version.releaseDate);
      if (isNaN(releaseDate.getTime())) {
        errors.push(`${versionPrefix}: Invalid release date format. Use ISO 8601 format.`);
      } else {
        const now = new Date();
        const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        
        if (releaseDate > oneYearFromNow) {
          errors.push(`${versionPrefix}: Release date cannot be more than one year in the future.`);
        }
      }
    }
  });

  // Check for duplicate platform-version combinations
  const platformVersionCombos = new Set();
  versions.forEach((version, index) => {
    if (version.platform && version.version) {
      const combo = `${version.platform}-${version.version}`;
      if (platformVersionCombos.has(combo)) {
        errors.push(`Duplicate version ${version.version} for platform ${version.platform} at index ${index + 1}.`);
      }
      platformVersionCombos.add(combo);
    }
  });

  // Ensure at least one version for each platform (Windows and Mac)
  const platforms = versions.map(v => v.platform).filter(Boolean);
  if (!platforms.includes(Platform.WINDOWS)) {
    errors.push('At least one Windows version is required.');
  }
  if (!platforms.includes(Platform.MAC)) {
    errors.push('At least one Mac version is required.');
  }

  return errors;
};

const isValidVersionFormat = (version: string): boolean => {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
};

export const validateAffiliateApplyData = ({
  paymentMethod,
  paymentDetails,
}: {
  paymentMethod: PaymentMethod;
  paymentDetails: string;
}): string[] => {
  const errors: string[] = [];

  // PaymentMethod validation
  const validMethods = Object.values(PaymentMethod);
  if (!paymentMethod) {
    errors.push('Payment method is required.');
  } else if (!validMethods.includes(paymentMethod)) {
    errors.push(`Invalid payment method. Allowed values: ${validMethods.join(', ')}.`);
  }

  // PaymentDetails validation
  if (!paymentDetails || typeof paymentDetails !== 'string' || paymentDetails.trim() === '') {
    errors.push('Payment details must be a non-empty string.');
  }

  return errors;
};

export const validateAffiliateUpdateData = ({
  status,
  commissionRate,
}: {
  status: AffiliateStatus;
  commissionRate: number;
}): string[] => {
  const errors: string[] = [];

  // Status validation
  const allowedStatuses = Object.values(AffiliateStatus);
  if (!status) {
    errors.push('Status is required.');
  } else if (!allowedStatuses.includes(status)) {
    errors.push(`Invalid status. Allowed values: ${allowedStatuses.join(', ')}.`);
  }

  // Commission rate validation (only if provided)
  if (commissionRate !== undefined) {
    if (typeof commissionRate !== 'number' || isNaN(commissionRate)) {
      errors.push('Commission rate must be a valid number.');
    } else if (commissionRate < 0 || commissionRate > 100) {
      errors.push('Commission rate must be between 0 and 100.');
    }
  }


  return errors;
};