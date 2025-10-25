require('dotenv').config();

const config = {
  // Server configuration
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  // Database configuration
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/a365-analyst',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    },
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
    store: null, // Will be set in app.js
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
    passwordSaltRounds: 10,
  },
  
  // Power BI configuration
  powerBI: {
    clientId: process.env.POWER_BI_CLIENT_ID,
    clientSecret: process.env.POWER_BI_CLIENT_SECRET,
    tenantId: process.env.POWER_BI_TENANT_ID,
    workspaceId: process.env.POWER_BI_WORKSPACE_ID,
    authorityUrl: 'https://login.microsoftonline.com/',
    scope: ['https://analysis.windows.net/powerbi/api/.default'],
    apiUrl: 'https://api.powerbi.com/',
  },
  
  // Email configuration
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM || 'noreply@a365-analyst.local',
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'app.log',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
};

// Export the config object based on the current environment
module.exports = (env = config.env) => {
  // You can add environment-specific overrides here if needed
  const environmentConfig = {
    development: {
      // Development-specific settings
      db: {
        ...config.db,
        debug: true,
      },
      logging: {
        ...config.logging,
        level: 'debug',
      },
    },
    test: {
      // Test-specific settings
      db: {
        ...config.db,
        uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/a365-analyst-test',
      },
    },
    production: {
      // Production-specific settings
      session: {
        ...config.session,
        cookie: {
          ...config.session.cookie,
          secure: true, // Force HTTPS in production
          sameSite: 'none',
        },
      },
      logging: {
        ...config.logging,
        level: 'warn',
      },
    },
  };

  // Merge the base config with the environment-specific config
  return {
    ...config,
    ...(environmentConfig[env] || {}),
  };
};
