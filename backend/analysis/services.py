from .models import ResumeAnalysis
from jobs.models import JobRole
from resume.models import Resume
from services.gemini_service import generate_resume_suggestions


def _score_skills(parsed_skills, required_skills):
    if not required_skills:
        return 35, [], []
    matched = [skill for skill in required_skills if skill.lower() in [s.lower() for s in parsed_skills]]
    missing = [skill for skill in required_skills if skill not in matched]
    score = min(35, round((len(matched) / len(required_skills)) * 35, 2))
    return score, matched, missing


def _score_keywords(text, keywords):
    if not keywords:
        return 20
    lower_text = text.lower()
    matched = [keyword for keyword in keywords if keyword.lower() in lower_text]
    return min(20, round((len(matched) / len(keywords)) * 20, 2))


def _score_projects(parsed_resume):
    projects = parsed_resume.get('projects', []) if parsed_resume else []
    return 15 if projects else 0


def _score_experience(parsed_resume):
    experience = parsed_resume.get('experience', []) if parsed_resume else []
    if not experience:
        return 0
    return min(15, round(5 + min(len(experience), 2) * 5, 2))


def _score_education(parsed_resume):
    education = parsed_resume.get('education', []) if parsed_resume else []
    return 10 if education else 0


def _score_formatting(parsed_resume):
    score = 0
    if parsed_resume.get('email'):
        score += 1.25
    if parsed_resume.get('phone'):
        score += 1.25
    if parsed_resume.get('skills'):
        score += 1.25
    if parsed_resume.get('experience'):
        score += 1.25
    return min(5, round(score, 2))


def analyze_resume(resume: Resume, job_role: JobRole) -> ResumeAnalysis:
    parsed = getattr(resume, 'parsed_data', None)
    parsed_data = parsed.__dict__ if parsed else {}
    parsed_resume = {
        'skills': parsed_data.get('skills', []),
        'experience': parsed_data.get('experience', []),
        'education': parsed_data.get('education', []),
        'projects': parsed_data.get('projects', []),
        'email': parsed_data.get('email', ''),
        'phone': parsed_data.get('phone', ''),
    }

    skills_score, matched_skills, missing_skills = _score_skills(parsed_resume['skills'], job_role.required_skills)
    keywords_score = _score_keywords(resume.extracted_text or '', job_role.keywords)
    projects_score = _score_projects(parsed_resume)
    experience_score = _score_experience(parsed_resume)
    education_score = _score_education(parsed_resume)
    formatting_score = _score_formatting(parsed_resume)
    ats_score = round(skills_score + keywords_score + projects_score + experience_score + education_score + formatting_score, 2)
    job_match_percentage = round((skills_score + keywords_score + projects_score + experience_score + education_score) / 95 * 100, 2) if ats_score else 0

    suggestions = generate_resume_suggestions(resume.extracted_text or '', {
        'title': job_role.title,
        'required_skills': job_role.required_skills,
    })

    ResumeAnalysis.objects.filter(resume=resume, user=resume.user, job_role=job_role).delete()

    analysis = ResumeAnalysis.objects.create(
        resume=resume,
        user=resume.user,
        job_role=job_role,
        ats_score=ats_score,
        skills_score=skills_score,
        keywords_score=keywords_score,
        projects_score=projects_score,
        experience_score=experience_score,
        education_score=education_score,
        formatting_score=formatting_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        suggestions=suggestions,
        job_match_percentage=job_match_percentage,
    )
    return analysis
