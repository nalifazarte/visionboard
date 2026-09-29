alter table public.goal_images
  drop constraint if exists goal_images_source_type_check;

alter table public.goal_images
  add column if not exists pexels_photo_id bigint,
  add column if not exists photographer text,
  add column if not exists photographer_url text,
  add column if not exists source_url text;

alter table public.goal_images
  add constraint goal_images_source_type_check check (source_type in ('upload','pexels'));

create unique index if not exists goal_images_pexels_once_per_goal
  on public.goal_images(goal_id, pexels_photo_id)
  where pexels_photo_id is not null;