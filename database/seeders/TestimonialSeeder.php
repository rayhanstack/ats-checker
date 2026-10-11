<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testimonials = [
            [
                'name' => 'Elena Rostova',
                'role' => 'Senior Frontend Engineer',
                'company' => 'TechFlow Labs',
                'avatar_url' => null,
                'content' => 'I applied to 40+ engineering roles with almost zero callbacks. After running my resume through ATS Checker, I discovered my skills section was missing 5 major framework keywords mentioned in every posting. Within 2 weeks of applying with the revised CV, I got 4 interview requests!',
                'rating' => 5,
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'David Kim',
                'role' => 'Product Marketing Lead',
                'company' => 'Stratos Growth',
                'avatar_url' => null,
                'content' => 'The line-by-line bullet rewriting feature is pure gold. It did not just say "add metrics" — it showed me exactly how to quantify my campaign achievements. My ATS score went from 54 to 92.',
                'rating' => 5,
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Maya Patel',
                'role' => 'Data Analyst',
                'company' => 'Apex Financial',
                'avatar_url' => null,
                'content' => 'Super clean UI and blazing fast analysis. I used the 7-day free trial and optimized my CV for 3 different job titles. Hands down the most transparent career tool I have used.',
                'rating' => 5,
                'sort_order' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($testimonials as $testimonial) {
            Testimonial::query()->updateOrCreate(
                ['name' => $testimonial['name']],
                $testimonial
            );
        }
    }
}
