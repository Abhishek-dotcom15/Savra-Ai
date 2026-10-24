-- Add missing subjects to existing database
-- Uses ON CONFLICT (code) DO NOTHING to safely skip any that already exist
INSERT INTO subjects (id, name, code)
VALUES
  (gen_random_uuid(), 'Hindi', 'HIN'),
  (gen_random_uuid(), 'Social Science', 'SOC'),
  (gen_random_uuid(), 'Physical Education', 'PE'),
  (gen_random_uuid(), 'Political Science', 'POLS'),
  (gen_random_uuid(), 'Psychology', 'PSY'),
  (gen_random_uuid(), 'Accountancy', 'ACC'),
  (gen_random_uuid(), 'Business Studies', 'BUS'),
  (gen_random_uuid(), 'Economics', 'ECO'),
  (gen_random_uuid(), 'Sociology', 'SOCL'),
  (gen_random_uuid(), 'Legal Studies', 'LAW'),
  (gen_random_uuid(), 'Music', 'MUS')
ON CONFLICT (code) DO NOTHING;
