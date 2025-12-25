'{}'::jsonb->>'budget'
jsonb_build_object('budget', 1500)->>'budget'
jsonb_build_object('name', 'Alice', 'age', 30)->>'name'
jsonb_build_object('name', 'Alice', 'age', 30)->>'age'
(SELECT obj->>'x' FROM (SELECT jsonb_build_object('x', 10) AS obj) AS _let)
