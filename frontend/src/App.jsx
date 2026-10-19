import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import User from "./pages/User.jsx";
import Library from "./pages/Library.jsx";
import Setting from "./pages/Setting.jsx";
import NotFound from "./pages/NotFound.jsx";
import EditProfile from "./pages/EditProfile.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/library" element={<Library />} />
        <Route path="/setting" element={<Setting />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/:username" element={<User />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
