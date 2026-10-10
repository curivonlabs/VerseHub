import { useAuth } from "./context/useAuth.jsx";

const Profile = () => {
  const {
    user,
    isAuthenticated,
    loading,
    logout
  } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return <p>Please log in.</p>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>@{user.username}</p>
      <p>{user.email}</p>

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default Profile;