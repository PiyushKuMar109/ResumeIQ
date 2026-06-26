from django.core.management.base import BaseCommand

from jobs.models import JobRole


JOB_ROLES = [
    {
        'title': 'Python Developer',
        'description': 'Build backend services, APIs, automation scripts, and maintain Python applications.',
        'required_skills': ['Python', 'REST API', 'PostgreSQL', 'Git'],
        'keywords': ['python', 'api', 'backend', 'automation', 'postgresql'],
        'experience_level': 'Fresher',
    },
    {
        'title': 'Django Developer',
        'description': 'Develop Django apps, REST endpoints, authentication flows, and database-backed services.',
        'required_skills': ['Python', 'Django', 'REST API', 'PostgreSQL', 'JWT'],
        'keywords': ['django', 'drf', 'python', 'postgresql', 'jwt'],
        'experience_level': 'Fresher',
    },
    {
        'title': 'React Developer',
        'description': 'Build responsive React interfaces, reusable components, and frontend state flows.',
        'required_skills': ['JavaScript', 'React', 'HTML', 'CSS', 'Tailwind'],
        'keywords': ['react', 'frontend', 'vite', 'tailwind', 'javascript'],
        'experience_level': 'Fresher',
    },
    {
        'title': 'Full Stack Developer',
        'description': 'Own frontend and backend features across APIs, databases, and UI delivery.',
        'required_skills': ['Python', 'Django', 'React', 'PostgreSQL', 'Git'],
        'keywords': ['full stack', 'react', 'django', 'api', 'database'],
        'experience_level': 'Intermediate',
    },
    {
        'title': 'Backend Developer',
        'description': 'Design APIs, business logic, integrations, and scalable backend services.',
        'required_skills': ['Python', 'Django', 'REST API', 'PostgreSQL', 'Docker'],
        'keywords': ['backend', 'api', 'microservices', 'django', 'docker'],
        'experience_level': 'Intermediate',
    },
    {
        'title': 'Frontend Developer',
        'description': 'Create polished frontend experiences with strong UX, responsiveness, and performance.',
        'required_skills': ['JavaScript', 'React', 'HTML', 'CSS', 'Tailwind'],
        'keywords': ['frontend', 'react', 'responsive', 'ui', 'css'],
        'experience_level': 'Fresher',
    },
    {
        'title': 'Data Analyst',
        'description': 'Analyze datasets, build reports and dashboards, and deliver business insights.',
        'required_skills': ['Python', 'Pandas', 'NumPy', 'Data Analysis', 'SQL'],
        'keywords': ['analytics', 'sql', 'pandas', 'dashboard', 'reporting'],
        'experience_level': 'Fresher',
    },
    {
        'title': 'Machine Learning Engineer',
        'description': 'Train, evaluate, and deploy machine learning models for production use cases.',
        'required_skills': ['Python', 'Machine Learning', 'Scikit-learn', 'TensorFlow', 'Docker'],
        'keywords': ['ml', 'model', 'training', 'deployment', 'scikit-learn'],
        'experience_level': 'Intermediate',
    },
    {
        'title': 'AI/ML Engineer',
        'description': 'Build AI-powered systems using machine learning, NLP, and model-serving pipelines.',
        'required_skills': ['Python', 'Machine Learning', 'NLP', 'PyTorch', 'Docker'],
        'keywords': ['ai', 'ml', 'nlp', 'pytorch', 'inference'],
        'experience_level': 'Intermediate',
    },
    {
        'title': 'DevOps Engineer',
        'description': 'Automate deployments, manage cloud infrastructure, and improve delivery reliability.',
        'required_skills': ['Docker', 'AWS', 'Linux', 'Git', 'CI/CD'],
        'keywords': ['devops', 'docker', 'aws', 'pipeline', 'infrastructure'],
        'experience_level': 'Intermediate',
    },
    {
        'title': 'Software Engineer',
        'description': 'Build scalable software systems with strong coding, problem-solving, and collaboration skills.',
        'required_skills': ['Python', 'JavaScript', 'Git', 'REST API', 'SQL'],
        'keywords': ['software engineer', 'coding', 'system design', 'api', 'sql'],
        'experience_level': 'Fresher',
    },
    {
        'title': 'Data Scientist',
        'description': 'Analyze data, build predictive models, and translate insights into business impact.',
        'required_skills': ['Python', 'Pandas', 'NumPy', 'Machine Learning', 'SQL'],
        'keywords': ['data science', 'modeling', 'python', 'sql', 'analytics'],
        'experience_level': 'Intermediate',
    },
    {
        'title': 'Business Analyst',
        'description': 'Bridge business requirements and technical execution using analysis, reporting, and documentation.',
        'required_skills': ['SQL', 'Data Analysis', 'Excel', 'Reporting', 'Communication'],
        'keywords': ['business analysis', 'reporting', 'stakeholders', 'sql', 'requirements'],
        'experience_level': 'Fresher',
    },
    {
        'title': 'Cloud Engineer',
        'description': 'Design and maintain cloud-native systems, deployments, and infrastructure automation.',
        'required_skills': ['AWS', 'Docker', 'Linux', 'Python', 'Git'],
        'keywords': ['cloud', 'aws', 'deployment', 'infrastructure', 'automation'],
        'experience_level': 'Intermediate',
    },
    {
        'title': 'QA Engineer',
        'description': 'Test software quality through automation, regression coverage, and release validation.',
        'required_skills': ['Testing', 'Automation', 'Python', 'Selenium', 'Git'],
        'keywords': ['qa', 'testing', 'automation', 'selenium', 'quality'],
        'experience_level': 'Fresher',
    },
    {
        'title': 'UI/UX Developer',
        'description': 'Translate product ideas into usable, accessible, and polished user experiences.',
        'required_skills': ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design'],
        'keywords': ['ui', 'ux', 'design system', 'frontend', 'responsive'],
        'experience_level': 'Fresher',
    },
    {
        'title': 'Node.js Developer',
        'description': 'Develop backend services and APIs using JavaScript and Node.js ecosystems.',
        'required_skills': ['JavaScript', 'Node.js', 'Express', 'MongoDB', 'REST API'],
        'keywords': ['node', 'express', 'backend', 'mongodb', 'api'],
        'experience_level': 'Fresher',
    },
    {
        'title': 'FastAPI Developer',
        'description': 'Build modern Python APIs with FastAPI, async workflows, and performant services.',
        'required_skills': ['Python', 'FastAPI', 'REST API', 'PostgreSQL', 'Docker'],
        'keywords': ['fastapi', 'python', 'async', 'api', 'postgresql'],
        'experience_level': 'Intermediate',
    },
    {
        'title': 'NLP Engineer',
        'description': 'Build text-processing, language models, and NLP pipelines for AI applications.',
        'required_skills': ['Python', 'NLP', 'Machine Learning', 'PyTorch', 'TensorFlow'],
        'keywords': ['nlp', 'language model', 'text processing', 'pytorch', 'ai'],
        'experience_level': 'Intermediate',
    },
    {
        'title': 'MERN Stack Developer',
        'description': 'Build full-stack JavaScript applications with MongoDB, Express, React, and Node.js.',
        'required_skills': ['MongoDB', 'Express', 'React', 'Node.js', 'JavaScript'],
        'keywords': ['mern', 'react', 'node', 'mongodb', 'express'],
        'experience_level': 'Fresher',
    },
]


class Command(BaseCommand):
    help = 'Seed default job roles for the AI Resume Analyzer project.'

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for item in JOB_ROLES:
            _, was_created = JobRole.objects.update_or_create(
                title=item['title'],
                defaults=item,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seed complete. Created: {created}, Updated: {updated}'
        ))
