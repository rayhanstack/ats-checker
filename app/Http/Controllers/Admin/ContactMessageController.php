<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactMessageController extends Controller
{
    /**
     * Display a paginated listing of contact messages with filters.
     */
    public function index(Request $request): Response
    {
        $query = ContactMessage::query()->latest();

        // 1. Search
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        // 2. Status filter
        if ($status = $request->string('status', 'all')->toString()) {
            if (in_array($status, ['new', 'read', 'replied'])) {
                $query->where('status', $status);
            }
        }

        $messages = $query->paginate(15)
            ->withQueryString()
            ->through(fn (ContactMessage $msg) => [
                'id' => $msg->id,
                'name' => $msg->name,
                'email' => $msg->email,
                'subject' => $msg->subject,
                'message' => $msg->message,
                'status' => $msg->status,
                'ip' => $msg->ip,
                'created_at' => $msg->created_at->toISOString(),
                'formatted_date' => $msg->created_at->format('M j, Y • g:i A'),
            ]);

        return Inertia::render('Admin/ContactMessages/Index', [
            'messages' => $messages,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status', 'all')->toString(),
            ],
            'stats' => [
                'total' => ContactMessage::count(),
                'new' => ContactMessage::where('status', 'new')->count(),
                'read' => ContactMessage::where('status', 'read')->count(),
                'replied' => ContactMessage::where('status', 'replied')->count(),
            ],
        ]);
    }

    /**
     * Mark a message as read.
     */
    public function markRead(ContactMessage $contactMessage): RedirectResponse
    {
        if ($contactMessage->status === 'new') {
            $contactMessage->update(['status' => 'read']);

            AuditLogger::log('contact_message.mark_read', $contactMessage, [
                'subject' => $contactMessage->subject,
                'sender' => $contactMessage->email,
            ]);
        }

        return back()->with('success', 'Message marked as read.');
    }

    /**
     * Mark a message as replied.
     */
    public function markReplied(ContactMessage $contactMessage): RedirectResponse
    {
        $contactMessage->update(['status' => 'replied']);

        AuditLogger::log('contact_message.mark_replied', $contactMessage, [
            'subject' => $contactMessage->subject,
            'sender' => $contactMessage->email,
        ]);

        return back()->with('success', 'Message marked as replied.');
    }

    /**
     * Delete a contact message.
     */
    public function destroy(ContactMessage $contactMessage): RedirectResponse
    {
        AuditLogger::log('contact_message.delete', $contactMessage, [
            'subject' => $contactMessage->subject,
            'sender' => $contactMessage->email,
        ]);

        $contactMessage->delete();

        return back()->with('success', 'Contact message deleted.');
    }
}
