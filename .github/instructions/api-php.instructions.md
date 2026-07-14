---
description: 'Instructions for the PHP/Laravel API backend'
applyTo: 'api-php/**,api/**'
---

# PHP/Laravel API – Copilot Instructions

## Stack
- **Framework**: Laravel 13 (PHP 8.3)
- **Database**: SQLite via Eloquent ORM
- **API Documentation**: L5-Swagger (OpenAPI 3.0)
- **Testing**: PHPUnit via `php artisan test`
- **Linting**: PHPStan (static analysis) + Laravel Pint (code style)

## Architecture
- `app/Models/` — Eloquent models (one per database table)
- `app/Http/Controllers/` — API resource controllers
- `app/Http/Resources/` — API resource transformers (JSON responses)
- `app/Http/Traits/` — Shared controller traits
- `app/Exceptions/` — Custom exception classes
- `routes/api.php` — All API route definitions (uses `Route::apiResource`)
- `database/migrations/` — Schema migrations
- `database/seeders/` — Sample data seeders
- `config/` — Laravel configuration files
- `tests/Feature/` — Feature/integration tests
- `tests/Unit/` — Unit tests

## Conventions
1. Use `Route::apiResource()` for RESTful endpoints — do not manually define GET/POST/PUT/DELETE.
2. All controllers extend the base `Controller` class and use API resource responses.
3. Use Form Requests for validation (create classes in `app/Http/Requests/`).
4. Database queries go through Eloquent — avoid raw SQL unless performance-critical.
5. Environment config via `.env` file; access with `config()` helper, never `env()` outside config files.
6. Use Laravel's built-in error handling; throw `ModelNotFoundException`, `ValidationException`, etc.
7. SQLite database stored at `data/app.db` (created on first migration run).

## Common Commands
```bash
composer install              # Install dependencies
php artisan serve --port=3000 # Start dev server
php artisan migrate --force   # Run migrations
php artisan migrate --force --seed  # Migrate + seed
php artisan test              # Run all tests
php artisan test --coverage   # Tests with coverage
./vendor/bin/phpstan analyse  # Static analysis
./vendor/bin/pint             # Code formatting
php artisan l5-swagger:generate  # Regenerate OpenAPI spec
```

## Testing
- Feature tests in `tests/Feature/` test full HTTP request/response cycles.
- Unit tests in `tests/Unit/` test isolated logic (models, services).
- Use `RefreshDatabase` trait in tests for clean state.
- Factory classes in `database/factories/` for test data generation.

## Error Handling
- Return consistent JSON error responses with appropriate HTTP status codes.
- Use Laravel's exception handler for mapping exceptions to responses.
- Custom exceptions in `app/Exceptions/` for domain-specific errors.
