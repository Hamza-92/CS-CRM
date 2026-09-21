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
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'counterpos' => [
        'base_url' => env('COUNTERPOS_API_URL'),
        'host_header' => env('COUNTERPOS_API_HOST_HEADER'),
        'key' => env('COUNTERPOS_API_KEY'),
        'secret' => env('COUNTERPOS_API_SECRET'),
        'connect_timeout' => (int) env('COUNTERPOS_API_CONNECT_TIMEOUT', 5),
        'timeout' => (int) env('COUNTERPOS_API_TIMEOUT', 15),
        'long_timeout' => (int) env('COUNTERPOS_API_LONG_TIMEOUT', 900),
    ],
    'hostinger' => [
        'base_url' => env('HOSTINGER_API_URL', 'https://developers.hostinger.com'),
        'token' => env('HOSTINGER_API_TOKEN'),
        'account_username' => env('HOSTINGER_ACCOUNT_USERNAME'),
        'hosting_order_id' => env('HOSTINGER_HOSTING_ORDER_ID') ? (int) env('HOSTINGER_HOSTING_ORDER_ID') : null,
        'parent_domain' => env('HOSTINGER_PARENT_DOMAIN'),
        'subdomain_directory' => env('HOSTINGER_SUBDOMAIN_DIRECTORY', 'public'),
        'database_host' => env('HOSTINGER_DATABASE_HOST'),
        'database_port' => (int) env('HOSTINGER_DATABASE_PORT', 3306),
        'database_remote_ip' => env('HOSTINGER_DATABASE_REMOTE_IP'),
        'connect_timeout' => (int) env('HOSTINGER_API_CONNECT_TIMEOUT', 5),
        'timeout' => (int) env('HOSTINGER_API_TIMEOUT', 20),
    ],
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
