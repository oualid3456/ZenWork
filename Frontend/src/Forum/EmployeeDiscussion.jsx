import { useEffect, useMemo, useState } from "react";
import {
  createPost,
  deletePost as deletePostAction,
  fetchPostsByMode,
  fetchProfilesByIds,
  updatePost as updatePostAction,
} from "./forumService";
import Post from "./Post";
import { getUserDisplayName, isAdminLike, normalizeRole } from "./forumUtils";

function EmployeeDiscussion({ mode, user, role }) {
  const [posts, setPosts] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const normalizedRole = useMemo(() => normalizeRole(role), [role]);

  useEffect(() => {
    loadPosts();
  }, [mode]);

  async function loadPosts() {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await fetchPostsByMode(mode);
      setPosts(data);

      const userIds = [...new Set(data.map((post) => post.user_id).filter(Boolean))];
      const profiles = await fetchProfilesByIds(userIds);

      const map = {};
      profiles.forEach((profile) => {
        map[profile.id] = profile;
      });

      setProfilesMap(map);
    } catch (error) {
      console.error("Erreur chargement posts :", error.message);
      setErrorMessage("Impossible de charger les publications.");
      setPosts([]);
      setProfilesMap({});
    } finally {
      setLoading(false);
    }
  }

  async function addPost() {
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    setErrorMessage("");

    const authorProfile = profilesMap[user.id] || null;
    const authorName = getUserDisplayName(user, authorProfile);

    try {
      const newPost = await createPost({
        userId: user.id,
        authorName,
        content: text.trim(),
        mode,
      });

      // ajout immédiat dans l'interface
      setPosts((prev) => [newPost, ...prev]);
      setText("");

      // recharge proprement ensuite pour synchroniser avec la base
      await loadPosts();
    } catch (error) {
      console.error("Erreur ajout post :", error.message);
      setErrorMessage(
        "La publication a échoué. Vérifie les policies Supabase / RLS."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startEditPost(post) {
    if (post.user_id !== user.id) return;
    setEditingPostId(post.id);
    setEditingText(post.content || "");
  }

  function cancelEditPost() {
    setEditingPostId(null);
    setEditingText("");
  }

  async function saveEditPost(postId) {
    if (!editingText.trim()) return;

    try {
      await updatePostAction({
        postId,
        userId: user.id,
        content: editingText.trim(),
      });

      cancelEditPost();
      loadPosts();
    } catch (error) {
      console.error("Erreur modification post :", error.message);
      setErrorMessage("Impossible de modifier la publication.");
    }
  }

  async function removePost(post) {
    const canDelete = post.user_id === user.id || isAdminLike(normalizedRole);
    if (!canDelete) return;

    try {
      await deletePostAction(post.id);
      loadPosts();
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
    <div>
      <div className="video-body" style={{ marginBottom: 20 }}>
        <h3>{sectionTitle}</h3>
        <p>
          Partage une information ou consulte les dernières publications de
          l’équipe.
        </p>
      </div>

      <div className="search-box" style={{ width: "100%", marginBottom: 16 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écris ton message..."
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

      <button
        type="button"
        className="start-btn"
        onClick={addPost}
        disabled={submitting}
        style={{ width: "180px", marginBottom: 20 }}
      >
        {submitting ? "Publication..." : "Publier"}
      </button>

      {errorMessage && (
        <p style={{ color: "#E53E3E", marginBottom: 16 }}>{errorMessage}</p>
      )}

      {loading ? (
        <p>Chargement...</p>
      ) : posts.length === 0 ? (
        <p>Aucune publication pour le moment.</p>
      ) : (
        <div className="video-grid" style={{ gridTemplateColumns: "1fr" }}>
          {posts.map((post) => {
            const authorProfile = profilesMap[post.user_id] || null;
            const canManage =
              post.user_id === user.id || isAdminLike(normalizedRole);

            if (editingPostId === post.id) {
              return (
                <div key={post.id} className="video-card">
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

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      className="start-btn"
                      style={{ width: "160px" }}
                      onClick={() => saveEditPost(post.id)}
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      className="start-btn"
                      style={{ width: "160px" }}
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

export default EmployeeDiscussion;