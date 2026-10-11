<?php

namespace App\Http\Middleware;

use App\Services\AccessService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserCanAnalyze
{
    public function __construct(protected AccessService $accessService)
    {
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Please log in to analyze your resume.'], 401);
            }

            return redirect()->route('login')->with('info', 'Please log in to upload your resume.');
        }

        if (! $this->accessService->canAnalyze($user)) {
            $reason = $this->accessService->reasonDenied($user);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $reason,
                    'redirect' => route('pricing'),
                ], 403);
            }

            return redirect()->route('pricing')->with('error', $reason);
        }

        return $next($request);
    }
}
