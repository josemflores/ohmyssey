import NightBackdrop from './NightBackdrop.jsx';
import './NightBackdrop.css';
import './LoginScreen.css';

// Sample gate only. Nothing is saved and nothing is checked.
// Log in and Skip both continue into the story.
export default function LoginScreen({ onEnter }) {
  function submit(event) {
    event.preventDefault();
    onEnter();
  }

  return (
    <NightBackdrop ship>
      <main className="card login-card" data-screen="login">
        <p className="eyebrow">Ω · hackUTA · a sample gate</p>
        <h1 className="login-title">
          <Torch />
          <span>OHMYSSEY</span>
          <Torch />
        </h1>
        <div className="meander-rule" aria-hidden="true" />
        <p className="login-lede">The night the wooden horse came through the gates.</p>
        <form onSubmit={submit}>
          <label>
            <span>Username</span>
            <input name="username" autoComplete="off" spellCheck="false" />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" autoComplete="off" />
          </label>
          <div className="login-actions">
            <button className="btn btn-quiet" type="submit">Log in</button>
            <button className="btn login-skip" type="button" onClick={onEnter}>Skip</button>
          </div>
          <p className="login-note">Sample gate. A name and a password are not checked.</p>
        </form>
      </main>
    </NightBackdrop>
  );
}

function Torch() {
  return (
    <svg className="torch" viewBox="0 0 28 48" aria-hidden="true">
      <path className="flame" d="M14 2 C10 10 8 14 10 20 C8 16 6 16 6 22 C6 30 14 32 14 32 C14 32 22 30 22 22 C22 16 20 16 18 20 C20 14 18 10 14 2 Z" />
      <rect x="12" y="30" width="4" height="16" rx="1" fill="#6b4224" />
    </svg>
  );
}
