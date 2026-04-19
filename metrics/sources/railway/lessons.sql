select id, "userId" as user_id, philosophy,
       array_to_string("subjectNames", '|') as subject_names_joined,
       "multiSubjectOptimized" as multi_subject_optimized,
       "generationCostUsd" as generation_cost_usd,
       favorite, "contentHash" as content_hash, "createdAt" as created_at
from "Lesson"
