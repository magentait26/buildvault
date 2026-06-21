<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprovalResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'priority' => $this->priority,
            'status' => $this->status,
            'initiated_by' => new UserResource($this->whenLoaded('initiator')),
            'document' => new DocumentResource($this->whenLoaded('document')),
            'comments' => $this->whenLoaded('comments', function() {
                return $this->comments->map(function($comment) {
                    return [
                        'id' => $comment->id,
                        'comment' => $comment->comment,
                        'user' => new UserResource($comment->user),
                        'created_at' => $comment->created_at?->toIso8601String(),
                    ];
                });
            }),
            'reviewers_progress' => $this->whenLoaded('approvals', function() {
                return $this->approvals->map(function($signOff) {
                    return [
                        'id' => $signOff->id,
                        'status' => $signOff->status,
                        'signed_at' => $signOff->signed_at?->toIso8601String(),
                        'rejection_reason' => $signOff->rejection_reason,
                        'approver' => new UserResource($signOff->approver),
                    ];
                });
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
