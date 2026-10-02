import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container detail">
      <h1>Page not found.</h1>
      <p>Head back to find an event or game.</p>
      <Link className="button" href="/">
        Back to scores
      </Link>
    </div>
  );
}
