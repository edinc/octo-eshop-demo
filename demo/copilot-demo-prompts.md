# GitHub Copilot Demo Prompts (Octo E-Shop)

Use these prompts directly in VS Code Copilot Chat, GitHub, or terminal (for CLI sections) to showcase capabilities on this project.

---

## 0) Quick opener (context setting)

**Prompt:**

> Scan this repository and give me a 60-second architecture briefing: services, shared packages, infra, and deployment flow.

**Why this works:** Shows repo understanding and context awareness immediately.

---

## 1) Plan Agent / Planning Mode

**Prompt A (feature planning):**

> Create an implementation plan for adding a `wishlist-service` to this monorepo. Keep it consistent with existing patterns in `services/*` (Express + TypeScript), include API endpoints, database schema ideas, events, tests, Docker, Helm, and CI updates. Output phased steps with clear acceptance criteria.

**Prompt B (migration planning):**

> Build a phased plan to introduce API gateway rate limiting and request tracing across all backend services. Include risk areas, rollout strategy, and rollback steps.

**Prompt C (execution-ready plan):**

> Turn the wishlist plan into an actionable TODO list with dependencies and the first 3 tasks I should implement now in this repo.

---

## 2) GitHub Agents HQ

Use these in the GitHub web experience / Agents HQ context.

**Prompt A (PR automation):**

> For this repo, propose 3 specialized agents I should configure in Agents HQ: one for Terraform/Azure, one for backend API quality, one for frontend UX consistency. For each, define scope, trigger conditions, and expected outputs.

**Prompt B (multi-agent orchestration):**

> Simulate an Agents HQ workflow for a PR that touches `infrastructure/terraform` and `services/order-service`. Show which agents should run, in what order, and what each should validate.

**Prompt C (policy alignment):**

> Draft branch protection + agent policy recommendations for this repo so that infra changes, security checks, and service contract changes are all enforced before merge.

---

## 3) Copilot Coding Agent

**Prompt A (small implementation):**

> Implement health/readiness endpoints for `services/payment-service` and add unit tests for them, following existing code style and API response format.

**Prompt B (cross-cutting change):**

> Add standardized request ID propagation middleware to all backend services and ensure logs include the request ID. Make minimal, consistent changes only.

**Prompt C (bugfix scenario):**

> Find and fix one realistic input-validation gap in `services/order-service` checkout flow. Add/adjust tests to prove the fix.

---

## 4) Copilot Review Agent

Use after creating a PR.

**Prompt A (full review):**

> Review this PR for correctness, security, and maintainability. Prioritize critical issues first, then medium/low findings. Suggest concrete patch-level fixes.

**Prompt B (targeted review):**

> Focus this review on API contract consistency (`success/data/error/meta` shape), error handling, and TypeScript strictness across touched files.

**Prompt C (infra review):**

> Review Terraform and Kubernetes changes for least-privilege, secret handling, and safe defaults. Flag anything risky for production.

---

## 5) Custom Agents + Skills

This repo ships **3 custom agents** and **2 custom skills** under `.github/`. The demo shows how to invoke each one.

### Custom Agents

#### a) BDD Specialist (`.github/agents/bdd-specialist.agent.md`)

Generates Gherkin feature files, coverage matrices, and Playwright E2E tests.

**Prompt A:**

> @bdd-specialist Create a BDD coverage matrix and Gherkin feature file for the checkout flow in `services/order-service`. Include happy path, edge cases (empty cart, out-of-stock), error scenarios (payment failure), and accessibility checks.

**Prompt B:**

> @bdd-specialist Write Playwright E2E tests for the product catalog search feature, covering search with results, search with no matches, and keyboard-only navigation. Follow the project's existing Playwright config and page-object patterns.

#### b) Azure Terraform Infrastructure Planning (`.github/agents/terraform-azure-planning.agent.md`)

Creates detailed, phased Terraform implementation plans for Azure resources.

**Prompt A:**

> @terraform-azure-planning Create an implementation plan for adding Azure Service Bus to this project for async event-driven communication between order-service and payment-service. Include resource definitions, dependencies, and phased tasks.

**Prompt B:**

> @terraform-azure-planning Plan the Azure infrastructure needed to add Redis Cache (for cart-service session store) with private endpoint connectivity to the existing AKS cluster.

#### c) GitHub Actions Expert (`.github/agents/github-actions-expert.agent.md`)

Designs secure, least-privilege CI/CD workflows with supply-chain hardening.

**Prompt A:**

> @github-actions-expert Review the existing GitHub Actions workflows in this repo and suggest security improvements: action pinning, permissions hardening, OIDC for Azure, and dependency review.

**Prompt B:**

> @github-actions-expert Create a reusable CI workflow for backend services that runs lint, unit tests, and container image build — triggered only when that service's files change. Follow least-privilege permissions and pin all actions.

### Custom Skills

#### d) Excalidraw Diagram Generator (`.github/skills/excalidraw-diagram-generator`)

Generates `.excalidraw` diagram files from natural language.

**Prompt:**

> Create an Excalidraw architecture diagram showing the Octo E-Shop microservices: frontend, user-service, product-service, cart-service, order-service, payment-service, and their communication paths (HTTP sync + Azure Service Bus async).

#### e) Azure Resource Visualizer (`.github/skills/azure-resource-visualizer`)

Analyzes Azure resource groups and produces Mermaid architecture diagrams.

**Prompt:**

> Analyze the Azure resource group for this project and generate a Mermaid architecture diagram showing all resources and their relationships.

---

## 6) Copilot CLI

Run these from terminal to demo chat-driven development in CLI.

**Prompt A (repo tour):**

> Explain this monorepo structure and list the top 5 places I should inspect before implementing a new backend service.

**Prompt B (safe automation):**

> Generate commands to run lint + unit tests only for `services/product-service`, then explain likely failure categories and how to triage quickly.

**Prompt C (change proposal):**

> Propose and apply a minimal change that improves developer experience in this repo (for example scripts, docs, or local workflow). Show the diff and rationale.

---

## 7) GitHub Code Quality

Demo the [GitHub Code Quality](https://docs.github.com/en/code-security/concepts/about-code-quality) product features directly from the GitHub UI and PR workflow.

### a) Enable Code Scanning (CodeQL)

Show how to enable CodeQL on this repo via **Settings → Code security → Code scanning**.

**Demo steps:**

1. Navigate to the repo on GitHub → **Settings** → **Code security and analysis**.
2. Enable **Code scanning** with the default CodeQL setup.
3. Show the auto-generated `codeql.yml` workflow detecting JavaScript/TypeScript.
4. Trigger a scan and walk through the results under **Security → Code scanning alerts**.

### b) Copilot Autofix on Code Scanning Alerts

Show Copilot suggesting fixes for CodeQL findings.

**Demo steps:**

1. Open a code scanning alert from the **Security** tab.
2. Click **Generate fix** (Copilot Autofix) on a finding.
3. Walk through the suggested patch — explain how it addresses the vulnerability.
4. Commit the fix directly or open a PR from the suggestion.

### c) Dependency Review in PRs

Show how dependency changes are flagged automatically.

**Demo steps:**

1. Create a branch and add or bump a dependency in one of the services' `package.json`.
2. Open a PR — show the **Dependency Review** summary that appears.
3. Point out how vulnerable or license-incompatible dependencies are flagged before merge.

### d) Secret Scanning + Push Protection

Show secret scanning catching leaked credentials.

**Demo steps:**

1. Navigate to **Settings → Code security → Secret scanning** — show it's enabled.
2. Show **Push protection** is on (blocks pushes containing detected secrets).
3. Optionally demo by attempting to push a dummy secret pattern and showing the block.

### e) Security Overview Dashboard

Show the org/repo-level security posture.

**Demo steps:**

1. Go to **Security → Overview** at the repo or org level.
2. Walk through the dashboard: open alerts, fixed alerts, coverage.
3. Highlight how code quality findings, dependency alerts, and secret alerts roll up into one view.

### f) Code Scanning in a PR (inline experience)

Show how code quality findings surface directly in the PR diff.

**Demo steps:**

1. Open a PR that triggers a CodeQL finding (e.g., a SQL injection pattern or missing input validation).
2. Show the inline annotation on the PR diff with the finding details.
3. Show Copilot Autofix suggesting a remediation inline.
4. Accept or dismiss the suggestion.

---

## 8) End-to-end “wow” demo sequence (15–20 min)

1. **Plan:**
   - Use Plan prompt 1A for `wishlist-service`.
2. **Code:**
   - Ask Coding Agent to scaffold first slice (routes/controller/service + tests).
3. **Review:**
   - Run Review prompt 4B for API contract + TS strictness.
4. **Custom agents:**
   - Invoke `@bdd-specialist` (prompt 5a-A) to generate a coverage matrix + Gherkin feature.
   - Invoke `@github-actions-expert` (prompt 5c-B) to create a CI workflow for the new service.
5. **Custom skills:**
   - Use the Excalidraw skill (prompt 5d) to generate an architecture diagram.
6. **CLI:**
   - Run CLI prompt 6C to apply a quick DX improvement.
7. **Code Quality:**
   - Walk through CodeQL setup + Copilot Autofix (7a/7b) on a real finding.
   - Show secret scanning push protection (7d) and the Security Overview dashboard (7e).

---

## Presenter notes

- Keep each demo step scoped and visible (small diffs).
- Prefer one backend service (`order-service` or `payment-service`) for consistency.
- Narrate before running prompts: _intent → AI action → validation_.
- If a result is broad, follow up with: **“Make this minimal and repo-specific.”**
