<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\LeadStatusOption;
use App\Models\Payment;
use App\Models\Subscription;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $can = static fn (Permission $permission): bool => $user->can($permission->value);
        $period = in_array($request->string('period')->toString(), ['30d', '90d', '6m', '12m'], true) ? $request->string('period')->toString() : '6m';
        $end = CarbonImmutable::today()->endOfDay();
        $start = match ($period) {
            '30d' => $end->subDays(29)->startOfDay(),
            '90d' => $end->subDays(89)->startOfDay(),
            '12m' => $end->subMonths(11)->startOfMonth(),
            default => $end->subMonths(5)->startOfMonth(),
        };

        $stats = [
            'newCustomers' => $can(Permission::ViewCustomers) ? Customer::query()->whereBetween('created_at', [$start, $end])->count() : null,
            'newLeads' => $can(Permission::ViewLeads) ? Lead::query()->whereBetween('created_at', [$start, $end])->count() : null,
            'wonDeals' => $can(Permission::ViewDeals) ? Deal::query()->whereNotNull('won_at')->whereBetween('won_at', [$start, $end])->count() : null,
            'paidRevenue' => $can(Permission::ViewPayments) ? (float) Payment::query()->where('status', 'paid')->whereBetween('paid_at', [$start, $end])->sum('amount') : null,
        ];

        $labels = [];
        $customerTrend = [];
        $leadTrend = [];
        $revenueTrend = [];
        $cursor = $start->startOfMonth();
        while ($cursor->lessThanOrEqualTo($end)) {
            $monthEnd = $cursor->endOfMonth();
            $labels[] = $cursor->format('M Y');
            $customerTrend[] = $can(Permission::ViewCustomers) ? Customer::query()->whereBetween('created_at', [$cursor, $monthEnd])->count() : null;
            $leadTrend[] = $can(Permission::ViewLeads) ? Lead::query()->whereBetween('created_at', [$cursor, $monthEnd])->count() : null;
            $revenueTrend[] = $can(Permission::ViewPayments) ? (float) Payment::query()->where('status', 'paid')->whereBetween('paid_at', [$cursor, $monthEnd])->sum('amount') : null;
            $cursor = $cursor->addMonth();
        }

        $pipeline = [];
        if ($can(Permission::ViewLeads)) {
            $counts = Lead::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
            $pipeline = LeadStatusOption::query()->active()->orderBy('sort_order')->get(['name', 'slug', 'color'])->map(fn (LeadStatusOption $status): array => [
                'label' => $status->name,
                'value' => (int) ($counts[$status->slug] ?? 0),
                'color' => $status->color,
            ])->values()->all();
        }

        return Inertia::render('reports/index', [
            'period' => $period,
            'periodLabel' => $start->format('d M Y').' – '.$end->format('d M Y'),
            'stats' => $stats,
            'trend' => ['labels' => $labels, 'customers' => $customerTrend, 'leads' => $leadTrend, 'revenue' => $revenueTrend],
            'pipeline' => $pipeline,
            'can' => ['export' => $can(Permission::ViewCustomers) || $can(Permission::ViewLeads) || $can(Permission::ViewPayments)],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        abort_unless($user->can(Permission::ViewCustomers->value) || $user->can(Permission::ViewLeads->value) || $user->can(Permission::ViewPayments->value), 403);
        $period = in_array($request->string('period')->toString(), ['30d', '90d', '6m', '12m'], true) ? $request->string('period')->toString() : '6m';
        $end = CarbonImmutable::today()->endOfDay();
        $start = match ($period) {
            '30d' => $end->subDays(29)->startOfDay(),
            '90d' => $end->subDays(89)->startOfDay(),
            '12m' => $end->subMonths(11)->startOfMonth(),
            default => $end->subMonths(5)->startOfMonth(),
        };

        return response()->streamDownload(function () use ($user, $start, $end): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, ['Metric', 'Value', 'Period start', 'Period end']);
            if ($user->can(Permission::ViewCustomers->value)) fputcsv($handle, ['New customers', Customer::query()->whereBetween('created_at', [$start, $end])->count(), $start->toDateString(), $end->toDateString()]);
            if ($user->can(Permission::ViewLeads->value)) fputcsv($handle, ['New leads', Lead::query()->whereBetween('created_at', [$start, $end])->count(), $start->toDateString(), $end->toDateString()]);
            if ($user->can(Permission::ViewDeals->value)) fputcsv($handle, ['Won deals', Deal::query()->whereNotNull('won_at')->whereBetween('won_at', [$start, $end])->count(), $start->toDateString(), $end->toDateString()]);
            if ($user->can(Permission::ViewPayments->value)) fputcsv($handle, ['Paid revenue', (float) Payment::query()->where('status', 'paid')->whereBetween('paid_at', [$start, $end])->sum('amount'), $start->toDateString(), $end->toDateString()]);
            fclose($handle);
        }, 'crm-report-'.$start->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
