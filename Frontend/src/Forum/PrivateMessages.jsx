import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { formatDate } from "./forumUtils";

export default function PrivateMessages({ user, preselectedUser = null }) {
  const [members, setMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(preselectedUser);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    async function fetchMembers() {
      setLoadingMembers(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, nom, prenom, role, email")
        .neq("id", user.id)
        .order("prenom", { ascending: true });

      setMembers(data || []);
      setLoadingMembers(false);
    }

    fetchMembers();
  }, [user?.id]);

  useEffect(() => {
    if (preselectedUser?.id) {
      setSelectedUser(preselectedUser);
    }
  }, [preselectedUser]);

  useEffect(() => {
    if (!user?.id || !selectedUser?.id) {
      setMessages([]);
      return;
    }

    async function fetchMessages() {
      setLoadingMessages(true);

      const { data, error } = await supabase
        .from("forum_private_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erreur chargement messages :", error.message);
        setMessages([]);
      } else {
        setMessages(data || []);
      }

      setLoadingMessages(false);
    }

    fetchMessages();
  }, [user?.id, selectedUser?.id]);

  async function sendMessage() {
    if (!text.trim() || !selectedUser?.id) return;

    const payload = {
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: text.trim(),
    };

    const { error } = await supabase
      .from("forum_private_messages")
      .insert([payload]);

    if (error) {
      console.error("Erreur envoi message :", error.message);
      return;
    }

    setText("");

    const { data } = await supabase
      .from("forum_private_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    setMessages(data || []);
  }

  const selectedUserLabel = useMemo(() => {
    if (!selectedUser) return "Aucune conversation sélectionnée";
      return (
          [selectedUser.prenom, selectedUser.nom].filter(Boolean).join(" ") ||
          "Utilisateur"
      );
  }, [selectedUser]);

  return (
    <div className="private-messages-layout">
      <section className="forum-card private-messages-users">
        <h3>Messagerie privée</h3>

        {loadingMembers ? (
          <p>Chargement des contacts...</p>
        ) : members.length === 0 ? (
          <p>Aucun contact disponible.</p>
        ) : (
          <ul className="forum-member-list">
            {members.map((member) => {
                const label =
                    [member.prenom, member.nom].filter(Boolean).join(" ") ||
                    "Utilisateur";

              const active = selectedUser?.id === member.id;

              return (
                <li key={member.id} className="forum-member-item">
                  <button
                    className={active ? "active-contact" : ""}
                    onClick={() => setSelectedUser(member)}
                  >
                    {label} {member.role ? `(${member.role})` : ""}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="forum-card private-messages-thread">
        <h3>{selectedUserLabel}</h3>

        {!selectedUser ? (
          <p>Sélectionne un collaborateur pour démarrer une conversation.</p>
        ) : loadingMessages ? (
          <p>Chargement de la conversation...</p>
        ) : (
          <>
            <div className="private-message-list">
              {messages.length === 0 ? (
                <p>Aucun message pour le moment.</p>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_id === user.id;
                  return (
                    <div
                      key={message.id}
                      className={`private-message ${isMine ? "mine" : "theirs"}`}
                    >
                      <p>{message.content}</p>
                      <small>{formatDate(message.created_at)}</small>
                    </div>
                  );
                })
              )}
            </div>

            <div className="private-message-composer">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Écrire un message privé..."
              />
              <button onClick={sendMessage}>Envoyer</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}