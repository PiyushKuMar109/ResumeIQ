import os
import logging

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

try:
    from google.generativeai import client
    if GEMINI_API_KEY:
        client.configure(api_key=GEMINI_API_KEY)
except Exception:
    client = None
    logging.warning('Gemini client could not be configured. Falling back to local rules.')

FALLBACK_SKILLS = [
    'Python', 'Django', 'Flask', 'FastAPI', 'JavaScript', 'React', 'Node.js',
    'Express', 'MongoDB', 'PostgreSQL', 'MySQL', 'HTML', 'CSS', 'Tailwind',
    'Bootstrap', 'Git', 'GitHub', 'REST API', 'JWT', 'AWS', 'S3', 'Docker', 'SQL',
    'Linux', 'Machine Learning', 'NLP', 'Data Analysis', 'Pandas', 'NumPy',
    'Scikit-learn', 'TensorFlow', 'PyTorch',
]


def _query_gemini(prompt, max_output_tokens=300):
    if not client or not GEMINI_API_KEY:
        return None
    try:
        if hasattr(client, 'generate_text'):
            response = client.generate_text(model='gemini-1.5-mini', prompt=prompt, max_output_tokens=max_output_tokens)
            return getattr(response, 'text', None) or response.get('text')
        if hasattr(client, 'completions'):
            response = client.completions.create(model='gemini-1.5-mini', prompt=prompt, max_output_tokens=max_output_tokens)
            candidates = getattr(response, 'candidates', None) or response.get('candidates')
            if candidates:
                candidate = candidates[0]
                return getattr(candidate, 'output_text', None) or candidate.get('output_text')
    except Exception:
        logging.exception('Gemini API request failed')
    return None


def generate_resume_suggestions(resume_text: str, job_role: dict) -> list:
    prompt = (
        f"Review the resume text below and the job role description. "
        f"List 5 actionable improvement suggestions for this candidate to improve their resume, "
        f"especially for the role {job_role.get('title', 'N/A')} with skills {', '.join(job_role.get('required_skills', []))}.\n\n"
        f"Resume Text:\n{resume_text}\n"
    )
    result = _query_gemini(prompt, max_output_tokens=300)
    if result:
        return [item.strip('- ').strip() for item in result.split('\n') if item.strip()][:5]

    fallback = [
        'Highlight your most relevant skills and certifications at the top.',
        'Use concrete metrics and achievements for each project or job.',
        'Add the required job role skills in the summary and experience bullets.',
        'Keep formatting consistent across sections and avoid dense paragraphs.',
        'Include keywords from the job description naturally in your resume.',
    ]
    return fallback


def generate_interview_questions(resume_text: str, job_role: dict, difficulty: str) -> list:
    prompt = (
        f"Generate interview questions for a candidate applying to {job_role.get('title', 'this role')}. "
        f"Provide 5 technical questions, 5 HR questions, 5 project-based questions, and 3 coding questions. "
        f"Use difficulty {difficulty}. Include a short answer hint for each question.\n\n"
        f"Resume Text:\n{resume_text}\n"
    )
    result = _query_gemini(prompt, max_output_tokens=500)
    if result:
        questions = []
        lines = [line.strip() for line in result.split('\n') if line.strip()]
        expanded_types = (
            ['TECHNICAL'] * 5 +
            ['HR'] * 5 +
            ['PROJECT'] * 5 +
            ['CODING'] * 3
        )
        for line in lines:
            if ':' in line:
                parts = line.split(':', 1)
                index = len(questions)
                questions.append({
                    'question': parts[0].strip(),
                    'answer_hint': parts[1].strip(),
                    'question_type': expanded_types[index] if index < len(expanded_types) else 'TECHNICAL',
                    'difficulty': difficulty,
                })
        if questions:
            return questions[:18]

    fallback = []
    primary_skill = job_role.get('required_skills', ['technical problem solving'])[0]
    role_title = job_role.get('title', 'this role')
    for i in range(1, 6):
        fallback.append({
            'question': f'Explain a challenging {primary_skill} problem you solved for a {role_title} scenario.',
            'answer_hint': 'Describe the challenge, your actions, and measurable impact.',
            'question_type': 'PROJECT',
            'difficulty': difficulty,
        })
    for i in range(1, 6):
        fallback.append({
            'question': f'Why are you interested in the {role_title} role and how does your background fit it?',
            'answer_hint': 'Explain your motivation and relevant experience.',
            'question_type': 'HR',
            'difficulty': difficulty,
        })
    for i in range(1, 6):
        fallback.append({
            'question': f'How would you apply {primary_skill} to solve a common {role_title} problem?',
            'answer_hint': 'Cover design choices, tradeoffs, and practical implementation details.',
            'question_type': 'TECHNICAL',
            'difficulty': difficulty,
        })
    for i in range(1, 4):
        fallback.append({
            'question': f'Write or explain a coding exercise relevant to {role_title} using {primary_skill}.',
            'answer_hint': 'Mention approach, complexity, and important edge cases.',
            'question_type': 'CODING',
            'difficulty': difficulty,
        })
    return fallback


def generate_career_advice(parsed_resume: dict) -> list:
    if not parsed_resume:
        return ['Update your profile with more details to get personalized career advice.']
    summary = parsed_resume.get('summary') or ''
    prompt = (
        f"Review the parsed resume details and provide 5 career advice items based on skills {parsed_resume.get('skills', [])} "
        f"and experience sections.\nParsed Resume:\n{parsed_resume}\n"
    )
    result = _query_gemini(prompt, max_output_tokens=250)
    if result:
        return [line.strip('- ').strip() for line in result.split('\n') if line.strip()][:5]
    return [
        'Focus on sharpened skill statements using measurable outcomes.',
        'Highlight your strongest technical experience first in the summary.',
        'Use modern tooling and keywords from your target roles.',
        'Keep your resume concise and structured for readability.',
        'Tailor your resume to the specific company or position.',
    ]


def improve_project_description(project_text: str) -> str:
    prompt = (
        f"Improve the following project description to make it more compelling for a technical resume: \n{project_text}\n" )
    result = _query_gemini(prompt, max_output_tokens=150)
    if result:
        return result.strip()
    return project_text.strip() or 'Improved project description should include measurable outcomes and technologies used.'
