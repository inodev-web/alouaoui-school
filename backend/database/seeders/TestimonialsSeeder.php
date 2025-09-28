<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TestimonialsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testimonials = [
            [
                'name' => 'أحمد محمد',
                'opinion' => 'الدروس ممتازة جداً، ساعدتني في فهم الكيمياء بطريقة سهلة وممتعة. أنصح بها بشدة!',
                'image' => 'https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg',
                'rating' => 5.0,
                'order' => 1,
                'is_active' => true
            ],
            [
                'name' => 'فاطمة علي',
                'opinion' => 'أفضل معلم كيمياء! الشرح واضح والنتائج ممتازة. حصلت على أعلى الدرجات بفضله.',
                'image' => 'https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg',
                'rating' => 5.0,
                'order' => 2,
                'is_active' => true
            ],
            [
                'name' => 'محمد حسن',
                'opinion' => 'طريقة التدريس رائعة، جعلتني أحب الكيمياء. النتائج تتحدث عن نفسها!',
                'image' => 'https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg',
                'rating' => 5.0,
                'order' => 3,
                'is_active' => true
            ],
            [
                'name' => 'نور الدين',
                'opinion' => 'شرح ممتاز ومبسط، ساعدني في اجتياز الامتحان بدرجة عالية. شكراً جزيلاً!',
                'image' => 'https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg',
                'rating' => 5.0,
                'order' => 4,
                'is_active' => true
            ],
            [
                'name' => 'سارة أحمد',
                'opinion' => 'دروس رائعة ومفيدة جداً. المعلم يشرح بطريقة سهلة ومفهومة للجميع.',
                'image' => 'https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg',
                'rating' => 5.0,
                'order' => 5,
                'is_active' => true
            ],
            [
                'name' => 'يوسف محمود',
                'opinion' => 'أفضل استثمار في التعليم! النتائج واضحة والتحسن ملحوظ من أول درس.',
                'image' => 'https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg',
                'rating' => 5.0,
                'order' => 6,
                'is_active' => true
            ],
            [
                'name' => 'مريم خالد',
                'opinion' => 'دروس تفاعلية وممتعة، جعلتني أفهم الكيمياء بطريقة مختلفة تماماً.',
                'image' => 'https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg',
                'rating' => 5.0,
                'order' => 7,
                'is_active' => true
            ],
            [
                'name' => 'عبدالله سالم',
                'opinion' => 'شرح مميز وطريقة تدريس احترافية. أنصح جميع الطلاب بهذه الدروس.',
                'image' => 'https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg',
                'rating' => 5.0,
                'order' => 8,
                'is_active' => true
            ],
            [
                'name' => 'هند محمد',
                'opinion' => 'دروس رائعة ساعدتني في تحسين درجاتي بشكل كبير. شكراً للمجهود الرائع!',
                'image' => 'https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg',
                'rating' => 5.0,
                'order' => 9,
                'is_active' => true
            ],
            [
                'name' => 'خالد أحمد',
                'opinion' => 'أفضل معلم كيمياء في المنطقة! النتائج تتحدث عن نفسها والطلاب راضون جداً.',
                'image' => 'https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg',
                'rating' => 5.0,
                'order' => 10,
                'is_active' => true
            ]
        ];

        foreach ($testimonials as $testimonial) {
            Testimonial::create($testimonial);
        }
    }
}
