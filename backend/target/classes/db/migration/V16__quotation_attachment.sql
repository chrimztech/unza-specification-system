-- Lets a vendor quotation carry the actual quote document (PDF/image) that CICT evaluates
-- against, rather than only the typed-in vendor name and amount. Reuses the existing generic
-- request_attachments store (upload via the normal attachments endpoint, then link the id here).

ALTER TABLE request_quotations ADD COLUMN attachment_id uuid REFERENCES request_attachments(id) ON DELETE SET NULL;
