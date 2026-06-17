import json


def build_report_prompt(analyses):
    """
    Build the OpenAI prompt from a list of normalized call analyses.
    Sends only essential fields to reduce token usage.
    """
    compact = []
    for item in analyses:
        compact.append({
            "main_issue": item.get("main_issue", ""),
            "sentiment": item.get("sentiment", ""),
            "priority": item.get("priority", ""),
            "keywords": item.get("keywords", []),
            "transcript": item.get("transcript", "")[:400]
        })

    formatted = json.dumps(compact, ensure_ascii=False, indent=2)

    return f"""
You are an enterprise-grade AI QA analyst specializing in large-scale customer support intelligence.

Your mission is to analyze multiple call analyses and produce a highly accurate operational report.

You MUST think like:
- A senior QA operations manager
- A customer experience strategist
- A root-cause analyst
- A business process optimization expert

━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━
Identify, cluster, and summarize repeated operational issues across multiple customer service calls.

━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT YOU MUST DO
━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **Cluster semantically similar issues**
   - Group issues even if wording differs
   - Focus on meaning, not exact phrasing
   - Normalize issue names professionally
   - Do not create multiple categories for the same root cause
   - Prefer operational categories over emotional descriptions

Examples of correct grouping:
- "payment failed", "charged twice", "refund problem", "billing issue" → ONE issue
- "internet disconnects", "unstable connection", "network issue" → ONE issue

2. **Detect repeated patterns**
   - Count how many calls relate to each issue
   - Consider sentiment + priority + keywords

3. **Perform root-cause reasoning**
   - Explain WHY this issue keeps happening
   - Identify operational weaknesses
   - Summarize customer impact

4. **Generate practical business solutions**
   - Solutions must be realistic
   - Solutions must be actionable
   - Solutions must directly address the root cause

5. **Rank issues by severity**
   Severity = frequency + sentiment + priority + operational impact

6. **Limit output**
   - Return ONLY the top 5–10 most impactful issues
   - Ignore weak, isolated, or low-confidence issues
   - If no significant repeated issues exist, return an empty repeated_issues array

7. **Identify positives**
   - Highlight successful resolutions, positive customer sentiment, good agent practices
   - Mention specific strengths worth recognizing (not generic praise)

8. **Write general recommendations**
   - Provide strategic, actionable recommendations beyond per-issue fixes
   - Cover training, process improvements, and customer experience enhancements

━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━
- Output MUST be valid JSON ONLY
- No markdown
- No explanations
- No commentary
- No text outside JSON
- No code blocks
- No trailing commas
- All fields MUST exist
- Use ONLY the provided data
- Merge duplicates intelligently
- Use concise professional issue titles (3–6 words preferred)
- Output MUST be directly parseable using json.loads()

━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━
{formatted}

━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━
{{
  "repeated_issues": [
    {{
      "issue": "Professional issue title",
      "count": 0,
      "priority": "low | medium | high | critical",
      "description": "Root-cause explanation + customer impact",
      "suggested_solution": "Practical, realistic, actionable fix",
      "related_keywords": ["keyword1", "keyword2"]
    }}
  ],
  "positives": "Bullet-point text of positive highlights and strengths observed across calls (use • prefix per line)",
  "recommendations": "Bullet-point text of general strategic recommendations for QA and operations (use • prefix per line)"
}}

━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY valid JSON.
Your response MUST start with {{
and MUST end with }}.
"""