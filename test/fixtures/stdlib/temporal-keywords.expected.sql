CASE WHEN CURRENT_TIMESTAMP > TIMESTAMP '2020-01-01 00:00:00' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN CURRENT_DATE >= DATE '2020-01-01' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN CURRENT_DATE + INTERVAL '1 day' > CURRENT_DATE THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN CURRENT_DATE - INTERVAL '1 day' < CURRENT_DATE THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN CURRENT_DATE + INTERVAL '1 day' > CURRENT_DATE - INTERVAL '1 day' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN CURRENT_TIMESTAMP > TIMESTAMP '2024-01-01 00:00:00' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN CURRENT_DATE > DATE '2024-01-01' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
