import 'package:supabase_flutter/supabase_flutter.dart';

// Singleton accessor for the Supabase client
final supabase = Supabase.instance.client;

const supabaseUrl  = String.fromEnvironment('SUPABASE_URL',  defaultValue: 'https://aadutygzgrbexxuznqlr.supabase.co');
const supabaseAnon = String.fromEnvironment('SUPABASE_ANON', defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHV0eWd6Z3JiZXh4dXpucWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDU1NzIsImV4cCI6MjA5MzY4MTU3Mn0.ylfcruECm7WSM4Lgs0pJ8kDj8MFT8CfVhGtWorSOEMY');
