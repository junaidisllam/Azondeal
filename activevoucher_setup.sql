-- Active Voucher Database Setup Script
-- Database: activevoucher

CREATE DATABASE IF NOT EXISTS activevoucher;
USE activevoucher;

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS `Admin` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191),
    `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Category Table (Hierarchical)
CREATE TABLE IF NOT EXISTS `Category` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(191) NOT NULL UNIQUE,
    `slug` VARCHAR(191) NOT NULL UNIQUE,
    `parentId` INT,
    `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Collection Table
CREATE TABLE IF NOT EXISTS `Collection` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(191) NOT NULL UNIQUE,
    `slug` VARCHAR(191) NOT NULL UNIQUE,
    `image` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Deal Table (Detailed)
CREATE TABLE IF NOT EXISTS `Deal` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `asin` VARCHAR(191) NOT NULL UNIQUE,
    `title` TEXT NOT NULL,
    `image` TEXT NOT NULL,
    `image_ids` JSON,
    `price` DOUBLE NOT NULL,
    `discounted_price` DOUBLE NOT NULL,
    `list_price` DOUBLE,
    `discount_percentage` DOUBLE,
    `list_price_savings_percentage` DOUBLE,
    `price_drop_percentage` DOUBLE,
    `coupon_value` VARCHAR(191),
    `promo_code` VARCHAR(191),
    `promo_string` VARCHAR(191),
    `encrypted_promo` VARCHAR(191),
    `last_verified_promo` VARCHAR(191),
    `codes` JSON,
    
    `avg_rating` DOUBLE,
    `ratings_count` INT,
    `likes_count` INT,
    `bought_past_month` INT,
    
    `bitwise_type` INT,
    `campaign_id` VARCHAR(191),
    `merchant_id` VARCHAR(191),
    `merchant_name` VARCHAR(191),
    `deal_hash` TEXT,
    `custom_text` TEXT,
    
    `creator_commission_percentage` DOUBLE,
    `input_commission` DOUBLE,
    `external_provider_commission` DOUBLE,
    `external_provider_owed_per_sale` DOUBLE,
    `owed_per_sale_dollars` DOUBLE,
    `expected_revenue_per_click` DOUBLE,
    
    `deal_score` DOUBLE,
    `lgbm_score` DOUBLE,
    `pop_score` DOUBLE,
    `recc_score` DOUBLE,
    `relevance_score` DOUBLE,
    `budget_availability_score` VARCHAR(191),
    
    `has_brand_deal` BOOLEAN DEFAULT FALSE,
    `has_coupon` BOOLEAN DEFAULT FALSE,
    `has_extra_discount` BOOLEAN DEFAULT FALSE,
    `has_lightning_deal` BOOLEAN DEFAULT FALSE,
    `has_price_drop` BOOLEAN DEFAULT FALSE,
    `has_promo_code` BOOLEAN DEFAULT FALSE,
    
    `is_amazon_choice` BOOLEAN DEFAULT FALSE,
    `is_brand_name` BOOLEAN DEFAULT FALSE,
    `is_data_amz_compatible` BOOLEAN DEFAULT FALSE,
    `is_deal` BOOLEAN DEFAULT FALSE,
    `is_early_access` BOOLEAN DEFAULT FALSE,
    `is_fba` BOOLEAN DEFAULT FALSE,
    `is_good_deal` BOOLEAN DEFAULT FALSE,
    `is_hot` BOOLEAN DEFAULT FALSE,
    `is_parent_asin` BOOLEAN DEFAULT FALSE,
    `is_popular` BOOLEAN DEFAULT FALSE,
    `lowest_price_12_months` BOOLEAN DEFAULT FALSE,
    `lowest_price_3_months` BOOLEAN DEFAULT FALSE,
    
    `num_variations` INT,
    `parent_asin` VARCHAR(191),
    `variation_asins` JSON,
    
    `smart_slug` VARCHAR(191),
    `sns_base_discount` VARCHAR(191),
    `sns_base_price` DOUBLE,
    `sns_coupon_value` VARCHAR(191),
    `stacking_discount_percentage` DOUBLE,
    `today_top_deals_position` INT DEFAULT -1,
    `extra_discount_amount` VARCHAR(191),
    
    `categoryId` INT,
    `collectionId` INT,
    
    `expired_at` DATETIME(3),
    `last_updated` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
