-- ================================================================
-- CommOS — Migration 003: Add body field to communications
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================================

alter table communications
  add column if not exists body text;

comment on column communications.body is 'Brief / Copy — contenido o brief de la comunicación';
