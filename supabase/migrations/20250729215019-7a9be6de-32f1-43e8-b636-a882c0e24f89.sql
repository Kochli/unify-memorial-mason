-- Create table for storing Gmail account connections
CREATE TABLE public.gmail_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gmail_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for gmail_accounts
CREATE POLICY "Users can view their own Gmail accounts" 
ON public.gmail_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Gmail accounts" 
ON public.gmail_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Gmail accounts" 
ON public.gmail_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Gmail accounts" 
ON public.gmail_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for storing Gmail emails
CREATE TABLE public.gmail_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gmail_account_id UUID NOT NULL REFERENCES public.gmail_accounts(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  subject TEXT,
  from_email TEXT,
  from_name TEXT,
  to_email TEXT,
  content_text TEXT,
  content_html TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  labels TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(gmail_account_id, message_id)
);

-- Enable RLS
ALTER TABLE public.gmail_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for gmail_emails (users can only see emails from their connected accounts)
CREATE POLICY "Users can view emails from their Gmail accounts" 
ON public.gmail_emails 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.gmail_accounts ga 
    WHERE ga.id = gmail_account_id AND ga.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update emails from their Gmail accounts" 
ON public.gmail_emails 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.gmail_accounts ga 
    WHERE ga.id = gmail_account_id AND ga.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_gmail_accounts_updated_at
BEFORE UPDATE ON public.gmail_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gmail_emails_updated_at
BEFORE UPDATE ON public.gmail_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_gmail_accounts_user_id ON public.gmail_accounts(user_id);
CREATE INDEX idx_gmail_accounts_email ON public.gmail_accounts(email);
CREATE INDEX idx_gmail_emails_account_id ON public.gmail_emails(gmail_account_id);
CREATE INDEX idx_gmail_emails_received_at ON public.gmail_emails(received_at DESC);
CREATE INDEX idx_gmail_emails_is_read ON public.gmail_emails(is_read);
CREATE INDEX idx_gmail_emails_message_id ON public.gmail_emails(message_id);