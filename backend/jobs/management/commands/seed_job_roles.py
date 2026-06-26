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
