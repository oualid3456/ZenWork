import { useEffect, useMemo, useState } from "react";
import {
  createPost,
  deletePost as deletePostAction,
  fetchActiveForumSanction,
  fetchAttachmentsByTargets,
  fetchPostsByMode,
  fetchProfilesByIds,
  updatePost as updatePostAction,
} from "./forumService";
import Post from "./Post";
import {
  canModerateForum,
  canPostInForum,
  formatFileSize,
  getUserDisplayName,
  getAttachmentKind,
  isAdminLike,
  isAllowedPostAttachment,
  isAttachmentSizeAllowed,
  normalizeRole,
} from "./forumUtils";

export default function EmployeeDiscussion({ mode, user, role }) {
  const [posts, setPosts] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [attachmentsMap, setAttachmentsMap] = useState({});
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [activeSanction, setActiveSanction] = useState(null);

  const normalizedRole = useMemo(() => normalizeRole(role), [role]);
  const isModerator = useMemo(
    () => canModerateForum(normalizedRole),
    [normalizedRole]
  );

  useEffect(() => {
    loadPosts();
  }, [mode]);

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

  async function loadPosts() {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await fetchPostsByMode(mode);

      const visiblePosts = isModerator
        ? data
        : data.filter((post) => post.status === "published");

      setPosts(visiblePosts);

      const userIds = [...new Set(visiblePosts.map((post) => post.user_id).filter(Boolean))];
      const profiles = await fetchProfilesByIds(userIds);

      const profilesById = {};
      profiles.forEach((profile) => {
        profilesById[profile.id] = profile;
      });
      setProfilesMap(profilesById);

      let attachmentMap = {};
      try {
        attachmentMap = await fetchAttachmentsByTargets(
          "post",
          visiblePosts.map((post) => post.id)
        );
      } catch (error) {
        console.warn("Erreur chargement attachments forum :", error.message);
      }
      setAttachmentsMap(attachmentMap);
    } catch (error) {
      console.error("Erreur chargement posts :", error.message);
      setErrorMessage("Impossible de charger les publications.");
      setPosts([]);
      setProfilesMap({});
      setAttachmentsMap({});
    } finally {
      setLoading(false);
    }
  }

  function handleFilesChange(event) {
    const selected = Array.from(event.target.files || []);
    const next = [];

    if (selected.length > 4) {
      setErrorMessage("Tu peux ajouter au maximum 4 fichiers par publication.");
      return;
    }

    for (const file of selected) {
      if (!isAllowedPostAttachment(file.type)) {
        setErrorMessage(`Type non autorisé : ${file.name}`);
        return;
      }
      if (!isAttachmentSizeAllowed(file)) {
        setErrorMessage(`Fichier trop volumineux : ${file.name}`);
        return;
      }
      next.push(file);
    }

    setErrorMessage("");
    setFiles(next);
  }

  async function addPost() {
    if ((!text.trim() && files.length === 0) || submitting) return;

    if (!canPostInForum(activeSanction)) {
      setErrorMessage(
        "Tu ne peux pas publier sur le forum actuellement à cause d’une restriction."
      );
      return;
    }

    // ✅ mémorise la position actuelle avant publication
    const currentScrollY = window.scrollY;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const authorProfile = profilesMap[user.id] ?? null;
      const authorName = getUserDisplayName(user, authorProfile);

      await createPost({
        userId: user.id,
        authorName,
        content: text.trim(),
        mode,
        attachments: files,
      });

      setText("");
      setFiles([]);

      await loadPosts();

      // ✅ restaure la position du scroll après rerender
      requestAnimationFrame(() => {
        window.scrollTo({ top: currentScrollY });
      });
    } catch (error) {
      console.error("Erreur ajout post :", error.message);
      setErrorMessage(
        "La publication a échoué. Vérifie les policies Supabase / Storage / RLS."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startEditPost(post) {
    if (post.user_id !== user.id) return;
    setEditingPostId(post.id);
    setEditingText(post.content ?? "");
  }

  function cancelEditPost() {
    setEditingPostId(null);
    setEditingText("");
  }

  async function saveEditPost(postId) {
    if (!editingText.trim()) return;

    // ✅ mémorise la position avant rechargement
    const currentScrollY = window.scrollY;

    try {
      await updatePostAction({
        postId,
        userId: user.id,
        content: editingText.trim(),
      });

      cancelEditPost();
      await loadPosts();

      // ✅ restaure la position après rerender
      requestAnimationFrame(() => {
        window.scrollTo({ top: currentScrollY });
      });
    } catch (error) {
      console.error("Erreur modification post :", error.message);
      setErrorMessage("Impossible de modifier la publication.");
    }
  }

  async function removePost(post) {
    const canDelete = post.user_id === user.id || isAdminLike(normalizedRole);
    if (!canDelete) return;

    // ✅ mémorise la position avant rechargement
    const currentScrollY = window.scrollY;

    try {
      await deletePostAction(post.id);
      await loadPosts();

      // ✅ restaure la position après rerender
      requestAnimationFrame(() => {
        window.scrollTo({ top: currentScrollY });
      });
    } catch (error) {
      console.error("Erreur suppression post :", error.message);
      setErrorMessage("Impossible de supprimer la publication.");
    }
  }

  const sectionTitle =
    mode === "feed"
      ? "Fil d’actualité interne"
      : mode === "employees"
      ? "Discussion entre employés"
      : "Espace sécurisé";

  return (
    <div className="forum-feed">
      <div className="forum-composer video-card">
        <div className="forum-composer-header">
          <h3>{sectionTitle}</h3>
          <p>
            Publie un message, un GIF, une image, une vidéo ou un PDF selon les
            règles du forum.
          </p>
        </div>

        {activeSanction && !canPostInForum(activeSanction) && (
          <div className="forum-status-pill reported" style={{ width: "fit-content" }}>
            Restriction active : {activeSanction.type}
          </div>
        )}

        <div className="forum-composer-box search-box" style={{ width: "100%" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écris ton message..."
            rows={5}
          />
        </div>

        <div className="forum-composer-toolbar">
          <label className="forum-tool-btn" htmlFor={`forum-post-files-${mode}`}>
            📎 Ajouter des fichiers
          </label>
          <input
            id={`forum-post-files-${mode}`}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf"
            onChange={handleFilesChange}
            style={{ display: "none" }}
          />
          <span className="forum-attachment-meta">
            Max 4 fichiers : image, GIF, vidéo MP4/WebM, PDF
          </span>
        </div>

        {files.length > 0 && (
          <div className="forum-attachments-preview">
            {files.map((file) => {
              const kind = getAttachmentKind(file.type);
              return (
                <div key={`${file.name}-${file.size}`} className="forum-attachment-chip">
                  <span className="forum-attachment-name">{file.name}</span>
                  <span className="forum-attachment-meta">
                    {kind?.toUpperCase()} • {formatFileSize(file.size)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="forum-composer-actions">
          <button
            type="button"
            className="start-btn forum-publish-btn"
            onClick={addPost}
            disabled={submitting}
          >
            {submitting ? "Publication..." : "Publier"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="video-card">
          <p style={{ color: "#E53E3E", margin: 0 }}>{errorMessage}</p>
        </div>
      )}

      {loading ? (
        <div className="video-card">
          <p style={{ margin: 0 }}>Chargement...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="video-card">
          <p style={{ margin: 0 }}>Aucune publication pour le moment.</p>
        </div>
      ) : (
        <div className="video-grid" style={{ gridTemplateColumns: "1fr" }}>
          {posts.map((post) => {
            const authorProfile = profilesMap[post.user_id] ?? null;
            const canManage = post.user_id === user.id || isAdminLike(normalizedRole);

            if (editingPostId === post.id) {
              return (
                <div key={post.id} className="video-card forum-post-card">
                  <div className="search-box" style={{ width: "100%", marginBottom: 16 }}>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={4}
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

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="start-btn forum-admin-btn"
                      onClick={() => saveEditPost(post.id)}
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      className="start-btn forum-admin-btn"
                      onClick={cancelEditPost}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <Post
                key={post.id}
                post={post}
                user={user}
                role={normalizedRole}
                authorProfile={authorProfile}
                attachments={attachmentsMap[String(post.id)] ?? []}
                refreshPosts={loadPosts}
                onEditPost={() => startEditPost(post)}
                onDeletePost={() => removePost(post)}
                canManagePost={canManage}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}