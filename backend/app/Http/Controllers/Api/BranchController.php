<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BranchController extends Controller
{
    /**
     * Get all branches
     */
    public function index(): JsonResponse
    {
        $branches = Branch::active()
            ->orderBy('year_level')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $branches
        ]);
    }

    /**
     * Get branches for a specific year level
     */
    public function getForYearLevel(string $yearLevel): JsonResponse
    {
        $branches = Branch::getForYearLevel($yearLevel);

        return response()->json([
            'success' => true,
            'data' => $branches
        ]);
    }

    /**
     * Get a specific branch
     */
    public function show(Branch $branch): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $branch
        ]);
    }
}
