from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from interview.models import InterviewerProfile, AvailabilitySlot
from django.utils import timezone
import datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds mock interviewer profiles and availability slots for testing'

    def handle(self, *args, **options):
        self.stdout.write("Seeding interviewers...")
        
        # Create user accounts for interviewers if they don't exist
        mock_data = [
            {
                "email": "satish.kamati@example.com",
                "full_name": "Satish Kamati",
                "title": "Staff Software Engineer",
                "company": "Innovotors Ltd",
                "skills": "React, TypeScript, CSS, Node.js",
                "bio": "Over 7 years of experience in front-end development, specializing in performance optimization and design systems.",
                "credit_rate": 15
            },
            {
                "email": "nitish.kamati@example.com",
                "full_name": "Nitish Kamati",
                "title": "Senior Backend Architect",
                "company": "Meta Platforms",
                "skills": "Django, Python, PostgreSQL, AWS, Docker",
                "bio": "Passionate about cloud architecture, building distributed systems, and backend optimization.",
                "credit_rate": 20
            },
            {
                "email": "jyoti.verma@example.com",
                "full_name": "Dr. Jyoti Verma",
                "title": "AI/ML Scientist",
                "company": "DeepLearning Labs",
                "skills": "PyTorch, TensorFlow, Python, LLMs, NLP",
                "bio": "Researcher in large language models and natural language processing. Former university professor.",
                "credit_rate": 30
            }
        ]

        now = timezone.now()

        for data in mock_data:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "full_name": data["full_name"],
                    "is_active": True,
                    "role": "USER"
                }
            )
            if created:
                user.set_password("password123")
                user.save()
                self.stdout.write(f"Created user {data['email']}")

            # Create profile
            profile, prof_created = InterviewerProfile.objects.get_or_create(
                user=user,
                defaults={
                    "bio": data["bio"],
                    "company": data["company"],
                    "title": data["title"],
                    "skills": data["skills"],
                    "credit_rate": data["credit_rate"]
                }
            )
            if not prof_created:
                profile.bio = data["bio"]
                profile.company = data["company"]
                profile.title = data["title"]
                profile.skills = data["skills"]
                profile.credit_rate = data["credit_rate"]
                profile.save()
                self.stdout.write(f"Updated profile for {data['email']}")
            else:
                self.stdout.write(f"Created profile for {data['email']}")

            # Add availability slots for today, tomorrow, and day after tomorrow
            # Clean old slots first
            AvailabilitySlot.objects.filter(interviewer=profile).delete()

            for day_offset in range(3):
                date = now + datetime.timedelta(days=day_offset)
                # Slot 1: 10:00 AM - 10:45 AM
                start1 = datetime.datetime.combine(date.date(), datetime.time(10, 0))
                end1 = datetime.datetime.combine(date.date(), datetime.time(10, 45))
                AvailabilitySlot.objects.create(
                    interviewer=profile,
                    start_time=timezone.make_aware(start1),
                    end_time=timezone.make_aware(end1),
                    is_booked=False
                )

                # Slot 2: 3:00 PM - 3:45 PM
                start2 = datetime.datetime.combine(date.date(), datetime.time(15, 0))
                end2 = datetime.datetime.combine(date.date(), datetime.time(15, 45))
                AvailabilitySlot.objects.create(
                    interviewer=profile,
                    start_time=timezone.make_aware(start2),
                    end_time=timezone.make_aware(end2),
                    is_booked=False
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded mock interviewers and slots!"))
