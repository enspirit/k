.PHONY: up down shell restart clean logs status

up:
	docker compose up -d --build
	@echo "Containers started. Use 'make shell' to access dev environment"

down:
	docker compose down

shell:
	docker compose exec dev bash

restart: down up

clean: down
	docker compose down --rmi all --volumes

logs:
	docker compose logs -f

status:
	@docker compose ps
