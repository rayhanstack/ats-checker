<?php

namespace App\Services;

use App\Exceptions\ResumeExtractionException;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpWord\Element\Table;
use PhpOffice\PhpWord\Element\Text;
use PhpOffice\PhpWord\Element\TextRun;
use PhpOffice\PhpWord\IOFactory;
use Smalot\PdfParser\Parser;
use Throwable;
use ZipArchive;

class ResumeTextExtractor
{
    /**
     * Minimum acceptable character length for extracted resume text.
     */
    protected const MIN_TEXT_LENGTH = 50;

    /**
     * Maximum character length to store.
     */
    protected const MAX_TEXT_LENGTH = 50000;

    /**
     * Extract and normalize text from a resume file.
     *
     * @param string $filePath Absolute path to the file
     * @param string $extension File extension (pdf, docx)
     * @return string Normalized extracted text
     *
     * @throws ResumeExtractionException
     */
    public function extract(string $filePath, string $extension): string
    {
        if (! file_exists($filePath)) {
            throw new ResumeExtractionException('Uploaded file could not be located on disk.');
        }

        $extension = strtolower(trim($extension, '. '));

        $rawText = match ($extension) {
            'pdf' => $this->extractFromPdf($filePath),
            'docx' => $this->extractFromDocx($filePath),
            default => throw new ResumeExtractionException("Unsupported file format: .{$extension}. Only PDF and DOCX files are allowed."),
        };

        $normalized = $this->normalizeText($rawText);

        if (mb_strlen($normalized) < self::MIN_TEXT_LENGTH) {
            // TODO: Hook for future OCR processing (Tesseract / AWS Textract / Google Cloud Vision)
            // for scanned or image-only PDF resumes that contain no selectable text layer.
            Log::info('Resume extraction text length below minimum threshold', [
                'path' => $filePath,
                'extension' => $extension,
                'extracted_length' => mb_strlen($normalized),
            ]);

            throw new ResumeExtractionException(
                'The uploaded document contains too little selectable text. It may be an image-only or scanned document. Please upload a standard text-based PDF or DOCX resume.'
            );
        }

        return $normalized;
    }

    /**
     * Extract raw text from PDF.
     */
    protected function extractFromPdf(string $filePath): string
    {
        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($filePath);

            return (string) $pdf->getText();
        } catch (Throwable $e) {
            Log::warning('PDF extraction failed', [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ]);

            throw new ResumeExtractionException(
                'Unable to parse this PDF file. It may be password-protected, encrypted, or corrupted.'
            );
        }
    }

    /**
     * Extract raw text from DOCX document.
     */
    protected function extractFromDocx(string $filePath): string
    {
        $text = '';

        try {
            $phpWord = IOFactory::load($filePath, 'Word2007');

            foreach ($phpWord->getSections() as $section) {
                foreach ($section->getElements() as $element) {
                    $text .= $this->extractElementText($element) . "\n";
                }
            }
        } catch (Throwable $e) {
            Log::info('PhpWord extraction threw exception, attempting ZipArchive XML fallback', [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ]);
        }

        // Fallback using direct document.xml extraction if PhpWord produced empty string
        if (empty(trim($text))) {
            $zip = new ZipArchive();
            if ($zip->open($filePath) === true) {
                if (($index = $zip->locateName('word/document.xml')) !== false) {
                    $xml = $zip->getFromIndex($index);
                    if ($xml !== false) {
                        $xmlWithBreaks = str_replace(
                            ['</w:p>', '</w:tr>', '<w:tab/>', '<w:br/>'],
                            ["\n", "\n", "\t", "\n"],
                            $xml
                        );
                        $text = strip_tags($xmlWithBreaks);
                    }
                }
                $zip->close();
            }
        }

        if (empty(trim($text))) {
            throw new ResumeExtractionException(
                'Unable to parse this Word (DOCX) document. It may be corrupted or password-protected.'
            );
        }

        return $text;
    }

    /**
     * Recursively extract text from PhpWord elements.
     */
    protected function extractElementText(mixed $element): string
    {
        $text = '';

        if ($element instanceof Text) {
            $text .= $element->getText() . ' ';
        } elseif ($element instanceof TextRun) {
            foreach ($element->getElements() as $child) {
                $text .= $this->extractElementText($child);
            }
        } elseif ($element instanceof Table) {
            foreach ($element->getRows() as $row) {
                foreach ($row->getCells() as $cell) {
                    foreach ($cell->getElements() as $child) {
                        $text .= $this->extractElementText($child);
                    }
                    $text .= "\t";
                }
                $text .= "\n";
            }
        }

        return $text;
    }

    /**
     * Normalize extracted text:
     * - Strip non-printable control characters
     * - Collapse horizontal spaces/tabs
     * - Normalize line breaks and multiple consecutive newlines
     * - Cap length at max limit
     */
    public function normalizeText(string $text, int $maxLength = self::MAX_TEXT_LENGTH): string
    {
        // Strip control characters except tab and newline
        $clean = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? $text;

        // Normalize carriage returns to newlines
        $clean = str_replace(["\r\n", "\r"], "\n", $clean);

        // Collapse horizontal whitespace (spaces, tabs)
        $clean = preg_replace('/[ \t]+/u', ' ', $clean) ?? $clean;

        // Collapse excessive blank lines
        $clean = preg_replace('/\n{3,}/u', "\n\n", $clean) ?? $clean;

        $clean = trim($clean);

        // Cap length
        if (mb_strlen($clean) > $maxLength) {
            $clean = mb_substr($clean, 0, $maxLength);
        }

        return $clean;
    }
}
