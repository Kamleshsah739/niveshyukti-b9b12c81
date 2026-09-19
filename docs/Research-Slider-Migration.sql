-- Allows Super Admin to select exactly up to six public recommendations for the homepage slider.
alter table public.research_reports
  add column if not exists home_slider_slot smallint;

alter table public.research_reports
  drop constraint if exists research_reports_home_slider_slot_range;
alter table public.research_reports
  add constraint research_reports_home_slider_slot_range
  check (home_slider_slot between 1 and 6 or home_slider_slot is null);

create unique index if not exists research_reports_unique_home_slider_slot
  on public.research_reports (home_slider_slot)
  where home_slider_slot is not null;
