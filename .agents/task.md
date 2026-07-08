# Implementation Checklist

- [x] Update Django Database Models
  - [x] Add `credits` field to custom `User` model in `accounts/models.py`
  - [x] Add `InterviewerProfile`, `AvailabilitySlot`, `Booking`, and `CreditTransaction` to `interview/models.py`
  - [x] Generate and run Django migrations
- [x] Implement Django Serializers and Views
  - [x] Create serializers for interviewers, slots, bookings, and transactions in `interview/serializers.py`
  - [x] Add views for booking, listing slots, listing interviewers, and checking out in `interview/views.py`
  - [x] Add routes in `interview/urls.py`
- [x] Create Seed Data for Testing
  - [x] Add a Django command `seed_interviewers` to seed some sample interviewers and slot availabilities
  - [x] Run `seed_interviewers` command to populate database
- [x] Update Frontend Pages and Router
  - [x] Update `MockInterview.jsx` with useNavigate and P2P booking CTA on session completion
  - [x] Create `BookInterviewer.jsx` with interactive calendar picker and category filters
  - [x] Create `LiveCallWorkspace.jsx` featuring split camera tiles, real-time simulated peer interaction, text chat panel, and AI questions sidebar
  - [x] Register new pages and routes in `App.jsx` and add nav link in `Sidebar.jsx`
- [x] Verification and Walkthrough
  - [x] Create walkthrough.md with validation summaries
