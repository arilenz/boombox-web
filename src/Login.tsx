import { useState } from "react";

type Props = {
  onLogin: (token: string, name: string) => void;
};

export const Login = (props: Props) => {
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;
    const name = (formData.get("name") as string)?.trim();

    const endpoint = isSignup ? "/api/signup" : "/api/login";
    const body = isSignup ? { email, password, name } : { email, password };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    props.onLogin(data.token, data.name);
  };

  return (
    <div className="app">
      <h1>Sound Chat</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        {isSignup && (
          <input type="text" name="name" placeholder="Display name" required />
        )}
        <input type="email" name="email" placeholder="Email" required autoFocus />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">{isSignup ? "Sign up" : "Log in"}</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p className="toggle-auth">
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <button className="link-button" onClick={() => { setIsSignup(!isSignup); setError(null); }}>
          {isSignup ? "Log in" : "Sign up"}
        </button>
      </p>
    </div>
  );
};
