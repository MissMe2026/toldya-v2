import { Link } from "@tanstack/react-router";
import logoSvg from "@/assets/toldya-logo.svg?raw";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return <span className={cn("inline-block h-7 aspect-[2860/924] shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full", className)} dangerouslySetInnerHTML={{ __html: logoSvg }} />;
}

export function Logo({ className }: { className?: string }) {
  return <Link to="/" aria-label="ToldYa home" className={cn("inline-flex shrink-0 items-center text-ink", className)}><LogoMark /></Link>;
}