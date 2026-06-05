# Feature Specification: Growth OS MVP

**Feature Branch**: `001-growth-os-mvp`  
**Created**: 2026-06-05  
**Status**: Draft  
**Input**: User description: "AI-driven family growth system for one family, one child, father account, and mother account. Helps parents know how to accompany child growth through annual goals, monthly themes, weekly plans, daily actions, growth records, timelines, AI-generated summaries, and an AI growth coach grounded in the child's real growth profile."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure a Child Growth System (Priority: P1)

A parent creates the family's first growth system by entering the child's basic profile, selecting interests, setting annual growth goals, and receiving an initial annual plan, monthly themes, and current-week tasks.

**Why this priority**: Without initial configuration, the product cannot produce meaningful guidance or daily companionship actions.

**Independent Test**: A tester can start from an empty account, complete onboarding for one child, and verify that the resulting dashboard contains annual goals, a current weekly theme, completion rate, and today's tasks.

**Acceptance Scenarios**:

1. **Given** a new family with no child profile, **When** a parent enters the child's name, nickname, birth date, gender, interests, and annual goals, **Then** the system creates one child profile and generates a complete initial growth system.
2. **Given** a parent has not completed all required child profile fields, **When** they attempt to generate the growth system, **Then** the system identifies the missing fields and prevents generation until required information is complete.
3. **Given** a parent selects interests including "Other", **When** they provide a custom interest, **Then** the system includes that interest when generating plans and recommendations.

---

### User Story 2 - See Today's Parent Guidance (Priority: P1)

Father and mother open the home dashboard to understand today's most important companionship actions without needing to design a plan themselves.

**Why this priority**: The core promise is helping parents answer "How should I accompany my child today?"

**Independent Test**: A tester can open the dashboard after onboarding and verify that annual goals, weekly theme, weekly completion rate, and father, mother, and family tasks are visible and actionable.

**Acceptance Scenarios**:

1. **Given** a generated weekly plan exists, **When** either parent opens the dashboard, **Then** the system shows annual goal cards, the current weekly theme, weekly completion percentage, and today's tasks grouped by father, mother, and family.
2. **Given** there are no tasks due today, **When** a parent opens the dashboard, **Then** the system shows a calm empty state and the next relevant weekly actions.
3. **Given** a task status changes, **When** the dashboard is refreshed or revisited, **Then** the weekly completion rate reflects the updated status.

---

### User Story 3 - Manage the Weekly Growth Plan (Priority: P1)

Parents view and update the current weekly plan, including father tasks, mother tasks, child tasks, weekend activity, reading recommendation, and English recommendation.

**Why this priority**: Weekly planning is the bridge between long-term goals and daily companionship.

**Independent Test**: A tester can view the weekly plan, mark task progress, and verify that progress is reflected in task status and overall completion.

**Acceptance Scenarios**:

1. **Given** a weekly plan exists, **When** a parent opens the weekly plan page, **Then** the system shows the weekly theme and task tables for father, mother, and child with task name, required count, and completion status.
2. **Given** a parent completes part of a repeated task, **When** they update progress, **Then** the task displays completed count and remaining count accurately.
3. **Given** last week's completion data and annual goals are available, **When** a new weekly plan is generated, **Then** the system produces a theme, role-based tasks, weekend activity, reading recommendation, and English recommendation appropriate to the child's age and current stage.

---

### User Story 4 - Ask the AI Growth Coach (Priority: P1)

Parents use the AI coach to ask parenting questions, generate activities, analyze recent growth, and create weekly plans based on the child's real growth data.

**Why this priority**: The AI coach is part of the MVP promise and must behave like a family growth coach, not a generic chatbot.

**Independent Test**: A tester can open the AI coach tab, choose a quick question or enter a free-form question, and verify that the answer references the child's profile, goals, recent plans, class records, or growth records when relevant.

**Acceptance Scenarios**:

1. **Given** child profile, annual goals, recent weekly plans, interest class records, and growth records exist, **When** a parent asks "What should we do if the child does not want to practice piano?", **Then** the coach analyzes likely causes using available history and suggests concrete next actions.
2. **Given** a parent says they only have 30 minutes tonight, **When** they ask for a parent-child activity, **Then** the coach returns an activity name, needed materials, activity steps, and growth purpose suited to the child's age and goals.
3. **Given** at least one month of growth data exists, **When** a parent asks about recent growth, **Then** the coach summarizes physical development, reading habits, English exposure, piano interest, and emotional expression using available evidence.
4. **Given** annual goals and recent completion data exist, **When** a parent asks the coach to generate this week's plan, **Then** the coach returns a weekly theme, father tasks, mother tasks, child tasks, reading recommendation, English recommendation, and weekend activity.

---

### User Story 5 - Record Growth Moments (Priority: P2)

Parents capture meaningful growth moments with date, text, photos, and videos so the child's long-term growth trajectory is preserved.

**Why this priority**: Growth records are the most important long-term module and provide source material for reports.

**Independent Test**: A tester can create growth records with text and media, then verify that the records appear correctly on the timeline.

**Acceptance Scenarios**:

1. **Given** a parent wants to record a milestone, **When** they add a date, text, and optional photo or video, **Then** the system saves the growth record and associates it with the child.
2. **Given** multiple records exist across different dates, **When** a parent opens the growth timeline, **Then** records are ordered by date and can be reviewed in month and year views.
3. **Given** a record contains media, **When** a parent opens that record, **Then** the system displays the text and available photos or videos together.

---

### User Story 6 - Review Monthly and Annual Growth Reports (Priority: P3)

Parents receive monthly and annual summaries that transform accumulated records and plan progress into a warm, non-anxious view of the child's development.

**Why this priority**: Reports reinforce long-termism and help parents reflect without turning the product into a scorekeeping tool.

**Independent Test**: A tester can generate a monthly report from existing records and weekly progress, then verify it covers the required growth dimensions.

**Acceptance Scenarios**:

1. **Given** a month has ended and growth data exists, **When** the monthly report is generated, **Then** it summarizes physical development, reading habits, interest cultivation, English exposure, and emotional development.
2. **Given** a year has ended and records exist, **When** the annual report is generated, **Then** it includes key growth moments, media collections, ability changes, and parent messages.
3. **Given** an annual report exists, **When** a parent chooses to export it, **Then** the system provides a shareable document preserving report content and selected media references.

### Edge Cases

- If the child is too young for a selected goal, the system should generate age-appropriate actions rather than reject the goal.
- If a parent does not complete tasks for a week, the next plan should adapt gently without shaming language or punitive scoring.
- If media upload fails or is unavailable, the parent should still be able to save the text portion of a growth record.
- If both parents update the same task near the same time, the final task progress should remain internally consistent and not exceed the planned count.
- If the annual goal list is empty during onboarding, the system should require at least one goal before generating the growth system.
- If historical records are sparse, reports should explain what can be summarized and avoid inventing unsupported milestones.
- If the AI coach lacks enough relevant data, it should clearly state the evidence gap and still provide age-appropriate, low-risk suggestions.
- If a parent asks a broad parenting theory question, the AI coach should redirect the answer toward the child's profile, goals, and recent family context.
- If a generated activity requires unavailable materials, the AI coach should provide a simple alternative.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support exactly one family workspace containing exactly one child profile for the MVP.
- **FR-002**: The system MUST support two parent accounts with distinct father and mother roles.
- **FR-003**: The child MUST NOT need an independent account.
- **FR-004**: The system MUST allow a parent to create and edit the child profile with name, nickname, birth date, and gender.
- **FR-005**: The system MUST allow parents to select multiple child interests from piano, swimming, football, basketball, reading, drawing, building blocks, English, and custom interests.
- **FR-006**: The system MUST allow parents to create and edit annual growth goals.
- **FR-007**: The system MUST generate an initial annual plan, monthly themes, and current-week tasks from the child profile, interests, and annual goals.
- **FR-008**: The system MUST show annual goals on the dashboard as separate status cards.
- **FR-009**: The system MUST show the current weekly theme on the dashboard.
- **FR-010**: The system MUST calculate and display the current weekly completion rate.
- **FR-011**: The system MUST show today's tasks grouped into father tasks, mother tasks, and family tasks.
- **FR-012**: The system MUST provide a weekly plan page showing the weekly theme and separate task tables for father, mother, and child.
- **FR-013**: Each weekly task MUST include a task name, planned count, and current completion status.
- **FR-014**: Parents MUST be able to update completion progress for weekly tasks.
- **FR-015**: The system MUST generate weekly plans using child age, current stage, annual goals, and prior-week completion.
- **FR-016**: A generated weekly plan MUST include weekly theme, father tasks, mother tasks, child tasks, weekend activity, reading recommendation, and English recommendation.
- **FR-017**: The system MUST allow parents to create growth records with date, text, and optional photos or videos.
- **FR-018**: The system MUST display growth records in a chronological timeline.
- **FR-019**: The timeline MUST support month view and year view.
- **FR-020**: The system MUST generate monthly growth reports covering physical development, reading habits, interest cultivation, English exposure, and emotional development.
- **FR-021**: The system MUST generate annual growth reports covering key growth moments, media collections, ability changes, and parent messages.
- **FR-022**: Parents MUST be able to export annual growth reports as a shareable document.
- **FR-023**: The system MUST use warm, non-anxious language that emphasizes companionship, long-term growth, and family relationship quality.
- **FR-024**: The system MUST avoid presenting child growth as academic competition, training-institution progress, or high-pressure scorekeeping.
- **FR-025**: The system MUST provide bottom navigation with Home, Weekly Plan, Growth Archive, AI Coach, and Profile destinations.
- **FR-026**: The system MUST provide an AI coach home screen with quick question buttons for piano resistance, reading habit, English exposure, recent growth, and weekend activity suggestions.
- **FR-027**: The system MUST provide a free-form AI coach question input with a clear parenting-question prompt.
- **FR-028**: Every AI coach answer MUST be grounded in the available child profile, annual goals, recent weekly plans, interest class records, growth records, and historical growth data.
- **FR-029**: AI coach context MUST include child age, gender, interests, annual goals, the most recent four weeks of weekly plan data, recent interest class records, and recent growth events when available.
- **FR-030**: The AI coach MUST support parenting question answering with analysis of likely causes and practical next actions.
- **FR-031**: The AI coach MUST support parent-child activity generation with activity name, needed materials, activity steps, and growth purpose.
- **FR-032**: The AI coach MUST support recent growth analysis covering physical development, reading habits, English exposure, piano interest, and emotional expression when relevant data exists.
- **FR-033**: The AI coach MUST support weekly plan generation using annual goals and recent completion data.
- **FR-034**: AI coach weekly plan output MUST include weekly theme, father tasks, mother tasks, child tasks, reading recommendation, English recommendation, and weekend activity.
- **FR-035**: AI coach answers MUST prioritize concrete, executable advice connected to growth goals.
- **FR-036**: AI coach answers MUST avoid generic parenting theory, long lectures, and suggestions that do not fit the child's age.
- **FR-037**: The system MUST keep a history of AI coach conversations including family, parent role, parent message, coach response, and creation time.
- **FR-038**: The system MUST support AI-generated growth insights with child, insight type, title, content, and creation time.
- **FR-039**: The MVP MUST NOT include AI proactive reminders, multiple children, multiple families, commercialization, social features, or child-owned accounts.

### Key Entities

- **Family**: The single family workspace for the MVP; connects father account, mother account, child profile, plans, tasks, records, and reports.
- **Parent Account**: A father or mother role that can configure the growth system, view plans, update tasks, create records, and review reports.
- **Child Profile**: The growth subject; includes name, nickname, birth date, gender, interests, and current developmental context.
- **Interest**: A selected or custom area used to personalize goals, plans, recommendations, and reports.
- **Annual Goal**: A long-term growth direction such as swimming, piano interest, English exposure, reading habit, or school readiness.
- **Monthly Theme**: A theme derived from annual goals that guides weekly planning within a month.
- **Weekly Plan**: A role-based plan for the current week, including theme, tasks, weekend activity, and recommendations.
- **Task**: A planned action assigned to father, mother, child, or family with a planned count and completion status.
- **Growth Record**: A dated text, photo, or video record of a meaningful growth moment.
- **Growth Report**: A monthly or annual summary generated from plans, task progress, growth records, and parent input.
- **Interest Class Record**: A recent class or practice record for activities such as piano, swimming, English, or other interests; used as evidence for planning and coaching.
- **AI Coach Conversation**: A parent question and coach response associated with family, parent role, and creation time.
- **AI Growth Insight**: A generated observation about the child's growth pattern, such as stable piano practice or reduced reading activity, with type, title, content, and creation time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new parent can complete first-time configuration and reach a populated dashboard in under 8 minutes.
- **SC-002**: At least 90% of generated weekly plans include all required sections: weekly theme, father tasks, mother tasks, child tasks, weekend activity, reading recommendation, and English recommendation.
- **SC-003**: Parents can identify today's father, mother, and family tasks from the dashboard in under 10 seconds.
- **SC-004**: Weekly completion rate updates accurately after task progress changes in at least 99% of normal usage attempts.
- **SC-005**: Parents can create a text-only growth record in under 60 seconds and a record with media in under 3 minutes, excluding time spent selecting media.
- **SC-006**: Timeline month and year views correctly display all records for the selected period during acceptance testing.
- **SC-007**: Monthly reports cover all five required growth dimensions when sufficient source data exists.
- **SC-008**: Annual report export produces a readable shareable document containing key growth moments, selected media references, ability changes, and parent messages.
- **SC-009**: In usability review, parents describe the product tone as supportive and non-anxious in at least 80% of feedback sessions.
- **SC-010**: Parents can reach the AI coach from bottom navigation in one tap from the main app shell.
- **SC-011**: At least 90% of AI coach answers in acceptance testing reference at least one relevant child-specific context item when such data exists.
- **SC-012**: At least 90% of AI coach parenting answers include concrete next actions rather than only general explanation.
- **SC-013**: Activity generation responses include activity name, needed materials, activity steps, and growth purpose in at least 95% of acceptance tests.
- **SC-014**: Growth analysis responses cover all requested growth dimensions for which source data exists and explicitly identify dimensions with insufficient evidence.
- **SC-015**: AI weekly plan generation includes all required sections in at least 95% of acceptance tests.
- **SC-016**: In review of sample AI coach responses, no accepted response should include age-inappropriate or high-pressure advice.
- **SC-017**: The MVP can be accepted without any AI proactive reminder, multi-child, social, or commercial workflow.

## Assumptions

- The MVP serves one private household and is not designed for classrooms, tutors, relatives, or social sharing.
- Either parent can perform setup and edit core data unless a future permission model explicitly separates responsibilities.
- Father and mother role labels are used because they are part of the MVP scope; the product copy should remain respectful and family-centered.
- "Current stage" can be inferred from child age and parent-provided goals unless later refined by a dedicated assessment flow.
- Reports summarize available records and plan progress; they should not fabricate milestones when source data is missing.
- Annual report export means a parent can obtain a portable, shareable document; exact file format and layout can be decided during planning.
- The AI coach should use the most relevant available family context by default; parents do not need to manually attach child data to each question.
- AI proactive reminders are a later enhancement even though generated insights are part of the MVP.
