"""Smoke-test all REST API endpoints against a running Django server."""
import io
import json
import sys
import uuid
from dataclasses import dataclass

import requests

BASE = "http://localhost:8000/api"
TIMEOUT = 30


@dataclass
class Result:
    name: str
    method: str
    path: str
    ok: bool
    status: int
    note: str = ""


results: list[Result] = []


def record(name, method, path, response, ok=None, note=""):
    if ok is None:
        ok = 200 <= response.status_code < 300
    if not note and not ok:
        try:
            note = json.dumps(response.json())[:200]
        except Exception:
            note = response.text[:200]
    results.append(Result(name, method, path, ok, response.status_code, note))


def auth_headers(access):
    return {"Authorization": f"Bearer {access}"}


def main():
    session = requests.Session()
    email = f"apitest_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPass123!"
    access = refresh = None
    user_id = resume_id = job_role_id = analysis_id = interview_id = report_id = None

    print(f"Testing API at {BASE}\n")

    # --- Auth ---
    r = session.post(
        f"{BASE}/auth/register/",
        json={
            "email": email,
            "password": password,
            "first_name": "API",
            "last_name": "Tester",
            "role": "USER",
            "phone_number": "+10000000000",
        },
        timeout=TIMEOUT,
    )
    record("Register", "POST", "/auth/register/", r)
    if r.ok:
        data = r.json()
        access = data.get("access")
        refresh = data.get("refresh")
        user_id = data.get("user", {}).get("id")

    r = session.post(
        f"{BASE}/auth/login/",
        json={"email": email, "password": password},
        timeout=TIMEOUT,
    )
    record("Login", "POST", "/auth/login/", r)
    if r.ok:
        data = r.json()
        access = data.get("access") or access
        refresh = data.get("refresh") or refresh

    if not access:
        print("FATAL: Could not obtain access token. Stopping.")
        print_summary()
        sys.exit(1)

    r = session.get(f"{BASE}/auth/profile/", headers=auth_headers(access), timeout=TIMEOUT)
    record("Get Profile", "GET", "/auth/profile/", r)

    r = session.put(
        f"{BASE}/auth/profile/update/",
        headers=auth_headers(access),
        json={"full_name": "API Tester Updated", "phone_number": "+1111111111"},
        timeout=TIMEOUT,
    )
    record("Update Profile", "PUT", "/auth/profile/update/", r)

    if refresh:
        r = session.post(
            f"{BASE}/auth/token/refresh/",
            json={"refresh": refresh},
            timeout=TIMEOUT,
        )
        record("Token Refresh", "POST", "/auth/token/refresh/", r)
        if r.ok:
            access = r.json().get("access", access)
            refresh = r.json().get("refresh", refresh)

    # --- Jobs (need roles for analysis/interview) ---
    r = session.get(f"{BASE}/jobs/roles/", headers=auth_headers(access), timeout=TIMEOUT)
    record("List Job Roles", "GET", "/jobs/roles/", r)
    if r.ok:
        payload = r.json()
        roles = payload.get("data") or payload.get("results") or payload
        if isinstance(roles, list) and roles:
            job_role_id = roles[0]["id"]

    # --- Resume upload ---
    pdf_bytes = (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R"
        b"/Contents 4 0 R>>endobj\n4 0 obj<</Length 44>>stream\n"
        b"BT /F1 12 Tf 100 700 Td (John Doe Python Developer) Tj ET\n"
        b"endstream\nendobj\nxref\n0 5\n0000000000 65535 f \n"
        b"0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n"
        b"0000000206 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n300\n%%EOF"
    )
    r = session.post(
        f"{BASE}/resumes/upload/",
        headers=auth_headers(access),
        files={"file": ("test_resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"title": "API Test Resume"},
        timeout=TIMEOUT,
    )
    record("Upload Resume", "POST", "/resumes/upload/", r)
    if r.ok:
        resume_id = (r.json().get("data") or {}).get("id")

    r = session.get(f"{BASE}/resumes/", headers=auth_headers(access), timeout=TIMEOUT)
    record("List Resumes", "GET", "/resumes/", r)

    if resume_id:
        r = session.get(
            f"{BASE}/resumes/{resume_id}/",
            headers=auth_headers(access),
            timeout=TIMEOUT,
        )
        record("Get Resume", "GET", f"/resumes/{resume_id}/", r)

        r = session.post(
            f"{BASE}/resumes/{resume_id}/parse/",
            headers=auth_headers(access),
            timeout=TIMEOUT,
        )
        record("Parse Resume", "POST", f"/resumes/{resume_id}/parse/", r)

    # --- Analysis ---
    if resume_id and job_role_id:
        r = session.post(
            f"{BASE}/analysis/analyze/",
            headers=auth_headers(access),
            json={"resume_id": resume_id, "job_role_id": job_role_id},
            timeout=TIMEOUT,
        )
        record("Analyze Resume", "POST", "/analysis/analyze/", r)
        if r.ok:
            analysis_id = (r.json().get("data") or {}).get("id")

    r = session.get(
        f"{BASE}/analysis/history/",
        headers=auth_headers(access),
        timeout=TIMEOUT,
    )
    record("Analysis History", "GET", "/analysis/history/", r)

    if resume_id:
        r = session.get(
            f"{BASE}/analysis/resume/{resume_id}/",
            headers=auth_headers(access),
            timeout=TIMEOUT,
        )
        record("Analysis By Resume", "GET", f"/analysis/resume/{resume_id}/", r)

    if analysis_id:
        r = session.get(
            f"{BASE}/analysis/{analysis_id}/",
            headers=auth_headers(access),
            timeout=TIMEOUT,
        )
        record("Get Analysis", "GET", f"/analysis/{analysis_id}/", r)

    # --- Job recommend ---
    if resume_id:
        r = session.post(
            f"{BASE}/jobs/recommend/",
            headers=auth_headers(access),
            json={"resume_id": resume_id},
            timeout=TIMEOUT,
        )
        record("Job Recommend", "POST", "/jobs/recommend/", r)

    # --- Interview ---
    if resume_id and job_role_id:
        r = session.post(
            f"{BASE}/interviews/generate/",
            headers=auth_headers(access),
            json={
                "resume_id": resume_id,
                "job_role_id": job_role_id,
                "difficulty": "MEDIUM",
            },
            timeout=TIMEOUT,
        )
        record("Generate Interview", "POST", "/interviews/generate/", r)
        if r.ok:
            data = r.json().get("data") or []
            if isinstance(data, list) and data:
                interview_id = data[0].get("id")

    if resume_id:
        r = session.get(
            f"{BASE}/interviews/resume/{resume_id}/",
            headers=auth_headers(access),
            timeout=TIMEOUT,
        )
        record("Interviews By Resume", "GET", f"/interviews/resume/{resume_id}/", r)

    if interview_id:
        r = session.get(
            f"{BASE}/interviews/{interview_id}/",
            headers=auth_headers(access),
            timeout=TIMEOUT,
        )
        record("Get Interview", "GET", f"/interviews/{interview_id}/", r)

    # --- Reports ---
    if analysis_id:
        r = session.post(
            f"{BASE}/reports/generate/",
            headers=auth_headers(access),
            json={"analysis_id": analysis_id},
            timeout=TIMEOUT,
        )
        record("Generate Report", "POST", "/reports/generate/", r)
        if r.ok:
            report_id = (r.json().get("data") or {}).get("id")

    r = session.get(f"{BASE}/reports/", headers=auth_headers(access), timeout=TIMEOUT)
    record("List Reports", "GET", "/reports/", r)

    if report_id:
        r = session.get(
            f"{BASE}/reports/{report_id}/download/",
            headers=auth_headers(access),
            timeout=TIMEOUT,
        )
        record("Download Report", "GET", f"/reports/{report_id}/download/", r)

    # --- Dashboard ---
    r = session.get(
        f"{BASE}/dashboard/summary/",
        headers=auth_headers(access),
        timeout=TIMEOUT,
    )
    record("Dashboard Summary", "GET", "/dashboard/summary/", r)

    r = session.get(
        f"{BASE}/dashboard/admin/summary/",
        headers=auth_headers(access),
        timeout=TIMEOUT,
    )
    record(
        "Admin Dashboard (USER role)",
        "GET",
        "/dashboard/admin/summary/",
        r,
        ok=r.status_code in (200, 403),
        note="403 expected for USER role" if r.status_code == 403 else "",
    )

    # --- Frontend URL compatibility checks ---
    if resume_id:
        r = session.delete(
            f"{BASE}/resumes/{resume_id}/",
            headers=auth_headers(access),
            timeout=TIMEOUT,
        )
        record(
            "Delete Resume (frontend path /resumes/:id/)",
            "DELETE",
            f"/resumes/{resume_id}/",
            r,
            ok=r.status_code in (200, 204, 405),
            note="405 means backend expects /delete/ suffix" if r.status_code == 405 else "",
        )

        if r.status_code == 405:
            r2 = session.delete(
                f"{BASE}/resumes/{resume_id}/delete/",
                headers=auth_headers(access),
                timeout=TIMEOUT,
            )
            record(
                "Delete Resume (backend path /resumes/:id/delete/)",
                "DELETE",
                f"/resumes/{resume_id}/delete/",
                r2,
            )

    r = session.post(
        f"{BASE}/jobs/roles/",
        headers=auth_headers(access),
        json={"title": "Test Role", "required_skills": ["Python"]},
        timeout=TIMEOUT,
    )
    record(
        "Create Job Role (frontend POST /jobs/roles/)",
        "POST",
        "/jobs/roles/",
        r,
        ok=r.status_code in (200, 201, 403, 405),
        note="405/403 if create is admin-only at /roles/create/" if r.status_code in (403, 405) else "",
    )

    # --- Logout ---
    if refresh:
        r = session.post(
            f"{BASE}/auth/logout/",
            headers=auth_headers(access),
            json={"refresh": refresh},
            timeout=TIMEOUT,
        )
        record("Logout", "POST", "/auth/logout/", r)

    print_summary()


def print_summary():
    passed = sum(1 for r in results if r.ok)
    failed = [r for r in results if not r.ok]
    print("=" * 72)
    print(f"RESULTS: {passed}/{len(results)} passed\n")
    for r in results:
        icon = "PASS" if r.ok else "FAIL"
        print(f"[{icon}] {r.method:6} {r.path:40} -> {r.status}")
        if r.note and not r.ok:
            print(f"       {r.note}")
    if failed:
        print("\nFAILED ENDPOINTS:")
        for r in failed:
            print(f"  - {r.method} {r.path} ({r.status}): {r.note}")
        sys.exit(1)


if __name__ == "__main__":
    main()
