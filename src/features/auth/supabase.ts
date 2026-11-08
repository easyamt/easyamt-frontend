import { createClient } from '@supabase/supabase-js'
import { authConfigured, config } from '../../shared/config'

export const supabase = authConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null
