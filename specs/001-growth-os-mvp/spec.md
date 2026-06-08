# Feature Specification: Growth OS v0.1 MVP

**Feature Branch**: `001-growth-os-mvp`  
**Created**: 2026-06-05  
**Status**: Draft  
**Input**: User description: "Growth OS v0.1 MVP with core modules for child profile, annual goals, weekly plan, father and mother tasks, interest participation records, growth archive, and AI growth coach."

## MVP Scope

Growth OS v0.1 MVP includes these core modules:

- Child profile
- Annual goals
- Weekly plan
- Father and mother tasks
- Interest participation records
- Growth archive
- AI growth coach

v0.1 validation additions:

- Optional warm companionship reminders for private beta engagement validation
- Human parenting expert quality review for AI answer calibration
- Limited asynchronous expert Q&A experiment for private beta trust validation

v0.1 must not become a real-time expert consulting marketplace or a pressure-based reminder system.

## Product Positioning

Growth OS is a long-term family companionship system for parents across a child's growth stages. The long-term product can support early childhood companionship, school-age companionship, and adolescent companionship. Growth OS v0.1 uses families with children aged 3-8 as the first beachhead because this stage has strong parent involvement, frequent companionship decisions, and concrete daily routines around reading, movement, expression, and early interests.

The primary user is a parent who wants concrete guidance for companionship, not a child using a learning app.

Long-term stage strategy:

- Early childhood companionship: roughly ages 3-8, focused on routines, reading, physical activity, emotional expression, interests, family relationship, and school readiness
- School-age companionship: roughly ages 9-12, focused on autonomy, study habits, friendships, interests, responsibility, and parent-child communication
- Adolescent companionship: roughly ages 13-18, focused on identity, emotional resilience, long-term goals, family trust, peer relationships, and parent support without over-control

v0.1 scope:

- Start with early childhood companionship for ages 3-8.
- Keep the product language broad enough for future school-age and adolescent companionship.
- Do not build school-age or adolescent-specific workflows in v0.1.
- Do not broaden scope beyond the v0.1 beachhead until the private beta launch gates show the first Aha loop is working.

Market-facing positioning:

- External product message should lead with "AI family companionship coach" or "today's companionship suggestion"; "Growth OS" remains the long-term system name.
- Avoid leading cold-start messaging with "family growth management system" or "OS", because that frames the product as heavy before users experience the Aha moment.
- The first market promise is: "Tell us a little about your child and today's challenge; get one practical companionship action for tonight."

Core target families:

- Parents in high-engagement households who are willing to accompany the child but lack a weekly structure
- Families with 1-3 active growth directions such as reading, English exposure, piano, swimming, outdoor activity, or emotional expression
- Parents who want to avoid both "training institution" pressure and fully unstructured parenting

Core product promise:

- A parent opens Growth OS and knows what to do with the child today within 30 seconds.

Aha moment definition:

- The parent feels "this understands my child" because the suggestion references the child's age, current challenge, selected focus direction, and at least one child trait or recent context.
- The parent receives a suggestion that can be tried today without buying materials, changing schedule, or reading long theory.
- The parent sees a path to save the suggestion into this week's plan or turn the result into a growth record.

North star metric:

- Percentage of families that complete at least one high-quality family companionship action per week.

A high-quality family companionship action means:

- A parent and child intentionally participate together, not only the child completing a task alone
- The action is age-appropriate for the current child stage; v0.1 guidance is optimized for the 3-8 beachhead
- The action connects to a current focus direction, annual goal, weekly theme, or real family relationship need
- The action produces a concrete moment such as a completed weekly task, interest participation record, growth record, or accepted AI suggestion
- The product describes the action in supportive language rather than as a pass/fail performance score

Supporting product metrics:

- First useful guidance generated within 3 minutes of first use
- AI suggestion adoption rate
- Warm reminder opt-in and downstream action rate
- Weekly plan confirmation rate
- Growth record creation rate
- Next-week return rate
- Expert-reviewed AI answer pass rate
- Parent-reported anxiety reduction after using the product

Private beta launch gates:

- At least 60% of invited parents complete first guidance
- At least 40% accept or save a suggestion
- At least 25% complete one companionship action within 7 days
- At least 35% of activated families enable at least one warm reminder type during reminder validation
- At least 80% of reviewed AI outputs pass the child-specific quality bar
- Parent feedback indicates the product feels supportive rather than pressure-inducing

Investor-risk response:

- v0.1 must prove a narrow repeated loop before claiming the broader Growth OS opportunity: parent friction, child-specific AI suggestion, accepted action, completed companionship, lightweight record, and next-week return.
- If the first Aha loop does not show repeated use, the product should not expand into reports, multi-child workflows, adolescent support, marketplace recommendations, or broader family management.
- The practical wedge is "today's companionship decision", not annual planning, weekly completion, or growth archiving by themselves.
- The product must be meaningfully better than a generic AI chat by using persistent child context, saving accepted suggestions, inserting actions into plans, and turning completed actions into growth record drafts.
- Warm reminders address return-frequency risk, but their success is measured by downstream companionship actions rather than notification opens alone.
- Human expert involvement addresses trust risk by calibrating AI quality and testing limited asynchronous Q&A, not by turning the product into a heavy real-time consulting service.

Default first-use focus directions:

- Reading habit
- English exposure
- Physical activity
- Outdoor exploration
- Music or piano interest
- Swimming or sports
- Emotional expression
- Family relationship
- School readiness

Default first-use current challenges:

- Child does not want to practice piano or another interest
- Reading has been hard to maintain
- English exposure feels unclear
- Parent only has 30 minutes tonight
- Need a weekend activity idea
- Child has been emotionally sensitive recently
- Recent physical activity has decreased
- Parent wants to understand recent growth

Default child trait options:

- Active
- Sensitive
- Slow to warm up
- Likes praise
- Likes competition
- Strong-willed
- Easily frustrated
- Curious
- Prefers routines

## Product Design Constraints

- The home dashboard's primary question is "How should I accompany my child today?"
- AI coach must be reachable from the dashboard and bottom navigation.
- AI coach should be treated as the primary market-facing feature; weekly plans, records, and participation history support the coach rather than competing with it in first-use hierarchy.
- Every AI coach answer must include at least one concrete action for today or this week when the topic allows it.
- AI coach answers should follow a consistent quality pattern: child-specific context, likely interpretation, concrete action, gentle fallback, and evidence boundary when data is limited.
- Progress language must be supportive and non-punitive; avoid failure framing, rankings, streak pressure, and red warning-heavy states.
- Weekly completion rate is a secondary operational signal, not the main emotional center of the experience.
- Weekly plans should act as a support layer for today's companionship guidance rather than a project-management experience parents must maintain.
- The user-facing label for interest history should emphasize participation or practice records, not course administration.
- Growth records should be created as a low-friction byproduct of real activity whenever possible, such as after task completion, accepted AI suggestions, or short parent notes.
- Notifications must be opt-in, low-pressure, and tied to natural companionship moments such as evenings, weekends, accepted suggestion follow-up, and weekly reset.
- Notifications must avoid missed-task warnings, streak pressure, red-alert completion drops, comparative child performance messages, or wording that implies parent failure.
- Human expert Q&A in v0.1, if tested, must be limited, asynchronous, and clearly bounded away from medical, mental health, abuse, or safety intervention.

## Clarifications

### Session 2026-06-05

- Q: In v0.1, can father and mother see and manage all family data including AI conversations? -> A: Father and mother can view and manage all child growth data, AI conversations, and insights.
- Q: What is the v0.1 scope of interest participation records? -> A: Record only actual classes or practices that already happened.
- Q: How should the AI coach handle medical, mental health crisis, or personal safety questions? -> A: Provide general companionship guidance and direct parents to professional or emergency help for risk scenarios.
- Q: When the AI coach generates a weekly plan, does it become the official plan automatically? -> A: AI generates a draft, and a parent must confirm before it becomes the official weekly plan.
- Q: Are standalone monthly and annual growth reports part of v0.1? -> A: No standalone report module in v0.1; AI coach can generate on-demand growth analysis.
- Q: How are the two parent accounts created for a family in v0.1? -> A: The first parent creates the family and child profile, then invites the second parent to join with a father or mother role.
- Q: Can AI analyze photos or videos attached to growth records in v0.1? -> A: AI uses only text, date, tags, and parent notes; photos and videos are stored and displayed only.
- Q: How is weekly task completion calculated in v0.1? -> A: Each task has a planned count and completed count; weekly completion is total completed count divided by total planned count.
- Q: Can parents delete growth records, interest participation records, and AI conversations in v0.1? -> A: Parents can delete them with a 30-day restore window.
- Q: What time window should AI coach context use for recent plans, interest participation, and growth records? -> A: Use the most recent 4 weeks of weekly plans and the most recent 90 days of interest participation and growth records.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get Today's Companionship Guidance (Priority: P1)

A first parent enters only the minimum child context needed and receives an immediately usable suggestion for how to accompany the child today.

**Why this priority**: The fastest path to product value is answering "What should I do with my child today?" before asking the parent to complete a full planning system.

**Independent Test**: A tester can start from an empty account, enter nickname, birth date, 2-3 focus directions, one current challenge, and 1-3 child traits, then receive today's companionship suggestion within 3 minutes.

**Acceptance Scenarios**:

1. **Given** a new parent has no existing family workspace, **When** they enter the child's nickname, birth date, 2-3 focus directions, one current challenge, and 1-3 child traits, **Then** the system generates a today's companionship suggestion without requiring complete annual goals first.
2. **Given** today's companionship suggestion is generated, **When** the parent reviews it, **Then** the suggestion references the child's age, current challenge, selected focus direction, and at least one child trait.
3. **Given** today's companionship suggestion is generated, **When** the parent opens the home dashboard, **Then** the suggestion is the most prominent action on the page.
4. **Given** the parent likes the suggestion, **When** they accept it, **Then** the system can add it to this week's plan or keep it as an accepted AI suggestion for later record creation.
5. **Given** the parent wants to continue setup, **When** they proceed after the first suggestion, **Then** the system lets them complete interests, annual goals, and second-parent invitation.

---

### User Story 2 - Configure a Child Growth System (Priority: P1)

A first parent creates the family's full growth system by completing the child's basic profile, selecting interests, setting annual growth goals, inviting the second parent, and receiving an initial annual plan, monthly themes, and current-week tasks.

**Why this priority**: Without initial configuration, the product cannot produce meaningful guidance or daily companionship actions.

**Independent Test**: A tester can complete full onboarding for one child and verify that the resulting dashboard contains annual goals, a current weekly theme, supportive progress signal, and today's tasks.

**Acceptance Scenarios**:

1. **Given** a new family with no child profile, **When** the first parent enters the child's name, nickname, birth date, gender, interests, and annual goals, **Then** the system creates one family workspace, one child profile, and a complete initial growth system.
2. **Given** a parent has not completed all required child profile fields, **When** they attempt to generate the growth system, **Then** the system identifies the missing fields and prevents generation until required information is complete.
3. **Given** a parent selects interests including "Other", **When** they provide a custom interest, **Then** the system includes that interest when generating plans and recommendations.
4. **Given** the first parent has created the family workspace, **When** they invite the second parent and assign a father or mother role, **Then** the second parent can join the same family workspace without creating a duplicate family or child profile.

---

### User Story 3 - See Today's Parent Guidance (Priority: P1)

Father and mother open the home dashboard to understand today's most important companionship action without needing to design a plan themselves.

**Why this priority**: The core promise is helping parents answer "How should I accompany my child today?"

**Independent Test**: A tester can open the dashboard after onboarding and verify that the most prominent section answers "how should I accompany my child today?", with annual goals, weekly theme, supportive progress signal, and father, mother, and family tasks available.

**Acceptance Scenarios**:

1. **Given** a generated weekly plan exists, **When** either parent opens the dashboard, **Then** the system shows today's recommended companionship action first, plus annual goal cards, the current weekly theme, supportive weekly progress, and today's tasks grouped by father, mother, and family.
2. **Given** there are no tasks due today, **When** a parent opens the dashboard, **Then** the system shows a calm empty state and the next relevant weekly actions.
3. **Given** a task status changes, **When** the dashboard is refreshed or revisited, **Then** the weekly completion rate reflects the updated status.

---

### User Story 4 - Manage the Weekly Growth Plan (Priority: P1)

Parents view and update the current weekly plan, including father tasks, mother tasks, child tasks, weekend activity, reading recommendation, and English recommendation.

**Why this priority**: Weekly planning is the bridge between long-term goals and daily companionship.

**Independent Test**: A tester can view the weekly plan, mark task progress, and verify that progress is reflected in task status and overall completion.

**Acceptance Scenarios**:

1. **Given** a weekly plan exists, **When** a parent opens the weekly plan page, **Then** the system shows the weekly theme and task tables for father, mother, and child with task name, required count, and completion status.
2. **Given** a parent completes part of a repeated task, **When** they update progress, **Then** the task displays planned count, completed count, and remaining count accurately.
3. **Given** last week's completion data and annual goals are available, **When** a new weekly plan is generated, **Then** the system produces a theme, role-based tasks, weekend activity, reading recommendation, and English recommendation appropriate to the child's age and current stage.

---

### User Story 5 - Ask the AI Growth Coach (Priority: P1)

Parents use the AI coach to ask parenting questions, generate activities, analyze recent growth, and create weekly plans based on the child's real growth data.

**Why this priority**: The AI coach is part of the MVP promise and must behave like a family growth coach, not a generic chatbot.

**Independent Test**: A tester can open the AI coach tab, choose a quick question or enter a free-form question, and verify that the answer references the child's profile, goals, recent plans, class records, or growth records when relevant.

**Acceptance Scenarios**:

1. **Given** child profile, annual goals, recent weekly plans, interest participation records, and growth records exist, **When** a parent asks "What should we do if the child does not want to practice piano?", **Then** the coach analyzes likely causes using the most recent 4 weeks of weekly plans and the most recent 90 days of interest participation and growth records, then suggests concrete next actions.
2. **Given** a parent says they only have 30 minutes tonight, **When** they ask for a parent-child activity, **Then** the coach returns an activity name, needed materials, activity steps, growth purpose, and a concrete action for today suited to the child's age and goals.
3. **Given** at least one month of growth data exists, **When** a parent asks about recent growth, **Then** the coach summarizes physical development, reading habits, English exposure, piano interest, and emotional expression using available evidence.
4. **Given** annual goals and recent completion data exist, **When** a parent asks the coach to generate this week's plan, **Then** the coach returns a weekly plan draft with theme, father tasks, mother tasks, child tasks, reading recommendation, English recommendation, and weekend activity.
5. **Given** the AI coach has generated a weekly plan draft, **When** a parent confirms the draft, **Then** the system creates or replaces the official weekly plan; if the parent does not confirm, the official plan remains unchanged.
6. **Given** an AI coach suggestion leads to a completed activity, **When** a parent chooses to record it, **Then** the system generates an editable growth record draft using the activity and parent note.

---

### User Story 6 - Record Interest Participation (Priority: P2)

Parents record and review the child's actual interest participation and practice activity so Growth OS can understand real patterns and use them in weekly planning, growth records, and AI coaching.

**Why this priority**: Interest cultivation is a core v0.1 module, and class history is important context for understanding whether an interest is stable, overloaded, or declining.

**Independent Test**: A tester can create an interest participation record, view it later, and verify that it is available as context for AI coach answers and weekly planning.

**Acceptance Scenarios**:

1. **Given** a child has selected interests, **When** a parent adds a class or practice record that already happened, **Then** the system saves the interest, date, participation outcome, duration or count, and optional notes.
2. **Given** multiple class records exist for an interest, **When** a parent reviews that interest, **Then** the system shows recent participation history in chronological order.
3. **Given** interest participation data exists, **When** the system generates weekly plans or AI coach answers, **Then** it can use recent class participation as context.

---

### User Story 7 - Record Growth Moments (Priority: P2)

Parents capture meaningful growth moments with date, text, tags, notes, photos, and videos so the child's long-term growth trajectory is preserved.

**Why this priority**: Growth records are the most important long-term module and provide source material for AI growth analyses and insights.

**Independent Test**: A tester can create growth records with text and media, then verify that the records appear correctly on the timeline.

**Acceptance Scenarios**:

1. **Given** a parent wants to record a milestone, **When** they add a date, text, tags, notes, and optional photo or video, **Then** the system saves the growth record and associates it with the child.
2. **Given** multiple records exist across different dates, **When** a parent opens the growth timeline, **Then** records are ordered by date and can be reviewed in month and year views.
3. **Given** a record contains media, **When** a parent opens that record, **Then** the system displays the text and available photos or videos together.
4. **Given** a growth record includes photos or videos, **When** AI coach context is assembled, **Then** the AI uses only the record's text, date, tags, and parent notes, not the media contents.
5. **Given** a parent has completed a weekly task or accepted AI suggestion, **When** they choose to record the moment, **Then** the system offers an editable growth record draft instead of requiring the parent to start from a blank form.

---

### User Story 8 - Receive Warm Reminders and Trust-Calibrated Guidance (Priority: P2)

Parents can opt into gentle reminders that bring them back to real companionship moments, while the product team can review AI answer quality with human parenting experts during private beta.

**Why this priority**: Reminders address return-frequency risk, and expert review addresses AI trust risk without making reminders or expert consultation the core product.

**Independent Test**: A tester can enable and disable reminder types, verify reminder-related product events can be measured, and verify that expert review or expert Q&A is clearly labeled as bounded companionship guidance rather than medical, psychological, or crisis support.

**Acceptance Scenarios**:

1. **Given** a parent is in settings, **When** they enable warm reminders, **Then** they can choose from evening companionship, weekend planning, accepted suggestion follow-up, and weekly reset reminder types.
2. **Given** warm reminders are enabled, **When** a reminder is shown or opened, **Then** the system can record whether it led to AI suggestion generation, suggestion acceptance, completed companionship action, or growth record draft creation.
3. **Given** a parent disables a reminder type, **When** the next reminder window arrives, **Then** that disabled reminder type is not sent.
4. **Given** the product team reviews AI output quality with a parenting expert, **When** the expert completes review, **Then** the review uses the AI quality bar and safety boundary rather than subjective approval alone.
5. **Given** limited expert Q&A is tested in private beta, **When** a parent asks an expert question, **Then** the answer is asynchronous, clearly bounded, and does not promise diagnosis, crisis handling, or guaranteed real-time support.

---

### Edge Cases

- If the child is too young for a selected goal, the system should generate age-appropriate actions rather than reject the goal.
- If a parent does not complete tasks for a week, the next plan should adapt gently without shaming language or punitive scoring.
- If media upload fails or is unavailable, the parent should still be able to save the text portion of a growth record.
- If both parents update the same task near the same time, the final task progress should remain internally consistent and completed count should not exceed planned count.
- If the annual goal list is empty during onboarding, the system should require at least one goal before generating the growth system.
- If historical records are sparse, AI growth analysis should explain what can be summarized and avoid inventing unsupported milestones.
- If the AI coach lacks enough relevant data, it should clearly state the evidence gap and still provide age-appropriate, low-risk suggestions.
- If a parent asks a broad parenting theory question, the AI coach should redirect the answer toward the child's profile, goals, and recent family context.
- If a generated activity requires unavailable materials, the AI coach should provide a simple alternative.
- If an interest activity is cancelled, missed, or rescheduled, parents should record the actual outcome after it happens without turning v0.1 into a future scheduling workflow.
- If a parent asks about medical treatment, mental health crisis, self-harm, abuse, or immediate personal safety risk, the AI coach should avoid diagnosis or crisis handling and direct the parent to appropriate professional or emergency support.
- If a parent deletes a growth record, interest participation record, or AI conversation by mistake, they should be able to restore it within 30 days.
- If a record or conversation is deleted but still within the restore window, the AI coach should exclude it from future context unless it is restored.
- If a reminder is triggered after a parent has disabled that reminder type, the reminder should be suppressed.
- If a reminder would frame a missed task as failure, the system should use a neutral companionship invitation or skip the reminder.
- If an expert Q&A question asks for diagnosis, crisis handling, abuse response, or immediate safety intervention, the response should follow the same professional-support boundary as the AI coach.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support exactly one family workspace containing exactly one child profile for the MVP.
- **FR-002**: The system MUST support two parent accounts with distinct father and mother roles, and both roles MUST be able to view and manage all child growth data, AI conversations, and insights in v0.1.
- **FR-003**: The child MUST NOT need an independent account.
- **FR-004**: The system MUST allow the first parent to create the family workspace and invite the second parent to join the same family with a father or mother role.
- **FR-005**: The system MUST prevent the second parent invitation flow from creating a duplicate family workspace or duplicate child profile.
- **FR-006**: The system MUST allow a parent to create and edit the child profile with name, nickname, birth date, and gender.
- **FR-007**: The system MUST allow parents to select multiple child interests from piano, swimming, football, basketball, reading, drawing, building blocks, English, and custom interests.
- **FR-008**: The system MUST allow parents to create and edit annual growth goals.
- **FR-009**: The system MUST generate an initial annual plan, monthly themes, and current-week tasks from the child profile, interests, and annual goals.
- **FR-010**: The system MUST show annual goals on the dashboard as separate status cards.
- **FR-011**: The system MUST show the current weekly theme on the dashboard.
- **FR-012**: The system MUST calculate and display the current weekly completion rate as total completed count divided by total planned count across all weekly tasks.
- **FR-013**: The system MUST show today's tasks grouped into father tasks, mother tasks, and family tasks.
- **FR-014**: The system MUST provide a weekly plan page showing the weekly theme and separate task tables for father, mother, and child.
- **FR-015**: Each weekly task MUST include a task name, planned count, completed count, remaining count, and current completion status.
- **FR-016**: Parents MUST be able to update completed count for weekly tasks, and completed count MUST NOT exceed planned count.
- **FR-017**: The system MUST generate weekly plans using child age, current stage, annual goals, and prior-week completion.
- **FR-018**: A generated weekly plan MUST include weekly theme, father tasks, mother tasks, child tasks, weekend activity, reading recommendation, and English recommendation.
- **FR-019**: The system MUST allow parents to create growth records with date, text, tags, notes, and optional photos or videos.
- **FR-020**: The system MUST display growth records in a chronological timeline.
- **FR-021**: The timeline MUST support month view and year view.
- **FR-022**: The system MUST use warm, non-anxious language that emphasizes companionship, long-term growth, and family relationship quality.
- **FR-023**: The system MUST avoid presenting child growth as academic competition, training-institution progress, or high-pressure scorekeeping.
- **FR-024**: The system MUST provide bottom navigation with Home, Weekly Plan, Growth Archive, AI Coach, and Profile destinations.
- **FR-025**: The system MUST provide an AI coach home screen with quick question buttons for piano resistance, reading habit, English exposure, recent growth, and weekend activity suggestions.
- **FR-026**: The system MUST provide a free-form AI coach question input with a clear parenting-question prompt.
- **FR-027**: Every AI coach answer MUST be grounded in the available child profile, annual goals, recent weekly plans, interest participation records, growth record text, growth record dates, growth record tags, parent notes, and historical growth data.
- **FR-028**: AI coach context MUST include child age, gender, interests, annual goals, the most recent four weeks of weekly plan data, and the most recent 90 days of interest participation records and growth records when available.
- **FR-029**: The AI coach MUST support parenting question answering with analysis of likely causes and practical next actions.
- **FR-030**: The AI coach MUST support parent-child activity generation with activity name, needed materials, activity steps, and growth purpose.
- **FR-031**: The AI coach MUST support on-demand recent growth analysis covering physical development, reading habits, English exposure, piano interest, and emotional expression when relevant data exists.
- **FR-032**: The AI coach MUST support weekly plan draft generation using annual goals and recent completion data.
- **FR-033**: AI coach weekly plan draft output MUST include weekly theme, father tasks, mother tasks, child tasks, reading recommendation, English recommendation, and weekend activity.
- **FR-034**: AI-generated weekly plan drafts MUST require parent confirmation before creating or replacing the official weekly plan.
- **FR-035**: AI coach answers MUST prioritize concrete, executable advice connected to growth goals.
- **FR-036**: AI coach answers MUST avoid generic parenting theory, long lectures, and suggestions that do not fit the child's age.
- **FR-037**: The system MUST keep a history of AI coach conversations including family, parent role, parent message, coach response, and creation time.
- **FR-038**: The system MUST support AI-generated growth insights with child, insight type, title, content, and creation time.
- **FR-039**: Parents MUST be able to create, edit, and review records for interest participation or practices that already happened for the child's selected or custom interests.
- **FR-040**: Each interest participation record MUST include interest, date, participation outcome, duration or count, and optional notes.
- **FR-041**: Interest participation records MUST be available as context for weekly plan generation, growth analysis, and AI coach answers.
- **FR-042**: The AI coach MUST provide only general companionship guidance for medical, mental health, or safety-adjacent questions and MUST direct parents to professional or emergency support for medical treatment, mental health crisis, self-harm, abuse, or immediate personal safety risk.
- **FR-043**: The AI coach MUST NOT analyze photo or video content from growth records in v0.1; attached media is stored and displayed only.
- **FR-044**: The MVP MUST NOT include standalone monthly report pages, standalone annual report pages, report export, AI analysis of photo or video content, medical diagnosis, mental health crisis intervention, future course scheduling, recurring class rules, leave requests, make-up class management, high-pressure AI proactive risk reminders, multiple children, multiple families, commercialization, social features, real-time expert consulting marketplace, or child-owned accounts.
- **FR-045**: Parents MUST be able to delete and restore growth records, interest participation records, and AI coach conversations within a 30-day restore window.
- **FR-046**: Deleted growth records, interest participation records, and AI coach conversations MUST be excluded from AI coach context unless restored.
- **FR-047**: The system MUST support a lightweight first-use flow that generates today's companionship suggestion from child nickname, birth date, 2-3 focus directions, one current challenge, and 1-3 child traits before full annual goal setup.
- **FR-048**: The dashboard MUST make today's recommended companionship action more visually prominent than weekly completion rate.
- **FR-049**: The dashboard MUST provide a direct AI coach entry for asking "What should I do with my child today?" or an equivalent context-aware prompt.
- **FR-050**: AI coach responses MUST include at least one concrete today-or-this-week action when the parent's question allows actionable guidance.
- **FR-051**: System copy and progress states MUST avoid ranking, streak pressure, punitive failure wording, and high-pressure academic framing.
- **FR-052**: The product MUST use user-facing language such as "interest participation" or "practice records" for interest history; "class management" MUST be treated as an internal planning term only.
- **FR-053**: The system MUST allow measurement of first guidance generation, AI suggestion adoption, weekly plan confirmation, high-quality companionship action completion, growth record creation, next-week return, and parent-reported anxiety reduction.
- **FR-054**: First-use focus directions MUST include reading habit, English exposure, physical activity, outdoor exploration, music or piano interest, swimming or sports, emotional expression, family relationship, and school readiness.
- **FR-055**: AI coach responses MUST follow a reviewable quality pattern: child-specific context, likely interpretation, concrete action, gentle fallback, and evidence boundary when data is limited.
- **FR-056**: First-use current challenge options MUST include interest resistance, reading difficulty, unclear English exposure, limited time tonight, weekend activity need, recent emotional sensitivity, decreased physical activity, and recent growth review.
- **FR-057**: First-use child trait options MUST include active, sensitive, slow to warm up, likes praise, likes competition, strong-willed, easily frustrated, curious, and prefers routines.
- **FR-058**: Today's companionship suggestions MUST reference child age, current challenge, selected focus direction, and at least one child trait when provided.
- **FR-059**: Parents MUST be able to accept an AI suggestion and add it to the current weekly plan when it is action-oriented.
- **FR-060**: The system MUST offer editable growth record drafts after completed weekly tasks, accepted AI suggestions, or short parent notes.
- **FR-061**: Market-facing and first-use copy MUST present the product as an AI family companionship coach or today's companionship suggestion before presenting it as an operating system.
- **FR-062**: The system MUST allow product review to distinguish the repeated Aha loop stages: first guidance generated, suggestion accepted or saved, companionship action completed, growth record draft created, and next-week return.
- **FR-063**: The product MUST NOT make weekly completion rate, annual planning, or growth archive browsing the primary first-use success state before today's companionship suggestion has been generated.
- **FR-064**: The system MUST allow parents to opt into and opt out of warm reminder types for evening companionship, weekend planning, accepted suggestion follow-up, and weekly reset.
- **FR-065**: Warm reminder copy MUST invite companionship and MUST NOT use missed-task warnings, streak pressure, red-alert completion drops, comparative child performance messages, or parent-failure wording.
- **FR-066**: The system MUST allow product review to measure reminder opt-in, reminder open, AI suggestion generation after reminder, suggestion acceptance after reminder, companionship action completion after reminder, and growth record draft creation after reminder.
- **FR-067**: The product MUST support expert quality review of sampled AI answers against the AI quality bar and safety boundary during private beta.
- **FR-068**: Limited expert Q&A, if tested in private beta, MUST be asynchronous, bounded, and clearly separated from medical, psychological, abuse, or immediate safety intervention.

### Key Entities

- **Family**: The single family workspace for the MVP; is created by the first parent, accepts the invited second parent, and connects father account, mother account, child profile, plans, tasks, records, AI conversations, and insights.
- **Parent Account**: A father or mother role that can create or join the family workspace, configure the growth system, view plans, update tasks, create records, and review AI growth analyses.
- **Child Profile**: The growth subject; includes name, nickname, birth date, gender, interests, and current developmental context.
- **Interest**: A selected or custom area used to personalize goals, plans, recommendations, AI analyses, and insights.
- **Annual Goal**: A long-term growth direction such as swimming, piano interest, English exposure, reading habit, or school readiness.
- **Monthly Theme**: A theme derived from annual goals that guides weekly planning within a month.
- **Weekly Plan**: A role-based plan for the current week, including theme, tasks, weekend activity, and recommendations.
- **Task**: A planned action assigned to father, mother, child, or family with a planned count, completed count, remaining count, and completion status.
- **Growth Record**: A dated record of a meaningful growth moment; includes text, tags, parent notes, optional photos or videos, and deletion or restore state. AI context uses text, dates, tags, and notes only.
- **Interest Participation Record**: A dated record for a class or practice that already happened for activities such as piano, swimming, English, or other interests; includes interest, participation outcome, duration or count, optional notes, deletion or restore state, and evidence for planning and coaching.
- **AI Coach Conversation**: A parent question and coach response associated with family, parent role, creation time, and deletion or restore state.
- **AI Growth Insight**: A generated observation about the child's growth pattern, such as stable piano practice or reduced reading activity, with type, title, content, and creation time.
- **Warm Reminder Preference**: A parent-controlled setting for reminder categories such as evening companionship, weekend planning, accepted suggestion follow-up, and weekly reset.
- **Expert Quality Review**: A private beta review of sampled AI answers by a parenting expert against the product's quality and safety standards.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new parent can complete first-time configuration and reach a populated dashboard in under 8 minutes.
- **SC-002**: At least 90% of generated weekly plans include all required sections: weekly theme, father tasks, mother tasks, child tasks, weekend activity, reading recommendation, and English recommendation.
- **SC-003**: Parents can identify today's father, mother, and family tasks from the dashboard in under 10 seconds.
- **SC-004**: Weekly completion rate updates accurately after completed count changes in at least 99% of normal usage attempts.
- **SC-005**: Parents can create a text-only growth record in under 60 seconds and a record with media in under 3 minutes, excluding time spent selecting media.
- **SC-006**: Timeline month and year views correctly display all records for the selected period during acceptance testing.
- **SC-007**: In usability review, parents describe the product tone as supportive and non-anxious in at least 80% of feedback sessions.
- **SC-008**: Parents can reach the AI coach from bottom navigation in one tap from the main app shell.
- **SC-009**: At least 90% of AI coach answers in acceptance testing reference at least one relevant child-specific context item when such data exists.
- **SC-010**: At least 90% of AI coach parenting answers include concrete next actions rather than only general explanation.
- **SC-011**: Activity generation responses include activity name, needed materials, activity steps, and growth purpose in at least 95% of acceptance tests.
- **SC-012**: On-demand AI growth analysis responses cover all requested growth dimensions for which source data exists and explicitly identify dimensions with insufficient evidence.
- **SC-013**: AI weekly plan draft generation includes all required sections in at least 95% of acceptance tests.
- **SC-014**: AI-generated weekly plan drafts do not create or replace the official weekly plan until a parent confirms them in 100% of acceptance tests.
- **SC-015**: In review of sample AI coach responses, no accepted response should include age-inappropriate or high-pressure advice.
- **SC-016**: Parents can create an actual interest participation or practice record in under 60 seconds during acceptance testing.
- **SC-017**: Interest participation records from the most recent 90 days are included in weekly planning or AI coach context in at least 90% of relevant acceptance tests.
- **SC-018**: In safety-boundary acceptance tests, AI coach responses to medical treatment, mental health crisis, self-harm, abuse, or immediate personal safety risk prompts direct parents to professional or emergency support and do not provide diagnosis or crisis handling.
- **SC-019**: AI coach context assembly excludes photo and video content in 100% of acceptance tests while still preserving media for timeline display.
- **SC-020**: The MVP can be accepted without any standalone monthly or annual report module, report export, AI media analysis, medical diagnosis, mental health crisis intervention, high-pressure AI proactive risk reminder, multi-child, social, commercial workflow, or real-time expert consulting marketplace.
- **SC-021**: Deleted growth records, interest participation records, and AI coach conversations can be restored within 30 days and are excluded from AI coach context while deleted in 100% of acceptance tests.
- **SC-022**: A new parent can receive the first today's companionship suggestion within 3 minutes after entering child nickname, birth date, 2-3 focus directions, one current challenge, and 1-3 child traits.
- **SC-023**: Parents can identify the primary answer to "how should I accompany my child today?" within 10 seconds on the dashboard.
- **SC-024**: At least 90% of AI coach responses in acceptance tests include one concrete today-or-this-week action when the prompt is actionable.
- **SC-025**: In usability review, parents describe progress language as supportive rather than pressure-inducing in at least 80% of sessions.
- **SC-026**: At least 40% of weekly active families complete one high-quality family companionship action per week during the initial private MVP pilot.
- **SC-027**: At least 90% of reviewed AI coach responses follow the quality pattern of child-specific context, likely interpretation, concrete action, gentle fallback, and evidence boundary when data is limited.
- **SC-028**: Product metric review can report first guidance generation, AI suggestion adoption, weekly plan confirmation, high-quality companionship action completion, growth record creation, next-week return, and parent anxiety pulse for the private MVP pilot.
- **SC-029**: At least 90% of first-guidance suggestions in acceptance testing reference child age, current challenge, selected focus direction, and at least one child trait.
- **SC-030**: Parents can accept a first-guidance or AI coach suggestion and add it to the current weekly plan in under 30 seconds.
- **SC-031**: Parents can create an editable growth record draft from a completed task, accepted AI suggestion, or short parent note in under 30 seconds.
- **SC-032**: At least 30% of activated families return in the next week with a new question, accepted suggestion, completed action, or growth record during the private MVP pilot.
- **SC-033**: In side-by-side private-beta review, at least 60% of parents prefer the Growth OS answer over a generic AI answer for the same parenting challenge because it is more child-specific, concrete, or lower-conflict.
- **SC-034**: At least 35% of activated families enable at least one warm reminder type during reminder validation.
- **SC-035**: At least 20% of opened warm reminders lead to AI suggestion generation, suggestion acceptance, completed companionship action, or growth record draft creation during private beta validation.
- **SC-036**: At least 80% of parent feedback about reminders describes them as supportive or acceptable rather than intrusive during private beta validation.
- **SC-037**: At least 80% of expert-reviewed AI answer samples pass the child-specific, age-appropriate, concrete-action, gentle-fallback, non-pressure, and safety-boundary quality bar.

## Assumptions

- The MVP serves one private household and is not designed for classrooms, tutors, relatives, or social sharing.
- Growth OS's long-term vision can cover early childhood, school-age, and adolescent companionship; v0.1 is optimized for the 3-8 beachhead.
- Guidance for children outside the v0.1 beachhead should be conservative and age-aware until future versions explicitly expand support.
- The strongest early user segment is high-engagement parents who want structured companionship without training-institution pressure.
- Either parent can view and manage all child growth data, AI conversations, and insights unless a future permission model explicitly separates responsibilities.
- Father and mother role labels are used because they are part of the MVP scope; the product copy should remain respectful and family-centered.
- "Current stage" can be inferred from child age and parent-provided goals unless later refined by a dedicated assessment flow.
- AI growth analyses summarize available records and plan progress; they should not fabricate milestones when source data is missing.
- AI growth analyses use growth record text, dates, tags, and parent notes; photos and videos are displayed in the archive but not analyzed by AI in v0.1.
- Standalone monthly report pages, standalone annual report pages, and report export are outside v0.1 scope.
- The AI coach should use the most relevant available family context by default; parents do not need to manually attach child data to each question.
- AI coach context uses the most recent 4 weeks of weekly plans and the most recent 90 days of interest participation records and growth records by default.
- Optional warm reminders are allowed for private beta engagement validation, but AI-generated risk alerts and high-pressure proactive reminders are later enhancements.
- Human parenting experts can calibrate AI answer quality and participate in limited asynchronous private beta Q&A; real-time expert consulting, guaranteed response times, paid expert services, and professional diagnosis are outside v0.1 scope.
- Interest participation records in v0.1 track actual participation, duration or count, and notes; tuition, billing, teacher communication, future scheduling, recurring class rules, leave requests, and make-up class management are outside MVP scope.
- Deletion in v0.1 means parent-visible removal with a 30-day restore window.
- Investor objections should be treated as validation inputs; expansion is blocked until the first Aha loop is proven with private-beta behavior, not just positive concept feedback.
