-- Lets each equipment line item carry its own "designation of intended user" (e.g. a
-- request with one laptop for the Dean and one printer for general office staff), so the
-- CICT spec recommendation is picked per item rather than uniformly for the whole request.
-- Falls back to the request-level designation, then the end-user's HR position level, when
-- an item doesn't specify its own (see RequestService.replaceItems/effectivePositionLevel).

ALTER TABLE request_items ADD COLUMN designation text;
