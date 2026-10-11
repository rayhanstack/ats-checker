export type Role = 'admin' | 'user';

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    is_admin: boolean;
    is_active: boolean;
    trial_ends_at: string | null;
    has_active_trial: boolean;
    email_verified_at?: string | null;
}

export interface FlashMessages {
    success?: string | null;
    error?: string | null;
    info?: string | null;
}

export interface AppSettings {
    site_name: string;
    site_tagline: string;
    logo_path?: string | null;
    trial_days: number;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
    flash: FlashMessages;
    settings: AppSettings;
    [key: string]: unknown;
};
