BACKEND_CONTAINER_NAME=django

all: up

up:
	@docker compose -f docker-compose.yml up -d --build

ps:
	@docker compose -f docker-compose.yml ps

start:
	@docker compose -f docker-compose.yml start

stop:
	@docker compose -f docker-compose.yml stop

down:
	@docker compose -f docker-compose.yml down

prune:
	@docker system prune -a -f

server-logs:
	@docker logs $(BACKEND_CONTAINER_NAME) --follow

clean:
	@docker stop $$(docker ps -q) || true
	@docker rm $$(docker ps -qa) || true
	@docker volume rm -f $$(docker volume ls -q) || true
	@docker network prune -f || true

fclean: clean
	@if [ -d ~/data/wordpress ]; then rm -rf ~/data/wordpress/*; fi
	@if [ -d ~/data/mariadb ]; then rm -rf ~/data/mariadb/*; fi

re: fclean all

migrate:
	@docker exec -it django python manage.py makemigrations
	@docker exec -it django python manage.py migrate
	@docker exec -it chat python manage.py makemigrations
	@docker exec -it chat python manage.py migrate

createsuperuser:
	@docker exec -it chat python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('testuser', 'admin@example.com', '456') if not User.objects.filter(username='testuser').exists() else None"

