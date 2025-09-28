<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use App\Http\Requests\StoreTestimonialRequest;
use App\Http\Requests\UpdateTestimonialRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    /**
     * Display a listing of testimonials for public use
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $testimonials = Testimonial::where('is_active', true)
                ->select(['id', 'name', 'image', 'opinion', 'rating'])
                ->orderBy('order')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $testimonials
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des témoignages'
            ], 500);
        }
    }

    /**
     * Display a listing of testimonials for admin (all testimonials)
     */
    public function adminIndex(Request $request): JsonResponse
    {
        try {
            $testimonials = Testimonial::orderBy('order')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $testimonials,
                'meta' => [
                    'total' => $testimonials->count(),
                    'active' => $testimonials->where('is_active', true)->count(),
                    'inactive' => $testimonials->where('is_active', false)->count()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des témoignages'
            ], 500);
        }
    }

    /**
     * Store a newly created testimonial
     */
    public function store(StoreTestimonialRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            // Handle image upload if provided
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('testimonials', 'public');
                $data['image'] = '/storage/' . $imagePath;
            }

            // Set order to the next available position if not provided
            if (!isset($data['order'])) {
                $data['order'] = Testimonial::max('order') + 1;
            }

            $testimonial = Testimonial::create($data);

            return response()->json([
                'success' => true,
                'data' => $testimonial,
                'message' => 'Témoignage créé avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du témoignage',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Display the specified testimonial
     */
    public function show(Testimonial $testimonial): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $testimonial
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Témoignage non trouvé'
            ], 404);
        }
    }

    /**
     * Update the specified testimonial
     */
    public function update(UpdateTestimonialRequest $request, Testimonial $testimonial): JsonResponse
    {
        try {
            $data = $request->validated();

            // Handle image upload if provided
            if ($request->hasFile('image')) {
                // Delete old image if it exists
                if ($testimonial->image && file_exists(public_path($testimonial->image))) {
                    unlink(public_path($testimonial->image));
                }

                $imagePath = $request->file('image')->store('testimonials', 'public');
                $data['image'] = '/storage/' . $imagePath;
            }

            $testimonial->update($data);

            return response()->json([
                'success' => true,
                'data' => $testimonial->fresh(),
                'message' => 'Témoignage mis à jour avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du témoignage',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Remove the specified testimonial
     */
    public function destroy(Testimonial $testimonial): JsonResponse
    {
        try {
            // Delete image file if it exists
            if ($testimonial->image && file_exists(public_path($testimonial->image))) {
                unlink(public_path($testimonial->image));
            }

            $testimonial->delete();

            return response()->json([
                'success' => true,
                'message' => 'Témoignage supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du témoignage',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Toggle testimonial status (active/inactive)
     */
    public function toggleStatus(Testimonial $testimonial): JsonResponse
    {
        try {
            $testimonial->update([
                'is_active' => !$testimonial->is_active
            ]);

            return response()->json([
                'success' => true,
                'data' => $testimonial->fresh(),
                'message' => 'Statut du témoignage mis à jour avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du statut',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Reorder testimonials
     */
    public function reorder(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'testimonials' => 'required|array',
                'testimonials.*.id' => 'required|exists:testimonials,id',
                'testimonials.*.order' => 'required|integer|min:1'
            ]);

            foreach ($request->testimonials as $item) {
                Testimonial::where('id', $item['id'])
                    ->update(['order' => $item['order']]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Ordre des témoignages mis à jour avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réorganisation des témoignages',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}