CASE WHEN 100 * (1 - 0.2) = 80 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 90 + 90 * 0.1 = 99 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 1000 * POWER(1 + 0.05, 10) > 1500 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 30 >= 18 AND (50000 > 30000 OR TRUE = TRUE) THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 0.8 * 100 = 80 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN 70 / POWER(1.75, 2) < 25 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
