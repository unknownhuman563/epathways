@php
    /*
     | Shared shell for every user dashboard under resources/views/users/<dept>/.
     | Pass `$portal` (the department key) when rendering the view; everything
     | else — label, accent colour, sidebar links — is looked up here.
     */
    $portal = $portal ?? 'sales';

    $portalConfig = [
        'sales' => [
            'label' => 'Sales', 'subtitle' => 'Sales Portal', 'accent' => 'bg-blue-600',
            'nav' => [
                ['label' => 'Dashboard', 'url' => '/portal/sales/dashboard'],
                ['label' => 'Leads',     'url' => '/portal/sales/leads'],
                ['label' => 'Bookings',  'url' => '/portal/sales/bookings'],
            ],
        ],
        'education'     => ['label' => 'Education',      'subtitle' => 'Education Portal',      'accent' => 'bg-indigo-600',  'nav' => [['label' => 'Dashboard', 'url' => '/portal/education/dashboard']]],
        'english'       => ['label' => 'English',        'subtitle' => 'English Portal',        'accent' => 'bg-emerald-600', 'nav' => [['label' => 'Dashboard', 'url' => '/portal/english/dashboard']]],
        'immigration'   => ['label' => 'Immigration',    'subtitle' => 'Immigration Portal',    'accent' => 'bg-amber-600',   'nav' => [['label' => 'Dashboard', 'url' => '/portal/immigration/dashboard']]],
        'accommodation' => ['label' => 'Accommodation',  'subtitle' => 'Accommodation Portal',  'accent' => 'bg-rose-600',    'nav' => [['label' => 'Dashboard', 'url' => '/portal/accommodation/dashboard']]],
    ];

    $meta = $portalConfig[$portal] ?? ['label' => ucfirst($portal), 'subtitle' => 'Portal', 'accent' => 'bg-gray-800', 'nav' => [['label' => 'Dashboard', 'url' => "/portal/{$portal}/dashboard"]]];
    $user = auth()->user();
    $active = fn ($url) => request()->is(ltrim($url, '/')) ? true : false;
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" type="image/png" href="{{ asset('favicon.png') }}">
    <title>@yield('title', $meta['label'] . ' Dashboard') — ePathways</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css'])
</head>
<body class="bg-[#F5F5F7] text-gray-900 antialiased min-h-screen">
<div class="flex min-h-screen">
    {{-- Sidebar --}}
    <aside class="hidden lg:flex flex-col w-64 shrink-0 p-4">
        <div class="bg-white rounded-3xl shadow-sm border border-gray-50 flex-1 flex flex-col overflow-hidden">
            <div class="px-6 py-6">
                <a href="{{ url('/') }}" class="text-2xl font-black tracking-tighter text-gray-900">ePathways.</a>
                <p class="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{{ $meta['subtitle'] }}</p>
            </div>
            <nav class="flex-1 px-4 py-2 flex flex-col gap-1">
                @foreach ($meta['nav'] as $link)
                    @php $isActive = $active($link['url']); @endphp
                    <a href="{{ url($link['url']) }}"
                       class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors {{ $isActive ? 'bg-gray-100/80 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' }}">
                        <span class="w-1.5 h-1.5 rounded-full {{ $isActive ? $meta['accent'] : 'bg-gray-300' }}"></span>
                        {{ $link['label'] }}
                    </a>
                @endforeach
            </nav>
            <div class="px-4 py-4 border-t border-gray-50">
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors text-left">
                        Log out
                    </button>
                </form>
            </div>
        </div>
    </aside>

    {{-- Main column --}}
    <div class="flex-1 flex flex-col min-w-0">
        <header class="px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
            <div class="min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 lg:hidden">{{ $meta['subtitle'] }}</p>
                <h1 class="text-2xl font-bold text-gray-900 tracking-tight truncate">@yield('heading', $meta['label'] . ' Dashboard')</h1>
                @hasSection('subheading')<p class="text-sm text-gray-500">@yield('subheading')</p>@endif
            </div>
            <div class="flex items-center gap-2.5 shrink-0">
                <div class="text-right hidden sm:block leading-tight">
                    <p class="text-sm font-semibold text-gray-900">{{ $user?->name ?? 'User' }}</p>
                    <p class="text-[11px] text-gray-500 capitalize">{{ $user?->role ?? 'staff' }}</p>
                </div>
                <div class="w-9 h-9 rounded-full {{ $meta['accent'] }} text-white flex items-center justify-center text-sm font-bold ring-2 ring-white">
                    {{ strtoupper(substr($user?->name ?? 'U', 0, 1)) }}
                </div>
            </div>
        </header>

        <main class="flex-1 px-4 sm:px-8 pb-10 pt-2">
            @if (session('success'))
                <div class="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
                    {{ session('success') }}
                </div>
            @endif
            @if (session('error') || $errors->any())
                <div class="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                    {{ session('error') ?? $errors->first() }}
                </div>
            @endif

            @yield('content')
        </main>
    </div>
</div>
</body>
</html>
