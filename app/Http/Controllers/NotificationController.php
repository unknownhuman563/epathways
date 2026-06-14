<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/**
 * Read path for the in-app notification inbox. Notifications are written
 * by the various App\Notifications\* classes through Laravel's database
 * channel; this controller surfaces them to the current user (bell
 * dropdown + full page) and handles read/dismiss actions.
 *
 * Routes are role-agnostic (auth only) — every authenticated user reads
 * their own notifications, scoped via the Notifiable relations so there
 * is no cross-user leak.
 */
class NotificationController extends Controller
{
    private const RECENT_LIMIT = 10;

    /** Full paginated inbox page. Filter: all | unread | read. */
    public function index(Request $request)
    {
        $user = $request->user();
        $filter = in_array($request->query('filter'), ['unread', 'read'], true)
            ? $request->query('filter')
            : 'all';

        $source = match ($filter) {
            'unread' => $user->unreadNotifications(),
            'read'   => $user->readNotifications(),
            default  => $user->notifications(),
        };

        $notifications = $source
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($n) => $this->serialize($n));

        return inertia('notifications/Index', [
            'notifications' => $notifications,
            'filter'        => $filter,
            'counts'        => [
                'all'    => $user->notifications()->count(),
                'unread' => $user->unreadNotifications()->count(),
                'read'   => $user->readNotifications()->count(),
            ],
        ]);
    }

    /** Recent 10 (read + unread) for the bell dropdown. */
    public function recent(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'notifications' => $user->notifications()
                ->latest()
                ->limit(self::RECENT_LIMIT)
                ->get()
                ->map(fn ($n) => $this->serialize($n))
                ->values(),
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    /** Lightweight count endpoint (for future polling). */
    public function unreadCount(Request $request)
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAsRead(Request $request, string $id)
    {
        // Scoped to the user's own notifications — findOrFail 404s on
        // someone else's id, so there's no cross-user mutation.
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return $this->respond($request, ['ok' => true]);
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->respond($request, ['ok' => true]);
    }

    public function destroy(Request $request, string $id)
    {
        $request->user()->notifications()->findOrFail($id)->delete();

        return $this->respond($request, ['ok' => true]);
    }

    /** Return JSON for XHR callers, otherwise redirect back for Inertia. */
    private function respond(Request $request, array $payload)
    {
        if ($request->wantsJson()) {
            return response()->json($payload);
        }

        return back();
    }

    /**
     * Shape one notification row for the frontend. Commit 2 enriches this
     * with NotificationFormatter (icon/color/title/url). For now it returns
     * the raw stored data plus read state.
     */
    private function serialize($n): array
    {
        return [
            'id'         => $n->id,
            'type'       => class_basename($n->type),
            'data'       => $n->data,
            'is_read'    => $n->read_at !== null,
            'read_at'    => optional($n->read_at)?->toIso8601String(),
            'created_at' => optional($n->created_at)?->toIso8601String(),
        ];
    }
}
