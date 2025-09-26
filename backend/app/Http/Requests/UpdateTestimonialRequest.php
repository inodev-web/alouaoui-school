<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTestimonialRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin users can update testimonials
        return $this->user() && $this->user()->tokenCan('admin');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'opinion' => 'sometimes|required|string|max:1000',
            'image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'rating' => 'nullable|numeric|min:1|max:5',
            'is_active' => 'nullable|boolean',
            'order' => 'nullable|integer|min:1'
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'nom',
            'opinion' => 'avis',
            'image' => 'image',
            'rating' => 'note',
            'is_active' => 'statut actif',
            'order' => 'ordre'
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom est obligatoire.',
            'name.max' => 'Le nom ne peut pas dépasser 255 caractères.',
            'opinion.required' => 'L\'avis est obligatoire.',
            'opinion.max' => 'L\'avis ne peut pas dépasser 1000 caractères.',
            'image.image' => 'Le fichier doit être une image.',
            'image.mimes' => 'L\'image doit être au format JPEG, JPG, PNG ou WebP.',
            'image.max' => 'L\'image ne peut pas dépasser 2MB.',
            'rating.numeric' => 'La note doit être un nombre.',
            'rating.min' => 'La note minimum est 1.',
            'rating.max' => 'La note maximum est 5.',
            'order.integer' => 'L\'ordre doit être un nombre entier.',
            'order.min' => 'L\'ordre minimum est 1.'
        ];
    }
}