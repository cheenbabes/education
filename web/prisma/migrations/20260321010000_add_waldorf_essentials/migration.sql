-- Add Waldorf Essentials curriculum
INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) VALUES (
  gen_random_uuid(),
  'Waldorf Essentials',
  'Waldorf Essentials (Melisa Nielsen, LLC)',
  'Complete Waldorf-inspired homeschool curriculum featuring main lesson blocks, form drawing, watercolor painting, handwork, and circle time. Includes Thinking-Feeling-Willing teacher training, weekly coaching calls, and community support. Written by homeschoolers for homeschoolers with 14+ years of experience.',
  ARRAY['math', 'literacy', 'science', 'social_studies'],
  '1–8',
  '{"montessori": 0.15, "waldorf": 0.95, "project_based": 0.15, "place_nature": 0.35, "classical": 0.05, "charlotte_mason": 0.3, "unschooling": 0.1, "adaptive": 0.1}'::jsonb,
  'moderate',
  'secular-inclusive',
  'cultural-historical',
  '$200-400/year',
  0.88,
  'https://www.waldorfessentials.com/',
  ARRAY['individual', 'co-op'],
  'The most comprehensive Waldorf-specific homeschool curriculum available. Explores world religions culturally (not devotionally) as part of the Waldorf tradition. Includes TFW (Thinking-Feeling-Willing) teacher training with 17 modules. Hard copy and online formats. Coaching calls included with curriculum purchase.',
  true
) ON CONFLICT ("id") DO NOTHING;
