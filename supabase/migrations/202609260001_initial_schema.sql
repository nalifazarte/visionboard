create extension if not exists pgcrypto;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 avatar_url text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,display_name,avatar_url)
 values(new.id, nullif(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'avatar_url',''))
 on conflict(id) do update set display_name=excluded.display_name,avatar_url=excluded.avatar_url,updated_at=now();
 return new;
end; $$;
create trigger on_auth_user_created after insert or update on auth.users for each row execute function public.handle_new_user();

create table public.vision_boards (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 year integer not null check(year between 1900 and 2200),
 title text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,year), unique(id,user_id)
);
create table public.goals (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 vision_board_id uuid not null,
 title text not null check(length(trim(title)) between 1 and 120), description text,
 quarter integer check(quarter between 1 and 4), due_date date,
 status text not null default 'not_started' check(status in ('not_started','in_progress','completed','paused')),
 progress integer not null default 0 check(progress between 0 and 100), completed_at timestamptz,
 sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(vision_board_id,user_id) references public.vision_boards(id,user_id) on delete cascade,
 unique(id,user_id), unique(id,vision_board_id,user_id), check(status <> 'completed' or (progress=100 and completed_at is not null))
);
create table public.goal_images (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 goal_id uuid not null, source_type text not null default 'upload' check(source_type='upload'), storage_path text not null check(storage_path like user_id::text || '/%'),
 is_cover boolean not null default false, sort_order integer not null default 0, created_at timestamptz not null default now(),
 foreign key(goal_id,user_id) references public.goals(id,user_id) on delete cascade,
 unique(storage_path), unique(id,user_id)
);
create unique index goal_images_one_cover on public.goal_images(goal_id) where is_cover;
create table public.quotes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 vision_board_id uuid not null, goal_id uuid, quarter integer check(quarter between 1 and 4),
 text text not null check(length(trim(text)) between 1 and 1000), author text,
 is_favorite boolean not null default false, include_in_wallpaper boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(vision_board_id,user_id) references public.vision_boards(id,user_id) on delete cascade,
 foreign key(goal_id,vision_board_id,user_id) references public.goals(id,vision_board_id,user_id) on delete set null (goal_id),
 unique(id,user_id)
);
create table public.wallpapers (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 vision_board_id uuid not null, device_type text check(device_type in ('mobile','desktop')),
 width integer check(width is null or width>0), height integer check(height is null or height>0),
 generation_mode text check(generation_mode is null or generation_mode in ('collage','artistic')),
 style text, layout_config jsonb not null default '{}'::jsonb, output_storage_path text,
 created_at timestamptz not null default now(),
 foreign key(vision_board_id,user_id) references public.vision_boards(id,user_id) on delete cascade,

 unique(id,user_id)
);
create index vision_boards_user_idx on public.vision_boards(user_id);
create index vision_boards_year_idx on public.vision_boards(year);
create index goals_user_idx on public.goals(user_id);
create index goals_board_idx on public.goals(vision_board_id);
create index goals_due_date_idx on public.goals(user_id,due_date) where due_date is not null;
create index goals_status_idx on public.goals(user_id,status);
create index goal_images_user_idx on public.goal_images(user_id);
create index goal_images_goal_idx on public.goal_images(goal_id);
create index quotes_user_idx on public.quotes(user_id);
create index quotes_board_idx on public.quotes(vision_board_id);
create index quotes_goal_idx on public.quotes(goal_id) where goal_id is not null;
create index wallpapers_user_idx on public.wallpapers(user_id);
create index wallpapers_board_idx on public.wallpapers(vision_board_id);

create function public.apply_goal_completion() returns trigger language plpgsql as $$
begin
 if new.status='completed' then new.progress=100; new.completed_at=coalesce(new.completed_at,now());
 elsif old.status='completed' and new.status<>'completed' then new.completed_at=null; end if;
 return new;
end; $$;
create trigger goals_completion before update of status,progress on public.goals for each row execute function public.apply_goal_completion();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger boards_touch before update on public.vision_boards for each row execute function public.touch_updated_at();
create trigger goals_touch before update on public.goals for each row execute function public.touch_updated_at();
create trigger quotes_touch before update on public.quotes for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.vision_boards enable row level security;
alter table public.goals enable row level security;
alter table public.goal_images enable row level security;
alter table public.quotes enable row level security;
alter table public.wallpapers enable row level security;
create policy profiles_self on public.profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy boards_self on public.vision_boards for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy goals_self on public.goals for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy goal_images_self on public.goal_images for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.goals g where g.id=goal_id and g.user_id=auth.uid()));
create policy quotes_self on public.quotes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.vision_boards b where b.id=vision_board_id and b.user_id=auth.uid()) and (goal_id is null or exists(select 1 from public.goals g where g.id=goal_id and g.user_id=auth.uid())));
create policy wallpapers_self on public.wallpapers for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('visionboard-private','visionboard-private',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy visionboard_storage_select on storage.objects for select to authenticated using(bucket_id='visionboard-private' and (storage.foldername(name))[1]=auth.uid()::text);
create policy visionboard_storage_insert on storage.objects for insert to authenticated with check(bucket_id='visionboard-private' and (storage.foldername(name))[1]=auth.uid()::text and (storage.foldername(name))[2] in ('goals','wallpapers'));
create policy visionboard_storage_update on storage.objects for update to authenticated using(bucket_id='visionboard-private' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='visionboard-private' and (storage.foldername(name))[1]=auth.uid()::text);
create policy visionboard_storage_delete on storage.objects for delete to authenticated using(bucket_id='visionboard-private' and (storage.foldername(name))[1]=auth.uid()::text);


