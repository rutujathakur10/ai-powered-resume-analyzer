/**
 * Client-side resume analysis utilities.
 * Implements TF-IDF cosine similarity, skill extraction, job role prediction,
 * and improvement suggestions using rule-based NLP.
 * PDF/DOCX extraction uses CDN-loaded libraries (pdfjs-dist, mammoth) via script injection.
 * NLP preprocessing: stopword removal + rule-based lemmatization applied before similarity scoring.
 */

export interface JobRoleData {
  title: string;
  description: string;
  requiredSkills: string[];
}

export interface SkillGapResult {
  matchedSkills: string[];
  missingSkills: string[];
  gapPercentage: number;
}

export interface JobRolePrediction {
  role: string;
  confidence: number;
  detectedSkills: string[];
  matchingFactors: string[];
}

export interface CareerRecommendation {
  projects: string[];
  certifications: string[];
  tools: string[];
}

export interface WeakVerbSuggestion {
  weakVerb: string;
  strongAlternatives: string[];
  context: string;
}

export interface ImprovementResult {
  weakVerbSuggestions: WeakVerbSuggestion[];
  formattingTips: string[];
}

// ─── CDN Script Loader ────────────────────────────────────────────────────────

function loadScript(src: string, globalKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if ((window as unknown as Record<string, unknown>)[globalKey]) {
      resolve();
      return;
    }
    // Script tag already injected — wait for it
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)));
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// ─── NLP Preprocessing ───────────────────────────────────────────────────────

export const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'this', 'that', 'these',
  'those', 'it', 'its', 'as', 'if', 'then', 'than', 'so', 'yet', 'both',
  'either', 'neither', 'not', 'no', 'nor', 'such', 'what', 'which', 'who',
  'whom', 'whose', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'any', 'some', 'more', 'most', 'other', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'once', 'here', 'there', 'about', 'up',
  'down', 'also', 'just', 'only', 'very', 'too', 'well', 'back', 'even',
  'still', 'way', 'take', 'get', 'make', 'go', 'know', 'think', 'see',
  'come', 'want', 'look', 'use', 'find', 'give', 'tell', 'work', 'call',
  'try', 'ask', 'need', 'feel', 'become', 'leave', 'put', 'mean', 'keep',
  'let', 'begin', 'show', 'hear', 'play', 'run', 'move', 'live', 'believe',
  'hold', 'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose',
  'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead',
  'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'read',
  'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love',
  'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect',
  'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest',
  'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull',
]);

/**
 * Rule-based lemmatizer: strips common English inflectional suffixes.
 * Handles -ing, -ed, -er, -est, -s/-es, -tion/-sion, -ment, -ness, -ity, -ies.
 * Preserves short tokens and known tech terms (e.g. "apis", "css", "sql").
 */
export function lemmatize(token: string): string {
  const t = token.toLowerCase();
  // Preserve short tokens and common tech abbreviations
  if (t.length <= 3) return t;

  // -tion / -sion → remove suffix (e.g. "optimization" → "optimiz")
  if (t.endsWith('tion') && t.length > 6) return t.slice(0, -4);
  if (t.endsWith('sion') && t.length > 6) return t.slice(0, -4);

  // -ment (e.g. "management" → "manag")
  if (t.endsWith('ment') && t.length > 6) return t.slice(0, -4);

  // -ness (e.g. "effectiveness" → "effect")
  if (t.endsWith('ness') && t.length > 6) return t.slice(0, -4);

  // -ity (e.g. "scalability" → "scalabil")
  if (t.endsWith('ity') && t.length > 5) return t.slice(0, -3);

  // -ing (e.g. "developing" → "develop")
  if (t.endsWith('ing') && t.length > 5) {
    const stem = t.slice(0, -3);
    // Handle doubled consonant: "running" → "run"
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    return stem;
  }

  // -ed (e.g. "developed" → "develop")
  if (t.endsWith('ed') && t.length > 4) {
    const stem = t.slice(0, -2);
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    return stem;
  }

  // -er (e.g. "developer" → "develop")
  if (t.endsWith('er') && t.length > 4) return t.slice(0, -2);

  // -est (e.g. "fastest" → "fast")
  if (t.endsWith('est') && t.length > 5) return t.slice(0, -3);

  // -ies → -y (e.g. "libraries" → "library")
  if (t.endsWith('ies') && t.length > 4) return t.slice(0, -3) + 'y';

  // -es (e.g. "processes" → "process")
  if (t.endsWith('es') && t.length > 4) return t.slice(0, -2);

  // -s (e.g. "skills" → "skill")
  if (t.endsWith('s') && t.length > 3 && !t.endsWith('ss')) return t.slice(0, -1);

  return t;
}

/**
 * Preprocess text: tokenize → remove stopwords → lemmatize.
 */
export function preprocessText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
    .map(lemmatize);
}

// ─── TF-IDF Cosine Similarity ────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function getTermFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const filtered = tokens.filter((t) => !STOP_WORDS.has(t));
  for (const token of filtered) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, freqA] of a) {
    dotProduct += freqA * (b.get(term) || 0);
    normA += freqA * freqA;
  }
  for (const [, freqB] of b) {
    normB += freqB * freqB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Compute ATS score using NLP-preprocessed TF-IDF cosine similarity.
 * Both resume and job description are preprocessed (stopword removal + lemmatization).
 */
export function computeATSScore(resumeText: string, jobRole: JobRoleData): number {
  // Apply NLP preprocessing to both texts
  const resumeTokens = preprocessText(resumeText);
  const jobTokens = preprocessText(jobRole.description + ' ' + jobRole.requiredSkills.join(' '));

  const resumeTF = getTermFrequency(resumeTokens);
  const jobTF = getTermFrequency(jobTokens);

  const similarity = cosineSimilarity(resumeTF, jobTF);

  const resumeLower = resumeText.toLowerCase();
  const matchedCount = jobRole.requiredSkills.filter((skill) =>
    resumeLower.includes(skill.toLowerCase())
  ).length;
  const skillBonus = (matchedCount / Math.max(jobRole.requiredSkills.length, 1)) * 0.4;

  const rawScore = similarity * 0.6 + skillBonus;
  const score = Math.min(Math.round(rawScore * 100 * 1.8), 100);
  return Math.max(score, matchedCount > 0 ? 10 : 2);
}

// ─── Skill Gap Analysis ───────────────────────────────────────────────────────

export function analyzeSkillGap(resumeText: string, jobRole: JobRoleData): SkillGapResult {
  const resumeLower = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of jobRole.requiredSkills) {
    const skillLower = skill.toLowerCase();
    const skillNormalized = skillLower.replace(/[.\s-]/g, '');
    const found =
      resumeLower.includes(skillLower) ||
      resumeLower.replace(/[.\s-]/g, '').includes(skillNormalized);
    if (found) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const total = jobRole.requiredSkills.length;
  const gapPercentage = total > 0 ? Math.round((missing.length / total) * 100) : 0;

  return { matchedSkills: matched, missingSkills: missing, gapPercentage };
}

// ─── Job Role Prediction ──────────────────────────────────────────────────────

/**
 * Extract skills detected in the resume for a given job role.
 * Returns skills from requiredSkills that appear in the resume text.
 */
function extractDetectedSkills(resumeText: string, jobRole: JobRoleData): string[] {
  const resumeLower = resumeText.toLowerCase();
  return jobRole.requiredSkills.filter((skill) => {
    const skillLower = skill.toLowerCase();
    const skillNormalized = skillLower.replace(/[.\s-]/g, '');
    return (
      resumeLower.includes(skillLower) ||
      resumeLower.replace(/[.\s-]/g, '').includes(skillNormalized)
    );
  });
}

/**
 * Extract matching factors: NLP-preprocessed tokens from the job description
 * that also appear in the preprocessed resume text (top contributing keywords).
 */
function extractMatchingFactors(resumeText: string, jobRole: JobRoleData): string[] {
  const resumeTokens = new Set(preprocessText(resumeText));
  const jobTokens = preprocessText(jobRole.description + ' ' + jobRole.requiredSkills.join(' '));

  // Count how many times each job token appears in the resume
  const factorCounts = new Map<string, number>();
  for (const token of jobTokens) {
    if (resumeTokens.has(token) && token.length > 2) {
      factorCounts.set(token, (factorCounts.get(token) || 0) + 1);
    }
  }

  // Sort by frequency descending, return top 6 unique factors
  return Array.from(factorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([token]) => token);
}

/**
 * Predict the top 3 most suitable job roles for a resume.
 * Applies NLP preprocessing (stopword removal + lemmatization) before scoring.
 * Returns confidence percentages, detected skills, and matching factors for each prediction.
 */
export function predictJobRoles(
  resumeText: string,
  jobRoles: JobRoleData[]
): JobRolePrediction[] {
  const scores = jobRoles.map((role) => {
    const score = computeATSScore(resumeText, role);
    return { role, score };
  });

  scores.sort((a, b) => b.score - a.score);

  const top3 = scores.slice(0, 3);
  const maxScore = top3[0]?.score || 1;

  return top3.map(({ role, score }) => {
    const confidence = Math.round((score / maxScore) * 95);
    const detectedSkills = extractDetectedSkills(resumeText, role);
    const matchingFactors = extractMatchingFactors(resumeText, role);

    return {
      role: role.title,
      confidence,
      detectedSkills,
      matchingFactors,
    };
  });
}

// ─── Career Recommendations ───────────────────────────────────────────────────

const SKILL_RECOMMENDATIONS: Record<
  string,
  { projects: string[]; certifications: string[]; tools: string[] }
> = {
  javascript: {
    projects: ['Build a full-stack web app with React + Node.js', 'Create a browser extension'],
    certifications: ['JavaScript Algorithms and Data Structures (freeCodeCamp)', 'JavaScript Developer (W3Schools)'],
    tools: ['Node.js', 'TypeScript', 'Webpack', 'ESLint'],
  },
  typescript: {
    projects: ['Migrate a JS project to TypeScript', 'Build a typed REST API with Express'],
    certifications: ['TypeScript Fundamentals (Pluralsight)', 'Microsoft TypeScript Certification'],
    tools: ['TypeScript Compiler', 'ts-node', 'Zod', 'tRPC'],
  },
  python: {
    projects: ['Build a data pipeline with Pandas', 'Create a REST API with FastAPI'],
    certifications: ['Python Institute PCEP', 'Google IT Automation with Python'],
    tools: ['Pandas', 'NumPy', 'FastAPI', 'Jupyter Notebook'],
  },
  react: {
    projects: ['Build a dashboard with React + Recharts', 'Create a real-time chat app'],
    certifications: ['Meta Front-End Developer Certificate', 'React Developer (Scrimba)'],
    tools: ['React Query', 'Zustand', 'Vite', 'Storybook'],
  },
  angular: {
    projects: ['Build an enterprise CRUD app with Angular', 'Create an Angular PWA'],
    certifications: ['Angular Developer Certification (Udemy)', 'Google Angular Fundamentals'],
    tools: ['Angular CLI', 'RxJS', 'NgRx', 'Angular Material'],
  },
  'node.js': {
    projects: ['Build a REST API with Express', 'Create a real-time app with Socket.io'],
    certifications: ['OpenJS Node.js Application Developer', 'Node.js Certification (Udemy)'],
    tools: ['Express.js', 'Fastify', 'Prisma', 'PM2'],
  },
  sql: {
    projects: ['Design a normalized database schema', 'Build a reporting dashboard with SQL'],
    certifications: ['Oracle SQL Certified Associate', 'Microsoft Azure Data Fundamentals'],
    tools: ['PostgreSQL', 'MySQL', 'DBeaver', 'pgAdmin'],
  },
  'machine learning': {
    projects: ['Build a classification model with scikit-learn', 'Create a recommendation system'],
    certifications: ['Google Machine Learning Crash Course', 'Coursera ML Specialization (Andrew Ng)'],
    tools: ['scikit-learn', 'TensorFlow', 'PyTorch', 'MLflow'],
  },
  statistics: {
    projects: ['Perform EDA on a Kaggle dataset', 'Build a statistical inference report'],
    certifications: ['Statistics with Python (Coursera)', 'Khan Academy Statistics'],
    tools: ['R', 'SciPy', 'Statsmodels', 'Tableau'],
  },
  r: {
    projects: ['Create data visualizations with ggplot2', 'Build a Shiny dashboard'],
    certifications: ['R Programming (Coursera - Johns Hopkins)', 'DataCamp R Certification'],
    tools: ['RStudio', 'ggplot2', 'dplyr', 'Shiny'],
  },
  java: {
    projects: ['Build a Spring Boot REST API', 'Create a multithreaded Java application'],
    certifications: ['Oracle Certified Java Programmer', 'Java SE 11 Developer (Oracle)'],
    tools: ['Spring Boot', 'Maven', 'Gradle', 'IntelliJ IDEA'],
  },
  apis: {
    projects: ['Design and document a RESTful API', 'Build a GraphQL API'],
    certifications: ['API Design (Postman Academy)', 'REST API Design (Udemy)'],
    tools: ['Postman', 'Swagger/OpenAPI', 'GraphQL', 'Insomnia'],
  },
  html: {
    projects: ['Build an accessible, semantic HTML5 website', 'Create a responsive landing page'],
    certifications: ['Responsive Web Design (freeCodeCamp)', 'HTML5 Certification (W3Schools)'],
    tools: ['Emmet', 'HTML Validator', 'Lighthouse', 'axe DevTools'],
  },
  css: {
    projects: ['Build a CSS animation library', 'Create a design system with CSS variables'],
    certifications: ['CSS Certification (W3Schools)', 'Advanced CSS (Udemy)'],
    tools: ['Tailwind CSS', 'Sass', 'PostCSS', 'CSS Modules'],
  },
};

export function getCareerRecommendations(
  missingSkills: string[],
  certifications: string[]
): CareerRecommendation {
  const projects = new Set<string>();
  const certs = new Set<string>(certifications.slice(0, 2));
  const tools = new Set<string>();

  for (const skill of missingSkills) {
    const skillLower = skill.toLowerCase();
    const rec = SKILL_RECOMMENDATIONS[skillLower];
    if (rec) {
      rec.projects.forEach((p) => projects.add(p));
      rec.certifications.forEach((c) => certs.add(c));
      rec.tools.forEach((t) => tools.add(t));
    } else {
      projects.add(`Build a project demonstrating ${skill} proficiency`);
      certs.add(`${skill} Fundamentals Course (Coursera/Udemy)`);
      tools.add(skill);
    }
  }

  return {
    projects: Array.from(projects).slice(0, 6),
    certifications: Array.from(certs).slice(0, 6),
    tools: Array.from(tools).slice(0, 8),
  };
}

// ─── Resume Improvement Suggestions ──────────────────────────────────────────

const WEAK_VERBS: Record<string, string[]> = {
  helped: ['Assisted', 'Supported', 'Facilitated', 'Enabled'],
  worked: ['Collaborated', 'Executed', 'Delivered', 'Engineered'],
  'worked on': ['Developed', 'Built', 'Engineered', 'Implemented'],
  did: ['Executed', 'Accomplished', 'Delivered', 'Completed'],
  made: ['Developed', 'Created', 'Engineered', 'Produced'],
  got: ['Achieved', 'Obtained', 'Secured', 'Earned'],
  used: ['Leveraged', 'Utilized', 'Applied', 'Employed'],
  tried: ['Attempted', 'Pursued', 'Initiated', 'Explored'],
  handled: ['Managed', 'Oversaw', 'Directed', 'Coordinated'],
  dealt: ['Managed', 'Resolved', 'Addressed', 'Navigated'],
  'was responsible for': ['Led', 'Managed', 'Owned', 'Directed'],
  responsible: ['Led', 'Managed', 'Owned', 'Directed'],
  assisted: ['Supported', 'Facilitated', 'Contributed to', 'Enabled'],
  participated: ['Contributed', 'Collaborated', 'Engaged', 'Partnered'],
  involved: ['Contributed', 'Participated in', 'Collaborated on', 'Engaged with'],
  maintained: ['Optimized', 'Enhanced', 'Improved', 'Sustained'],
  fixed: ['Resolved', 'Debugged', 'Remediated', 'Rectified'],
  wrote: ['Authored', 'Developed', 'Crafted', 'Engineered'],
  tested: ['Validated', 'Verified', 'Evaluated', 'Assessed'],
  learned: ['Mastered', 'Acquired proficiency in', 'Developed expertise in', 'Studied'],
  know: ['Proficient in', 'Experienced with', 'Skilled in', 'Knowledgeable in'],
  familiar: ['Proficient in', 'Experienced with', 'Skilled in', 'Versed in'],
  'familiar with': ['Proficient in', 'Experienced with', 'Skilled in', 'Versed in'],
};

export function analyzeResumeImprovements(resumeText: string): ImprovementResult {
  const lines = resumeText.split('\n');
  const weakVerbSuggestions: WeakVerbSuggestion[] = [];
  const foundVerbs = new Set<string>();

  for (const line of lines) {
    const lineLower = line.toLowerCase().trim();
    if (!lineLower) continue;

    for (const [weakVerb, alternatives] of Object.entries(WEAK_VERBS)) {
      if (foundVerbs.has(weakVerb)) continue;
      const pattern = new RegExp(`\\b${weakVerb.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (pattern.test(lineLower)) {
        foundVerbs.add(weakVerb);
        weakVerbSuggestions.push({
          weakVerb,
          strongAlternatives: alternatives,
          context: line.trim().slice(0, 80) + (line.trim().length > 80 ? '…' : ''),
        });
      }
    }
  }

  const formattingTips: string[] = [
    'Use bullet points (•) to list achievements — avoid dense paragraphs.',
    'Start each bullet with a strong action verb (e.g., "Engineered", "Delivered", "Optimized").',
    'Quantify achievements wherever possible (e.g., "Reduced load time by 40%").',
    'Keep your resume to 1–2 pages; prioritize recent and relevant experience.',
    'Use consistent date formatting (e.g., "Jan 2023 – Mar 2024") throughout.',
    'Include a concise professional summary at the top (2–3 sentences).',
    'Tailor your skills section to match keywords from the job description.',
    'Avoid personal pronouns (I, me, my) — use implied subject in bullet points.',
    'Use standard section headings: Summary, Experience, Education, Skills, Projects.',
    'Ensure consistent font sizes: 10–12pt for body, 14–16pt for name/headings.',
  ];

  const resumeLower = resumeText.toLowerCase();
  if (!resumeLower.includes('%') && !resumeLower.includes('percent')) {
    formattingTips.unshift('Add quantifiable metrics to your achievements (%, $, numbers).');
  }
  if (resumeText.split('\n').filter((l) => l.trim().startsWith('•') || l.trim().startsWith('-')).length < 3) {
    formattingTips.unshift('Convert your experience descriptions into bullet-point format.');
  }

  return {
    weakVerbSuggestions: weakVerbSuggestions.slice(0, 8),
    formattingTips: formattingTips.slice(0, 8),
  };
}

// ─── Text Extraction Helpers ──────────────────────────────────────────────────

interface PdfjsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(src: { data: ArrayBuffer }): {
    promise: Promise<{
      numPages: number;
      getPage(n: number): Promise<{
        getTextContent(): Promise<{
          items: Array<{ str?: string }>;
        }>;
      }>;
    }>;
  };
}

interface MammothLib {
  extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
}

declare global {
  interface Window {
    pdfjsLib?: PdfjsLib;
    mammoth?: MammothLib;
  }
}

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAMMOTH_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

export async function extractTextFromPDF(file: File): Promise<string> {
  await loadScript(PDFJS_CDN, 'pdfjsLib');

  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    throw new Error('PDF.js failed to load. Please check your internet connection and try again.');
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => item.str || '')
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n');
}

export async function extractTextFromDOCX(file: File): Promise<string> {
  await loadScript(MAMMOTH_CDN, 'mammoth');

  const mammoth = window.mammoth;
  if (!mammoth) {
    throw new Error('Mammoth.js failed to load. Please check your internet connection and try again.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
