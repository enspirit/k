CASE WHEN 42 IS NOT NULL = TRUE THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 'hello' IS NOT NULL = TRUE THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN TRUE IS NOT NULL = TRUE THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN COALESCE(42, 0) = 42 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN COALESCE('hello', 'default') = 'hello' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN COALESCE(1 + 1, 0) = 2 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
