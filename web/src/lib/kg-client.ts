const KG_SERVICE_URL = process.env.KG_SERVICE_URL || "http://localhost:8000";

export interface LessonGenerateRequest {
  children: {
    id: string;
    name: string;
    grade: string;
    age: number;
    standards_opt_in: boolean;
  }[];
  interest: string;
  subjects: string[];
  philosophy: string;
  state: string | null;
  multi_subject_optimize: boolean;
  past_lesson_hashes: string[];
}

export interface GeneratedLesson {
  title: string;
  subjects: string[];
  grade_levels: string[];
  standards_addressed: {
    code: string;
    description: string;
    subject: string;
    child_name: string;
  }[];
  learning_objectives: string[];
  materials: { item: string; alternative: string | null }[];
  estimated_duration: string;
  introduction: string;
  main_activity: string;
  discussion_questions: string[];
  assessment: string;
  extensions: string[];
  philosophy_note: string;
  content_hash: string;
}

export interface StandardItem {
  code: string;
  description: string;
  description_plain: string;
  domain: string;
  cluster: string;
}

export async function generateLesson(
  req: LessonGenerateRequest
): Promise<GeneratedLesson> {
  const res = await fetch(`${KG_SERVICE_URL}/generate-lesson`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`KG service error: ${res.status}`);
  return res.json();
}

export async function getStandards(
  state: string,
  grade: string,
  subject: string
): Promise<StandardItem[]> {
  const res = await fetch(
    `${KG_SERVICE_URL}/standards/${state}/${grade}/${subject}`
  );
  if (!res.ok) throw new Error(`KG service error: ${res.status}`);
  return res.json();
}

export async function getProgress(
  childId: string,
  completedStandardCodes: string[]
): Promise<{
  subjects: {
    name: string;
    total: number;
    covered: number;
    standards: { code: string; description: string; covered: boolean }[];
  }[];
}> {
  const params = new URLSearchParams();
  completedStandardCodes.forEach((c) => params.append("completed", c));
  const res = await fetch(
    `${KG_SERVICE_URL}/progress/${childId}?${params.toString()}`
  );
  if (!res.ok) throw new Error(`KG service error: ${res.status}`);
  return res.json();
}
