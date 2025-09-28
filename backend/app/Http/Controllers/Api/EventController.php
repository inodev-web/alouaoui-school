<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Teacher;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EventController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display active events for slider (Public access)
     */
    public function slider()
    {
        $events = Event::with('teacher')
            ->active()
            ->current()
            ->ordered()
            ->get()
            ->map(function ($event) {
                // Utiliser le guard 'sanctum' pour éviter les problèmes avec le guard web
                $user = Auth::guard('sanctum')->user();
                $isAuthenticated = !is_null($user);
                
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'slider_image_url' => $event->slider_image_url,
                    'alt_text' => $event->alt_text,
                    'event_type' => $event->event_type,
                    'redirect_url' => $event->getRedirectUrl(),
                    'requires_subscription' => $event->requires_subscription,
                    'teacher_name' => $event->teacher->name,
                    'can_access' => $isAuthenticated ? $event->canUserAccess($user) : false,
                    'access_message' => $event->access_message,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }

    /**
     * Check access for specific event
     */
    public function checkAccess(Event $event)
    {
        $user = Auth::user();
        
        if (!$event->requires_subscription) {
            return response()->json([
                'success' => true,
                'can_access' => true,
                'redirect_url' => $event->getRedirectUrl(),
                'message' => 'Accès libre à cet événement',
            ]);
        }

        $canAccess = $event->canUserAccess($user);
        
        if ($canAccess) {
            return response()->json([
                'success' => true,
                'can_access' => true,
                'redirect_url' => $event->getRedirectUrl(),
                'message' => 'Vous pouvez accéder à cet événement',
            ]);
        }

        return response()->json([
            'success' => false,
            'can_access' => false,
            'redirect_url' => '/student/subscriptions',
            'message' => $event->access_message ?: 'Vous devez avoir un abonnement actif pour accéder à cet événement',
        ], 403);
    }

    /**
     * Display a listing of events (Admin only)
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Event::class);

        $query = Event::with('teacher');

        // Filter by type
        if ($request->filled('type')) {
            $query->ofType($request->type);
        }

        // Filter by active status
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by teacher
        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        // Search by title or description
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $events = $query->orderBy('order_index')
                       ->orderBy('start_date', 'desc')
                       ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }

    /**
     * Store a newly created event (Alouaoui only)
     */
    public function store(Request $request)
    {
        $this->authorize('create', Event::class);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'slider_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'alt_text' => 'nullable|string|max:255',
            'event_type' => ['required', Rule::in(Event::EVENT_TYPES)],
            'teacher_id' => 'required|exists:teachers,id',
            'target_id' => 'nullable|integer',
            'redirect_url' => 'nullable|url',
            'requires_subscription' => 'boolean',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'order_index' => 'integer|min:0',
            'access_message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Upload slider image
        $imagePath = $request->file('slider_image')->store('events/sliders', 'public');

        $event = Event::create([
            'title' => $request->title,
            'description' => $request->description,
            'slider_image' => $imagePath,
            'alt_text' => $request->alt_text,
            'event_type' => $request->event_type,
            'teacher_id' => $request->teacher_id,
            'target_id' => $request->target_id,
            'redirect_url' => $request->redirect_url,
            'requires_subscription' => $request->boolean('requires_subscription', true),
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_active' => true,
            'order_index' => $request->get('order_index', 0),
            'access_message' => $request->access_message,
        ]);

        $event->load('teacher');

        return response()->json([
            'success' => true,
            'data' => $event,
            'message' => 'Événement créé avec succès',
        ], 201);
    }

    /**
     * Display the specified event
     */
    public function show(Event $event)
    {
        $this->authorize('view', $event);

        $event->load('teacher');
        
        return response()->json([
            'success' => true,
            'data' => $event,
        ]);
    }

    /**
     * Update the specified event (Alouaoui only)
     */
    public function update(Request $request, Event $event)
    {
        $this->authorize('update', $event);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string|max:1000',
            'slider_image' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:2048',
            'alt_text' => 'nullable|string|max:255',
            'event_type' => ['sometimes', 'required', Rule::in(Event::EVENT_TYPES)],
            'teacher_id' => 'sometimes|required|exists:teachers,id',
            'target_id' => 'nullable|integer',
            'redirect_url' => 'nullable|url',
            'requires_subscription' => 'boolean',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'order_index' => 'integer|min:0',
            'access_message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $updateData = $request->except(['slider_image']);

        // Handle image update
        if ($request->hasFile('slider_image')) {
            // Delete old image
            if ($event->slider_image) {
                Storage::disk('public')->delete($event->slider_image);
            }
            
            // Upload new image
            $updateData['slider_image'] = $request->file('slider_image')->store('events/sliders', 'public');
        }

        $event->update($updateData);
        $event->load('teacher');

        return response()->json([
            'success' => true,
            'data' => $event,
            'message' => 'Événement mis à jour avec succès',
        ]);
    }

    /**
     * Remove the specified event (Alouaoui only)
     */
    public function destroy(Event $event)
    {
        $this->authorize('delete', $event);

        // Delete slider image
        if ($event->slider_image) {
            Storage::disk('public')->delete($event->slider_image);
        }

        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Événement supprimé avec succès',
        ]);
    }

    /**
     * Toggle event active status
     */
    public function toggleStatus(Event $event)
    {
        $this->authorize('update', $event);

        $event->update(['is_active' => !$event->is_active]);

        return response()->json([
            'success' => true,
            'data' => $event,
            'message' => $event->is_active ? 'Événement activé' : 'Événement désactivé',
        ]);
    }

    /**
     * Reorder events
     */
    public function reorder(Request $request)
    {
        $this->authorize('create', Event::class);

        $validator = Validator::make($request->all(), [
            'events' => 'required|array',
            'events.*.id' => 'required|exists:events,id',
            'events.*.order_index' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        foreach ($request->events as $eventData) {
            Event::where('id', $eventData['id'])
                 ->update(['order_index' => $eventData['order_index']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ordre des événements mis à jour avec succès',
        ]);
    }
}
