import warnings

warnings.filterwarnings("ignore", category=FutureWarning)

from flask import Flask, request, jsonify
import base64
import cv2
import numpy as np
import tempfile
import re
import os
import logging
import requests

from datetime import datetime, timedelta
from passporteye import read_mrz

app = Flask(__name__)

DEBUG = os.environ.get("OCR_DEBUG", "false").lower() == "true"
logging.basicConfig(level=logging.DEBUG if DEBUG else logging.INFO)
logger = logging.getLogger("passport_ocr")

# ==========================================
# PASTE YOUR OCR.SPACE API KEY HERE
# ==========================================
OCR_SPACE_API_KEY = "K81951176088957"

# ---------------------------------------------------------------------------
# Tunables
# ---------------------------------------------------------------------------

NORMALIZED_LONG_SIDE = 1600
BLUR_THRESHOLD = 40
GLARE_RATIO_THRESHOLD = 0.08
MIN_DOCUMENT_AREA_RATIO = 0.20
TARGET_ASPECT_RANGE = (1.15, 1.85)

NATIONALITY_MAP = {
    "IND": "India",
    "INB": "India",
    "1ND": "India",
    "USA": "United States",
    "GBR": "United Kingdom",
    "CAN": "Canada",
    "AUS": "Australia",
    "NZL": "New Zealand",
    "SGP": "Singapore",
    "MYS": "Malaysia",
    "ARE": "United Arab Emirates",
    "SAU": "Saudi Arabia",
    "QAT": "Qatar",
    "KWT": "Kuwait",
    "OMN": "Oman",
    "BHR": "Bahrain",
    "DEU": "Germany",
    "FRA": "France",
    "ITA": "Italy",
    "ESP": "Spain",
    "NLD": "Netherlands",
    "CHE": "Switzerland",
    "SWE": "Sweden",
    "NOR": "Norway",
    "DNK": "Denmark",
    "FIN": "Finland",
    "IRL": "Ireland",
    "BEL": "Belgium",
    "AUT": "Austria",
    "PRT": "Portugal",
    "GRC": "Greece",
    "POL": "Poland",
    "CZE": "Czech Republic",
    "RUS": "Russia",
    "CHN": "China",
    "JPN": "Japan",
    "KOR": "South Korea",
    "IDN": "Indonesia",
    "THA": "Thailand",
    "VNM": "Vietnam",
    "PHL": "Philippines",
    "PAK": "Pakistan",
    "BGD": "Bangladesh",
    "LKA": "Sri Lanka",
    "NPL": "Nepal",
    "AFG": "Afghanistan",
    "IRN": "Iran",
    "EGY": "Egypt",
    "ZAF": "South Africa",
    "NGA": "Nigeria",
    "KEN": "Kenya",
    "BRA": "Brazil",
    "ARG": "Argentina",
    "MEX": "Mexico",
}


def decode_image(file_data_url):
    try:
        image_data = file_data_url.split(",")[1]
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        logger.warning("Failed to decode image: %s", e)
        return None


def order_points(pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).reshape(-1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def find_document_quad(image):
    h, w = image.shape[:2]
    image_area = h * w
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    edges = cv2.dilate(edges, np.ones((5, 5), np.uint8), iterations=1)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best_quad = None
    best_area = 0
    for c in contours:
        area = cv2.contourArea(c)
        if area < image_area * MIN_DOCUMENT_AREA_RATIO:
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4 and area > best_area:
            best_quad = approx.reshape(4, 2).astype("float32")
            best_area = area
    return best_quad


def correct_perspective(image):
    quad = find_document_quad(image)
    if quad is None:
        return image
    rect = order_points(quad)
    (tl, tr, br, bl) = rect
    width_a = np.linalg.norm(br - bl)
    width_b = np.linalg.norm(tr - tl)
    max_width = int(max(width_a, width_b))
    height_a = np.linalg.norm(tr - br)
    height_b = np.linalg.norm(tl - bl)
    max_height = int(max(height_a, height_b))
    if max_width == 0 or max_height == 0:
        return image
    aspect = max_width / max_height
    low, high = TARGET_ASPECT_RANGE
    if not (low <= aspect <= high):
        return image
    dst = np.array(
        [
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1],
        ],
        dtype="float32",
    )
    matrix = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, matrix, (max_width, max_height))


def assess_quality(gray):
    h, w = gray.shape[:2]
    long_side = max(h, w)
    if long_side > NORMALIZED_LONG_SIDE:
        scale = NORMALIZED_LONG_SIDE / long_side
        normalized = cv2.resize(
            gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA
        )
    else:
        normalized = gray
    blur_score = cv2.Laplacian(normalized, cv2.CV_64F).var()
    is_blurry = blur_score < BLUR_THRESHOLD
    bright_pixels = np.sum(normalized > 240)
    has_glare = (bright_pixels / normalized.size) > GLARE_RATIO_THRESHOLD
    return bool(is_blurry), bool(has_glare)


def run_mrz(image):
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    candidates = [
        image,
        image[int(h * 0.65) : h, 0:w],
        image[int(h * 0.75) : h, 0:w],
        gray[int(h * 0.65) : h, 0:w],
    ]

    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    candidates.append(thresh[int(h * 0.65) : h, 0:w])

    fallback = None
    for crop in candidates:
        if crop is None or crop.size == 0:
            continue
        try:
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=True) as temp:
                cv2.imwrite(temp.name, crop)
                mrz = read_mrz(temp.name)
        except Exception:
            continue
        if mrz is None:
            continue
        if getattr(mrz, "valid", False):
            return mrz
        if fallback is None:
            fallback = mrz
    return fallback


def parse_mrz_date(raw, is_dob):
    raw = str(raw).strip()
    if not re.match(r"^\d{6}$", raw):
        return ""
    yy, mm, dd = int(raw[:2]), raw[2:4], raw[4:6]
    year = 2000 + yy
    try:
        parsed = datetime(year, int(mm), int(dd))
    except ValueError:
        return ""
    if is_dob and parsed > datetime.now():
        try:
            parsed = datetime(1900 + yy, int(mm), int(dd))
        except ValueError:
            return ""
    return parsed.strftime("%Y-%m-%d")


def is_garbage_word(word):
    word = word.upper()
    if all(c == "<" for c in word):
        return True
    if len(word) == 1:
        return False
    if len(word) > 5 and not any(v in word for v in "AEIOUY"):
        return True
    return False


def clean_mrz_names(name_str):
    if not name_str:
        return ""
    name_str = name_str.upper().replace(" ", "<")
    name_str = re.sub(r"^P[\s<]*[A-Z]{3}[\s<]*", "", name_str)
    words = name_str.replace("<", " ").split()
    return " ".join([w for w in words if not is_garbage_word(w)]).title()


def is_mrz_name_clean(name):
    if not name:
        return False
    # CRITICAL FIX: A name can NEVER contain numbers.
    # This rejects the OIND83O218... hallucination instantly.
    if re.search(r"\d", name):
        return False
    words = name.split()
    if any(len(w) > 35 for w in words):
        return False
    if re.search(r"([A-Z])\1{2,}", name.upper()):
        return False
    if len(name.replace(" ", "")) < 2:
        return False
    return True


def populate_from_mrz(mrz, result):
    result["mrzDetected"] = True
    if getattr(mrz, "valid_number", False) and mrz.number:
        num = mrz.number.replace("<", "").strip()
        # CRITICAL FIX: Passport Number must have at least one digit!
        if any(c.isdigit() for c in num):
            result["passportNumber"] = num

    if mrz.nationality and mrz.nationality.isalpha():
        result["nationality"] = NATIONALITY_MAP.get(mrz.nationality, mrz.nationality)
    if getattr(mrz, "sex", None) == "M":
        result["gender"] = "male"
    elif getattr(mrz, "sex", None) == "F":
        result["gender"] = "female"
    if getattr(mrz, "valid_date_of_birth", False) and mrz.date_of_birth:
        parsed = parse_mrz_date(mrz.date_of_birth, is_dob=True)
        if parsed:
            result["dateOfBirth"] = parsed
    if getattr(mrz, "valid_expiration_date", False) and mrz.expiration_date:
        parsed = parse_mrz_date(mrz.expiration_date, is_dob=False)
        if parsed:
            result["passportExpiry"] = parsed

    mrz_last = clean_mrz_names(getattr(mrz, "surname", ""))
    if mrz_last and is_mrz_name_clean(mrz_last):
        result["lastName"] = mrz_last

    mrz_first = clean_mrz_names(getattr(mrz, "names", ""))
    if mrz_first and is_mrz_name_clean(mrz_first):
        result["firstName"] = mrz_first


# ---------------------------------------------------------------------------
# NEW: Text-Based MRZ Fallback Scanner
# ---------------------------------------------------------------------------
def extract_mrz_names(line1):
    cleaned = re.sub(r"^P[\s<]*[A-Z]{3}[\s<]*", "", line1.upper())
    parts = cleaned.split("<<", 1)
    surname = parts[0].replace("<", " ").strip()
    surname = " ".join([w for w in surname.split() if not is_garbage_word(w)]).title()

    first = ""
    if len(parts) > 1:
        first = parts[1].replace("<", " ").strip()
        first = " ".join([w for w in first.split() if not is_garbage_word(w)]).title()

    return surname, first


def parse_mrz_from_text(all_text, result):
    raw_lines = [
        x.strip().replace(" ", "<").upper() for x in all_text.split("\n") if x.strip()
    ]
    mrz_lines = []
    for line in raw_lines:
        # CRITICAL FIX: Aggressively strip random punctuation so hallucinated dots/commas don't hide the MRZ
        cleaned = re.sub(r"[^A-Z0-9<]", "", line)
        if len(cleaned) >= 30 and "<" in cleaned:
            mrz_lines.append(cleaned)

    line1 = None
    line2 = None
    # CRITICAL FIX: Make sure we explicitly pair the "P<..." line with the line immediately after it
    for i in range(len(mrz_lines) - 1):
        if mrz_lines[i].startswith("P"):
            line1 = mrz_lines[i].ljust(44, "<")
            line2 = mrz_lines[i + 1].ljust(44, "<")
            break

    if line1 and line2:
        result["mrzDetected"] = True
        surname, first = extract_mrz_names(line1)

        if is_mrz_name_clean(surname):
            result["lastName"] = surname
        if is_mrz_name_clean(first):
            result["firstName"] = first

        if len(line2) >= 44:
            passport_num = line2[0:9].replace("<", "").strip()
            if passport_num and any(c.isdigit() for c in passport_num):
                result["passportNumber"] = passport_num

            nat = line2[10:13]
            if nat.isalpha():
                result["nationality"] = NATIONALITY_MAP.get(nat, nat)

            dob_str = line2[13:19]
            if re.match(r"^\d{6}$", dob_str):
                parsed = parse_mrz_date(dob_str, is_dob=True)
                if parsed:
                    result["dateOfBirth"] = parsed

            sex = line2[20]
            if sex == "M":
                result["gender"] = "male"
            elif sex == "F":
                result["gender"] = "female"

            exp_str = line2[21:27]
            if re.match(r"^\d{6}$", exp_str):
                parsed = parse_mrz_date(exp_str, is_dob=False)
                if parsed:
                    result["passportExpiry"] = parsed


def run_ocr(gray_image):
    if OCR_SPACE_API_KEY == "PASTE_YOUR_KEY_HERE":
        print("\n[!] WARNING: OCR.SPACE API KEY MISSING! FALLING BACK TO MRZ ONLY.\n")
        return ""
    _, buffer = cv2.imencode(".jpg", gray_image, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    base64_image = base64.b64encode(buffer.tobytes()).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{base64_image}"
    payload = {
        "base64Image": data_url,
        "language": "eng",
        "OCREngine": "2",
        "scale": True,
    }
    try:
        response = requests.post(
            "https://api.ocr.space/parse/image",
            data=payload,
            headers={"apikey": OCR_SPACE_API_KEY},
            timeout=30,
        )
        result = response.json()
        if result.get("IsErroredOnProcessing"):
            return ""
        parsed_results = result.get("ParsedResults", [])
        if not parsed_results:
            return ""
        return parsed_results[0].get("ParsedText", "")
    except Exception as e:
        return ""


def clean_date_string(s):
    s = s.replace("O", "0").replace("o", "0").replace("l", "1").replace("I", "1")
    s = (
        s.replace("S", "5")
        .replace("s", "5")
        .replace("Z", "2")
        .replace("z", "2")
        .replace("B", "8")
    )
    s = re.sub(r"[^\d]", "/", s)
    s = re.sub(r"/+", "/", s)
    return s.strip("/")


def clean_name_string(text):
    text = text.upper()
    bad_words = [
        "SURNAME",
        "SURNARNE",
        "LAST NAME",
        "LASTNAME",
        "GIVEN NAME",
        "GIVEN NAMES",
        "GIVEN NARNE",
        "FIRST NAME",
        "FIRSTNAME",
        "PASSPORT",
        "NATIONALITY",
        "SEX",
        "DOB",
        "DATE",
        "PLACE",
        "OF",
        "BIRTH",
        "ISSUE",
        "INDIA",
        "REPUBLIC",
    ]
    for bw in bad_words:
        text = re.sub(r"\b" + bw + r"\b", " ", text)
    text = re.sub(r"[^A-Z\s]", "", text)
    words = [w for w in text.split() if len(w) > 0]
    return " ".join(words).title()


def extract_names_from_labels(all_lines, all_text, result):
    upper = all_text.upper()
    upper = re.sub(r"\r", "\n", upper)

    bad_stop_words = r"\b(?:SEX|NATIONALITY|DOB|DATE|PLACE|PASSPORT|FATHER|MOTHER|SPOUSE|ADDRESS|PIN)\b"

    if not result["lastName"]:
        match = re.search(
            r"\b(?:SURNAME|SURNARNE|LAST\s*NAME)\b[\s:\-]+(.*?)(?:"
            + bad_stop_words
            + r"|$)",
            upper,
            re.DOTALL,
        )
        if match:
            cleaned = clean_name_string(match.group(1))
            if cleaned:
                result["lastName"] = cleaned

    if not result["firstName"]:
        match = re.search(
            r"\b(?:GIVEN\s*NAME|GIVEN\s*NAMES|GIVEN\s*NARNE|FIRST\s*NAME|GIVEN)\b[\s:\-]+(.*?)(?:"
            + bad_stop_words
            + r"|$)",
            upper,
            re.DOTALL,
        )
        if match:
            cleaned = clean_name_string(match.group(1))
            if cleaned:
                result["firstName"] = cleaned

    if not result["lastName"] or not result["firstName"]:
        for i, line in enumerate(all_lines):
            line_upper = line.upper().strip()
            if not result["lastName"] and re.search(
                r"(SURNAME|SURNARNE|LAST\s*NAME)", line_upper
            ):
                for j in range(1, 4):
                    if i + j < len(all_lines):
                        candidate = clean_name_string(all_lines[i + j])
                        if candidate:
                            result["lastName"] = candidate
                            break

            if not result["firstName"] and re.search(
                r"(GIVEN\s*NAME|GIVEN\s*NARNE|GIVEN|FIRST\s*NAME)", line_upper
            ):
                for j in range(1, 4):
                    if i + j < len(all_lines):
                        candidate = clean_name_string(all_lines[i + j])
                        if candidate:
                            result["firstName"] = candidate
                            break


def extract_nationality(all_lines, all_text, result):
    if result["nationality"]:
        return
    if re.search(r"\bIND[I1l]AN\b", all_text.upper()):
        result["nationality"] = "India"
        return
    for i, line in enumerate(all_lines):
        if "NATIONAL" in line.upper():
            if i + 1 < len(all_lines):
                candidate = re.sub(r"[^A-Za-z\s]", "", all_lines[i + 1]).strip().title()
                if candidate and "Sex" not in candidate and "Dob" not in candidate:
                    if candidate.upper() in ["INB", "IND", "1ND", "INDIAN"]:
                        candidate = "India"
                    result["nationality"] = candidate
                    return
    match = re.search(r"NATIONALITY[\s:\-]*([A-Z\s]+)", all_text.upper())
    if match:
        candidate = re.sub(r"[^A-Z\s]", "", match.group(1)).strip().title()
        if candidate.upper() in ["INB", "IND", "1ND", "INDIAN"]:
            candidate = "India"
        result["nationality"] = candidate


def extract_passport_number(all_text, result):
    if result["passportNumber"]:
        return
    patterns = [
        r"PASSPORT\s*NO[\.\s\:]*([A-Z][A-Z0-9]{7})\b",
        r"PASSPORT\s*NUMBER[\s\:]*([A-Z][A-Z0-9]{7})\b",
        r"\b([A-Z][A-Z0-9]{7})\b",
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, all_text.upper()):
            val = match.group(1)
            val = val[0] + val[1:].translate(str.maketrans("OlISZB", "011528"))
            if re.match(r"^[A-Z]\d{7}$", val):
                result["passportNumber"] = val
                return


def extract_dates_fallback(all_text, result):
    text_no_spaces = re.sub(r"\s+", "", all_text)
    pattern = r"(?<!\d)([0-9OlISZB]{2})[\/\-\.]+([0-9OlISZB]{2})[\/\-\.]+([0-9OlISZB]{4})(?!\d)"
    found_dates = []
    for match in re.finditer(pattern, text_no_spaces, re.IGNORECASE):
        d, m, y = match.groups()
        cleaned = clean_date_string(f"{d}/{m}/{y}")
        try:
            parsed = datetime.strptime(cleaned, "%d/%m/%Y")
            if 1900 <= parsed.year <= 2100:
                found_dates.append(parsed)
        except ValueError:
            pass
    if result["dateOfBirth"]:
        try:
            found_dates.append(datetime.strptime(result["dateOfBirth"], "%Y-%m-%d"))
        except:
            pass
    if result["passportExpiry"]:
        try:
            found_dates.append(datetime.strptime(result["passportExpiry"], "%Y-%m-%d"))
        except:
            pass
    found_dates = sorted(list(set(found_dates)))
    if not found_dates:
        return
    if len(found_dates) >= 3:
        result["dateOfBirth"] = found_dates[0].strftime("%Y-%m-%d")
        result["passportIssueDate"] = found_dates[-2].strftime("%Y-%m-%d")
        result["passportExpiry"] = found_dates[-1].strftime("%Y-%m-%d")
        return
    if len(found_dates) == 2:
        d1, d2 = found_dates[0], found_dates[1]
        gap_days = (d2 - d1).days
        if (365 * 4 <= gap_days <= 365 * 6) or (365 * 9 <= gap_days <= 365 * 11):
            result["passportIssueDate"] = d1.strftime("%Y-%m-%d")
            result["passportExpiry"] = d2.strftime("%Y-%m-%d")
        else:
            result["dateOfBirth"] = d1.strftime("%Y-%m-%d")
            if d2.year >= 2010:
                result["passportExpiry"] = d2.strftime("%Y-%m-%d")
            else:
                result["passportIssueDate"] = d2.strftime("%Y-%m-%d")
        return
    if len(found_dates) == 1:
        d1 = found_dates[0]
        if not result["dateOfBirth"] and d1.year < 2010:
            result["dateOfBirth"] = d1.strftime("%Y-%m-%d")
        elif not result["passportExpiry"]:
            result["passportExpiry"] = d1.strftime("%Y-%m-%d")


def guess_issue_date(result):
    if not result["passportIssueDate"] and result["passportExpiry"]:
        try:
            exp_date = datetime.strptime(result["passportExpiry"], "%Y-%m-%d")
            try:
                issue_10 = exp_date.replace(year=exp_date.year - 10) + timedelta(days=1)
            except ValueError:
                issue_10 = exp_date.replace(
                    year=exp_date.year - 10, day=28
                ) + timedelta(days=1)
            result["passportIssueDate"] = issue_10.strftime("%Y-%m-%d")
        except:
            pass


KNOWN_CITIES = {
    "BENGALURU",
    "BANGALORE",
    "MYSURU",
    "MANGALURU",
    "DELHI",
    "NEW DELHI",
    "MUMBAI",
    "CHENNAI",
    "HYDERABAD",
    "KOLKATA",
    "PUNE",
    "JAIPUR",
    "AHMEDABAD",
    "LUCKNOW",
    "KOCHI",
    "GOA",
    "CHANDIGARH",
    "PATNA",
    "BHOPAL",
    "INDORE",
    "THANE",
    "AGRA",
    "VARANASI",
    "UDUPI",
    "MANIPAL",
    "KUNDAPURA",
    "BELAGAVI",
    "HUBLI",
    "DHARWAD",
    "KALABURAGI",
    "DAVANAGERE",
    "SHIVAMOGGA",
    "TUMAKURU",
    "HASSAN",
    "CHIKKAMAGALURU",
    "KASARAGOD",
    "TRIVANDRUM",
    "SURAT",
    "KOZHIKODE",
}


def is_valid_pob(candidate):
    cleaned = re.sub(r"[^A-Z\s]", "", candidate.upper()).strip()
    if len(cleaned) < 3:
        return False
    words = cleaned.split()
    if not words:
        return False
    if re.search(r"([A-Z])\1{2,}", cleaned):
        return False
    if re.search(r"[^AEIOUY\s]{5,}", cleaned):
        return False
    for w in words:
        if len(w) == 1 and w not in ["A", "O"]:
            return False
        if len(w) > 20:
            return False
        vowels = sum(1 for c in w if c in "AEIOUY")
        if vowels == 0:
            return False
    return True


def extract_place_of_birth(all_lines, all_text, result):
    if result["placeOfBirth"]:
        return
    upper_text = all_text.upper()
    upper_text = re.sub(r"\r", "\n", upper_text)

    # 1. Super robust block extraction using Regex
    # This regex is immune to OCR hallucinations like 'PIace of 8irth'
    pob_pattern = r"(?:PLACE|PL[A-Z]*CE|P[\sA-Z]*E).*?(?:OF|0F|O\s*F).*?(?:BIRTH|8IRTH|B[\sA-Z]*H)"
    stop_words = r"\b(?:PLACE\s*OF\s*ISSUE|ISSUE|DATE|AUTHORITY|PIN|STATE|PASSPORT|EXPIRY|FILE|NO)\b"

    match = re.search(
        pob_pattern + r"[\s:\-\n]+(.*?)(?:" + stop_words + r"|$)", upper_text, re.DOTALL
    )
    if match:
        chunk = match.group(1)
        chunk_lines = [x.strip() for x in chunk.split("\n") if x.strip()]
        for line in chunk_lines:
            cleaned_line = re.sub(r"[^A-Z\s,]", "", line).strip()
            if is_valid_pob(cleaned_line):
                # Make sure we didn't accidentally hit the Issue place header
                if "PLACET" in cleaned_line or "ISSUE" in cleaned_line:
                    continue
                result["placeOfBirth"] = cleaned_line.title()
                return

    # 2. Line-by-line fallback if block extraction fails
    for i, line in enumerate(all_lines):
        upper = line.upper().strip()
        if "BIRTH" in upper and "DATE" not in upper and "DOB" not in upper:
            for j in range(1, 4):
                if i + j < len(all_lines):
                    candidate = re.sub(r"[^A-Za-z\s,]", "", all_lines[i + j]).strip()
                    if is_valid_pob(candidate) and not re.search(
                        r"(ISSUE|DATE|AUTHORITY|SEX|NATIONALITY)", candidate.upper()
                    ):
                        result["placeOfBirth"] = candidate.title()
                        return

    # 3. Known Cities Fallback (Extremely Strict)
    for i, line in enumerate(all_lines):
        cleaned = re.sub(r"[^A-Za-z]", "", line.upper())
        if cleaned in KNOWN_CITIES:
            # Check a wider window of surrounding text (3 lines above and below)
            surrounding = " ".join(
                all_lines[max(0, i - 3) : min(len(all_lines), i + 4)]
            ).upper()
            # If ANY hint of "Issue" or "Expiry" is near this city, it is NOT the Place of Birth!
            if not re.search(
                r"(ISSUE|1SSUE|LSSUE|EXPIRY|AUTHORITY|DATE\s*OF|DD/MM/YYYY)",
                surrounding,
            ):
                result["placeOfBirth"] = line.title().strip()
                return


def extract_gender(all_text, result):
    if result["gender"]:
        return
    upper = all_text.upper()
    if (
        "FEMALE" in upper
        or "F E M A L E" in upper
        or "F/F" in upper
        or "F / F" in upper
    ):
        result["gender"] = "female"
        return
    if "MALE" in upper or "M A L E" in upper or "M/M" in upper or "M / M" in upper:
        result["gender"] = "male"
        return
    match = re.search(r"\bSEX\b.*?([MF])\b", upper)
    if match:
        result["gender"] = "female" if match.group(1) == "F" else "male"


@app.route("/")
def home():
    return jsonify({"status": "OCR Service Running"})


@app.route("/extract-passport", methods=["POST"])
def extract_passport():
    try:
        files = request.json.get("files", [])
        if not files:
            return jsonify({"error": "No files supplied"}), 400
        result = {
            "firstName": "",
            "lastName": "",
            "passportNumber": "",
            "dateOfBirth": "",
            "passportExpiry": "",
            "passportIssueDate": "",
            "gender": "",
            "nationality": "",
            "placeOfBirth": "",
            "mrzDetected": False,
            "confidence": 0,
            "documentQuality": "good",
            "isExpired": False,
            "isBlurry": False,
            "isCutOff": False,
            "hasGlare": False,
            "validationMessage": "Passport image quality is acceptable",
        }
        front_text = ""
        back_text = ""
        worst_blur = False
        worst_glare = False
        mrz_object = None

        for index, file_data_url in enumerate(files):
            image = decode_image(file_data_url)
            if image is None:
                continue
            h, w = image.shape[:2]
            if h < 500 or w < 500:
                result["isCutOff"] = True
            image = correct_perspective(image)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            is_blurry, has_glare = assess_quality(gray)
            worst_blur = worst_blur or is_blurry
            worst_glare = worst_glare or has_glare

            if mrz_object is None or not getattr(mrz_object, "valid", False):
                candidate_mrz = run_mrz(image)
                if candidate_mrz is not None:
                    if mrz_object is None or getattr(candidate_mrz, "valid", False):
                        mrz_object = candidate_mrz

            text = run_ocr(gray)
            if index == 0:
                front_text += "\n" + text
            else:
                back_text += "\n" + text

        all_text = front_text + "\n" + back_text
        all_lines = [x.strip() for x in all_text.split("\n") if x.strip()]

        extract_names_from_labels(all_lines, all_text, result)
        extract_nationality(all_lines, all_text, result)
        extract_passport_number(all_text, result)
        extract_gender(all_text, result)

        if mrz_object is not None:
            populate_from_mrz(mrz_object, result)
        parse_mrz_from_text(all_text, result)

        extract_dates_fallback(all_text, result)
        guess_issue_date(result)
        extract_place_of_birth(all_lines, all_text, result)

        result["isBlurry"] = bool(worst_blur)
        result["hasGlare"] = bool(worst_glare)
        if worst_blur and worst_glare:
            result["documentQuality"] = "poor"
        elif worst_blur or worst_glare:
            result["documentQuality"] = "acceptable"
        else:
            result["documentQuality"] = "good"

        if result["passportExpiry"]:
            try:
                expiry = datetime.strptime(result["passportExpiry"], "%Y-%m-%d")
                if expiry.date() < datetime.now().date():
                    result["isExpired"] = True
            except ValueError:
                pass

        confidence = 0.0
        if result["mrzDetected"]:
            confidence += 30
        if mrz_object is not None and getattr(mrz_object, "valid", False):
            confidence += 20
        if result["passportNumber"]:
            confidence += 15
        if result["dateOfBirth"]:
            confidence += 10
        if result["passportExpiry"]:
            confidence += 10
        if result["firstName"]:
            confidence += 5
        if result["lastName"]:
            confidence += 5
        if result["nationality"]:
            confidence += 2
        if result["gender"]:
            confidence += 1
        if result["passportIssueDate"]:
            confidence += 2

        result["confidence"] = round(min(confidence, 100) / 100, 2)
        return jsonify(result)
    except Exception as e:
        logger.exception("extract_passport failed")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=5001, debug=debug_mode, use_reloader=debug_mode)
