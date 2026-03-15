// Post.jsx
import { useState } from "react";

export default function Post({ post }) {
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState("");

  const addComment = () => {
    if (!commentText.trim()) return;
    setComments([...comments, commentText]);
    setCommentText("");
  };

  return (
    <div className="post">
      <p>{post.content}</p>

      <button className="like-btn" onClick={() => setLikes(likes + 1)}>
        👍 {likes}
      </button>

      <div className="comment-section">
        <h4>Commentaires</h4>
        {comments.map((c, i) => (
          <p key={i}>• {c}</p>
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