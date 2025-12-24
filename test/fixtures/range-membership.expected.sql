CASE WHEN 5 >= 1 AND 5 <= 10 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN NOT (0 >= 1 AND 0 <= 10) THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN NOT (0 >= 1 AND 0 <= 10) THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN NOT (5 >= 1 AND 5 < 5) THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN NOT (5 >= 1 AND 5 < 5) THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 5 >= 1 AND 5 < 6 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 10 >= 1 AND 10 <= 10 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN NOT (11 >= 1 AND 11 <= 10) THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN NOT (11 >= 1 AND 11 <= 10) THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
