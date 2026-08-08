<?php

return [

    'default_currency' => env('CRM_DEFAULT_CURRENCY', 'PKR'),

    'currencies' => ['PKR', 'USD', 'AED', 'GBP', 'EUR', 'SAR'],

    'expiring_soon_days' => env('CRM_EXPIRING_SOON_DAYS', 7),

    'default_grace_days' => env('CRM_DEFAULT_GRACE_DAYS', 7),

];
