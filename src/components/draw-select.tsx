"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
export function DrawSelect({
  name,
  id,
  value,
  draws,
  latest,
  submit = false,
  anchor,
}: {
  name: string;
  id: string;
  value?: string;
  draws: { id: string; label: string }[];
  latest?: string | null;
  submit?: boolean;
  anchor?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  return (
    <div className="draw-select">
      <label htmlFor={id}>Draw</label>
      <select
        id={id}
        name={name}
        value={value ?? "latest"}
        onChange={(event) => {
          if (submit) {
            event.currentTarget.form?.requestSubmit();
            return;
          }
          const query = new URLSearchParams(search.toString());
          if (event.currentTarget.value === "latest") query.delete(name);
          else query.set(name, event.currentTarget.value);
          for (const key of ["cursor", "entries_cursor", "draws_cursor"])
            query.delete(key);
          router.push(
            pathname +
              (query.size ? "?" + query.toString() : "") +
              (anchor ? "#" + anchor : ""),
            { scroll: false },
          );
        }}
      >
        <option value="latest">
          Latest
          {latest
            ? `: ${draws.find((draw) => draw.id === latest)?.label ?? "Draw " + latest}`
            : ""}
        </option>
        <option value="all">All draws</option>
        {value &&
          !["latest", "all"].includes(value) &&
          !draws.some((draw) => draw.id === value) && (
            <option value={value}>Draw {value}</option>
          )}
        {draws.map((draw) => (
          <option key={draw.id} value={draw.id}>
            {draw.label}
          </option>
        ))}
      </select>
    </div>
  );
}
