CASE WHEN (jsonb_build_object('name', 'Alice'))::jsonb #> (ARRAY['name'])::text[] = 'Alice' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN (jsonb_build_object('user', jsonb_build_object('name', 'Bob')))::jsonb #> (ARRAY['user', 'name'])::text[] = 'Bob' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN (jsonb_build_object('items', ARRAY[10, 20, 30]))::jsonb #> (ARRAY['items', 0])::text[] = 10 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN (jsonb_build_object('items', ARRAY[10, 20, 30]))::jsonb #> (ARRAY['items', 2])::text[] = 30 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN (jsonb_build_object('list', ARRAY[jsonb_build_object('id', 1), jsonb_build_object('id', 2)]))::jsonb #> (ARRAY['list', 0, 'id'])::text[] = 1 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN (jsonb_build_object('name', 'Alice'))::jsonb #> (ARRAY['missing'])::text[] IS NULL THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN (jsonb_build_object('name', 'Alice'))::jsonb #> (ARRAY['name', 'child'])::text[] IS NULL THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN (NULL)::jsonb #> (ARRAY['x'])::text[] IS NULL THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
