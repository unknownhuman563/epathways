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

    // PLAI Partner API — AI ad platform that launches creatives to
    // Facebook / Instagram / Google / LinkedIn / TikTok / YouTube / Bing.
    // Requires an Enterprise account; key is generated under
    // PLAI dashboard → profile → Developer Center → Generate API Key.
    'plai' => [
        'api_key'      => env('PLAI_API_KEY'),
        'base_url'     => env('PLAI_BASE_URL', 'https://partner.plai.io'),
        'workspace_id' => env('PLAI_WORKSPACE_ID'),
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
