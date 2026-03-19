# Maps CUAD's 41 official lawyer-labeled categories to severity levels
# Source: https://www.atticusprojectai.org/cuad
# License: CC BY 4.0

CUAD_SEVERITY_MAP: dict[str, str] = {
    # HIGH severity
    "Uncapped Liability": "HIGH",
    "IP Ownership Assignment": "HIGH",
    "Anti-Assignment": "HIGH",
    "Change of Control": "HIGH",
    "Liquidated Damages": "HIGH",
    "Third Party Beneficiary": "HIGH",
    "Non-Disparagement": "HIGH",
    "Exclusivity": "HIGH",
    "Unlimited/All-You-Can-Eat License": "HIGH",
    "Irrevocable Or Perpetual License": "HIGH",
    # MEDIUM severity
    "Non-Compete": "MEDIUM",
    "No-Solicit Of Customers": "MEDIUM",
    "No-Solicit Of Employees": "MEDIUM",
    "Termination For Convenience": "MEDIUM",
    "Rofr/Rofo/Rofn": "MEDIUM",
    "Revenue/Profit Sharing": "MEDIUM",
    "Price Restrictions": "MEDIUM",
    "Minimum Commitment": "MEDIUM",
    "Volume Restriction": "MEDIUM",
    "Audit Rights": "MEDIUM",
    "Cap On Liability": "MEDIUM",
    "Warranty Duration": "MEDIUM",
    "Insurance": "MEDIUM",
    "Covenant Not To Sue": "MEDIUM",
    "Post-Termination Services": "MEDIUM",
    # LOW severity
    "Governing Law": "LOW",
    "Parties": "LOW",
    "Document Name": "LOW",
    "Effective Date": "LOW",
    "Expiration Date": "LOW",
    "Renewal Term": "LOW",
    "Notice Period To Terminate Renewal": "LOW",
    "Agreement Date": "LOW",
    "License Grant": "LOW",
    "License Type": "LOW",
    "Non-Transferable License": "LOW",
    "Affiliate License-Licensor": "LOW",
    "Affiliate License-Licensee": "LOW",
    "Joint IP Ownership": "LOW",
    "Source Code Escrow": "LOW",
    "Competitive Restriction Exception": "LOW",
}

SKIP_LABELS = {
    "Parties",
    "Document Name",
    "Effective Date",
    "Agreement Date",
    "License Type",
    "Expiration Date",
    "Renewal Term",
    "Post-Termination Services",
    "Insurance",
    "Affiliate License-Licensor",
    "Affiliate License-Licensee",
}

BOILERPLATE_PATTERNS = [
    "now, therefore, in consideration of",
    "in witness whereof",
    "this agreement is made",
    "the parties agree as follows",
    "whereas, the parties desire",
]


def is_boilerplate(clause: str) -> bool:
    clause_lower = clause.lower().strip()
    return any(clause_lower.startswith(pattern) for pattern in BOILERPLATE_PATTERNS)


def is_skip_label(label: str) -> bool:
    return label in SKIP_LABELS


def get_severity(cuad_label: str) -> str:
    """
    Returns the severity of a given CUAD label.

    Args:
        cuad_label (str): The CUAD label to retrieve the severity for.

    Returns:
        str: The severity of the given CUAD label.

    Notes:
        If the CUAD label is not found in CUAD_SEVERITY_MAP, the function returns "LOW" as the default severity.
    """
    return CUAD_SEVERITY_MAP.get(cuad_label, "LOW")


def get_explanation(cuad_label: str) -> str:
    """
    Retrieves a human-readable explanation for a given CUAD label.

    Args:
        cuad_label (str): The CUAD label to retrieve the explanation for.

    Returns:
        str: A human-readable explanation of the given CUAD label.

    Notes:
        If the CUAD label is not found in the explanations dictionary, the function returns a default explanation in the format of "Contract clause identified as '{cuad_label}' by legal experts."
    """
    explanations: dict[str, str] = {
        "Uncapped Liability": "No limit on financial liability — party exposed to unlimited damages.",
        "IP Ownership Assignment": "Intellectual property ownership transferred to another party.",
        "Non-Compete": "Restricts ability to work in competing business after contract ends.",
        "Termination For Convenience": "Contract can be terminated at any time without cause.",
        "Change of Control": "Contract terms change or terminate if company ownership changes.",
        "Liquidated Damages": "Fixed financial penalty applies on breach of contract.",
        "Exclusivity": "Party restricted from working with competitors during contract period.",
        "Irrevocable Or Perpetual License": "License cannot be revoked and has no expiry.",
        "Governing Law": "Specifies which jurisdiction's laws govern the contract.",
        "Revenue/Profit Sharing": "Revenue or profit sharing obligations between parties.",
        "Anti-Assignment": "Restricts ability to transfer contract rights to another party.",
        "No-Solicit Of Employees": "Restricts hiring employees from the other party.",
        "No-Solicit Of Customers": "Restricts approaching customers of the other party.",
        "Audit Rights": "One party has the right to audit the other's records.",
        "Cap On Liability": "Maximum financial liability is capped at a specific amount.",
        "Insurance": "Specific insurance coverage requirements are mandated.",
        "Renewal Term": "Contract automatically renews for a specified period.",
        "Price Restrictions": "Restrictions on pricing changes during contract period.",
    }
    return explanations.get(
        cuad_label, f"Contract clause identified as '{cuad_label}' by legal experts."
    )
