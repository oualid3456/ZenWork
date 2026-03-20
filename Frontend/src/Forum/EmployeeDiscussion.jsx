import { useEffect, useMemo, useState } from "react";
import {
  createPost,
  deletePost,
  fetchPostsByMode,
  fetchProfilesByIds,
  updatePost,
} from "./forumService";
import Post from "./Post";
import {
  formatDate,
  getUserDisplayName,
  isAdminLike,
  normalizeRole,
} from "./forumUtils";

function EmployeeDiscussion({ mode, user, role }) {
  const [posts, setPosts] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const normalizedRole = useMemo(() => normalizeRole(role), [role]);

  useEffect(() => {
    fetchPosts();
  }, [mode]);

  async function fetchPosts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("forum_posts")
      .select("*")
      .eq("mode", mode)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement posts :", error.message);
      setPosts([]);
      setProfilesMap({});
      setLoading(false);
      return;
    }

    const safePosts = data || [];
    setPosts(safePosts);

    const userIds = [...new Set(safePosts.map((post) => post.user_id).filter(Boolean))];

    if (userIds.length === 0) {
      setProfilesMap({});
      setLoading(false);
      return;
    }

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, nom, prenom, role, email, avatar_url")
      .in("id", userIds);

    const map = {};
    (profilesData || []).forEach((profile) => {
      map[profile.id] = profile;
    });

    setProfilesMap(map);
    setLoading(false);
  }

  async function addPost() {
    if (!text.trim()) return;

    const authorProfile = profilesMap[user.id] || null;
    const authorName = getUserDisplayName(user, authorProfile);

    const { error } = await supabase.from("forum_posts").insert([
      {
        user_id: user.id,
        author_name: authorName,
        content: text.trim(),
        mode,
      },
    ]);

    if (error) {
      console.error("Erreur ajout post :", error.message);
      return;
    }

    setText("");
    fetchPosts();
  }

  async function deletePost(post) {
    const canDelete =
      post.user_id === user.id || isAdminLike(normalizedRole);

    if (!canDelete) return;

    const { error } = await supabase
      .from("forum_posts")
      .delete()
      .eq("id", post.id);

    if (error) {
      console.error("Erreur suppression post :", error.message);
      return;
    }

    fetchPosts();
  }

  function startEditPost(post) {
    const canEdit = post.user_id === user.id;
    if (!canEdit) return;

    setEditingPostId(post.id);
    setEditingText(post.content || "");
  }

  async function saveEditPost(postId) {
    if (!editingText.trim()) return;

    const { error } = await supabase
      .from("forum_posts")
      .update({ content: editingText.trim() })
      .eq("id", postId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur modification post :", error.message);
      return;
    }

    setEditingPostId(null);
    setEditingText("");
    fetchPosts();
  }

  function cancelEditPost() {
    setEditingPostId(null);
    setEditingText("");
  }

  const sectionTitle =
    mode === "feed"
      ? "Fil d’actualité interne"
      : mode === "employees"
      ? "Discussion entre employés"
      : "Espace sécurisé";

  return (
    <section className="forum-card">
      <h3>{sectionTitle}</h3>

      <div className="post-composer">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écris ton message..."
        />
        <button onClick={addPost}>Publier</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : posts.length === 0 ? (
        <p>Aucune publication pour le moment.</p>
      ) : (
        posts.map((post) => {
          const authorProfile = profilesMap[post.user_id] || null;
          const canManage =
            post.user_id === user.id || isAdminLike(normalizedRole);

          return (
            <div key={post.id} className="forum-post-wrapper">
              {editingPostId === post.id ? (
                <div className="forum-card">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                  <div className="inline-actions">
                    <button onClick={() => saveEditPost(post.id)}>
                      Enregistrer
                    </button>
                    <button onClick={cancelEditPost}>Annuler</button>
                  </div>
                </div>
              ) : (
                <Post
                  post={post}
                  user={user}
                  role={normalizedRole}
                  authorProfile={authorProfile}
                  refreshPosts={fetchPosts}
                  onEditPost={() => startEditPost(post)}
                  onDeletePost={() => deletePost(post)}
                  canManagePost={canManage}
                />
              )}
            </div>
          );
        })
      )}
    </section>
  );
}

export default EmployeeDiscussion;
