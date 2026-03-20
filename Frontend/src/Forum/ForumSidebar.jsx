import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { formatDate, normalizeRole } from "./forumUtils";

export default function ForumSidebar({ user, onOpenMessages }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    async function loadSidebarData() {
      setLoading(true);

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("id, nom, prenom, role, email, avatar_url, created_at")
        .eq("id", user.id)
        .single();

      const { data: membersData } = await supabase
        .from("profiles")
        .select("id, nom, prenom, role, email, avatar_url")
        .neq("id", user.id)
        .order("prenom", { ascending: true });

      setProfile(currentProfile || null);
      setMembers(membersData || []);
      setLoading(false);
    }

    loadSidebarData();
  }, [user?.id]);

  if (loading) {
    return (
      <aside className="forum-sidebar">
        <h3>Mon compte</h3>
        <p>Chargement...</p>
      </aside>
    );
  }

  const fullName =
    [profile?.prenom, profile?.nom].filter(Boolean).join(" ") ||
    user?.email ||
    "Utilisateur";

  return (
    <aside className="forum-sidebar">
      <section className="forum-card">
        <h3>Mon compte</h3>

        <div className="forum-profile-summary">
          <div className="forum-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={fullName} />
            ) : (
              <span>{fullName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div>
            <p><strong>{fullName}</strong></p>
            <p>{profile?.email || user?.email}</p>
            <p>Rôle : {profile?.role || "Non défini"}</p>
            {profile?.created_at && (
              <p>Compte créé le {formatDate(profile.created_at)}</p>
            )}
          </div>
        </div>

        <div className="forum-sidebar-actions">
          <button onClick={() => navigate(`/profile/${user.id}`)}>
            Voir mon profil
          </button>
        </div>
      </section>

      <section className="forum-card">
        <h3>Annuaire interne</h3>

        {members.length === 0 ? (
          <p>Aucun autre membre trouvé.</p>
        ) : (
          <ul className="forum-member-list">
            {members.map((member) => {
              const memberName =
                [member.prenom, member.nom].filter(Boolean).join(" ") ||
                member.email ||
                "Utilisateur";

              return (
                <li key={member.id} className="forum-member-item">
                  <div>
                    <strong>{memberName}</strong>
                    <p>{member.role || "Sans rôle"}</p>
                  </div>

                  <div className="forum-member-actions">
                    <button onClick={() => navigate(`/profile/${member.id}`)}>
                      Profil
                    </button>
                    <button onClick={() => onOpenMessages?.(member)}>
                      Message
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}