-- Guarantees at least one row so parquet writer doesn't fail.
-- The placeholder is filtered out of all page queries by date or id.
select id, "userId" as user_id, email, category, message, "createdAt" as created_at
from "Feedback"
union all
select '__placeholder__'::text, null::text, '__none__'::text, '__none__'::text, ''::text, '1970-01-01'::timestamp
