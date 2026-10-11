<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #334155;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 16px;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            padding: 32px 36px;
            text-align: center;
        }
        .logo {
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
            text-decoration: none;
            letter-spacing: -0.5px;
        }
        .logo-tag {
            font-size: 12px;
            color: #c7d2fe;
            margin-top: 4px;
            font-weight: 500;
        }
        .content {
            padding: 36px;
        }
        h1 {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 0;
            margin-bottom: 16px;
        }
        p {
            font-size: 15px;
            line-height: 1.6;
            margin: 0 0 16px 0;
            color: #475569;
        }
        .btn-wrapper {
            text-align: center;
            margin: 32px 0;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
            color: #ffffff !important;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
        .notice {
            background-color: #f1f5f9;
            border-radius: 10px;
            padding: 14px 18px;
            font-size: 13px;
            color: #64748b;
            margin-top: 24px;
            line-height: 1.5;
        }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding: 24px 36px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            background-color: #f8fafc;
        }
        .footer a {
            color: #6366f1;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <a href="{{ config('app.url') }}" class="logo">{{ $siteName }}</a>
                <div class="logo-tag">AI-Powered Resume Optimization</div>
            </div>
            <div class="content">
                <h1>{{ $greeting }}</h1>
                @foreach ($lines as $line)
                    <p>{{ $line }}</p>
                @endforeach

                @if (!empty($actionUrl) && !empty($actionText))
                    <div class="btn-wrapper">
                        <a href="{{ $actionUrl }}" class="btn" target="_blank">{{ $actionText }}</a>
                    </div>
                @endif

                @if (!empty($subcopy))
                    <div class="notice">
                        {{ $subcopy }}
                    </div>
                @endif
            </div>
            <div class="footer">
                <p style="margin: 0 0 6px 0;">&copy; {{ date('Y') }} {{ $siteName }}. All rights reserved.</p>
                <p style="margin: 0;">This email was sent to an account registered on <a href="{{ config('app.url') }}">{{ config('app.url') }}</a>.</p>
            </div>
        </div>
    </div>
</body>
</html>
