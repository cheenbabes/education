-- Batch add 14 new curricula
INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'Christopherus Homeschool Resources', 'Christopherus Homeschool Resources (Donna Simmons)',
  'One of the original Waldorf homeschool curricula with deep Steiner/Anthroposophical grounding. Complete grade-by-grade curriculum covering all subjects through main lesson blocks, form drawing, watercolor, handwork, and seasonal rhythms.',
  ARRAY['math','literacy','science','social_studies'], 'K–8',
  '{"montessori": 0.1, "waldorf": 0.95, "project_based": 0.1, "place_nature": 0.3, "classical": 0.05, "charlotte_mason": 0.2, "unschooling": 0.1, "adaptive": 0.05}'::jsonb, 'moderate', 'anthroposophical', 'philosophical',
  '$150-300/year', 0.88, 'https://www.christopherushomeschool.com/',
  ARRAY['individual'], 'One of the oldest Waldorf homeschool curricula. Donna Simmons is a trained Waldorf teacher. Includes consulting component. Deep Steiner philosophy grounding.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'Christopherus Homeschool Resources' AND "publisher" = 'Christopherus Homeschool Resources (Donna Simmons)');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'Live Education', 'Live Education',
  'Complete Waldorf curriculum packages sold as physical sets per grade. WASC-accredited. Covers all core subjects through the Waldorf developmental approach with main lesson blocks, arts integration, and seasonal rhythms.',
  ARRAY['math','literacy','science','social_studies'], 'K–8',
  '{"montessori": 0.1, "waldorf": 0.9, "project_based": 0.1, "place_nature": 0.25, "classical": 0.05, "charlotte_mason": 0.15, "unschooling": 0.05, "adaptive": 0.05}'::jsonb, 'moderate', 'anthroposophical', 'philosophical',
  '$300-500/year', 0.85, 'https://www.live-education.com/',
  ARRAY['individual','co-op'], 'WASC-accredited Waldorf curriculum. Complete physical curriculum sets per grade.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'Live Education' AND "publisher" = 'Live Education');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'Logos Press Homeschool Bundles', 'Logos Press (Canon Press)',
  'Pioneer of classical Christian education since 1981. Complete curriculum bundles for grades 1-6 with daily lesson plans covering math, science, English, grammar, literature, history, Bible, and Latin starting in 3rd grade.',
  ARRAY['math','literacy','science','social_studies'], '1–6',
  '{"montessori": 0.05, "waldorf": 0.05, "project_based": 0.1, "place_nature": 0.0, "classical": 0.9, "charlotte_mason": 0.2, "unschooling": 0.0, "adaptive": 0.1}'::jsonb, 'open-and-go', 'christian', 'deep',
  '$470-1160/year', 0.87, 'https://logospressonline.com/',
  ARRAY['individual','co-op'], 'Associated with Douglas Wilson and Logos School, Moscow, Idaho. Pioneer of classical Christian ed revival. Daily lesson plans included. Latin starts grade 3.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'Logos Press Homeschool Bundles' AND "publisher" = 'Logos Press (Canon Press)');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'The Gentle + Classical Press', 'The Gentle + Classical Press',
  'The gentlest classical option for young children, blending Charlotte Mason''s literature-rich methods with classical trivium structure. Covers language arts, history, science, nature study, poetry, art, and music.',
  ARRAY['literacy','science','social_studies'], 'Pre-K–6',
  '{"montessori": 0.1, "waldorf": 0.1, "project_based": 0.05, "place_nature": 0.15, "classical": 0.55, "charlotte_mason": 0.6, "unschooling": 0.0, "adaptive": 0.15}'::jsonb, 'low', 'christian', 'moderate',
  '$27-45/product', 0.84, 'https://shopgentleclassical.com/',
  ARRAY['individual','co-op'], 'Multiple award winner. Blends CM methods with classical structure. Math and reading programs must be sourced separately for K-6. Preschool curriculum available for ages 2-4.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'The Gentle + Classical Press' AND "publisher" = 'The Gentle + Classical Press');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'Build Your Library', 'Build Your Library (Emily Cook)',
  'The most established secular Charlotte Mason curriculum. 36-week PDF lesson plans covering history, literature, poetry, science, art, nature study, and composer/artist study. Chronological history progression across all levels.',
  ARRAY['literacy','science','social_studies'], 'K–12',
  '{"montessori": 0.05, "waldorf": 0.05, "project_based": 0.1, "place_nature": 0.25, "classical": 0.2, "charlotte_mason": 0.85, "unschooling": 0.15, "adaptive": 0.2}'::jsonb, 'low', 'secular', 'none',
  '$30-60/year', 0.9, 'https://buildyourlibrary.com/',
  ARRAY['individual','co-op'], 'Created by Emily Cook, 21-year homeschool veteran and co-founder of SEA Homeschoolers. Secular. Math and grammar sourced separately. Books from library. Author of ''A Literary Education''.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'Build Your Library' AND "publisher" = 'Build Your Library (Emily Cook)');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'Wildwood Curriculum', 'Wildwood Curriculum (volunteer parents)',
  'Modern secular Charlotte Mason curriculum with deliberately diverse, modern book selections. Covers history, geography, literature, science, nature study, art, music, poetry, and handicrafts.',
  ARRAY['literacy','science','social_studies'], 'Ages 6–12',
  '{"montessori": 0.05, "waldorf": 0.05, "project_based": 0.05, "place_nature": 0.3, "classical": 0.15, "charlotte_mason": 0.9, "unschooling": 0.15, "adaptive": 0.15}'::jsonb, 'moderate', 'secular', 'none',
  'Free', 0.82, 'https://wildwoodcurriculum.com/',
  ARRAY['individual','co-op'], 'Free. Deliberately chooses books that are secular, modern, and respectful of minorities, indigenous peoples, and women. US, Canadian, and India versions. Companion podcast: Stonechats.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'Wildwood Curriculum' AND "publisher" = 'Wildwood Curriculum (volunteer parents)');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'Mater Amabilis', 'Dr. Kathryn Faulkner & Michele Quigley',
  'The premier Catholic Charlotte Mason curriculum, free and online since 2004. Based directly on Mason''s Parents'' Union School programmes. Covers all CM subjects including history, geography, science, literature, religion, poetry, artist/composer study.',
  ARRAY['literacy','science','social_studies'], 'Pre-K–12',
  '{"montessori": 0.05, "waldorf": 0.05, "project_based": 0.05, "place_nature": 0.25, "classical": 0.25, "charlotte_mason": 0.95, "unschooling": 0.05, "adaptive": 0.05}'::jsonb, 'moderate', 'christian', 'deep',
  'Free', 0.86, 'http://materamabilis.org/',
  ARRAY['individual','co-op'], 'Free Catholic CM curriculum. Named after the Catholic parish in Ambleside, England where Charlotte Mason lived. Literature-rich with extensive read-aloud lists. Thousands of families use it.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'Mater Amabilis' AND "publisher" = 'Dr. Kathryn Faulkner & Michele Quigley');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'Living Books Press', 'Living Books Press (Sheila Carroll)',
  'Charlotte Mason curriculum with 20+ years of development. Week-by-week teaching guides covering Bible, language arts, history, geography, science, nature study, art, and music. 100% of proceeds fund schools educating 750 children in Africa.',
  ARRAY['literacy','science','social_studies'], 'K–8',
  '{"montessori": 0.05, "waldorf": 0.05, "project_based": 0.05, "place_nature": 0.25, "classical": 0.15, "charlotte_mason": 0.9, "unschooling": 0.05, "adaptive": 0.1}'::jsonb, 'low', 'christian', 'moderate',
  '$100-145/year', 0.85, 'https://charlottemasonhomeschooling.com/',
  ARRAY['individual','co-op'], '100% of proceeds support schools in Africa. Created by Sheila Carroll with master''s degrees in Educational Leadership and Children''s Literature. Math recommended separately (Singapore Math or Math-U-See).', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'Living Books Press' AND "publisher" = 'Living Books Press (Sheila Carroll)');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'A Mind in the Light', 'A Mind in the Light',
  'Secular Charlotte Mason curriculum with some classical methods. Organized by historical time period with teaching guides covering science, natural history, literature, tales, poetry, art, music, Plutarch, and citizenship.',
  ARRAY['literacy','science','social_studies'], 'Ages 5–14+',
  '{"montessori": 0.05, "waldorf": 0.05, "project_based": 0.1, "place_nature": 0.2, "classical": 0.25, "charlotte_mason": 0.8, "unschooling": 0.1, "adaptive": 0.15}'::jsonb, 'moderate', 'secular', 'none',
  '$80+/year', 0.83, 'https://www.amindinthelight.com/',
  ARRAY['individual','co-op'], 'Secular CM with some classical methods. Includes French, German, and Latin resources. Still growing — creator building out all historical periods.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'A Mind in the Light' AND "publisher" = 'A Mind in the Light');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'Wayfarers', 'Barefoot Meandering / Barefoot Ragamuffin Curricula',
  'A ''Classical Mason'' blend — four-year historical cycle covering all subjects for the whole family in one guide. Daily lesson plans for three age groups on 2-page spreads. Secular but inclusive of optional religious readings.',
  ARRAY['literacy','science','social_studies'], 'Pre-K–12',
  '{"montessori": 0.05, "waldorf": 0.05, "project_based": 0.1, "place_nature": 0.15, "classical": 0.45, "charlotte_mason": 0.65, "unschooling": 0.05, "adaptive": 0.15}'::jsonb, 'low', 'secular', 'none',
  '$30-60/volume', 0.82, 'http://barefootmeandering.com/',
  ARRAY['individual','co-op'], 'Four volumes: Ancient, Medieval, Revolution, Modern. One guide covers the whole family. Secular but includes optional readings from multiple religious traditions. Free 3-week samples available.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'Wayfarers' AND "publisher" = 'Barefoot Meandering / Barefoot Ragamuffin Curricula');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'KONOS Character Curriculum', 'KONOS, Inc. (Jessica Hulcy & Carole Thaxton)',
  'The first curriculum written specifically for homeschool (1983). Hands-on, multi-age unit studies centered on character traits integrating science, social studies, art, music, literature, and health. Each unit revolves around a character trait studied for 1-2 months.',
  ARRAY['science','social_studies','literacy'], 'K–12',
  '{"montessori": 0.2, "waldorf": 0.1, "project_based": 0.8, "place_nature": 0.15, "classical": 0.1, "charlotte_mason": 0.25, "unschooling": 0.1, "adaptive": 0.2}'::jsonb, 'moderate', 'christian', 'moderate',
  '$99-225/volume', 0.83, 'https://konos.com/',
  ARRAY['individual','co-op','micro-school'], 'First homeschool curriculum (1983). Three volumes with 30 interchangeable units. Character-trait-based. Math/spelling/grammar purchased separately. Multi-age design for teaching all children together.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'KONOS Character Curriculum' AND "publisher" = 'KONOS, Inc. (Jessica Hulcy & Carole Thaxton)');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'Five in a Row', 'Five in a Row Publishing (Jane Claire Lambert)',
  'Award-winning literature-based curriculum where each week centers on one outstanding children''s book, extracting lessons in five subject areas across five days. Gentle, affordable, and beloved by homeschool families for decades.',
  ARRAY['literacy','science','social_studies','math'], 'Ages 2–12+',
  '{"montessori": 0.1, "waldorf": 0.1, "project_based": 0.55, "place_nature": 0.15, "classical": 0.05, "charlotte_mason": 0.6, "unschooling": 0.2, "adaptive": 0.3}'::jsonb, 'low', 'secular', 'none',
  '$49-100/year', 0.88, 'https://fiveinarow.com/',
  ARRAY['individual','co-op'], 'Before FIAR (ages 2-4), Volumes 1-3 (ages 5-9), Volumes 4-8 (ages 9-12+). Optional Bible supplement sold separately. Math/phonics supplements needed for early grades. Books sourced from library.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'Five in a Row' AND "publisher" = 'Five in a Row Publishing (Jane Claire Lambert)');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'Keys of the Universe', 'Keys of the Universe',
  'The most comprehensive Montessori elementary curriculum for homeschoolers. Complete downloadable albums for all subjects — mathematics, geometry, geography, history, biology, language/literature, art, and music — with video instruction and community support.',
  ARRAY['math','literacy','science','social_studies'], 'Ages 6–12',
  '{"montessori": 0.95, "waldorf": 0.05, "project_based": 0.2, "place_nature": 0.15, "classical": 0.05, "charlotte_mason": 0.1, "unschooling": 0.2, "adaptive": 0.1}'::jsonb, 'moderate', 'secular', 'none',
  '$415-455', 0.9, 'https://keysoftheuniverse.com/',
  ARRAY['individual'], 'Complete Montessori Cosmic Education albums. One-time purchase with permanent access and updates. No prior Montessori training needed. Active support community included.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'Keys of the Universe' AND "publisher" = 'Keys of the Universe');

INSERT INTO "Curriculum" (
  "id", "name", "publisher", "description", "subjects", "gradeRange",
  "philosophyScores", "prepLevel", "religiousType", "faithDepth",
  "priceRange", "qualityScore", "affiliateUrl", "settingFit", "notes", "active"
) SELECT
  gen_random_uuid(), 'Multisori', 'Multisori',
  'Authentic Montessori curriculum designed for parents without certification. Covers language arts, mathematics, practical life, science, geography/culture, art, and sensorial activities. All manipulatives are printable — no expensive Montessori materials needed.',
  ARRAY['math','literacy','science','social_studies'], 'Ages 2.5–6.5',
  '{"montessori": 0.9, "waldorf": 0.05, "project_based": 0.1, "place_nature": 0.1, "classical": 0.05, "charlotte_mason": 0.05, "unschooling": 0.15, "adaptive": 0.1}'::jsonb, 'open-and-go', 'secular', 'none',
  '$499', 0.85, 'https://multisori.com/',
  ARRAY['individual'], 'One-time purchase. All manipulatives printable. Claims children exit performing 2 years above grade level. Free group coaching included. Scholarship program available.', true
WHERE NOT EXISTS (SELECT 1 FROM "Curriculum" WHERE "name" = 'Multisori' AND "publisher" = 'Multisori');
