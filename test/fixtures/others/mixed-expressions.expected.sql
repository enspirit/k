CASE WHEN 100 * 1.1 > 100 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 10 * 5 - 10 = 40 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 75 >= 50 AND 75 <= 100 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 50 > 0 AND (TRUE OR 50 < 1000) THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
