import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Reply, ThumbsUp, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  likes: number;
  hasLiked: boolean;
  replies?: Comment[];
  mentions?: string[]; // User IDs mentioned
}

interface CommentsThreadProps {
  comments: Comment[];
  currentUserId: string;
  onAddComment: (content: string, parentId?: string) => void;
  onLikeComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, content: string) => void;
}

export function CommentsThread({
  comments,
  currentUserId,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  onEditComment,
}: CommentsThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleSubmitReply = (parentId: string) => {
    if (replyContent.trim()) {
      onAddComment(replyContent, parentId);
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const isOwnComment = comment.author.id === currentUserId;

    return (
      <div className={`${isReply ? 'ml-12 mt-3' : ''}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getInitials(comment.author.name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className="font-semibold text-sm">{comment.author.name}</span>
                  {isOwnComment && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwnComment && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onEditComment(comment.id, comment.content)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                    {!isOwnComment && <DropdownMenuItem>Report</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{formatDistanceToNow(comment.timestamp, { addSuffix: true })}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => onLikeComment(comment.id)}
              >
                <ThumbsUp
                  className={`h-3 w-3 mr-1 ${comment.hasLiked ? 'fill-current text-primary' : ''}`}
                />
                {comment.likes > 0 && comment.likes}
              </Button>
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${comment.author.name}...`}
                  rows={2}
                  className="text-sm"
                />
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent.trim()}
                  >
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} isReply />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Comments {comments.length > 0 && `(${comments.length})`}</h3>
      </div>

      {/* New Comment Form */}
      <Card className="p-4">
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... (Use @ to mention someone)"
            rows={3}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Tip: Use @ to mention team members</p>
            <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
              Comment
            </Button>
          </div>
        </div>
      </Card>

      {/* Comments List */}
      {comments.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
