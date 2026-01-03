-- Grant all privileges to the user
ALTER USER reallife_user WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE reallife_db TO reallife_user;
GRANT ALL ON SCHEMA public TO reallife_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO reallife_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO reallife_user;
