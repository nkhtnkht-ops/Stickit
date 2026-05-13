-- Fix handle_new_user() trigger function
-- 原因: SECURITY DEFINER 関数の search_path が空で、profiles テーブルを参照できなかった
-- 症状: 新規 auth.users 作成時に "relation \"profiles\" does not exist" エラー → ログイン不可
-- 解決: search_path = public を設定し、テーブル名もスキーマ修飾

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
