import { supabase } from "../supabaseClient";

export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export async function fetchCurrentUserRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return normalizeRole(data?.role);
}

export async function fetchProfileById(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nom, prenom, role")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMembersExcept(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nom, prenom, role")
    .neq("id", userId)
    .order("prenom", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchProfilesByIds(ids = []) {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nom, prenom, role")
    .in("id", ids);

  if (error) throw error;
  return data || [];
}

export async function fetchPostsByMode(mode) {
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*")
    .eq("mode", mode)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createPost({ userId, authorName, content, mode }) {
  const { data, error } = await supabase
    .from("forum_posts")
    .insert([
      {
        user_id: userId,
        author_name: authorName,
        content,
        mode,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePost({ postId, userId, content }) {
  const { data, error } = await supabase
    .from("forum_posts")
    .update({ content })
    .eq("id", postId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(postId) {
  const { error } = await supabase
    .from("forum_posts")
    .delete()
    .eq("id", postId);

  if (error) throw error;
  return true;
}

export async function fetchLikes(postId) {
  const { data, error } = await supabase
    .from("forum_likes")
    .select("*")
    .eq("post_id", postId);

  if (error) throw error;
  return data || [];
}

export async function toggleLike({ postId, userId, hasLiked }) {
  if (hasLiked) {
    const { error } = await supabase
      .from("forum_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) throw error;
    return { liked: false };
  }

  const { error } = await supabase
    .from("forum_likes")
    .insert([{ post_id: postId, user_id: userId }]);

  if (error) throw error;
  return { liked: true };
}

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from("forum_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createComment({
  postId,
  userId,
  authorName,
  content,
}) {
  const { data, error } = await supabase
    .from("forum_comments")
    .insert([
      {
        post_id: postId,
        user_id: userId,
        author_name: authorName,
        content,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateComment({ commentId, userId, content }) {
  const { data, error } = await supabase
    .from("forum_comments")
    .update({ content })
    .eq("id", commentId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId) {
  const { error } = await supabase
    .from("forum_comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
  return true;
}

export async function fetchPrivateMessages(userId, otherUserId) {
  const { data, error } = await supabase
    .from("forum_private_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendPrivateMessage({
  senderId,
  receiverId,
  content,
}) {
  const { data, error } = await supabase
    .from("forum_private_messages")
    .insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        content,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}