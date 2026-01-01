CASE WHEN 123 = 123 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_int('123') = 123 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_int('-42') = -42 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
TRUE /* assertFails not supported in SQL */
CASE WHEN 3.14 = 3.14 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_float('3.14') = 3.14 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_float('-2.5') = -2.5 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_float('123') = 123 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
TRUE /* assertFails not supported in SQL */
CASE WHEN TRUE = TRUE THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN FALSE = FALSE THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN CASE 'true' WHEN 'true' THEN TRUE WHEN 'false' THEN FALSE ELSE NULL END = TRUE THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN CASE 'false' WHEN 'true' THEN TRUE WHEN 'false' THEN FALSE ELSE NULL END = FALSE THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
TRUE /* assertFails not supported in SQL */
CASE WHEN DATE '2025-01-15' = DATE '2025-01-15' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_date('2025-01-15') = DATE '2025-01-15' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
TRUE /* assertFails not supported in SQL */
CASE WHEN TIMESTAMP '2025-01-15 10:30:00' = TIMESTAMP '2025-01-15 10:30:00' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_datetime('2025-01-15T10:30:00') = TIMESTAMP '2025-01-15 10:30:00' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
TRUE /* assertFails not supported in SQL */
CASE WHEN INTERVAL 'P1D' = INTERVAL 'P1D' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_duration('P1D') = INTERVAL 'P1D' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN elo_duration('PT2H30M') = INTERVAL 'PT2H30M' THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
TRUE /* assertFails not supported in SQL */

