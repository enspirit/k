CASE WHEN x + y = 15 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN price + tax = 110 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN user_age + account_balance = 2525 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN var1 + var2 = 30 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
