<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Contact Inquiry</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px;">New Contact Message Received</h2>
    <p><strong>From:</strong> {{ $name }} (&lt;{{ $email }}&gt;)</p>
    <p><strong>Subject:</strong> {{ $subjectLine }}</p>
    <p><strong>Date:</strong> {{ $date }}</p>
    <p><strong>IP Address:</strong> {{ $ip ?? 'N/A' }}</p>
    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <h3>Message Content:</h3>
    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap;">
        {{ $content }}
    </div>
</body>
</html>
