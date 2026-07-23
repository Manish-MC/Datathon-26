import csv
import os
import random
from datetime import datetime, timedelta

# Ensure folder exists
os.makedirs(os.path.dirname(__file__), exist_ok=True)

# Lookup configurations to match schema
CITIES = ["Bengaluru"]
STATIONS = [
    {"id": 1, "name": "Koramangala Police Station", "lat": 12.9352, "lon": 77.6244},
    {"id": 2, "name": "Indiranagar Police Station", "lat": 12.9719, "lon": 77.6412},
    {"id": 3, "name": "HSR Layout Police Station", "lat": 12.9101, "lon": 77.6450},
    {"id": 4, "name": "Whitefield Police Station", "lat": 12.9698, "lon": 77.7499},
    {"id": 5, "name": "Cubbon Park Police Station", "lat": 12.9779, "lon": 77.5952},
    {"id": 6, "name": "Jayanagar Police Station", "lat": 12.9250, "lon": 77.5938},
]

CATEGORIES = [
    {"id": 1, "name": "FIR"},
    {"id": 2, "name": "UDR"},  # Unnatural Death Report
    {"id": 3, "name": "PAR"},  # Petitions
    {"id": 4, "name": "Zero FIR"},
]

STATUSES = [
    {"id": 1, "name": "Under Investigation"},
    {"id": 2, "name": "Charge Sheeted"},
    {"id": 3, "name": "Final Report Submitted"},
    {"id": 4, "name": "Transferred"},
]

# Offence Majors and Minors
# Gravity: 1 = Heinous, 2 = Non-Heinous
CRIME_TYPES = [
    {"major_id": 101, "minor_id": 201, "major": "Theft", "minor": "Two Wheeler Theft", "gravity": 2},
    {"major_id": 101, "minor_id": 202, "major": "Theft", "minor": "Mobile Snatching", "gravity": 2},
    {"major_id": 102, "minor_id": 203, "major": "House Breaking", "minor": "Burgling Residential", "gravity": 1},
    {"major_id": 102, "minor_id": 204, "major": "House Breaking", "minor": "Burgling Commercial", "gravity": 1},
    {"major_id": 103, "minor_id": 205, "major": "Assault", "minor": "Physical Attack", "gravity": 2},
    {"major_id": 103, "minor_id": 206, "major": "Assault", "minor": "Grievous Hurt", "gravity": 1},
    {"major_id": 104, "minor_id": 207, "major": "Robbery", "minor": "Chain Snatching", "gravity": 1},
    {"major_id": 104, "minor_id": 208, "major": "Robbery", "minor": "Highway Robbery", "gravity": 1},
]

NAMES = [
    "Aarav Kumar", "Aditya Sharma", "Amit Patel", "Ananya Rao", "Arjun Singh",
    "Deepak Murthy", "Divya Gowda", "Girish Prasad", "Harish K", "Kiran Hegde",
    "Lakshmi N", "Manoj Kumar", "Nandini R", "Pradeep Naik", "Rahul Dravid",
    "Ramesh Babu", "Sandeep Reddy", "Sanjay Dutt", "Savitri Devi", "Sunil Dutt",
    "Vijay Shekhar", "Vikram K", "Yashaswini S", "Priya Nair", "Rohan Das"
]

ACCUSED_NAMES = [
    "Raju alias Kulla", "Manja alias Manju", "Suresh Kumar", "Santosh @ Sandy",
    "Karthik @ Kariya", "Unknown Suspect 1", "Unknown Suspect 2", "Ganesh Gowda",
    "Imran Khan", "Shiva @ Psycho", "Raghu @ Rowdy", "Naveen alias Appu"
]

def generate_noise(lat, lon, max_dist=0.008):
    """Add small random noise to coordinates to simulate nearby locations."""
    return lat + random.uniform(-max_dist, max_dist), lon + random.uniform(-max_dist, max_dist)

def make_record(crime_no, case_no, date, station, crime_type, lat, lon, facts, accused_name=None, status_id=1, category_id=1):
    complainant = random.choice(NAMES)
    victim = random.choice(NAMES)
    if not accused_name:
        accused_name = random.choice(ACCUSED_NAMES)
        
    comp_age = random.randint(18, 70)
    comp_gen = random.choice([1, 2])
    vic_age = random.randint(18, 70)
    vic_gen = random.choice([1, 2])
    
    acc_age = random.randint(19, 45) if "Unknown" not in accused_name else ""
    acc_gen = 1 if "Unknown" not in accused_name else 9 # 9 = Unknown or not applicable
    
    # Person ID can link suspects, e.g. repeat offenders
    person_id = ""
    if "Raju" in accused_name:
        person_id = 1001
    elif "Manja" in accused_name:
        person_id = 1002
    elif "Shiva" in accused_name:
        person_id = 1003

    arrest_date = ""
    arrest_type = ""
    if status_id == 2: # Charge Sheeted implies arrest
        arrest_date = (date + timedelta(days=random.randint(1, 14))).strftime("%Y-%m-%d %H:%M:%S")
        arrest_type = 1 # Arrest
        
    return {
        "CrimeNo": crime_no,
        "CaseNo": case_no,
        "CrimeRegisteredDate": date.strftime("%Y-%m-%d %H:%M:%S"),
        "PoliceStationID": station["id"],
        "PoliceStationName": station["name"],
        "CaseCategoryID": category_id,
        "CaseCategoryName": next(c["name"] for c in CATEGORIES if c["id"] == category_id),
        "GravityOffenceID": crime_type["gravity"],
        "CrimeMajorHeadID": crime_type["major_id"],
        "CrimeMajorHeadName": crime_type["major"],
        "CrimeMinorHeadID": crime_type["minor_id"],
        "CrimeMinorHeadName": crime_type["minor"],
        "CaseStatusID": status_id,
        "CaseStatusName": next(s["name"] for s in STATUSES if s["id"] == status_id),
        "IncidentFromDate": (date - timedelta(hours=random.randint(1, 12))).strftime("%Y-%m-%d %H:%M:%S"),
        "IncidentToDate": date.strftime("%Y-%m-%d %H:%M:%S"),
        "latitude": lat,
        "longitude": lon,
        "BriefFacts": facts,
        "ComplainantName": complainant,
        "ComplainantAge": comp_age,
        "ComplainantGender": comp_gen,
        "VictimName": victim,
        "VictimAge": vic_age,
        "VictimGender": vic_gen,
        "AccusedName": accused_name,
        "AccusedAge": acc_age,
        "AccusedGender": acc_gen,
        "AccusedPersonID": person_id,
        "ArrestSurrenderDate": arrest_date,
        "ArrestSurrenderTypeID": arrest_type
    }

def main():
    records = []
    
    # ----------------------------------------------------
    # CLUSTER A: Residential Burglaries in Koramangala 4th Block
    # Within 5 days (July 10 to July 15, 2026), very close proximity
    # ----------------------------------------------------
    koramangala = STATIONS[0] # Koramangala PS
    crime_burg = [c for c in CRIME_TYPES if c["minor"] == "Burgling Residential"][0]
    
    records.append(make_record(
        "KOR/2026/0301", "C-2026-0301", datetime(2026, 7, 10, 14, 30), koramangala, crime_burg,
        12.9341, 77.6225,
        "Complainant locked his house on July 9th evening and went to visit relatives. On July 10th morning, neighbours noticed that the main door lock was broken. Gold jewelry weighing 50 grams and 20,000 INR cash are missing from the wardrobe.",
        "Unknown Suspect 1"
    ))
    records.append(make_record(
        "KOR/2026/0302", "C-2026-0302", datetime(2026, 7, 12, 10, 15), koramangala, crime_burg,
        12.9355, 77.6231,
        "The complainant states that on July 12th early morning between 2:00 AM and 4:00 AM, unidentified burglars entered the premises by breaking open the rear window grill. The thieves decamped with a laptop, digital camera, and silver utensils.",
        "Unknown Suspect 1"
    ))
    records.append(make_record(
        "KOR/2026/0305", "C-2026-0305", datetime(2026, 7, 13, 11, 0), koramangala, crime_burg,
        12.9348, 77.6219,
        "Burglary took place in Koramangala 4th block between July 12th night and July 13th morning. The house lock was cut using a heavy metal cutter. Wardrobe safes were ransacked, and gold jewelry worth 1.5 lakhs was reported stolen.",
        "Manja alias Manju"
    ))
    records.append(make_record(
        "KOR/2026/0308", "C-2026-0308", datetime(2026, 7, 15, 17, 45), koramangala, crime_burg,
        12.9359, 77.6240,
        "Unidentified suspects targeted an apartment ground floor in Koramangala 4th block during daytime while the resident went shopping. Main door latch was forced open, and valuable electronic gadgets and watches were stolen.",
        "Unknown Suspect 2"
    ))

    # ----------------------------------------------------
    # CLUSTER B: Two-wheeler (Vehicle) Thefts near Indiranagar Metro Station
    # Within 7 days (July 5 to July 12, 2026), tight parking area
    # ----------------------------------------------------
    indiranagar = STATIONS[1] # Indiranagar PS
    crime_bike = [c for c in CRIME_TYPES if c["minor"] == "Two Wheeler Theft"][0]
    
    records.append(make_record(
        "IND/2026/0245", "C-2026-0245", datetime(2026, 7, 5, 21, 0), indiranagar, crime_bike,
        12.9782, 77.6405,
        "The complainant parked his Royal Enfield Bullet (KA-03-JY-4567) near the Indiranagar Metro Station parking lane at 9:00 AM before going to work. Upon returning at 8:30 PM, the motorcycle was missing. Lock seems to have been picked.",
        "Raju alias Kulla"
    ))
    records.append(make_record(
        "IND/2026/0248", "C-2026-0248", datetime(2026, 7, 8, 22, 15), indiranagar, crime_bike,
        12.9788, 77.6415,
        "Honda Activa (KA-04-EH-8921) was stolen from outside a food joint near Indiranagar Metro Station. The vehicle was parked for less than an hour. CCTV footage shows a lean person carrying a helmet boarding and riding away with the vehicle.",
        "Raju alias Kulla"
    ))
    records.append(make_record(
        "IND/2026/0252", "C-2026-0252", datetime(2026, 7, 11, 20, 30), indiranagar, crime_bike,
        12.9777, 77.6420,
        "Complainant reports that his Yamaha FZ motorcycle (KA-05-KM-1234) parked under the metro pillar opposite to the metro station entrance was stolen. The theft happened between 6:00 PM and 8:00 PM on July 11th.",
        "Unknown Suspect 2"
    ))

    # ----------------------------------------------------
    # CLUSTER C: Mobile/Chain Snatching near Cubbon Park
    # Within 5 days (June 20 to June 25, 2026) by bike-borne riders
    # ----------------------------------------------------
    cubbon = STATIONS[4] # Cubbon Park PS
    crime_snatch = [c for c in CRIME_TYPES if c["minor"] == "Mobile Snatching"][0]
    crime_chain = [c for c in CRIME_TYPES if c["minor"] == "Chain Snatching"][0]
    
    records.append(make_record(
        "CUB/2026/0189", "C-2026-0189", datetime(2026, 6, 20, 20, 30), cubbon, crime_snatch,
        12.9788, 77.5960,
        "While complainant was walking on the sidewalk near the entrance of Cubbon Park, two suspects on a black Pulsar motorcycle rode past closely and snatched the complainant's iPhone 14 Pro from his hand, escaping toward Hudson Circle.",
        "Shiva @ Psycho"
    ))
    records.append(make_record(
        "CUB/2026/0192", "C-2026-0192", datetime(2026, 6, 22, 21, 15), cubbon, crime_chain,
        12.9795, 77.5950,
        "A woman reports that while she was returning from the metro station near Cubbon Park gate, two bike-borne miscreants came from behind, grabbed her gold chain weighing 24 grams, and sped away. The passenger was wearing a red hoodie.",
        "Shiva @ Psycho"
    ))
    records.append(make_record(
        "CUB/2026/0198", "C-2026-0198", datetime(2026, 6, 25, 19, 45), cubbon, crime_snatch,
        12.9780, 77.5970,
        "Unidentified suspects snatched a OnePlus mobile phone from the hand of a pedestrian walking near Cubbon Park. The suspects were riding a scooter with no registration plate. Both riders wore helmets.",
        "Unknown Suspect 1"
    ))

    # ----------------------------------------------------
    # BACKGROUND CASES (25 additional cases spread over 6 months across stations)
    # ----------------------------------------------------
    start_date = datetime(2026, 1, 15)
    
    for i in range(25):
        days_offset = random.randint(1, 160)
        case_date = start_date + timedelta(days=days_offset)
        
        # Avoid clashing too closely with cluster dates/locations
        station = random.choice(STATIONS)
        crime_type = random.choice(CRIME_TYPES)
        
        lat, lon = generate_noise(station["lat"], station["lon"])
        
        # Build logical Brief Facts based on crime type
        if crime_type["minor"] == "Two Wheeler Theft":
            facts = f"The complainant reports theft of their two-wheeler parked in front of their office/house in {station['name'].split(' ')[0]}. The incident occurred sometime between night and next morning."
        elif crime_type["minor"] == "Mobile Snatching":
            facts = f"Complainant was speaking on the phone while walking when two riders on a vehicle approached from behind and snatched the phone, escaping into traffic."
        elif crime_type["minor"] == "Burgling Residential":
            facts = f"House breaking incident reported at a residential quarter in {station['name'].split(' ')[0]}. Burglars broke window grills and stole silver utensils and some cash while the owners were at work."
        elif crime_type["minor"] == "Physical Attack":
            facts = f"A physical altercation broke out between the complainant and the accused over a minor parking dispute. The accused assaulted the complainant with a wooden stick causing bruising."
        elif crime_type["minor"] == "Grievous Hurt":
            facts = f"The accused attacked the victim with a sharp tool near a local market following a long-standing property dispute. The victim sustained fractures and was admitted to hospital."
        elif crime_type["minor"] == "Chain Snatching":
            facts = f"While walking home in the evening, a gold chain was forcibly pulled and stolen from the victim's neck by two motorcycle riders wearing masks."
        else:
            facts = f"Assault incident reported in the station jurisdiction of {station['name']}. Arguments escalated to pushing and physical threat before local residents intervened."
            
        crime_prefix = station["name"][:3].upper()
        case_id_num = 100 + i
        crime_no = f"{crime_prefix}/2026/0{case_id_num}"
        case_no = f"C-2026-0{case_id_num}"
        
        # Status
        status_id = random.choice([1, 2, 3])
        category_id = random.choice([1, 1, 1, 4]) # Mostly FIR, some Zero FIR
        
        records.append(make_record(
            crime_no, case_no, case_date, station, crime_type, lat, lon, facts, status_id=status_id, category_id=category_id
        ))

    # Write to CSV
    csv_file = os.path.join(os.path.dirname(__file__), "fir_sample.csv")
    if records:
        fieldnames = list(records[0].keys())
        with open(csv_file, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(records)
            
    print(f"Successfully generated {len(records)} sample records and saved to {csv_file}")

if __name__ == "__main__":
    main()
