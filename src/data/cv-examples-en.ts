/**
 * English version of the CV examples dataset for /cv-examples (SEO pages).
 * Same structure as the Indonesian dataset; content is adapted (not machine
 * translated) including ATS keywords and tips for English-language roles.
 */
import type { CvExample } from "./cv-examples";

export const CV_EXAMPLES_EN: CvExample[] = [
  {
    slug: "software-engineer",
    title: "Software Engineer",
    category: "Technology",
    tagline: "A CV that highlights technical impact and system scale.",
    intro:
      "Software engineering is one of the most in-demand roles in Indonesia, from startups to large enterprises. Recruiters and hiring managers look for proof of impact: features shipped, performance improved, and scale handled. This example shows how to write technical achievements with numbers, not just a list of technologies.",
    summaryExample:
      "Software engineer with 4 years of experience building web applications and backend services. Comfortable with Node.js, TypeScript, PostgreSQL, and CI/CD. Reduced API response time by 60% and led a migration to a modular service architecture used by 3 teams.",
    keySkills: ["TypeScript", "Node.js", "React", "PostgreSQL", "REST API", "Docker", "CI/CD", "Unit Testing", "Git", "System Design Basics"],
    experienceExamples: [
      {
        position: "Software Engineer",
        company: "Example Tech Inc.",
        period: "January 2023 - Present",
        bullets: [
          "Designed and shipped 3 API services handling 200k requests per day at 99.9% uptime.",
          "Optimized database queries and caching, cutting main endpoint response time from 800ms to 320ms.",
          "Wrote automated tests that reduced production bugs by 35% within two quarters.",
        ],
      },
      {
        position: "Junior Web Developer",
        company: "Example Digital Startup",
        period: "July 2021 - December 2022",
        bullets: [
          "Built an internal dashboard with React and TypeScript used by 120 operations staff.",
          "Collaborated with the product team to ship 15 features without schedule slips.",
        ],
      },
    ],
    atsKeywords: ["software engineer", "full stack", "API", "REST", "database", "testing", "deployment", "agile", "scrum", "code review"],
    tips: [
      "State the scale: number of users, requests per day, or data size.",
      "Show business impact, not just the list of technologies.",
      "Put a GitHub or portfolio link near the top of your CV.",
    ],
  },
  {
    slug: "data-analyst",
    title: "Data Analyst",
    category: "Data & Analytics",
    tagline: "A CV that turns data into business decisions.",
    intro:
      "Demand for data analysts keeps growing as companies move to data-driven decisions. What sets strong candidates apart is the ability to translate numbers into recommendations. This CV example highlights analysis outcomes that changed decisions, not just tools used.",
    summaryExample:
      "Data analyst with 3 years of experience turning operational data into business recommendations. Fluent in SQL, Python (pandas), and Looker Studio dashboards. My churn analysis helped retain 18% of at-risk customers in one semester.",
    keySkills: ["SQL", "Python (pandas)", "Advanced Excel", "Looker Studio / Power BI", "Statistics Basics", "A/B Testing", "Data Cleaning", "Google Analytics", "Data Storytelling", "Basic ETL"],
    experienceExamples: [
      {
        position: "Data Analyst",
        company: "Example Retail Group",
        period: "March 2023 - Present",
        bullets: [
          "Built a weekly sales dashboard used by 5 branch heads for stock decisions.",
          "Analyzed behavior of 40k users and proposed 3 feature priorities that lifted conversion 12%.",
          "Automated a 6-hour weekly manual report into a 10-minute Python script.",
        ],
      },
      {
        position: "Junior Analyst",
        company: "Example Data Agency",
        period: "August 2022 - February 2023",
        bullets: [
          "Cleaned and merged campaign data from 4 sources for 12 clients.",
          "Produced monthly performance reports with recommendations adopted by the media buying team.",
        ],
      },
    ],
    atsKeywords: ["data analyst", "SQL", "dashboards", "reporting", "data visualization", "business intelligence", "statistics", "python", "KPI", "insight"],
    tips: [
      "Write analysis results as decisions or metrics that changed.",
      "Link a public dashboard portfolio (Looker Studio is free).",
      "Mention the data you handled: volume, sources, and frequency.",
    ],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing Specialist",
    category: "Marketing",
    tagline: "A CV that speaks through campaign metrics.",
    intro:
      "Digital marketing is among the highest-volume hiring areas. Recruiters look for proof of managing budgets and moving metrics: CTR, ROAS, acquisition cost, and organic growth. This example shows how to write campaign numbers honestly and specifically.",
    summaryExample:
      "Digital marketing specialist with 4 years of experience running Meta and Google Ads campaigns for e-commerce. Managed an IDR 150M monthly budget at 4.2 average ROAS. Grew Instagram organic following from 8k to 45k in 10 months.",
    keySkills: ["Meta Ads", "Google Ads", "On-Page SEO", "Google Analytics 4", "Email Marketing", "Ad Copywriting", "Content Calendar", "A/B Testing", "Budget Management", "Performance Reporting"],
    experienceExamples: [
      {
        position: "Digital Marketing Specialist",
        company: "Example E-Commerce Inc.",
        period: "February 2023 - Present",
        bullets: [
          "Managed an IDR 150M monthly ad budget at 4.2 ROAS (target 3.5).",
          "Cut customer acquisition cost by 28% through testing 40 ad variants in 6 months.",
          "Led organic content strategy that added 37k Instagram followers and 25% website traffic.",
        ],
      },
      {
        position: "Marketing Executive",
        company: "Example Creative Agency",
        period: "January 2022 - January 2023",
        bullets: [
          "Ran product launch campaigns for 6 clients totaling 3M impressions.",
          "Produced weekly performance reports that informed monthly strategy revisions.",
        ],
      },
    ],
    atsKeywords: ["digital marketing", "SEO", "SEM", "social media", "campaign", "ROAS", "conversion", "engagement", "analytics", "content"],
    tips: [
      "Always state the budget managed and the outcome (ROAS, CPA, growth).",
      "Separate paid and organic achievements for easy evaluation.",
      "Show ownership of strategy, not just task execution.",
    ],
  },
  {
    slug: "ui-ux-designer",
    title: "UI/UX Designer",
    category: "Design",
    tagline: "A CV that shows process and design impact.",
    intro:
      "UI/UX designers are in high demand across startups and product companies. The portfolio is your main weapon, but a strong CV explains your thinking: user research, iteration, and measured results. This example balances visual craft with evidence of impact.",
    summaryExample:
      "UI/UX designer with 3 years of experience designing mobile and web apps. Led a checkout redesign that increased conversion by 22%. Experienced facilitating usability testing with 30+ participants and building cross-team design systems.",
    keySkills: ["Figma", "Wireframing", "Prototyping", "User Research", "Usability Testing", "Design Systems", "Journey Mapping", "Accessibility", "Interaction Design", "Developer Handoff"],
    experienceExamples: [
      {
        position: "UI/UX Designer",
        company: "Example Product Startup",
        period: "April 2023 - Present",
        bullets: [
          "Led checkout flow redesign after 12 usability sessions, raising conversion 22%.",
          "Built a design system with 80+ components that sped up developer handoff by 40%.",
          "Partnered with PM and engineering across 6 major releases with no late-stage redesigns.",
        ],
      },
      {
        position: "Visual Designer",
        company: "Example Digital Agency",
        period: "June 2022 - March 2023",
        bullets: [
          "Designed 25 landing pages for 10 clients at an average pace of 3 days per page.",
          "Created visual guidelines used by the content team to keep brand consistency.",
        ],
      },
    ],
    atsKeywords: ["ui design", "ux research", "figma", "wireframe", "prototype", "usability", "user flow", "design system", "mobile app", "web design"],
    tips: [
      "Link your portfolio (Figma/Behance) at the top and keep it publicly accessible.",
      "Write the process: problem, research, solution, and impact, not just tools.",
      "Include metrics: conversion, task time, usability scores, or satisfaction.",
    ],
  },
  {
    slug: "sales-business-development",
    title: "Sales Executive / Business Development",
    category: "Sales",
    tagline: "A CV that shouts through sales numbers.",
    intro:
      "Sales and business development have the steadiest demand across industries. Recruiters need one thing: proof of numbers. This CV example shows how to present targets, quota achievement, and contract value clearly.",
    summaryExample:
      "Sales executive with 4 years of B2B and retail experience. Consistently hit 110-135% of quarterly targets with IDR 2.4B annual sales. Experienced building pipelines from scratch and maintaining long-term client relationships.",
    keySkills: ["Prospecting", "Negotiation", "Product Presentation", "CRM (Salesforce/HubSpot)", "Pipeline Management", "Closing", "Account Management", "Market Research", "Cold Calling", "Sales Reporting"],
    experienceExamples: [
      {
        position: "Sales Executive",
        company: "Example Distribution Inc.",
        period: "January 2022 - Present",
        bullets: [
          "Reached 118% of annual target with IDR 2.4B in sales from 45 active clients.",
          "Opened 3 new market areas contributing 22% of division revenue.",
          "Maintained 92% client retention through routine visits and needs reviews.",
        ],
      },
      {
        position: "Business Development",
        company: "Example B2B Startup",
        period: "March 2021 - December 2021",
        bullets: [
          "Built a 200-prospect pipeline and closed 18 contracts averaging IDR 35M each.",
          "Created pitch materials that lifted the follow-up meeting rate from 30% to 55%.",
        ],
      },
    ],
    atsKeywords: ["sales", "business development", "target", "quota", "pipeline", "negotiation", "CRM", "account management", "closing", "revenue"],
    tips: [
      "Write target achievement percentage, sales value, and client counts.",
      "Name the sales type: B2B, B2C, retail, corporate, or government.",
      "Show pipeline-building ability if you have it.",
    ],
  },
  {
    slug: "customer-service",
    title: "Customer Service",
    category: "Operations",
    tagline: "A CV that shows empathy and speed.",
    intro:
      "Customer service is needed across industries, from banking to e-commerce. Employers look for response speed, customer satisfaction, and problem-solving. This CV example highlights concrete service metrics.",
    summaryExample:
      "Customer service representative with 3 years of e-commerce experience. Handled 80+ tickets per day at a 4.8/5 satisfaction score. Reduced team escalations by 15% through a knowledge base I built.",
    keySkills: ["Empathetic Communication", "Complaint Handling", "Zendesk / CRM", "SLA Management", "Multi-Channel (Chat, Email, Phone)", "Problem Solving", "Product Knowledge", "Ticket Documentation", "Teamwork", "Multitasking"],
    experienceExamples: [
      {
        position: "Customer Service Representative",
        company: "Example E-Commerce Inc.",
        period: "February 2022 - Present",
        bullets: [
          "Handled an average of 85 tickets per day with a 4.8/5 customer satisfaction score.",
          "Built a 40-article knowledge base that reduced repeat tickets by 15%.",
          "Mentored 4 new staff, cutting onboarding from 3 weeks to 2 weeks.",
        ],
      },
      {
        position: "Frontliner",
        company: "Example Retail",
        period: "August 2021 - January 2022",
        bullets: [
          "Served 100+ customers daily with complaint handling averaging under 10 minutes.",
          "Received best staff of the month twice in a row.",
        ],
      },
    ],
    atsKeywords: ["customer service", "customer support", "CS", "complaint handling", "SLA", "satisfaction", "ticketing", "live chat", "call center", "helpdesk"],
    tips: [
      "Include numbers: daily ticket volume, satisfaction score, and resolution time.",
      "Show how you handle difficult situations calmly and constructively.",
      "List the tools you know: Zendesk, Freshdesk, or other CRMs.",
    ],
  },
  {
    slug: "accounting-finance",
    title: "Staff Accounting / Finance",
    category: "Finance",
    tagline: "A CV that highlights accuracy and compliance.",
    intro:
      "Accounting and finance staff are the backbone of financial compliance. Recruiters look for accuracy, tax mastery, and timely reporting. This CV example shows process and accuracy achievements, not just a list of duties.",
    summaryExample:
      "Staff accountant with 4 years of experience handling monthly financial statements, bank reconciliations, and VAT/income tax reporting. Closed monthly books 3 days faster through process improvements with 99.8% accuracy.",
    keySkills: ["Journal Entries & General Ledger", "Bank Reconciliation", "Financial Statements", "Tax (VAT, Income Tax)", "Advanced Excel", "Accurate / SAP / MYOB", "Cash Flow", "Internal Controls", "E-Invoicing", "Audit Support"],
    experienceExamples: [
      {
        position: "Staff Accountant",
        company: "Example Manufacturing Inc.",
        period: "January 2022 - Present",
        bullets: [
          "Closed monthly financial statements an average of 3 days ahead of the internal deadline.",
          "Maintained 99.8% accuracy across reconciliations of 6 bank accounts all year.",
          "Prepared external audit documents that cut audit time by 25%.",
        ],
      },
      {
        position: "Junior Finance Staff",
        company: "Example Distributor",
        period: "September 2020 - December 2021",
        bullets: [
          "Processed 300+ AP transactions monthly with zero late payments.",
          "Built a digital tax archive that simplified monthly reporting.",
        ],
      },
    ],
    atsKeywords: ["accounting", "finance", "reconciliation", "financial report", "tax", "VAT", "journal entries", "audit", "accrual", "general ledger"],
    tips: [
      "Name the software you truly know: Accurate, SAP, MYOB, or Xero.",
      "Show accuracy and timeliness with numbers.",
      "If you supported audits, describe your role and outcome.",
    ],
  },
  {
    slug: "hr-recruiter",
    title: "HR / Recruiter",
    category: "People",
    tagline: "A CV that shows impact on people and process.",
    intro:
      "HR and recruitment keep evolving, from administration to people development. Companies look for proof of managing recruitment cycles, employee relations, and process improvement. This CV example highlights time-to-hire and hire quality.",
    summaryExample:
      "HR generalist with 3 years of experience handling end-to-end recruitment, personnel administration, and employee engagement. Reduced time-to-fill from 45 to 28 days and raised team engagement scores by 20%.",
    keySkills: ["End-to-End Recruitment", "Interview & Assessment", "HRIS", "Benefits Administration", "Employee Relations", "Onboarding", "Training Coordination", "HR Reporting", "Labor Law Basics", "Employer Branding"],
    experienceExamples: [
      {
        position: "HR Generalist",
        company: "Example Tech Inc.",
        period: "March 2022 - Present",
        bullets: [
          "Closed 60+ positions in one year at a 28-day average time-to-fill (previously 45 days).",
          "Built a structured onboarding program that lifted 90-day new-hire retention from 78% to 92%.",
          "Coordinated engagement programs that raised internal survey scores by 20%.",
        ],
      },
      {
        position: "Recruitment Assistant",
        company: "Example Recruitment Agency",
        period: "July 2021 - February 2022",
        bullets: [
          "Screened 40+ resumes daily and scheduled 25 interviews per week without conflicts.",
          "Built a 1,200-profile candidate database that sped up sourcing for similar roles.",
        ],
      },
    ],
    atsKeywords: ["HR", "recruitment", "talent acquisition", "onboarding", "employee relations", "HRIS", "payroll", "interview", "people development", "performance review"],
    tips: [
      "Emphasize time-to-hire, hire quality, and retention, not just resume counts.",
      "Show understanding of relevant labor regulations.",
      "Name the systems you know: HRIS platforms and ATS tools.",
    ],
  },
  {
    slug: "content-writer",
    title: "Content Writer / Copywriter",
    category: "Content & Creative",
    tagline: "A CV that speaks through traffic and conversion.",
    intro:
      "The content industry grows fast: media, agencies, and brands all need writers. Recruiters judge portfolios, but a strong CV shows content impact: organic traffic, conversion, and engagement. This example turns writing into numbers.",
    summaryExample:
      "Content writer with 3 years of experience writing SEO articles, ad copy, and video scripts. Took a product guide to Google rank #1 with 40k monthly organic visits, and raised a sales page conversion by 18% through a full rewrite.",
    keySkills: ["SEO Writing", "Copywriting", "Keyword Research", "Editing & Proofreading", "Content Strategy", "WordPress / CMS", "Google Analytics", "Short-Form Video Scripts", "Email Newsletter", "Brand Storytelling"],
    experienceExamples: [
      {
        position: "Content Writer",
        company: "Example Digital Media",
        period: "April 2022 - Present",
        bullets: [
          "Wrote 120+ SEO articles per year; 15 ranked in Google's top 3.",
          "Grew organic site traffic from 12k to 40k monthly visits within 12 months.",
          "Built a style guide used by 5 freelance writers.",
        ],
      },
      {
        position: "Copywriter",
        company: "Example Creative Agency",
        period: "January 2021 - March 2022",
        bullets: [
          "Wrote copy for 30+ digital campaigns with average CTR above industry benchmarks.",
          "Rewrote a client's sales page, lifting conversion by 18%.",
        ],
      },
    ],
    atsKeywords: ["content writer", "copywriter", "SEO", "blog", "article", "editorial", "content strategy", "proofreading", "social media copy", "creative writing"],
    tips: [
      "Always include portfolio links: blog, Medium, or content clips.",
      "Show numbers: traffic, keyword rankings, CTR, or conversion.",
      "Match writing samples to the industry you are applying for.",
    ],
  },
  {
    slug: "product-manager",
    title: "Product Manager",
    category: "Product & Technology",
    tagline: "A CV that shows product outcome ownership.",
    intro:
      "Product management is a high-pay, high-competition technology role. Companies seek proof of leading products from problem to outcome, working cross-functionally, and deciding with data. This CV example highlights product metrics and leadership.",
    summaryExample:
      "Product manager with 4 years of experience leading a B2C product with 300k active users. Launched 12 major features that lifted retention by 25%. Comfortable balancing user research, data, and business priorities with engineering and design.",
    keySkills: ["Product Discovery", "Roadmapping", "User Stories & PRDs", "Product Analytics (Mixpanel/Amplitude)", "A/B Testing", "Agile / Scrum", "Stakeholder Management", "Prioritization (RICE)", "User Research", "Go-to-Market"],
    experienceExamples: [
      {
        position: "Product Manager",
        company: "Example Consumer Startup",
        period: "February 2022 - Present",
        bullets: [
          "Led a subscription feature launch that generated 30% of recurring revenue within 9 months.",
          "Raised 30-day retention from 22% to 29% via data-driven onboarding improvements.",
          "Managed a 3-team backlog with RICE prioritization, cutting scope creep by 40%.",
        ],
      },
      {
        position: "Associate Product Manager",
        company: "Example SaaS Company",
        period: "August 2020 - January 2022",
        bullets: [
          "Ran 20+ user research sessions that reshaped the quarterly roadmap.",
          "Shipped 8 features on schedule in collaboration with design and engineering.",
        ],
      },
    ],
    atsKeywords: ["product manager", "roadmap", "product strategy", "user research", "A/B testing", "metrics", "stakeholder", "agile", "PRD", "go-to-market"],
    tips: [
      "Write product outcomes with metrics: retention, conversion, revenue, or NPS.",
      "Show hard decisions and trade-offs you have made.",
      "State product scale: users, teams coordinated, and complexity.",
    ],
  },
  {
    slug: "apoteker",
    title: "Pharmacist",
    category: "Healthcare",
    tagline: "A CV that highlights compliance, care, and accuracy.",
    intro:
      "Pharmacists are needed in hospitals, pharmacy chains, pharmaceutical industry, and distribution. Recruiters assess regulatory compliance, prescription accuracy, and patient care. This CV example shows operational achievements while staying professional.",
    summaryExample:
      "Pharmacist with 3 years of experience in chain pharmacy and outpatient prescription services. Skilled in medication stock management, narcotic/psychotropic reporting, and drug information services. Reduced stock discrepancies by 40% through weekly audit systems.",
    keySkills: ["Prescription Services", "Drug Information Services", "Pharmacy Stock Management", "Good Distribution Practice", "Narcotic/Psychotropic Reporting", "Patient Counseling", "Drug Interactions", "Pharmacy Information Systems", "Hospital Accreditation Standards", "Pharmacy Safety"],
    experienceExamples: [
      {
        position: "Pharmacist in Charge",
        company: "Example Pharmacy Chain",
        period: "February 2023 - Present",
        bullets: [
          "Dispensed an average of 120 prescriptions daily at 99.9% accuracy with under 15-minute wait times.",
          "Reduced medication stock discrepancies by 40% via weekly audit SOPs and batch tracking.",
          "Led internal audit preparation that passed with zero major findings.",
        ],
      },
      {
        position: "Staff Pharmacist",
        company: "Example General Hospital",
        period: "August 2022 - January 2023",
        bullets: [
          "Screened 80+ outpatient prescriptions per shift with the pharmacy team.",
          "Created patient education leaflets on hypertension and diabetes for outpatient clinics.",
        ],
      },
    ],
    atsKeywords: ["pharmacist", "pharmacy", "prescription", "drug information", "stock management", "BPOM", "narcotics", "patient counseling", "dispensing", "pharmacovigilance"],
    tips: [
      "State your license (STRA) number and validity clearly.",
      "Mention quality standards you worked with: GDP, GMP, or hospital accreditation.",
      "Show numbers: daily prescriptions, accuracy, and service times.",
    ],
  },
  {
    slug: "mechanical-engineer",
    title: "Mechanical Engineer",
    category: "Engineering & Manufacturing",
    tagline: "A CV that shows technical precision and efficiency.",
    intro:
      "Mechanical engineers are sought in manufacturing, automotive, energy, and construction. Employers look for design, maintenance, and production efficiency evidence. This CV example highlights technical achievements with downtime and cost numbers.",
    summaryExample:
      "Mechanical engineer with 4 years of manufacturing experience. Skilled in AutoCAD, SolidWorks, and preventive maintenance. Reduced production line downtime by 25% and saved IDR 180M annually in spare parts costs.",
    keySkills: ["AutoCAD", "SolidWorks", "Preventive & Predictive Maintenance", "GD&T", "Root Cause Analysis", "Lean Manufacturing", "SAP PM", "Engineering Project Management", "Safety & LOTO", "Quality Control"],
    experienceExamples: [
      {
        position: "Mechanical Engineer",
        company: "Example Manufacturing Inc.",
        period: "January 2022 - Present",
        bullets: [
          "Reduced unplanned production downtime by 25% via data-driven preventive maintenance.",
          "Led a welding jig redesign that raised throughput 18% without adding headcount.",
          "Saved IDR 180M annually through spare part standardization and vendor negotiation.",
        ],
      },
      {
        position: "Engineering Trainee",
        company: "Example Automotive Company",
        period: "July 2020 - December 2021",
        bullets: [
          "Supported commissioning of 2 new production lines with no schedule delays.",
          "Drafted maintenance SOPs for 30 production machines.",
        ],
      },
    ],
    atsKeywords: ["mechanical engineer", "maintenance", "CAD", "manufacturing", "production", "downtime", "lean", "efficiency", "safety", "root cause"],
    tips: [
      "Write projects with technical numbers: %, rpm, cost, or operating hours.",
      "List the CAD/CAE software you truly master.",
      "For field roles, emphasize safety and hands-on experience.",
    ],
  },
];

export function getCvExampleEn(slug: string): CvExample | null {
  return CV_EXAMPLES_EN.find((example) => example.slug === slug) ?? null;
}
