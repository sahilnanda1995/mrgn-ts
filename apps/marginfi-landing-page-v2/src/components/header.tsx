import Link from "next/link";

import { IconChevronDown } from "@tabler/icons-react";

import { Logo } from "~/components/ui/logo";
import { Button } from "~/components/ui/button";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 z-20 w-screen flex items-center gap-8 p-4 pr-28">
      <Logo size={36} wordmark={true} />

      <nav className="ml-auto">
        <ul className="flex items-center gap-12">
          <li>Products</li>
          <li>
            <Link href="">Ecosystem</Link>
          </li>
          <li>
            <Button variant="chartreuse">
              Launch App <IconChevronDown size={18} className="ml-1 -mr-1" />
            </Button>
          </li>
        </ul>
      </nav>

      <button className="w-[72px] h-[72px] flex items-center justify-center absolute top-0 right-0 bg-secondary">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4.79999 7.60001H27.2M4.79999 16H27.2M17.4 24.4H27.2"
            stroke="white"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </header>
  );
};
