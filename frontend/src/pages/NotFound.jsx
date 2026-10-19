import { ArrowLeft, ArrowRight, Feather, House } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="not-found">
      <nav className="not-found__nav">
        <button
          className="not-found__brand"
          onClick={() => navigate("/")}
          aria-label="VerseHub home"
        >
          <span className="not-found__logo">
            <Feather size={21} strokeWidth={2} />
          </span>
          <span>VerseHub</span>
        </button>

        <span className="not-found__nav-label">
          Write. Read. Share.
        </span>
      </nav>

      <section className="not-found__content">
        <div className="not-found__art" aria-hidden="true">
          <div className="not-found__orbit not-found__orbit--one" />
          <div className="not-found__orbit not-found__orbit--two" />

          <span className="not-found__spark not-found__spark--one">
            ✳
          </span>
          <span className="not-found__spark not-found__spark--two">
            ✦
          </span>
          <span className="not-found__spark not-found__spark--three">
            ·
          </span>

          <div className="not-found__paper">
            <div className="not-found__paper-icon">
              <Feather size={27} strokeWidth={1.5} />
            </div>

            <div className="not-found__paper-line not-found__paper-line--long" />
            <div className="not-found__paper-line not-found__paper-line--short" />
            <div className="not-found__paper-line not-found__paper-line--medium" />

            <div className="not-found__paper-line not-found__paper-line--last" />

            <span className="not-found__paper-mark">?</span>
          </div>

          <span className="not-found__number">404</span>
        </div>

        <div className="not-found__message">
          <span className="not-found__eyebrow">
            A little plot twist
          </span>

          <h1>
            Looks like this
            <br />
            <span>page got lost in poetry.</span>
          </h1>

          <p>
            Even the best writers lose their words sometimes.
            The page you’re looking for may have wandered
            off or never existed.
          </p>

          <div className="not-found__actions">
            <button
              className="not-found__button not-found__button--primary"
              onClick={() => navigate("/")}
            >
              <House size={17} />
              Back to home
              <ArrowRight size={17} />
            </button>

            <button
              className="not-found__button not-found__button--secondary"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={17} />
              Go back
            </button>
          </div>

          <div className="not-found__footer-note">
            <span className="not-found__footer-icon">
              <Feather size={15} />
            </span>
            <span>
              Every great story finds its way.
            </span>
          </div>
        </div>
      </section>

      <footer className="not-found__footer">
        <span>© {new Date().getFullYear()} VerseHub</span>
        <span>Made for the love of words.</span>
      </footer>
    </main>
  );
}
