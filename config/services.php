<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    // Brevo Transactional SMS. api_key is a Brevo v3 API key (xkeysib-…, from
    // Brevo → SMTP & API → API Keys — NOT the SMTP password). sender is a name
    // (max 11 alphanumeric chars) or a purchased number.
    'brevo' => [
        'sms_key' => env('BREVO_API_KEY'),
        'sms_sender' => env('BREVO_SMS_SENDER', 'ePathways'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'cerebras' => [
        'api_key' => env('CEREBRAS_API_KEY'),
        'base_url' => env('CEREBRAS_BASE_URL', 'https://api.cerebras.ai/v1'),
        'model' => env('CEREBRAS_MODEL', 'gpt-oss-120b'),
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
    ],

    // Stripe Checkout — used by the resident-intake payment step. The
    // publishable `key` is sent to the browser; `secret` and `webhook_secret`
    // stay server-side. `webhook_secret` verifies signatures on the
    // POST /stripe/webhook callback.
    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

    // Consultation booking fees (whole-currency units, e.g. 200 = NZD $200).
    // Configurable so staff can change pricing without a code change.
    'booking' => [
        'immigration_fee' => (int) env('IMMIGRATION_CONSULT_FEE', 200),
        'currency' => env('BOOKING_CURRENCY', 'nzd'),
        // Business timezone the advisers' availability is defined in. Clients
        // see slots converted to their own device timezone; bookings store the
        // exact UTC moment.
        'timezone' => env('BOOKING_TIMEZONE', 'Pacific/Auckland'),
    ],

    // Twilio SMS — used by App\Services\Sms\TwilioSmsProvider. Leave
    // TWILIO_SID empty to disable SMS (the system falls back to a no-op
    // provider that logs a 'failed' MessageLog with a clear reason).
    'twilio' => [
        'sid' => env('TWILIO_SID'),
        'token' => env('TWILIO_TOKEN'),
        'from' => env('TWILIO_FROM_NUMBER'),
    ],

    // Calendar sync — token used by SyncController to authenticate inbound
    // appointment pushes from the external Google Apps Script
    // (X-Sync-Token header must match this value).
    'calendar' => [
        'sync_token' => env('CALENDAR_SYNC_TOKEN'),
    ],

    // PLAI Partner API — AI ad platform that launches creatives to
    // Facebook / Instagram / Google / LinkedIn / TikTok / YouTube / Bing.
    // Requires an Enterprise account; key is generated under
    // PLAI dashboard → profile → Developer Center → Generate API Key.
    'plai' => [
        'api_key' => env('PLAI_API_KEY'),
        'base_url' => env('PLAI_BASE_URL', 'https://partner.plai.io'),
        'workspace_id' => env('PLAI_WORKSPACE_ID'),
    ],

    // n8n workflow that powers the Social MVP (stats, variant generation,
    // approve / reject / schedule, accounts, quick posts). Proxied
    // server-side by AiAdsWebhookController so OpenRouter / Zernio keys
    // never reach the browser. Leave SOCIAL_WEBHOOK_BASE unset to run the
    // UI against the controller's stub fixtures during early development.
    'social' => [
        'webhook_base' => env('SOCIAL_WEBHOOK_BASE'),
        'webhook_secret' => env('SOCIAL_WEBHOOK_SECRET'),
    ],

    // Zernio — unified social API (publish / schedule / accounts / inbox /
    // ads / analytics). Used by App\Services\ZernioService and surfaced
    // through AiAdsWebhookController. The bearer key (sk_…) is generated in
    // the Zernio dashboard → API Keys. Leave ZERNIO_API_KEY unset to keep the
    // Social MVP on n8n / stub fixtures. The webhook secret verifies inbound
    // events Zernio pushes to /webhook/social/*.
    'zernio' => [
        'api_key' => env('ZERNIO_API_KEY'),
        'base_url' => env('ZERNIO_BASE_URL', 'https://zernio.com/api/v1'),
        'webhook_secret' => env('ZERNIO_WEBHOOK_SECRET'),
        // Restrict every Zernio call to ONE profile so accounts/posts from
        // other profiles (e.g. a separate accommodation page) never leak in.
        // Find the id with `php artisan zernio:profiles`.
        'profile_id' => env('ZERNIO_PROFILE_ID'),
    ],

    // Public contact destinations surfaced in floating widgets, the mobile
    // sticky CTA bar, and the footer. All optional — components hide a
    // channel if its value is empty so the bar collapses gracefully.
    'contact' => [
        'phone' => env('CONTACT_PHONE', '+64277775586'),
        'whatsapp' => env('CONTACT_WHATSAPP'),       // e.g. "63XXXXXXXXXX" — no +, no spaces
        'messenger' => env('CONTACT_MESSENGER', 'https://m.me/epathwaysnz'),
        'facebook' => env('CONTACT_FACEBOOK', 'https://www.facebook.com/epathwaysnz'),
        'email' => env('CONTACT_EMAIL', 'hello@epathways.ph'),
        // Where the email "Book now" CTA points. Overridable per environment.
        'booking_url' => env('BOOKING_URL', 'https://staging.epathways.co.nz/booking'),
        // Sender for event-registration emails (must be verified in Brevo).
        // Used by the built-in fallback; the template carries its own from_email.
        'event_from_email' => env('EVENT_FROM_EMAIL', 'hello@epathways.ph'),
        'event_from_name' => env('EVENT_FROM_NAME', 'Fhilip Bryll - ePathways Philippines'),
        // Central "Reply-To" — when set, replies to any of our emails route
        // to this monitored inbox. Null = replies go to each email's From.
        'reply_to' => env('REPLY_TO_EMAIL'),
    ],

    // IMAP mailbox we poll for inbound email replies (the Reply-To inbox,
    // e.g. hello@epathways.ph on Google Workspace). Password is a Google
    // App Password, not the account password.
    'imap' => [
        'host' => env('IMAP_HOST', 'imap.gmail.com'),
        'port' => (int) env('IMAP_PORT', 993),
        'encryption' => env('IMAP_ENCRYPTION', 'ssl'),
        'username' => env('IMAP_USERNAME'),
        'password' => env('IMAP_PASSWORD'),
        'folder' => env('IMAP_FOLDER', 'INBOX'),
    ],

];
