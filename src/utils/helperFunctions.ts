import * as crypto from 'crypto';
import nodemailer from 'nodemailer';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY ?? '', 'hex'); // 32 bytes for aes-256
const IV_LENGTH = 16; // For AES, this is always 16

export const encryptObject = (obj: any): string => {
  const text = JSON.stringify(obj);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decryptToObject = (encryptedText: string): any => {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};

export const sendEmail = async (userEmail :string, otp: string) => {
  const senderEmail = process.env.EMAIL_USER; 
    try {
        // Define email options
        const mailOptions = {
            from: senderEmail, // Sender address
            to: userEmail, // List of recipients
            subject: 'Your Martech OTP', // Subject line
            html: welcomeEmailTemplate(userEmail, otp), // Plain text body 
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        // console.log('Email sent: ' + info.response);
        return true
    } catch (error) {
        // console.log('Error sending email: ', error);
        return false
    }
};

const welcomeEmailTemplate = (userEmail: string, otp: string) =>  {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Martech Solutions</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f7f9fc;
      color: #333;
      -webkit-font-smoothing: antialiased;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .email-header {
      background-color: #28236A;
      padding: 30px;
      text-align: center;
    }
    
    .email-header img {
      max-width: 180px;
      height: auto;
    }
    
    .email-content {
      padding: 40px 30px;
      line-height: 1.6;
    }
    
    .email-footer {
      background-color: #f7f9fc;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    
    h1 {
      color: #28236A;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    
    p {
      margin-bottom: 20px;
      color: #4b5563;
    }
    
    .otp-container {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    
    .otp-code {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #28236A;
      margin: 10px 0;
    }
    
    .button {
      display: inline-block;
      background-color: #28236A;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 10px;
      text-align: center;
    }
    
    .social-links {
      margin-top: 30px;
    }
    
    .social-links a {
      display: inline-block;
      margin: 0 8px;
    }
    
    .social-icon {
      width: 24px;
      height: 24px;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100%;
        border-radius: 0;
      }
      
      .email-header, .email-content, .email-footer {
        padding: 20px;
      }
      
      h1 {
        font-size: 22px;
      }
      
      .otp-code {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-content">
      <h1>Hi, ${userEmail}</h1>
      
      <div class="otp-container">
        <p>Your login code is:</p>
        <div class="otp-code">${otp}</div>
        <p>This code will expire in 10 minutes.</p>
      </div>
    
      
    </div>
    
  </div>
</body>
</html>
  `
}
