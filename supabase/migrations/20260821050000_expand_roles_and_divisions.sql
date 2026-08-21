-- Scopes division-manager / field-supervisor visibility.
-- Null = company-wide (Owner, GM, Bookkeeper, CSR, Dispatcher,
-- Office Manager, Admin/Warranty Coordinator, Marketing Manager).
create type division as enum ('service', 'install', 'marketing', 'office');

-- Expand the role set to the org's actual title list. The old generic
-- values (admin, manager, tech) stay in the enum -- Postgres has no way to
-- drop enum values without a full type rebuild -- but nothing assigns them
-- going forward; every profile uses one of the specific roles below.
-- 'dispatcher' and 'csr' already exist and are reused as-is.
alter type user_role add value if not exists 'owner';
alter type user_role add value if not exists 'gm';
alter type user_role add value if not exists 'service_manager';
alter type user_role add value if not exists 'install_manager';
alter type user_role add value if not exists 'marketing_manager';
alter type user_role add value if not exists 'office_manager';
alter type user_role add value if not exists 'service_technician';
alter type user_role add value if not exists 'comfort_advisor';
alter type user_role add value if not exists 'install_crew_lead';
alter type user_role add value if not exists 'install_helper';
alter type user_role add value if not exists 'field_supervisor';
alter type user_role add value if not exists 'bookkeeper';
alter type user_role add value if not exists 'admin_warranty_coordinator';

alter table user_profiles add column division division;
