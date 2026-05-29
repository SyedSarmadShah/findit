# Find-It Backend

## Installation commands

```powershell
cd c:\Users\syeds\findit\find-it-backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Project structure

```text
find-it-backend/
  manage.py
  requirements.txt
  .env.example
  config/
  apps/
    authentication/
    items/
    messaging/
```

## Initial API routes

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`
- `GET /api/items/`
- `POST /api/items/`
- `GET /api/items/{id}/`
- `PATCH /api/items/{id}/`
- `DELETE /api/items/{id}/`
- `GET /api/messaging/conversations/`
- `POST /api/messaging/conversations/`
- `GET /api/messaging/messages/`
- `POST /api/messaging/messages/`
