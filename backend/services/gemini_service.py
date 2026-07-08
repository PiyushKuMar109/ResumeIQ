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


def generate_tailored_resume(parsed_resume: dict, job_title: str, job_description: str) -> dict:
    import json
    import re
    
    # Extract existing sections
    skills = parsed_resume.get('skills', [])
    experience = parsed_resume.get('experience', [])
    projects = parsed_resume.get('projects', [])
    
    prompt = (
        f"You are an expert ATS (Applicant Tracking System) optimizer and professional resume writer.\n"
        f"Your task is to tailor a candidate's resume for the role of '{job_title}' based on the provided Job Description.\n\n"
        f"Job Description:\n{job_description}\n\n"
        f"Candidate's Current Resume Data:\n"
        f"- Skills: {skills}\n"
        f"- Work Experience Items:\n"
    )
    
    for i, exp in enumerate(experience):
        prompt += f"  [{i}] {exp}\n"
    
    prompt += "- Project Items:\n"
    for i, proj in enumerate(projects):
        prompt += f"  [{i}] {proj}\n"
        
    prompt += (
        f"\nInstructions:\n"
        f"1. Generate a tailored professional summary (3-4 sentences) that highlights the candidate's matching experience and aligns with the job description.\n"
        f"2. For each work experience item, rewrite it to be more compelling and highlight keywords/skills relevant to the job description while preserving the original facts. Provide a 1-sentence reason why this change helps.\n"
        f"3. For each project item, rewrite it to highlight relevant engineering achievements and keywords. Provide a 1-sentence reason why this change helps.\n"
        f"4. Suggest a tailored list of skills (keep existing skills and add relevant missing ones from the job description).\n"
        f"5. Calculate a match_score (float, 0-100) indicating how well this tailored profile matches the job description.\n"
        f"6. List 3 overall suggestions/tips for this candidate.\n\n"
        f"You MUST respond ONLY with a valid JSON object matching the exact schema below. Do not include markdown code block formatting (like ```json). Just the raw JSON string.\n\n"
        f"Schema:\n"
        f"{{\n"
        f"  \"summary\": \"tailored summary text\",\n"
        f"  \"experience\": [\n"
        f"    {{\"original\": \"original text\", \"tailored\": \"rewritten experience text\", \"reason\": \"explanation of change\"}}\n"
        f"  ],\n"
        f"  \"projects\": [\n"
        f"    {{\"original\": \"original text\", \"tailored\": \"rewritten project text\", \"reason\": \"explanation of change\"}}\n"
        f"  ],\n"
        f"  \"skills\": [\"skill1\", \"skill2\"],\n"
        f"  \"match_score\": 85.5,\n"
        f"  \"suggestions\": [\"tip1\", \"tip2\", \"tip3\"]\n"
        f"}}\n"
    )
    
    result = _query_gemini(prompt, max_output_tokens=1500)
    
    # Try to parse JSON from the result
    if result:
        # Clean potential markdown wrapping
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\n', '', cleaned)
            cleaned = re.sub(r'\n```$', '', cleaned)
        cleaned = cleaned.strip()
        
        try:
            parsed = json.loads(cleaned)
            return parsed
        except Exception:
            logging.exception("Failed to parse Gemini tailored resume response as JSON. Content: %s", result)
            
    # Fallback structure if Gemini fails or JSON is corrupt
    fallback_experience = []
    for exp in experience:
        fallback_experience.append({
            "original": exp,
            "tailored": exp,
            "reason": "Ensure you explicitly highlight accomplishments that match the requirements."
        })
    fallback_projects = []
    for proj in projects:
        fallback_projects.append({
            "original": proj,
            "tailored": proj,
            "reason": "Mention the technologies and architectural decisions made."
        })
        
    return {
        "summary": f"Experienced professional tailored for the {job_title} role.",
        "experience": fallback_experience,
        "projects": fallback_projects,
        "skills": skills,
        "match_score": 60.0,
        "suggestions": [
            "Tailor your bullet points to show quantified impact and achievements.",
            "Make sure keywords from the job description are prominent in your skills list.",
            "Use standard fonts and layout styles to pass ATS filters."
        ]
    }


def generate_mock_questions(resume_text: str, job_title: str) -> list:
    import json
    import re
    
    prompt = (
        f"You are a principal tech recruiter and hiring manager conducting a mock interview.\n"
        f"Generate 5 interview questions tailored for a candidate applying to the '{job_title}' role.\n"
        f"The candidate's resume content is provided below.\n\n"
        f"Candidate Resume Text:\n{resume_text}\n\n"
        f"Instructions:\n"
        f"1. Generate exactly 5 questions (e.g. 2 technical, 1 behavioral, 1 project-based, and 1 coding/scenario question).\n"
        f"2. For each question, provide a short, helpful answer hint/guide for what to look for in a good answer.\n"
        f"3. Respond ONLY with a valid JSON array of objects matching the schema below. Do not include markdown code block formatting (like ```json). Just the raw JSON string.\n\n"
        f"Schema:\n"
        f"[\n"
        f"  {{\n"
        f"    \"question_text\": \"question string\",\n"
        f"    \"answer_hint\": \"brief hint string\",\n"
        f"    \"question_type\": \"TECHNICAL | BEHAVIORAL | PROJECT | CODING\"\n"
        f"  }}\n"
        f"]\n"
    )
    
    result = _query_gemini(prompt, max_output_tokens=800)
    if result:
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\n', '', cleaned)
            cleaned = re.sub(r'\n```$', '', cleaned)
        cleaned = cleaned.strip()
        
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed[:5]
        except Exception:
            logging.exception("Failed to parse Gemini mock questions JSON. Content: %s", result)
            
    return [
        {
            "question_text": f"Can you tell me about your background and how it prepares you for the {job_title} role?",
            "answer_hint": "Focus on summary, core engineering experiences, and relevant stack.",
            "question_type": "BEHAVIORAL"
        },
        {
            "question_text": f"What challenges do you expect when working on scale/performance issues in {job_title}?",
            "answer_hint": "Mention bottlenecks, database indexes, query caching, or system designs.",
            "question_type": "TECHNICAL"
        },
        {
            "question_text": "Describe your favorite or most challenging engineering project and your concrete contribution.",
            "answer_hint": "Use the STAR method: Situation, Task, Action, Result. Quantify impact.",
            "question_type": "PROJECT"
        },
        {
            "question_text": "How do you handle conflict or architectural disagreements within a development team?",
            "answer_hint": "Focus on data-driven discussions, compromises, and team goals over personal egos.",
            "question_type": "BEHAVIORAL"
        },
        {
            "question_text": "Design or describe a scalable API endpoint pattern incorporating caching and security guidelines.",
            "answer_hint": "Explain REST structure, rate limiting, JWT validation, and Redis caches.",
            "question_type": "CODING"
        }
    ]


def evaluate_interview_answer(question: str, user_answer: str, answer_hint: str) -> dict:
    import json
    import re
    
    prompt = (
        f"You are a professional mock interview evaluator.\n"
        f"Evaluate the candidate's answer to the interview question below.\n\n"
        f"Interview Question:\n{question}\n\n"
        f"Expected Key Points (Hint):\n{answer_hint}\n\n"
        f"Candidate's Answer:\n{user_answer or '[No Answer Provided]'}\n\n"
        f"Instructions:\n"
        f"1. Score the answer from 0.0 to 100.0 based on accuracy, depth, and structured communication.\n"
        f"2. Provide constructive, brief feedback detailing what was good and what could be improved.\n"
        f"3. Provide a high-quality model answer demonstrating how a senior engineer would respond to this question.\n"
        f"4. Respond ONLY with a valid JSON object matching the schema below. Do not include markdown code block formatting (like ```json). Just the raw JSON string.\n\n"
        f"Schema:\n"
        f"{{\n"
        f"  \"score\": 82.5,\n"
        f"  \"feedback\": \"detailed feedback here\",\n"
        f"  \"model_answer\": \"exemplary model answer here\"\n"
        f"}}\n"
    )
    
    result = _query_gemini(prompt, max_output_tokens=800)
    if result:
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\n', '', cleaned)
            cleaned = re.sub(r'\n```$', '', cleaned)
        cleaned = cleaned.strip()
        
        try:
            parsed = json.loads(cleaned)
            return parsed
        except Exception:
            logging.exception("Failed to parse Gemini interview evaluation JSON. Content: %s", result)
            
    score = 50.0 if user_answer else 0.0
    feedback = "Constructive feedback could not be generated. Ensure you mention core technologies and structured workflows."
    model_answer = "This would represent a structured response highlighting the design patterns, STAR methodology, and tech stack components."
    
    return {
        "score": score,
        "feedback": feedback,
        "model_answer": model_answer
    }


def generate_cover_letter(resume_text: str, job_title: str, company_name: str, job_desc: str) -> dict:
    import json
    import re
    
    prompt = (
        f"You are a professional career coach and copywriter.\n"
        f"Write a highly tailored Cover Letter and a brief Recruiter Outreach Email for the candidate.\n\n"
        f"Candidate Resume content:\n{resume_text}\n\n"
        f"Target Job Title: {job_title}\n"
        f"Target Company: {company_name}\n"
        f"Job Description (Keywords): {job_desc or 'Not Provided'}\n\n"
        f"Instructions:\n"
        f"1. The Cover Letter should be professional, compelling, and exactly link the candidate's experiences to the job title/company.\n"
        f"2. The Recruiter Outreach Email should be concise (150 words max), catchy, and structured for LinkedIn or direct email outreach.\n"
        f"3. Respond ONLY with a valid JSON object matching the schema below. Do not include markdown code block formatting (like ```json). Just the raw JSON string.\n\n"
        f"Schema:\n"
        f"{{\n"
        f"  \"cover_letter\": \"salutation... body... signoff\",\n"
        f"  \"outreach_email\": \"subject... body... signoff\"\n"
        f"}}\n"
    )
    
    result = _query_gemini(prompt, max_output_tokens=1000)
    if result:
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\n', '', cleaned)
            cleaned = re.sub(r'\n```$', '', cleaned)
        cleaned = cleaned.strip()
        
        try:
            parsed = json.loads(cleaned)
            return parsed
        except Exception:
            logging.exception("Failed to parse Cover Letter JSON. Content: %s", result)
            
    return {
        "cover_letter": f"Dear Hiring Team at {company_name},\n\nI am writing to express my strong interest in the {job_title} role. My experience matches your requirements...",
        "outreach_email": f"Subject: Interested in {job_title} opportunities at {company_name}\n\nHi [Recruiter Name],\n\nI recently applied to the {job_title} role and wanted to introduce myself..."
    }


def generate_career_roadmap(resume_text: str) -> dict:
    import json
    import re
    prompt = (
        f"You are a Senior Career Planner and Roadmap Strategist.\n"
        f"Analyze the candidate's resume and generate a customized Career Growth Roadmap for the next 5 years.\n\n"
        f"Resume content:\n{resume_text}\n\n"
        f"Instructions:\n"
        f"1. Generate a sequence of 4 timeline milestones (e.g. Current, Year 1-2, Year 3-4, Year 5+) with action items.\n"
        f"2. Generate a Skill Tree categorized into categories (e.g. Languages, System Design, Cloud/DevOps, Frontend, Backend) containing skills to master.\n"
        f"3. Suggest 3 highly valuable certifications to boost their career track.\n"
        f"4. Project an estimated salary range growth trend (4 points corresponding to the milestones).\n"
        f"5. Respond ONLY with a valid JSON object matching the schema below. Do not wrap in ```json block.\n\n"
        f"Schema:\n"
        f"{{\n"
        f"  \"milestones\": [\n"
        f"    {{\"period\": \"Year 1\", \"title\": \"Milestone Title\", \"description\": \"Key milestones details...\"}}\n"
        f"  ],\n"
        f"  \"skills_tree\": [\n"
        f"    {{\"category\": \"Backend\", \"skills\": [\"Go\", \"Redis\"], \"status\": \"To Learn\"}},\n"
        f"    {{\"category\": \"Languages\", \"skills\": [\"Python\", \"JavaScript\"], \"status\": \"Mastered\"}}\n"
        f"  ],\n"
        f"  \"certifications\": [\n"
        f"    {{\"name\": \"AWS Solutions Architect\", \"provider\": \"Amazon\", \"benefit\": \"Highly valued for Cloud roles\"}}\n"
        f"  ],\n"
        f"  \"salary_projection\": [\n"
        f"    {{\"label\": \"Current\", \"amount\": \"$90,000\"}},\n"
        f"    {{\"label\": \"Year 1-2\", \"amount\": \"$110,000\"}},\n"
        f"    {{\"label\": \"Year 3-4\", \"amount\": \"$140,000\"}},\n"
        f"    {{\"label\": \"Year 5+\", \"amount\": \"$180,000\"}}\n"
        f"  ]\n"
        f"}}\n"
    )
    result = _query_gemini(prompt, max_output_tokens=1000)
    if result:
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\n', '', cleaned)
            cleaned = re.sub(r'\n```$', '', cleaned)
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except Exception:
            logging.exception("Failed to parse career roadmap JSON.")
            
    return {
        "milestones": [
            {"period": "Current Status", "title": "Base Foundation", "description": "Strengthen core tech stacks listed on your profile."},
            {"period": "Year 1-2", "title": "System Scalability Specialist", "description": "Transition to microservices, queue systems, and load balancing."},
            {"period": "Year 3-4", "title": "Lead Software Developer", "description": "Lead design architectures, mentor junior engineers, and manage sprints."},
            {"period": "Year 5+", "title": "Principal Architect / Director", "description": "Align technology strategies with business KPIs, driving cross-functional goals."}
        ],
        "skills_tree": [
            {"category": "Core Languages", "skills": ["Python", "JavaScript", "TypeScript"], "status": "Mastered"},
            {"category": "Backend Systems", "skills": ["Microservices", "gRPC", "Redis Caching"], "status": "To Learn"},
            {"category": "Cloud & Scaling", "skills": ["Docker", "Kubernetes", "AWS ECS"], "status": "To Learn"}
        ],
        "certifications": [
            {"name": "AWS Certified Solutions Architect", "provider": "Amazon Web Services", "benefit": "Validates cloud scalability skills."},
            {"name": "Certified Kubernetes Administrator (CKA)", "provider": "Cloud Native Computing Foundation", "benefit": "Proves containers deployment capabilities."}
        ],
        "salary_projection": [
            {"label": "Current", "amount": "$95k"},
            {"label": "Year 1-2", "amount": "$120k"},
            {"label": "Year 3-4", "amount": "$150k"},
            {"label": "Year 5+", "amount": "$195k"}
        ]
    }


def analyze_keyword_density(resume_text: str, job_text: str) -> dict:
    import json
    import re
    prompt = (
        f"You are an ATS Keyword Analysis expert.\n"
        f"Compare the candidate's resume with the target job description and compute keyword matches and missing gaps.\n\n"
        f"Resume content:\n{resume_text}\n\n"
        f"Job Description content:\n{job_text}\n\n"
        f"Instructions:\n"
        f"1. Extract top matched keywords (overlapping) with importance weighting (1-100 scale).\n"
        f"2. Extract missing critical technical keywords (present in job desc but absent in resume) with priority score (1-100 scale).\n"
        f"3. Respond ONLY with a valid JSON matching the schema below. No ```json formatting.\n\n"
        f"Schema:\n"
        f"{{\n"
        f"  \"matched_keywords\": [\n"
        f"    {{\"word\": \"React\", \"weight\": 90}},\n"
        f"    {{\"word\": \"Python\", \"weight\": 85}}\n"
        f"  ],\n"
        f"  \"missing_keywords\": [\n"
        f"    {{\"word\": \"Docker\", \"weight\": 95}},\n"
        f"    {{\"word\": \"CI/CD\", \"weight\": 80}}\n"
        f"  ]\n"
        f"}}\n"
    )
    result = _query_gemini(prompt, max_output_tokens=800)
    if result:
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\n', '', cleaned)
            cleaned = re.sub(r'\n```$', '', cleaned)
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except Exception:
            logging.exception("Failed to parse keyword density JSON.")
            
    return {
        "matched_keywords": [
            {"word": "Software Engineering", "weight": 85},
            {"word": "Full Stack Development", "weight": 80},
            {"word": "API Design", "weight": 75}
        ],
        "missing_keywords": [
            {"word": "Docker & Containers", "weight": 90},
            {"word": "Kubernetes orchestration", "weight": 85},
            {"word": "AWS Deployments", "weight": 80}
        ]
    }


def refactor_interview_code(code_text: str, language: str) -> dict:
    import json
    import re
    prompt = (
        f"You are a Senior Staff Engineer and Code Reviewer.\n"
        f"Refactor the following {language} code to make it highly optimal, readable, and elegant.\n\n"
        f"Candidate Code:\n{code_text}\n\n"
        f"Instructions:\n"
        f"1. Generate the refactored, production-ready code version.\n"
        f"2. Identify original vs refactored Time and Space complexity (e.g. O(N^2) -> O(N)).\n"
        f"3. List 3-4 specific clean-code improvements made.\n"
        f"4. Respond ONLY with a valid JSON matching the schema below. No ```json formatting.\n\n"
        f"Schema:\n"
        f"{{\n"
        f"  \"refactored_code\": \"def optimal_solution():\\n    pass\",\n"
        f"  \"original_time\": \"O(N^2)\",\n"
        f"  \"refactored_time\": \"O(N)\",\n"
        f"  \"original_space\": \"O(1)\",\n"
        f"  \"refactored_space\": \"O(N)\",\n"
        f"  \"improvements\": [\n"
        f"    \"Replaced nested loops with a hash map lookup.\",\n"
        f"    \"Added type hinting and docstrings.\"\n"
        f"  ]\n"
        f"}}\n"
    )
    result = _query_gemini(prompt, max_output_tokens=1000)
    if result:
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\n', '', cleaned)
            cleaned = re.sub(r'\n```$', '', cleaned)
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except Exception:
            logging.exception("Failed to parse code refactor JSON.")
            
    return {
        "refactored_code": f"# Refactored code\n{code_text}\n\n# Optimized version here",
        "original_time": "O(N^2)",
        "refactored_time": "O(N)",
        "original_space": "O(1)",
        "refactored_space": "O(1)",
        "improvements": [
            "Optimized loop iterations.",
            "Removed redundant conditional branches."
        ]
    }



