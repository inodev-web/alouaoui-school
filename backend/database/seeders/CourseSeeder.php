<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\Chapter;
use App\Models\Teacher;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        // Get teachers
        $alouaouiTeacher = Teacher::where('is_alouaoui_teacher', true)->first();
        $regularTeacher = Teacher::where('is_alouaoui_teacher', false)->first();

        if (!$alouaouiTeacher || !$regularTeacher) {
            echo "❌ Teachers not found. Please run AdminUserSeeder first.\n";
            return;
        }

        // Create Alouaoui chapter (Mathematics)
        if (!Chapter::where('title', 'Mathématiques 2AM')->exists()) {
            $mathChapter = Chapter::create([
                'title' => 'Mathématiques 2AM',
                'description' => 'Chapitre complet de mathématiques pour la 2ème année moyenne avec Prof. Alouaoui',
                'teacher_id' => $alouaouiTeacher->id,
                'year_target' => '2AM',
            ]);

            // Add courses (lessons) to the math chapter
            Course::create([
                'chapter_id' => $mathChapter->id,
                'title' => 'Les nombres relatifs - Cours 1',
                'video_ref' => 'https://example.com/math-ch1-cours1.mp4',
                'pdf_summary' => 'summaries/math_2am_nombres_relatifs.pdf',
                'exercises_pdf' => 'exercises/math_2am_nombres_relatifs_ex.pdf',
                'year_target' => '2AM',
            ]);

            Course::create([
                'chapter_id' => $mathChapter->id,
                'title' => 'Les fractions - Cours 1',
                'video_ref' => 'https://example.com/math-ch1-cours2.mp4',
                'pdf_summary' => 'summaries/math_2am_fractions.pdf',
                'exercises_pdf' => 'exercises/math_2am_fractions_ex.pdf',
                'year_target' => '2AM',
            ]);

            echo "✅ Mathématiques chapter and courses created\n";
        } else {
            echo "ℹ️  Mathématiques chapter already exists\n";
        }

        // Create regular teacher chapter (Physics - in-person only)
        if (!Chapter::where('title', 'Physique 2AM')->exists()) {
            $physicsChapter = Chapter::create([
                'title' => 'Physique 2AM',
                'description' => 'Chapitre de physique en présentiel uniquement',
                'teacher_id' => $regularTeacher->id,
                'year_target' => '2AM',
            ]);

            // Add courses to the physics chapter (no video for regular teacher)
            Course::create([
                'chapter_id' => $physicsChapter->id,
                'title' => 'La matière et ses états',
                'pdf_summary' => 'summaries/phys_2am_matiere.pdf',
                'exercises_pdf' => 'exercises/phys_2am_matiere_ex.pdf',
                'year_target' => '2AM',
            ]);

            Course::create([
                'chapter_id' => $physicsChapter->id,
                'title' => 'La force et le mouvement',
                'pdf_summary' => 'summaries/phys_2am_force.pdf',
                'exercises_pdf' => 'exercises/phys_2am_force_ex.pdf',
                'year_target' => '2AM',
            ]);

            echo "✅ Physique chapter and courses created\n";
        } else {
            echo "ℹ️  Physique chapter already exists\n";
        }

        // Create another Alouaoui chapter for 3AM
        if (!Chapter::where('title', 'Mathématiques 3AM')->exists()) {
            $math3Chapter = Chapter::create([
                'title' => 'Mathématiques 3AM',
                'description' => 'Chapitre avancé de mathématiques pour la 3ème année moyenne',
                'teacher_id' => $alouaouiTeacher->id,
                'year_target' => '3AM',
            ]);

            Course::create([
                'chapter_id' => $math3Chapter->id,
                'title' => 'Calcul littéral - Développement',
                'video_ref' => 'https://example.com/math3-developpement.mp4',
                'pdf_summary' => 'summaries/math_3am_calcul_litteral.pdf',
                'exercises_pdf' => 'exercises/math_3am_calcul_litteral_ex.pdf',
                'year_target' => '3AM',
            ]);

            echo "✅ Mathématiques 3AM chapter and courses created\n";
        } else {
            echo "ℹ️  Mathématiques 3AM chapter already exists\n";
        }
    }
}
