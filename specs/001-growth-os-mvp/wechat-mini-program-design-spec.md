# WeChat Mini Program Design Specification: Growth OS v0.1

## Purpose

This document defines the page-level design direction for the Growth OS WeChat Mini Program. It translates the v0.1 product specification into a mobile-first, WeChat-native interface standard.

The Mini Program is not a port of the current web test surface. The web surface validates backend, Supabase, AI, and core workflow correctness. The Mini Program should become the primary parent-facing experience for private beta.

## Design Positioning

Growth OS Mini Program is a family companionship coach, not a learning app, punch-card app, course product, or social feed.

Primary parent question:

> 今天我该怎样陪孩子成长？

The interface should make a parent feel:

- calm rather than judged
- guided rather than managed
- close to the child rather than focused on completion rate
- able to do one useful thing today

## Target Surface

Primary device context:

- One-handed phone use
- Fragmented evening and weekend moments
- Parent enters from WeChat chat, share card, subscription message, or Mini Program history
- Parent may have only 1-3 minutes on first open

Design implications:

- Lead with one concrete action, not a dashboard of modules.
- Avoid long forms on first screen.
- Use progressive setup and lightweight cards.
- Make every page useful even with partial data.

## Information Architecture

Bottom tab bar:

| Tab | Label | Primary Job |
| --- | --- | --- |
| Home | 首页 | Know what to do with the child today |
| Week | 周计划 | See and complete this week's companionship tasks |
| Archive | 成长档案 | Record and browse growth moments |
| Coach | AI教练 | Ask child-specific companionship questions |
| Profile | 我的 | Family, child profile, reminders, settings |

Default entry rules:

- New user with no WeChat binding: open WeChat login and lightweight first-guidance flow.
- Logged-in user with no child profile: open progressive child setup.
- Logged-in user with child profile: open Home.
- Scenario share card: open the matching first-guidance or AI Coach prompt.
- Family invite card: open invite acceptance flow first, then Home.
- Subscription reminder: open the relevant task, suggestion, or weekly reset state.

## Visual Direction

Reference feel:

- Apple Health: clean hierarchy, personal data clarity
- Notion: structured, quiet cards
- Headspace: warmth, softness, emotional safety

Avoid:

- training institution colors and sales layouts
- dense admin dashboards
- red warning states for missed tasks
- streak-pressure visuals
- gamified child performance badges
- public social feed patterns

Visual keywords:

- warm
- breathable
- grounded
- family-oriented
- precise
- non-judgmental

## Design Tokens

### Color

Base palette:

| Token | Value | Use |
| --- | --- | --- |
| `page` | `#F8F6F2` | App background |
| `surface` | `#FFFFFF` | Cards and sheets |
| `surface-muted` | `#F1EEE8` | Soft grouped areas |
| `text-primary` | `#25211C` | Main text |
| `text-secondary` | `#6E665C` | Supporting text |
| `text-tertiary` | `#9B9185` | Meta text |
| `border` | `#E7E0D7` | Card borders and dividers |
| `brand` | `#3F8F6B` | Primary action, positive companionship |
| `brand-soft` | `#E4F3EC` | Primary soft background |
| `warm` | `#F4A261` | Warm accents |
| `warm-soft` | `#FFF0DF` | Warm soft background |
| `blue` | `#5D8CCB` | English/world exploration accents |
| `blue-soft` | `#EAF2FF` | Blue soft background |
| `yellow` | `#E9C46A` | Weekend/activity accents |
| `danger` | `#B85C5C` | Critical errors only |

Rules:

- Do not build a one-hue interface.
- Green is for constructive action, not scoring.
- Yellow/orange should feel warm, not salesy.
- Red is only for destructive or safety-relevant states, not incomplete tasks.

### Typography

Use WeChat system fonts.

| Role | Size | Weight | Line Height |
| --- | --- | --- | --- |
| Page title | 24px | 600 | 32px |
| Section title | 18px | 600 | 26px |
| Card title | 16px | 600 | 24px |
| Body | 15px | 400 | 24px |
| Meta | 13px | 400 | 20px |
| Caption | 12px | 400 | 18px |

Rules:

- Avoid oversized hero typography inside operational pages.
- No negative letter spacing.
- Text must wrap naturally on narrow devices.
- Use short, warm Chinese labels.

### Spacing

Base unit: 4px.

Common values:

- Page horizontal padding: 16px
- Section gap: 20px
- Card padding: 16px
- Card internal gap: 12px
- Button height: 44-48px
- Bottom safe area: use `env(safe-area-inset-bottom)`

### Shape and Elevation

- Card radius: 8px
- Button radius: 8px
- Input radius: 8px
- Avoid large rounded pill cards except segmented controls or compact chips.
- Use subtle borders more than shadows.
- Shadow only for bottom sheets and floating action surfaces.

## Navigation Pattern

Bottom tab bar is persistent after login.

Rules:

- Use native Mini Program tab bar if possible.
- Home tab is the default.
- AI Coach is a first-class tab, not buried inside Profile.
- Avoid nested page stacks deeper than 3 levels.

Recommended tab icons:

- 首页: home/heart pulse style
- 周计划: calendar check
- 成长档案: image/list timeline
- AI教练: message circle/spark
- 我的: user/settings

## Core Components

### Today's Companionship Card

Purpose: The main Home surface.

Content:

- child nickname
- today's question or context
- one concrete action
- estimated time
- why it helps
- primary button: "开始陪伴"
- secondary button: "换一个建议" or "加入周计划"

Rules:

- One card, one action.
- No long theory.
- Include time estimate such as "10分钟" or "30分钟".
- If context is weak, state it gently: "先按当前年龄给一个轻量建议".

### Weekly Task Row

Content:

- assignee label: 爸爸 / 妈妈 / 家庭 / 孩子
- task title
- planned and completed count
- status action

Status labels:

- 未开始
- 进行中
- 已完成

Avoid:

- failed
- overdue
- red missed labels

### Warm Progress Indicator

Purpose: Show progress without pressure.

Recommended copy:

- "本周已经完成 3 件陪伴小事"
- "还有 2 个轻量任务，可以慢慢来"

Avoid:

- "完成率不达标"
- "落后"
- "连续打卡失败"

### Growth Record Composer

Entry points:

- Home after action completion
- Week task completion
- Archive tab floating action
- AI accepted suggestion

Fields:

- text note
- date
- optional photos/videos
- optional tags

Primary copy:

- "记下这个成长瞬间"
- "保存到成长档案"

Rules:

- Text note should be enough; media is optional.
- Do not force a polished diary.
- Do not ask the child to produce content.

### AI Coach Prompt Chips

Quick prompts:

- 孩子不想练琴怎么办？
- 今晚只有30分钟
- 如何恢复阅读？
- 英语启蒙怎么开始？
- 最近成长情况如何？
- 本周末适合做什么？

Rules:

- Prompt chips open with child context injected.
- Free input stays visible at bottom.
- AI response must include concrete action and gentle fallback.

### Empty State

Tone:

- supportive, not blank
- suggest one next action

Examples:

- "还没有成长记录。今晚完成一件陪伴小事后，可以顺手记下来。"
- "本周计划还没生成。先回答一个孩子近况问题，我来帮你生成。"

### Error State

Tone:

- factual and repair-oriented

Examples:

- "登录状态已过期，请重新进入小程序。"
- "暂时没有保存成功，请稍后再试。"

Avoid exposing raw API messages to parents except in debug builds.

## Page Specifications

### 1. WeChat Login and First Entry

Goal:

Let a parent enter with WeChat identity and reach a useful suggestion quickly.

Layout:

- Top: product name and short promise
- Main: "先得到今晚能做的一件事"
- WeChat login button
- Privacy note
- Scenario chips if entered from generic source

Primary action:

- "微信一键登录"

Post-login:

- If no child profile: continue to first-guidance setup.
- If child exists: go to Home.

Rules:

- Do not show email/password in Mini Program.
- Do not ask for phone number in v0.1 unless absolutely required.
- Do not request unnecessary WeChat permissions before value.

### 2. Progressive First Setup

Goal:

Collect enough child context to generate first useful guidance without making setup feel heavy.

Step 1: Child basics

- nickname
- birth date
- gender optional or light

Step 2: Current focus

- choose 2-3 focus directions

Step 3: Current challenge

- choose one current challenge

Step 4: Child traits

- choose 1-3 traits

Result page:

- Today's suggestion
- "加入本周计划"
- "继续完善成长系统"

Rules:

- Do not start with annual goals.
- Full annual goals are optional after first useful suggestion.
- Progress indicator should be quiet: "1/4", not gamified.

### 3. Home

Goal:

Answer "today, what should I do?" in under 30 seconds.

Hierarchy:

1. Today's companionship card
2. Current weekly theme
3. Father/mother/family task summary
4. Quick record button
5. Gentle reminder opt-in if relevant

Primary action examples:

- "开始陪伴"
- "完成并记录"
- "问问AI教练"

Secondary modules:

- This week's progress
- Recent growth moment
- Invite second parent if missing

Rules:

- Do not lead with annual goals.
- Completion rate is secondary.
- If no plan exists, show AI generation entry.

### 4. Weekly Plan

Goal:

Show this week's theme and role-aware tasks.

Layout:

- Week theme card
- Father task group
- Mother task group
- Family task group
- Child-light task group, if any
- Weekend activity card
- Reading and English recommendation cards

Task actions:

- +1 completed
- mark completed
- create growth record from task
- ask AI to adjust

Rules:

- Use role labels to reduce ambiguity.
- Do not make child tasks feel like homework.
- Adjusting plan should create a draft or suggestion, not silently overwrite.

### 5. Growth Archive

Goal:

Let parents record and revisit meaningful growth moments.

Default view:

- timeline list by month
- date group
- record card with text, tags, media count

Primary action:

- floating "记录"

Record composer:

- note first
- media optional
- tags optional

Views:

- Month view for v0.1
- Year view as secondary summary entry

Rules:

- Avoid social feed affordances such as likes, comments, public sharing.
- Private share preview is allowed only for family-safe share cards.

### 6. AI Coach

Goal:

Provide child-specific guidance using long-term context.

Layout:

- child context strip: nickname, age, current theme
- quick prompt chips
- chat/answer area
- input bar

Modes:

- parenting Q&A
- activity generation
- growth analysis
- weekly plan draft

AI answer structure:

1. "结合小测的情况，我先判断..."
2. specific suggestion
3. steps
4. gentle fallback
5. save action: "加入周计划" / "记录为成长瞬间"

Rules:

- Never present as generic encyclopedia.
- Avoid long lectures.
- If data is insufficient, say what assumption is being used.
- Safety/medical/mental-health escalation should redirect to professional help.

### 7. Profile

Goal:

Manage family and trust settings.

Sections:

- family members
- child profile
- annual goals
- reminder preferences
- privacy and data
- feedback/contact

Rules:

- Keep operational settings away from Home.
- Use clear privacy explanations for sharing and media.

### 8. Family Invite

Goal:

Invite the second parent into the same family workspace.

Flow:

1. First parent selects role: 爸爸 / 妈妈.
2. Mini Program share card generated.
3. Second parent opens card.
4. Second parent logs in with WeChat.
5. Accept invitation.
6. Land on role-aware Home.

Rules:

- Invite card does not show child private records.
- Avoid public achievement language.
- Expired invite shows a clear recovery action.

### 9. Subscription Reminder Opt-In

Goal:

Increase return frequency without pressure.

Allowed reminder cards:

- evening companionship
- weekend planning
- accepted suggestion follow-up
- weekly reset

Copy example:

- "晚上提醒我看一眼今天可以做的小事"
- "周五提醒我一起安排一个轻量周末活动"

Rules:

- Opt-in only.
- Never imply parent failure.
- Do not overuse red badges or urgent markers.

## WeChat Ecosystem Design Rules

### Share Cards

Recommended share card title patterns:

- "今晚只有30分钟，可以这样陪孩子"
- "孩子不想练琴，先试试这个方法"
- "邀请你一起维护孩子的成长空间"

Rules:

- Use scenario value, not marketing slogan.
- Share cards open directly into useful flows.
- No child photos or private records by default.

### Mini Program Codes

Use for:

- private beta onboarding
- parent workshop follow-up
- interest or reading community entry

Landing behavior:

- open scenario guidance, not generic Home, when source context is known.

### Customer Service

Use for:

- private beta feedback
- onboarding problems
- async expert review experiment

Do not use for:

- real-time expert dependency
- medical/mental-health/safety intervention
- course sales

## Content Style

Voice:

- warm
- specific
- low-pressure
- practical

Preferred words:

- 陪伴
- 轻量
- 今晚
- 一件小事
- 慢慢来
- 记录一下
- 可以试试

Avoid words:

- 打卡失败
- 落后
- 不达标
- 必须完成
- 纠正孩子
- 提分
- 训练营
- 课程转化

Examples:

Good:

- "今晚先做一件10分钟的小事。"
- "如果孩子今天抗拒，可以把目标改成一起坐下来听一首曲子。"
- "这不是任务没完成，而是我们找到了下次更合适的方式。"

Bad:

- "本周完成率过低，请尽快补齐。"
- "连续3天未打卡。"
- "孩子阅读能力落后。"

## Data and Privacy Design

Rules:

- Child private records are family-only by default.
- Media sharing must be explicit.
- Share preview should default to text summary and hide media.
- Parents should understand whether an action is saved, shared, or only used for AI context.
- AI context use should be explained in Profile privacy section.

## Accessibility and Usability

Requirements:

- Tap target minimum: 44px height.
- Important actions reachable with thumb on common mobile sizes.
- Text contrast must remain readable on warm backgrounds.
- No critical information conveyed by color alone.
- Loading states must appear for AI generation and network writes.
- All destructive actions require confirmation.

## Implementation Notes

Mini Program implementation should not mirror the web route structure one-to-one.

Recommended implementation sequence:

1. WeChat login and identity binding
2. App shell and bottom tab bar
3. Home with today's companionship card
4. Progressive first setup
5. Weekly plan list and task progress
6. Growth archive list and record composer
7. AI Coach prompt and answer flow
8. Family invite share card
9. Subscription reminder opt-in

The current web onboarding auth panel is for browser testing only. It should not be used in the Mini Program.

## MVP Acceptance Criteria

The Mini Program design is ready for implementation when:

- A new parent can enter with WeChat login and receive first guidance without email/password.
- Home clearly answers "what should I do today?"
- Weekly tasks are role-aware and low-pressure.
- Growth record creation takes under 30 seconds for a text-only record.
- AI Coach is reachable from both Home and tab bar.
- Family invite uses WeChat share cards without exposing private records.
- Reminder opt-in copy is supportive and non-punitive.
- The interface does not look like a course, punch-card, or training product.
