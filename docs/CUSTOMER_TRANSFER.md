# Existing CounterPOS customer transfer

Deploy the CounterPOS changes before the CRM changes. Both apps must use the same signed CRM API key and secret already used for provisioning. This feature adds API routes and pages; it does not require new database migrations.

Open **Customer transfer** in the CRM sidebar. The list comes directly from the CounterPOS control database and shows each tenant's contact name, business name, URL, database name, status, and CRM link. It does not query HPanel or decide whether the site is healthy.

Select **Transfer** for an unlinked tenant. Review the prefilled contact details, select a CRM product and plan, and enter the subscription start and end dates. The form deliberately leaves those dates blank and requires explicit confirmation. Active or trialing subscriptions cannot have a future start date. An existing CRM customer may be selected to avoid a duplicate; that customer's status remains unchanged. The old CounterPOS subscription rows and dates are not imported.

Saving creates the CRM application instance and subscription, then links the existing CounterPOS tenant through the signed API. It does not create a domain or database, migrate, seed, or reset the tenant administrator. If the remote link fails, the CRM records remain available and the list shows **Retry link** for the same instance. Resolve that link before relying on automated access synchronization.

The CRM subscription lifecycle subsequently controls the linked tenant's access using the application's status and the reviewed subscription. Review customer, application, and subscription statuses together before transferring a suspended or archived tenant.
