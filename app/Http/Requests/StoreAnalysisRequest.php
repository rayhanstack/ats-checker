<?php

namespace App\Http\Requests;

use App\Services\SettingsService;
use Illuminate\Foundation\Http\FormRequest;

class StoreAnalysisRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $maxMb = (int) SettingsService::get('max_upload_mb', 5);
        $maxKb = $maxMb * 1024;
        $allowedExtensions = (string) SettingsService::get('allowed_file_types', 'pdf,docx');
        $maxJdChars = (int) SettingsService::get('max_jd_chars', 15000);

        return [
            'resume' => [
                'required',
                'file',
                "max:{$maxKb}",
                "mimes:{$allowedExtensions}",
            ],
            'jd_text' => [
                'required',
                'string',
                'min:30',
                "max:{$maxJdChars}",
            ],
            'job_title' => [
                'nullable',
                'string',
                'max:255',
            ],
            'job_company' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $maxMb = SettingsService::get('max_upload_mb', 5);
        $maxJdChars = SettingsService::get('max_jd_chars', 15000);

        return [
            'resume.required' => 'Please upload your resume file (PDF or DOCX).',
            'resume.file' => 'The uploaded file is invalid.',
            'resume.max' => "Your resume exceeds the maximum allowed file size of {$maxMb}MB.",
            'resume.mimes' => 'Only PDF and DOCX documents are supported.',
            'jd_text.required' => 'Please paste the job description text.',
            'jd_text.min' => 'The job description must be at least 30 characters long.',
            'jd_text.max' => "The job description may not exceed {$maxJdChars} characters.",
        ];
    }
}
