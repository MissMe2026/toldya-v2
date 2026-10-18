import { Link } from "@tanstack/react-router";

export function Logo() {
  return <Link to="/" aria-label="ToldYa home" className="inline-flex items-start font-display text-[28px] font-black leading-none text-ink">ToldYa<span className="ml-0.5 mt-0.5 text-[10px] font-semibold">®</span></Link>;
}