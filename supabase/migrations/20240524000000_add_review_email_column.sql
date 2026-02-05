-- Add review_email_sent_at to orders table to track email scheduling
ALTER TABLE orders 
ADD COLUMN review_email_sent_at TIMESTAMPTZ DEFAULT NULL;
