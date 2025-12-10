run-in-docker:
	docker exec -it nest_app make $(COMMAND)

migration-generate:
	@if [ -z "$(SCHEMA)" ]; then \
		read -p "Please enter SCHEMA (backoffice or client): " SCHEMA; \
		if [ -z "$$SCHEMA" ]; then \
			echo "ERROR: SCHEMA param is required."; \
			exit 1; \
		fi; \
		if [ "$$SCHEMA" != "backoffice" ] && [ "$$SCHEMA" != "client" ]; then \
			echo "ERROR: Invalid SCHEMA value. Must be 'backoffice' or 'client'."; \
			exit 1; \
		fi; \
	fi; \
	SCHEMA_NAME=$$SCHEMA pnpm run migration:generate
migration-create:
	@if [ -z "$(SCHEMA)" ]; then \
		read -p "Please enter SCHEMA (backoffice or client): " SCHEMA; \
		if [ -z "$$SCHEMA" ]; then \
			echo "ERROR: SCHEMA param is required."; \
			exit 1; \
		fi; \
		if [ "$$SCHEMA" != "backoffice" ] && [ "$$SCHEMA" != "client" ]; then \
			echo "ERROR: Invalid SCHEMA value. Must be 'backoffice' or 'client'."; \
			exit 1; \
		fi; \
	fi; \
	SCHEMA_NAME=$$SCHEMA pnpm run migration:create
migration-run-all:
	pnpm run migration:run:all
migration-run:
	@if [ -z "$(SCHEMA)" ]; then \
		read -p "Please enter SCHEMA: " SCHEMA; \
		if [ -z "$$SCHEMA" ]; then \
			echo "ERROR: SCHEMA param is required."; \
			exit 1; \
		fi; \
	fi; \
	SCHEMA_NAME=$$SCHEMA pnpm run migration:run
migration-revert:
	@if [ -z "$(SCHEMA)" ]; then \
		read -p "Please enter SCHEMA: " SCHEMA; \
		if [ -z "$$SCHEMA" ]; then \
			echo "ERROR: SCHEMA param is required."; \
			exit 1; \
		fi; \
	fi; \
	SCHEMA_NAME=$$SCHEMA pnpm run migration:revert