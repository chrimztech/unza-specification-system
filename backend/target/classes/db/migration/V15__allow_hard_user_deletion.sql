-- Two foreign keys to users had no ON DELETE rule (defaulting to RESTRICT/NO ACTION),
-- which would make admin.deleteUser() fail with a raw constraint-violation error the
-- moment a user had ever uploaded an attachment or created a delegation. Both are
-- changed to SET NULL so a hard delete preserves the historical record (attachment,
-- delegation) with an unknown actor, matching the pattern already used for
-- requests.manager_id / cict_decided_by / request_events.actor_id etc.

ALTER TABLE request_attachments ALTER COLUMN uploaded_by DROP NOT NULL;
ALTER TABLE request_attachments DROP CONSTRAINT request_attachments_uploaded_by_fkey;
ALTER TABLE request_attachments
  ADD CONSTRAINT request_attachments_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE delegations DROP CONSTRAINT delegations_created_by_fkey;
ALTER TABLE delegations
  ADD CONSTRAINT delegations_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
