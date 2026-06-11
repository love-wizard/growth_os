# Growth OS WeChat Mini Program UI Guidelines

## Design Positioning

Growth OS mini program should feel like a warm family companionship tool, not a learning app, training institution product, or task management dashboard.

The first screen of every primary page should answer one question:

> What can this parent do next?

## Visual Principles

- Keep the product quiet, warm, and low-pressure.
- Prefer one primary action per page.
- Use progress as supportive context, not as a judgment.
- Let photos and real family moments carry emotional value.
- Avoid management-heavy wording such as "管理", "打卡", "失败", "落后", or "排名".

## Color System

- App background: `#F8F6F2`
- Main text: `#25211C`
- Secondary text: `#6E665C`
- Caption text: `#9B9185`
- Primary action green: `#3F8F6B`
- Soft green surface: `#E4F3EC`
- Soft warm surface: `#FFF0DF`
- Soft blue surface: `#EAF2FF`
- Border: `#E7E0D7`

Use green for primary companionship actions, warm orange for emotional/supportive prompts, and blue for planning or structured context.

## Typography

- Page title: `48rpx`, semibold, `64rpx` line height
- Card title: `34rpx`, semibold, `48rpx` line height
- Body: `28-30rpx`, `42-48rpx` line height
- Caption: `24rpx`, `36rpx` line height

Avoid oversized text inside compact cards. Do not scale type by viewport width.

## Layout

- Page padding: `32rpx`
- Card radius: `16rpx`
- Button radius: `16rpx`
- Card padding: `28-36rpx`
- Section spacing: `32rpx`

Do not put cards inside cards. Use cards for actual grouped tools, records, or settings blocks.

## Page Patterns

### Home

Primary focus: today's smallest companionship action.

The daily quote is supportive background. It must not compete with the main action card.

### Weekly Plan

Primary focus: family role split for this week.

Completion rate is secondary. Avoid project-management density.

### Growth Archive

Primary focus: real moments and photos.

Filters should be available but visually quiet. Photo records should have stronger visual weight than plain text records.

### AI Coach

Primary focus: one specific question and one generated suggestion.

Quick questions and free input should live in one asking surface. AI answers should be structured as context, action, and fallback.

### Profile

Primary focus: family space status and settings.

Group information into family, account, companionship settings, and privacy. Avoid making it feel like a backend settings page.

## Buttons

- Primary button: only for high-intent actions such as generating advice, recording a moment, adopting a plan, or logging in.
- Secondary button: navigation, filtering, sharing, closing, or optional setup.
- Compact button: small contextual actions only.

Do not place several equal-weight actions in one card unless the parent must choose between them.

## Empty And Loading States

Empty states should suggest one gentle next action.

Loading states should preserve layout and avoid flashing default fake content before real family data arrives.

## Privacy Copy

Growth records are family-private by default. Share copy should stay privacy-safe and avoid performance claims.
