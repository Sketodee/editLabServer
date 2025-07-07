import crypto from 'crypto'
import AffiliateModel from '../model/Affiliate';

//generate referral code

export const generateReferralCode = (userId: number, length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referralCode = '';

    const userIdStr = userId.toString();
    let hash = crypto.createHash('md5').update(userIdStr).digest('hex');

    for (let i = 0; i < length; i++) {
        const index =  parseInt(hash[i % hash.length], 16) % chars.length;
        referralCode += chars[index];
    }
    return referralCode
}

export const generateUniqueReferralCode = async (userId: number): Promise<string> => {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    code = generateReferralCode(userId + attempts);
    const existing = await AffiliateModel.findOne({ 
      where: { referralCode: code } 
    });
    
    if (!existing) {
      return code;
    }
    
    attempts++;
  } while (attempts < maxAttempts);
  
  throw new Error('Unable to generate unique referral code');
};

export const validateReferralCode = (code: string): boolean => {
  const referralCodeRegex = /^[A-Z0-9]{6,20}$/;
  return referralCodeRegex.test(code);
};

//this functionality is able to extract referral code from different sources 
export const extractReferralCode = (req: any): string | null => {
  const sources = [
    req.query?.ref,
    req.query?.referral,
    req.body?.referralCode,
    req.cookies?.referralCode,
    req.headers?.['x-referral-code'],
  ];

  for (const source of sources) {
    if (source && typeof source === 'string' && validateReferralCode(source.toUpperCase())) {
      return source.toUpperCase();
    }
  }

  return null;
};
