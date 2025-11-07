# Production Readiness Plan - Babsy Gutschein-System

## Executive Summary

Das aktuelle System ist eine funktionsfähige **Demo/Proof-of-Concept** Anwendung, die erfolgreich die Kernfunktionalität demonstriert. Für den produktiven Einsatz sind jedoch signifikante Verbesserungen in den Bereichen Sicherheit, Skalierbarkeit, Zuverlässigkeit und Compliance erforderlich.

**Aktueller Stand**: Demo-System mit statischen Dateien und localStorage
**Ziel**: Production-Ready SaaS-Plattform für Gutschein-Management

---

## 1. Backend & Datenbank

### Aktuelle Situation
- ❌ Keine Backend-API
- ❌ JSON-Dateien als "Datenbank"
- ❌ localStorage für Benutzerdaten
- ❌ Keine Transaktionssicherheit
- ❌ Manuelle Synchronisation

### Empfohlene Lösung

#### 1.1 Backend-Framework
**Empfehlung: Node.js mit Express oder NestJS**

**Option A: Express (Schneller Einstieg)**
```javascript
// Beispiel-Struktur
backend/
├── src/
│   ├── controllers/
│   │   ├── voucher.controller.js
│   │   ├── partner.controller.js
│   │   └── user.controller.js
│   ├── models/
│   │   ├── Voucher.js
│   │   ├── Partner.js
│   │   └── User.js
│   ├── routes/
│   │   ├── api/
│   │   │   ├── vouchers.js
│   │   │   ├── partners.js
│   │   │   └── auth.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── voucherService.js
│   │   ├── emailService.js
│   │   └── qrService.js
│   └── app.js
├── package.json
└── .env
```

**Option B: NestJS (Skalierbar & Enterprise-Ready)**
- TypeScript-basiert
- Integrierte Dependency Injection
- Swagger/OpenAPI out-of-the-box
- Microservices-fähig

#### 1.2 Datenbank

**Empfehlung: PostgreSQL mit Prisma ORM**

**Warum PostgreSQL?**
- ✅ ACID-Transaktionen
- ✅ JSON-Support (für flexible Daten)
- ✅ Hohe Performance
- ✅ Kostenlose Hosting-Optionen (Supabase, Neon)
- ✅ Excellent für Relational Data

**Datenbank-Schema:**

```sql
-- Users (Mitglieder, Partner, Mitarbeiter)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'member', 'partner', 'employee'
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Partners
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    partnername VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description_de TEXT,
    address TEXT,
    kanton VARCHAR(50),
    homepage VARCHAR(255),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    logo_url VARCHAR(255),
    partner_type VARCHAR(20), -- 'physical', 'online'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vouchers
CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    partner_id UUID REFERENCES partners(id),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    value DECIMAL(10, 2),
    discount_percentage INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_redeemed BOOLEAN DEFAULT false,
    redeemed_at TIMESTAMP,
    redeemed_by UUID REFERENCES users(id),
    qr_code_data TEXT,
    metadata JSONB, -- Flexible zusätzliche Daten
    CONSTRAINT valid_voucher_state CHECK (
        (is_redeemed = false AND redeemed_at IS NULL) OR
        (is_redeemed = true AND redeemed_at IS NOT NULL)
    )
);

-- Audit Log (für Nachvollziehbarkeit)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'voucher', 'user', 'partner'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'redeemed', 'deleted'
    user_id UUID REFERENCES users(id),
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions (für sicheres Session-Management)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Indices für Performance
CREATE INDEX idx_vouchers_user_id ON vouchers(user_id);
CREATE INDEX idx_vouchers_partner_id ON vouchers(partner_id);
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_is_redeemed ON vouchers(is_redeemed);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
```

**Prisma Schema (prisma/schema.prisma):**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(uuid())
  username      String    @unique
  email         String    @unique
  passwordHash  String    @map("password_hash")
  userType      String    @map("user_type")
  name          String
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  lastLogin     DateTime? @map("last_login")
  isActive      Boolean   @default(true) @map("is_active")

  vouchers      Voucher[] @relation("UserVouchers")
  redeemedVouchers Voucher[] @relation("RedeemedBy")
  partner       Partner?
  sessions      Session[]
  auditLogs     AuditLog[]

  @@map("users")
}

model Partner {
  id              String    @id @default(uuid())
  userId          String    @unique @map("user_id")
  partnername     String
  category        String?
  descriptionDe   String?   @map("description_de") @db.Text
  address         String?   @db.Text
  kanton          String?
  homepage        String?
  lat             Decimal?  @db.Decimal(10, 8)
  lng             Decimal?  @db.Decimal(11, 8)
  logoUrl         String?   @map("logo_url")
  partnerType     String?   @map("partner_type")
  isActive        Boolean   @default(true) @map("is_active")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user            User      @relation(fields: [userId], references: [id])
  vouchers        Voucher[]

  @@map("partners")
}

model Voucher {
  id                  String    @id @default(uuid())
  code                String    @unique
  partnerId           String    @map("partner_id")
  userId              String    @map("user_id")
  title               String?
  description         String?   @db.Text
  value               Decimal?  @db.Decimal(10, 2)
  discountPercentage  Int?      @map("discount_percentage")
  createdAt           DateTime  @default(now()) @map("created_at")
  expiresAt           DateTime? @map("expires_at")
  isRedeemed          Boolean   @default(false) @map("is_redeemed")
  redeemedAt          DateTime? @map("redeemed_at")
  redeemedById        String?   @map("redeemed_by")
  qrCodeData          String?   @map("qr_code_data") @db.Text
  metadata            Json?

  partner             Partner   @relation(fields: [partnerId], references: [id])
  user                User      @relation("UserVouchers", fields: [userId], references: [id])
  redeemedBy          User?     @relation("RedeemedBy", fields: [redeemedById], references: [id])

  @@index([userId])
  @@index([partnerId])
  @@index([code])
  @@index([isRedeemed])
  @@map("vouchers")
}

model AuditLog {
  id          String   @id @default(uuid())
  entityType  String   @map("entity_type")
  entityId    String   @map("entity_id")
  action      String
  userId      String?  @map("user_id")
  changes     Json?
  ipAddress   String?  @map("ip_address")
  userAgent   String?  @map("user_agent") @db.Text
  createdAt   DateTime @default(now()) @map("created_at")

  user        User?    @relation(fields: [userId], references: [id])

  @@index([entityType, entityId])
  @@map("audit_log")
}

model Session {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  tokenHash   String   @map("token_hash")
  expiresAt   DateTime @map("expires_at")
  createdAt   DateTime @default(now()) @map("created_at")
  ipAddress   String?  @map("ip_address")
  userAgent   String?  @map("user_agent") @db.Text

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([tokenHash])
  @@map("sessions")
}
```

#### 1.3 Migration von JSON zu Datenbank

**Migrations-Script:**

```javascript
// scripts/migrate-to-db.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');

const prisma = new PrismaClient();

async function migrateData() {
  console.log('🔄 Starte Migration...');

  // 1. Migrate Partners
  const partners = JSON.parse(fs.readFileSync('data/partners.json'));
  console.log(`📦 Migriere ${partners.length} Partner...`);

  for (const partner of partners) {
    // Create user for partner
    const hashedPassword = await bcrypt.hash('temporaryPassword123', 10);
    const username = partner.partnername.toLowerCase().replace(/\s+/g, '');

    const user = await prisma.user.create({
      data: {
        username,
        email: partner.email || `${username}@partner.babsy.ch`,
        passwordHash: hashedPassword,
        userType: 'partner',
        name: partner.partnername
      }
    });

    // Create partner
    await prisma.partner.create({
      data: {
        userId: user.id,
        partnername: partner.partnername,
        category: partner.category,
        descriptionDe: partner.beschreibung_de,
        address: partner.adresse,
        kanton: partner.kanton,
        homepage: partner.homepage,
        lat: partner.lat,
        lng: partner.lng,
        logoUrl: partner.logos,
        partnerType: partner.partnerType || 'physical'
      }
    });
  }

  // 2. Migrate Members
  const members = JSON.parse(fs.readFileSync('data/mitglieder-auth.json'));
  console.log(`👥 Migriere ${members.members.length} Mitglieder...`);

  for (const member of members.members) {
    const hashedPassword = await bcrypt.hash(member.password, 10);

    await prisma.user.create({
      data: {
        username: member.username,
        email: member.email,
        passwordHash: hashedPassword,
        userType: 'member',
        name: member.name
      }
    });
  }

  // 3. Migrate Vouchers (if any exist)
  const vouchersData = JSON.parse(fs.readFileSync('data/vouchers.json'));
  console.log(`🎫 Migriere ${vouchersData.vouchers.length} Gutscheine...`);

  for (const voucher of vouchersData.vouchers) {
    const partner = await prisma.partner.findFirst({
      where: { partnername: voucher.partner }
    });

    const user = await prisma.user.findUnique({
      where: { username: voucher.customerId }
    });

    if (partner && user) {
      await prisma.voucher.create({
        data: {
          code: voucher.code,
          partnerId: partner.id,
          userId: user.id,
          title: voucher.title,
          description: voucher.description,
          createdAt: new Date(voucher.createdAt),
          isRedeemed: voucher.isRedeemed,
          redeemedAt: voucher.redeemedAt ? new Date(voucher.redeemedAt) : null
        }
      });
    }
  }

  console.log('✅ Migration abgeschlossen!');
}

migrateData()
  .catch((e) => {
    console.error('❌ Migration fehlgeschlagen:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 2. Authentifizierung & Sicherheit

### Aktuelle Situation
- ❌ Passwörter im Klartext
- ❌ Keine Verschlüsselung
- ❌ Keine Token-basierte Auth
- ❌ Session-Management fehlt
- ❌ Keine Rollen/Permissions

### Empfohlene Lösung

#### 2.1 Authentifizierung

**JWT-basierte Authentication mit Refresh Tokens**

```javascript
// services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

class AuthService {
  async register(userData) {
    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        passwordHash,
        userType: userData.userType,
        name: userData.name
      }
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(username, password, ipAddress, userAgent) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      include: { partner: true }
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save session
    await this.saveSession(user.id, tokens.refreshToken, ipAddress, userAgent);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        userType: user.userType,
        partnerId: user.partner?.id
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async saveSession(userId, refreshToken, ipAddress, userAgent) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent
      }
    });
  }

  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new AuthService();
```

**Auth Middleware:**

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Spezifische Middleware
exports.requireMember = exports.requireRole('member', 'employee');
exports.requirePartner = exports.requireRole('partner', 'employee');
exports.requireEmployee = exports.requireRole('employee');
```

#### 2.2 Sicherheits-Best-Practices

**Implementierung:**

```javascript
// app.js - Security Setup
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');

const app = express();

// Helmet - Security Headers
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});
app.use('/api/auth/login', authLimiter);

// Sanitize data
app.use(mongoSanitize());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

**Environment Variables (.env):**

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/babsy_vouchers"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# Server
PORT=3000
NODE_ENV="production"
ALLOWED_ORIGINS="https://babsyit.github.io,https://app.babsy.ch"

# Email
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM="noreply@babsy.ch"

# Logging
LOG_LEVEL="info"
```

---

## 3. REST API Entwicklung

### API-Endpunkte

#### 3.1 Authentication

```javascript
// routes/api/auth.js
const express = require('express');
const router = express.Router();
const authService = require('../../services/authService');
const { authenticateToken } = require('../../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(
      username,
      password,
      req.ip,
      req.headers['user-agent']
    );
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await authService.logout(req.user.userId, req.body.refreshToken);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await authService.getUserProfile(req.user.userId);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;
```

#### 3.2 Vouchers API

```javascript
// routes/api/vouchers.js
const express = require('express');
const router = express.Router();
const voucherService = require('../../services/voucherService');
const { authenticateToken, requireMember, requirePartner, requireEmployee } = require('../../middleware/auth');

// GET /api/vouchers - Get user's vouchers
router.get('/', authenticateToken, requireMember, async (req, res) => {
  try {
    const vouchers = await voucherService.getUserVouchers(req.user.userId);
    res.json(vouchers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/vouchers - Generate new voucher
router.post('/', authenticateToken, requireMember, async (req, res) => {
  try {
    const voucher = await voucherService.generateVoucher({
      userId: req.user.userId,
      partnerId: req.body.partnerId,
      description: req.body.description
    });
    res.status(201).json(voucher);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/vouchers/:id - Get specific voucher
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const voucher = await voucherService.getVoucher(req.params.id, req.user.userId);
    res.json(voucher);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// POST /api/vouchers/:id/redeem - Redeem voucher
router.post('/:id/redeem', authenticateToken, requirePartner, async (req, res) => {
  try {
    const voucher = await voucherService.redeemVoucher(
      req.params.id,
      req.user.userId,
      req.user.partnerId
    );
    res.json(voucher);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/vouchers/validate - Validate QR code
router.post('/validate', authenticateToken, requirePartner, async (req, res) => {
  try {
    const result = await voucherService.validateQRCode(
      req.body.qrData,
      req.user.partnerId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

#### 3.3 Partners API

```javascript
// routes/api/partners.js
const express = require('express');
const router = express.Router();
const partnerService = require('../../services/partnerService');
const { authenticateToken, requireEmployee } = require('../../middleware/auth');

// GET /api/partners - Get all partners (public)
router.get('/', async (req, res) => {
  try {
    const partners = await partnerService.getAllPartners({
      isActive: true
    });
    res.json(partners);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/partners/:id - Get partner details
router.get('/:id', async (req, res) => {
  try {
    const partner = await partnerService.getPartner(req.params.id);
    res.json(partner);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// PUT /api/partners/:id - Update partner (admin only)
router.put('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const partner = await partnerService.updatePartner(req.params.id, req.body);
    res.json(partner);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/partners/:id/stats - Get partner statistics
router.get('/:id/stats', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const stats = await partnerService.getPartnerStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

#### 3.4 Admin API

```javascript
// routes/api/admin.js
const express = require('express');
const router = express.Router();
const adminService = require('../../services/adminService');
const { authenticateToken, requireEmployee } = require('../../middleware/auth');

// All admin routes require employee role
router.use(authenticateToken, requireEmployee);

// GET /api/admin/stats - Overall statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await adminService.getOverallStats();
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/admin/vouchers - All vouchers with filters
router.get('/vouchers', async (req, res) => {
  try {
    const vouchers = await adminService.getAllVouchers(req.query);
    res.json(vouchers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/admin/audit-log - Audit trail
router.get('/audit-log', async (req, res) => {
  try {
    const logs = await adminService.getAuditLog(req.query);
    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/admin/export - Export data
router.post('/export', async (req, res) => {
  try {
    const exportData = await adminService.exportData(req.body.format);
    res.json(exportData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 4. Email Service

### Implementierung mit SendGrid

```javascript
// services/emailService.js
const sgMail = require('@sendgrid/mail');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  async sendVoucherGeneratedEmail(userId, voucherId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { partner: true }
    });

    const msg = {
      to: user.email,
      from: process.env.EMAIL_FROM,
      templateId: 'd-xxxxx', // SendGrid Template ID
      dynamicTemplateData: {
        userName: user.name,
        voucherCode: voucher.code,
        partnerName: voucher.partner.partnername,
        description: voucher.description,
        expiresAt: voucher.expiresAt
      }
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Email sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Email error:', error);
      throw error;
    }
  }

  async sendVoucherRedeemedEmail(userId, voucherId) {
    // Similar implementation
  }

  async sendPasswordResetEmail(userId, resetToken) {
    // Password reset email
  }

  async sendWelcomeEmail(userId) {
    // Welcome email for new users
  }
}

module.exports = new EmailService();
```

**Email Templates (SendGrid):**

1. **Voucher Generated**
   - Willkommensnachricht
   - Gutschein-Code
   - Partner-Informationen
   - Einlöseanweisungen
   - Link zur App

2. **Voucher Redeemed**
   - Bestätigung
   - Partner-Details
   - Transaktion-ID

3. **Welcome Email**
   - Onboarding-Informationen
   - Erste Schritte

---

## 5. Frontend-Anpassungen

### 5.1 API-Integration

**API Client (js/api-client.js):**

```javascript
class BabsyAPIClient {
  constructor() {
    this.baseURL = process.env.API_URL || 'https://api.babsy.ch';
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // Try to refresh token
        await this.refreshAccessToken();
        // Retry request
        return this.request(endpoint, options);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    if (!response.ok) {
      // Refresh failed, logout user
      this.logout();
      throw new Error('Session expired');
    }

    const data = await response.json();
    this.accessToken = data.accessToken;
    localStorage.setItem('accessToken', data.accessToken);
  }

  // Auth methods
  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data.user;
  }

  async logout() {
    await this.request('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    this.accessToken = null;
    this.refreshToken = null;
    localStorage.clear();
  }

  // Voucher methods
  async getMyVouchers() {
    return this.request('/api/vouchers');
  }

  async generateVoucher(partnerId, description) {
    return this.request('/api/vouchers', {
      method: 'POST',
      body: JSON.stringify({ partnerId, description })
    });
  }

  async redeemVoucher(voucherId) {
    return this.request(`/api/vouchers/${voucherId}/redeem`, {
      method: 'POST'
    });
  }

  // Partner methods
  async getPartners() {
    return this.request('/api/partners');
  }

  async getPartnerStats(partnerId) {
    return this.request(`/api/partners/${partnerId}/stats`);
  }

  // Admin methods
  async getAdminStats() {
    return this.request('/api/admin/stats');
  }

  async getAllVouchers(filters) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`/api/admin/vouchers?${queryString}`);
  }
}

// Export singleton instance
window.babsyAPI = new BabsyAPIClient();
```

### 5.2 Migration: localStorage → API

**Schritt-für-Schritt:**

1. **Phase 1: Dual-Mode** (beide Systeme parallel)
   - Frontend prüft ob Backend erreichbar
   - Wenn ja: API-Calls
   - Wenn nein: localStorage (Fallback)

2. **Phase 2: API-First** (nach Testing)
   - API als Primary
   - localStorage nur als Cache

3. **Phase 3: API-Only** (Production)
   - localStorage komplett entfernen
   - Alle Daten über API

---

## 6. Deployment & Infrastructure

### 6.1 Hosting-Optionen

#### Option A: Vercel + Supabase (Empfohlen für Start)

**Vorteile:**
- ✅ Sehr einfaches Setup
- ✅ Kostenloser Start (Supabase: 500MB DB, Vercel: 100GB Bandwidth)
- ✅ Automatische Backups
- ✅ Integriertes CI/CD

**Setup:**
```bash
# Backend auf Vercel deployen
vercel

# Supabase Database
# → https://supabase.com/dashboard
# → Create Project → Copy Connection String
```

#### Option B: AWS (Skalierbar, Enterprise)

**Services:**
- **Frontend**: S3 + CloudFront
- **Backend**: ECS (Fargate) oder Lambda
- **Database**: RDS PostgreSQL
- **Email**: SES
- **Monitoring**: CloudWatch
- **CDN**: CloudFront

**Geschätzte Kosten:**
- Small (< 1000 users): ~$50-100/Monat
- Medium (< 10,000 users): ~$200-400/Monat
- Large (> 10,000 users): ~$500-1000+/Monat

#### Option C: Render (Balance zwischen Einfachheit & Skalierung)

**Vorteile:**
- ✅ Einfacher als AWS
- ✅ Günstiger als Heroku
- ✅ Managed PostgreSQL
- ✅ Automatische SSL

### 6.2 CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Run linting
        run: npm run lint

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build frontend
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 6.3 Environment Management

**Umgebungen:**
1. **Development** (local)
2. **Staging** (staging.babsy.ch)
3. **Production** (app.babsy.ch)

**Environment Variables pro Umgebung:**
```bash
# Development
DATABASE_URL="postgresql://localhost:5432/babsy_dev"
API_URL="http://localhost:3000"
NODE_ENV="development"

# Staging
DATABASE_URL="postgresql://staging.supabase.co/..."
API_URL="https://api-staging.babsy.ch"
NODE_ENV="staging"

# Production
DATABASE_URL="postgresql://prod.supabase.co/..."
API_URL="https://api.babsy.ch"
NODE_ENV="production"
```

---

## 7. Monitoring & Logging

### 7.1 Application Monitoring

**Empfehlung: Sentry + LogRocket**

```javascript
// app.js - Error Tracking
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

// Error handler
app.use((err, req, res, next) => {
  Sentry.captureException(err);

  res.status(err.statusCode || 500).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

### 7.2 Logging

**Winston Logger:**

```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### 7.3 Performance Monitoring

**Implementierung:**

```javascript
// middleware/monitoring.js
const logger = require('../utils/logger');

exports.requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
  });

  next();
};
```

---

## 8. Testing

### 8.1 Backend Tests

**Jest + Supertest:**

```javascript
// tests/vouchers.test.js
const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Voucher API', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Setup test data
    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        userType: 'member',
        name: 'Test User'
      }
    });

    // Login
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password' });

    authToken = response.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  test('GET /api/vouchers should return user vouchers', async () => {
    const response = await request(app)
      .get('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/vouchers should create voucher', async () => {
    const response = await request(app)
      .post('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        partnerId: 'partner-id',
        description: 'Test voucher'
      })
      .expect(201);

    expect(response.body).toHaveProperty('code');
    expect(response.body.userId).toBe(testUser.id);
  });
});
```

### 8.2 Frontend Tests

**Playwright für E2E Tests:**

```javascript
// tests/e2e/voucher-flow.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Voucher Generation Flow', () => {
  test('User can generate and view voucher', async ({ page }) => {
    // Login
    await page.goto('https://app.babsy.ch/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to partners
    await page.click('a[href="/partners"]');
    await expect(page).toHaveURL(/.*partners/);

    // Generate voucher
    await page.click('button:has-text("E-TriColor")');
    await page.click('button:has-text("Gutschein generieren")');

    // Verify voucher created
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.voucher-code')).toBeVisible();

    // Check vouchers list
    await page.goto('https://app.babsy.ch/vouchers');
    await expect(page.locator('.voucher-card')).toHaveCount(1);
  });
});
```

---

## 9. DSGVO / Legal Compliance

### 9.1 Datenschutz-Anforderungen

#### Erforderliche Dokumente:
1. **Datenschutzerklärung**
2. **AGB**
3. **Impressum**
4. **Cookie-Policy**

#### Implementierung:

**DSGVO-Features:**

```javascript
// services/gdprService.js
class GDPRService {
  // Recht auf Auskunft (Art. 15 DSGVO)
  async exportUserData(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vouchers: true,
        sessions: true,
        auditLogs: true
      }
    });

    return {
      personalData: {
        username: user.username,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      vouchers: user.vouchers,
      loginHistory: user.sessions,
      activityLog: user.auditLogs
    };
  }

  // Recht auf Löschung (Art. 17 DSGVO)
  async deleteUserData(userId) {
    // Anonymize vouchers instead of deleting (for accounting)
    await prisma.voucher.updateMany({
      where: { userId },
      data: {
        userId: null,
        metadata: { gdprDeleted: true, deletedAt: new Date() }
      }
    });

    // Delete user
    await prisma.user.delete({ where: { id: userId } });
  }

  // Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
  async exportUserDataPortable(userId) {
    const data = await this.exportUserData(userId);

    // Return as JSON for portability
    return JSON.stringify(data, null, 2);
  }
}
```

### 9.2 Cookie Consent

**Frontend Implementation:**

```javascript
// js/cookie-consent.js
class CookieConsentManager {
  constructor() {
    this.consentGiven = localStorage.getItem('cookieConsent') === 'true';
    this.init();
  }

  init() {
    if (!this.consentGiven) {
      this.showBanner();
    } else {
      this.enableAnalytics();
    }
  }

  showBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-content">
        <p>Wir verwenden Cookies, um Ihre Erfahrung zu verbessern.
        <a href="/datenschutz">Mehr erfahren</a></p>
        <button id="acceptCookies">Akzeptieren</button>
        <button id="declineCookies">Ablehnen</button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('acceptCookies').onclick = () => {
      this.acceptCookies();
    };

    document.getElementById('declineCookies').onclick = () => {
      this.declineCookies();
    };
  }

  acceptCookies() {
    localStorage.setItem('cookieConsent', 'true');
    this.consentGiven = true;
    this.enableAnalytics();
    document.querySelector('.cookie-banner').remove();
  }

  declineCookies() {
    localStorage.setItem('cookieConsent', 'false');
    document.querySelector('.cookie-banner').remove();
  }

  enableAnalytics() {
    // Enable Google Analytics, etc.
  }
}

new CookieConsentManager();
```

---

## 10. Mobile App (Optional)

### 10.1 React Native App

**Empfehlung: Expo für schnelleren Start**

**Projekt-Struktur:**

```
mobile/
├── App.js
├── app.json
├── package.json
└── src/
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── VouchersScreen.js
    │   ├── PartnersScreen.js
    │   └── ScannerScreen.js
    ├── components/
    │   ├── VoucherCard.js
    │   ├── PartnerCard.js
    │   └── QRScanner.js
    ├── services/
    │   └── api.js
    └── navigation/
        └── AppNavigator.js
```

**QR Scanner Implementation:**

```javascript
// screens/ScannerScreen.js
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { api } from '../services/api';

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  React.useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);

    try {
      const result = await api.validateQRCode(data);
      alert(`Gutschein eingelöst: ${result.code}`);
    } catch (error) {
      alert(`Fehler: ${error.message}`);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={{ flex: 1 }}
      />
      {scanned && <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />}
    </View>
  );
}
```

---

## 11. Priorisierte Roadmap

### Phase 1: Foundation (Wochen 1-4)
**Ziel: Grundlegende Production-Infrastruktur**

- ✅ **Woche 1-2: Backend Setup**
  - [ ] Node.js/Express Backend aufsetzen
  - [ ] PostgreSQL Datenbank auf Supabase
  - [ ] Prisma ORM Setup & Migrations
  - [ ] Daten-Migration (JSON → DB)

- ✅ **Woche 3-4: Authentication**
  - [ ] JWT-basierte Auth implementieren
  - [ ] Passwort-Hashing (bcrypt)
  - [ ] Session-Management
  - [ ] Role-based Access Control

### Phase 2: Core Features (Wochen 5-8)
**Ziel: API-Integration & Sicherheit**

- ✅ **Woche 5-6: REST API**
  - [ ] Voucher API Endpoints
  - [ ] Partner API Endpoints
  - [ ] Admin API Endpoints
  - [ ] API-Dokumentation (Swagger)

- ✅ **Woche 7-8: Frontend Migration**
  - [ ] API-Client erstellen
  - [ ] Frontend auf API umstellen
  - [ ] localStorage als Cache nutzen
  - [ ] Error Handling

### Phase 3: Communication & Monitoring (Wochen 9-12)
**Ziel: Email-Service & Observability**

- ✅ **Woche 9-10: Email Service**
  - [ ] SendGrid Integration
  - [ ] Email-Templates erstellen
  - [ ] Notifications implementieren
  - [ ] Email-Queue für Zuverlässigkeit

- ✅ **Woche 11-12: Monitoring**
  - [ ] Sentry für Error Tracking
  - [ ] Winston Logger Setup
  - [ ] Performance Monitoring
  - [ ] Health Checks

### Phase 4: Testing & Compliance (Wochen 13-16)
**Ziel: Qualitätssicherung & Legal**

- ✅ **Woche 13-14: Testing**
  - [ ] Unit Tests (Jest)
  - [ ] Integration Tests
  - [ ] E2E Tests (Playwright)
  - [ ] Load Testing

- ✅ **Woche 15-16: DSGVO**
  - [ ] Datenschutzerklärung
  - [ ] Cookie Consent
  - [ ] GDPR-Features (Export, Löschung)
  - [ ] AGB & Impressum

### Phase 5: Deployment & Launch (Wochen 17-20)
**Ziel: Production Deployment**

- ✅ **Woche 17-18: Deployment**
  - [ ] CI/CD Pipeline (GitHub Actions)
  - [ ] Staging Environment
  - [ ] Production Deployment
  - [ ] Domain & SSL Setup

- ✅ **Woche 19-20: Launch Vorbereitung**
  - [ ] Performance Optimization
  - [ ] Security Audit
  - [ ] User Acceptance Testing
  - [ ] Documentation finalisieren

### Phase 6: Enhancements (Post-Launch)
**Ziel: Verbesserungen & neue Features**

- 📱 **Mobile App** (optional, +8 Wochen)
- 📊 **Advanced Analytics**
- 🔔 **Push Notifications**
- 💳 **Payment Integration**
- 🌍 **Internationalization**

---

## 12. Kostenabschätzung

### Entwicklungskosten

**Option A: In-House (1 Senior Developer)**
- Phase 1-5: 20 Wochen × 40 Stunden = 800 Stunden
- Bei CHF 100-150/Stunde: **CHF 80,000 - 120,000**

**Option B: Agentur**
- Pauschalpreis: **CHF 150,000 - 250,000**
- Inkl. Design, Testing, Deployment

**Option C: Freelancer-Mix**
- Backend (400h × CHF 100): CHF 40,000
- Frontend (200h × CHF 80): CHF 16,000
- Testing (100h × CHF 80): CHF 8,000
- **Total: CHF 64,000**

### Laufende Kosten (monatlich)

**Hosting & Infrastructure:**
- Vercel Pro: CHF 20
- Supabase Pro: CHF 25
- SendGrid (10k emails): CHF 15
- Domain & SSL: CHF 5
- **Total: ~CHF 65/Monat**

**Monitoring & Tools:**
- Sentry: CHF 26
- LogRocket: CHF 99
- **Total: ~CHF 125/Monat**

**Gesamtkosten (Monat): CHF 190**

Bei 1000 aktiven Nutzern: **CHF 0.19 pro Nutzer/Monat**

---

## 13. Technologie-Stack Übersicht

### Backend
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express oder NestJS
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Email**: SendGrid
- **File Upload**: AWS S3 oder Cloudinary

### Frontend
- **Core**: Vanilla JavaScript oder React (Migration empfohlen)
- **Build Tool**: Vite
- **State Management**: Context API oder Zustand
- **HTTP Client**: Axios oder Fetch API
- **UI Framework**: Tailwind CSS (optional)

### DevOps
- **Hosting**: Vercel (Backend) + GitHub Pages (Frontend)
- **Database**: Supabase oder AWS RDS
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + Winston
- **CDN**: Cloudflare oder CloudFront

### Testing
- **Unit**: Jest
- **Integration**: Supertest
- **E2E**: Playwright
- **Load**: Artillery

---

## 14. Security Checklist

- [ ] **Authentication**
  - [ ] JWT mit kurzer Lifetime (15min)
  - [ ] Refresh Tokens implementiert
  - [ ] Password Hashing mit bcrypt (12+ rounds)
  - [ ] Rate Limiting auf Login (5 attempts/15min)

- [ ] **Authorization**
  - [ ] Role-based Access Control (RBAC)
  - [ ] Permission Checks auf allen Endpoints
  - [ ] User kann nur eigene Daten sehen

- [ ] **Data Protection**
  - [ ] HTTPS everywhere (TLS 1.3)
  - [ ] Sensitive Data verschlüsselt in DB
  - [ ] SQL Injection Prevention (Prisma ORM)
  - [ ] XSS Protection (Content Security Policy)

- [ ] **API Security**
  - [ ] Rate Limiting (100 requests/15min)
  - [ ] Request Size Limits (10MB)
  - [ ] CORS korrekt konfiguriert
  - [ ] API Keys nicht im Frontend

- [ ] **Monitoring**
  - [ ] Failed Login Attempts loggen
  - [ ] Suspicious Activity Alerts
  - [ ] Audit Log für sensitive Actions
  - [ ] Regular Security Scans

---

## 15. Next Steps - Action Items

### Sofort (Diese Woche):
1. ✅ **Entscheidung treffen**: In-House vs. Agentur vs. Freelancer
2. ✅ **Hosting wählen**: Vercel + Supabase oder AWS
3. ✅ **Repository Setup**: Backend-Repo erstellen
4. ✅ **Database aufsetzen**: Supabase Projekt erstellen

### Nächste Woche:
5. ✅ **Backend Skeleton**: Express + Prisma Setup
6. ✅ **Schema definieren**: Datenbank-Modelle finalisieren
7. ✅ **Auth implementieren**: JWT Setup
8. ✅ **Erste API**: Vouchers CRUD

### Nächste 2 Wochen:
9. ✅ **Frontend Migration starten**: API-Client erstellen
10. ✅ **Testing Setup**: Jest + Playwright
11. ✅ **Email Service**: SendGrid Integration
12. ✅ **Monitoring**: Sentry Setup

---

## 16. Kontakt & Support

**Fragen zu diesem Plan?**
- 📧 Email: dev@babsy.ch
- 💬 Slack: #babsy-development
- 📋 Project Board: [GitHub Projects](https://github.com/BabsyIT/Gutscheine/projects)

**Externe Ressourcen:**
- [Prisma Docs](https://www.prisma.io/docs)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [DSGVO Compliance Guide](https://gdpr.eu/)

---

**Erstellt am**: 2025-01-XX
**Version**: 1.0
**Status**: Ready for Review

