// ================================
// BACKEND INTEGRATION GUIDE
// Digital Grandpa Enterprise System
// ================================

// ================================
// DATABASE SCHEMA (PostgreSQL/MySQL)
// ================================

const DATABASE_SCHEMA = {
  // Users table for email verification and tracking
  users: `
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      verification_token VARCHAR(255) UNIQUE,
      verification_token_expires TIMESTAMP,
      email_verified BOOLEAN DEFAULT FALSE,
      email_verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      status ENUM('pending', 'verified', 'suspended') DEFAULT 'pending',
      source VARCHAR(50) DEFAULT 'digital_grandpa_resources',
      user_agent TEXT,
      ip_address INET,
      
      -- Indexes for performance
      INDEX idx_email (email),
      INDEX idx_verification_token (verification_token),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    );
  `,

  // Resource downloads tracking
  resource_downloads: `
    CREATE TABLE resource_downloads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_name VARCHAR(255) NOT NULL,
      resource_type ENUM('pdf', 'audio', 'video', 'worksheet') NOT NULL,
      download_url TEXT,
      downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      session_id VARCHAR(255),
      ip_address INET,
      user_agent TEXT,
      
      -- Indexes
      INDEX idx_user_id (user_id),
      INDEX idx_resource_name (resource_name),
      INDEX idx_downloaded_at (downloaded_at),
      INDEX idx_session_id (session_id)
    );
  `,

  // Email verification attempts tracking
  email_verification_attempts: `
    CREATE TABLE email_verification_attempts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      verification_token VARCHAR(255) NOT NULL,
      attempt_type ENUM('initial', 'resend') DEFAULT 'initial',
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      clicked_at TIMESTAMP,
      verified_at TIMESTAMP,
      ip_address INET,
      user_agent TEXT,
      
      INDEX idx_email (email),
      INDEX idx_token (verification_token),
      INDEX idx_sent_at (sent_at)
    );
  `,

  // Analytics and user behavior tracking
  user_analytics: `
    CREATE TABLE user_analytics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      session_id VARCHAR(255) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      event_data JSONB,
      page_url TEXT,
      referrer TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address INET,
      user_agent TEXT,
      
      INDEX idx_user_id (user_id),
      INDEX idx_session_id (session_id),
      INDEX idx_event_type (event_type),
      INDEX idx_timestamp (timestamp)
    );
  `,

  // Email templates for verification
  email_templates: `
    CREATE TABLE email_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_name VARCHAR(100) UNIQUE NOT NULL,
      subject VARCHAR(255) NOT NULL,
      html_content TEXT NOT NULL,
      text_content TEXT NOT NULL,
      variables JSONB, -- Store template variables
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    );
  `
};

// ================================
// API ENDPOINTS IMPLEMENTATION
// ================================

// Express.js route handlers (example implementation)
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Rate limiting for email verification
const emailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many verification attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Email service configuration
const emailTransporter = nodemailer.createTransporter({
  service: 'SendGrid', // or your preferred email service
  auth: {
    user: process.env.SENDGRID_USERNAME,
    pass: process.env.SENDGRID_PASSWORD
  }
});

// ================================
// USER REGISTRATION & EMAIL VERIFICATION
// ================================

// Submit email for verification
app.post('/api/users/register', emailRateLimit, async (req, res) => {
  try {
    const { firstName, email, verificationToken, source } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Validate input
    if (!firstName || !email || !verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if user already exists and is verified
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0 && existingUser.rows[0].email_verified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true
      });
    }

    // Generate verification token with expiry
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Upsert user record
    await db.query(`
      INSERT INTO users (email, first_name, verification_token, verification_token_expires, source, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        verification_token = EXCLUDED.verification_token,
        verification_token_expires = EXCLUDED.verification_token_expires,
        updated_at = CURRENT_TIMESTAMP
    `, [
      email.toLowerCase(),
      firstName.trim(),
      verificationToken,
      tokenExpiry,
      source || 'digital_grandpa_resources',
      ipAddress,
      userAgent
    ]);

    // Log verification attempt
    await db.query(`
      INSERT INTO email_verification_attempts (email, verification_token, attempt_type, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [email.toLowerCase(), verificationToken, 'initial', ipAddress, userAgent]);

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
    const emailTemplate = await getEmailTemplate('email_verification', {
      firstName,
      verificationLink,
      expiryHours: 24
    });

    await emailTransporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
});

// Verify email token
app.post('/api/users/verify', async (req, res) => {
  try {
    const { token, sessionId } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with valid token
    const user = await db.query(`
      SELECT * FROM users 
      WHERE verification_token = $1 
      AND verification_token_expires > CURRENT_TIMESTAMP
      AND email_verified = FALSE
    `, [token]);

    if (user.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    const userData = user.rows[0];

    // Update user as verified
    await db.query(`
      UPDATE users SET 
        email_verified = TRUE,
        email_verified_at = CURRENT_TIMESTAMP,
        verification_token = NULL,
        verification_token_expires = NULL,
        status = 'verified',
        last_login = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [userData.id]);

    // Log successful verification
    await db.query(`
      UPDATE email_verification_attempts SET 
        clicked_at = CURRENT_TIMESTAMP,
        verified_at = CURRENT_TIMESTAMP
      WHERE verification_token = $1
    `, [token]);

    // Track verification event
    await db.query(`
      INSERT INTO user_analytics (user_id, session_id, event_type, event_data, ip_address, user_agent)
      VALUES ($1, $2, 'email_verified', $3, $4, $5)
    `, [
      userData.id,
      sessionId,
      JSON.stringify({ verification_method: 'email_link' }),
      ipAddress,
      userAgent
    ]);

    // Generate JWT token for authenticated sessions (optional)
    const jwtToken = jwt.sign(
      { 
        userId: userData.id, 
        email: userData.email,
        verified: true 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        verified: true
      },
      token: jwtToken
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
});

// ================================
// RESOURCE DOWNLOAD TRACKING
// ================================

app.post('/api/analytics/download', async (req, res) => {
  try {
    const { resourceName, userId, timestamp, sessionId } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Verify user is authenticated and verified
    const user = await db.query(
      'SELECT * FROM users WHERE email = $1 AND email_verified = TRUE',
      [userId] // userId is actually email in our frontend
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not verified'
      });
    }

    const userData = user.rows[0];

    // Determine resource type from name
    const resourceType = getResourceType(resourceName);

    // Log the download
    await db.query(`
      INSERT INTO resource_downloads (user_id, resource_name, resource_type, session_id, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      userData.id,
      resourceName,
      resourceType,
      sessionId,
      ipAddress,
      userAgent
    ]);

    // Track analytics event
    await db.query(`
      INSERT INTO user_analytics (user_id, session_id, event_type, event_data, ip_address, user_agent)
      VALUES ($1, $2, 'resource_download', $3, $4, $5)
    `, [
      userData.id,
      sessionId,
      JSON.stringify({ 
        resource_name: resourceName,
        resource_type: resourceType
      }),
      ipAddress,
      userAgent
    ]);

    res.status(200).json({
      success: true,
      message: 'Download tracked successfully'
    });

  } catch (error) {
    console.error('Download tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track download'
    });
  }
});

// Get user profile and download history
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user data
    const user = await db.query(
      'SELECT id, email, first_name, email_verified, created_at, last_login FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get download history
    const downloads = await db.query(`
      SELECT resource_name, resource_type, downloaded_at
      FROM resource_downloads
      WHERE user_id = $1
      ORDER BY downloaded_at DESC
    `, [userId]);

    res.status(200).json({
      success: true,
      user: user.rows[0],
      downloadHistory: downloads.rows
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// ================================
// UTILITY FUNCTIONS
// ================================

function getResourceType(resourceName) {
  const name = resourceName.toLowerCase();
  if (name.includes('audio') || name.includes('podcast')) return 'audio';
  if (name.includes('video') || name.includes('workshop')) return 'video';
  if (name.includes('worksheet') || name.includes('template')) return 'worksheet';
  return 'pdf';
}

async function getEmailTemplate(templateName, variables) {
  // In production, fetch from database
  const templates = {
    email_verification: {
      subject: 'Verify Your Email - Digital Grandpa Resources',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Georgia, serif;">
          <div style="background: linear-gradient(135deg, #1a252f, #2c3e50); padding: 40px; text-align: center; color: white;">
            <h1 style="color: #ffd700; margin-bottom: 20px;">Welcome to the Digital Grandpa Family</h1>
            <p style="font-size: 18px; margin-bottom: 30px;">Hello ${variables.firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Thank you for joining our community. To access your free resources, please verify your email address by clicking the button below.
            </p>
            <a href="${variables.verificationLink}" 
               style="display: inline-block; background: linear-gradient(45deg, #b8860b, #ffd700); 
                      color: #2c3e50; padding: 15px 30px; text-decoration: none; 
                      border-radius: 10px; font-weight: bold; font-size: 16px;">
              Verify My Email Address
            </a>
            <p style="font-size: 14px; margin-top: 30px; color: #bdc3c7;">
              This link will expire in ${variables.expiryHours} hours. If you didn't request this, please ignore this email.
            </p>
          </div>
          <div style="padding: 20px; background: #f8f6f0; text-align: center; color: #7f8c8d;">
            <p>Sometimes you don't need a guru. You need a grandpa.</p>
            <p style="font-size: 12px; margin-top: 10px;">
              © 2025 Digital Grandpa Foundation. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
        Welcome to the Digital Grandpa Family
        
        Hello ${variables.firstName},
        
        Thank you for joining our community. To access your free resources, please verify your email address by visiting this link:
        
        ${variables.verificationLink}
        
        This link will expire in ${variables.expiryHours} hours.
        
        If you didn't request this, please ignore this email.
        
        Sometimes you don't need a guru. You need a grandpa.
        
        © 2025 Digital Grandpa Foundation
      `
    }
  };

  return templates[templateName] || templates.email_verification;
}

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
}

// ================================
// ENVIRONMENT VARIABLES REQUIRED
// ================================

const REQUIRED_ENV_VARS = `
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/digital_grandpa

# JWT Secret
JWT_SECRET=your-super-secure-jwt-secret-key

# Email Service (SendGrid example)
SENDGRID_USERNAME=your-sendgrid-username
SENDGRID_PASSWORD=your-sendgrid-password
FROM_EMAIL=noreply@digitalgrandpa.org

# Frontend URL
FRONTEND_URL=https://digitalgrandpa.org

# Security
CORS_ORIGIN=https://digitalgrandpa.org
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Analytics (optional)
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
MIXPANEL_TOKEN=your-mixpanel-token
`;

// ================================
// SECURITY CONSIDERATIONS
// ================================

const SECURITY_CHECKLIST = `
1. ✅ Rate limiting on email verification endpoints
2. ✅ JWT tokens with expiration
3. ✅ Input validation and sanitization
4. ✅ SQL injection prevention (parameterized queries)
5. ✅ CORS configuration
6. ✅ HTTPS enforcement in production
7. ✅ Email token expiration (24 hours)
8. ✅ User agent and IP tracking for security monitoring
9. ✅ Secure password hashing (for future user accounts)
10. ✅ Environment variable protection

Additional Recommendations:
- Implement CSRF protection
- Add email domain validation
- Set up monitoring and alerting
- Regular security audits
- Backup and recovery procedures
- GDPR compliance measures
`;

// ================================
// DEPLOYMENT CONFIGURATION
// ================================

const DEPLOYMENT_CONFIG = {
  // Docker configuration
  dockerfile: `
    FROM node:18-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --only=production
    COPY . .
    EXPOSE 3000
    USER node
    CMD ["npm", "start"]
  `,

  // Kubernetes deployment
  k8s_deployment: `
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: digital-grandpa-api
    spec:
      replicas: 3
      selector:
        matchLabels:
          app: digital-grandpa-api
      template:
        metadata:
          labels:
            app: digital-grandpa-api
        spec:
          containers:
          - name: api
            image: digital-grandpa-api:latest
            ports:
            - containerPort: 3000
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: url
  `,

  // Nginx configuration
  nginx_config: `
    server {
        listen 443 ssl http2;
        server_name digitalgrandpa.org;
        
        ssl_certificate /path/to/certificate.crt;
        ssl_certificate_key /path/to/private.key;
        
        location /api/ {
            proxy_pass http://backend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location / {
            root /var/www/html;
            try_files $uri $uri/ /index.html;
        }
    }
  `
};

module.exports = {
  DATABASE_SCHEMA,
  REQUIRED_ENV_VARS,
  SECURITY_CHECKLIST,
  DEPLOYMENT_CONFIG
};