import os
import re
import io
import pdfplumber
from docx import Document

SKILLS_LIST = [
    'Python', 'Django', 'Flask', 'FastAPI', 'JavaScript', 'React', 'Node.js',
    'Express', 'MongoDB', 'PostgreSQL', 'MySQL', 'HTML', 'CSS', 'Tailwind',
    'Bootstrap', 'Git', 'GitHub', 'REST API', 'JWT', 'AWS', 'S3', 'Docker', 'SQL',
    'Linux', 'Machine Learning', 'NLP', 'Data Analysis', 'Pandas', 'NumPy',
    'Scikit-learn', 'TensorFlow', 'PyTorch',
]

EDUCATION_KEYWORDS = [
    'bachelor', 'master', 'b.sc', 'm.sc', 'beng', 'b.e.', 'm.eng', 'mphil',
    'phd', 'diploma', 'certificate', 'high school', 'degree', 'college', 'university',
]

LANGUAGE_KEYWORDS = [
    'english', 'spanish', 'french', 'german', 'hindi', 'mandarin', 'japanese',
]

URL_PATTERNS = {
    'linkedin': r'https?://(?:www\.)?linkedin\.com/[A-Za-z0-9_\-/.]+',
    'github': r'https?://(?:www\.)?github\.com/[A-Za-z0-9_\-/.]+',
    'portfolio': r'https?://[A-Za-z0-9\-]+\.(?:com|dev|io|app|me)(?:/[A-Za-z0-9_\-/.]*)?',
}

EMAIL_PATTERN = r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
PHONE_PATTERN = r'\+?\d[\d\s\-()]{7,}\d'


def extract_text_from_pdf(file_obj) -> str:
    try:
        file_obj.seek(0)
        with pdfplumber.open(file_obj) as pdf:
            pages = [page.extract_text() or '' for page in pdf.pages]
        return '\n'.join(pages)
    except Exception:
        return ''


def extract_text_from_docx(file_obj) -> str:
    try:
        file_obj.seek(0)
        doc = Document(file_obj)
        paragraphs = [p.text for p in doc.paragraphs]
        return '\n'.join(paragraphs)
    except Exception:
        return ''


def extract_email(text: str) -> str:
    matches = re.findall(EMAIL_PATTERN, text)
    return matches[0] if matches else ''


def extract_phone(text: str) -> str:
    matches = re.findall(PHONE_PATTERN, text)
    if not matches:
        return ''
    normalized = [re.sub(r'[^0-9+]', '', p) for p in matches]
    return normalized[0]


def extract_urls(text: str, url_type: str) -> str:
    pattern = URL_PATTERNS.get(url_type)
    if not pattern:
        return ''
    matches = re.findall(pattern, text, flags=re.IGNORECASE)
    return matches[0] if matches else ''


def extract_skills(text: str) -> list:
    results = []
    lower_text = text.lower()
    for skill in SKILLS_LIST:
        if skill.lower() in lower_text and skill not in results:
            results.append(skill)
    return results


def extract_education(text: str) -> list:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    education = []
    for line in lines:
        lower = line.lower()
        if any(keyword in lower for keyword in EDUCATION_KEYWORDS):
            education.append(line)
    return education[:10]


def extract_projects(text: str) -> list:
    sections = re.split(r'\n\s*projects?\s*\n', text, flags=re.IGNORECASE)
    if len(sections) < 2:
        return []
    project_text = sections[1]
    blocks = re.split(r'\n\s*\n', project_text)
    return [block.strip() for block in blocks if len(block.strip()) > 20][:5]


def extract_experience(text: str) -> list:
    sections = re.split(r'\n\s*(experience|work history|professional experience)\s*\n', text, flags=re.IGNORECASE)
    if len(sections) < 3:
        return []
    experience_text = sections[2]
    blocks = re.split(r'\n\s*\n', experience_text)
    return [block.strip() for block in blocks if len(block.strip()) > 20][:6]


def extract_certifications(text: str) -> list:
    sections = re.split(r'\n\s*certifications?\s*\n', text, flags=re.IGNORECASE)
    if len(sections) < 2:
        return []
    lines = [line.strip() for line in sections[1].splitlines() if line.strip()]
    return [line for line in lines if len(line) > 5][:8]


def extract_languages(text: str) -> list:
    found = []
    lower = text.lower()
    for lang in LANGUAGE_KEYWORDS:
        if lang in lower:
            found.append(lang.title())
    return found


def extract_name(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines[:5]:
        if len(line.split()) <= 5 and not re.search(EMAIL_PATTERN, line) and not re.search(PHONE_PATTERN, line):
            if any(char.isalpha() for char in line):
                return line
    return ''


def parse_resume(file_obj, file_type: str) -> dict:
    text = ''
    if file_type == 'pdf':
        text = extract_text_from_pdf(file_obj)
    elif file_type == 'docx':
        text = extract_text_from_docx(file_obj)
    else:
        text = ''

    extracted_text = text.strip()
    if not extracted_text:
        try:
            file_obj.seek(0)
        except Exception:
            pass
        extracted_text = file_obj.read().decode('utf-8', errors='ignore') if hasattr(file_obj, 'read') else ''

    parsed = {
        'name': extract_name(extracted_text),
        'email': extract_email(extracted_text),
        'phone': extract_phone(extracted_text),
        'linkedin': extract_urls(extracted_text, 'linkedin'),
        'github': extract_urls(extracted_text, 'github'),
        'portfolio': extract_urls(extracted_text, 'portfolio'),
        'skills': extract_skills(extracted_text),
        'education': extract_education(extracted_text),
        'experience': extract_experience(extracted_text),
        'projects': extract_projects(extracted_text),
        'certifications': extract_certifications(extracted_text),
        'languages': extract_languages(extracted_text),
    }
    return {'extracted_text': extracted_text, 'parsed': parsed}
