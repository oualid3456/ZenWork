import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createComment,
  createForumReport,
  createForumSanction,
  deleteComment as deleteCommentAction,
  fetchActiveForumSanction,
  fetchAttachmentsByTargets,
  fetchComments,
  fetchLikes,
  fetchProfilesByIds,
  moderateForumComment,
  moderateForumPost,
  toggleLike as toggleLikeAction,
  updateComment as updateCommentAction,
} from "./forumService";
import {
  canBanForumUsers,
  canCommentInForum,
  canModerateForum,
  formatDate,
  formatFileSize,
  getUserDisplayName,
  groupCommentsByParent,
  isAllowedCommentGif,
} from "./forumUtils";

function CommentNode({
  comment,
  user,
  role,
  commentProfiles,
  commentAttachmentsMap,
  onReply,
  onEdit,
  onDelete,
  onModerate,
  onBanAuthor,
  onReport,
  replyState,
  setReplyState,
  activeSanction,
}) {
  const profile = commentProfiles[comment.user_id];
  const label =
    [profile?.prenom, profile?.nom].filter(Boolean).join(" ") ||
    comment.author_name ||
    "Utilisateur";

  const canManageComment = comment.user_id === user.id || canModerateForum(role);
  const gifAttachment = (commentAttachmentsMap[String(comment.id)] ?? []).find(
    (item) => item.kind === "gif"
  );

  const isEditing = replyState.mode === "edit" && replyState.targetId === comment.id;
  const isReplying = replyState.mode === "reply" && replyState.targetId === comment.id;

  return (
    <div className={comment.depth > 0 ? "forum-reply-card" : "forum-comment-card"}>
      <div className="forum-comment-header">
        <div>
          {comment.user_id ? (
            <strong className="forum-comment-author">
              <Link to={`/profile/${comment.user_id}`}>{label}</Link>
            </strong>
          ) : (
            <strong className="forum-comment-author">{label}</strong>
          )}
          <div className="forum-comment-date">
            {formatDate(comment.created_at)}
            {comment.edited_at ? " • modifié" : ""}
          </div>
        </div>

        {comment.status !== "published" && (
          <span className={`forum-status-pill ${comment.status}`}>
            {comment.status === "hidden" ? "Masqué" : comment.status}
          </span>
        )}
      </div>

      {isEditing ? (
        <>
          <div className="forum-comment-composer search-box">
            <textarea
              value={replyState.text}
              onChange={(e) =>
                setReplyState((prev) => ({ ...prev, text: e.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="forum-comment-actions">
            <button
              type="button"
              className="start-btn forum-admin-btn"
              onClick={() => onEdit(comment.id)}
            >
              Enregistrer
            </button>
            <button
              type="button"
              className="start-btn forum-admin-btn"
              onClick={() =>
                setReplyState({ mode: null, targetId: null, text: "", gifFile: null })
              }
            >
              Annuler
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="forum-comment-content">{comment.content}</div>

          {gifAttachment?.publicUrl && (
            <div className="forum-comment-gif">
              <img src={gifAttachment.publicUrl} alt={gifAttachment.file_name} />
            </div>
          )}

          <div className="forum-comment-actions">
            <button
              type="button"
              className="start-btn forum-action-btn"
              onClick={() =>
                setReplyState({
                  mode: "reply",
                  targetId: comment.id,
                  text: "",
                  gifFile: null,
                })
              }
              disabled={!canCommentInForum(activeSanction)}
            >
              Répondre
            </button>

            {comment.user_id === user.id && (
              <button
                type="button"
                className="start-btn forum-action-btn"
                onClick={() =>
                  setReplyState({
                    mode: "edit",
                    targetId: comment.id,
                    text: comment.content ?? "",
                    gifFile: null,
                  })
                }
              >
                Modifier
              </button>
            )}

            {canManageComment && (
              <button
                type="button"
                className="start-btn forum-action-btn"
                onClick={() => onDelete(comment)}
              >
                Supprimer
              </button>
            )}

            <button
              type="button"
              className="start-btn forum-report-btn"
              onClick={() => onReport("comment", comment.id)}
            >
              Signaler
            </button>

            {canModerateForum(role) && comment.status === "published" && (
              <button
                type="button"
                className="start-btn forum-admin-btn"
                onClick={() => onModerate(comment.id, "hidden")}
              >
                Masquer
              </button>
            )}

            {canModerateForum(role) && comment.status === "hidden" && (
              <button
                type="button"
                className="start-btn forum-admin-btn"
                onClick={() => onModerate(comment.id, "published")}
              >
                Restaurer
              </button>
            )}

            {canBanForumUsers(role) && comment.user_id !== user.id && (
              <button
                type="button"
                className="start-btn forum-admin-btn forum-admin-danger"
                onClick={() => onBanAuthor(comment.user_id)}
              >
                Bannir auteur
              </button>
            )}
          </div>
        </>
      )}

      {isReplying && (
        <>
          <div className="forum-comment-composer search-box">
            <textarea
              value={replyState.text}
              onChange={(e) =>
                setReplyState((prev) => ({ ...prev, text: e.target.value }))
              }
              placeholder="Écrire une réponse..."
              rows={3}
            />
          </div>

          <div className="forum-comment-toolbar">
            <label className="forum-tool-btn" htmlFor={`reply-gif-${comment.id}`}>
              GIF
            </label>
            <input
              id={`reply-gif-${comment.id}`}
              type="file"
              accept="image/gif"
              style={{ display: "none" }}
              onChange={(e) =>
                setReplyState((prev) => ({
                  ...prev,
                  gifFile: e.target.files?.[0] ?? null,
                }))
              }
            />
          </div>

          <div className="forum-comment-actions">
            <button
              type="button"
              className="start-btn forum-admin-btn"
              onClick={() => onReply(comment.id)}
            >
              Envoyer la réponse
            </button>
            <button
              type="button"
              className="start-btn forum-admin-btn"
              onClick={() =>
                setReplyState({ mode: null, targetId: null, text: "", gifFile: null })
              }
            >
              Annuler
            </button>
          </div>
        </>
      )}

      {comment.replies?.length > 0 && (
        <div className="forum-replies-list">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              user={user}
              role={role}
              commentProfiles={commentProfiles}
              commentAttachmentsMap={commentAttachmentsMap}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onModerate={onModerate}
              onBanAuthor={onBanAuthor}
              onReport={onReport}
              replyState={replyState}
              setReplyState={setReplyState}
              activeSanction={activeSanction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Post({
  post,
  user,
  role,
  authorProfile,
  attachments = [],
  refreshPosts,
  onEditPost,
  onDeletePost,
  canManagePost,
}) {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentProfiles, setCommentProfiles] = useState({});
  const [commentAttachmentsMap, setCommentAttachmentsMap] = useState({});
  const [commentText, setCommentText] = useState("");
  const [commentGifFile, setCommentGifFile] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [replyState, setReplyState] = useState({
    mode: null,
    targetId: null,
    text: "",
    gifFile: null,
  });
  const [activeSanction, setActiveSanction] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadLikes();
    loadComments();
  }, [post.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadSanction();
  }, [user?.id]);

  async function loadSanction() {
    try {
      const sanction = await fetchActiveForumSanction(user.id);
      setActiveSanction(sanction);
    } catch (error) {
      console.error("Erreur chargement sanction forum :", error.message);
      setActiveSanction(null);
    }
  }

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
      const visibleComments = canModerateForum(role)
        ? data
        : data.filter((comment) => comment.status === "published");

      setComments(visibleComments);

      const ids = [
        ...new Set(visibleComments.map((comment) => comment.user_id).filter(Boolean)),
      ];

      const profiles = await fetchProfilesByIds(ids);
      const map = {};
      profiles.forEach((profile) => {
        map[profile.id] = profile;
      });
      setCommentProfiles(map);

      let commentAttachmentMap = {};
      try {
        commentAttachmentMap = await fetchAttachmentsByTargets(
          "comment",
          visibleComments.map((comment) => comment.id)
        );
      } catch (error) {
        console.warn("Erreur chargement attachments commentaires :", error.message);
      }
      setCommentAttachmentsMap(commentAttachmentMap);
    } catch (error) {
      console.error("Erreur chargement commentaires :", error.message);
      setComments([]);
      setCommentProfiles({});
      setCommentAttachmentsMap({});
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

  async function addComment(parentCommentId = null) {
    const text = parentCommentId ? replyState.text : commentText;
    const gifFile = parentCommentId ? replyState.gifFile : commentGifFile;

    if (!text.trim() && !gifFile) return;

    if (!canCommentInForum(activeSanction)) {
      setErrorMessage(
        "Tu ne peux pas commenter sur le forum actuellement à cause d’une restriction."
      );
      return;
    }

    if (gifFile && !isAllowedCommentGif(gifFile.type)) {
      setErrorMessage("Seul un GIF est autorisé dans les commentaires.");
      return;
    }

    const authorName = getUserDisplayName(user, commentProfiles[user.id]);

    try {
      await createComment({
        postId: post.id,
        userId: user.id,
        authorName,
        content: text.trim(),
        parentCommentId,
        gifFile,
      });

      if (parentCommentId) {
        setReplyState({ mode: null, targetId: null, text: "", gifFile: null });
      } else {
        setCommentText("");
        setCommentGifFile(null);
      }

      setErrorMessage("");
      await loadComments();
      refreshPosts?.();
    } catch (error) {
      console.error("Erreur ajout commentaire :", error.message);
      setErrorMessage("Impossible d’ajouter le commentaire.");
    }
  }

  async function saveCommentEdit(commentId) {
    if (!replyState.text.trim()) return;
    try {
      await updateCommentAction({
        commentId,
        userId: user.id,
        content: replyState.text.trim(),
      });
      setReplyState({ mode: null, targetId: null, text: "", gifFile: null });
      loadComments();
    } catch (error) {
      console.error("Erreur modification commentaire :", error.message);
      setErrorMessage("Impossible de modifier le commentaire.");
    }
  }

  async function removeComment(comment) {
    const canDelete = comment.user_id === user.id || canModerateForum(role);
    if (!canDelete) return;
    try {
      await deleteCommentAction(comment.id);
      loadComments();
    } catch (error) {
      console.error("Erreur suppression commentaire :", error.message);
      setErrorMessage("Impossible de supprimer le commentaire.");
    }
  }

  async function handleReport(targetType, targetId) {
    const reason = window.prompt(
      "Motif du signalement (insulte, haine, violence, NSFW, spam, autre) :"
    );
    if (!reason) return;

    const details = window.prompt("Détail facultatif :") ?? "";

    try {
      await createForumReport({
        reporterId: user.id,
        targetType,
        targetId,
        reason,
        details,
      });
      setErrorMessage("");
      window.alert("Signalement envoyé.");
    } catch (error) {
      console.error("Erreur signalement :", error.message);
      setErrorMessage("Impossible d’envoyer le signalement.");
    }
  }

  async function handleModeratePost(status) {
    const moderationReason =
      window.prompt("Motif de modération :") || "Modération forum";

    try {
      await moderateForumPost({
        postId: post.id,
        status,
        moderationReason,
      });
      refreshPosts?.();
    } catch (error) {
      console.error("Erreur modération post :", error.message);
      setErrorMessage("Impossible de modérer cette publication.");
    }
  }

  async function handleModerateComment(commentId, status) {
    const moderationReason =
      window.prompt("Motif de modération :") || "Modération forum";

    try {
      await moderateForumComment({
        commentId,
        status,
        moderationReason,
      });
      loadComments();
    } catch (error) {
      console.error("Erreur modération commentaire :", error.message);
      setErrorMessage("Impossible de modérer ce commentaire.");
    }
  }

  async function handleBanAuthor(authorId) {
    const reason = window.prompt("Motif du bannissement forum :");
    if (!reason) return;

    const confirmBan = window.confirm(
      "Confirmer le bannissement forum de cet utilisateur ?"
    );
    if (!confirmBan) return;

    try {
      await createForumSanction({
        userId: authorId,
        type: "forum_banned",
        reason,
        issuedBy: user.id,
      });

      window.alert("Utilisateur banni du forum.");
    } catch (error) {
      console.error("Erreur bannissement forum :", error.message);
      setErrorMessage("Impossible de bannir cet utilisateur du forum.");
    }
  }

  const authorName =
    [authorProfile?.prenom, authorProfile?.nom].filter(Boolean).join(" ") ||
    post.author_name ||
    "Utilisateur";

  const commentsTree = useMemo(() => groupCommentsByParent(comments), [comments]);

  return (
    <div className="video-card forum-post-card">
      <div className="forum-post-header">
        <div className="forum-post-author">
          {post.user_id ? (
            <span className="forum-post-author-name">
              <Link to={`/profile/${post.user_id}`}>{authorName}</Link>
            </span>
          ) : (
            <span className="forum-post-author-name">{authorName}</span>
          )}

          <span className="forum-post-author-meta">
            {authorProfile?.role ? `${authorProfile.role} • ` : ""}
            {formatDate(post.created_at)}
            {post.edited_at ? " • modifié" : ""}
          </span>
        </div>

        {post.status !== "published" && (
          <span className={`forum-status-pill ${post.status}`}>
            {post.status === "hidden" ? "Masqué" : post.status}
          </span>
        )}
      </div>

      <div className="forum-post-content">{post.content}</div>

      {attachments.length > 0 && (
        <div className="forum-post-media">
          {attachments.map((attachment) => {
            if (attachment.kind === "image" || attachment.kind === "gif") {
              return (
                <img
                  key={attachment.id}
                  src={attachment.publicUrl}
                  alt={attachment.file_name}
                  className={
                    attachment.kind === "gif" ? "forum-media-gif" : "forum-media-image"
                  }
                />
              );
            }

            if (attachment.kind === "video") {
              return (
                <video
                  key={attachment.id}
                  src={attachment.publicUrl}
                  className="forum-media-video"
                  controls
                />
              );
            }

            if (attachment.kind === "pdf") {
              return (
                <a
                  key={attachment.id}
                  href={attachment.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="forum-media-pdf"
                >
                  <span className="forum-media-pdf-title">📄 {attachment.file_name}</span>
                  <span className="forum-media-pdf-meta">
                    PDF • {formatFileSize(attachment.size_bytes)}
                  </span>
                </a>
              );
            }

            return null;
          })}
        </div>
      )}

      <div className="forum-post-actions">
        <button
          type="button"
          className="start-btn forum-action-btn"
          onClick={handleToggleLike}
        >
          {hasLiked ? "❤️ Like" : "🤍 Like"} ({likes})
        </button>

        <button
          type="button"
          className="start-btn forum-action-btn"
          onClick={() => setShowComments((prev) => !prev)}
        >
          💬 Commentaires ({comments.length})
        </button>

        <button
          type="button"
          className="start-btn forum-report-btn"
          onClick={() => handleReport("post", post.id)}
        >
          🚩 Signaler
        </button>

        {canManagePost && post.user_id === user.id && (
          <button
            type="button"
            className="start-btn forum-admin-btn"
            onClick={onEditPost}
          >
            Modifier
          </button>
        )}

        {canManagePost && (
          <button
            type="button"
            className="start-btn forum-admin-btn"
            onClick={onDeletePost}
          >
            Supprimer
          </button>
        )}

        {canModerateForum(role) && post.status === "published" && (
          <button
            type="button"
            className="start-btn forum-admin-btn"
            onClick={() => handleModeratePost("hidden")}
          >
            Masquer
          </button>
        )}

        {canModerateForum(role) && post.status === "hidden" && (
          <button
            type="button"
            className="start-btn forum-admin-btn"
            onClick={() => handleModeratePost("published")}
          >
            Restaurer
          </button>
        )}

        {canBanForumUsers(role) && post.user_id !== user.id && (
          <button
            type="button"
            className="start-btn forum-admin-btn forum-admin-danger"
            onClick={() => handleBanAuthor(post.user_id)}
          >
            Bannir auteur
          </button>
        )}
      </div>

      {errorMessage && <p style={{ color: "#E53E3E" }}>{errorMessage}</p>}

      {showComments && (
        <div className="forum-comments-section">
          <h3 className="forum-comments-title">Commentaires</h3>

          {commentsTree.length === 0 ? (
            <p>Aucun commentaire pour le moment.</p>
          ) : (
            <div className="forum-comments-list">
              {commentsTree.map((comment) => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                  user={user}
                  role={role}
                  commentProfiles={commentProfiles}
                  commentAttachmentsMap={commentAttachmentsMap}
                  onReply={addComment}
                  onEdit={saveCommentEdit}
                  onDelete={removeComment}
                  onModerate={handleModerateComment}
                  onBanAuthor={handleBanAuthor}
                  onReport={handleReport}
                  replyState={replyState}
                  setReplyState={setReplyState}
                  activeSanction={activeSanction}
                />
              ))}
            </div>
          )}

          <div className="forum-comment-composer search-box">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={3}
            />
          </div>

          <div className="forum-comment-toolbar">
            <label className="forum-tool-btn" htmlFor={`comment-gif-${post.id}`}>
              GIF
            </label>
            <input
              id={`comment-gif-${post.id}`}
              type="file"
              accept="image/gif"
              style={{ display: "none" }}
              onChange={(e) => setCommentGifFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="forum-comment-actions">
            <button
              type="button"
              className="start-btn forum-admin-btn"
              onClick={() => addComment(null)}
              disabled={!canCommentInForum(activeSanction)}
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}