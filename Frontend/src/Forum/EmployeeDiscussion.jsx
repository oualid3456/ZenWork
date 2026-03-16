import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Post from "./Post";

function EmployeeDiscussion({ mode, user }) {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

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
    } else {
      setPosts(data || []);
    }

    setLoading(false);
  }

  async function addPost() {
    if (!text.trim()) return;

    const authorName =
      user?.user_metadata?.prenom || user?.email || "Utilisateur";

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

  return (
    <div>
      <div className="post-box">
        <h3>Nouvelle publication ({mode})</h3>

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
        posts.map((p) => (
          <Post key={p.id} post={p} user={user} refreshPosts={fetchPosts} />
        ))
      )}
    </div>
  );
}

export default EmployeeDiscussion;
