<?php

it('loads the CRM foundation', function () {
    expect(\App\Enums\Permission::cases())->not->toBeEmpty();
});
