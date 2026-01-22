-- Galamsey Monitor D1 Seed Data
-- Run with: wrangler d1 execute galamsey-db --file=./scripts/d1-seed.sql

-- ============================================
-- Sample Incidents Data for Ghana
-- ============================================

INSERT INTO incidents (title, description, latitude, longitude, region, district, reported_by, severity, incident_type, status, verification_status) VALUES
('Large-scale illegal mining operation detected', 'Multiple excavators and washing plants spotted in forest reserve. Significant land degradation observed over approximately 50 hectares.', 6.1256, -1.8521, 'Ashanti', 'Amansie West', 'Community Leader', 'critical', 'illegal_mining', 'active', 'pending'),
('River Ankobra pollution incident', 'Water has turned brown/orange color. Fish deaths reported downstream. Local fishermen unable to work.', 5.2156, -2.1234, 'Western', 'Prestea-Huni Valley', 'Fisherman Association', 'high', 'water_pollution', 'investigating', 'pending'),
('Forest clearing for mining', 'Approximately 20 hectares of forest cleared for galamsey activities. Native trees destroyed.', 6.3521, -2.0123, 'Western North', 'Bibiani-Anhwiaso-Bekwai', 'Environmental NGO', 'high', 'deforestation', 'active', 'pending'),
('Farmland destroyed by mining', 'Cocoa farm completely destroyed by illegal miners. Farmer lost entire livelihood. Deep pits left unfilled.', 6.5432, -1.6234, 'Ashanti', 'Obuasi Municipal', 'Affected Farmer', 'medium', 'land_degradation', 'active', 'pending'),
('Night-time mining operations', 'Illegal mining activities continuing at night using generators and lights. Community disturbed.', 5.9876, -1.9543, 'Central', 'Upper Denkyira East', 'Anonymous', 'medium', 'illegal_mining', 'active', 'pending'),
('River Pra contamination', 'Heavy metal contamination detected in River Pra. Children reported skin rashes after contact with water.', 5.7654, -1.5678, 'Central', 'Twifo-Atti Morkwa', 'Health Worker', 'critical', 'water_pollution', 'investigating', 'pending'),
('Excavator operation near school', 'Mining excavators operating within 500 meters of primary school. Safety concerns for children.', 6.0123, -2.3456, 'Western', 'Tarkwa-Nsuaem', 'School Headmaster', 'high', 'illegal_mining', 'active', 'pending'),
('Resolved site now active again', 'Previously closed mining site has resumed operations. New workers and equipment observed.', 6.4321, -1.8765, 'Ashanti', 'Bekwai Municipal', 'District Assembly Member', 'medium', 'illegal_mining', 'active', 'pending'),
('Birim River heavily polluted', 'Birim River water unusable. Color changed to muddy brown. Community water source destroyed.', 6.1789, -0.6543, 'Eastern', 'Birim North', 'Water Company', 'critical', 'water_pollution', 'active', 'pending'),
('Mining in protected forest', 'Illegal mining activities detected inside Atewa Forest Reserve. Endangered species habitat threatened.', 6.2234, -0.5789, 'Eastern', 'Atewa', 'Forest Guard', 'critical', 'deforestation', 'investigating', 'pending');

-- ============================================
-- Sample Water Quality Data
-- ============================================

INSERT INTO water_quality (water_body_name, latitude, longitude, region, ph_level, turbidity_ntu, mercury_level_ppb, arsenic_level_ppb, quality_status, measured_by) VALUES
('River Pra', 5.8234, -1.4567, 'Central', 5.2, 450, 8.5, 12.3, 'hazardous', 'Water Resources Commission'),
('River Ankobra', 5.1567, -2.0876, 'Western', 6.1, 280, 4.2, 6.7, 'polluted', 'EPA Ghana'),
('River Birim', 6.1234, -0.6789, 'Eastern', 5.8, 520, 11.2, 15.8, 'hazardous', 'EPA Ghana'),
('River Offin', 6.5678, -1.7890, 'Ashanti', 6.5, 180, 2.1, 3.2, 'moderate', 'Community Monitor'),
('Lake Bosomtwe', 6.5039, -1.4125, 'Ashanti', 7.2, 15, 0.3, 0.5, 'safe', 'Tourism Authority'),
('River Tano', 7.0123, -2.5678, 'Bono', 6.8, 95, 1.5, 2.1, 'moderate', 'Water Resources Commission'),
('River Densu', 5.7890, -0.3456, 'Greater Accra', 6.2, 220, 3.8, 5.2, 'polluted', 'EPA Ghana'),
('River Bia', 6.2345, -3.0123, 'Western North', 5.5, 380, 7.2, 9.8, 'hazardous', 'NGO WaterAid');

-- ============================================
-- Sample Mining Sites Data
-- ============================================

INSERT INTO mining_sites (name, latitude, longitude, region, district, estimated_area_hectares, status) VALUES
('Amansie West Site A', 6.1234, -1.8765, 'Ashanti', 'Amansie West', 45.5, 'active'),
('Prestea Mining Zone', 5.4321, -2.1432, 'Western', 'Prestea-Huni Valley', 78.2, 'active'),
('Obuasi Illegal Site', 6.1876, -1.6789, 'Ashanti', 'Obuasi Municipal', 32.8, 'active'),
('Tarkwa Forest Site', 5.3012, -1.9876, 'Western', 'Tarkwa-Nsuaem', 55.0, 'active'),
('Birim River Zone', 6.0987, -0.7654, 'Eastern', 'Birim North', 28.3, 'active'),
('Denkyira East Site', 5.9543, -1.8234, 'Central', 'Upper Denkyira East', 41.7, 'active'),
('Remediated Bekwai Site', 6.4567, -1.5678, 'Ashanti', 'Bekwai Municipal', 22.1, 'remediated'),
('Inactive Atiwa Site', 6.2567, -0.6123, 'Eastern', 'Atewa', 18.5, 'inactive');

-- ============================================
-- Default Admin User
-- Password: admin123 (hashed with bcrypt, rounds=10)
-- IMPORTANT: Change this password immediately after deployment!
-- ============================================

INSERT OR IGNORE INTO users (email, password_hash, name, role, verified, email_verified) VALUES
('admin@galamsey.gov.gh', '$2a$10$rEQC.3yON3qY8q5g5eE5qOO5XLR3IQQA6QJhqUHVYe0OOQzR5qH6C', 'System Administrator', 'admin', 1, 1);

-- Record the seed
INSERT OR IGNORE INTO migrations (name) VALUES ('002_seed_data');
