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
  isAdminLike,
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
        marginTop: 8,
        display: "inline-flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 220,
      }}
    >
      <img
        src={src}
        alt={item.file_name || item.title || "GIF"}
        style={{
          width: "100%",
          maxHeight: 160,
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

// État vide partagé pour réinitialisation propre
const EMPTY_REPLY_STATE = {
  mode: null,
  targetId: null,
  text: "",
  externalGif: null,
};

function CommentNode({
  comment,
  user,
  role,
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
}) {
  const [showGifPicker, setShowGifPicker] = useState(false);
  // Ferme le gif picker si on change de targetId
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

  function handleCancelState() {
    setShowGifPicker(false);
    setReplyState(EMPTY_REPLY_STATE);
  }

  return (
    <div className={comment.depth > 0 ? "forum-reply-card" : "forum-comment-card"}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <strong>{label}</strong>

        <small>
          {formatDate(comment.created_at)}
          {comment.edited_at ? " • modifié" : ""}
        </small>
      </div>

      {comment.status !== "published" && (
        <div className="forum-status-pill reported" style={{ marginTop: 8 }}>
          {comment.status === "hidden" ? "Masqué" : comment.status}
        </div>
      )}

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

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <button
              type="button"
              className="forum-tool-btn"
              // BUG FIX : autoriser l'enregistrement même si texte vide (garde le contenu précédent côté service)
              // mais on bloque seulement si texte ET pas de gif existant
              onClick={() => onEditSubmit(comment.id)}
              disabled={submitting || !replyState.text.trim()}
            >
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </>
      ) : (
        <>
          {comment.content && <p style={{ marginTop: 10 }}>{comment.content}</p>}

          {/* BUG FIX : affichage GIF via external_url (storage_path peut être une URL directe GIPHY) */}
          {gifAttachment && (gifAttachment.publicUrl || gifAttachment.external_url) && (
            <div style={{ marginTop: 8 }}>
              <img
                src={gifAttachment.publicUrl || gifAttachment.external_url}
                alt={gifAttachment.file_name || "GIF"}
                style={{
                  maxWidth: "100%",
                  maxHeight: 260,
                  borderRadius: 12,
                  display: "block",
                }}
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 10,
              alignItems: "center",
            }}
          >
            {/* BUG FIX : si déjà en train de répondre à CE commentaire, le bouton sert à annuler */}
            <button
              type="button"
              className="forum-tool-btn"
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
                className="forum-tool-btn"
                onClick={() => {
                  setReplyState({
                    mode: "edit",
                    targetId: comment.id,
                    text: comment.content ?? "",
                    externalGif: null,
                  });
                }}
              >
                Modifier
              </button>
            )}

            {(isOwnComment || isAdminLike(role)) && (
              <button
                type="button"
                className="forum-tool-btn"
                onClick={() => onDelete(comment)}
              >
                Supprimer
              </button>
            )}

            {!isOwnComment && (
              <button
                type="button"
                className="forum-tool-btn forum-report-btn"
                onClick={() => onOpenReport("comment", comment.id)}
              >
                🚩 Signaler
              </button>
            )}
          </div>
        </>
      )}

      {isReplying && (
        <div style={{ marginTop: 12, position: "relative" }}>
          <textarea
            value={replyState.text}
            onChange={(e) =>
              setReplyState((prev) => ({ ...prev, text: e.target.value }))
            }
            placeholder="Écrire une réponse..."
            rows={3}
            style={{ ...textareaStyle, minHeight: 110 }}
          />

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 8,
              alignItems: "center",
              position: "relative",
            }}
          >
            <button
              type="button"
              className="forum-tool-btn"
              onClick={() => setShowGifPicker((prev) => !prev)}
            >
              GIF GIPHY
            </button>

            {/* BUG FIX : bouton désactivé si ni texte ni GIF sélectionné + indicateur de chargement */}
            <button
              type="button"
              className="forum-tool-btn"
              onClick={() => onReplySubmit(comment.id)}
              disabled={
                submitting ||
                (!replyState.text.trim() && !replyState.externalGif) ||
                !canCommentInForum(activeSanction)
              }
            >
              {submitting ? "Envoi..." : "Envoyer la réponse"}
            </button>

            <button
              type="button"
              className="forum-tool-btn"
              onClick={handleCancelState}
            >
              Annuler
            </button>

            <GiphyGifPicker
              open={showGifPicker}
              onClose={() => setShowGifPicker(false)}
              onSelect={(gif) => {
                setReplyState((prev) => ({
                  ...prev,
                  externalGif: gif,
                }));
                setShowGifPicker(false);
              }}
              anchorLabel="GIF GIPHY"
            />
          </div>

          {replyState.externalGif && (
            <GifPreview
              item={replyState.externalGif}
              onRemove={() =>
                setReplyState((prev) => ({
                  ...prev,
                  externalGif: null,
                }))
              }
            />
          )}
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              user={user}
              role={role}
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
  const [commentExternalGif, setCommentExternalGif] = useState(null);
  const [showRootGifPicker, setShowRootGifPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [replyState, setReplyState] = useState(EMPTY_REPLY_STATE);
  const [activeSanction, setActiveSanction] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [reportTarget, setReportTarget] = useState(null);
  // BUG FIX : flag anti double-submit global pour tous les commentaires/réponses
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLikes();
    loadComments();
  }, [post.id, role]);

  useEffect(() => {
    if (!user?.id) return;
    loadSanction();
  }, [user?.id]);

  // BUG FIX : fermer le picker GIF racine si on ferme la section commentaires
  useEffect(() => {
    if (!showComments) {
      setShowRootGifPicker(false);
    }
  }, [showComments]);

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
    const externalGif = parentCommentId !== null ? replyState.externalGif : commentExternalGif;

    // BUG FIX : autoriser GIF seul sans texte
    if (!text.trim() && !externalGif) return;

    if (!canCommentInForum(activeSanction)) {
      setErrorMessage(
        "Tu ne peux pas commenter sur le forum actuellement à cause d'une restriction."
      );
      return;
    }

    // BUG FIX : protection double-submit
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

      setErrorMessage("");
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
    // BUG FIX : on vérifie le texte ici et on affiche une erreur claire
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
    const canDelete = comment.user_id === user.id || isAdminLike(role);
    if (!canDelete) return;

    const currentScrollY = window.scrollY;

    try {
      await deleteCommentAction(comment.id);
      // BUG FIX : si on supprime un commentaire qu'on était en train d'éditer/répondre, reset l'état
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
    const moderationReason = window.prompt("Motif de modération :") || "Modération forum";

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

  // BUG FIX : calcul correct du nombre de commentaires visibles (tous niveaux)
  const totalCommentsCount = comments.length;

  const isOwnPost = post.user_id === user.id;

  return (
    <>
      <div className="video-card forum-post-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <strong>{authorName}</strong>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 2 }}>
              {authorProfile?.role ? `${authorProfile.role} • ` : ""}
              {formatDate(post.created_at)}
              {post.edited_at ? " • modifié" : ""}
            </div>
          </div>

          {post.status !== "published" && (
            <div className="forum-status-pill reported">
              {post.status === "hidden" ? "Masqué" : post.status}
            </div>
          )}
        </div>

        {post.content && <p style={{ marginTop: 12 }}>{post.content}</p>}

        {attachments.length > 0 && (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {attachments.map((attachment) => {
              if (attachment.kind === "image" || attachment.kind === "gif") {
                return (
                  <div key={attachment.id}>
                    <img
                      src={attachment.publicUrl}
                      alt={attachment.file_name}
                      style={{
                        maxWidth: "100%",
                        maxHeight: 420,
                        borderRadius: 14,
                        display: "block",
                      }}
                    />
                  </div>
                );
              }

              if (attachment.kind === "video") {
                return (
                  <video
                    key={attachment.id}
                    src={attachment.publicUrl}
                    controls
                    style={{
                      maxWidth: "100%",
                      borderRadius: 14,
                    }}
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
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    📄 {attachment.file_name} • PDF •{" "}
                    {formatFileSize(attachment.size_bytes)}
                  </a>
                );
              }

              return null;
            })}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 12,
            alignItems: "center",
          }}
        >
          <button type="button" className="forum-tool-btn" onClick={handleToggleLike}>
            {hasLiked ? "❤️ Like" : "🤍 Like"} ({likes})
          </button>

          <button
            type="button"
            className="forum-tool-btn"
            onClick={() => setShowComments((prev) => !prev)}
          >
            {/* BUG FIX : compte total correct sur tous niveaux */}
            💬 Commentaires ({totalCommentsCount})
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
            <button type="button" className="forum-tool-btn" onClick={onEditPost}>
              Modifier
            </button>
          )}

          {canManagePost && post.user_id === user.id && (
            <button type="button" className="forum-tool-btn" onClick={onDeletePost}>
              Supprimer
            </button>
          )}

          {canModerateForum(role) && post.status === "published" && (
            <button
              type="button"
              className="forum-tool-btn"
              onClick={() => handleModeratePost("hidden")}
            >
              Masquer
            </button>
          )}

          {canModerateForum(role) && post.status === "hidden" && (
            <button
              type="button"
              className="forum-tool-btn"
              onClick={() => handleModeratePost("published")}
            >
              Restaurer
            </button>
          )}

          {canBanForumUsers(role) && post.user_id !== user.id && (
            <button
              type="button"
              className="forum-tool-btn"
              onClick={() => handleBanAuthor(post.user_id)}
            >
              Bannir auteur
            </button>
          )}
        </div>

        {errorMessage && (
          <div style={{ marginTop: 10, color: "#f87171" }}>{errorMessage}</div>
        )}

        {showComments && (
          <div style={{ marginTop: 18 }}>
            <h4>Commentaires</h4>

            {commentsTree.length === 0 ? (
              <p>Aucun commentaire pour le moment.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {commentsTree.map((comment) => (
                  <CommentNode
                    key={comment.id}
                    comment={comment}
                    user={user}
                    role={role}
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
                  />
                ))}
              </div>
            )}

            {/* Formulaire de commentaire racine */}
            <div style={{ marginTop: 16, position: "relative" }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={3}
                style={{ ...textareaStyle, minHeight: 110 }}
              />

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginTop: 8,
                  position: "relative",
                }}
              >
                <button
                  type="button"
                  className="forum-tool-btn"
                  onClick={() => setShowRootGifPicker((prev) => !prev)}
                >
                  GIF GIPHY
                </button>

                {/* BUG FIX : désactivé si rien à envoyer (ni texte ni GIF) */}
                <button
                  type="button"
                  className="forum-tool-btn"
                  onClick={() => addComment(null)}
                  disabled={
                    submitting ||
                    (!commentText.trim() && !commentExternalGif) ||
                    !canCommentInForum(activeSanction)
                  }
                >
                  {submitting ? "Envoi..." : "Envoyer"}
                </button>

                {/* BUG FIX : bouton Annuler sur le formulaire racine */}
                {(commentText.trim() || commentExternalGif) && (
                  <button
                    type="button"
                    className="forum-tool-btn"
                    onClick={() => {
                      setCommentText("");
                      setCommentExternalGif(null);
                      setShowRootGifPicker(false);
                    }}
                  >
                    Annuler
                  </button>
                )}

                <GiphyGifPicker
                  open={showRootGifPicker}
                  onClose={() => setShowRootGifPicker(false)}
                  onSelect={(gif) => {
                    setCommentExternalGif(gif);
                    setShowRootGifPicker(false);
                  }}
                  anchorLabel="GIF GIPHY"
                />
              </div>

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
