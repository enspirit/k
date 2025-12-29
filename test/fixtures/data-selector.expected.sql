CASE WHEN elo_data('{"name": "Alice"}') = jsonb_build_object('name', 'Alice') THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_data('[1, 2, 3]') = ARRAY[1, 2, 3] THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_data('{"user": {"name": "Bob"}}').user.name = 'Bob' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_data('{"active": true}').active = TRUE THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_data('{"count": 42}').count = 42 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN ARRAY[1, 2, 3] = ARRAY[1, 2, 3] THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN jsonb_build_object('x', 10).x = 10 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_data('not valid json') IS NULL THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_data(NULL) IS NULL THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN COALESCE(elo_data('invalid'), jsonb_build_object('default', TRUE) = jsonb_build_object('default', TRUE)) THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
