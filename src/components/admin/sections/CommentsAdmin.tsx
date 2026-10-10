import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../api/client';
import type { CommentData } from '../../../api/hooks';
import { Button } from '@oxy.so/bloom/button';
import { Pagination } from '@oxy.so/bloom/pagination';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control';

type StatusFilter = '' | 'visible' | 'hidden' | 'deleted';

/** A segmented control reads '' as "nothing selected", so "All" has a value of its own here. */
const ALL_STATUSES = 'all';

interface CommentQueueResponse {
  comments: CommentData[];
  total: number;
  page: number;
  pages: number;
}

export default function CommentsAdmin() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isPending } = useQuery({
    queryKey: ['admin-comments', statusFilter, currentPage],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(currentPage), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      return apiFetch<CommentQueueResponse>(`/comments/admin/queue?${params}`);
    },
  });

  const moderate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/comments/${id}/moderate`, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
    },
  });

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: '' },
    { label: 'Visible', value: 'visible' },
    { label: 'Hidden', value: 'hidden' },
    { label: 'Deleted', value: 'deleted' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Comments</h2>
      <p className="mt-1 text-sm text-muted-foreground">{data?.total ?? 0} comments total</p>

      {/* Status tabs */}
      <SegmentedControl
        label="Status"
        type="radio"
        value={statusFilter || ALL_STATUSES}
        onValueChange={(next) => {
          setStatusFilter(next === ALL_STATUSES ? '' : (next as StatusFilter));
          setCurrentPage(1);
        }}
        style={{ marginTop: 16, alignSelf: 'flex-start' }}
      >
        {tabs.map((tab) => (
          <SegmentedControlItem key={tab.value} value={tab.value || ALL_STATUSES}>
            <SegmentedControlItemText>{tab.label}</SegmentedControlItemText>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>

      {/* Comment list */}
      <div className="mt-6 flex flex-col gap-3">
        {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}

        {data?.comments.map((comment) => (
          <div key={comment._id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">@{comment.username}</span>
                  <span className="text-muted-foreground">
                    on {comment.targetType}/{comment.targetId}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      comment.status === 'visible'
                        ? 'bg-success-subtle text-success-text'
                        : comment.status === 'hidden'
                          ? 'bg-warning-subtle text-warning-text'
                          : 'bg-error-subtle text-error-text'
                    }`}
                  >
                    {comment.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground line-clamp-2">{comment.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleString()}
                  {comment.editedAt && ' (edited)'}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {comment.status === 'visible' && (
                  <Button
                    appearance="subtle"
                    onPress={() => moderate.mutate({ id: comment._id, status: 'hidden' })}
                  >
                    Hide
                  </Button>
                )}
                {comment.status === 'hidden' && (
                  <Button
                    appearance="subtle"
                    onPress={() => moderate.mutate({ id: comment._id, status: 'visible' })}
                  >
                    Unhide
                  </Button>
                )}
                {comment.status !== 'deleted' && (
                  <Button
                    appearance="subtle"
                    onPress={() => moderate.mutate({ id: comment._id, status: 'deleted' })}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {!isPending && data?.comments.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No comments found.</p>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <Pagination
          page={currentPage}
          totalPages={data.pages}
          onChange={setCurrentPage}
          style={{ marginTop: 24 }}
        />
      )}
    </div>
  );
}
