-- Add Lavender's Blue Homeschool curriculum
INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) VALUES (
  gen_random_uuid(),
  'Lavender''s Blue Homeschool',
  'Lavender''s Blue Homeschool',
  'Secular Waldorf-inspired curriculum with detailed daily lesson plans featuring main lesson blocks, form drawing, watercolor painting, beeswax modeling, handwork, and recorder. Created by a former kindergarten teacher with a background in developmental neuropsychology. Includes MP3 audio tracks, community membership, and step-by-step guidance for bringing Waldorf to life at home.',
  ARRAY['math', 'literacy', 'science', 'social_studies'],
  'K–4',
  '{"montessori": 0.1, "waldorf": 0.95, "project_based": 0.1, "place_nature": 0.4, "classical": 0.05, "charlotte_mason": 0.35, "unschooling": 0.15, "adaptive": 0.1}'::jsonb,
  'moderate',
  'secular',
  'none',
  '$217-267/year',
  0.92,
  'https://www.lavendersbluehomeschool.com/',
  ARRAY['individual', 'co-op'],
  'Highly detailed secular Waldorf curriculum. Kindergarten is 464 pages + 75 MP3s; First Grade is 541 pages + 63 MP3s; Second Grade is 735 pages + 59 MP3s. Created by Kelly, a former mixed-age kindergarten teacher with developmental neuropsychology background. Emphasizes rhythm, imagination, and play. Digital format (view online, download, or print). Community membership included. Fourth grade in development.',
  true
) ON CONFLICT ("id") DO NOTHING;
