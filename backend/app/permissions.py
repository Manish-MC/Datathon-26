# Define permissions for each rank

RANK_PREFIX_MAP = {
    "PC": "Police Constable",
    "HC": "Head Constable",
    "ASI": "Assistant Sub-Inspector",
    "SI": "Sub-Inspector",
    "PI": "Inspector / SHO",
    "DYSP": "DySP / ACP",
    "SP": "SP / DCP",
    "DIG": "DIG",
    "IGP": "IGP",
    "ADGP": "ADGP",
    "DGP": "DGP"
}

RANK_PERMISSIONS = {
    "Police Constable": [
        "view_assigned_firs",
        "update_patrol_status",
        "upload_evidence"
    ],
    "Head Constable": [
        "station_diary",
        "assist_fir",
        "update_property",
        "verify_evidence",
        "verify_patrol_reports",
        "manage_station_diary",
        "manage_seized_property",
        "assign_minor_tasks"
    ],
    "Assistant Sub-Inspector": [
        "update_investigation",
        "witness_statements",
        "upload_evidence"
    ],
    "Sub-Inspector": [
        "register_fir",
        "assign_investigation",
        "arrest_records",
        "case_diary"
    ],
    "Inspector / SHO": [
        "station_admin",
        "approve_fir",
        "assign_officers",
        "station_reports",
        "approve_alert_action",
        "dismiss_alert",
        "transfer_case_within_station",
        "approve_reports",
        "manage_station_staff",
        "view_station_dashboard",
        "broadcast_urgent_alert"
    ],
    "DySP / ACP": [
        "monitor_stations",
        "review_investigations",
        "approve_transfers",
        "district_analytics"
    ],
    "SP / DCP": [
        "district_dashboard",
        "officer_management",
        "crime_stats",
        "approvals",
        "district_reports",
        "order_investigation",
        "manpower_allocation",
        "district_alerts",
        "approve_major_operations"
    ],
    "DIG": [
        "compare_districts",
        "regional_analytics",
        "review_district_performance"
    ],
    "IGP": [
        "regional_monitoring",
        "regional_analytics",
        "inter_district_coord",
        "regional_heatmap",
        "district_risk_rating",
        "policy_dashboard",
        "approve_regional_operations"
    ],
    "ADGP": [
        "dept_wide_monitoring",
        "strategic_dashboards",
        "department_dashboard",
        "inter_department_collaboration",
        "ai_insights_statewide",
        "predictive_analytics"
    ],
    "DGP": [
        "state_wide_access",
        "analytics",
        "policy_reports",
        "admin_oversight",
        "ai_copilot",
        "anomaly_detection",
        "criminal_network_graph",
        "decision_timeline"
    ]
}

def get_permissions_for_rank(rank_name: str) -> list:
    # Find hierarchy of requested rank
    target_hierarchy = None
    for seed in RANK_SEED_DATA:
        if seed["RankName"] == rank_name:
            target_hierarchy = seed["Hierarchy"]
            break
            
    if target_hierarchy is None:
        return []

    # Aggregate permissions for this rank and all ranks below it (higher hierarchy number)
    aggregated = set()
    for seed in RANK_SEED_DATA:
        if seed["Hierarchy"] >= target_hierarchy:
            perms = RANK_PERMISSIONS.get(seed["RankName"], [])
            aggregated.update(perms)
            
    return list(aggregated)

# Mapping for the seed process based on user prompt:
RANK_SEED_DATA = [
    {"Hierarchy": 10, "RankName": "Police Constable", "LoginID": "PC_10452_2015", "EmployeeName": "Constable Ramesh"},
    {"Hierarchy": 9, "RankName": "Head Constable", "LoginID": "HC_10218_2011", "EmployeeName": "Head Constable Suresh"},
    {"Hierarchy": 8, "RankName": "Assistant Sub-Inspector", "LoginID": "ASI_10084_2009", "EmployeeName": "ASI Patil"},
    {"Hierarchy": 7, "RankName": "Sub-Inspector", "LoginID": "SI_10021_2007", "EmployeeName": "SI Kumar"},
    {"Hierarchy": 6, "RankName": "Inspector / SHO", "LoginID": "PI_0007_2003", "EmployeeName": "Inspector Singh"},
    {"Hierarchy": 5, "RankName": "DySP / ACP", "LoginID": "DYSP_015_1999", "EmployeeName": "DySP Reddy"},
    {"Hierarchy": 4, "RankName": "SP / DCP", "LoginID": "SP_0042_1995", "EmployeeName": "SP Sharma"},
    {"Hierarchy": 3.5, "RankName": "DIG", "LoginID": "DIG_0028_1993", "EmployeeName": "DIG Khanna"},
    {"Hierarchy": 3, "RankName": "IGP", "LoginID": "IGP_0011_1991", "EmployeeName": "IGP Verma"},
    {"Hierarchy": 2, "RankName": "ADGP", "LoginID": "ADGP_0004_1987", "EmployeeName": "ADGP Rao"},
    {"Hierarchy": 1, "RankName": "DGP", "LoginID": "DGP_0001_1983", "EmployeeName": "DGP Prasad"}
]
