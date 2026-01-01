CASE WHEN person.age = 25 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN employee.salary > 50000 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN customer.balance + 100 = 600 THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
CASE WHEN student.gpa >= 3 AND student.enrolled THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END
