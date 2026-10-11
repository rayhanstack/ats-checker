export type Role = 'admin' | 'user';

export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    has_password?: boolean;
    is_google_linked?: boolean;
    role: Role;
    is_admin: boolean;
    is_active: boolean;
    trial_ends_at: string | null;
    has_active_trial: boolean;
    email_verified_at?: string | null;
}

export interface AppFeatures {
    google_login_enabled: boolean;
    email_verification_required: boolean;
    registration_enabled: boolean;
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
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    social_links: Record<string, string>;
    trial_days: number;
}

export interface FaqItem {
    id: number;
    question: string;
    answer: string;
}

export interface TestimonialItem {
    id: number;
    name: string;
    role: string;
    company: string;
    avatar_url?: string | null;
    content: string;
    rating: number;
}

export interface PricingPlan {
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    popular: boolean;
    cta_text: string;
    cta_link: string;
}

export interface PageData {
    slug: string;
    title: string;
    content: string;
    meta_description?: string | null;
    updated_at: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
    features: AppFeatures;
    flash: FlashMessages;
    settings: AppSettings;
    [key: string]: unknown;
};
