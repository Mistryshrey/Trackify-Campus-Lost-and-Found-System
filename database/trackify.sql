-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS trackify_db;
USE trackify_db;

-- --------------------------------------------------------
-- Table structure for table `users`
-- Note: Created as a fallback based on get_matches.php logic
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert a default dummy user to satisfy the default user_id = 1 in save scripts
INSERT IGNORE INTO `users` (`user_id`, `email`) VALUES (1, 'default@trackify.local');

-- --------------------------------------------------------
-- Table structure for table `lost_items`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lost_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL DEFAULT 1,
  `verification_code` varchar(10) NOT NULL,
  `category` varchar(50) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `color` varchar(50) NOT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `location_lost` varchar(200) NOT NULL,
  `lost_date` date NOT NULL,
  `lost_time` time DEFAULT NULL,
  `verification_type` varchar(50) NOT NULL,
  `verification_question` varchar(255) NOT NULL,
  `verification_answer_hash` varchar(255) NOT NULL,
  `contact_name` varchar(100) NOT NULL,
  `contact_email` varchar(150) NOT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `additional_info` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`item_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_lost_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `found_items`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `found_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL DEFAULT 1,
  `verification_code` varchar(10) NOT NULL,
  `category` varchar(50) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `color` varchar(50) NOT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `location_found` varchar(200) NOT NULL,
  `found_date` date NOT NULL,
  `found_time` time DEFAULT NULL,
  `storage_location` varchar(200) DEFAULT NULL,
  `contact_name` varchar(100) NOT NULL,
  `contact_email` varchar(150) NOT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `additional_info` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`item_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_found_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `matches`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `matches` (
  `match_id` int(11) NOT NULL AUTO_INCREMENT,
  `lost_item_id` int(11) NOT NULL,
  `found_item_id` int(11) NOT NULL,
  `match_status` varchar(20) NOT NULL DEFAULT 'pending',
  `match_score` int(11) NOT NULL DEFAULT 0, 
  `match_date` datetime NOT NULL,
  `claim_date` datetime DEFAULT NULL,
  `failed_attempts` int(11) NOT NULL DEFAULT 0,
  `is_locked` tinyint(1) NOT NULL DEFAULT 0,
  `locked_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`match_id`),
  KEY `lost_item_id` (`lost_item_id`),
  KEY `found_item_id` (`found_item_id`),
  CONSTRAINT `fk_match_lost` FOREIGN KEY (`lost_item_id`) REFERENCES `lost_items` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_match_found` FOREIGN KEY (`found_item_id`) REFERENCES `found_items` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `verification_attempts`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `verification_attempts` (
  `attempt_id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `user_email` varchar(150) NOT NULL,
  `verification_code_entered` varchar(50) NOT NULL,
  `secret_answer_entered` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `was_successful` tinyint(1) NOT NULL DEFAULT 0,
  `attempt_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`attempt_id`),
  KEY `match_id` (`match_id`),
  CONSTRAINT `fk_attempt_match` FOREIGN KEY (`match_id`) REFERENCES `matches` (`match_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;