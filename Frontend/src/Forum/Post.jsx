import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Post({ post, user, refreshPosts }) {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    fetchLikes();
    fetchComments();
  }, [post.id]);

  async function fetchLikes() {
    const { data, error } = await supabase
      .from("forum_likes")
      .select("*")
      .eq("post_id", post.id);

    if (!error && data) {
      setLikes(data.length);
      setHasLiked(data.some((like) => like.user_id === user.id));
    }
  }

  async function fetchComments() {
    const { data, error } = await supabase
      .from("forum_comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data);
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
      user?.user_metadata?.prenom || user?.email || "Utilisateur";

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
      fetchComments();
      refreshPosts?.();
    }
  }

  return (
    <div className="post">
      <p>
        <strong>{post.author_name}</strong>
      </p>

      <p>{post.content}</p>

      <button className="like-btn" onClick={toggleLike}>
        {hasLiked ? "💙" : "👍"} {likes}
      </button>

      <div className="comment-section">
        <h4>Commentaires</h4>

        {comments.map((c) => (
          <p key={c.id}>
            • <strong>{c.author_name}</strong> : {c.content}
          </p>
        ))}

        <div className="comment-box">
          <input
            placeholder="Ajouter un commentaire..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button onClick={addComment}>Envoyer</button>
        </div>
      </div>
    </div>
  );
}