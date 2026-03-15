# MASTER_PROJECT.md

## Purpose
This document is the operating constitution for the CreatorOS build. It exists to stop drift, stop fake progress, and force every implementation step to match product reality, admin reality, and public reality.

This is not optional guidance. It is the standard for all future work.

---

## Core Verdict
The current repo is not mainly failing because it lacks features. It is failing because:

- architecture truth is not enforced consistently
- product decisions are not written down in one place
- admin controls and public rendering are out of sync
- schema refactors are incomplete
- pages do not have a single clear role
- features are being called "done" without flow testing
- build errors, logic errors, and UX errors are being treated as separate problems when they are usually connected

The main enemy is **drift**.

---

## Non-Negotiable Definition of Done
A task is **not done** unless all relevant items below are true.

### 1. Code integrity
- the app builds successfully
- no new type errors are introduced
- no broken imports remain
- no dead code is knowingly left behind for the changed feature

### 2. Admin integrity
- the admin can create, edit, save, publish, unpublish, or delete the relevant object where applicable
- the relevant admin control is located in an obvious place
- the setting persists after refresh
- the setting loads correctly when revisiting the page

### 3. Public integrity
- the public user can actually see the result of the admin configuration
- the rendered output matches the configured state
- hidden/unpublished items do not leak publicly
- published items appear where product logic says they should appear

### 4. Interaction integrity
- buttons do something real
- toggles have an immediate visible effect or clearly saved effect
- dropdown selections save correctly
- text inputs do not lose focus during ordinary fast typing
- media inputs actually affect rendered output

### 5. State integrity
- success state works
- empty state works
- error state works
- loading state works
- reload state works

### 6. Regression integrity
- directly connected flows are retested
- no nearby route is silently broken by the change
- no admin/public contradiction remains for the changed area

If these checks are not complete, the task is **in progress**, not complete.

---

## Required Role Simulation
Every meaningful feature must be checked from all relevant roles.

### A. Platform admin
Can create and control system-level settings and entities.

### B. Tenant admin / creator
Can manage storefront content, products, collections, pages, theme, and publishing behavior.

### C. Logged-out visitor
Can browse public pages and see only what is intentionally public.

### D. Customer / enrolled user
Can purchase, access, or consume the relevant purchased content where applicable.

### Required simulation pattern
For each changed feature, simulate:
1. create or configure it as admin
2. save it
3. refresh and verify persistence
4. open the related public page
5. verify visible result
6. test empty state / missing data case
7. test edit or reversal of setting
8. refresh again and verify new state

No feature may be called complete without this loop.

---

## Canonical Product Model
The app must stop mixing old and new concepts. These are the canonical meanings.

### Product
A sellable unit.
- may represent a course offer, digital product, service, or other monetized item
- owns price, checkout logic, sales configuration, and public purchasable identity

### Course
The learning/content structure.
- contains modules and lessons
- may be attached to or represented by a product
- is not automatically the storefront truth unless the model explicitly says so

### Collection
A browse/discovery grouping.
- groups products and/or course-backed offerings for public navigation
- supports one-to-many and many-to-many assignment as appropriate
- is not the same thing as a product

### Sales Page
The marketing presentation layer.
- controls messaging, layout blocks, hero content, proof, CTA, and media
- must map directly to public rendering

### Theme
The presentation system for a tenant/storefront.
- controls colors, tokens, surfaces, typography behavior, and variants
- must be defined as real named variants, not just random editable values

---

## Required Data Truth
The repo must honor one source of truth per concern.

- storefront commerce truth belongs to the product layer
- learning structure truth belongs to the course layer
- browse organization truth belongs to collections
- page block rendering truth belongs to the public page renderer, not just the admin editor
- theme truth belongs to the tokenized theme system, not scattered component overrides

If two layers claim the same responsibility, the conflict must be resolved before more feature work continues in that area.

---

## Information Architecture Decisions
These are binding until explicitly revised.

### 1. Courses menu behavior
The main **Courses** menu should go to a page showing **collections**.
Reason: collections are a better discovery surface than a shallow course list.

### 2. Homepage vs Courses page consistency
If the homepage shows published course-backed products, the Courses menu path must not contradict this by showing only "coming soon" placeholders or hiding real available content.

### 3. Collections-first browsing
Public browsing should be collections-first where that improves discovery.
The app must not imply there are no courses available when real published offerings exist.

### 4. Placeholder rules
"Coming soon" content must never override or obscure real published inventory unless intentionally configured.

### 5. Visibility consistency
Published items must appear on every surface where the business logic says they should appear.
Unpublished items must not appear where they should not.

---

## Relationship Rules
These rules must be implemented clearly.

- each course-backed offering must be assignable to one or more collections
- collection assignment must be editable from an obvious admin control
- the admin must be able to add an item to multiple collections
- the selection must save and reload correctly
- the public collection pages must reflect assignments accurately
- removing an assignment must update public browse surfaces correctly

If current schema or UI prevents this, fix the schema/UI rather than pretending the feature exists.

---

## Admin / Public Parity Rules
No admin control may exist without a real public effect.
No public behavior may exist without an obvious admin control.

### Required parity rules
- if admin can configure a field, public must honor it
- if a field is stored but unused publicly, either wire it up or remove it
- if public output depends on a hidden rule, that rule must have an admin explanation or control
- if a page builder block claims a feature, the public renderer must support it
- no phantom configuration controls
- no decorative toggles with no output path

### Known parity risks already identified
- image-with-text block configuration not rendering publicly
- hero image behavior on sales page not properly wired
- homepage and courses browse logic not aligned
- old course assumptions still leaking into product-driven code paths

---

## Sales Page / Page Builder Contract
The editor and public renderer must be treated as one system.

### Required standards
- every block type must have a clear public render contract
- every editable field must map to public output or be removed
- hero block must support image on/off behavior via explicit toggle
- image with text blocks must visibly render when configured
- preview behavior must accurately reflect public output
- block controls must not lose focus during ordinary typing
- autosave or state updates must not interrupt fast entry
- block ordering must persist after refresh
- deleting, hiding, or toggling blocks must change public output correctly

### Editor UX rules
- typing must not cause cursor disappearance
- no per-keystroke rerender should destroy input focus
- expensive updates should be debounced or isolated
- local form state should be stable during fast editing

---

## Theme System Rules
Theme is not just "change some colors." It must be an actual system.

### Required named theme variants for Perseus
- **Perseus Dark** = default dark variant
- **Perseus Light** = default light variant with same purple family and white/light backgrounds

### Requirements
- both variants must be first-class theme presets
- theme tokens must drive background, text, surfaces, borders, accents, and interactive states
- switching themes must update all intended surfaces consistently
- no hardcoded component colors should override the chosen theme unless intentionally designed
- admin must be able to choose between the available theme variants cleanly
- preview should reflect the selected variant before publishing

---

## Route Ownership Map Requirement
Every major route must have a written purpose. No more ambiguous pages.

For each major route, define:
- who it is for
- what it displays
- which entity is primary
- which states it can show
- which related routes it must stay consistent with

### Minimum routes that require clear ownership
- homepage
- courses browse page
- collection listing page
- collection detail page
- product detail / sales page
- checkout path
- course content access pages
- admin products page
- admin courses page
- admin collections page
- admin page builder / sales page editor
- admin theme settings

If route purpose is unclear, stop and resolve the route purpose before coding more in that area.

---

## Build Error Handling Protocol
Build errors must be handled at the root, not cosmetically.

### Required protocol
1. collect the actual errors
2. group them by root cause
3. identify whether they come from schema drift, type drift, contract mismatch, or missing implementation
4. fix the root cause before patching symptoms
5. rerun the build
6. verify nearby flows impacted by the fix

### Forbidden behavior
- using `any` to silence uncertainty
- suppressing types instead of reconciling model truth
- commenting out working code to fake a clean build
- hiding broken UI instead of fixing the contract

---

## Manual Smoke Test Matrix
This matrix must be used repeatedly.

### Admin content management
- create product
- edit product
- publish product
- unpublish product
- assign to collection(s)
- remove from collection(s)
- create course
- link course-backed offering correctly
- verify item appears where expected

### Public browsing
- homepage shows intended featured/published content
- Courses menu lands on collections page
- collections page shows real available content
- collection detail page shows assigned items
- no contradiction between homepage inventory and browse inventory

### Sales pages / blocks
- add hero content
- tick/untick hero image setting
- verify public hero changes
- add image-with-text block
- verify public render actually changes
- type rapidly in editor fields and verify no cursor loss

### Theme
- switch Perseus Dark / Perseus Light
- verify surfaces, backgrounds, accents, and text across key pages
- verify no unreadable combinations
- verify no stale hardcoded dark styles in light mode

### Customer flow
- browse
- view product/sales page
- purchase or simulate access path
- verify post-purchase access
- verify return visit access logic

### Resilience
- refresh after save
- revisit after navigation
- test empty states
- test item with missing media
- test unpublished item
- test collection with zero items

---

## Acceptance Criteria Format
Every task must be phrased as testable behavior.

Example format:
- admin can assign one product to multiple collections
- selections save successfully
- assignments persist after refresh
- assigned product appears on all selected collection pages
- removing assignment removes product from collection pages after refresh
- homepage visibility follows published state and configured display rules

No vague definitions like "improve" or "support" without explicit behavior.

---

## Priority Ladder
Claude must not burn time on decorative work while foundations are broken.

### P0 — Must be fixed first
- build errors
- schema drift
- product/course/collection contract mismatches
- broken admin/public parity
- broken browse logic
- broken purchase/access/display logic
- broken editor controls that have no public effect

### P1 — Next
- collection assignment UX
- route consistency
- page builder reliability
- sales page hero/image controls
- input focus stability
- public discovery improvements

### P2 — After that
- theme variants
- visual polish
- richer previews
- UX refinement

### P3 — Nice-to-have
- ornamental enhancements
- non-essential admin niceties
- secondary customization options

---

## Feature Intake Rule
Every new request must be classified before implementation.

Label each item as one of:
- bug
- missing implementation
- UX issue
- architecture issue
- product decision
- enhancement

Then identify:
- impacted entities
- impacted routes
- admin impact
- public impact
- required acceptance criteria
- required tests

This prevents Claude from treating architecture changes like tiny UI tweaks.

---

## Stop Conditions
Stop coding and report immediately if any of the following are discovered:

- route purpose is unclear
- two models claim the same job
- schema conflicts with actual app behavior
- admin can configure something public does not honor
- public page displays data with no admin source of truth
- collection/product/course relationships are ambiguous
- more than one plausible implementation exists and they would lead to different IA outcomes
- a requested fix would create a contradiction with the stated product rules

Do not bulldoze forward through ambiguity.

---

## Anti-Patterns (Forbidden)
These patterns are banned.

- adding `any` to get unstuck
- reviving old field assumptions without schema verification
- calling work done without public verification
- patching visible symptoms while root cause remains
- leaving dead admin controls in place
- creating duplicate entities instead of reconciling the model
- changing public IA on one page without updating related pages
- hiding broken functionality instead of fixing it
- shipping a control with no effect
- confusing preview state with saved state
- claiming a feature exists because the admin UI has a checkbox

---

## Required Reporting Format After Each Work Cycle
Every meaningful work cycle must end with a strict report.

### Report format
1. **What changed**
2. **Files touched**
3. **What was verified manually**
4. **What remains broken**
5. **What assumptions were made**
6. **What should be tested next**
7. **What is still ambiguous**

No filler. No motivational language. No fake confidence.

---

## Decision Log
Use this section to record binding product decisions.

### Active decisions
- Courses menu goes to collections page
- public browsing should not hide real published offerings behind empty or coming-soon states
- course-backed offerings must be assignable to one or more collections
- Perseus theme must support both default dark and default light variants
- page-builder settings must have real public rendering parity
- fast typing in editor fields must not lose cursor focus

Future decisions must be appended here with:
- decision
- reason
- impacted routes
- impacted entities
- consequences for testing

---

## Current Known Problems To Fix
This list is not exhaustive, but it is real enough to guide P0/P1 work.

### Structural / codebase problems
- incomplete course-to-product refactor
- stale field assumptions in code paths still using removed course fields
- analytics and imports still carrying old model expectations
- payment contract mismatches
- weak auth safety / hardcoded admin risk
- insufficient test discipline

### Product / logic problems
- homepage and courses browse logic are inconsistent
- collections are not positioned cleanly in the browse IA
- course/collection assignment workflow is not properly implemented

### Editor / UI problems
- sales page input focus loss during fast typing
- hero image toggle behavior insufficient or broken
- image with text block not rendering publicly
- settings that appear to save but do not change visible output

### Testing process problems
- no enforced admin simulation
- no enforced user simulation
- no required regression sweep after local fixes
- no hard rule that public output must be proven

---

## Required Next Working Method
For every feature or fix:
1. inspect schema
2. inspect admin UI
3. inspect public renderer
4. inspect related routes
5. write acceptance criteria
6. implement
7. run build
8. perform admin simulation
9. perform public simulation
10. log remaining ambiguity

If this is not followed, the work is not trustworthy.

---

## Final Standard
The goal is not to produce lots of code.
The goal is to produce a system where:
- architecture is coherent
- admin behavior is truthful
- public behavior is predictable
- product decisions are visible
- features are verified, not imagined

Any future work that does not increase coherence, parity, and verification is suspect.



## Immediate Next Step: P0 Execution Checklist

This is not optional. After reading this document, the next work item must be a **P0 execution checklist tied to actual repo files**. General intentions are not accepted as progress.

The checklist must:
- name the exact file(s) involved
- state the broken behavior
- state the root cause if known
- define the required fix
- define how admin behavior is verified
- define how end-user/public behavior is verified
- define regression checks for connected flows
- remain prioritized in strict P0, P1, P2 order

### Required P0 checklist format
For each item, use this structure:
- **Priority:** P0 / P1 / P2
- **Area:** build / schema / admin / public / editor / payments / auth / theme / collections
- **Files:** exact repo paths
- **Problem:** what is actually broken
- **Required outcome:** what must be true when fixed
- **Verification:** exact admin + public checks
- **Regression checks:** nearby flows that must still work
- **Status:** not started / in progress / blocked / verified

### P0 means
P0 includes only issues that break one or more of these:
- build success
- data integrity
- admin/public parity
- product visibility
- purchase/access flow
- rendering of configured content
- route logic for core storefront discovery

### Examples of the kind of P0 items expected
- stale product/course schema usage tied to exact files
- admin fields that save but do not render publicly
- collection assignment gaps tied to edit forms and public pages
- sales page/editor controls with no public effect
- broken nav logic where available content is hidden behind misleading routes
- auth/payment defects that block real operation

### Rule
Claude must not report “working on collections,” “improving editor,” or similar vague claims.
Claude must report against the checklist using exact files and exact verification steps.
