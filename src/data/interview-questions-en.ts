/* ─────────────────────────────────────────────────────────────────── */
/*  Interview Question Database - English Translation                 */
/*  Same IDs as interview-questions.ts (bookmarks/ratings stay synced) */
/*  ⚠️ Add new positions to BOTH files (id + en)                     */
/* ─────────────────────────────────────────────────────────────────── */

import type {
  Difficulty,
  InterviewQuestion,
  PositionQuestions,
  QuestionCategory,
} from "./interview-questions";

const hrQuestionsEn: InterviewQuestion[] = [
  {
    id: "hr-1",
    category: "hr",
    question: "Tell me about yourself.",
    answer:
      "I am a professional with experience in [field] with [X] years of experience. I specialize in [key skill] and have successfully [biggest achievement]. I am currently looking for a new challenge in [target industry] to keep growing.",
    tips: [
      "Use the formula: Past (experience) → Present (skills) → Future (contribution)",
      "Tailor it to the position you're applying for - don't ramble",
      "Ideal duration: 60-90 seconds",
    ],
  },
  {
    id: "hr-2",
    category: "hr",
    question: "What are your greatest strengths and weaknesses?",
    answer:
      "My greatest strength is [relevant strength - e.g. strong data analysis skills], which I proved when I [concrete example]. As for weaknesses, I used to struggle with [weakness], but I overcame it by [how you addressed it] so now [positive result].",
    tips: [
      "Pick a weakness that is not a core skill for this position",
      "Include concrete improvement steps, don't just admit the weakness",
      "Strengths must be relevant to the job description",
    ],
  },
  {
    id: "hr-3",
    category: "hr",
    question: "Why do you want to work for our company?",
    answer:
      "I'm interested in [company name] because [specific reason - e.g. its reputation for AI innovation]. After reading about [project/product], I saw a strong connection with my expertise in [field]. I want to contribute to [company mission] and grow with a dynamic team.",
    tips: [
      "Research the company before the interview - products, culture, latest news",
      "Never say 'because I need a job' or 'because the salary is good'",
      "Connect the company's values with your personal values",
    ],
  },
  {
    id: "hr-4",
    category: "hr",
    question: "Where do you see yourself in 5 years?",
    answer:
      "In 5 years, I see myself as an expert in [field] who has contributed significantly to [company name]. I plan to master [advanced skill] and take on a [career level - e.g. senior/lead] role that allows me to mentor other team members.",
    tips: [
      "Show ambition that is realistic and relevant to the position",
      "Link your growth plan to the company - don't look like a stepping stone",
      "Avoid overly speculative or unrealistic answers",
    ],
  },
];

/* ─── Categories (English) ─── */
export const QUESTION_CATEGORIES_EN: QuestionCategory[] = [
  { slug: "technology", name: "Technology", icon: "code" },
  { slug: "business", name: "Business & Marketing", icon: "business_center" },
  { slug: "design", name: "Design & Creative", icon: "palette" },
  { slug: "operations", name: "Operations", icon: "assignment" },
  { slug: "healthcare", name: "Healthcare & Education", icon: "local_hospital" },
  { slug: "finance", name: "Accounting & Finance", icon: "receipt_long" },
  { slug: "manufacturing", name: "Manufacturing & Industrial", icon: "precision_manufacturing" },
];

/* ─── Individual Position Data (English) ─── */

export const POSITION_QUESTIONS_EN: PositionQuestions[] = [
  /* ═══════════════════════════ TECHNOLOGY ═══════════════════════════ */
  {
    id: "software-engineer",
    title: "Software Engineer",
    categorySlug: "technology",
    icon: "terminal",
    questions: [
      ...hrQuestionsEn,
      {
        id: "se-tech-1",
        category: "technical",
        question: "Explain the difference between REST and GraphQL. When would you choose one over the other?",
        answer:
          "REST uses fixed endpoints with HTTP methods (GET, POST, etc.) and a structured response per endpoint. GraphQL uses a single endpoint with flexible queries from the client.\n\nChoose REST when: the API is simple, you need built-in HTTP caching, or the team isn't familiar with GraphQL.\nChoose GraphQL when: there are many data relationships, you need to fetch specific fields, or you have mobile clients with limited bandwidth.",
        tips: [
          "Mention real experience using both",
          "Example: 'In my previous project, we migrated from REST to GraphQL because...'",
        ],
      },
      {
        id: "se-tech-2",
        category: "technical",
        question: "How do you ensure the quality of the code you write?",
        answer:
          "I apply several practices: (1) Unit testing with frameworks like Jest/Vitest, (2) Code review with the team, (3) Automated linting and formatting (ESLint, Prettier), (4) CI/CD pipeline that runs tests before merge, (5) Documentation for complex parts of the code.",
        tips: ["Mention metrics: target coverage of at least 80%", "Emphasize collaboration through code review"],
      },
      {
        id: "se-tech-3",
        category: "technical",
        question: "Tell me about your experience with version control (Git). What's your favorite branching strategy?",
        answer:
          "I use Git daily. My favorite branching strategy is trunk-based development with feature flags for small teams, or Git Flow for larger teams with scheduled releases. I use rebase for a clean history and merge commits for transparency.",
        tips: ["Mention tools: GitHub, GitLab, Bitbucket", "Experience handling merge conflicts is a plus"],
      },
      {
        id: "se-tech-4",
        category: "technical",
        question: "How do you handle error handling in a production application?",
        answer:
          "A layered approach: (1) Input validation at the API layer using schema validation (Zod/Yup), (2) Centralized error handler with consistent error codes, (3) Structured logging (Winston/Sentry) for debugging, (4) Graceful degradation - users can still use other features when one fails, (5) Monitoring and alerting (Datadog/New Relic).",
        tips: ["Mention experience debugging production issues", "Emphasize user experience when errors occur"],
      },
      {
        id: "se-tech-5",
        category: "technical",
        question: "What is the difference between synchronous and asynchronous programming?",
        answer:
          "Synchronous: code runs sequentially, each line waits for the previous one to finish (blocking). Asynchronous: code runs without waiting for previous operations (non-blocking). This matters for I/O operations like API calls and database queries. In JavaScript it's handled with callbacks, Promises, or async/await.",
        tips: [],
      },
      {
        id: "se-tech-6",
        category: "technical",
        question: "Explain the SOLID principles of programming.",
        answer:
          "S - Single Responsibility: each class has one reason to change. O - Open/Closed: open for extension, closed for modification. L - Liskov Substitution: subclasses can replace their parent. I - Interface Segregation: many specific interfaces. D - Dependency Inversion: depend on abstractions, not implementations.",
        tips: ["This is a classic question in OOP-based companies - master concrete examples"],
      },
      {
        id: "se-tech-7",
        category: "technical",
        question: "What is Docker and why is it useful?",
        answer:
          "Docker is a containerization platform that packages an application with its dependencies into portable, consistent containers that run in any environment. It eliminates the 'works on my machine' problem, simplifies deployment, and supports microservices.",
        tips: [],
      },
      {
        id: "se-tech-8",
        category: "technical",
        question: "Explain the difference between authentication and authorization.",
        answer:
          "Authentication: verifying identity (who are you?) - logging in with a password or JWT token. Authorization: access rights (what are you allowed to do?) - Role-Based Access Control (RBAC). Example: after login (auth), an admin can delete data but a regular user cannot (authorization).",
        tips: [],
      },
      {
        id: "se-tech-9",
        category: "technical",
        question: "What is CI/CD?",
        answer:
          "CI (Continuous Integration): the practice of regularly merging code changes into the main branch with automated testing. CD (Continuous Delivery/Deployment): automating deployment to staging/production. Tools: Jenkins, GitHub Actions, GitLab CI, CircleCI.",
        tips: [],
      },
      {
        id: "se-tech-10",
        category: "technical",
        question: "How do you debug problematic code?",
        answer:
          "1) Read the error message carefully. 2) Reproduce the bug. 3) Use a debugger/console.log. 4) Isolate the problem (binary search). 5) Check documentation and Stack Overflow. 6) Peer review. 7) After fixing, write a test to prevent regression.",
        tips: [],
      },
    ],
  },
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    categorySlug: "technology",
    icon: "web",
    questions: [
      ...hrQuestionsEn,
      {
        id: "fe-tech-1",
        category: "technical",
        question: "Which frontend frameworks/libraries do you master? Compare their pros and cons.",
        answer:
          "I'm most proficient with React/Next.js. React excels in a mature ecosystem with strong community support. I'm also familiar with Vue.js, which I find more intuitive for smaller projects. For performance, I've used Svelte, which produces very small bundle sizes. The choice depends on project needs and team.",
        tips: ["Don't just memorize - show deep understanding of one framework"],
      },
      {
        id: "fe-tech-2",
        category: "technical",
        question: "How do you optimize frontend application performance?",
        answer:
          "Several techniques: (1) Code splitting with dynamic imports, (2) Lazy loading for images and below-the-fold components, (3) Memoization (useMemo, useCallback) to prevent unnecessary re-renders, (4) Image optimization with modern formats (WebP/AVIF), (5) Inline critical CSS, (6) Measuring with Lighthouse and Web Vitals.",
        tips: ["Mention concrete metrics: 'I reduced LCP from 4.2s to 1.8s'"],
      },
      {
        id: "fe-tech-3",
        category: "technical",
        question: "Explain state management in React. When do you use Context vs Redux/Zustand?",
        answer:
          "React has useState for local state and useReducer for complex state. Context API is suitable for simple shared state like theme or auth. For complex global state, I choose Zustand because it's lightweight and simple, or Redux Toolkit for larger teams that need structured middleware.",
        tips: [],
      },
      {
        id: "fe-tech-4",
        category: "technical",
        question: "What is your approach to responsive design?",
        answer:
          "Mobile-first: design for mobile first, then scale up with Tailwind/media query breakpoints. I use CSS Grid for complex layouts, Flexbox for components, and relative units (rem, %, vw) instead of px. Testing across screen sizes and browsers is mandatory before deploying.",
        tips: ["Mention tools: Chrome DevTools responsive mode, BrowserStack"],
      },
    ],
  },
  {
    id: "backend-developer",
    title: "Backend Developer",
    categorySlug: "technology",
    icon: "dns",
    questions: [
      ...hrQuestionsEn,
      {
        id: "be-tech-1",
        category: "technical",
        question: "Explain the difference between SQL and NoSQL databases. When do you use each?",
        answer:
          "SQL (PostgreSQL, MySQL) suits structured data with complex relationships and ACID compliance needs. NoSQL (MongoDB, Firestore) suits semi-structured data, horizontal scalability, and flexible schemas.\n\nI usually start with PostgreSQL for most projects because of its reliability, switching to NoSQL when there's a specific need like deeply nested documents or massive traffic.",
        tips: [],
      },
      {
        id: "be-tech-2",
        category: "technical",
        question: "How do you design a good REST API?",
        answer:
          "Principles: (1) Naming conventions - plural nouns (/users, not /getUser), (2) HTTP methods matching their function, (3) Versioning via URL (/v1/), (4) Consistent error response format, (5) Pagination for list endpoints, (6) Rate limiting for security, (7) Automated documentation (Swagger/OpenAPI).",
        tips: [],
      },
      {
        id: "be-tech-3",
        category: "technical",
        question: "Tell me about your experience with authentication and authorization.",
        answer:
          "I've implemented various methods: (1) JWT for stateless auth - tokens with expiry, refresh token rotation, (2) Session-based auth with Redis store, (3) OAuth2 for social login (Google, GitHub), (4) RBAC (Role-Based Access Control) for authorization levels. Security best practices: HTTP-only cookies, CSRF protection, rate limiting on login endpoints.",
        tips: ["Mention experience with NextAuth.js or similar"],
      },
      {
        id: "be-tech-4",
        category: "technical",
        question: "How do you manage database migrations in production?",
        answer:
          "I use migration tools (Prisma Migrate, Drizzle Kit, Flyway) with versioning. Every schema change is a separate reviewed migration file. Staging first before production. For big changes, I create backward-compatible migrations - add a column before dropping the old one. Always back up the database before migrating.",
        tips: [],
      },
    ],
  },
  {
    id: "fullstack-developer",
    title: "Full Stack Developer",
    categorySlug: "technology",
    icon: "layers",
    questions: [
      ...hrQuestionsEn,
      {
        id: "fs-tech-1",
        category: "technical",
        question: "How do you divide work between frontend and backend in a project?",
        answer:
          "I start by designing the data model and API contract (OpenAPI spec) before coding. This ensures frontend and backend can run in parallel. Prioritize critical-path backend endpoints first, then the frontend that needs them. I often use a monorepo so shared types can be used on both sides.",
        tips: ["Emphasize the importance of communication and API documentation"],
      },
      {
        id: "fs-tech-2",
        category: "technical",
        question: "Describe your favorite tech stack for web development.",
        answer:
          "My current favorite is the T3 Stack: Next.js (React) for frontend, tRPC or REST API for type-safe communication, Prisma/Drizzle ORM for the database, and PostgreSQL. For deployment I use Vercel or Docker on a VPS. This stack provides excellent developer experience with end-to-end type safety.",
        tips: ["Mention a stack relevant to the company's tech stack"],
      },
      {
        id: "fs-tech-3",
        category: "technical",
        question: "How do you handle state management in a full-stack application?",
        answer:
          "For server data, I prefer React Server Components (RSC) or React Query/TanStack Query - fetching data directly from the server or caching on the client. For UI state, useState/useReducer is enough. Global state like auth or theme uses Context or Zustand. Avoid over-engineering - start simple.",
        tips: [],
      },
      {
        id: "fs-tech-4",
        category: "technical",
        question: "Tell me about your experience with deployment and DevOps.",
        answer:
          "I use Docker for containerization with docker-compose for local development. CI/CD via GitHub Actions - auto test, build, and deploy to staging. For production: Nginx reverse proxy setup, SSL via Let's Encrypt, and monitoring with uptime robots or Sentry for error tracking.",
        tips: ["Mention cloud platforms: AWS, GCP, Vercel, or Railway"],
      },
    ],
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    categorySlug: "technology",
    icon: "cloud",
    questions: [
      ...hrQuestionsEn,
      {
        id: "do-tech-1",
        category: "technical",
        question: "Describe what you think an ideal CI/CD pipeline looks like.",
        answer:
          "Ideal pipeline: (1) Developer pushes code → (2) Linting & type checking → (3) Unit tests → (4) Build → (5) Integration tests → (6) Deploy to staging → (7) E2E tests → (8) Deploy to production (with approval). Every stage should be fast (< 10 minutes total). I use GitHub Actions or GitLab CI.",
        tips: [],
      },
      {
        id: "do-tech-2",
        category: "technical",
        question: "How do you manage infrastructure as code (IaC)?",
        answer:
          "I use Terraform to provision cloud resources (AWS/GCP). All configuration is version-controlled and reviewed like regular code. For Kubernetes, I use Helm charts. This approach ensures reproducibility - staging and production are identical, and rollback is as easy as a git revert.",
        tips: [],
      },
      {
        id: "do-tech-3",
        category: "technical",
        question: "Tell me about your experience with containerization and orchestration.",
        answer:
          "I use Docker daily for containerization - multi-stage builds to optimize image size. For orchestration, I manage Kubernetes clusters (EKS/GKE). I set up Horizontal Pod Autoscaler for automatic scaling and Network Policies for security. Monitoring via Prometheus + Grafana.",
        tips: [],
      },
      {
        id: "do-tech-4",
        category: "technical",
        question: "How do you handle incident response?",
        answer:
          "Procedure: (1) Detect - monitoring alerts (PagerDuty), (2) Triage - assess severity and impact, (3) Mitigate - rollback or hotfix, (4) Resolve - permanent fix, (5) Post-mortem - root cause analysis and action items. I believe in fair on-call rotations and a blameless post-mortem culture.",
        tips: [],
      },
    ],
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    categorySlug: "technology",
    icon: "analytics",
    questions: [
      ...hrQuestionsEn,
      {
        id: "ds-tech-1",
        category: "technical",
        question: "Explain the difference between supervised, unsupervised, and reinforcement learning.",
        answer:
          "Supervised learning: the model is trained on labeled data (e.g., email spam classification). Unsupervised learning: the model finds patterns in unlabeled data (e.g., customer segmentation). Reinforcement learning: an agent learns from rewards/penalties by interacting with an environment (e.g., game AI). The choice depends on available data and the problem to solve.",
        tips: ["Include real project examples for each type"],
      },
      {
        id: "ds-tech-2",
        category: "technical",
        question: "How do you handle imbalanced datasets?",
        answer:
          "Several approaches: (1) Resampling - oversampling the minority class (SMOTE) or undersampling the majority class, (2) Using algorithms robust to imbalance (Random Forest, XGBoost), (3) Class weights in the loss function, (4) Using appropriate evaluation metrics (F1-score, Precision-Recall AUC, not accuracy).",
        tips: [],
      },
      {
        id: "ds-tech-3",
        category: "technical",
        question: "Describe the feature engineering process you usually follow.",
        answer:
          "Feature engineering is the most important step. My process: (1) Domain analysis - understand the business context, (2) Missing value handling - imputation or flagging, (3) Encoding - one-hot, label, or target encoding for categoricals, (4) Scaling - StandardScaler or MinMaxScaler, (5) Feature interaction - polynomial features, (6) Dimensionality reduction - PCA or feature selection.",
        tips: [],
      },
      {
        id: "ds-tech-4",
        category: "technical",
        question: "How do you validate the performance of a machine learning model?",
        answer:
          "I use k-fold cross-validation (usually k=5 or 10) for robust evaluation. Split: 70% train, 15% validation, 15% test. The test set is used only once at the end for final evaluation. Metrics depend on the problem: regression (MSE, MAE, R²), classification (Accuracy, Precision, Recall, F1, AUC-ROC).",
        tips: [],
      },
    ],
  },
  {
    id: "mobile-developer",
    title: "Mobile Developer",
    categorySlug: "technology",
    icon: "smartphone",
    questions: [
      ...hrQuestionsEn,
      {
        id: "md-tech-1",
        category: "technical",
        question: "What is the difference between React Native, Flutter, and native development?",
        answer:
          "Native (Swift/Kotlin): best performance, full access to device APIs, but you maintain 2 codebases. React Native: JavaScript/TypeScript, hot reload, up to 90% shared logic, bridge to native modules. Flutter: Dart, near-native performance (Skia engine), consistent widget system. Choice: Native for complex/gaming apps, React Native for fast MVPs, Flutter for complex UIs and cross-platform consistency.",
        tips: [],
      },
      {
        id: "md-tech-2",
        category: "technical",
        question: "How do you optimize mobile application performance?",
        answer:
          "Key areas: (1) Image optimization - caching, lazy loading, compression, (2) List virtualization - FlatList/VirtualizedList in React Native, (3) Avoid unnecessary re-renders - memoization, (4) Bundle size optimization - code splitting, tree shaking, (5) Network - request batching, pagination, offline-first with local caching.",
        tips: ["Mention the performance metrics you monitor"],
      },
      {
        id: "md-tech-3",
        category: "technical",
        question: "How do you handle state management in mobile applications?",
        answer:
          "It depends on the framework: React Native → Redux Toolkit or Zustand + React Query. Flutter → Riverpod or Bloc. The principle: separate UI state (loading, error) from data state (server data). Server state is managed with caching strategies (React Query/Hydration); UI state only needs setState or a simple provider.",
        tips: [],
      },
      {
        id: "md-tech-4",
        category: "technical",
        question: "Tell me about your experience with app store deployment.",
        answer:
          "I've managed deployments to both the App Store and Play Store. Process: (1) Code signing & provisioning profiles (iOS), (2) Build signing & keystore (Android), (3) TestFlight/Internal testing, (4) Beta testing with TestFlight/Play Console, (5) Production release with staged rollout (10% → 50% → 100%). I understand review guidelines and have handled rejections.",
        tips: [],
      },
    ],
  },
  {
    id: "qa-engineer",
    title: "QA Engineer",
    categorySlug: "technology",
    icon: "bug_report",
    questions: [
      ...hrQuestionsEn,
      {
        id: "qa-tech-1",
        category: "technical",
        question: "Explain the difference between unit tests, integration tests, and E2E tests.",
        answer:
          "Unit tests: test the smallest function/component in isolation (Jest, Vitest). Integration tests: test interactions between components (React Testing Library). E2E tests: test complete flows from the user perspective (Cypress, Playwright). Testing pyramid: many unit tests, medium integration tests, few E2E tests.",
        tips: [],
      },
      {
        id: "qa-tech-2",
        category: "technical",
        question: "How do you decide what should be automated vs manually tested?",
        answer:
          "Automation priority: (1) Regression tests - run on every deploy, (2) Critical user flows - login, checkout, payment, (3) Data validation - form inputs, API responses. Manual testing: (1) Exploratory testing - UX feel, (2) Visual regression - layouts on different devices, (3) Edge cases that are hard to automate. Goal: automate 80%, manual 20%.",
        tips: [],
      },
      {
        id: "qa-tech-3",
        category: "technical",
        question: "What do you do when you find a bug in production?",
        answer:
          "Procedure: (1) Document - screenshot, console logs, reproduction steps, environment info, (2) Triage - severity (critical/major/minor) and priority, (3) Report to the issue tracker with clear labels, (4) Follow up with developers for the fix, (5) Verify the fix in staging, (6) Regression test the affected areas.",
        tips: ["Emphasize good communication with the developer team"],
      },
      {
        id: "qa-tech-4",
        category: "technical",
        question: "Describe the testing tools and frameworks you master.",
        answer:
          "I use: (1) Jest/Vitest for unit & integration tests, (2) React Testing Library for component tests, (3) Cypress/Playwright for E2E, (4) Postman/Newman for API testing, (5) Lighthouse/Lighthouse CI for performance testing, (6) BrowserStack for cross-browser testing. I also set up CI pipelines that run automated tests on every PR.",
        tips: [],
      },
    ],
  },
  {
    id: "cybersecurity-analyst",
    title: "Cybersecurity Analyst",
    categorySlug: "technology",
    icon: "security",
    questions: [
      ...hrQuestionsEn,
      {
        id: "cs-tech-1",
        category: "technical",
        question: "Explain the OWASP Top 10 and how you mitigate those risks.",
        answer:
          "The OWASP Top 10 covers the most critical vulnerabilities like injection, broken authentication, XSS, and security misconfiguration. Mitigation: (1) Input validation & parameterized queries for injection, (2) MFA + rate limiting for authentication, (3) Content Security Policy (CSP) for XSS, (4) Regular security audits and automated scanning for misconfiguration.",
        tips: ["Mention tools: OWASP ZAP, Burp Suite"],
      },
      {
        id: "cs-tech-2",
        category: "technical",
        question: "How do you perform penetration testing on a web application?",
        answer:
          "Methodology: (1) Reconnaissance - gather information (subdomains, tech stack, endpoints), (2) Scanning - automated scans with tools (Nmap, OWASP ZAP), (3) Exploitation - manual testing for injection, XSS, CSRF, IDOR, (4) Reporting - document findings with severity, PoC, and fix recommendations. I follow the PTES or OWASP Testing Guide standards.",
        tips: [],
      },
      {
        id: "cs-tech-3",
        category: "technical",
        question: "Explain the concept of defense in depth.",
        answer:
          "Defense in depth is a layered security strategy. If one layer is breached, others still protect: (1) Physical security, (2) Network security - firewalls, IDS/IPS, VPN, (3) Application security - input validation, WAF, (4) Data security - encryption at rest & in transit, (5) Identity & access - MFA, least privilege, (6) Monitoring - SIEM, log analysis.",
        tips: [],
      },
      {
        id: "cs-tech-4",
        category: "technical",
        question: "What do you do when a security incident occurs?",
        answer:
          "I follow the NIST incident response framework: (1) Preparation - playbooks, tools, team, (2) Detection & Analysis - identify indicators of compromise, scope, severity, (3) Containment - isolate affected systems, back up forensic data, (4) Eradication - remove malware, patch vulnerabilities, (5) Recovery - restore from clean backups with tight monitoring, (6) Post-incident - root cause analysis, lessons learned.",
        tips: [],
      },
    ],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    categorySlug: "technology",
    icon: "insights",
    questions: [
      ...hrQuestionsEn,
      {
        id: "da-role-1",
        category: "role-specific",
        question: "Describe your process for analyzing a new dataset.",
        answer:
          "1) Understand the business context and the questions to answer. 2) Explore the data (EDA): check structure, data types, row count. 3) Check data quality: missing values, duplicates, outliers. 4) Clean and transform the data. 5) Analyze and visualize. 6) Interpret findings and make recommendations.",
        tips: ["Emphasize that 80% of a data analyst's time goes to data cleaning"],
      },
      {
        id: "da-role-2",
        category: "role-specific",
        question: "What tools do you use for data analysis?",
        answer:
          "Excel for quick analysis, SQL for database queries, Python (Pandas, NumPy, Matplotlib, Seaborn) for complex analysis, and Tableau/Power BI for visualization and dashboards. I match the tool to the need and the audience.",
        tips: [],
      },
      {
        id: "da-role-3",
        category: "role-specific",
        question: "What is the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN in SQL?",
        answer:
          "INNER JOIN: only rows with matches in both tables. LEFT JOIN: all rows from the left table + matching rows from the right table (NULL where there's no match). RIGHT JOIN: the opposite of LEFT JOIN. FULL OUTER JOIN: all rows from both tables.",
        tips: [],
      },
      {
        id: "da-role-4",
        category: "role-specific",
        question: "What is a missing value and how do you handle it?",
        answer:
          "A missing value is data that isn't available. Handling: Drop (remove if the proportion is small), Imputation (fill with mean/median for numeric, mode for categorical), Forward/Backward Fill (time series), or Flagging (a marker column). The choice depends on the context.",
        tips: [],
      },
      {
        id: "da-role-5",
        category: "role-specific",
        question: "What is an outlier and how do you identify one?",
        answer:
          "An outlier is a value that deviates far from the normal distribution. Identification: Visualization (boxplot, scatter plot) or Statistics (IQR method - values outside Q1-1.5×IQR or Q3+1.5×IQR, or Z-score > 3). Handling: drop, log transform, or cap/floor.",
        tips: [],
      },
      {
        id: "da-role-6",
        category: "role-specific",
        question: "What is the difference between correlation and causation?",
        answer:
          "Correlation: two variables move together (positively or negatively), but that doesn't imply cause and effect. Causation: one variable directly causes a change in another. Example: ice cream sales correlate with pool drownings (both rise in summer), but one doesn't cause the other.",
        tips: ["This is a classic question - show understanding with a real example"],
      },
      {
        id: "da-role-7",
        category: "role-specific",
        question: "What is A/B testing and how does it work?",
        answer:
          "A/B testing is an experiment comparing two versions (A=control, B=treatment). Steps: define a hypothesis, calculate sample size, assign randomly, run the experiment, analyze results statistically (p-value, confidence interval), determine significance.",
        tips: [],
      },
      {
        id: "da-role-8",
        category: "role-specific",
        question: "What are the key elements of a good dashboard?",
        answer:
          "Focus on the decisions that need to be made (not all data). Clear information hierarchy (overview → detail). Automatic updates when possible. Clean design, not too crowded. Accessible to the intended audience.",
        tips: [],
      },
      {
        id: "da-role-9",
        category: "role-specific",
        question: "Tell me about the most impactful data analysis project you've worked on.",
        answer:
          "Example: I analyzed customer churn patterns using Python and SQL. I found that customers who made no purchase within their first 30 days had a 70% higher probability of churn. An early engagement program recommendation reduced the churn rate by 15% within one quarter.",
        tips: ["Use concrete data: percentages, counts, measurable business impact"],
      },
    ],
  },

  /* ═══════════════════════════ BUSINESS & MARKETING ═════════════════ */
  {
    id: "marketing-manager",
    title: "Marketing Manager",
    categorySlug: "business",
    icon: "campaign",
    questions: [
      ...hrQuestionsEn,
      {
        id: "mm-role-1",
        category: "role-specific",
        question: "Create a marketing strategy for launching a new product on a limited budget.",
        answer:
          "With a limited budget, focus on organic channels: (1) Content marketing - blog posts, SEO-optimized articles, video tutorials, (2) Social media - viral content on TikTok/IG, community building on LinkedIn, (3) Email marketing - build a newsletter from scratch, (4) Partnerships - collaborate with micro-influencers in relevant niches, (5) PR - press releases to local/industry media.",
        tips: [],
      },
      {
        id: "mm-role-2",
        category: "role-specific",
        question: "How do you measure the ROI of a marketing campaign?",
        answer:
          "I use a framework: (1) Define specific KPIs per channel (CPC, CPM, CTR for paid; engagement rate, shares for organic), (2) Set up tracking - UTM parameters, Google Analytics goals, pixels, (3) Calculate CAC (Customer Acquisition Cost) and LTV (Lifetime Value), (4) ROAS (Return on Ad Spend) for paid, (5) Attribution modeling - first-click, last-click, or multi-touch.",
        tips: [],
      },
      {
        id: "mm-role-3",
        category: "role-specific",
        question: "Tell me about the most successful marketing campaign you've run.",
        answer:
          "Example: I ran the [campaign name] campaign aiming to boost brand awareness and lead generation. Strategy: a combination of Instagram Ads (stories + feed) and content marketing (blog + LinkedIn articles). Results: 150% increase in website traffic, 40% more leads, and CAC dropped 25% within 3 months.",
        tips: ["Use concrete data - don't be vague", "Mention the challenges faced and how you overcame them"],
      },
      {
        id: "mm-role-4",
        category: "role-specific",
        question: "How do you keep up with the latest marketing trends and adapt them?",
        answer:
          "I follow several sources: (1) Industry newsletters - Marketing Brew, Neil Patel, (2) Podcasts - Marketing School, (3) Communities - GrowthHacker community, (4) Tools - Google Trends, Exploding Topics. To adapt: I test new trends with small-scale A/B testing first (10% budget), measure results, then scale up if proven effective.",
        tips: [],
      },
    ],
  },
  {
    id: "digital-marketing-specialist",
    title: "Digital Marketing Specialist",
    categorySlug: "business",
    icon: "ads_click",
    questions: [
      ...hrQuestionsEn,
      {
        id: "dm-role-1",
        category: "role-specific",
        question: "Which digital advertising platforms do you master and how do you optimize them?",
        answer:
          "I master Google Ads (Search, Display, YouTube) and Meta Ads (Facebook & Instagram). Optimization: (1) Negative keyword research to reduce wasted spend, (2) A/B testing - creative, headline, CTA, audience, (3) Quality Score optimization for Google Ads, (4) Audience layering - custom audiences, lookalikes, retargeting, (5) Budget allocation - toward campaigns with the highest ROAS.",
        tips: ["Mention metrics: CTR, CPC, CPA, ROAS, Impression Share"],
      },
      {
        id: "dm-role-2",
        category: "role-specific",
        question: "How do you do SEO to increase organic traffic?",
        answer:
          "SEO approach: (1) Technical SEO - site speed, mobile-friendliness, structured data, XML sitemaps, canonical tags, (2) On-page - keyword-optimized titles, meta descriptions, header tags, internal linking, (3) Content - blog posts answering search intent, pillar pages, content clusters, (4) Off-page - quality backlinks, guest posting, broken link building. Monitor with Google Search Console and Ahrefs.",
        tips: [],
      },
      {
        id: "dm-role-3",
        category: "role-specific",
        question: "Tell me about your experience with email marketing and automation.",
        answer:
          "I use Mailchimp/Kit/SendGrid for: (1) Welcome sequences - 3-5 onboarding emails, (2) Nurture sequences - relevant educational content per segment, (3) Abandoned cart - 2-3 reminder emails with incentives, (4) Re-engagement - emails for inactive subscribers. Metrics: open rate (target >25%), click rate (target >3%), unsubscribe rate (<0.5%). A/B testing subject lines is essential.",
        tips: [],
      },
      {
        id: "dm-role-4",
        category: "role-specific",
        question: "How do you analyze campaign data to make decisions?",
        answer:
          "I use a data-driven approach: (1) Collect data from Google Analytics, Meta Business Suite, and the CRM, (2) Build dashboards in Google Data Studio/Looker, (3) Analyze trends - what's rising/falling and why, (4) A/B test hypotheses, (5) Weekly reporting with actionable recommendations. Decisions are based on data, not intuition.",
        tips: [],
      },
      {
        id: "dm-role-5",
        category: "role-specific",
        question: "What do you know about digital marketing?",
        answer:
          "Digital marketing is marketing products/services through digital media, covering: SEO, SEM/Google Ads, Social Media Marketing, Content Marketing, Email Marketing, Influencer Marketing, and Affiliate Marketing. Its goal is reaching the target audience in a more measurable way.",
        tips: [],
      },
      {
        id: "dm-role-6",
        category: "role-specific",
        question: "What is the difference between SEO and SEM?",
        answer:
          "SEO (Search Engine Optimization): organic traffic, free, long-term results in 3-6 months. SEM (Search Engine Marketing): paid advertising on search engines (Google Ads), instant results but paid per click (PPC).",
        tips: [],
      },
      {
        id: "dm-role-7",
        category: "role-specific",
        question: "Which social media platform is most effective for marketing in Indonesia?",
        answer:
          "It depends on the target: TikTok for Gen Z and virality, Instagram for visual branding and millennials, YouTube for long-form content and reviews, Facebook for ages 25-45 and SMEs, LinkedIn for B2B and professionals, X/Twitter for brand awareness and trending topics.",
        tips: [],
      },
      {
        id: "dm-role-8",
        category: "role-specific",
        question: "What is a marketing funnel? Explain its stages.",
        answer:
          "A marketing funnel is the consumer journey from not knowing about you to buying: (1) Awareness, (2) Interest, (3) Consideration/Desire, (4) Action/Conversion, (5) Retention/Loyalty, (6) Advocacy.",
        tips: [],
      },
      {
        id: "dm-role-9",
        category: "role-specific",
        question: "What is copywriting and why is it important in marketing?",
        answer:
          "Copywriting is the art of writing persuasive marketing text that drives action. It matters because the right words can increase ad CTR, engagement, and conversions. Popular formulas: AIDA (Attention, Interest, Desire, Action) and PAS (Problem, Agitate, Solution).",
        tips: [],
      },
      {
        id: "dm-role-10",
        category: "role-specific",
        question: "How do you handle negative comments or a brand crisis on social media?",
        answer:
          "1) Don't delete comments (except hate speech/hoaxes). 2) Respond quickly, professionally, with empathy. 3) Acknowledge mistakes if there are any. 4) Move to DM/email for resolution. 5) Escalate to management if it becomes a big issue. 6) Issue an official statement if needed.",
        tips: [],
      },
    ],
  },
  {
    id: "content-writer",
    title: "Content Writer / Copywriter",
    categorySlug: "business",
    icon: "edit",
    questions: [
      ...hrQuestionsEn,
      {
        id: "cw-role-1",
        category: "role-specific",
        question: "How do you write copy that drives conversions?",
        answer:
          "I use the AIDA formula: Attention - a headline that grabs attention with a strong hook, Interest - build interest by identifying the problem, Desire - concrete benefits and social proof, Action - a clear and urgent CTA. Plus principles: (1) Focus on benefits, not features, (2) Simple and direct language, (3) Use numbers and data, (4) Add urgency or scarcity when relevant.",
        tips: ["Include examples of copy that has driven high conversions"],
      },
      {
        id: "cw-role-2",
        category: "role-specific",
        question: "How do you research topics for blog articles?",
        answer:
          "Process: (1) Keyword research - Google Keyword Planner, Ahrefs, SEMrush to find keywords with high volume + relevance, (2) Analyze search intent - what users are looking for (informational, transactional, navigational), (3) Competitor analysis - look at top articles for the keyword, what's missing, (4) Content gaps - topics not yet well covered, (5) Brainstorm a unique angle - a perspective different from competitors.",
        tips: [],
      },
      {
        id: "cw-role-3",
        category: "role-specific",
        question: "Describe your editorial process from idea to publish.",
        answer:
          "Process: (1) Ideation - topic research, keywords, content brief, (2) Outline - article structure with H1, H2, H3, key points, (3) Drafting - write the first draft without over-editing, (4) Self-edit - proofread, check grammar, SEO optimization, (5) Peer review - a colleague reviews for feedback, (6) Final polish - formatting, images, internal links, meta description, (7) Publish & promote - share on social media and newsletters.",
        tips: ["Emphasize consistency - an editorial calendar is key"],
      },
      {
        id: "cw-role-4",
        category: "role-specific",
        question: "How do you write for different platforms (blog, social media, email)?",
        answer:
          "Each platform has its own style: (1) Blog - long-form, educational, 1500-2500 words, SEO-focused, (2) LinkedIn - professional, thought leadership, 300-500 words, (3) Instagram/TikTok - short, visual, hook in the first 3 seconds, (4) Twitter/X - concise, sharp, max 280 characters, (5) Email - personal, conversational, value-first. I adjust tone and format to the platform and audience.",
        tips: [],
      },
    ],
  },
  {
    id: "hr-manager",
    title: "HR Manager / Recruiter",
    categorySlug: "business",
    icon: "group",
    questions: [
      ...hrQuestionsEn,
      {
        id: "hr-role-1",
        category: "role-specific",
        question: "Describe your recruitment process from start to finish.",
        answer:
          "Process: (1) Sourcing - job boards (LinkedIn, Glints, Jobstreet), referral programs, passive headhunting, (2) Screening - CV screening, phone screening for basic verification, (3) Assessment - technical tests, psychometric tests, or case studies, (4) Interview - HR interview + user interview, (5) Offering - salary and benefits negotiation, (6) Onboarding - first day, documents, company culture. I measure effectiveness with time-to-hire and quality-of-hire.",
        tips: [],
      },
      {
        id: "hr-role-2",
        category: "role-specific",
        question: "How do you handle employee retention?",
        answer:
          "Retention strategy: (1) Exit interviews - understand why people leave, (2) Stay interviews - ask current employees what keeps them there, (3) Career development - clear career paths, training budgets, mentorship, (4) Compensation - annual salary market benchmarking, (5) Culture - feedback culture, work-life balance, recognition programs. I also monitor engagement surveys regularly.",
        tips: [],
      },
      {
        id: "hr-role-3",
        category: "role-specific",
        question: "What do you do when there's a conflict between employees?",
        answer:
          "Steps: (1) Listen to both sides separately - understand each perspective, (2) Mediate together - facilitate open and safe discussion, (3) Find common ground - what both parties agree on, (4) Action plan - concrete solutions with a timeline, (5) Follow up - make sure the solution works. If serious, involve a supervisor or use formal company procedures.",
        tips: [],
      },
      {
        id: "hr-role-4",
        category: "role-specific",
        question: "How do you make sure the recruitment process is unbiased?",
        answer:
          "Strategies: (1) Blind screening - remove names, photos, age, gender from CVs before review, (2) Structured interviews - the same questions for all candidates, scored with a rubric, (3) Diverse panels - interview panels with different backgrounds, (4) Objective criteria - set success criteria before seeing candidates, (5) Training - bias awareness training for all interviewers.",
        tips: [],
      },
      {
        id: "hr-role-5",
        category: "role-specific",
        question: "What do you know about Indonesia's Labor Law No. 13 of 2003?",
        answer:
          "This law regulates the working relationship between workers and employers, covering: PKWT vs PKWTT contracts, working hours and overtime, leave and time off, minimum wages, termination and severance pay, labor unions, and OHS (Occupational Health and Safety).",
        tips: [],
      },
      {
        id: "hr-role-6",
        category: "role-specific",
        question: "What's the difference between PKWT and PKWTT?",
        answer:
          "PKWT (Fixed-Term Employment Agreement): a contract with a limited duration, max 5 years (PP 35/2021). PKWTT (Indefinite-Term Employment Agreement): a permanent contract, valid until retirement or termination.",
        tips: [],
      },
      {
        id: "hr-role-7",
        category: "role-specific",
        question: "What is BPJS Ketenagakerjaan and what are its programs?",
        answer:
          "BPJS Ketenagakerjaan protects workers from employment risks. Programs: JKK (Work Accident Insurance), JKM (Death Insurance), JHT (Old-Age Savings), JP (Pension), JKP (Job Loss Insurance).",
        tips: ["HR professionals must understand BPJS - it's commonly asked in interviews"],
      },
      {
        id: "hr-role-8",
        category: "role-specific",
        question: "How do you calculate severance pay according to Indonesian regulations?",
        answer:
          "Based on PP 35/2021: less than 1 year of service = 1 month's salary, 1-2 years = 2 months, up to a maximum of 9 months for 8+ years. Plus period-of-service compensation (UPMK) and compensation for rights (UPH).",
        tips: [],
      },
      {
        id: "hr-role-9",
        category: "role-specific",
        question: "What is a KPI and how is it applied in HR?",
        answer:
          "A KPI is a measurable indicator for assessing performance. Example HR KPIs: Time to Fill, Turnover Rate, Training Hours per Employee, Employee Satisfaction Score, Absenteeism Rate.",
        tips: [],
      },
      {
        id: "hr-role-10",
        category: "role-specific",
        question: "How do you handle employees who are often absent or undisciplined?",
        answer:
          "Progressive discipline: (1) Verbal warning (coaching), (2) Warning Letter 1, (3) Warning Letter 2, (4) Warning Letter 3, (5) Termination if nothing changes. Every step is documented according to procedure to avoid disputes.",
        tips: ["Make sure every stage is well documented to avoid termination lawsuits"],
      },
    ],
  },
  {
    id: "sales-executive",
    title: "Sales Executive / Business Development",
    categorySlug: "business",
    icon: "trending_up",
    questions: [
      ...hrQuestionsEn,
      {
        id: "se-role-1",
        category: "role-specific",
        question: "Describe your sales process from prospecting to closing.",
        answer:
          "Pipeline: (1) Prospecting - LinkedIn Sales Navigator, cold email, referrals, event networking, (2) Qualification - the BANT framework (Budget, Authority, Need, Timeline), (3) Discovery - understand the client's pain points and goals, (4) Presentation - a product demo tailored to their needs, (5) Objection handling - address doubts, (6) Closing - proposal, negotiation, contract, (7) Follow-up - ensure delivery and upsell opportunities.",
        tips: ["Mention your personal quota and achievements"],
      },
      {
        id: "se-role-2",
        category: "role-specific",
        question: "How do you handle rejection from potential clients?",
        answer:
          "Rejection is part of sales. I: (1) Don't take it personally - understand the objective reasons, (2) Follow up with value - sometimes it's bad timing, not a bad product, (3) Ask for feedback - 'What made you decide not to continue?', (4) Keep in touch - nurture with relevant content until they're ready, (5) Analyze rejection patterns - is there a pattern I can fix in my approach?",
        tips: [],
      },
      {
        id: "se-role-3",
        category: "role-specific",
        question: "How do you hit aggressive sales targets?",
        answer:
          "Strategy: (1) Break down targets - monthly → weekly → daily, (2) Prioritize the pipeline - focus on high-probability deals, (3) Time blocking - dedicated time for prospecting, follow-ups, admin, (4) Leverage tools - CRM automation, email sequences, LinkedIn automation, (5) Continuous improvement - analyze win/loss ratio, refine the pitch. I exceeded my target by [X]% in my previous role.",
        tips: [],
      },
      {
        id: "se-role-4",
        category: "role-specific",
        question: "How do you build long-term relationships with clients?",
        answer:
          "Relationship building: (1) Trust - deliver on promises, never over-promise, (2) Value-add - share industry insights, not just sales pitches, (3) Regular check-ins - product updates, asking about their business, (4) Customer success - make sure clients succeed with the product, (5) Relevant upsell/cross-sell - don't force it, (6) Personal touch - remember personal details (birthdays, hobbies).",
        tips: [],
      },
      {
        id: "se-role-5",
        category: "role-specific",
        question: "Sell me this pen!",
        answer:
          "Before selling, ask about the need: 'When was the last time you used a pen and what matters to you in one?' Once you know the need, offer the solution. The key: ask about the need first, then offer a solution - don't pitch immediately.",
        tips: ["This is a classic test - show that you listen to the need before selling"],
      },
      {
        id: "se-role-6",
        category: "role-specific",
        question: "What's your strategy for cold calling or cold outreach?",
        answer:
          "1) Research the prospect first (industry, role, pain points). 2) Open with something relevant, not a direct pitch. 3) Focus on the value proposition. 4) Ask open-ended questions to uncover needs. 5) Close with a clear action: schedule a meeting or demo.",
        tips: [],
      },
      {
        id: "se-role-7",
        category: "role-specific",
        question: "How do you handle the objection 'the price is too high'?",
        answer:
          "1) Don't get defensive. 2) Dig in: 'Too expensive compared to what?' 3) Focus on value and ROI. 4) Offer options (different packages, installments). 5) If it's still not a fit, maintain the relationship for future opportunities.",
        tips: [],
      },
      {
        id: "se-role-8",
        category: "role-specific",
        question: "What is the difference between upselling and cross-selling?",
        answer:
          "Upselling: offering a more premium/expensive product. Cross-selling: offering additional/complementary products. Restaurant example: 'Would you like to upgrade to Large?' is an up-sell; 'Would you like to add fries?' is a cross-sell.",
        tips: [],
      },
      {
        id: "se-role-9",
        category: "role-specific",
        question: "What is a sales pipeline and how do you manage it?",
        answer:
          "A sales pipeline is a visual representation of all prospects at different sales stages. I manage it with a CRM, regularly update each prospect's status, identify bottlenecks, and make sure there are enough prospects at each stage to hit the target.",
        tips: ["Mention familiar CRM tools: Salesforce, HubSpot, Zoho"],
      },
    ],
  },
  {
    id: "business-analyst",
    title: "Business Analyst",
    categorySlug: "business",
    icon: "query_stats",
    questions: [
      ...hrQuestionsEn,
      {
        id: "ba-role-1",
        category: "role-specific",
        question: "What is the difference between a Business Analyst and a Data Analyst?",
        answer:
          "A Data Analyst focuses on processing and presenting data (statistics, visualization, insights from data). A Business Analyst focuses more on understanding business needs, analyzing processes, and bridging stakeholders with the technical team - data is one of the tools used to support solution recommendations.",
        tips: ["Explain with real examples from your work experience"],
        followUp: "If you had to choose one, which role are you better at?",
      },
      {
        id: "ba-role-2",
        category: "role-specific",
        question: "How do you gather and analyze stakeholder requirements?",
        answer:
          "1) Interviews and workshops with stakeholders to understand pain points. 2) Direct observation of business processes. 3) Analysis of existing documents and data. 4) Create user stories / requirement specifications. 5) Repeated validation (review loop) until everyone agrees. 6) Prioritize requirements with MoSCoW or an impact-effort matrix.",
        tips: ["Show that you can communicate with both technical and non-technical teams"],
      },
      {
        id: "ba-role-3",
        category: "role-specific",
        question: "What are BRD, FRD, and SRS? What's the difference?",
        answer:
          "BRD (Business Requirement Document): requirements from the business side - objectives, scope, benefits. FRD (Functional Requirement Document): details of the functions the system must have. SRS (Software Requirement Specification): a complete technical specification that developers follow - a combination of functional and non-functional requirements.",
        tips: [],
        followUp: "Which document do you use most often in your latest project?",
      },
      {
        id: "ba-role-4",
        category: "role-specific",
        question: "How do you handle stakeholders who keep changing requirements mid-project?",
        answer:
          "1) Always record changes and their impact (scope, time, cost) in writing. 2) Do an impact analysis before agreeing. 3) Communicate trade-offs to the stakeholder. 4) Use a formal change request process. 5) If changes are small, park them and include them in the next iteration (phase 2). The goal is keeping the project on track without damaging relationships.",
        tips: [],
      },
    ],
  },

  /* ═══════════════════════════ DESIGN & CREATIVE ════════════════════ */
  {
    id: "ui-ux-designer",
    title: "UI/UX Designer",
    categorySlug: "design",
    icon: "design_services",
    questions: [
      ...hrQuestionsEn,
      {
        id: "ux-role-1",
        category: "role-specific",
        question: "Describe your design process from research to developer handoff.",
        answer:
          "Process: (1) Research - user interviews, competitive analysis, analytics review, (2) Define - user personas, problem statements, user journey maps, (3) Ideate - brainstorming, sketching, wireframes, (4) Design - high-fidelity mockups in Figma, design system, (5) Prototype - interactive prototype for user testing, (6) Validate - usability testing, iterate based on feedback, (7) Handoff - design specs, asset exports, developer handoff with Figma Dev Mode.",
        tips: ["Mention tools: Figma, Miro, Maze, Dovetail"],
      },
      {
        id: "ux-role-2",
        category: "role-specific",
        question: "How do you make design decisions based on data?",
        answer:
          "I use data triangulation: (1) Qualitative - user interviews, usability testing (findings from Maze/UserTesting), (2) Quantitative - analytics (Hotjar heatmaps, Google Analytics funnels), A/B test results, (3) Heuristic - Nielsen's 10 usability heuristics for quick evaluation, (4) Business metrics - conversion rate, task completion rate, time-on-task. Design decisions are supported by at least 2 data sources.",
        tips: [],
      },
      {
        id: "ux-role-3",
        category: "role-specific",
        question: "What do you do when a stakeholder requests a feature that isn't user-centric?",
        answer:
          "Approach: (1) Listen first - understand the business goals behind the request, (2) Data-driven - show user research data that contradicts the request, (3) Alternatives - propose solutions that meet business goals while staying user-centric, (4) Compromise - prioritize: what can launch first, what needs more research, (5) Test - 'What if we A/B test it first?'",
        tips: [],
      },
      {
        id: "ux-role-4",
        category: "role-specific",
        question: "Tell me about your experience with design systems.",
        answer:
          "I've built design systems from scratch in Figma with reusable components. Components use auto layout, variants, and component properties. Documentation covers usage guidelines, dos and don'ts, and accessibility standards (WCAG 2.1 AA). I also set up the design system in Storybook for code documentation and consistency between design and implementation.",
        tips: [],
      },
    ],
  },
  {
    id: "graphic-designer",
    title: "Graphic Designer / Visual Designer",
    categorySlug: "design",
    icon: "brush",
    questions: [
      ...hrQuestionsEn,
      {
        id: "gd-role-1",
        category: "role-specific",
        question: "Describe your creative process from brief to final design.",
        answer:
          "Process: (1) Brief analysis - understand goals, target audience, brand guidelines, (2) Research - moodboards, visual references, industry trends, (3) Ideation - thumbnail sketching, concept exploration, (4) Design - digital execution in your chosen tools, (5) Refinement - detail polishing, color correction, typography, (6) Feedback - present to client/stakeholder, iterate, (7) Finalize - prepare files for print/digital.",
        tips: [],
      },
      {
        id: "gd-role-2",
        category: "role-specific",
        question: "How do you handle contradictory feedback from multiple stakeholders?",
        answer:
          "Strategy: (1) Collect all feedback and categorize it, (2) Identify which comes from user needs vs personal preference, (3) Prioritize based on project goals - feedback aligned with the goals, (4) Propose a compromise solution - a design accommodating several pieces of feedback, (5) Decision maker - if deadlocked, ask one accountable person to decide.",
        tips: [],
      },
      {
        id: "gd-role-3",
        category: "role-specific",
        question: "What are your main design tools and how do you use them efficiently?",
        answer:
          "Main tools: (1) Figma - UI/UX, prototyping, team collaboration, (2) Adobe Illustrator - vector graphics, logos, illustrations, (3) Adobe Photoshop - photo editing, digital painting, (4) Adobe After Effects - motion graphics, animation. Efficiency: plugins (automate repetitive tasks), keyboard shortcuts, custom templates, clean file organization.",
        tips: [],
      },
      {
        id: "gd-role-4",
        category: "role-specific",
        question: "How do you follow design trends without losing timeless quality?",
        answer:
          "I distinguish between 'trends' and 'fundamentals'. Fundamentals (color theory, typography basics, grid, hierarchy) don't change. Trends (glassmorphism, brutalist, neumorphism) are tools to use selectively. Approach: (1) Use trends as accents, not foundations, (2) Make sure the design stays functional and accessible, (3) When is a trend a distraction? Evaluate with the question: 'Does this help users reach their goals?'",
        tips: [],
      },
    ],
  },
  {
    id: "content-creator",
    title: "Content Creator",
    categorySlug: "design",
    icon: "video_library",
    questions: [
      ...hrQuestionsEn,
      {
        id: "cc-role-1",
        category: "role-specific",
        question: "What is your process for creating content from idea to publish?",
        answer:
          "1) Research trends and audience needs. 2) Brainstorm ideas - find a unique angle. 3) Write a script/storyboard. 4) Produce (shoot/design/edit). 5) Review and revise. 6) Schedule publishing at optimal times. 7) Monitor performance (views, engagement) and evaluate for the next piece. The process is a cycle - always learn from data.",
        tips: ["Mention your portfolio and metrics you've achieved"],
        followUp: "How long does it take you to produce one piece of content?",
      },
      {
        id: "cc-role-2",
        category: "role-specific",
        question: "How do you create content that goes viral on social media?",
        answer:
          "There's no guaranteed formula, but there are patterns: 1) A strong hook in the first 3 seconds. 2) Content relevant to current trends. 3) Emotion - funny, surprising, or relatable. 4) Format suited to the platform (reels, story, feed). 5) Posting consistency. 6) Use trending audio/music. Most importantly: focus on the value the audience feels - virality is a bonus.",
        tips: ["Don't promise virality - emphasize strategy and consistency"],
      },
      {
        id: "cc-role-3",
        category: "role-specific",
        question: "What tools do you master for creating content?",
        answer:
          "Video editing: CapCut, Premiere Pro, or DaVinci Resolve. Design: Canva, Figma. Scheduling: Meta Business Suite, Buffer. Analytics: Instagram Insights, TikTok Analytics, Google Analytics. AI tools (ChatGPT, Midjourney) for ideas and supporting visuals. Match the tools to the team's needs and budget.",
        tips: [],
      },
      {
        id: "cc-role-4",
        category: "role-specific",
        question: "How do you measure the success of a piece of content?",
        answer:
          "It depends on the goal (KPIs): Awareness - reach and impressions. Engagement - likes, comments, shares, saves. Conversion - link clicks, sales. Retention - watch time. I compare performance with previous content and industry benchmarks. Most importantly: did the content achieve its business goal, not just vanity metrics.",
        tips: [],
        followUp: "Which metric matters most for a brand awareness campaign?",
      },
    ],
  },
  {
    id: "videographer-editor",
    title: "Videographer / Video Editor",
    categorySlug: "design",
    icon: "videocam",
    questions: [
      ...hrQuestionsEn,
      {
        id: "ve-role-1",
        category: "role-specific",
        question: "Which editing software do you master and when do you use each?",
        answer:
          "Premiere Pro for professional video editing and team collaboration. DaVinci Resolve for more detailed color grading (especially films and commercials). After Effects for motion graphics and VFX. CapCut for fast-paced social media content that needs speed. The choice depends on project needs and output format.",
        tips: ["Bring a showreel - proof is stronger than claims"],
        followUp: "How do you handle very tight editing deadlines?",
      },
      {
        id: "ve-role-2",
        category: "role-specific",
        question: "What is your workflow from raw footage to final video?",
        answer:
          "1) Review and select footage (best takes). 2) Rough cut - build the story structure. 3) Fine cut - refine timing and transitions. 4) Sound design - music, sound effects, voiceover. 5) Color grading. 6) Motion graphics and text. 7) Render in the right format for the platform. 8) Client review and revisions.",
        tips: ["Emphasize file management: backups and clean project organization"],
      },
      {
        id: "ve-role-3",
        category: "role-specific",
        question: "How do you handle client criticism of your video work?",
        answer:
          "I treat criticism as part of the process. 1) Listen first without being defensive. 2) Clarify points that are unclear. 3) Ask for reference examples of what they want. 4) Turn feedback into technical action items. 5) Give realistic revision estimates. If I think some feedback is off, I share my opinion with data and professional reasoning.",
        tips: [],
      },
      {
        id: "ve-role-4",
        category: "role-specific",
        question: "What do you pay attention to in composition and lighting when shooting?",
        answer:
          "Composition: rule of thirds, headroom, leading lines, framing that matches the message. Lighting: light quality (hard/soft), light direction, white balance, and contrast. For interviews: basic three-point lighting. I also always think about continuity and post-production editing needs.",
        tips: [],
      },
    ],
  },

  /* ═══════════════════════════ OPERATIONS ═══════════════════════════ */
  {
    id: "project-manager",
    title: "Project Manager",
    categorySlug: "operations",
    icon: "rocket_launch",
    questions: [
      ...hrQuestionsEn,
      {
        id: "pm-role-1",
        category: "role-specific",
        question: "Describe the project management methodologies you master.",
        answer:
          "I master several methodologies: (1) Agile/Scrum - for software development, sprint planning, daily standups, retrospectives, (2) Waterfall - for projects with fixed requirements (construction, manufacturing), (3) Hybrid - upfront planning combined with agile execution. I choose the methodology based on the project type, team, and client preference. I'm also a certified Scrum Master.",
        tips: [],
      },
      {
        id: "pm-role-2",
        category: "role-specific",
        question: "How do you handle a project that's slipping past its deadline?",
        answer:
          "Steps: (1) Assess - identify the cause of the delay (scope creep? resources? technical debt?), (2) Communicate - inform stakeholders immediately, don't hide it, (3) Mitigate - what can be done? (add resources, reduce scope, parallelize tasks), (4) New timeline - realistic estimates with buffers for risk, (5) Lessons learned - a post-mortem to prevent recurrence.",
        tips: [],
      },
      {
        id: "pm-role-3",
        category: "role-specific",
        question: "How do you prioritize tasks in a complex project?",
        answer:
          "Prioritization frameworks: (1) Impact vs Effort matrix - do high impact, low effort items first, (2) MoSCoW - Must have, Should have, Could have, Won't have, (3) Dependencies - which tasks block others? Do those first, (4) Risk assessment - high-risk tasks need attention early. Tools: Jira, Trello, or Asana for tracking.",
        tips: [],
      },
      {
        id: "pm-role-4",
        category: "role-specific",
        question: "Tell me about the most challenging project you've managed.",
        answer:
          "Example: [Project name] with a budget of [budget] and a team of [size]. Challenge: [describe - e.g., misaligned stakeholders, tight timeline, limited resources]. What I did: [actions - e.g., daily syncs with stakeholders, re-prioritized scope, added freelance resources]. Result: delivered on time to the required quality, and the client was satisfied. Lesson: [what you learned].",
        tips: ["Use the STAR format (Situation, Task, Action, Result)"],
      },
    ],
  },
  {
    id: "product-manager",
    title: "Product Manager",
    categorySlug: "operations",
    icon: "inventory_2",
    questions: [
      ...hrQuestionsEn,
      {
        id: "prod-role-1",
        category: "role-specific",
        question: "Describe how you determine the product roadmap.",
        answer:
          "Process: (1) Vision & strategy - where should the product be in 1-2 years? (2) Data gathering - user feedback (surveys, interviews, support tickets), analytics (usage, retention), market research (competitors, trends), (3) Prioritization - frameworks like RICE (Reach, Impact, Confidence, Effort) or Value vs Effort, (4) Stakeholder alignment - present the roadmap, manage expectations, (5) Review & adapt - a roadmap isn't a dead document, review it every quarter.",
        tips: [],
      },
      {
        id: "prod-role-2",
        category: "role-specific",
        question: "How do you decide which feature to build next?",
        answer:
          "I use data-informed decisions: (1) Impact - how many users will it help? What's the potential revenue? (2) Urgency - is it a blocking issue? (3) Strategic alignment - does it support the product vision? (4) Effort - how many resources does it need? (5) Confidence - how sure are we in the estimates? Tools: productboard or Notion to manage ideas and prioritization.",
        tips: [],
      },
      {
        id: "prod-role-3",
        category: "role-specific",
        question: "How do you measure the success of a feature?",
        answer:
          "North star metrics depend on the feature type: (1) Feature adoption rate - what % of users try the feature within X days? (2) Engagement - frequency of use, time spent, (3) Retention - are users who use this feature more loyal? (4) Business impact - conversion rate, revenue, (5) User satisfaction - NPS, CSAT, qualitative feedback. Success criteria are defined BEFORE the feature is built.",
        tips: [],
      },
      {
        id: "prod-role-4",
        category: "role-specific",
        question: "What do you do when engineering says an estimate will take longer than expected?",
        answer:
          "Steps: (1) Understand the 'why' - technical debt? Complexity? Not enough resources? (2) Break it down - what's making it slow? Can it be scoped down? (3) Trade-offs - what can be sacrificed to speed it up? (4) Alternatives - is there a simpler solution? (5) Timeline adjustment - if it's realistic, accept it and manage stakeholder expectations. Don't force unrealistic estimates.",
        tips: [],
      },
    ],
  },
  {
    id: "admin-assistant",
    title: "Admin Assistant / Data Entry",
    categorySlug: "operations",
    icon: "description",
    questions: [
      ...hrQuestionsEn,
      {
        id: "aa-role-1",
        category: "role-specific",
        question: "How do you manage many administrative tasks at the same time?",
        answer:
          "I use a system of prioritization and organization: (1) Daily to-do list - write all tasks, prioritize by urgency vs importance, (2) Time blocking - allocate specific time for specific tasks, (3) Tools - Google Calendar, Trello/Notion for tracking, (4) Batch processing - group similar tasks and do them together (e.g., reply to all emails in one session), (5) Regular review - evaluate productivity and adjust your approach.",
        tips: ["Give concrete examples of the tools you use"],
      },
      {
        id: "aa-role-2",
        category: "role-specific",
        question: "Which office software do you master?",
        answer:
          "I'm proficient with: (1) Microsoft Office Suite - Word (mail merge, formatting), Excel (vlookup, pivot tables, formulas), PowerPoint, Outlook, (2) Google Workspace - Docs, Sheets, Gmail, Calendar, (3) Additional tools - Google Drive/Dropbox for file management, Trello/Asana for task management, Slack/Teams for communication, Canva for simple design.",
        tips: [],
      },
      {
        id: "aa-role-3",
        category: "role-specific",
        question: "How do you ensure high accuracy in data entry?",
        answer:
          "I have a double-check system: (1) First entry - full focus, minimal distractions, (2) Verification - cross-check with the original source after entry, (3) Formulas - use Excel validation and conditional formatting to detect anomalies, (4) Batch checks - review random samples of data, (5) Regular audits - compare data with previous periods to detect outliers.",
        tips: [],
      },
      {
        id: "aa-role-4",
        category: "role-specific",
        question: "How do you handle confidential information at work?",
        answer:
          "I take confidentiality seriously: (1) Never discuss sensitive information in public places, (2) Lock my screen when leaving the workstation, (3) Password management - never share passwords, use a password manager, (4) Secure file handling - encrypt sensitive files, delete when no longer needed, (5) Phishing awareness - never click random links or open attachments, (6) Understand and follow company data privacy policies.",
        tips: [],
      },
      {
        id: "aa-role-5",
        category: "role-specific",
        question: "What do you know about the duties of an administrative staff member?",
        answer:
          "They include document management (incoming/outgoing mail, archives), correspondence, meeting scheduling, data management, inter-departmental coordination, office supplies management, and supporting overall office operations.",
        tips: [],
      },
      {
        id: "aa-role-6",
        category: "role-specific",
        question: "How do you manage effective filing and archiving systems?",
        answer:
          "Consistent file naming conventions, organized folder structures (by year/document type), clear document versions, and regularly backed-up digital archives. For physical documents, use labeling and indexing systems that make retrieval easy.",
        tips: [],
      },
      {
        id: "aa-role-7",
        category: "role-specific",
        question: "How do you handle sudden requests from your supervisor while you're busy?",
        answer:
          "I confirm the urgency of the sudden task, then communicate my current workload: 'I'm currently working on [X] due [time]. Is this more urgent?' I don't refuse, but I make sure expectations are realistic.",
        tips: [],
      },
      {
        id: "aa-role-8",
        category: "role-specific",
        question: "How do you professionally handle guests or incoming phone calls?",
        answer:
          "Greet warmly and professionally, introduce myself and the company, listen to the need, and direct them to the right person/department. If the person isn't available, offer to take a message or schedule a convenient time.",
        tips: [],
      },
    ],
  },
  {
    id: "customer-service",
    title: "Customer Service",
    categorySlug: "operations",
    icon: "headset_mic",
    questions: [
      ...hrQuestionsEn,
      {
        id: "cs-role-1",
        category: "role-specific",
        question: "How would you describe good customer service?",
        answer:
          "Good customer service is responsive, empathetic, solution-oriented, and consistent. It's not just solving problems - it's making customers feel heard and valued. Good service turns a negative experience into a positive one.",
        tips: [],
      },
      {
        id: "cs-role-2",
        category: "role-specific",
        question: "How do you deal with angry or emotional customers?",
        answer:
          "1) Stay calm and don't get swept up in the emotion. 2) Let the customer express their complaint without interruption. 3) Show empathy: 'I understand how frustrating this situation is.' 4) Apologize for the inconvenience. 5) Focus on the solution, not the debate. 6) Confirm the issue is resolved.",
        tips: ["Never respond to anger with anger - stay professional"],
      },
      {
        id: "cs-role-3",
        category: "role-specific",
        question: "What do you do when you don't know the answer to a customer's question?",
        answer:
          "Don't guess! Say honestly: 'I apologize. To make sure the information I give you is accurate, let me check first. I'll get back to you within [X minutes].' Then follow up within the promised time.",
        tips: [],
      },
      {
        id: "cs-role-4",
        category: "role-specific",
        question: "How do you prioritize customers when many need service at the same time?",
        answer:
          "Prioritize by urgency and issue type. For high volume, use response templates for common questions. Communicate expected wait times to customers. If overwhelmed, escalate to a supervisor.",
        tips: [],
      },
      {
        id: "cs-role-5",
        category: "role-specific",
        question: "What is an SLA and why is it important in customer service?",
        answer:
          "An SLA (Service Level Agreement) is the promised response and resolution time commitment given to customers. It matters because it sets customer expectations, measures the CS team's performance, and ensures consistent service. Example: 'Emails are replied to within 24 hours' or 'Live chat responds within 2 minutes.'",
        tips: [],
      },
      {
        id: "cs-role-6",
        category: "role-specific",
        question: "How do you handle customers requesting something outside company policy?",
        answer:
          "With empathy: 'I understand your request, but our current policy doesn't allow this because [reason]. What I can do is [alternative solution].' Always offer an alternative, never just say 'we can't.'",
        tips: [],
      },
      {
        id: "cs-role-7",
        category: "role-specific",
        question: "What metrics are used to measure customer service performance?",
        answer:
          "CSAT (Customer Satisfaction Score): customer satisfaction after an interaction. FCR (First Contact Resolution): issues resolved at first contact. AHT (Average Handle Time): average handling duration. NPS (Net Promoter Score): how likely customers recommend the company. Response Time: how quickly you respond.",
        tips: [],
      },
      {
        id: "cs-role-8",
        category: "role-specific",
        question: "Tell me about a time you turned a negative customer experience into a positive one.",
        answer:
          "Example: A customer was frustrated because a package was misdelivered and they'd already waited 5 days. I escalated to the logistics team, gave updates every 4 hours, and proposed a voucher as compensation. The package arrived the next day and the customer left a 5-star rating.",
        tips: ["Use the STAR format: Situation, Task, Action, Result"],
      },
    ],
  },
  {
    id: "supply-chain",
    title: "Supply Chain / Logistics / PPIC",
    categorySlug: "operations",
    icon: "inventory",
    questions: [
      ...hrQuestionsEn,
      {
        id: "sc-role-1",
        category: "role-specific",
        question: "What do you know about supply chain management?",
        answer:
          "Supply Chain Management is managing the flow of goods, information, and money from suppliers to end consumers. It covers: procurement, production, warehousing, distribution, and reverse logistics.",
        tips: [],
      },
      {
        id: "sc-role-2",
        category: "role-specific",
        question: "What is PPIC and what is its role?",
        answer:
          "PPIC (Production Planning and Inventory Control) is the function that plans production schedules based on demand, manages raw material and finished goods stock, and ensures production runs efficiently without overstock or stockouts.",
        tips: [],
      },
      {
        id: "sc-role-3",
        category: "role-specific",
        question: "Explain the difference between FIFO, LIFO, and FEFO.",
        answer:
          "FIFO (First In First Out): the first goods in are the first out - the common method. LIFO (Last In First Out): the last goods in are the first out - rarely used in Indonesia. FEFO (First Expired First Out): goods with the nearest expiry go out first - mandatory in the food and pharmaceutical industries.",
        tips: [],
      },
      {
        id: "sc-role-4",
        category: "role-specific",
        question: "What is safety stock and how do you calculate it?",
        answer:
          "Safety stock is a buffer stock to anticipate variations in demand and lead time. Simple formula: Safety Stock = (Max Daily Usage × Max Lead Time) − (Average Daily Usage × Average Lead Time). It prevents stockouts without excessive overstocking.",
        tips: [],
      },
      {
        id: "sc-role-5",
        category: "role-specific",
        question: "What is EOQ (Economic Order Quantity)?",
        answer:
          "EOQ is the optimal order quantity that minimizes total inventory costs (ordering cost + holding cost). Formula: EOQ = √(2DS/H) where D = annual demand, S = cost per order, H = holding cost per unit per year.",
        tips: ["Understand the concept - you don't need to memorize the exact formula, just its purpose"],
      },
      {
        id: "sc-role-6",
        category: "role-specific",
        question: "What do you know about Lean Manufacturing?",
        answer:
          "Lean Manufacturing is a production philosophy focused on eliminating waste. The 8 types of waste (TIM WOODS): Transportation, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, Skills (unused talent).",
        tips: [],
      },
      {
        id: "sc-role-7",
        category: "role-specific",
        question: "What supply chain KPIs are commonly used?",
        answer:
          "Inventory Turnover: how many times stock rotates in a year. Fill Rate: the percentage of orders fulfilled on time. OTIF (On Time In Full): delivery on time and in complete quantity. Days of Supply: how many days of stock you have. Supplier Lead Time: average supplier lead time.",
        tips: [],
      },
      {
        id: "sc-role-8",
        category: "role-specific",
        question: "How do you handle late deliveries from suppliers?",
        answer:
          "1) Immediately confirm the new timeline with the supplier. 2) Check the impact on production schedules or existing stock. 3) Find emergency alternative suppliers if critical. 4) Inform the production team and management. 5) Evaluate the supplier for future performance ratings.",
        tips: [],
      },
    ],
  },
  {
    id: "operator-produksi",
    title: "Production Operator / Manufacturing Staff",
    categorySlug: "operations",
    icon: "precision_manufacturing",
    questions: [
      ...hrQuestionsEn,
      {
        id: "op-role-1",
        category: "role-specific",
        question: "Why are you applying for a production operator position at this company?",
        answer:
          "I'm interested because this company has a strong reputation for maintaining production quality standards. I want to contribute directly to the production process and grow into a competent, skilled operator.",
        tips: ["Research the company's products before the interview"],
      },
      {
        id: "op-role-2",
        category: "role-specific",
        question: "Have you ever worked in a production or factory environment?",
        answer:
          "Yes, I previously worked as [position] at [company] for [X] years. I'm used to shift work, production targets, and OHS (Occupational Health and Safety) procedures.",
        tips: ["Mention specific experience: machine types, products made, daily targets"],
      },
      {
        id: "op-role-3",
        category: "role-specific",
        question: "How do you maintain product quality during the production process?",
        answer:
          "By checking regularly according to standard operating procedures (SOPs), making sure machines work properly before starting production, immediately reporting any product defects, and carefully following work instructions.",
        tips: [],
      },
      {
        id: "op-role-4",
        category: "role-specific",
        question: "What do you know about K3 / OHS (Occupational Health and Safety)?",
        answer:
          "OHS is the effort to protect workers from the risk of workplace accidents and occupational illnesses. It covers: PPE use (helmets, safety shoes, masks), emergency procedures, safety signs, incident reporting, and a safety-first culture at work.",
        tips: ["Show that safety is your top priority"],
      },
      {
        id: "op-role-5",
        category: "role-specific",
        question: "Are you willing to work night shifts and overtime when needed?",
        answer:
          "Yes, I'm willing to work night shifts and overtime as production requires. I understand the manufacturing industry needs 24-hour operations and I'm ready to follow the assigned schedule.",
        tips: ["Be honest - if you truly can't do night shifts, say so upfront"],
      },
      {
        id: "op-role-6",
        category: "role-specific",
        question: "What is 5S and why is it important?",
        answer:
          "5S (Seiri-Sort, Seiton-Set in order, Seiso-Shine, Seiketsu-Standardize, Shitsuke-Sustain) is a systematic workplace organization method. It's important for: increasing efficiency, reducing waste, preventing accidents, and creating a comfortable, productive work environment.",
        tips: ["5S is a fundamental concept in almost every factory - understand it well"],
      },
      {
        id: "op-role-7",
        category: "role-specific",
        question: "How do you handle high production targets?",
        answer:
          "I stay focused on the work, follow SOPs with discipline, and keep my speed without sacrificing quality. If there are obstacles, I report to my supervisor immediately. I also keep myself physically fit during working hours.",
        tips: [],
      },
      {
        id: "op-role-8",
        category: "role-specific",
        question: "What do you do if you see a coworker violating safety procedures?",
        answer:
          "I'd remind the coworker politely and explain the importance of safety procedures. If it keeps happening, I'd report it to the supervisor for everyone's benefit. Safety is everyone's responsibility.",
        tips: [],
      },
    ],
  },
  {
    id: "hotel-front-office",
    title: "Front Office Staff / Hospitality",
    categorySlug: "operations",
    icon: "hotel",
    questions: [
      ...hrQuestionsEn,
      {
        id: "ho-role-1",
        category: "role-specific",
        question: "How do you handle a guest who's upset because their room isn't ready at check-in?",
        answer:
          "1) Stay calm and listen to the guest's complaint completely. 2) Apologize sincerely without blaming other departments. 3) Find a solution: another ready room, an upgrade (if available), or offer to store their bags and wait in the lounge. 4) Communicate a clear estimated time. 5) Follow up until the guest is satisfied. The goal is turning a bad experience into a positive impression.",
        tips: ["Service recovery is a core front office skill - share a real example"],
        followUp: "What if all rooms are fully booked?",
      },
      {
        id: "ho-role-2",
        category: "role-specific",
        question: "Which PMS (Property Management System) software do you master?",
        answer:
          "Common PMS in the industry: Opera (the most widely used in large hotels), VHP, Amadeus, or Frontdesk. Processes to master: check-in/check-out, reservations, billing, housekeeping status, and shift reports. If I'm not familiar with a specific PMS, I learn quickly because the logic is similar across systems.",
        tips: ["Be honest about your skill level - and show willingness to learn"],
      },
      {
        id: "ho-role-3",
        category: "role-specific",
        question: "How do you handle overbooking at a hotel?",
        answer:
          "1) Don't panic - check availability across all room types. 2) Coordinate with the front office manager and housekeeping (rooms that can be turned faster). 3) If it still doesn't fit: find a partner hotel nearby of equal or better standard and cover transport. 4) Communicate with the guest empathetically and offer compensation. 5) Document the incident for evaluation.",
        tips: [],
      },
    ],
  },

  /* ═══════════════════════════ HEALTHCARE & EDUCATION ═══════════════ */
  {
    id: "teacher",
    title: "Teacher / Lecturer / Educator",
    categorySlug: "healthcare",
    icon: "school",
    questions: [
      ...hrQuestionsEn,
      {
        id: "teacher-role-1",
        category: "role-specific",
        question: "How do you manage a class with students of different ability levels?",
        answer:
          "I use differentiated instruction: (1) Initial assessment - identify each student's ability level, (2) Grouping - group students by level for specific tasks, (3) Material variation - give tasks of different difficulty, (4) Scaffolding - slower students get extra guidance, faster ones get enrichment, (5) Flexible seating - arrange seating based on learning needs.",
        tips: [],
      },
      {
        id: "teacher-role-2",
        category: "role-specific",
        question: "Tell me about your favorite teaching method and why it's effective.",
        answer:
          "My favorite method is project-based learning (PBL). Students learn through real projects relevant to everyday life. It's effective because: (1) It increases engagement - students see the relevance of the material, (2) It develops critical thinking - not just memorization, (3) Collaboration - students learn to work in teams, (4) Authentic assessment - project results show real understanding.",
        tips: [],
      },
      {
        id: "teacher-role-3",
        category: "role-specific",
        question: "How do you handle disruptive or unmotivated students?",
        answer:
          "Approach: (1) Find the root cause - is it a problem at home? Learning difficulties? Boredom? (2) Build rapport - personal connection, show that I care, (3) Connect to interests - relate the material to what they enjoy, (4) Give choices - offer task options so they feel in control, (5) Positive reinforcement - appreciate small progress, not just end results, (6) Involve parents - regular communication for support at home.",
        tips: [],
      },
      {
        id: "teacher-role-4",
        category: "role-specific",
        question: "How do you use technology in teaching?",
        answer:
          "I use: (1) LMS (Google Classroom, Moodle) to manage materials and assignments, (2) Interactive tools (Kahoot, Quizizz) for fun assessments, (3) Learning videos (YouTube, Loom) for flipped classrooms, (4) Collaboration tools (Google Docs, Jamboard) for group work, (5) AI tools (ChatGPT, Grammarly) to help students learn, (6) Analytics (Google Forms, Socrative) to track student progress.",
        tips: [],
      },
    ],
  },
  {
    id: "nurse",
    title: "Nurse / Midwife",
    categorySlug: "healthcare",
    icon: "stethoscope",
    questions: [
      ...hrQuestionsEn,
      {
        id: "nurse-role-1",
        category: "role-specific",
        question: "How do you handle a medical emergency?",
        answer:
          "Procedure: (1) Primary survey (ABCDE) - Airway, Breathing, Circulation, Disability, Exposure, (2) Call for help - code blue / the on-duty doctor, (3) Initial actions - CPR if needed, oxygen, IV access, (4) Monitor - vital signs every 5 minutes, (5) Document - record all actions and patient responses, (6) Debrief - evaluate as a team once stable. I stay calm following my BLS/ACLS training.",
        tips: ["Mention certifications: BLS, ACLS"],
      },
      {
        id: "nurse-role-2",
        category: "role-specific",
        question: "How do you stay empathetic when handling difficult patients?",
        answer:
          "Principles: (1) Listen without judgment - let the patient express their frustration, (2) Validate feelings - 'I understand you're feeling frustrated', (3) Stay professional - don't bring in personal emotions, (4) Find the need behind the complaint - what does the patient actually need?, (5) Self-care - look after your own mental health, don't bring work stress home, (6) Peer support - share with colleagues.",
        tips: [],
      },
      {
        id: "nurse-role-3",
        category: "role-specific",
        question: "Tell me about your experience with medical documentation and electronic medical records.",
        answer:
          "I'm used to accurate, timely medical documentation: (1) SOAP format - Subjective, Objective, Assessment, Plan, (2) EMR/EHR systems - experience with Simrs, ERME, or SATUSEHAT, (3) Medication documentation - name, dose, route, time, reactions, (4) Informed consent - make sure patients understand procedures, (5) Confidentiality - comply with laws and ethics on patient privacy.",
        tips: [],
      },
      {
        id: "nurse-role-4",
        category: "role-specific",
        question: "How do you handle high workloads with night shifts?",
        answer:
          "Strategies: (1) Time management - prioritize by patient urgency, (2) Teamwork - delegate tasks according to competence, (3) Physical preparation - sleep well before night shifts, eat healthily, (4) Mental health - set boundaries between work and rest, (5) Communication - clear handovers between shifts, (6) Safety first - never compromise patient safety even when busy.",
        tips: [],
      },
    ],
  },
  {
    id: "pharmacist",
    title: "Pharmacist",
    categorySlug: "healthcare",
    icon: "medication",
    questions: [
      ...hrQuestionsEn,
      {
        id: "ph-role-1",
        category: "role-specific",
        question: "How do you handle a prescription that's hard to read or has a suspicious dosage?",
        answer:
          "1) Never guess - confirm directly with the prescribing doctor. 2) Ask about the patient's allergy history and current medications. 3) Check for drug interactions. 4) If the dose is outside standard range, ask why (it could be specialized therapy). 5) Document the confirmation. Patient safety is the top priority - a pharmacist has the right to refuse if in doubt.",
        tips: ["Emphasize patient safety - it's the core value of the pharmacy profession"],
        followUp: "What do you do if the doctor can't be reached?",
      },
      {
        id: "ph-role-2",
        category: "role-specific",
        question: "What do you do if a medication error occurs at the pharmacy?",
        answer:
          "1) Stay calm and don't cover it up. 2) Immediately check the patient's condition - if the medicine was taken, contact the doctor/hospital for management. 3) Report to the supervisor and record the incident. 4) Analyze the root cause (misread prescription, wrong label, wrong drug). 5) Improve SOPs to prevent recurrence. 6) Contact the patient for clarification and a sincere apology.",
        tips: [],
      },
      {
        id: "ph-role-3",
        category: "role-specific",
        question: "How do you provide medication counseling to patients?",
        answer:
          "Use a simple approach: 1) Explain the drug name and its function. 2) Usage instructions (dose, timing, how to take - before/after meals). 3) Common side effects and what to do. 4) Interactions with food/other drugs. 5) Proper storage. 6) Make sure the patient understands - ask them to repeat it back. Adjust the language to the patient's comprehension level.",
        tips: ["Demonstrate with easy-to-understand language for laypeople"],
        followUp: "What if a patient asks about a medicine that wasn't prescribed?",
      },
    ],
  },
  {
    id: "nutritionist",
    title: "Nutritionist",
    categorySlug: "healthcare",
    icon: "nutrition",
    questions: [
      ...hrQuestionsEn,
      {
        id: "nu-role-1",
        category: "role-specific",
        question: "How do you design a diet program for a patient with a specific medical condition (e.g., diabetes)?",
        answer:
          "1) Assess medical history, lab results, and eating habits. 2) Calculate calorie and macronutrient needs based on the condition. 3) For diabetes: watch glycemic index, carbohydrate portions, and regular eating patterns. 4) Build a realistic menu with foods available and liked by the patient. 5) Educate the patient and family. 6) Evaluate periodically and adjust.",
        tips: ["Show an individual approach - there's no one-size-fits-all diet"],
        followUp: "How do you handle patients who struggle to change their eating habits?",
      },
      {
        id: "nu-role-2",
        category: "role-specific",
        question: "What is balanced nutrition and what is the 'Isi Piringku' guideline?",
        answer:
          "Balanced nutrition is a daily food composition containing nutrients in the right types and amounts for the body's needs. The Isi Piringku guideline (from the Indonesian Ministry of Health): half the plate is fruits and vegetables, the other half is protein and carbohydrate sources. Plus drinking 8 glasses of water, physical activity, and hand washing.",
        tips: [],
      },
      {
        id: "nu-role-3",
        category: "role-specific",
        question: "How do you handle patients with eating disorders?",
        answer:
          "1) Approach with empathy and without judgment. 2) Refer to psychologists/psychiatrists because eating disorders need multidisciplinary care. 3) Focus on gradually repairing the relationship with food. 4) Involve the family as a support system. 5) Monitor physical status regularly (weight, labs). I don't handle this alone - teamwork is key.",
        tips: ["Know your scope of practice - know when to refer"],
        followUp: "What are early signs that someone might have an eating disorder?",
      },
    ],
  },

  /* ═══════════════════════════ FINANCE & ACCOUNTING ═══════════════ */
  {
    id: "staff-accounting",
    title: "Accounting / Finance Staff",
    categorySlug: "finance",
    icon: "receipt_long",
    questions: [
      ...hrQuestionsEn,
      {
        id: "acc-role-1",
        category: "role-specific",
        question: "What do you know about the accounting cycle?",
        answer:
          "The accounting cycle is the series of processes from financial transactions to financial statements: Transaction → Journal → General Ledger → Trial Balance → Adjusting Entries → Financial Statements → Closing Entries → Post-Closing Trial Balance.",
        tips: ["Memorize the order - this is a mandatory question for accounting fresh graduates"],
      },
      {
        id: "acc-role-2",
        category: "role-specific",
        question: "What is the difference between debit and credit?",
        answer:
          "In accounting: Debit increases assets and expenses, and decreases liabilities, equity, and revenue. Credit increases liabilities, equity, and revenue, and decreases assets and expenses. The two must always balance (double-entry principle).",
        tips: [],
      },
      {
        id: "acc-role-3",
        category: "role-specific",
        question: "What are financial statements and what are the types?",
        answer:
          "Financial statements are formal documents describing a company's financial condition. Types: (1) Income Statement, (2) Balance Sheet, (3) Cash Flow Statement, (4) Statement of Changes in Equity, (5) Notes to Financial Statements (CALK).",
        tips: [],
      },
      {
        id: "acc-role-4",
        category: "role-specific",
        question: "What is bank reconciliation and why is it important?",
        answer:
          "Bank reconciliation is the process of matching the balance in the company's books with the balance on the bank statement to ensure there are no discrepancies. It's important for detecting recording errors, unrecorded transactions, or potential fraud.",
        tips: ["Mention terms like outstanding check, deposit in transit, bank service charge"],
      },
      {
        id: "acc-role-5",
        category: "role-specific",
        question: "What is the difference between accrual basis and cash basis accounting?",
        answer:
          "Accrual basis: revenue and expenses are recognized when they occur, not when cash is received/paid. It follows accounting standards (PSAK/IFRS). Cash basis: revenue and expenses are recognized when cash moves. Simpler, commonly used by SMEs.",
        tips: [],
      },
      {
        id: "acc-role-6",
        category: "role-specific",
        question: "Which accounting software do you master?",
        answer:
          "I'm familiar with ACCURATE, Jurnal.id, and Zahir. I also learned SAP basics during an internship and can adapt to whatever software the company uses.",
        tips: ["Match this to your real experience - never claim what you haven't used"],
      },
      {
        id: "acc-role-7",
        category: "role-specific",
        question: "What are PPN and PPh? What's the difference?",
        answer:
          "PPN (Value Added Tax) is a tax on the consumption of goods/services at an 11% rate, borne by the end consumer. PPh (Income Tax) is a tax on individual/entity income. Examples: PPh 21 (employees), PPh 23 (services/rent), PPh 25 (corporate installments).",
        tips: ["Mention the latest PPN rate (11%) to show up-to-date knowledge"],
      },
      {
        id: "acc-role-8",
        category: "role-specific",
        question: "How do you handle end-of-month financial statement deadlines?",
        answer:
          "I keep a monthly task checklist with a clear timeline. I prioritize entering transactions regularly so they don't pile up at month end. As the deadline approaches, I'm ready to work longer and coordinate closely with the team to ensure the reports are done on time.",
        tips: [],
      },
      {
        id: "acc-role-9",
        category: "role-specific",
        question: "What is working capital and how do you calculate it?",
        answer:
          "Working capital = Current Assets − Current Liabilities. It shows a company's ability to meet short-term obligations with liquid assets. The higher the working capital, the more liquid the company.",
        tips: [],
      },
      {
        id: "acc-role-10",
        category: "role-specific",
        question: "What do you do if you find an error in a report that's already been submitted?",
        answer:
          "Report it to my supervisor immediately - never hide it. Then make the appropriate correcting journal entry, document the cause and solution, and make sure it doesn't recur by improving the verification process.",
        tips: ["Honesty is key - never try to cover up mistakes"],
      },
    ],
  },
  {
    id: "financial-analyst",
    title: "Financial Analyst",
    categorySlug: "finance",
    icon: "trending_up",
    questions: [
      ...hrQuestionsEn,
      {
        id: "fa-role-1",
        category: "role-specific",
        question: "Which financial statements must a financial analyst understand?",
        answer:
          "1) Income Statement - revenue and expenses, producing net profit. 2) Balance Sheet - assets, liabilities, equity at a point in time. 3) Cash Flow Statement - operating, investing, financing. 4) Statement of Changes in Equity. An analyst must read the relationships between statements and assess the company's financial health.",
        tips: ["Mention ratios you often calculate: liquidity, profitability, solvency"],
        followUp: "If a company has high profit but negative cash flow, what does that mean?",
      },
      {
        id: "fa-role-2",
        category: "role-specific",
        question: "What is variance analysis and how do you use it?",
        answer:
          "Variance analysis compares actual results with targets/budgets. Steps: 1) Calculate the difference (favorable/unfavorable). 2) Analyze the cause - volume, price, efficiency. 3) Distinguish controllable vs uncontrollable variances. 4) Report to management with recommended actions. The goal isn't blame - it's better planning.",
        tips: [],
      },
      {
        id: "fa-role-3",
        category: "role-specific",
        question: "How do you assess the feasibility of a project investment?",
        answer:
          "Using several methods: 1) NPV (Net Present Value) - the present value of future cash flows minus initial investment; positive means feasible. 2) IRR (Internal Rate of Return) - compare with the cost of capital. 3) Payback period. 4) Sensitivity analysis for best/worst-case scenarios. Final decisions also weigh qualitative factors, not just numbers.",
        tips: [],
        followUp: "What are the weaknesses of the payback period method?",
      },
      {
        id: "fa-role-4",
        category: "role-specific",
        question: "What tools do you master for financial analysis?",
        answer:
          "Excel/Google Sheets is a must - pivot tables, VLOOKUP/XLOOKUP, financial formulas (NPV, IRR), Power Query. At a larger scale: SQL to pull data from databases, Power BI/Tableau for dashboard visualization. If you have ERP experience (SAP, Oracle), mention it too.",
        tips: ["Bring examples of dashboards or Excel models you've built"],
      },
    ],
  },
  {
    id: "tax-consultant",
    title: "Tax Consultant",
    categorySlug: "finance",
    icon: "account_balance",
    questions: [
      ...hrQuestionsEn,
      {
        id: "tc-role-1",
        category: "role-specific",
        question: "What are the common types of PPh and who withholds them?",
        answer:
          "PPh 21: tax on employee income, withheld by the employer. PPh 22: collected on imports and certain goods sales. PPh 23: on dividends, interest, royalties, rent - withheld by the payer. PPh 25: income tax installments. PPh 29: underpayment at annual filing. Final PPh: e.g., 0.5% for SMEs per PP 55/2022.",
        tips: ["Show up-to-date knowledge: the 11-12% VAT rules and coretax"],
        followUp: "How is VAT treated on service exports?",
      },
      {
        id: "tc-role-2",
        category: "role-specific",
        question: "What is the difference between tax planning, tax avoidance, and tax evasion?",
        answer:
          "Tax planning: legal tax management to minimize the tax burden (using incentives, efficient structures). Tax avoidance: reducing taxes by exploiting legal loopholes (gray area). Tax evasion: tax fraud by breaking the law (not reporting income). A tax consultant must stick to legal, ethical planning.",
        tips: ["Emphasize integrity - legal and reputational risk is huge"],
      },
      {
        id: "tc-role-3",
        category: "role-specific",
        question: "What do you know about the Voluntary Disclosure Program (Tax Amnesty Jilid II)?",
        answer:
          "The Voluntary Disclosure Program (PPS), or Tax Amnesty Jilid II, ran from January 1 to June 30, 2022. Taxpayers could disclose previously unreported assets in their SPT at lower rates (6-14%) without criminal penalties. The program has ended, but understanding PPS matters for clients with unreported asset histories.",
        tips: [],
      },
      {
        id: "tc-role-4",
        category: "role-specific",
        question: "How do you handle a client who doesn't want to report their true income?",
        answer:
          "I would explain the legal risks, administrative penalties, and interest on late payments. As a consultant, I'm obligated to help clients comply, not evade. I'd offer legal ways to reduce the tax burden (incentives, proper structures) so they don't need to hide income. If a client insists, I can't continue the engagement.",
        tips: ["This is an integrity test - answer firmly and professionally"],
      },
    ],
  },

  /* ═══════════════════════════ IT & MANUFACTURING ══════════════════ */
  {
    id: "it-support",
    title: "IT Support / IT Technician",
    categorySlug: "technology",
    icon: "computer",
    questions: [
      ...hrQuestionsEn,
      {
        id: "it-role-1",
        category: "role-specific",
        question: "Walk me through your steps when a user reports a computer that won't turn on.",
        answer:
          "1) Check the power cable and power source. 2) Check the LED indicators on the CPU and monitor. 3) Try restarting. 4) If still off, check internal hardware (power supply, cable connections). 5) Document and report findings. Always start with the simplest possible cause.",
        tips: ["Systematic approach - start with the most likely and easiest causes"],
      },
      {
        id: "it-role-2",
        category: "role-specific",
        question: "What do you know about computer networks (LAN, WAN, TCP/IP)?",
        answer:
          "LAN (Local Area Network): a network in a limited area like an office. WAN (Wide Area Network): a wide network across cities/countries; the internet is the largest WAN. TCP/IP is the main communication protocol of the internet. I'm familiar with IP addressing, subnet masks, gateways, DNS, and basic network troubleshooting using ping/tracert.",
        tips: [],
      },
      {
        id: "it-role-3",
        category: "role-specific",
        question: "How do you handle installing new software and hardware?",
        answer:
          "1) Verify compatibility with existing systems. 2) Back up important data before installing. 3) Follow standard installation procedures. 4) Test after installation. 5) Document the configuration for future reference. 6) Give the user a brief orientation if needed.",
        tips: [],
      },
      {
        id: "it-role-4",
        category: "role-specific",
        question: "What do you do if the server or office network suddenly goes down?",
        answer:
          "1) Stay calm and identify the scope of the problem. 2) Check physical items: power, cables, LED indicators. 3) Check system logs for errors. 4) Isolate the cause: hardware, software, or network. 5) Restart components if needed. 6) Communicate status to users and management. 7) Document the incident and solution.",
        tips: ["Top priority: restore service as fast as possible, then investigate the root cause"],
      },
      {
        id: "it-role-5",
        category: "role-specific",
        question: "Are you familiar with Windows Server or Linux operating systems?",
        answer:
          "I'm familiar with Windows Server for domain administration, Active Directory, and Group Policy. For Linux, I can use basic command line, file management, user management, and package installation. I've also set up web servers on Ubuntu.",
        tips: ["Mention the Linux distributions you know: Ubuntu, CentOS, or Debian"],
      },
      {
        id: "it-role-6",
        category: "role-specific",
        question: "How do you ensure data and system security in a company?",
        answer:
          "1) Updated antivirus and firewalls. 2) Strong password policies with regular changes. 3) Routine data backups (3-2-1 rule). 4) Access restrictions based on role. 5) Timely patches and security updates. 6) User education about phishing and security awareness.",
        tips: [],
      },
    ],
  },
  {
    id: "industrial-engineer",
    title: "Industrial Engineer",
    categorySlug: "manufacturing",
    icon: "settings_suggest",
    questions: [
      ...hrQuestionsEn,
      {
        id: "ie-role-1",
        category: "role-specific",
        question: "What do you know about Industrial Engineering?",
        answer:
          "Industrial Engineering focuses on optimizing systems, processes, and resources. It covers designing, improving, and installing integrated systems of people, materials, equipment, energy, and information. The goal is improving efficiency, productivity, and quality.",
        tips: ["Emphasize the systems approach - IE isn't just about efficiency, but holistic optimization"],
      },
      {
        id: "ie-role-2",
        category: "role-specific",
        question: "What are time study and motion study?",
        answer:
          "Time study is the technique of measuring the time required to complete a task to set standard work times. Motion study analyzes work movements to identify and eliminate unnecessary motions. Both are used to improve work efficiency and productivity.",
        tips: ["Mention tools: stopwatches, cameras, software like ProPlanner or Arena"],
      },
      {
        id: "ie-role-3",
        category: "role-specific",
        question: "What is line balancing and why is it important in production?",
        answer:
          "Line balancing is distributing workload across each workstation in a production line so no station is idle or overloaded. The goal is minimizing bottlenecks, reducing cycle time, and improving line efficiency. Key metrics: Balance Delay and Smoothness Index.",
        tips: [],
      },
      {
        id: "ie-role-4",
        category: "role-specific",
        question: "What is a factory layout and what are its types?",
        answer:
          "Factory layout is the physical arrangement of production facilities. Types: (1) Product Layout - based on product process order, suits mass production. (2) Process Layout - based on machine function, suits job shops. (3) Fixed Position Layout - the product stays still, workers move. (4) Cellular Layout - machine groups for specific product families.",
        tips: ["Give industry examples suited to each layout type"],
      },
      {
        id: "ie-role-5",
        category: "role-specific",
        question: "What is Overall Equipment Effectiveness (OEE)?",
        answer:
          "OEE is a metric that measures how effectively equipment is used. Formula: OEE = Availability × Performance × Quality. Availability measures downtime, Performance measures production speed, Quality measures defective products. OEE above 85% is considered world class.",
        tips: [],
      },
      {
        id: "ie-role-6",
        category: "role-specific",
        question: "Tell me about your experience with tools like AutoCAD, Arena, or Minitab.",
        answer:
          "I'm familiar with AutoCAD for factory layouts, Arena/R simulation for production system modeling, and Minitab for statistical analysis and DOE (Design of Experiment). I can also use Excel for data analysis and forecasting.",
        tips: ["Match this to the software you genuinely master"],
      },
    ],
  },
  {
    id: "qa-qc",
    title: "QA / QC",
    categorySlug: "manufacturing",
    icon: "fact_check",
    questions: [
      ...hrQuestionsEn,
      {
        id: "qc-role-1",
        category: "role-specific",
        question: "What is the difference between Quality Assurance (QA) and Quality Control (QC)?",
        answer:
          "QA (Quality Assurance) is proactive - it focuses on preventing defects by improving processes. QC (Quality Control) is reactive - it focuses on detecting defects through product inspection. QA: 'We do the process right.' QC: 'Is the produced product right?' The two complement each other.",
        tips: ["A classic question - make sure you can explain the difference with concrete examples"],
      },
      {
        id: "qc-role-2",
        category: "role-specific",
        question: "What are the 7 Quality Control Tools?",
        answer:
          "1) Check Sheet - data collection. 2) Histogram - data distribution. 3) Pareto Chart - problem prioritization. 4) Cause-and-Effect Diagram (Fishbone) - root causes. 5) Scatter Diagram - variable relationships. 6) Control Chart - process stability. 7) Flow Chart - process flow.",
        tips: ["Memorize the 7 tools - this is a mandatory question in manufacturing"],
      },
      {
        id: "qc-role-3",
        category: "role-specific",
        question: "What is ISO 9001 and why is it important?",
        answer:
          "ISO 9001 is the international standard for Quality Management Systems. It matters because: it ensures quality consistency, increases customer satisfaction, eases access to global markets, and is a requirement for many tenders. Core principles: process approach, continuous improvement, and customer focus.",
        tips: [],
      },
      {
        id: "qc-role-4",
        category: "role-specific",
        question: "What is a sampling plan and when is it used?",
        answer:
          "A sampling plan is a method of taking samples for product inspection, used when 100% inspection isn't feasible (high cost, large volume, or destructive testing). Common standards: ANSI/ASQ Z1.4 or MIL-STD-1916. Parameters: lot size, sample size, acceptance number (Ac), rejection number (Re).",
        tips: [],
      },
      {
        id: "qc-role-5",
        category: "role-specific",
        question: "What is PDCA (Plan-Do-Check-Act)?",
        answer:
          "PDCA is the continuous improvement cycle developed by Deming. Plan: identify the problem and plan the solution. Do: implement the solution on a small scale. Check: evaluate implementation results. Act: if successful, standardize it; if not, iterate with a new plan.",
        tips: ["PDCA is the foundation of continuous improvement - everyone in manufacturing should understand it"],
      },
      {
        id: "qc-role-6",
        category: "role-specific",
        question: "How do you handle defective products when found?",
        answer:
          "1) Immediately mark and separate the defective products (hold/quarantine). 2) Document the defect type, quantity, and location. 3) Investigate the cause using a fishbone diagram or 5 Whys. 4) Report to relevant departments (production, engineering). 5) Implement corrective action. 6) Monitor the effectiveness of the fix.",
        tips: [],
      },
    ],
  },
  {
    id: "hse",
    title: "HSE / SHE / K3",
    categorySlug: "manufacturing",
    icon: "health_and_safety",
    questions: [
      ...hrQuestionsEn,
      {
        id: "hse-role-1",
        category: "role-specific",
        question: "What do you know about OHS (Occupational Health and Safety)?",
        answer:
          "OHS is the field focused on protecting workers from the risk of workplace accidents and occupational illnesses. It covers hazard identification, risk assessment, risk control, and evaluation. The goal is creating a safe, healthy, and productive workplace per Law No. 1 of 1970.",
        tips: [],
      },
      {
        id: "hse-role-2",
        category: "role-specific",
        question: "What is the risk control hierarchy?",
        answer:
          "The hierarchy from most to least effective: (1) Elimination - remove the hazard. (2) Substitution - replace with something safer. (3) Engineering Controls - isolation, ventilation, guarding. (4) Administrative Controls - SOPs, training, job rotation. (5) PPE - masks, helmets, safety shoes. Don't rely only on PPE.",
        tips: ["Remember the order: elimination is best, PPE is the last resort"],
      },
      {
        id: "hse-role-3",
        category: "role-specific",
        question: "What is HIRADC?",
        answer:
          "HIRADC (Hazard Identification, Risk Assessment, and Determining Control) is the systematic process of identifying hazards, assessing risk, and determining the necessary controls. It's usually documented as a risk matrix with likelihood × severity to determine the risk rating.",
        tips: ["This is a core OHS document - you must understand how to fill it in"],
      },
      {
        id: "hse-role-4",
        category: "role-specific",
        question: "What do you do if a workplace accident occurs?",
        answer:
          "1) Prioritize first aid for the victim. 2) Secure the accident scene. 3) Report to the supervisor / OHS team. 4) Investigate the accident (5 Whys, fishbone). 5) Write an accident report (Jamsostek/internal format). 6) Recommend corrective actions. 7) Share lessons with all workers to prevent recurrence.",
        tips: ["Golden hour: the first 24 hours are critical for accident reporting"],
      },
      {
        id: "hse-role-5",
        category: "role-specific",
        question: "What do you know about SMK3?",
        answer:
          "SMK3 (Occupational Health and Safety Management System) is an integrated OHS management system regulated by Government Regulation No. 50 of 2012. It covers policy, planning, implementation, monitoring, and management review. Companies with 100+ employees or high-risk operations are required to implement it.",
        tips: [],
      },
      {
        id: "hse-role-6",
        category: "role-specific",
        question: "What KPIs are commonly used in an HSE department?",
        answer:
          "1) Zero Accident - days without an accident. 2) Lost Time Injury Frequency (LTIF). 3) Near Miss Reporting Rate. 4) Safety Training Completion. 5) Audit Score / SMK3 Compliance. 6) Hazard Reporting Rate. Most importantly: leading indicators (near misses, training) matter more than lagging indicators (accidents).",
        tips: [],
      },
    ],
  },
  {
    id: "research-development",
    title: "R&D / Research & Development",
    categorySlug: "manufacturing",
    icon: "science",
    questions: [
      ...hrQuestionsEn,
      {
        id: "rd-role-1",
        category: "role-specific",
        question: "What do you know about the R&D function in a manufacturing company?",
        answer:
          "R&D is responsible for new product development, improving existing products, formula optimization, and process innovation. It covers: literature review, experiments, formulation, trials, scale-up from lab to production, and documenting findings. R&D is the bridge between market research and the finished product.",
        tips: [],
      },
      {
        id: "rd-role-2",
        category: "role-specific",
        question: "Describe the new product development process from idea to launch.",
        answer:
          "1) Ideation - market research, consumer needs. 2) Screening - select feasible ideas. 3) Concept & Design - product specifications. 4) Prototype / Lab Trial - initial samples. 5) Testing - stability tests, shelf life, sensory. 6) Scale-Up - pilot production trials. 7) Production Trial - mass production testing. 8) Launch.",
        tips: [],
      },
      {
        id: "rd-role-3",
        category: "role-specific",
        question: "What is product formulation and what factors must be considered?",
        answer:
          "Formulation is designing the composition of raw materials to produce a product with specific characteristics. Factors: ingredient function, concentration, ingredient compatibility, stability, shelf life, production cost, regulatory compliance (BPOM, SNI), and production scale.",
        tips: [],
      },
      {
        id: "rd-role-4",
        category: "role-specific",
        question: "What is production scale-up and what are its challenges?",
        answer:
          "Scale-up is translating a lab formula into industrial-scale production. Challenges: different mixing dynamics, heat transfer, different process times, availability of bulk raw materials, and quality consistency. Solution: staged trials (lab → pilot → mass), documenting process parameters (CPP), and QC at every stage.",
        tips: ["Scale-up challenges are a leading cause of new product failure"],
      },
      {
        id: "rd-role-5",
        category: "role-specific",
        question: "How do you make sure R&D products comply with regulations?",
        answer:
          "1) Identify applicable regulations (BPOM, SNI, halal, ISO). 2) Run lab tests to standard. 3) Prepare registration documents (composition, specifications, test results). 4) Coordinate with regulatory affairs/legal. 5) Do internal audits before submitting to regulators. 6) Keep up with regulation updates.",
        tips: [],
      },
      {
        id: "rd-role-6",
        category: "role-specific",
        question: "Tell me about the most challenging R&D project you've worked on.",
        answer:
          "Example: I developed a new [product type] that needed reformulation because imported raw materials were hard to source. Challenge: finding an equivalent local substitute within 2 months. Solution: screened 10 alternative suppliers, ran 15 formulation trials, and accelerated stability testing using the ASLT method.",
        tips: ["Use the STAR method: Situation, Task, Action, Result"],
      },
    ],
  },
  {
    id: "project-engineer",
    title: "Project Engineer",
    categorySlug: "manufacturing",
    icon: "engineering",
    questions: [
      ...hrQuestionsEn,
      {
        id: "pe-role-1",
        category: "role-specific",
        question: "What is the role of a Project Engineer in a construction/manufacturing project?",
        answer:
          "A Project Engineer is responsible for the technical aspects of a project: making sure the design meets specifications, supervising field execution, coordinating with contractors/vendors, quality-controlling the work, documenting the project (as-built drawings, progress reports), and solving technical problems on site.",
        tips: [],
      },
      {
        id: "pe-role-2",
        category: "role-specific",
        question: "Describe the stages of an engineering project from start to finish.",
        answer:
          "1) Feasibility Study. 2) Basic Engineering - conceptual design. 3) Detail Engineering - detailed drawings, technical specifications. 4) Procurement - materials and services. 5) Construction / Fabrication - field execution. 6) Commissioning - system testing. 7) Handover - handoff to operations.",
        tips: ["Good FEP (Front End Planning) determines 80% of project success"],
      },
      {
        id: "pe-role-3",
        category: "role-specific",
        question: "How do you make sure a project finishes on time and within budget?",
        answer:
          "1) Build a detailed Work Breakdown Structure (WBS). 2) Create a schedule (Gantt Chart, CPM) with realistic timelines. 3) Track progress regularly (S-curve). 4) Identify risks early and mitigate. 5) Hold regular coordination meetings with the team. 6) Strict change management (change orders). 7) Daily/weekly progress reports.",
        tips: ["Mention tools: MS Project, Primavera, or Excel for scheduling"],
      },
      {
        id: "pe-role-4",
        category: "role-specific",
        question: "What do you do if there's a design change mid-project?",
        answer:
          "1) Evaluate the change's impact on cost, schedule, and quality. 2) Document the change through a Change Order Request. 3) Discuss with stakeholders and get approval. 4) Update related documents (drawings, specifications, schedule). 5) Communicate the change to the field team. 6) Monitor the implementation of the change.",
        tips: [],
      },
      {
        id: "pe-role-5",
        category: "role-specific",
        question: "Can you read technical drawings (blueprints)?",
        answer:
          "Yes, I can read technical drawings including: floor plans, sections, elevations, details, piping & instrumentation diagrams (P&ID), electrical single-line diagrams, and shop drawings. I'm also familiar with drawing standards like ISO and ANSI.",
        tips: ["Mention software you master: AutoCAD, SolidWorks, or Revit"],
      },
      {
        id: "pe-role-6",
        category: "role-specific",
        question: "How do you handle conflict between contractors and project owners?",
        answer:
          "1) Listen to both sides objectively. 2) Refer to the agreed contract and specifications. 3) Find a win-win solution that doesn't sacrifice quality. 4) Document written agreements. 5) If deadlocked, escalate to management with complete supporting data.",
        tips: [],
      },
    ],
  },
  {
    id: "foreman-produksi",
    title: "Foreman / Production Supervisor",
    categorySlug: "manufacturing",
    icon: "supervisor_account",
    questions: [
      ...hrQuestionsEn,
      {
        id: "fp-role-1",
        category: "role-specific",
        question: "What are the main duties of a Foreman / Production Supervisor?",
        answer:
          "Supervising and coordinating production operator activities on the line/shift. Duties: ensuring production targets are met, maintaining product quality, managing operator attendance and rotation, ensuring OHS is applied, reporting production results, and resolving day-to-day operational issues.",
        tips: [],
      },
      {
        id: "fp-role-2",
        category: "role-specific",
        question: "How do you motivate an operator team to hit targets?",
        answer:
          "1) Communicate targets clearly - give the 'why', not just the 'what'. 2) Appreciate achievements. 3) Involve operators in problem-solving. 4) Make sure working conditions are comfortable and safe. 5) Lead by example. 6) Hold healthy competitions between shifts/lines.",
        tips: ["Motivated operators are more productive - show that you care"],
      },
      {
        id: "fp-role-3",
        category: "role-specific",
        question: "What do you do when the daily production target isn't met?",
        answer:
          "1) Find the cause: machine problems, materials, manpower, or methods? 2) Calculate lost time and downtime. 3) Prioritize solutions that can be done immediately. 4) Communicate with superiors and relevant teams. 5) Make a catch-up plan if possible. 6) Document for evaluation in the next shift.",
        tips: [],
      },
      {
        id: "fp-role-4",
        category: "role-specific",
        question: "How do you handle operators who are often late or undisciplined?",
        answer:
          "1) Talk privately, ask about the obstacles. 2) Explain the importance of discipline and its impact on the team. 3) Give a verbal warning first, then a written one if it recurs. 4) Involve HR if needed. 5) Give them a chance to improve. I believe a personal approach is more effective than punishing immediately.",
        tips: [],
      },
      {
        id: "fp-role-5",
        category: "role-specific",
        question: "What do you know about 5S in the workplace?",
        answer:
          "5S is a workplace organization method: Seiri (Sort) - separate what's needed from what isn't. Seiton (Set in order) - arrange items in their place. Seiso (Shine) - clean the work area. Seiketsu (Standardize) - standardize practices. Shitsuke (Sustain) - make it a culture. 5S is the foundation for quality, safety, and productivity.",
        tips: ["5S must become a habit, not just a one-time project"],
      },
      {
        id: "fp-role-6",
        category: "role-specific",
        question: "How do you ensure product quality on your production line?",
        answer:
          "1) Make sure operators understand quality standards and SOPs. 2) Do first-piece inspections. 3) Monitor inline quality checks regularly. 4) Handle deviations immediately (stop the line if needed). 5) Involve QC for sample inspections. 6) Record and analyze defects for continuous improvement.",
        tips: [],
      },
    ],
  },
  {
    id: "mechanical-engineer",
    title: "Mechanical Engineer",
    categorySlug: "manufacturing",
    icon: "settings",
    questions: [
      ...hrQuestionsEn,
      {
        id: "me-role-1",
        category: "role-specific",
        question: "Describe your experience designing or maintaining mechanical systems.",
        answer:
          "Focus on: 1) Project scope (what machines, which industry). 2) Stages: needs analysis, design (CAD - SolidWorks/AutoCAD), calculations (material strength, loads), fabrication, installation, commissioning. 3) For maintenance: preventive and predictive maintenance, failure analysis (RCA). 4) Measurable results: reduced downtime, cost savings, extended machine life.",
        tips: ["Use concrete numbers: downtime down X%, bearing life up Y months"],
        followUp: "Which CAD/CAE software are you most proficient in?",
      },
      {
        id: "me-role-2",
        category: "role-specific",
        question: "How do you analyze the root cause of a machine failure?",
        answer:
          "1) Collect data: symptoms, maintenance history, operating conditions. 2) Physically inspect the failed components. 3) Use methods: 5 Whys, Fishbone (Ishikawa), or FMEA to trace the root cause. 4) Distinguish direct causes from contributing factors. 5) Develop recommendations: design fixes, procedure changes, or maintenance schedules. 6) Monitor results after the fix.",
        tips: ["Give a real case study you've handled"],
      },
      {
        id: "me-role-3",
        category: "role-specific",
        question: "What do you know about preventive and predictive maintenance?",
        answer:
          "Preventive maintenance: scheduled maintenance based on time intervals or operating hours (e.g., oil change every 500 hours) to prevent failure. Predictive maintenance: real-time condition monitoring (vibration analysis, thermography, oil analysis) to predict when a component will fail, so maintenance happens at the right time - more efficient and reduces unscheduled downtime.",
        tips: [],
        followUp: "When is predictive maintenance more appropriate than preventive?",
      },
    ],
  },
];
