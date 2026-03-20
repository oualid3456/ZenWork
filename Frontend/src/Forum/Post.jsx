import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createComment,
  deleteComment as deleteCommentAction,
  fetchComments,
  fetchLikes,
  fetchProfilesByIds,
  toggleLike as toggleLikeAction,
  updateComment as updateCommentAction,
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

  async function handleToggleLike() {
    try {
      const result = await toggleLikeAction({
        postId: post.id,
        userId: user.id,
        hasLiked,
      });

      setHasLiked(result.liked);
      setLikes((prev) => (result.liked ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("Erreur like :", error.message);
    }
  }

  async function addComment() {
    if (!commentText.trim()) return;

    const authorName =
      user?.user_metadata?.prenom || user?.email || "Utilisateur";

    try {
      await createComment({
        postId: post.id,
        userId: user.id,
        authorName,
        content: commentText.trim(),
      });

      setCommentText("");
      await loadComments();
      refreshPosts?.();
    } catch (error) {
      console.error("Erreur ajout commentaire :", error.message);
    }
  }

  function startEditComment(comment) {
    if (comment.user_id !== user.id) return;
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content || "");
  }

  async function saveCommentEdit(commentId) {
    if (!editingCommentText.trim()) return;

    try {
      await updateCommentAction({
        commentId,
        userId: user.id,
        content: editingCommentText.trim(),
      });

      setEditingCommentId(null);
      setEditingCommentText("");
      loadComments();
    } catch (error) {
      console.error("Erreur modification commentaire :", error.message);
    }
  }

  async function removeComment(comment) {
    const canDelete = comment.user_id === user.id || isAdminLike(role);
    if (!canDelete) return;

    try {
      await deleteCommentAction(comment.id);
      loadComments();
    } catch (error) {
      console.error("Erreur suppression commentaire :", error.message);
    }
  }

  const authorName =
    [authorProfile?.prenom, authorProfile?.nom].filter(Boolean).join(" ") ||
    post.author_name ||
    "Utilisateur";

  return (
    <div className="video-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <div className="video-body">
          {post.user_id ? (
            <h3 style={{ margin: 0 }}>
              <Link to={`/profile/${post.user_id}`}>{authorName}</Link>
            </h3>
          ) : (
            <h3 style={{ margin: 0 }}>{authorName}</h3>
          )}
          <p style={{ marginTop: 6 }}>
            {authorProfile?.role ? `${authorProfile.role} • ` : ""}
            {formatDate(post.created_at)}
          </p>
        </div>

        {canManagePost && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            {post.user_id === user.id && (
              <button
                type="button"
                className="start-btn"
                style={{ width: "120px" }}
                onClick={onEditPost}
              >
                Modifier
              </button>
            )}
            <button
              type="button"
              className="start-btn"
              style={{ width: "120px" }}
              onClick={onDeletePost}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      <div className="video-body" style={{ marginBottom: 16 }}>
        <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{post.content}</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          className="start-btn"
          style={{ width: "180px" }}
          onClick={handleToggleLike}
        >
          {hasLiked ? "💙 Je n’aime plus" : "👍 J’aime"} ({likes})
        </button>
        <button
          type="button"
          className="start-btn"
          style={{ width: "180px" }}
        >
          {comments.length} commentaire(s)
        </button>
      </div>

      <div className="video-body">
        <h3>Commentaires</h3>

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
              <div
                key={comment.id}
                style={{
                  background: "#F7F8FA",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                {editingCommentId === comment.id ? (
                  <>
                    <div className="search-box" style={{ width: "100%", marginBottom: 12 }}>
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        rows={3}
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          resize: "vertical",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="start-btn"
                        style={{ width: "140px" }}
                        onClick={() => saveCommentEdit(comment.id)}
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        className="start-btn"
                        style={{ width: "140px" }}
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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        {comment.user_id ? (
                          <strong>
                            <Link to={`/profile/${comment.user_id}`}>{label}</Link>
                          </strong>
                        ) : (
                          <strong>{label}</strong>
                        )}
                        <p style={{ margin: "4px 0 0 0", color: "#808191", fontSize: 13 }}>
                          {formatDate(comment.created_at)}
                        </p>
                      </div>

                      {canManageComment && (
                        <div style={{ display: "flex", gap: 8 }}>
                          {comment.user_id === user.id && (
                            <button
                              type="button"
                              className="start-btn"
                              style={{ width: "120px" }}
                              onClick={() => startEditComment(comment)}
                            >
                              Modifier
                            </button>
                          )}
                          <button
                            type="button"
                            className="start-btn"
                            style={{ width: "120px" }}
                            onClick={() => removeComment(comment)}
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>

                    <p style={{ margin: 0 }}>{comment.content}</p>
                  </>
                )}
              </div>
            );
          })
        )}

        <div className="search-box" style={{ width: "100%", marginTop: 16 }}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Ajouter un commentaire..."
            rows={3}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        <button
          type="button"
          className="start-btn"
          style={{ width: "160px", marginTop: 12 }}
          onClick={addComment}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}