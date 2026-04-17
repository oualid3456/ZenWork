import { useEffect, useMemo, useRef, useState } from "react";
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
} from "./forumUtils";
import ReportModal from "./ReportModal";
import GiphyGifPicker from "./GiphyGifPicker";

const textareaStyle = {
  width: "100%",
  minHeight: 112,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#ffffff",
  padding: "16px 18px",
  outline: "none",
  resize: "vertical",
  fontFamily: "inherit",
  fontSize: 15,
  lineHeight: 1.5,
  boxSizing: "border-box",
};

function GifPreview({ item, onRemove }) {
  if (!item?.publicUrl && !item?.gifUrl && !item?.previewUrl) return null;

  const src = item.publicUrl || item.gifUrl || item.previewUrl;

  return (
    <div
      style={{
        marginTop: 10,
        display: "inline-flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 260,
      }}
    >
      <img
        src={src}
        alt={item.file_name || item.title || "GIF"}
        style={{
          width: "100%",
          maxWidth: 240,
          maxHeight: 180,
          objectFit: "cover",
          borderRadius: 10,
        }}
      />
      {onRemove && (
        <button
          type="button"
          className="forum-tool-btn"
          onClick={onRemove}
          style={{ width: "fit-content" }}
        >
          Retirer le GIF
        </button>
      )}
    </div>
  );
}

const EMPTY_REPLY_STATE = {
  mode: null,
  targetId: null,
  text: "",
  externalGif: null,
};

function CommentNode({
  comment,
  user,
  commentProfiles,
  commentAttachmentsMap,
  replyState,
  setReplyState,
  onReplySubmit,
  onEditSubmit,
  onDelete,
  onOpenReport,
  activeSanction,
  submitting,
  highlightedCommentId,
}) {
  const [showGifPicker, setShowGifPicker] = useState(false);
  const prevTargetId = useRef(replyState.targetId);

  useEffect(() => {
    if (prevTargetId.current !== replyState.targetId) {
      setShowGifPicker(false);
      prevTargetId.current = replyState.targetId;
    }
  }, [replyState.targetId]);

  const profile = commentProfiles[comment.user_id];
  const label =
    [profile?.prenom, profile?.nom].filter(Boolean).join(" ") ||
    comment.author_name ||
    "Utilisateur";

  const isOwnComment = comment.user_id === user.id;
  const gifAttachment = (commentAttachmentsMap[String(comment.id)] ?? []).find(
    (item) => item.kind === "gif"
  );

  const isEditing =
    replyState.mode === "edit" && replyState.targetId === comment.id;

  const isReplying =
    replyState.mode === "reply" && replyState.targetId === comment.id;

  const isHighlighted =
    String(highlightedCommentId) === String(comment.id);

  function handleCancelState() {
    setShowGifPicker(false);
    setReplyState(EMPTY_REPLY_STATE);
  }

  return (
    <div
      id={`forum-comment-${comment.id}`}
      className={comment.depth > 0 ? "forum-reply-card" : "forum-comment-card"}
      style={
        isHighlighted
          ? { outline: "2px solid #6C5DD3", scrollMarginTop: 100 }
          : undefined
      }
    >
      <div className="forum-comment-header">
        <div>
          <div className="forum-comment-author">{label}</div>
          <div className="forum-comment-date">
            {formatDate(comment.created_at)}
            {comment.edited_at ? " • modifié" : ""}
          </div>
        </div>

        {comment.status !== "published" && (
          <span className="forum-status-pill hidden">
            {comment.status === "hidden" ? "Masqué" : comment.status}
          </span>
        )}
      </div>

      {isEditing ? (
        <>
          <textarea
            value={replyState.text}
            onChange={(e) =>
              setReplyState((prev) => ({ ...prev, text: e.target.value }))
            }
            rows={3}
            style={{ ...textareaStyle, minHeight: 110, marginTop: 12 }}
          />

          <div className="forum-comment-actions">
            <button
              type="button"
              className="forum-tool-btn forum-action-btn"
              onClick={() => onEditSubmit(comment.id)}
              disabled={submitting || !replyState.text.trim()}
            >
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </button>

            <button
              type="button"
              className="forum-tool-btn forum-action-btn"
              onClick={handleCancelState}
            >
              Annuler
            </button>
          </div>
        </>
      ) : (
        <>
          {comment.content && (
            <div className="forum-comment-content">{comment.content}</div>
          )}

          {gifAttachment &&
            (gifAttachment.publicUrl || gifAttachment.external_url) && (
              <div className="forum-comment-gif">
                <img
                  src={gifAttachment.publicUrl || gifAttachment.external_url}
                  alt={gifAttachment.file_name || "GIF"}
                />
              </div>
            )}

          <div className="forum-comment-actions">
            <button
              type="button"
              className="forum-tool-btn forum-action-btn"
              onClick={() => {
                if (isReplying) {
                  handleCancelState();
                } else {
                  setReplyState({
                    mode: "reply",
                    targetId: comment.id,
                    text: "",
                    externalGif: null,
                  });
                }
              }}
              disabled={!canCommentInForum(activeSanction)}
            >
              {isReplying ? "Annuler la réponse" : "Répondre"}
            </button>

            {isOwnComment && (
              <button
                type="button"
                className="forum-tool-btn forum-action-btn"
                onClick={() =>
                  setReplyState({
                    mode: "edit",
                    targetId: comment.id,
                    text: comment.content ?? "",
                    externalGif: null,
                  })
                }
              >
                Modifier
              </button>
            )}

            {isOwnComment && (
              <button
                type="button"
                className="forum-tool-btn forum-action-btn"
                onClick={() => onDelete(comment)}
              >
                Supprimer
              </button>
            )}

            {!isOwnComment && (
              <button
                type="button"
                className="forum-tool-btn forum-report-btn forum-action-btn"
                onClick={() => onOpenReport("comment", comment.id)}
              >
                🚩 Signaler
              </button>
            )}
          </div>
        </>
      )}

      {isReplying && (
        <div className="forum-comment-composer">
          <textarea
            value={replyState.text}
            onChange={(e) =>
              setReplyState((prev) => ({ ...prev, text: e.target.value }))
            }
            placeholder="Écrire une réponse..."
            rows={3}
            style={{ ...textareaStyle, minHeight: 110 }}
          />

          <div className="forum-comment-actions">
            <button
              type="button"
              className="forum-tool-btn"
              onClick={() => setShowGifPicker((prev) => !prev)}
            >
              GIF GIPHY
            </button>

            <button
              type="button"
              className="forum-tool-btn forum-action-btn"
              onClick={() => onReplySubmit(comment.id)}
              disabled={
                submitting ||
                (!replyState.text.trim() && !replyState.externalGif) ||
                !canCommentInForum(activeSanction)
              }
            >
              {submitting ? "Envoi..." : "Envoyer la réponse"}
            </button>
          </div>

          <GiphyGifPicker
            open={showGifPicker}
            onClose={() => setShowGifPicker(false)}
            onSelect={(gif) => {
              setReplyState((prev) => ({ ...prev, externalGif: gif }));
              setShowGifPicker(false);
            }}
            anchorLabel="GIF GIPHY"
          />

          {replyState.externalGif && (
            <GifPreview
              item={replyState.externalGif}
              onRemove={() =>
                setReplyState((prev) => ({ ...prev, externalGif: null }))
              }
            />
          )}
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="forum-replies-list">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              user={user}
              commentProfiles={commentProfiles}
              commentAttachmentsMap={commentAttachmentsMap}
              replyState={replyState}
              setReplyState={setReplyState}
              onReplySubmit={onReplySubmit}
              onEditSubmit={onEditSubmit}
              onDelete={onDelete}
              onOpenReport={onOpenReport}
              activeSanction={activeSanction}
              submitting={submitting}
              highlightedCommentId={highlightedCommentId}
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
  authorSanction = null,
  attachments = [],
  refreshPosts,
  onEditPost,
  onDeletePost,
  canManagePost,
  focusTarget = null,
  onFocusHandled,
}) {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentProfiles, setCommentProfiles] = useState({});
  const [commentAttachmentsMap, setCommentAttachmentsMap] = useState({});
  const [commentText, setCommentText] = useState("");
  const [commentExternalGif, setCommentExternalGif] = useState(null);
  const [showRootGifPicker, setShowRootGifPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [replyState, setReplyState] = useState(EMPTY_REPLY_STATE);
  const [activeSanction, setActiveSanction] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [reportTarget, setReportTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const postRef = useRef(null);
  const lastHandledFocusRef = useRef("");

  useEffect(() => {
    loadLikes();
    loadComments();
  }, [post.id, role]);

  useEffect(() => {
    if (!user?.id) return;
    loadSanction();
  }, [user?.id]);

  useEffect(() => {
    if (!showComments) {
      setShowRootGifPicker(false);
    }
  }, [showComments]);

  useEffect(() => {
    if (!focusTarget?.id) return;

    const key = `${focusTarget.type}:${focusTarget.id}:${focusTarget.postId ?? ""}`;

    if (lastHandledFocusRef.current === key) return;

    if (
      focusTarget.type === "post" &&
      String(focusTarget.id) === String(post.id)
    ) {
      requestAnimationFrame(() => {
        postRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        lastHandledFocusRef.current = key;
        onFocusHandled?.();
      });
      return;
    }

    if (
      focusTarget.type === "comment" &&
      String(focusTarget.postId) === String(post.id)
    ) {
      setShowComments(true);
    }
  }, [focusTarget, post.id, onFocusHandled]);

  useEffect(() => {
    if (
      !focusTarget?.id ||
      focusTarget.type !== "comment" ||
      String(focusTarget.postId) !== String(post.id) ||
      !showComments
    ) {
      return;
    }

    const key = `${focusTarget.type}:${focusTarget.id}:${focusTarget.postId ?? ""}`;

    if (lastHandledFocusRef.current === key) return;

    const element = document.getElementById(`forum-comment-${focusTarget.id}`);
    if (!element) return;

    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      lastHandledFocusRef.current = key;
      onFocusHandled?.();
    });
  }, [focusTarget, showComments, comments, post.id, onFocusHandled]);

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
    const text = parentCommentId !== null ? replyState.text : commentText;
    const externalGif =
      parentCommentId !== null ? replyState.externalGif : commentExternalGif;

    if (!text.trim() && !externalGif) return;

    if (!canCommentInForum(activeSanction)) {
      setErrorMessage(
        "Tu ne peux pas commenter sur le forum actuellement à cause d'une restriction."
      );
      return;
    }

    if (submitting) return;

    const currentScrollY = window.scrollY;
    const authorName = getUserDisplayName(user, commentProfiles[user.id]);

    setSubmitting(true);
    setErrorMessage("");

    try {
      await createComment({
        postId: post.id,
        userId: user.id,
        authorName,
        content: text.trim(),
        parentCommentId,
        externalGif,
      });

      if (parentCommentId !== null) {
        setReplyState(EMPTY_REPLY_STATE);
      } else {
        setCommentText("");
        setCommentExternalGif(null);
        setShowRootGifPicker(false);
      }

      await loadComments();

      requestAnimationFrame(() => {
        window.scrollTo({ top: currentScrollY });
      });
    } catch (error) {
      console.error("Erreur ajout commentaire :", error.message);
      setErrorMessage("Impossible d'ajouter le commentaire.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveCommentEdit(commentId) {
    if (!replyState.text.trim()) {
      setErrorMessage("Le commentaire ne peut pas être vide.");
      return;
    }

    if (submitting) return;

    const currentScrollY = window.scrollY;
    setSubmitting(true);
    setErrorMessage("");

    try {
      await updateCommentAction({
        commentId,
        userId: user.id,
        content: replyState.text.trim(),
      });

      setReplyState(EMPTY_REPLY_STATE);
      await loadComments();

      requestAnimationFrame(() => {
        window.scrollTo({ top: currentScrollY });
      });
    } catch (error) {
      console.error("Erreur modification commentaire :", error.message);
      setErrorMessage("Impossible de modifier le commentaire.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeComment(comment) {
    const canDelete = comment.user_id === user.id;

    if (!canDelete) return;

    const currentScrollY = window.scrollY;

    try {
      await deleteCommentAction(comment.id);

      if (
        replyState.targetId === comment.id ||
        comment.replies?.some((r) => r.id === replyState.targetId)
      ) {
        setReplyState(EMPTY_REPLY_STATE);
      }

      await loadComments();

      requestAnimationFrame(() => {
        window.scrollTo({ top: currentScrollY });
      });
    } catch (error) {
      console.error("Erreur suppression commentaire :", error.message);
      setErrorMessage("Impossible de supprimer le commentaire.");
    }
  }

  function handleOpenReport(targetType, targetId) {
    setReportTarget({ type: targetType, id: targetId });
  }

  async function handleSubmitReport(reason, details) {
    if (!reportTarget) return;

    try {
      await createForumReport({
        reporterId: user.id,
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason,
        details,
      });

      setReportTarget(null);
      setErrorMessage("");
    } catch (error) {
      console.error("Erreur signalement :", error.message);
      setErrorMessage("Impossible d'envoyer le signalement.");
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

      await refreshPosts?.();
    } catch (error) {
      console.error("Erreur modération post :", error.message);
      setErrorMessage("Impossible de modérer cette publication.");
    }
  }

  async function handleBanAuthor(authorId) {
    if (isAuthorForumBlocked) return;

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

      await refreshPosts?.();
      setErrorMessage("");
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
  const totalCommentsCount = comments.length;
  const isOwnPost = post.user_id === user.id;

  const isAuthorForumBlocked = ["forum_banned", "forum_suspended"].includes(
    authorSanction?.type
  );

  const authorBlockLabel =
    authorSanction?.type === "forum_banned"
      ? "Banni"
      : authorSanction?.type === "forum_suspended"
      ? "Suspendu"
      : null;

  return (
    <>
      <div
        id={`forum-post-${post.id}`}
        ref={postRef}
        className="video-card forum-post-card"
        style={
          focusTarget?.type === "post" && String(focusTarget.id) === String(post.id)
            ? { outline: "2px solid #6C5DD3", scrollMarginTop: 100 }
            : { scrollMarginTop: 100 }
        }
      >
        <div className="forum-post-header">
          <div className="forum-post-author">
            <div className="forum-post-author-name">{authorName}</div>
            <div className="forum-post-author-meta">
              {authorProfile?.role ? `${authorProfile.role} • ` : ""}
              {formatDate(post.created_at)}
              {post.edited_at ? " • modifié" : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {post.status !== "published" && (
              <span className="forum-status-pill hidden">
                {post.status === "hidden" ? "Masqué" : post.status}
              </span>
            )}

            {authorBlockLabel && (
              <span className="forum-status-pill reported">
                {authorBlockLabel}
              </span>
            )}
          </div>
        </div>

        {post.content && (
          <div className="forum-post-content">{post.content}</div>
        )}

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
                      attachment.kind === "gif"
                        ? "forum-media-gif"
                        : "forum-media-image"
                    }
                  />
                );
              }

              if (attachment.kind === "video") {
                return (
                  <video
                    key={attachment.id}
                    className="forum-media-video"
                    src={attachment.publicUrl}
                    controls
                  />
                );
              }

              if (attachment.kind === "pdf") {
                return (
                  <a
                    key={attachment.id}
                    className="forum-media-pdf"
                    href={attachment.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="forum-media-pdf-title">
                      📄 {attachment.file_name}
                    </span>
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
            className="forum-tool-btn forum-action-btn"
            onClick={handleToggleLike}
          >
            {hasLiked ? "❤️ Like" : "🤍 Like"} ({likes})
          </button>

          <button
            type="button"
            className="forum-tool-btn forum-action-btn"
            onClick={() => setShowComments((prev) => !prev)}
          >
            {showComments
              ? `Masquer les commentaires (${totalCommentsCount})`
              : `💬 Commentaires (${totalCommentsCount})`}
          </button>

          {!isOwnPost && (
            <button
              type="button"
              className="forum-tool-btn forum-report-btn forum-action-btn"
              onClick={() => handleOpenReport("post", post.id)}
            >
              🚩 Signaler
            </button>
          )}

          {canManagePost && post.user_id === user.id && (
            <button
              type="button"
              className="forum-tool-btn forum-action-btn"
              onClick={onEditPost}
            >
              Modifier
            </button>
          )}

          {canManagePost && post.user_id === user.id && (
            <button
              type="button"
              className="forum-tool-btn forum-action-btn"
              onClick={onDeletePost}
            >
              Supprimer
            </button>
          )}

          {canModerateForum(role) && post.status === "published" && (
            <button
              type="button"
              className="forum-tool-btn forum-action-btn"
              onClick={() => handleModeratePost("hidden")}
            >
              Masquer
            </button>
          )}

          {canModerateForum(role) && post.status === "hidden" && (
            <button
              type="button"
              className="forum-tool-btn forum-action-btn"
              onClick={() => handleModeratePost("published")}
            >
              Restaurer
            </button>
          )}

          {canBanForumUsers(role) &&
            post.user_id !== user.id &&
            !isAuthorForumBlocked && (
              <button
                type="button"
                className="forum-tool-btn forum-action-btn"
                onClick={() => handleBanAuthor(post.user_id)}
              >
                Bannir auteur
              </button>
            )}
        </div>

        {errorMessage && (
          <p style={{ color: "#E53E3E", marginBottom: 0 }}>{errorMessage}</p>
        )}

        {showComments && (
          <div className="forum-comments-section">
            <h5 className="forum-comments-title">Commentaires</h5>

            {commentsTree.length === 0 ? (
              <p style={{ marginTop: 0 }}>Aucun commentaire pour le moment.</p>
            ) : (
              <div className="forum-comments-list">
                {commentsTree.map((comment) => (
                  <CommentNode
                    key={comment.id}
                    comment={comment}
                    user={user}
                    commentProfiles={commentProfiles}
                    commentAttachmentsMap={commentAttachmentsMap}
                    replyState={replyState}
                    setReplyState={setReplyState}
                    onReplySubmit={addComment}
                    onEditSubmit={saveCommentEdit}
                    onDelete={removeComment}
                    onOpenReport={handleOpenReport}
                    activeSanction={activeSanction}
                    submitting={submitting}
                    highlightedCommentId={
                      focusTarget?.type === "comment" &&
                      String(focusTarget.postId) === String(post.id)
                        ? focusTarget.id
                        : null
                    }
                  />
                ))}
              </div>
            )}

            <div className="forum-comment-composer">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={3}
                style={{ ...textareaStyle, minHeight: 110 }}
              />

              <div className="forum-comment-actions">
                <button
                  type="button"
                  className="forum-tool-btn"
                  onClick={() => setShowRootGifPicker((prev) => !prev)}
                >
                  GIF GIPHY
                </button>

                <button
                  type="button"
                  className="forum-tool-btn forum-action-btn"
                  onClick={() => addComment(null)}
                  disabled={
                    submitting ||
                    (!commentText.trim() && !commentExternalGif) ||
                    !canCommentInForum(activeSanction)
                  }
                >
                  {submitting ? "Envoi..." : "Envoyer"}
                </button>

                {(commentText.trim() || commentExternalGif) && (
                  <button
                    type="button"
                    className="forum-tool-btn forum-action-btn"
                    onClick={() => {
                      setCommentText("");
                      setCommentExternalGif(null);
                      setShowRootGifPicker(false);
                    }}
                  >
                    Annuler
                  </button>
                )}
              </div>

              <GiphyGifPicker
                open={showRootGifPicker}
                onClose={() => setShowRootGifPicker(false)}
                onSelect={(gif) => {
                  setCommentExternalGif(gif);
                  setShowRootGifPicker(false);
                }}
                anchorLabel="GIF GIPHY"
              />

              {commentExternalGif && (
                <GifPreview
                  item={commentExternalGif}
                  onRemove={() => setCommentExternalGif(null)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <ReportModal
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmit={handleSubmitReport}
      />
    </>
  );
}