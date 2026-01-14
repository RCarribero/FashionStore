-- Email Queue System for Supabase
-- Emails are stored in a queue and can be processed by Edge Functions or external services

-- Create email queue table
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    template_type TEXT NOT NULL, -- 'order_confirmation', 'shipping_update', 'welcome'
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    attempts INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage all emails
CREATE POLICY "Service role manages email queue"
    ON email_queue
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Index for processing pending emails
CREATE INDEX IF NOT EXISTS idx_email_queue_pending 
    ON email_queue(status, created_at) 
    WHERE status = 'pending';

-- Function to queue an email
CREATE OR REPLACE FUNCTION queue_email(
    p_recipient TEXT,
    p_subject TEXT,
    p_html TEXT,
    p_template TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_email_id UUID;
BEGIN
    INSERT INTO email_queue (recipient_email, subject, html_content, template_type, metadata)
    VALUES (p_recipient, p_subject, p_html, p_template, p_metadata)
    RETURNING id INTO v_email_id;
    
    RETURN v_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(p_email_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE email_queue
    SET status = 'sent', sent_at = NOW()
    WHERE id = p_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark email as failed
CREATE OR REPLACE FUNCTION mark_email_failed(p_email_id UUID, p_error TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE email_queue
    SET status = 'failed', error_message = p_error, attempts = attempts + 1
    WHERE id = p_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE email_queue IS 'Queue for outgoing emails - processed by Edge Functions';
