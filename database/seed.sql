-- Seed data for Weather Travel Planner
-- Run this after schema.sql
-- Note: These are sample users with hashed passwords for development only
-- Default password for all users: "password123"
-- BCrypt hash generated with cost factor 12

USE `weather_travel_planner`;

-- Clear existing data (use with caution in production!)
-- DELETE FROM `weather_cache`;
-- DELETE FROM `search_history`;
-- DELETE FROM `travel_plans`;
-- DELETE FROM `favorites`;
-- DELETE FROM `user_preferences`;
-- DELETE FROM `users`;

-- Insert sample users
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`) VALUES
(1, 'Test User', 'test@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S'),
(2, 'Demo User', 'demo@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S'),
(3, 'Alex Johnson', 'alex@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S');

-- Insert sample favorites
INSERT IGNORE INTO `favorites` (`user_id`, `location_name`, `country`, `region`, `lat`, `lon`) VALUES
(1, 'Chennai', 'India', 'Tamil Nadu', 13.0827, 80.2707),
(1, 'Bengaluru', 'India', 'Karnataka', 12.9716, 77.5946),
(1, 'London', 'United Kingdom', 'England', 51.5074, -0.1278),
(2, 'New York', 'United States', 'New York', 40.7128, -74.0060),
(2, 'Tokyo', 'Japan', 'Tokyo', 35.6762, 139.6503),
(3, 'Sydney', 'Australia', 'New South Wales', -33.8688, 151.2093),
(3, 'Paris', 'France', 'Île-de-France', 48.8566, 2.3522);

-- Insert sample travel plans
INSERT IGNORE INTO `travel_plans` (`id`, `user_id`, `destination`, `destination_country`, `start_date`, `end_date`, `notes`) VALUES
(1, 1, 'Goa', 'India', '2025-12-20', '2025-12-27', 'Beach vacation with friends - North Goa beaches and nightlife'),
(2, 1, 'Paris', 'France', '2026-03-15', '2026-03-22', 'Spring trip to Paris - Eiffel Tower, Louvre, Seine cruise'),
(3, 2, 'Bali', 'Indonesia', '2025-11-10', '2025-11-20', 'Honeymoon trip - Ubud, Seminyak, Nusa Penida'),
(4, 2, 'Swiss Alps', 'Switzerland', '2026-01-05', '2026-01-12', 'Skiing trip - Zermatt and St. Moritz'),
(5, 3, 'Great Barrier Reef', 'Australia', '2025-10-01', '2025-10-10', 'Diving and snorkeling adventure - Cairns base');

-- Insert sample user preferences
INSERT IGNORE INTO `user_preferences` (`user_id`, `temperature_unit`, `preferred_activities`, `temp_min_preference`, `temp_max_preference`, `notification_enabled`) VALUES
(1, 'celsius', '["beach", "hiking", "sightseeing", "photography"]', 20, 30, TRUE),
(2, 'fahrenheit', '["skiing", "museums", "fine dining", "shopping"]', 68, 86, FALSE),
(3, 'celsius', '["diving", "surfing", "nature walks", "wildlife"]', 22, 32, TRUE);

-- Insert sample search history
INSERT IGNORE INTO `search_history` (`user_id`, `search_query`, `result_count`) VALUES
(1, 'Chennai', 1),
(1, 'Bengaluru weather', 1),
(1, 'London', 1),
(1, 'Mumbai', 1),
(2, 'New York', 1),
(2, 'Tokyo weather forecast', 1),
(3, 'Sydney', 1),
(3, 'Paris', 1),
(3, 'Melbourne', 1);

-- Verify seed data
SELECT 'Users' AS table_name, COUNT(*) AS count FROM `users`
UNION ALL SELECT 'Favorites', COUNT(*) FROM `favorites`
UNION ALL SELECT 'Travel Plans', COUNT(*) FROM `travel_plans`
UNION ALL SELECT 'User Preferences', COUNT(*) FROM `user_preferences`
UNION ALL SELECT 'Search History', COUNT(*) FROM `search_history`;