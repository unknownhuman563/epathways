<?php

namespace Database\Seeders;

use App\Models\Property;
use Illuminate\Database\Seeder;

class PropertySeeder extends Seeder
{
    public function run(): void
    {
        $samples = [
            [
                'name' => 'Mt Roskill Student House',
                'location' => 'Auckland, NZ',
                'room_type' => 'single',
                'has_wardrobe' => true,
                'bed_type' => 'single',
                'bathroom_type' => 'shared',
                'includes' => 'The house also includes shared kitchen and living areas with a fridge, microwave, couch, TV, washing machine, and dining table.',
                'rent_single' => 250,
                'rent_couple' => 300,
                'bills_excluded' => true,
                'description' => 'A friendly shared home minutes from public transport, ideal for students.',
                'status' => 'available',
            ],
            [
                'name' => 'Epsom Ensuite Room',
                'location' => 'Auckland, NZ',
                'room_type' => 'ensuite',
                'has_wardrobe' => true,
                'bed_type' => 'double',
                'bathroom_type' => 'private',
                'includes' => 'Private ensuite plus shared kitchen with fridge, microwave, washing machine, and dining area.',
                'rent_single' => 320,
                'rent_couple' => 380,
                'bills_excluded' => true,
                'description' => 'Quiet ensuite room with private bathroom in a well-kept home.',
                'status' => 'available',
            ],
        ];

        foreach ($samples as $sample) {
            Property::firstOrCreate(['name' => $sample['name']], $sample);
        }
    }
}
