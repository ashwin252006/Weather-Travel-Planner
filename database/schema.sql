-- Weather Travel Planner Database Schema
-- MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS `weather_travel_planner`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `weather_travel_planner`;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorites table
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `location_name` VARCHAR(255) NOT NULL,
  `country` VARCHAR(100) NOT NULL,
  `region` VARCHAR(100) DEFAULT NULL,
  `provider_location_id` VARCHAR(100) DEFAULT NULL,
  `lat` DECIMAL(10, 7) DEFAULT NULL,
  `lon` DECIMAL(10, 7) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_favorites_user_location` (`user_id`, `location_name`, `country`),
  KEY `idx_favorites_user_id` (`user_id`),
  KEY `idx_favorites_created_at` (`created_at`),
  CONSTRAINT `fk_favorites_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Travel plans table
CREATE TABLE IF NOT EXISTS `travel_plans` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `destination` VARCHAR(255) NOT NULL,
  `destination_country` VARCHAR(100) DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_travel_plans_user_id` (`user_id`),
  KEY `idx_travel_plans_dates` (`start_date`, `end_date`),
  KEY `idx_travel_plans_created_at` (`created_at`),
  CONSTRAINT `fk_travel_plans_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_travel_plans_dates` CHECK (`end_date` >= `start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Search history table (optional)
CREATE TABLE IF NOT EXISTS `search_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `search_query` VARCHAR(255) NOT NULL,
  `result_count` INT UNSIGNED DEFAULT 0,
  `searched_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_search_history_user_id` (`user_id`),
  KEY `idx_search_history_searched_at` (`searched_at`),
  CONSTRAINT `fk_search_history_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weather cache table (optional, for caching weather responses)
CREATE TABLE IF NOT EXISTS `weather_cache` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cache_key` VARCHAR(255) NOT NULL,
  `location_query` VARCHAR(255) NOT NULL,
  `response_data` JSON NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_weather_cache_key` (`cache_key`),
  KEY `idx_weather_cache_expires` (`expires_at`),
  KEY `idx_weather_cache_location` (`location_query`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User preferences table (optional, for advanced features)
CREATE TABLE IF NOT EXISTS `user_preferences` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL UNIQUE,
  `temperature_unit` ENUM('celsius', 'fahrenheit') DEFAULT 'celsius',
  `preferred_activities` JSON DEFAULT NULL,
  `temp_min_preference` INT DEFAULT NULL,
  `temp_max_preference` INT DEFAULT NULL,
  `notification_enabled` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_preferences_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX `idx_users_email` ON `users` (`email`);
CREATE INDEX `idx_favorites_user_created` ON `favorites` (`user_id`, `created_at` DESC);
CREATE INDEX `idx_travel_plans_user_dates` ON `travel_plans` (`user_id`, `start_date`, `end_date`);

-- Sample data (optional - for development only)
-- Note: Passwords are hashed with bcrypt (cost factor 12)
-- Sample password for all test users: "password123"
/*
INSERT INTO `users` (`name`, `email`, `password_hash`) VALUES
('Test User', 'test@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S'),
('Demo User', 'demo@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S');

INSERT INTO `favorites` (`user_id`, `location_name`, `country`, `region`, `lat`, `lon`) VALUES
(1, 'Chennai', 'India', 'Tamil Nadu', 13.0827, 80.2707),
(1, 'Bengaluru', 'India', 'Karnataka', 12.9716, 77.5946),
(1, 'London', 'United Kingdom', 'England', 51.5074, -0.1278);

INSERT INTO `travel_plans` (`user_id`, `destination`, `destination_country`, `start_date`, `end_date`, `notes`) VALUES
(1, 'Goa', 'India', '2025-12-20', '2025-12-27', 'Beach vacation with friends'),
(1, 'Paris', 'France', '2026-03-15', '2026-03-22', 'Spring trip to Paris');

INSERT INTO `user_preferences` (`user_id`, `temperature_unit`, `temp_min_preference`, `temp_max_preference`, `notification_enabled`) VALUES
(1, 'celsius', 20, 30, TRUE);
*/

-- Cleanup expired cache entries (can be run as a scheduled job)
-- DELETE FROM `weather_cache` WHERE `expires_at` < NOW();

-- View for user dashboard summary
CREATE OR REPLACE VIEW `user_dashboard_summary` AS
SELECT
  u.`id` AS `user_id`,
  u.`name`,
  u.`email`,
  COUNT(DISTINCT f.`id`) AS `favorites_count`,
  COUNT(DISTINCT tp.`id`) AS `travel_plans_count`,
  COUNT(DISTINCT CASE WHEN tp.`start_date` >= CURDATE() THEN tp.`id` END) AS `upcoming_plans_count`,
  COUNT(DISTINCT CASE WHEN tp.`end_date` < CURDATE() THEN tp.`id` END) AS `past_plans_count`,
  MAX(sh.`searched_at`) AS `last_search_at`
FROM `users` u
LEFT JOIN `favorites` f ON u.`id` = f.`user_id`
LEFT JOIN `travel_plans` tp ON u.`id` = tp.`user_id`
LEFT JOIN `search_history` sh ON u.`id` = sh.`user_id`
GROUP BY u.`id`, u.`name`, u.`email`;