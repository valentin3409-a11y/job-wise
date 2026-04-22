export const PROMPTS = {

  searchJobs: (title: string, country: string, city: string, level: string, cvSummary: string) => `
You are a job search engine. Generate 12 realistic job listings as if scraped RIGHT NOW from LinkedIn, Indeed, and local job boards in ${country}.

Search query: "${title}" in ${city ? city + ', ' : ''}${country}
Candidate level: ${level}
Candidate profile: ${cvSummary}

RULES:
- Use REAL company names that actually operate in ${country} and hire for ${title}
- Salary in the correct local currency (CHF for Switzerland, EUR for France/Belgium/Germany/Luxembourg, CAD for Canada, AUD for Australia, GBP for UK, USD for USA)
- Vary locations within ${country}, company sizes, and exact role titles slightly
- Mix strong matches (score 72-92) and medium matches (55-71) based on the candidate profile
- Distribute realistically across sources: LinkedIn, Indeed, ${country === 'Suisse' || country === 'Switzerland' ? 'Jobs.ch, JobUp.ch' : country === 'France' ? 'HelloWork, Cadremploi' : country === 'Australie' || country === 'Australia' ? 'Seek.com.au, CareerOne' : 'Monster, StepStone'}

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "id": <unique integer>,
    "title": "exact job title",
    "company": "real company name",
    "location": "city, country",
    "salary": "realistic salary range with currency",
    "type": "CDI or CDD or Freelance or Permanent or Contract",
    "source": "source platform name",
    "posted": "Il y a X jours or X days ago",
    "description": "2-3 sentences describing the role and company context",
    "requirements": ["requirement 1", "requirement 2", "requirement 3", "requirement 4"],
    "score": <integer 55-92>
  }
]`,

  matchScore: (cvText: string, jdText: string, lang: string) => `
${lang === 'fr' ? 'Réponds en français.' : 'Respond in English.'}
You are a senior recruiter with 20 years experience. Analyze this candidate against this job. Be HONEST — do not flatter or inflate scores.

CV:
${cvText.substring(0, 2500)}

JOB:
${jdText.substring(0, 2000)}

Scoring guide: 90-100=near perfect, 75-89=good, 60-74=decent gap, 40-59=significant gaps, 0-39=poor fit

Return ONLY valid JSON, no markdown:
{
  "score": <integer 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"],
  "deal_breakers": [],
  "honest_summary": "2 direct sentences. No flattery. State if competitive or not and why."
}`,

  tailorCV: (cvText: string, jdText: string, lang: string) => `
${lang === 'fr' ? 'Réponds en français.' : 'Respond in English.'}
Rewrite CV bullet points to better match this job description.
RULES: NEVER fabricate experience. Only reword emphasis and vocabulary to match JD terminology.

CV bullets from:
${cvText.substring(0, 2000)}

Job requirements:
${jdText.substring(0, 1500)}

Return ONLY valid JSON array, no markdown (max 5 items):
[{"original": "exact original text", "revised": "improved version", "reason": "short explanation"}]`,

  coverLetter: (cvText: string, jdText: string, lang: string, country: string) => `
${lang === 'fr' ? 'Écris en français.' : 'Write in English.'}
Write a cover letter. Country context: ${country}.

Style rules — MANDATORY:
- Conversational and direct, NOT corporate
- Maximum 3 paragraphs
- Do NOT summarize the CV
- Open with ONE specific reason this company/role is interesting
- Show understanding of their challenges
- Close with a confident, specific next step

FORBIDDEN phrases (never use):
- "Je me permets de vous contacter" / "I am writing to express my interest"
- "Je suis convaincu(e)" / "I believe I would be a great fit"  
- "Je suis passionné(e)" / "I am passionate about"
- "Je serais ravi(e)" / "I would love to"
- "Dans l'attente de vous lire" / "I look forward to hearing from you"

CV context:
${cvText.substring(0, 1500)}

Job context:
${jdText.substring(0, 1200)}

Return ONLY the letter text, ready to copy-paste. No subject line. No JSON.`,

  linkedinMessages: (cvText: string, jdText: string, lang: string) => `
${lang === 'fr' ? 'Écris en français.' : 'Write in English.'}
Write 3 LinkedIn connection messages. Each MUST be under 300 characters (strict limit).

FORBIDDEN: "Je suis tombé(e) sur votre profil" / "I came across your profile"
FORBIDDEN: "Je serais ravi(e) de me connecter" / "I would love to connect"
Be specific and human.

Candidate context: ${cvText.substring(0, 600)}
Job context: ${jdText.substring(0, 600)}

Return ONLY valid JSON, no markdown:
[
  {"label": "${lang === 'fr' ? 'Approche douce' : 'Soft approach'}", "text": "..."},
  {"label": "${lang === 'fr' ? 'Direct' : 'Direct'}", "text": "..."},
  {"label": "${lang === 'fr' ? 'Fort impact' : 'High impact'}", "text": "..."}
]`,

  screeningQA: (cvText: string, jdText: string, lang: string) => `
${lang === 'fr' ? 'Réponds en français.' : 'Respond in English.'}
Generate 5 screening interview Q&A for this candidate and role.
Answers must: sound natural (1st person), include a concrete example, NOT be over-polished or generic.

Candidate: ${cvText.substring(0, 800)}
Role: ${jdText.substring(0, 800)}

Return ONLY valid JSON, no markdown:
[{"question": "...", "answer": "..."}]`,
}
