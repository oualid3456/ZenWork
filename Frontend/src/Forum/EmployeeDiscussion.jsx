// EmployeeDiscussion.jsx
import { useState } from "react";
import Post from "./Post";

function EmployeeDiscussion({ mode }) {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");

  const addPost = () => {
    if (!text.trim()) return;
    setPosts([{ id: Date.now(), content: text, likes: 0, comments: [] }, ...posts]);
    setText("");
  };

  return (
    <div>
      <div className="post-box">
        <h3>Nouvelle publication ({mode})</h3>
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={addPost}>Publier</button>
      </div>

      {posts.map((p) => (
        <Post key={p.id} post={p} />
      ))}
    </div>
  );
}
export default EmployeeDiscussion