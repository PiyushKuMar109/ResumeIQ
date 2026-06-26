import json
import logging
from django.apps import apps
from django.conf import settings
import google.generativeai as genai

logger = logging.getLogger(__name__)

def get_gemini_api_key():
    """Retrieve Gemini API Key from database settings or .env file."""
    try:
        SystemConfiguration = apps.get_model('analysis', 'SystemConfiguration')
        config = SystemConfiguration.objects.first()
        if config and config.gemini_api_key:
            return config.gemini_api_key
    except Exception as e:
        logger.warning(f"Could not load Gemini API key from database: {e}")
    
    return getattr(settings, 'GEMINI_API_KEY', None)

def get_gemini_model_name():
    """Retrieve Gemini model name from database settings or default."""
    try:
        SystemConfiguration = apps.get_model('analysis', 'SystemConfiguration')
        config = SystemConfiguration.objects.first()
        if config and config.gemini_model_name:
            return config.gemini_model_name
    except Exception:
        pass
    return "gemini-1.5-flash"

def parse_and_analyze_resume(resume_text, target_role):
    """
    Sends the resume text to Gemini to parse profile fields, calculate ATS scores,
    and generate job recommendations and interview questions.
    """
    api_key = get_gemini_api_key()
    
    if not api_key or api_key == '':
        logger.warning("Gemini API key is missing. Using high-fidelity mock fallback data.")
        return generate_mock_analysis(resume_text, target_role)

    try:
        genai.configure(api_key=api_key)
        model_name = get_gemini_model_name()
        model = genai.GenerativeModel(model_name)

        system_instruction = (
            "You are a professional recruiting assistant, parser, and ATS score evaluator. "
            "Analyze the candidate's resume text against the target job role. "
            "You MUST return the output in valid, structured JSON format conforming to the requested schema. "
            "Do not include any Markdown wrap blocks like ```json."
        )

        prompt = f"""
        Target Job Role: {target_role}
        Resume Text:
        {resume_text}

        Perform the following:
        1. Parse the resume for contact details, skills, education, experience, projects, certifications, and languages.
        2. Evaluate the resume out of 100 based on standard ATS parameters:
           - Skills Match (35%)
           - Keywords (20%)
           - Projects (15%)
           - Experience (15%)
           - Education (10%)
           - Formatting (5%)
        3. Identify missing keywords/skills for the target role.
        4. Provide actionable improvement suggestions.
        5. Generate 3-5 job recommendations with title, company, matching percentage, estimated salary range, and learning resources (such as specific courses, tutorials or docs) for missing skills.
        6. Generate 5-8 interview questions (technical, HR, projects, and coding) with varying difficulties and clear sample answers.

        Output JSON structure:
        {{
          "parsed_data": {{
            "name": "Full Name",
            "email": "Email Address",
            "phone": "Phone Number",
            "linkedin": "LinkedIn URL (or empty string)",
            "github": "GitHub URL (or empty string)",
            "portfolio": "Portfolio/Website URL (or empty string)",
            "skills": ["Skill1", "Skill2"],
            "education": [
              {{
                "institution": "University/School Name",
                "degree": "Degree and Major",
                "year": "Graduation Year"
              }}
            ],
            "experience": [
              {{
                "company": "Company Name",
                "role": "Job Title",
                "duration": "Duration (e.g. 2020 - 2022)",
                "description": "Job duties and Achievements"
              }}
            ],
            "projects": [
              {{
                "title": "Project Name",
                "description": "Project details",
                "technologies": ["Tech1", "Tech2"]
              }}
            ],
            "certifications": ["Certification Name"],
            "languages": ["Language Name"]
          }},
          "ats_score": 85,
          "score_breakup": {{
            "skills_match": 30,
            "keywords": 18,
            "projects": 12,
            "experience": 13,
            "education": 8,
            "formatting": 4
          }},
          "missing_keywords": ["MissingSkill1", "MissingKeyword2"],
          "suggestions": ["Improvement suggestion 1", "Improvement suggestion 2"],
          "job_recommendations": [
            {{
              "title": "Job Title",
              "company": "Company Name",
              "match_percentage": 90,
              "salary_range": "$90,000 - $120,000",
              "required_skills": ["Skill1", "Skill2"],
              "learning_resources": [
                {{
                  "skill": "MissingSkill1",
                  "resource_name": "Resource Course Name",
                  "url": "https://example.com/course"
                }}
              ]
            }}
          ],
          "interview_questions": [
            {{
              "question": "Interview Question Text",
              "type": "technical|hr|project|coding",
              "difficulty": "easy|medium|hard",
              "sample_answer": "Sample answer response"
            }}
          ]
        }}
        """

        response = model.generate_content(
            contents=prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        # Parse string output as JSON
        analysis_json = json.loads(response.text)
        return analysis_json

    except Exception as e:
        logger.error(f"Gemini API call failed: {e}. Falling back to mock generator.")
        return generate_mock_analysis(resume_text, target_role)

def generate_mock_analysis(resume_text, target_role):
    """Fallback mock analysis engine to keep local development functioning without API keys."""
    # Simple heuristics to extract some skills/details from text
    lines = resume_text.split('\n')
    email = "candidate@example.com"
    phone = "+1 (555) 019-2834"
    name = "John Doe"

    for line in lines:
        if "@" in line and "." in line:
            parts = line.split()
            for p in parts:
                if "@" in p:
                    email = p.strip(':,;()')
        if any(char.isdigit() for char in line) and len(line) < 30 and ("phone" in line.lower() or "cell" in line.lower() or "+" in line):
            phone = line.strip()

    detected_skills = []
    skill_keywords = ["Python", "Django", "React", "JavaScript", "SQL", "HTML", "CSS", "Git", "Docker", "Kubernetes", "AWS", "Machine Learning", "C++", "Java"]
    for skill in skill_keywords:
        if skill.lower() in resume_text.lower():
            detected_skills.append(skill)

    if not detected_skills:
        detected_skills = ["Python", "JavaScript", "React"]

    # Calculate mock scores
    score_breakup = {
        "skills_match": 28,
        "keywords": 15,
        "projects": 12,
        "experience": 11,
        "education": 8,
        "formatting": 4
    }
    ats_score = sum(score_breakup.values())

    mock_data = {
        "parsed_data": {
            "name": name,
            "email": email,
            "phone": phone,
            "linkedin": "https://linkedin.com/in/johndoe",
            "github": "https://github.com/johndoe",
            "portfolio": "",
            "skills": detected_skills,
            "education": [
                {
                    "institution": "State University",
                    "degree": "B.S. in Computer Science",
                    "year": "2024"
                }
            ],
            "experience": [
                {
                    "company": "Tech Solutions Inc.",
                    "role": "Software Developer Intern",
                    "duration": "Summer 2023",
                    "description": "Collaborated with engineers to build full-stack React components and REST APIs."
                }
            ],
            "projects": [
                {
                    "title": "Portfolio Website",
                    "description": "Interactive web app styled with CSS and Framer Motion.",
                    "technologies": ["React", "Tailwind CSS"]
                }
            ],
            "certifications": ["AWS Certified Cloud Practitioner"],
            "languages": ["English", "Spanish"]
        },
        "ats_score": ats_score,
        "score_breakup": score_breakup,
        "missing_keywords": ["Docker", "Kubernetes", "Redis", "Celery", "PostgreSQL"],
        "suggestions": [
            "Add quantitative metrics to your experience descriptors (e.g. 'improved performance by 25%').",
            "Include your portfolio URL under your contact information.",
            "Incorporate keywords like Redis, Celery, and Docker to align better with the Target Role."
        ],
        "job_recommendations": [
            {
                "title": f"Junior {target_role or 'Developer'}",
                "company": "Innovative Labs",
                "match_percentage": 82,
                "salary_range": "$75,000 - $95,000",
                "required_skills": detected_skills + ["PostgreSQL"],
                "learning_resources": [
                    {
                        "skill": "Docker",
                        "resource_name": "Docker for Beginners (Docker Docs)",
                        "url": "https://docs.docker.com/get-started/"
                    },
                    {
                        "skill": "PostgreSQL",
                        "resource_name": "PostgreSQL Tutorial",
                        "url": "https://www.postgresqltutorial.com/"
                    }
                ]
            }
        ],
        "interview_questions": [
            {
                "question": f"What experience do you have with {detected_skills[0]} in your projects?",
                "type": "technical",
                "difficulty": "medium",
                "sample_answer": "In my project, I used it to implement core API endpoints and manipulate data objects, improving execution speeds."
            },
            {
                "question": "Can you describe a challenging project conflict and how you resolved it?",
                "type": "hr",
                "difficulty": "easy",
                "sample_answer": "I aligned with the team by holding a quick sync to review conflicting requirements, resulting in a balanced compromise."
            },
            {
                "question": "Write a function that checks if a string is a palindrome.",
                "type": "coding",
                "difficulty": "easy",
                "sample_answer": "def is_palindrome(s): return s == s[::-1]"
            }
        ]
    }
    
    return mock_data
