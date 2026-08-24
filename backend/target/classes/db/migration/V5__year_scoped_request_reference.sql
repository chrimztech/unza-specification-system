-- request_ref_seq was a single global, never-resetting sequence, so the
-- "UNZA/CICT/{year}/{seq}" reference format was misleading: the sequence
-- portion never actually restarted at the turn of a year (e.g. the first
-- request of 2027 would read .../2027/0157, continuing on from 2026,
-- instead of .../2027/0001). Replace it with a year-scoped counter so the
-- sequence number genuinely resets to 1 each calendar year.

CREATE TABLE request_reference_sequences (
  year integer PRIMARY KEY,
  last_value integer NOT NULL DEFAULT 0
);

DROP SEQUENCE IF EXISTS request_ref_seq;
