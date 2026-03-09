-- Migration: Add billing type, interval, and trial days to Product
-- Run this in Supabase SQL editor before deploying

-- Create enums
CREATE TYPE "BillingType" AS ENUM ('ONE_TIME', 'SUBSCRIPTION');
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- Add columns to Product table
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "billingType"     "BillingType"     NOT NULL DEFAULT 'ONE_TIME',
  ADD COLUMN IF NOT EXISTS "billingInterval" "BillingInterval" DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "trialDays"       INTEGER           DEFAULT NULL;
