# WeChat Mini Program Strategy: Growth OS v0.1 MVP

## Purpose

If Growth OS v0.1 is piloted as a WeChat Mini Program, WeChat should be treated as a channel and family-context surface, not as a reason to expand product scope. The selected WeChat capabilities must strengthen the validation loop:

> friction -> child-specific suggestion -> accepted action -> completed companionship -> lightweight record -> return -> payment-intent signal

Page-level Mini Program UI and interaction rules are defined in `wechat-mini-program-design-spec.md`.

## Product Fit

WeChat Mini Program is a strong fit for v0.1 because parents already use WeChat for:

- Family communication
- Parent groups
- Interest-class groups
- Content discovery from official accounts and video accounts
- Lightweight service interactions
- Sharing links and mini-program cards

Growth OS should use this ecosystem to reduce entry friction, invite the second parent, trigger warm reminders, and run private beta operations.

## Selected P0 Capabilities

### WeChat Entry and Identity

Use WeChat entry to reduce login friction for private beta parents.

Requirements:

- Parent can enter the Mini Program from a shared card, group link, mini-program code, or private beta invitation.
- Parent identity can be bound to the Growth OS parent account.
- WeChat identity must not replace family membership checks.

### Family Invite Share Card

Use WeChat sharing for father/mother invitation.

Flow:

1. First parent creates child profile.
2. First parent shares an invite card to the second parent.
3. Second parent opens the card and joins the same family workspace.
4. Second parent lands on their role-aware today's companionship suggestion.

Rules:

- Invite cards must not expose sensitive child records.
- Invite acceptance must not create duplicate family or child profiles.
- Invite links should expire or be revocable.

### High-Intent Scenario Share Cards

Use WeChat share cards for high-pain entry points.

Recommended card themes:

- "孩子不想练琴，今晚怎么办？"
- "今晚只有 30 分钟，怎么高质量陪伴？"
- "最近阅读断了，怎么轻轻开始？"
- "英语启蒙不知道怎么做，今晚先做什么？"

Rules:

- Cards should open directly into first-guidance or AI coach entry.
- Cards should not require a marketing landing page before first value.
- Cards should avoid public child performance claims.

### Subscription Messages for Warm Reminders

Use opt-in subscription messages only for low-pressure companionship prompts.

Allowed reminder types:

- Evening companionship prompt
- Weekend planning prompt
- Accepted suggestion follow-up
- Weekly reset prompt

Rules:

- Parent must explicitly opt in.
- Message copy must invite companionship, not imply failure.
- Reminder success is measured by downstream action, not open rate alone.

## Selected P1 Capabilities

### WeChat Groups and Private Communities

Use existing parent groups as private beta recruitment channels.

Best-fit groups:

- Piano or interest-practice groups
- Reading habit groups
- English exposure groups
- Parent communities for 4-7 year-old children
- Founder-led private beta groups

### Official Account and Video Account Content Funnel

Use content to attract high-pain parents, but send them directly to an actionable Mini Program card.

Content themes:

- "孩子不想练琴，先别急着吼"
- "阅读断了，不用补任务"
- "今晚 30 分钟陪伴怎么做"
- "英语启蒙别先买课，先做亲子输入"

### WeChat Customer Service or Enterprise WeChat for Private Beta Ops

Use WeChat customer-service tools or Enterprise WeChat to operate the 30-family private beta and collect qualitative feedback.

Allowed:

- Collect private beta feedback
- Route selected questions to asynchronous expert review
- Coordinate expert-reviewed label tests
- Follow up on payment-intent interviews

Not allowed:

- 24/7 real-time expert support
- Medical, psychological, abuse, or safety intervention
- Teacher sales, class scheduling, or offline-service marketplace workflows

### Private Growth Record Share Card

Use share cards only for private family connection, not public social growth display.

Rules:

- Default sharing target is the other parent.
- Public preview should be minimal and privacy-safe.
- Photos/videos should not be publicly exposed through share cards by default.
- Shared records must not become rankings, streaks, or performance showcases.

### Mini-Program Code for Offline and Community Entry

Use mini-program codes for:

- Private beta onboarding
- Expert livestream or parent workshop follow-up
- Reading, piano, English, or outdoor-community entry

The code should open a high-intent question flow, not a generic homepage.

## P2 or Not Yet

Defer these until the investment validation scorecard passes:

- WeChat Pay subscription or payment collection
- Location-based weekend activity recommendations
- WeChat Sports or device-data integration
- Public growth-record sharing
- Parent group leaderboards
- Social feed or public community
- Expert marketplace or paid expert consultation
- Course purchase, teacher sales, or interest-class marketplace

## Metrics

WeChat-specific validation events:

- Mini Program entry opened
- Scenario share card opened
- Family invite card shared
- Family invite accepted
- Subscription message opted in
- Subscription message opened
- Reminder downstream action completed
- Private beta service contact started
- Growth record share card created
- Mini-program code scanned

These metrics should map back to the investment validation scorecard. WeChat distribution is only valuable if it increases first guidance completion, suggestion acceptance, companionship action, organic or reminder-driven return, trust, or payment intent.

## Product Constraint

WeChat is a distribution and engagement layer. It must not turn Growth OS into:

- A social-sharing product
- A parent-group ranking tool
- A training-institution lead-generation tool
- A public child-performance display
- A heavy expert-consulting service
