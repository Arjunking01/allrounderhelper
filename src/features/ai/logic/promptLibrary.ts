export type PromptDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: PromptDifficulty;
  tags: string[];
  template: string;
}

function p(id: string, title: string, description: string, category: string, difficulty: PromptDifficulty, tags: string[], template: string): PromptTemplate {
  return { id, title, description, category, difficulty, tags, template };
}

export const PROMPT_LIBRARY: PromptTemplate[] = [
  p('math-solve-step', 'Solve Step by Step', 'Work through a problem with full reasoning.', 'Mathematics', 'beginner', ['algebra', 'steps'], 'Solve this step by step, explaining your reasoning:\n\n[paste problem]'),
  p('math-proof', 'Proof Walkthrough', 'Understand a mathematical proof.', 'Mathematics', 'advanced', ['proof'], 'Walk me through this proof line by line:\n\n[paste proof/theorem]'),
  p('math-word-problem', 'Word Problem Translator', 'Turn a word problem into equations.', 'Mathematics', 'beginner', ['word problem'], 'Translate this word problem into equations, then solve:\n\n[paste problem]'),
  p('physics-concept', 'Physics Concept Explainer', 'Explain a physics concept with intuition.', 'Physics', 'beginner', ['concept'], 'Explain [concept] in physics with a real-world analogy and the key formula.'),
  p('physics-problem', 'Physics Problem Solver', 'Solve a physics problem with units tracked.', 'Physics', 'intermediate', ['mechanics'], 'Solve this physics problem, showing units at each step:\n\n[paste problem]'),
  p('chem-reaction', 'Reaction Mechanism', 'Explain a chemical reaction mechanism.', 'Chemistry', 'intermediate', ['organic'], 'Explain the mechanism of this reaction step by step:\n\n[paste reaction]'),
  p('chem-balance', 'Balance Equation', 'Balance a chemical equation with explanation.', 'Chemistry', 'beginner', ['equations'], 'Balance this chemical equation and explain the process:\n\n[paste equation]'),
  p('bio-process', 'Biological Process', 'Explain a biological process clearly.', 'Biology', 'beginner', ['process'], 'Explain [process, e.g. photosynthesis] step by step with a labeled summary.'),
  p('bio-diagram', 'Diagram Description', 'Describe what a biology diagram shows.', 'Biology', 'intermediate', ['diagram'], 'I\'m looking at a diagram of [structure]. Explain each labeled part and its function.'),
  p('english-grammar', 'Grammar Check', 'Fix grammar and explain the corrections.', 'English', 'beginner', ['grammar'], 'Check this text for grammar issues and explain each correction:\n\n[paste text]'),
  p('english-literary', 'Literary Analysis', 'Analyze a passage or poem.', 'English', 'advanced', ['analysis'], 'Analyze this passage for themes, tone, and literary devices:\n\n[paste passage]'),
  p('prog-debug', 'Debug My Code', 'Find and fix a bug, with explanation.', 'Programming', 'intermediate', ['debugging'], 'Here is my code and the issue. Find the bug and explain why it happens:\n\n```\n[code]\n```\nExpected: [expected]\nActual: [actual]'),
  p('prog-review', 'Code Review', 'Get feedback on code quality.', 'Programming', 'intermediate', ['review'], 'Review this code for readability, performance, and bugs:\n\n```\n[code]\n```'),
  p('prog-explain', 'Explain This Code', 'Understand what a snippet does.', 'Programming', 'beginner', ['explain'], 'Explain what this code does, line by line:\n\n```\n[code]\n```'),
  p('java-oop', 'Java OOP Design', 'Design a Java class hierarchy.', 'Java', 'intermediate', ['oop'], 'Design a Java class hierarchy for [scenario], using appropriate OOP principles.'),
  p('java-debug', 'Java Debugging', 'Debug a Java exception/stack trace.', 'Java', 'intermediate', ['exceptions'], 'Explain this Java stack trace and how to fix it:\n\n[paste stack trace + relevant code]'),
  p('python-script', 'Python Script Help', 'Write or fix a Python script.', 'Python', 'beginner', ['scripting'], 'Write a Python script that [goal]. Include comments explaining each part.'),
  p('python-debug', 'Python Debugging', 'Fix a Python error.', 'Python', 'beginner', ['errors'], 'Here is my Python code and error message. Explain and fix it:\n\n```python\n[code]\n```\nError: [error]'),
  p('c-pointers', 'C Pointers Explainer', 'Understand pointers and memory.', 'C', 'intermediate', ['pointers'], 'Explain what this C code does with pointers, including a memory diagram in words:\n\n```c\n[code]\n```'),
  p('c-memory', 'Memory Management Help', 'Debug a memory issue in C.', 'C', 'advanced', ['memory'], 'Help me find the memory issue (leak/overflow) in this C code:\n\n```c\n[code]\n```'),
  p('cpp-stl', 'C++ STL Usage', 'Pick the right STL container/algorithm.', 'C++', 'intermediate', ['stl'], 'What STL container/algorithm fits this use case, and why: [describe use case]'),
  p('cpp-oop', 'C++ Class Design', 'Design a C++ class with proper resource management.', 'C++', 'advanced', ['raii'], 'Design a C++ class for [scenario], following RAII and modern C++ practices.'),
  p('js-async', 'JavaScript Async Help', 'Understand promises/async-await.', 'JavaScript', 'intermediate', ['async'], 'Explain and fix the async flow in this JavaScript code:\n\n```js\n[code]\n```'),
  p('js-debug', 'JavaScript Debugging', 'Fix a JS bug/error.', 'JavaScript', 'beginner', ['errors'], 'Here is my JavaScript code and the error. Explain and fix it:\n\n```js\n[code]\n```\nError: [error]'),
  p('react-component', 'React Component Design', 'Design or refactor a React component.', 'React', 'intermediate', ['components'], 'Help me design a React component that [goal]. Current code (if any):\n\n```jsx\n[code]\n```'),
  p('react-hooks', 'React Hooks Help', 'Debug or design a custom hook.', 'React', 'intermediate', ['hooks'], 'Explain why this React hook behaves this way, and how to fix it:\n\n```jsx\n[code]\n```'),
  p('html-structure', 'HTML Structure Review', 'Review semantic HTML structure.', 'HTML', 'beginner', ['semantics'], 'Review this HTML for semantic correctness and accessibility:\n\n```html\n[code]\n```'),
  p('css-layout', 'CSS Layout Help', 'Fix a CSS layout issue.', 'CSS', 'beginner', ['layout'], 'Here is my CSS and the layout issue I\'m seeing. Help me fix it:\n\n```css\n[code]\n```\nIssue: [describe]'),
  p('sql-query', 'SQL Query Builder', 'Write a SQL query for a goal.', 'SQL', 'beginner', ['queries'], 'Write a SQL query that [goal], given this schema:\n\n[paste schema]'),
  p('sql-optimize', 'SQL Query Optimization', 'Optimize a slow query.', 'SQL', 'advanced', ['performance'], 'This SQL query is slow. Suggest optimizations and explain why:\n\n```sql\n[query]\n```'),
  p('ai-concept', 'AI Concept Explainer', 'Explain an AI/ML term simply.', 'AI', 'beginner', ['concepts'], 'Explain [AI term/concept] simply, then in more technical depth.'),
  p('ml-model-choice', 'Model Selection Help', 'Pick a suitable ML model for a task.', 'Machine Learning', 'intermediate', ['models'], 'Which type of ML model fits this problem, and why: [describe problem, data type, goal]'),
  p('ml-metric', 'Evaluation Metric Help', 'Choose the right evaluation metric.', 'Machine Learning', 'intermediate', ['evaluation'], 'What evaluation metric(s) should I use for [task], and why?'),
  p('ds-eda', 'Exploratory Data Analysis Plan', 'Plan an EDA approach for a dataset.', 'Data Science', 'intermediate', ['eda'], 'Suggest an exploratory data analysis plan for a dataset with these columns: [list columns].'),
  p('ds-viz', 'Chart Choice Help', 'Pick the right chart type for data.', 'Data Science', 'beginner', ['visualization'], 'What chart type best shows [relationship/pattern] in my data, and why?'),
  p('eng-design', 'Engineering Design Walkthrough', 'Think through an engineering design problem.', 'Engineering', 'advanced', ['design'], 'Help me think through the design tradeoffs for [engineering problem].'),
  p('eng-formula', 'Engineering Formula Explainer', 'Understand an engineering formula.', 'Engineering', 'intermediate', ['formulas'], 'Explain this engineering formula, what each term means, and a worked example:\n\n[formula]'),
  p('upsc-answer', 'UPSC Answer Structuring', 'Structure a UPSC mains-style answer.', 'UPSC', 'advanced', ['mains'], 'Help me structure a UPSC mains answer for: [question]. Word limit: [limit].'),
  p('upsc-current-affairs', 'Current Affairs Summary', 'Summarize a topic for UPSC prep.', 'UPSC', 'intermediate', ['current affairs'], 'Summarize the key points I should know about [topic] for UPSC prep.'),
  p('competitive-shortcut', 'Competitive Exam Shortcut', 'Find a faster solving method.', 'Competitive Exams', 'intermediate', ['shortcuts'], 'Is there a faster method to solve this type of problem? Example:\n\n[paste problem]'),
  p('competitive-mock-plan', 'Mock Test Strategy', 'Plan a mock-test practice strategy.', 'Competitive Exams', 'intermediate', ['strategy'], 'Suggest a mock-test practice strategy for [exam] with [weeks] weeks remaining.'),
  p('school-homework', 'School Homework Help', 'Get help with a school assignment.', 'School', 'beginner', ['homework'], 'Help me with this homework question, explaining the reasoning:\n\n[paste question]'),
  p('school-explain-simple', 'Explain Like I\'m in School', 'Get a school-level simple explanation.', 'School', 'beginner', ['basics'], 'Explain [topic] the way a school teacher would, with a simple example.'),
  p('college-course-summary', 'Course Topic Summary', 'Summarize a college course topic.', 'College', 'intermediate', ['summary'], 'Summarize the key ideas of [course topic] as I\'d need for an exam.'),
  p('college-lab-report', 'Lab Report Structure', 'Structure a lab report.', 'College', 'intermediate', ['lab report'], 'Help me structure a lab report for an experiment on [topic]: sections and what goes in each.'),
  p('assignment-checklist', 'Assignment Checklist', 'Build a checklist before submitting.', 'Assignments', 'beginner', ['checklist'], 'Given these assignment requirements, build me a submission checklist:\n\n[paste requirements]'),
  p('assignment-feedback', 'Assignment Feedback', 'Get feedback on a draft.', 'Assignments', 'intermediate', ['feedback'], 'Give me feedback on this assignment draft against these requirements:\n\nRequirements: [paste]\nDraft: [paste]'),
  p('project-plan', 'Project Plan Outline', 'Plan a student project.', 'Projects', 'intermediate', ['planning'], 'Help me outline a project plan for: [project idea]. Timeline: [weeks].'),
  p('project-readme', 'Project README Draft', 'Draft a README for a project.', 'Projects', 'beginner', ['documentation'], 'Draft a README for my project: [describe project, tech stack, purpose].'),
  p('resume-bullet', 'Resume Bullet Rewriter', 'Turn an experience into a strong bullet point.', 'Resume', 'intermediate', ['bullets'], 'Rewrite this into a strong, quantified resume bullet point:\n\n[describe what you did]'),
  p('resume-review', 'Resume Section Review', 'Review a resume section.', 'Resume', 'intermediate', ['review'], 'Review this resume section for clarity and impact:\n\n[paste section]'),
  p('career-path', 'Career Path Exploration', 'Explore career paths for a field.', 'Career', 'beginner', ['exploration'], 'What career paths are common for someone studying [field], and what do they involve?'),
  p('career-skills-gap', 'Skills Gap Analysis', 'Identify skills to build for a goal role.', 'Career', 'intermediate', ['skills'], 'I want to become a [target role]. What skills am I likely missing, given my background: [describe background]?'),
  p('interview-behavioral', 'Behavioral Interview Prep', 'Practice a behavioral interview answer.', 'Interview', 'intermediate', ['behavioral'], 'Help me structure a STAR-method answer for: "[behavioral question]". My experience: [describe]'),
  p('interview-technical', 'Technical Interview Prep', 'Practice explaining a technical concept out loud.', 'Interview', 'advanced', ['technical'], 'Help me practice explaining [technical concept] clearly, as I would in an interview.'),
  p('productivity-daily-plan', 'Daily Plan Builder', 'Plan today around priorities.', 'Productivity', 'beginner', ['planning'], 'Help me plan today. My priorities: [list]. Available hours: [hours].'),
  p('productivity-declutter', 'Task List Declutter', 'Prioritize and trim a task list.', 'Productivity', 'beginner', ['prioritization'], 'Here\'s my task list — help me prioritize and cut anything unnecessary:\n\n[list tasks]'),
  p('study-plan-full', 'Full Study Plan', 'Build a study plan for an exam.', 'Study Planning', 'intermediate', ['exam prep'], 'Create a study plan for [subject/exam] over [days] days, [hours]/day. Topics: [list].'),
  p('study-weak-areas', 'Weak Area Focus Plan', 'Plan extra time around weak topics.', 'Study Planning', 'intermediate', ['weak areas'], 'My weak areas are [list]. Help me build a focused plan to improve them before [date].'),
  p('viva-questions', 'Viva/Oral Exam Questions', 'Generate likely viva or oral-exam questions from material.', 'Study Planning', 'intermediate', ['viva', 'oral exam'], 'Based on the material below, create [number] likely viva/oral-exam questions with brief model answers, ordered from easiest to hardest:\\n\\n[paste notes/textbook/PDF text]'),
  p('mcq-from-notes', 'MCQs From Notes', 'Turn notes or a chapter into multiple-choice practice questions.', 'Study Planning', 'intermediate', ['MCQ', 'multiple choice', 'practice test'], 'Create [number] multiple-choice questions (4 options each, one correct) from the material below. Mark the correct answer and give a one-line reason for it:\\n\\n[paste notes/textbook/PDF text]'),
  p('flashcards-from-notes', 'Flashcards From Notes', 'Turn notes into flashcards.', 'Flashcards', 'beginner', ['flashcards'], 'Turn these notes into Q/A flashcards:\n\n[paste notes]'),
  p('flashcards-definitions', 'Definition Flashcards', 'Create flashcards for key terms.', 'Flashcards', 'beginner', ['vocabulary'], 'Create flashcards for these key terms: [list terms].'),
  p('revision-spaced', 'Spaced Revision Schedule', 'Plan spaced repetition revision.', 'Revision', 'intermediate', ['spaced repetition'], 'Build a spaced-revision schedule for topics: [list], exam date: [date].'),
  p('revision-quick', 'Last-Minute Revision', 'Plan a quick pre-exam revision session.', 'Revision', 'beginner', ['last minute'], 'I have [hours] before my exam on [subject]. What should I prioritize revising?'),
  p('time-blocking', 'Time Blocking Help', 'Build a time-blocked schedule.', 'Time Management', 'intermediate', ['time blocking'], 'Help me time-block my day around: [list commitments and tasks].'),
  p('time-procrastination', 'Beat Procrastination', 'Get strategies for a specific task you\'re avoiding.', 'Time Management', 'beginner', ['procrastination'], 'I keep avoiding this task: [describe task]. Suggest ways to get started.'),
  p('writing-outline', 'Writing Outline', 'Outline any piece of writing.', 'Writing', 'beginner', ['outline'], 'Create an outline for [type of writing] about [topic], roughly [length].'),
  p('writing-feedback', 'Writing Feedback', 'Get structured feedback on a draft.', 'Writing', 'intermediate', ['feedback'], 'Give me structured feedback (clarity, structure, tone) on this draft:\n\n[paste draft]'),
  p('writing-tone', 'Tone Adjuster', 'Rewrite text in a different tone.', 'Writing', 'beginner', ['tone'], 'Rewrite this in a more [formal/casual/persuasive] tone:\n\n[paste text]'),
  p('research-question', 'Research Question Refiner', 'Sharpen a research question.', 'Research', 'advanced', ['research question'], 'Help me refine this research question to be more focused and answerable: [paste question]'),
  p('research-lit-summary', 'Literature Summary Structure', 'Structure a literature review section.', 'Research', 'advanced', ['literature review'], 'Help me structure a literature review for a paper about: [topic].'),
  p('research-methodology', 'Methodology Sanity Check', 'Sanity-check a research methodology.', 'Research', 'advanced', ['methodology'], 'Does this methodology make sense for my research question? Question: [q] Methodology: [describe]'),
  p('essay-outline', 'Essay Outline', 'Structure an essay before writing.', 'Writing', 'beginner', ['essay'], 'Create a structured outline for an essay on [topic], about [word count] words, arguing [thesis].'),
  p('summarize-text', 'Summarize Text', 'Condense a long passage.', 'Writing', 'beginner', ['summarization'], 'Summarize the following into key bullet points:\n\n[paste text]'),
  p('concept-explain-simple', 'Concept Explainer (ELI5)', 'Explain a concept simply, then deeper.', 'School', 'beginner', ['eli5'], 'Explain [concept] like I\'m new to it, with an analogy, then go one level deeper.'),
  p('quiz-generate', 'Quiz Generator', 'Generate practice quiz questions.', 'Revision', 'intermediate', ['quiz'], 'Create a 10-question practice quiz on [topic], mixed formats, with an answer key.'),
  p('formula-explain', 'Formula Explainer', 'Understand a formula and when to use it.', 'Mathematics', 'beginner', ['formula'], 'Explain this formula: what each variable means and a simple example:\n\n[formula]'),
];

export function promptCategories(): string[] {
  return Array.from(new Set(PROMPT_LIBRARY.map((p2) => p2.category))).sort();
}

/**
 * "What's your problem?" discovery starters for the AI Assistant empty state — distinct
 * from PROMPT_LIBRARY above, which is a subject-tutoring template library (Python
 * debugging, physics problems, essay outlines, etc.) meant for the full Prompt Library
 * panel. These are shorter, first-person, situation-based openers whose whole purpose is
 * to let a student who doesn't know which ALLROUNDER HELPER tool they need just describe
 * their problem in plain language, so the AI (via the site-knowledge system prompt) can
 * infer the underlying need and point them to the right tool(s). Sent as-is via `send()`,
 * not run through `applyPromptTemplate`, since there's no `[placeholder]` to fill in.
 */
export const PROBLEM_STARTERS: string[] = [
  "I'm bored — give me something useful to do",
  'I have exams coming up and don\u2019t know where to start',
  'I keep procrastinating and can\u2019t get started',
  'I can\u2019t focus while studying',
  'I have too many PDFs to deal with',
  'Help me organize my week',
  'I don\u2019t know which tool to use',
];
