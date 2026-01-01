CASE WHEN 2 + 3 * 4 = 14 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 2 + 3 = 5 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 10 > 5 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
