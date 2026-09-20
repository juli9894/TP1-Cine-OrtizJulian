import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Service()
export class SupabaseClientService {
    readonly client: SupabaseClient = createClient(
        environment.supabaseUrl,
        environment.supabaseAnonKey
    );
}
