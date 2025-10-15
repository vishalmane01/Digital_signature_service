-- Documents uploaded by users
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  filename text not null,
  size_bytes bigint not null,
  blob_url text not null,
  sha256 hex not null,
  created_at timestamp with time zone not null default now()
);

-- Signatures of documents
create table if not exists public.signatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null,
  algorithm text not null default 'RSA-SHA256',
  signature_base64 text not null,
  public_key_pem text,
  created_at timestamp with time zone not null default now()
);

-- Helpful indexes
create index if not exists documents_user_idx on public.documents(user_id);
create index if not exists signatures_user_idx on public.signatures(user_id);
create index if not exists signatures_doc_idx on public.signatures(document_id);
