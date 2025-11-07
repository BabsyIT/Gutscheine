#!/usr/bin/env node

/**
 * Migration Script: JSON Files → Supabase Database
 *
 * This script migrates existing data from JSON files to the PostgreSQL database.
 * Run this ONCE after setting up the database.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

// File paths
const FILES = {
  partners: path.join(__dirname, '../../data/partners.json'),
  members: path.join(__dirname, '../../data/mitglieder-auth.json'),
  partnersAuth: path.join(__dirname, '../../data/partners-auth.json'),
  employees: path.join(__dirname, '../../data/users.json'),
  vouchers: path.join(__dirname, '../../data/vouchers.json')
};

/**
 * Check if files exist
 */
function checkFiles() {
  console.log('🔍 Checking files...\n');

  for (const [name, filepath] of Object.entries(FILES)) {
    if (fs.existsSync(filepath)) {
      console.log(`  ✅ ${name}: ${filepath}`);
    } else {
      console.log(`  ⚠️  ${name}: NOT FOUND (${filepath})`);
    }
  }
  console.log('');
}

/**
 * Migrate Partners
 */
async function migratePartners() {
  console.log('📦 Migrating Partners...');

  if (!fs.existsSync(FILES.partners)) {
    console.log('  ⚠️  partners.json not found, skipping...\n');
    return;
  }

  const partners = JSON.parse(fs.readFileSync(FILES.partners, 'utf-8'));
  console.log(`  Found ${partners.length} partners\n`);

  let migrated = 0;
  let skipped = 0;

  for (const partner of partners) {
    try {
      // Generate username from partner name
      const username = partner.partnername
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 50);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUser) {
        console.log(`  ⏭️  Skipping ${partner.partnername} (already exists)`);
        skipped++;
        continue;
      }

      // Create user for partner
      const hashedPassword = await bcrypt.hash('ChangeMePlease123!', BCRYPT_ROUNDS);
      const email = `${username}@partner.babsy.ch`;

      const user = await prisma.user.create({
        data: {
          username,
          email,
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
          lat: partner.lat ? parseFloat(partner.lat) : null,
          lng: partner.lng ? parseFloat(partner.lng) : null,
          logoUrl: partner.logos,
          partnerType: 'physical',
          isActive: true
        }
      });

      console.log(`  ✅ Migrated: ${partner.partnername}`);
      migrated++;

    } catch (error) {
      console.error(`  ❌ Error migrating ${partner.partnername}:`, error.message);
    }
  }

  console.log(`\n  📊 Partners: ${migrated} migrated, ${skipped} skipped\n`);
}

/**
 * Migrate Members
 */
async function migrateMembers() {
  console.log('👥 Migrating Members...');

  if (!fs.existsSync(FILES.members)) {
    console.log('  ⚠️  mitglieder-auth.json not found, skipping...\n');
    return;
  }

  const data = JSON.parse(fs.readFileSync(FILES.members, 'utf-8'));
  const members = data.members || [];
  console.log(`  Found ${members.length} members\n`);

  let migrated = 0;
  let skipped = 0;

  for (const member of members) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: member.username }
      });

      if (existingUser) {
        console.log(`  ⏭️  Skipping ${member.username} (already exists)`);
        skipped++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(member.password, BCRYPT_ROUNDS);

      await prisma.user.create({
        data: {
          username: member.username,
          email: member.email,
          passwordHash: hashedPassword,
          userType: 'member',
          name: member.name
        }
      });

      console.log(`  ✅ Migrated: ${member.username}`);
      migrated++;

    } catch (error) {
      console.error(`  ❌ Error migrating ${member.username}:`, error.message);
    }
  }

  console.log(`\n  📊 Members: ${migrated} migrated, ${skipped} skipped\n`);
}

/**
 * Migrate Employees
 */
async function migrateEmployees() {
  console.log('👔 Migrating Employees...');

  if (!fs.existsSync(FILES.employees)) {
    console.log('  ⚠️  users.json not found, skipping...\n');
    return;
  }

  const data = JSON.parse(fs.readFileSync(FILES.employees, 'utf-8'));
  const employees = data.users || [];
  console.log(`  Found ${employees.length} employees\n`);

  let migrated = 0;
  let skipped = 0;

  for (const employee of employees) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: employee.username }
      });

      if (existingUser) {
        console.log(`  ⏭️  Skipping ${employee.username} (already exists)`);
        skipped++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(employee.password, BCRYPT_ROUNDS);

      await prisma.user.create({
        data: {
          username: employee.username,
          email: `${employee.username}@babsy.ch`,
          passwordHash: hashedPassword,
          userType: 'employee',
          name: employee.name
        }
      });

      console.log(`  ✅ Migrated: ${employee.username}`);
      migrated++;

    } catch (error) {
      console.error(`  ❌ Error migrating ${employee.username}:`, error.message);
    }
  }

  console.log(`\n  📊 Employees: ${migrated} migrated, ${skipped} skipped\n`);
}

/**
 * Migrate Vouchers
 */
async function migrateVouchers() {
  console.log('🎫 Migrating Vouchers...');

  if (!fs.existsSync(FILES.vouchers)) {
    console.log('  ⚠️  vouchers.json not found, skipping...\n');
    return;
  }

  const data = JSON.parse(fs.readFileSync(FILES.vouchers, 'utf-8'));
  const vouchers = data.vouchers || [];
  console.log(`  Found ${vouchers.length} vouchers\n`);

  if (vouchers.length === 0) {
    console.log('  ℹ️  No vouchers to migrate\n');
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const voucher of vouchers) {
    try {
      // Check if voucher already exists
      const existing = await prisma.voucher.findUnique({
        where: { code: voucher.code }
      });

      if (existing) {
        console.log(`  ⏭️  Skipping ${voucher.code} (already exists)`);
        skipped++;
        continue;
      }

      // Find partner
      const partner = await prisma.partner.findFirst({
        where: { partnername: voucher.partner }
      });

      if (!partner) {
        console.log(`  ⚠️  Partner not found for voucher ${voucher.code}: ${voucher.partner}`);
        skipped++;
        continue;
      }

      // Find user by customerId (username)
      const user = await prisma.user.findUnique({
        where: { username: voucher.customerId }
      });

      if (!user) {
        console.log(`  ⚠️  User not found for voucher ${voucher.code}: ${voucher.customerId}`);
        skipped++;
        continue;
      }

      await prisma.voucher.create({
        data: {
          code: voucher.code,
          partnerId: partner.id,
          userId: user.id,
          title: voucher.title || partner.partnername,
          description: voucher.description || voucher.value,
          createdAt: voucher.createdAt ? new Date(voucher.createdAt) : new Date(),
          isRedeemed: voucher.isRedeemed || false,
          redeemedAt: voucher.redeemedAt ? new Date(voucher.redeemedAt) : null
        }
      });

      console.log(`  ✅ Migrated: ${voucher.code}`);
      migrated++;

    } catch (error) {
      console.error(`  ❌ Error migrating voucher ${voucher.code}:`, error.message);
    }
  }

  console.log(`\n  📊 Vouchers: ${migrated} migrated, ${skipped} skipped\n`);
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Babsy Voucher System - Database Migration   ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // Check database connection
    console.log('🔗 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected to Supabase\n');

    // Check files
    checkFiles();

    // Confirm migration
    console.log('⚠️  This will migrate data from JSON files to the database.');
    console.log('⚠️  Make sure you have run "prisma db push" first!\n');

    // Run migrations in order
    await migratePartners();
    await migrateMembers();
    await migrateEmployees();
    await migrateVouchers();

    console.log('╔════════════════════════════════════════════════╗');
    console.log('║         ✅ Migration Completed Successfully!   ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('📝 IMPORTANT: Default passwords have been set for partners!');
    console.log('   Password: ChangeMePlease123!');
    console.log('   Make sure to change them after first login!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
