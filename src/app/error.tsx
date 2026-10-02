"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container detail">
      <h1>That view couldn’t load.</h1>
      <p>Please try again.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
