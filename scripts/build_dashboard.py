#!/usr/bin/env python3
"""
WordPress Credits Dashboard Builder

Fetches data from Airtable and builds the dashboard JSON data blob.
"""
import os
import json
import sys
import requests
from datetime import datetime
from pathlib import Path

# Configuration
BASE_ID = "appIzQKfwTn5dyPVp"
API_URL = "https://api.airtable.com/v0"

# Table IDs
TABLES = {
    "students_reports": "tbljYkkVGbeoaWEtY",
    "students": "tbla8GZg5x6NY7aWt",
    "mentors": "tblJmEYgBWYxVuzUw",
    "institutions": "tbl4V0FEbzRP7I2w2",
    "sponsors": "tbluji8wknOZr55fa",
    "languages": "tblaxEPaabmlccHWn",
    "contribution_areas": "tblUBEXiS3QKUCXHf",
    "countries": "tbltB7GSRoTtSi4Ps",
}

# Field IDs
FIELDS = {
    "students_reports": {
        "name": "fldyXVlkChJaO9Q47",
        "status": "fldCMdqqJGAUQ9nbV",
        "institution": "fldRqJlE4nwZQR3QO",
        "hours": "fld7msftOzCxAG5E3",
        "wp_profile": "fld2rGCjmvTZg5DLg",
        "teams": "fldwPGiajTLTu1Vqi",
        "internship_end_date": "fldLwLXupWurmimc7",
        "lessons": "fldE1rkXbTWJe8bBq",
        "mentor": "fldSBTwMgno8ecQ2X",
    },
    "students": {
        "full_name": "fldvGRKcyRBACeX9t",
        "field_of_study": "fldwVUA9HZUhZFxJL",
        "internship_end_date": "fld6DQEFvDcaM9PuZ",
        "wp_profile": "fldqZWsRYplXlc8E4",
    },
    "mentors": {
        "full_name": "fldHYNbsylHn4SPQI",
        "wp_profile": "fld8RNVcZ861zDRp5",
        "status": "fldxe86OLwnyWqRSD",
        "country": "fldEdaWeBP8er8XwM",
        "languages": "fldXfYWBQgoo8LNpQ",
        "students": "fld7b9hj4UG14KohI",
        "student_reports": "fldnbYOM2vHPwJjpg",
        "sponsored": "fldFypFl2gQkUszXn",
        "sponsor_company": "fldtdhRzXWpfcb13w",
        "affiliated_company": "flde2iNU183R2CYXa",
    },
    "institutions": {
        "name": "fldZQBu7XS2Z29jx4",
        "city": "fldinUAUulxqjZ7d5",
        "country": "fldMZYV5XmC6FbewY",
    },
    "sponsors": {
        "company_name": "fldezMq2OBVeqn0DK",
    },
    "languages": {
        "name": "flducizfXx3Lz4cid",
    },
    "contribution_areas": {
        "name": "flduk4myvdidZsAlH",
    },
    "countries": {
        "name": "fldtNqCEbpwdo9F2t",
    },
}

# Institution markers (hardcoded, won't change often)
INST_MARKERS = [
    {"city": "Pisa", "country": "Italy", "lat": 43.7228, "lng": 10.4017, "institutions": ["Università di Pisa"]},
    {"city": "Dhaka", "country": "Bangladesh", "lat": 23.8103, "lng": 90.4125, "institutions": ["Ahmad's Education"]},
    {"city": "Toledo", "country": "Spain", "lat": 39.8628, "lng": -4.0273, "institutions": ["IES Azarquiel"]},
    {"city": "Madrid", "country": "Spain", "lat": 40.4168, "lng": -3.7038, "institutions": ["Creative Campus - Universidad Europea"]},
    {"city": "Albuquerque", "country": "United States", "lat": 35.0844, "lng": -106.6504, "institutions": ["Central New Mexico Community College"]},
    {"city": "Riga", "country": "Latvia", "lat": 56.9496, "lng": 24.1052, "institutions": ["Riga Nordic University"]},
    {"city": "Cochabamba", "country": "Bolivia", "lat": -17.3895, "lng": -66.1568, "institutions": ["Universidad Privada Franz Tamayo (UNIFRANZ)"]},
    {"city": "La Paz", "country": "Bolivia", "lat": -16.5000, "lng": -68.1193, "institutions": ["Universidad Privada Franz Tamayo (UNIFRANZ)"]},
    {"city": "Santa Cruz de la Sierra", "country": "Bolivia", "lat": -17.7833, "lng": -63.1822, "institutions": ["Universidad Privada Franz Tamayo (UNIFRANZ)"]},
    {"city": "El Alto", "country": "Bolivia", "lat": -16.5100, "lng": -68.1600, "institutions": ["Universidad Privada Franz Tamayo (UNIFRANZ)"]},
    {"city": "San José", "country": "Costa Rica", "lat": 9.9281, "lng": -84.0907, "institutions": ["Universidad Fidélitas"]},
    {"city": "Kraków", "country": "Poland", "lat": 50.0647, "lng": 19.9450, "institutions": ["Krakow University of Economics"]},
    {"city": "Vilanova i la Geltrú", "country": "Spain", "lat": 41.2242, "lng": 1.7257, "institutions": ["Creative Campus - Universidad Europea"]},
    {"city": "Valencia", "country": "Spain", "lat": 39.4699, "lng": -0.3763, "institutions": ["Creative Campus - Universidad Europea"]},
    {"city": "Tenerife", "country": "Spain", "lat": 28.2916, "lng": -16.6291, "institutions": ["Creative Campus - Universidad Europea"]},
    {"city": "Alcobendas", "country": "Spain", "lat": 40.5475, "lng": -3.6419, "institutions": ["Creative Campus - Universidad Europea"]},
    {"city": "Ahmedabad", "country": "India", "lat": 23.0225, "lng": 72.5714, "institutions": ["Ahmad's Education"]},
    {"city": "Split", "country": "Croatia", "lat": 43.5081, "lng": 16.4402, "institutions": ["Creative Campus - Universidad Europea"]},
    {"city": "Poznań", "country": "Poland", "lat": 52.4064, "lng": 16.9252, "institutions": ["Krakow University of Economics"]},
    {"city": "Hemet", "country": "United States", "lat": 33.7476, "lng": -116.9719, "institutions": ["Central New Mexico Community College"]}
]


def get_airtable_pat():
    """Get Airtable PAT from environment variable."""
    pat = os.environ.get("AIRTABLE_PAT")
    if not pat:
        raise ValueError("AIRTABLE_PAT environment variable not set")
    return pat


def fetch_all_records(base_id, table_id, field_ids, pat):
    """Fetch all records from Airtable table with pagination."""
    url = f"{API_URL}/{base_id}/{table_id}"
    headers = {"Authorization": f"Bearer {pat}"}
    params = {"fields[]": field_ids, "pageSize": 100}

    all_records = []
    offset = None

    while True:
        if offset:
            params["offset"] = offset

        try:
            r = requests.get(url, headers=headers, params=params, timeout=10)
            r.raise_for_status()
        except requests.RequestException as e:
            print(f"Error fetching {table_id}: {e}", file=sys.stderr)
            raise

        data = r.json()
        all_records.extend(data.get("records", []))
        offset = data.get("offset")

        if not offset:
            break

    return all_records


def title_case(text):
    """Convert to title case, preserving Spanish prepositions and acronyms."""
    if not text:
        return text

    spanish_lowercase = {"de", "del", "la", "las", "los", "el", "en", "y", "e", "al"}
    words = text.split()
    result = []

    for i, word in enumerate(words):
        # Keep acronyms in parentheses uppercase
        if "(" in word and ")" in word:
            result.append(word)
        # First word is always capitalized
        elif i == 0:
            result.append(word.capitalize())
        # Spanish prepositions lowercase (except first)
        elif word.lower() in spanish_lowercase:
            result.append(word.lower())
        else:
            result.append(word.capitalize())

    return " ".join(result)


def extract_wp_username(url):
    """Extract WordPress username from profile URL."""
    if not url:
        return None
    # Format: https://profiles.wordpress.org/username/
    if "profiles.wordpress.org" in url:
        parts = url.rstrip("/").split("/")
        return parts[-1] if parts else None
    return None


def get_cohort_from_date(date_str):
    """Determine cohort (Winter/Spring/Summer/Fall) from internship end date."""
    if not date_str:
        return None

    try:
        # Parse date: YYYY-MM-DD
        month = int(date_str.split("-")[1])
        year = int(date_str.split("-")[0])
    except (ValueError, IndexError):
        return None

    # Winter: Dec 21 - Mar 19 (year of end of range, so Mar = same year)
    if month >= 12 or month <= 3:
        if month == 12:
            return f"Winter {year + 1}"
        else:
            return f"Winter {year}"
    # Spring: Mar 20 - Jun 20
    elif 3 <= month <= 6:
        return f"Spring {year}"
    # Summer: Jun 21 - Sep 21
    elif 6 <= month <= 9:
        return f"Summer {year}"
    # Fall: Sep 22 - Dec 20
    elif 9 <= month <= 12:
        return f"Fall {year}"

    return None


def get_field_value(record, field_id):
    """Safely get field value from Airtable record."""
    fields = record.get("fields", {})
    return fields.get(field_id)


def main():
    """Build the dashboard data blob."""
    pat = get_airtable_pat()

    print("Fetching Airtable data...", file=sys.stderr)

    # Fetch all tables
    students_reports_records = fetch_all_records(
        BASE_ID, TABLES["students_reports"],
        list(FIELDS["students_reports"].values()), pat
    )
    students_records = fetch_all_records(
        BASE_ID, TABLES["students"],
        list(FIELDS["students"].values()), pat
    )
    mentors_records = fetch_all_records(
        BASE_ID, TABLES["mentors"],
        list(FIELDS["mentors"].values()), pat
    )
    institutions_records = fetch_all_records(
        BASE_ID, TABLES["institutions"],
        list(FIELDS["institutions"].values()), pat
    )
    sponsors_records = fetch_all_records(
        BASE_ID, TABLES["sponsors"],
        list(FIELDS["sponsors"].values()), pat
    )
    languages_records = fetch_all_records(
        BASE_ID, TABLES["languages"],
        list(FIELDS["languages"].values()), pat
    )
    contribution_areas_records = fetch_all_records(
        BASE_ID, TABLES["contribution_areas"],
        list(FIELDS["contribution_areas"].values()), pat
    )
    countries_records = fetch_all_records(
        BASE_ID, TABLES["countries"],
        list(FIELDS["countries"].values()), pat
    )

    print(f"Fetched {len(students_reports_records)} student reports", file=sys.stderr)
    print(f"Fetched {len(mentors_records)} mentors", file=sys.stderr)

    # Build lookup tables
    institutions_lookup = {}
    for rec in institutions_records:
        inst_id = rec["id"]
        name = get_field_value(rec, FIELDS["institutions"]["name"])
        if name:
            institutions_lookup[inst_id] = {"name": title_case(name)}

    sponsors_lookup = {}
    for rec in sponsors_records:
        sponsor_id = rec["id"]
        name = get_field_value(rec, FIELDS["sponsors"]["company_name"])
        if name:
            sponsors_lookup[sponsor_id] = {"name": title_case(name)}

    languages_lookup = {}
    for rec in languages_records:
        lang_id = rec["id"]
        name = get_field_value(rec, FIELDS["languages"]["name"])
        if name:
            languages_lookup[lang_id] = {"name": title_case(name)}

    contribution_areas_lookup = {}
    for rec in contribution_areas_records:
        area_id = rec["id"]
        name = get_field_value(rec, FIELDS["contribution_areas"]["name"])
        if name:
            contribution_areas_lookup[area_id] = {"name": title_case(name)}

    countries_lookup = {}
    for rec in countries_records:
        country_id = rec["id"]
        name = get_field_value(rec, FIELDS["countries"]["name"])
        if name:
            countries_lookup[country_id] = {"name": title_case(name)}

    # Build students mapping (name -> record) for cross-reference
    students_by_name = {}
    for rec in students_records:
        name = get_field_value(rec, FIELDS["students"]["full_name"])
        if name:
            students_by_name[name] = rec

    # Process students
    students = []
    institutions_set = set()
    team_distribution = {}
    active_count = 0
    graduate_count = 0
    total_hours = 0
    field_of_study_stats = {}
    country_from_mentor = {}  # Track which students have which country via mentor

    for rec in students_reports_records:
        name = get_field_value(rec, FIELDS["students_reports"]["name"])
        status_obj = get_field_value(rec, FIELDS["students_reports"]["status"])
        hours = get_field_value(rec, FIELDS["students_reports"]["hours"]) or 0
        wp_profile = get_field_value(rec, FIELDS["students_reports"]["wp_profile"])
        internship_end_date = get_field_value(rec, FIELDS["students_reports"]["internship_end_date"])
        lessons_ids = get_field_value(rec, FIELDS["students_reports"]["lessons"]) or []
        teams_ids = get_field_value(rec, FIELDS["students_reports"]["teams"]) or []

        if not name:
            continue

        # Parse status
        status = None
        if status_obj and isinstance(status_obj, dict):
            status = status_obj.get("name")
        elif isinstance(status_obj, str):
            status = status_obj

        # Determine if graduate
        is_graduate = status == "Graduate"

        # Get institution
        institution_ids = get_field_value(rec, FIELDS["students_reports"]["institution"]) or []
        institution_name = None
        if institution_ids:
            inst_id = institution_ids[0]  # Take first
            if inst_id in institutions_lookup:
                institution_name = institutions_lookup[inst_id]["name"]
                institutions_set.add(institution_name)

        # Get teams
        teams = []
        for team_id in teams_ids:
            if team_id in contribution_areas_lookup:
                team_name = contribution_areas_lookup[team_id]["name"]
                teams.append(team_name)
                team_distribution[team_name] = team_distribution.get(team_name, 0) + 1

        # Get cohort
        cohort = get_cohort_from_date(internship_end_date)

        # Get field of study (cross-reference with Students table)
        field_of_study = None
        if name in students_by_name:
            student_rec = students_by_name[name]
            fos_obj = get_field_value(student_rec, FIELDS["students"]["field_of_study"])
            if fos_obj and isinstance(fos_obj, dict):
                field_of_study = fos_obj.get("name")
            elif isinstance(fos_obj, str):
                field_of_study = fos_obj

        # Count statistics
        if is_graduate:
            graduate_count += 1
        else:
            active_count += 1

        total_hours += hours

        # Track field of study stats
        if field_of_study:
            if field_of_study not in field_of_study_stats:
                field_of_study_stats[field_of_study] = {"active": 0, "graduated": 0}
            if is_graduate:
                field_of_study_stats[field_of_study]["graduated"] += 1
            else:
                field_of_study_stats[field_of_study]["active"] += 1

        student_data = {
            "name": title_case(name),
            "status": status,
            "hours": int(hours),
            "institution": institution_name,
            "teams": teams,
            "wp_profile": wp_profile,
            "wp_username": extract_wp_username(wp_profile),
            "is_graduate": is_graduate,
            "courses": len(lessons_ids),
            "fieldOfStudy": field_of_study,
            "cohort": cohort,
        }
        students.append(student_data)

    # Sort students by name
    students.sort(key=lambda s: s["name"])

    # Process mentors
    mentors = []
    active_mentors = 0
    mentor_countries = {}

    for rec in mentors_records:
        name = get_field_value(rec, FIELDS["mentors"]["full_name"])
        status_obj = get_field_value(rec, FIELDS["mentors"]["status"])
        country = get_field_value(rec, FIELDS["mentors"]["country"])
        wp_profile = get_field_value(rec, FIELDS["mentors"]["wp_profile"])
        languages_ids = get_field_value(rec, FIELDS["mentors"]["languages"]) or []
        student_report_ids = get_field_value(rec, FIELDS["mentors"]["student_reports"]) or []
        sponsored_obj = get_field_value(rec, FIELDS["mentors"]["sponsored"])
        sponsor_company = get_field_value(rec, FIELDS["mentors"]["sponsor_company"])

        if not name:
            continue

        # Parse status
        status = None
        if status_obj and isinstance(status_obj, dict):
            status = status_obj.get("name")
        elif isinstance(status_obj, str):
            status = status_obj

        # Only include Active or Verified mentors
        if status not in ["Active", "Verified"]:
            continue

        active_mentors += 1

        # Track mentor country
        country_normalized = title_case(country) if country else None
        if country_normalized:
            mentor_countries[country_normalized] = mentor_countries.get(country_normalized, 0) + 1

        # Resolve languages
        languages = []
        for lang_id in languages_ids:
            if lang_id in languages_lookup:
                lang_name = languages_lookup[lang_id]["name"]
                languages.append(lang_name)

        # Resolve student reports to get student names
        active_students = []
        grad_students = []
        for sr_id in student_report_ids:
            # Find this student report in our list
            for sr in students_reports_records:
                if sr["id"] == sr_id:
                    student_name = get_field_value(sr, FIELDS["students_reports"]["name"])
                    wp_prof = get_field_value(sr, FIELDS["students_reports"]["wp_profile"])
                    wp_user = extract_wp_username(wp_prof)
                    sr_status = get_field_value(sr, FIELDS["students_reports"]["status"])
                    sr_is_grad = sr_status == "Graduate" if isinstance(sr_status, dict) else sr_status == "Graduate"

                    if student_name:
                        student_entry = {
                            "name": title_case(student_name),
                            "wp_username": wp_user,
                        }
                        if sr_is_grad:
                            grad_students.append(student_entry)
                        else:
                            active_students.append(student_entry)
                    break

        # Parse sponsored
        sponsored = False
        if sponsored_obj and isinstance(sponsored_obj, dict):
            sponsored = sponsored_obj.get("name") == "Yes"
        elif isinstance(sponsored_obj, str):
            sponsored = sponsored_obj == "Yes"

        # Get sponsor companies
        companies = []
        if sponsor_company:
            companies.append(sponsor_company)

        mentor_data = {
            "name": title_case(name),
            "country_normalized": country_normalized,
            "country": country,
            "wp_profile": wp_profile,
            "wp_username": extract_wp_username(wp_profile),
            "languages": languages,
            "activeCount": len(active_students),
            "gradCount": len(grad_students),
            "activeStudents": active_students,
            "gradStudents": grad_students,
            "sponsored": sponsored,
            "companies": companies,
        }
        mentors.append(mentor_data)

    # Sort mentors by name
    mentors.sort(key=lambda m: m["name"])

    # Build global stats
    global_stats = {
        "activeStudents": active_count,
        "graduates": graduate_count,
        "totalHours": total_hours,
        "partnerInstitutions": len(institutions_set),
        "sponsorCount": len(sponsors_lookup),
        "activeMentors": active_mentors,
        "teamDistribution": team_distribution,
        "totalCourses": sum(s["courses"] for s in students),
        "instCountries": {},  # Will populate from institutions
        "mentorCountries": mentor_countries,
        "fieldOfStudy": field_of_study_stats,
    }

    # TODO: integrate translation data source
    translation_totals = {
        "suggested": 0,
        "translated": 0,
        "reviewed": 0,
        "total": 0,
    }

    # Build final data blob
    data_blob = {
        "global": global_stats,
        "translationTotals": translation_totals,
        "institutions": sorted(institutions_set),
        "students": students,
        "mentors": mentors,
    }

    print(f"Built dashboard with {len(students)} students and {len(mentors)} mentors", file=sys.stderr)

    # Read template and inject data
    script_dir = Path(__file__).parent
    template_path = script_dir / "template.html"
    output_path = script_dir.parent / "index.html"

    if not template_path.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")

    with open(template_path, "r") as f:
        template_content = f.read()

    # Replace placeholders
    data_json = json.dumps(data_blob, separators=(",", ":"), ensure_ascii=False)
    inst_markers_json = json.dumps(INST_MARKERS, separators=(",", ":"), ensure_ascii=False)

    output_content = template_content.replace("/*DATA_BLOB*/", data_json)
    output_content = output_content.replace("/*INST_MARKERS*/", inst_markers_json)

    # Write output
    with open(output_path, "w") as f:
        f.write(output_content)

    print(f"Dashboard written to {output_path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
