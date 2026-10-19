import { Settings, Grid3x3, SquareUserRound } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import '../styles/Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  return (
    <>
      <div className="top">
        <div className="header">
          <h2>Profile</h2>
          <button
            onClick={() => navigate("/setting")}
          >
            <Settings size={20}/>
          </button>
        </div>
        
        <div className="infoDiv">
          <div>
            <div className="profileDiv"></div>
          </div>
          <div className="userInfo">
            <h3 className="name">Meshack Oyugi</h3>
            <p className="username">@meshack_oyugi</p>
            <div className="bio">
              Better words<br />
              A brighter tomorrow.
            </div>
          </div>
        </div>
        
        <div className="stats">
          <div>
            <h5>12</h5>
            <p>Posts</p>
          </div>
          <div>
            <h5>248</h5>
            <p>Followers</p>
          </div>
          <div>
            <h5>132</h5>
            <p>Following</p>
          </div>
        </div>
        
        <Button
          text="Edit Profile"
          variant="secondary"
          size="md"
          width="320px"
          height="30px"
          opacity={1}
          textOpacity={1}
          onClick={() => navigate("/profile/edit")}
          className="btn"
        />
      </div>

      <div className="bottom"></div>
    </>
  );
}
