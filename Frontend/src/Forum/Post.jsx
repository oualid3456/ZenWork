import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createComment,
  deleteComment,
  fetchComments,
  fetchLikes,
  fetchProfilesByIds,
  toggleLike,
  updateComment,
} from "./forumService";
import { formatDate, isAdminLike } from "./forumUtils";

export default function Post({
  post,
  user,
  role,
  authorProfile,
  refreshPosts,
  onEditPost,
  onDeletePost,
  canManagePost,
}) {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentProfiles, setCommentProfiles] = useState({});
  const [commentText, setCommentText] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  useEffect(() => {
    loadLikes();
    loadComments();
  }, [post.id]);

  async function loadLikes() {
    try {
      const data = await fetchLikes(post.id);
      setLikes(data.length);
      setHasLiked(data.some((like) => like.user_id === user.id));
    } catch (error) {
      console.error("Erreur chargement likes :", error.message);
    }
  }


  async function loadComments() {
    try {
      const data = await fetchComments(post.id);
      setComments(data);

      const ids = [...new Set(data.map((comment) => comment.user_id).filter(Boolean))];
      const profiles = await fetchProfilesByIds(ids);

      const map = {};
      profiles.forEach((profile) => {
        map[profile.id] = profile;
      });

      setCommentProfiles(map);
    } catch (error) {
      console.error("Erreur chargement commentaires :", error.message);
      setComments([]);
      setCommentProfiles({});
    }
  }


  async function toggleLike() {
    if (hasLiked) {
      const { error } = await supabase
        .from("forum_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);

      if (!error) {
        setHasLiked(false);
        setLikes((prev) => prev - 1);
      }
    } else {
      const { error } = await supabase.from("forum_likes").insert([
        {
          post_id: post.id,
          user_id: user.id,
        },
      ]);

      if (!error) {
        setHasLiked(true);
        setLikes((prev) => prev + 1);
      }
    }
  }

  async function addComment() {
    if (!commentText.trim()) return;

    const authorName =
      user?.user_metadata?.prenom ||
      user?.email ||
      "Utilisateur";

    const { error } = await supabase.from("forum_comments").insert([
      {
        post_id: post.id,
        user_id: user.id,
        author_name: authorName,
        content: commentText.trim(),
      },
    ]);

    if (!error) {
      setCommentText("");
      await fetchComments();
      refreshPosts?.();
    }
  }

  function startEditComment(comment) {
    if (comment.user_id !== user.id) return;
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content || "");
  }

  async function saveCommentEdit(commentId) {
    if (!editingCommentText.trim()) return;

    const { error } = await supabase
      .from("forum_comments")
      .update({ content: editingCommentText.trim() })
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur modification commentaire :", error.message);
      return;
    }

    setEditingCommentId(null);
    setEditingCommentText("");
    fetchComments();
  }

  async function deleteComment(comment) {
    const canDelete =
      comment.user_id === user.id || isAdminLike(role);

    if (!canDelete) return;

    const { error } = await supabase
      .from("forum_comments")
      .delete()
      .eq("id", comment.id);

    if (error) {
      console.error("Erreur suppression commentaire :", error.message);
      return;
    }

    fetchComments();
  }

  const authorName =
    [authorProfile?.prenom, authorProfile?.nom].filter(Boolean).join(" ") ||
    post.author_name ||
    "Utilisateur";

  return (
    <article className="forum-card forum-post">
      <header className="forum-post-header">
        <div>
          {post.user_id ? (
            <Link to={`/profile/${post.user_id}`}>
              <strong>{authorName}</strong>
            </Link>
          ) : (
            <strong>{authorName}</strong>
          )}

          <p className="forum-post-meta">
            {authorProfile?.role ? `${authorProfile.role} • ` : ""}
            {formatDate(post.created_at)}
          </p>
        </div>

        {canManagePost && (
          <div className="inline-actions">
            {post.user_id === user.id && (
              <button onClick={onEditPost}>Modifier</button>
            )}
            <button onClick={onDeletePost}>Supprimer</button>
          </div>
        )}
      </header>

      <p>{post.content}</p>

      <div className="forum-post-actions">
        <button onClick={toggleLike}>
          {hasLiked ? "💙 Je n’aime plus" : "👍 J’aime"} ({likes})
        </button>
        <span>{comments.length} commentaire(s)</span>
      </div>

      <section className="forum-comments">
        <h5>Commentaires</h5>

        {comments.length === 0 ? (
          <p>Aucun commentaire pour le moment.</p>
        ) : (
          comments.map((comment) => {
            const profile = commentProfiles[comment.user_id];
            const label =
              [profile?.prenom, profile?.nom].filter(Boolean).join(" ") ||
              comment.author_name ||
              "Utilisateur";

            const canManageComment =
              comment.user_id === user.id || isAdminLike(role);

            return (
              <div key={comment.id} className="forum-comment">
                {editingCommentId === comment.id ? (
                  <>
                    <textarea
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                    />
                    <div className="inline-actions">
                      <button onClick={() => saveCommentEdit(comment.id)}>
                        Enregistrer
                      </button>
                      <button
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingCommentText("");
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="forum-comment-header">
                      <div>
                        {comment.user_id ? (
                          <Link to={`/profile/${comment.user_id}`}>
                            <strong>{label}</strong>
                          </Link>
                        ) : (
                          <strong>{label}</strong>
                        )}
                        <p className="forum-post-meta">
                          {formatDate(comment.created_at)}
                        </p>
                      </div>

                      {canManageComment && (
                        <div className="inline-actions">
                          {comment.user_id === user.id && (
                            <button onClick={() => startEditComment(comment)}>
                              Modifier
                            </button>
                          )}
                          <button onClick={() => deleteComment(comment)}>
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>

                    <p>{comment.content}</p>
                  </>
                )}
              </div>
            );
          })
        )}

        <div className="forum-comment-composer">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Ajouter un commentaire..."
          />
          <button onClick={addComment}>Envoyer</button>
        </div>
      </section>
    </article>
  );
}