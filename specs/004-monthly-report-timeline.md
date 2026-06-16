# Monthly Report Timeline Brief

Created: 2026-06-15
Status: Proposed
Priority: P1

## Goal

Automatically generate a monthly growth report and place it into the growth archive timeline as a first-class report item. Parents can see the report alongside regular growth moments and tap it to open a dedicated report detail view.

This should make reports feel like part of the family memory archive, not a one-off AI chat result.

## Product Principle

Monthly reports are not growth moments.

Do not store generated reports as `growth_records`. A report summarizes a period of records; it should be represented as a separate report artifact and rendered in the timeline with a distinct visual treatment.

## User Experience

### Timeline

In the growth archive timeline, show mixed item types:

- Growth moment
- Course record
- Monthly report

Monthly report item:

- Title: `2026年6月成长月报`
- Subtitle: `基于 12 条成长瞬间和 4 条课程记录生成`
- Badge: `成长月报`
- Date: month end date or generation date
- CTA behavior: tap to open report detail

The report item should not look like an ordinary growth moment. It should feel more like a digest card in the timeline.

### Report detail

Report detail should include:

- Report title
- Covered period
- Data basis: record count, course record count, child scope
- Key growth moments
- Shared family moments
- Course and interest changes
- Ability / habit observations
- Parent note or gentle closing
- Next month gentle suggestions

For family scope, avoid ranking or comparing children.

### Empty and generation states

If there are not enough records:

- Show the monthly report entry point but explain that more records are needed.
- Recommended threshold: at least 3 growth records or course records in the month.

If a report is generating:

- Show a pending report card in the timeline or report entry area.
- Avoid blocking normal archive browsing.

## Data Model

Add a separate report table instead of writing reports into `growth_records`.

Suggested table: `growth_reports`

Fields:

- `id uuid primary key`
- `family_id uuid not null`
- `child_id uuid null`
- `scope text not null check (scope in ('child', 'family'))`
- `report_type text not null check (report_type in ('monthly', 'annual'))`
- `period_start date not null`
- `period_end date not null`
- `title text not null`
- `summary text not null`
- `sections jsonb not null default '[]'`
- `source_record_count integer not null default 0`
- `source_course_record_count integer not null default 0`
- `status text not null check (status in ('generating', 'ready', 'failed'))`
- `generated_by_user_id uuid null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Recommended unique key:

- `(family_id, child_id, scope, report_type, period_start, period_end)`

This prevents duplicate monthly reports for the same scope and period.

## API Shape

### Generate or fetch current month report

`POST /api/growth-reports/monthly`

Input:

- `scope`: `child | family`
- `childId`: optional
- `periodStart`: optional, defaults to current month start
- `periodEnd`: optional, defaults to current month end

Behavior:

- If a ready report exists for the same scope and period, return it.
- If not, gather records and course records for the period.
- Generate report using AI coach/report prompt.
- Save report into `growth_reports`.
- Return report.

### List timeline items

Either extend existing archive APIs or add a dedicated timeline endpoint.

Preferred:

`GET /api/archive/timeline`

Returns mixed timeline items:

- `type: growth_record`
- `type: course_record`
- `type: growth_report`

This avoids overloading `/api/growth-records` with non-record content.

### Report detail

`GET /api/growth-reports/[reportId]`

Returns full report artifact.

## Mini Program Changes

### Archive page

Update `miniprogram/pages/archive/index.ts`:

- Fetch timeline items from a mixed timeline endpoint.
- Render report cards differently from growth moments.
- Keep growth records and course records as their own item types.
- Add `openReportDetail` handler.

### Report detail page

Add:

- `miniprogram/pages/report-detail/index.ts`
- `miniprogram/pages/report-detail/index.wxml`

Route:

- `/pages/report-detail/index?reportId=...`

### Monthly report entry

Current monthly report CTA should generate or open the monthly report artifact instead of routing to AI coach chat.

Old behavior:

- Archive builds an AI coach prefill.
- AI coach returns a generic `growth_analysis` response.

New behavior:

- Archive calls report API.
- Report is saved as `growth_reports`.
- Archive opens report detail.
- Timeline includes the generated report.

## AI Output Contract

Monthly report should not use the generic suggestion-oriented AI coach response shape.

Use a report-specific schema:

- `reportType`
- `title`
- `periodLabel`
- `summary`
- `sections`
- `closingNote`
- `nextMonthSuggestions`

Sections should contain:

- `heading`
- `body`
- `evidence`

Avoid rendering `nextMonthSuggestions` as primary action tasks. They are report appendix content, not the main result.

## Success Criteria

- Generating a monthly report does not create any `growth_records`.
- Timeline can show growth moments, course records, and monthly reports together.
- Tapping a monthly report opens a dedicated report detail view.
- Re-generating the same month returns or updates one report artifact, not duplicates.
- Monthly report reads like a report, not a list of advice.

## Open Questions

- Should monthly reports auto-generate at month end, or only generate when the parent taps?
- Should reports be editable by parents before sharing?
- Should family monthly reports and child-specific monthly reports both be generated by default?
- Should report generation be paid-gated immediately or only after preview?
