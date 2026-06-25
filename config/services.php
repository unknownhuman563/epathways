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
        'key'            => env('STRIPE_KEY'),
        'secret'         => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

    // Twilio SMS — used by App\Services\Sms\TwilioSmsProvider. Leave
    // TWILIO_SID empty to disable SMS (the system falls back to a no-op
    // provider that logs a 'failed' MessageLog with a clear reason).
    'twilio' => [
        'sid'   => env('TWILIO_SID'),
        'token' => env('TWILIO_TOKEN'),
        'from'  => env('TWILIO_FROM_NUMBER'),
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
        'api_key'      => env('PLAI_API_KEY'),
        'base_url'     => env('PLAI_BASE_URL', 'https://partner.plai.io'),
        'workspace_id' => env('PLAI_WORKSPACE_ID'),
    ],

    // n8n workflow that powers the Social MVP (stats, variant generation,
    // approve / reject / schedule, accounts, quick posts). Proxied
    // server-side by AiAdsWebhookController so OpenRouter / Zernio keys
    // never reach the browser. Leave SOCIAL_WEBHOOK_BASE unset to run the
    // UI against the controller's stub fixtures during early development.
    'social' => [
        'webhook_base'   => env('SOCIAL_WEBHOOK_BASE'),
        'webhook_secret' => env('SOCIAL_WEBHOOK_SECRET'),
    ],

    // Public contact destinations surfaced in floating widgets, the mobile
    // sticky CTA bar, and the footer. All optional — components hide a
    // channel if its value is empty so the bar collapses gracefully.
    'contact' => [
        'phone'     => env('CONTACT_PHONE', '+64277775586'),
        'whatsapp'  => env('CONTACT_WHATSAPP'),       // e.g. "63XXXXXXXXXX" — no +, no spaces
        'messenger' => env('CONTACT_MESSENGER', 'https://m.me/epathwaysnz'),
        'facebook'  => env('CONTACT_FACEBOOK', 'https://www.facebook.com/epathwaysnz'),
        'email'     => env('CONTACT_EMAIL', 'info@epathways.co.nz'),
    ],

];
