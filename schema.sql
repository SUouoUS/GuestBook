-- 1. 방명록(messages) 테이블 생성
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    user_id text not null,          -- 작성자 고유 ID (인증을 안 쓰므로 임의의 값 가능)
    name text not null,             -- 작성자 이름
    avatar_url text,                -- 작성자 프로필 이미지 주소
    content text not null,          -- 방명록 내용
    likes integer default 0,        -- 좋아요 수
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. RLS (Row Level Security) 설정
-- 테스트 및 빠른 개발을 위해 누구나 읽고 쓸 수 있도록 정책을 설정합니다.
-- (실제 상용 서비스 시에는 Supabase Auth와 연동하여 권한을 제한하는 것이 좋습니다.)
alter table public.messages enable row level security;

-- 누구나 읽을 수 있는 정책
create policy "누구나 메시지 조회 가능" 
on public.messages for select 
using (true);

-- 누구나 작성할 수 있는 정책
create policy "누구나 메시지 작성 가능" 
on public.messages for insert 
with check (true);

-- 누구나 수정(좋아요 업데이트 등)할 수 있는 정책
create policy "누구나 메시지 수정 가능" 
on public.messages for update 
using (true);

-- 누구나 삭제할 수 있는 정책 (필요시)
create policy "누구나 메시지 삭제 가능" 
on public.messages for delete 
using (true);

-- 3. 실시간(Realtime) 구독 활성화 (새 글이 올라오면 즉시 반영하기 위함)
alter publication supabase_realtime add table public.messages;
