import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
  location?: { country?: string | null; city?: string | null };
  likes: string[];
  dislikes: string[];
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
];

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  // per-comment translation output + chosen target language
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [targetLangByComment, setTargetLangByComment] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading comments...</div>;
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
      });
      if (res.data.comment) {
        setComments([res.data.data, ...comments]);
        setNewComment("");
      }
    } catch (error: any) {
      if (error?.response?.status === 400) {
        setErrorMsg(
          error.response.data?.message || "Comment blocked by moderation filter"
        );
      }
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, commentbody: editText } : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleLike = async (id: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/like/${id}`, {
        userId: user._id,
      });
      setComments((prev) => prev.map((c) => (c._id === id ? res.data : c)));
    } catch (error) {
      console.log(error);
    }
  };

  const handleDislike = async (id: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/dislike/${id}`, {
        userId: user._id,
      });
      if (res.data.status === "hidden") {
        // enough dislikes relative to total votes -> comment auto-hides
        setComments((prev) => prev.filter((c) => c._id !== id));
      } else {
        setComments((prev) => prev.map((c) => (c._id === id ? res.data : c)));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleTranslate = async (id: string) => {
    const targetLang = targetLangByComment[id] || "en";
    try {
      const res = await axiosInstance.post(`/comment/translate/${id}`, {
        targetLang,
      });
      setTranslations((prev) => ({ ...prev, [id]: res.data.translatedText }));
    } catch (error) {
      console.log(error);
    }
  };

  const showOriginal = (id: string) => {
    setTranslations((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e: any) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />
            {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setNewComment("");
                  setErrorMsg("");
                }}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => {
            const liked = !!user && comment.likes?.includes(user._id);
            const disliked = !!user && comment.dislikes?.includes(user._id);
            const translatedText = translations[comment._id];

            return (
              <div key={comment._id} className="flex gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback>{comment.usercommented[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.usercommented}
                    </span>
                    {comment.location?.country && (
                      <span className="text-xs text-gray-500">
                        · {comment.location.country}
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {formatDistanceToNow(new Date(comment.commentedon))} ago
                    </span>
                  </div>

                  {editingCommentId === comment._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={handleUpdateComment}
                          disabled={!editText.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">
                        {translatedText || comment.commentbody}
                      </p>
                      {translatedText && (
                        <button
                          className="text-xs text-blue-500 mt-1"
                          onClick={() => showOriginal(comment._id)}
                        >
                          Show original
                        </button>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                        <button
                          className={`flex items-center gap-1 ${
                            liked ? "text-blue-600 font-medium" : ""
                          }`}
                          onClick={() => handleLike(comment._id)}
                        >
                          👍 {comment.likes?.length || 0}
                        </button>
                        <button
                          className={`flex items-center gap-1 ${
                            disliked ? "text-red-600 font-medium" : ""
                          }`}
                          onClick={() => handleDislike(comment._id)}
                        >
                          👎 {comment.dislikes?.length || 0}
                        </button>
                        <select
                          className="text-xs border rounded px-1 py-0.5 bg-transparent"
                          value={targetLangByComment[comment._id] || "en"}
                          onChange={(e) =>
                            setTargetLangByComment((prev) => ({
                              ...prev,
                              [comment._id]: e.target.value,
                            }))
                          }
                        >
                          {LANGUAGES.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => handleTranslate(comment._id)}>
                          Translate
                        </button>
                        {comment.userid === user?._id && (
                          <>
                            <button onClick={() => handleEdit(comment)}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(comment._id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Comments;
